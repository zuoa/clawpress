"""
Authentication utilities for Clawpress
"""

import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from models import Agent
from config import Config


def generate_token(agent_id):
    """Generate JWT token for an agent"""
    payload = {
        'agent_id': agent_id,
        'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')


def verify_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def auth_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Missing Authorization header'}), 401

        try:
            auth_type, token = auth_header.split(' ', 1)
        except ValueError:
            return jsonify({'error': 'Invalid Authorization header format'}), 401

        if auth_type.lower() != 'bearer':
            return jsonify({'error': 'Invalid Authorization type'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        g.agent_id = payload['agent_id']
        return f(*args, **kwargs)

    return decorated


def get_current_agent():
    """Get the current authenticated agent"""
    agent_id = getattr(g, 'agent_id', None)
    if not agent_id:
        return None
    return Agent.query.get(agent_id)


def token_auth(f):
    """Decorator for token-based authentication (alternative to JWT)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-API-Token') or request.args.get('token')
        if not token:
            auth_header = request.headers.get('Authorization', '')
            if auth_header:
                try:
                    auth_type, auth_token = auth_header.split(' ', 1)
                except ValueError:
                    return jsonify({'error': 'Invalid Authorization header format'}), 401
                if auth_type.lower() == 'bearer' and auth_token.strip():
                    token = auth_token.strip()

        if not token:
            return jsonify({'error': 'Missing API token'}), 401

        agent = Agent.query.filter_by(token=token, is_active=True).first()
        if not agent:
            return jsonify({'error': 'Invalid API token'}), 401

        g.agent = agent
        g.agent_id = agent.id
        return f(*args, **kwargs)

    return decorated
