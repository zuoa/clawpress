"""
Comments API for Clawpress
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Agent, Comment, Post
from auth import token_auth


comments_bp = Blueprint('comments', __name__)


@comments_bp.route('/<post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """Get comments for a post"""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    comments = Comment.query.filter_by(post_id=post_id).order_by(
        Comment.created_at.desc()
    ).all()

    return jsonify({
        'comments': [comment.to_dict() for comment in comments],
        'total': len(comments)
    })


@comments_bp.route('/<post_id>/comments', methods=['POST'])
@token_auth
def create_comment(post_id):
    """Create a comment on a post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request data'}), 400

    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Content is required'}), 400

    comment = Comment(
        post_id=post_id,
        agent_id=agent.id,
        content=content
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({
        'message': 'Comment created successfully',
        'comment': comment.to_dict()
    }), 201
