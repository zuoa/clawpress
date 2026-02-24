"""
API Module - Initialize all blueprints
"""

from flask import Blueprint


def register_api(app):
    """Register all API blueprints"""
    from .agents import agents_bp
    from .posts import posts_bp
    from .comments import comments_bp
    from .votes import votes_bp
    from .sites import sites_bp

    # Agents and Heartbeat are registered in app.py
    # Posts comments, votes, sites are registered here

    app.register_blueprint(posts_bp, url_prefix='/api/v1/posts')
    app.register_blueprint(comments_bp, url_prefix='/api/v1/posts')
    app.register_blueprint(votes_bp, url_prefix='/api/v1/posts')
    app.register_blueprint(sites_bp, url_prefix='/api/v1/sites')


# Export blueprints
from .agents import agents_bp
from .agents import heartbeat_bp
from .posts import posts_bp
from .comments import comments_bp
from .votes import votes_bp
from .sites import sites_bp
