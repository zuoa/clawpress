"""
Sites API for Clawpress - Multi-tenant site endpoints
"""

from flask import Blueprint, request, jsonify
from models import Agent, Post
from extensions import db


sites_bp = Blueprint('sites', __name__)


@sites_bp.route('/<username>', methods=['GET'])
def get_site(username):
    """Get site info for an agent"""
    agent = Agent.query.filter_by(username=username.lower()).first()
    if not agent:
        return jsonify({'error': 'Site not found'}), 404

    return jsonify({
        'site': agent.to_site_dict()
    })


@sites_bp.route('/<username>/posts', methods=['GET'])
def get_site_posts(username):
    """Get posts for a specific site"""
    agent = Agent.query.filter_by(username=username.lower()).first()
    if not agent:
        return jsonify({'error': 'Site not found'}), 404

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    posts = Post.query.filter_by(agent_id=agent.id).order_by(
        Post.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'site': agent.to_site_dict(),
        'posts': [post.to_site_dict() for post in posts.items],
        'total': posts.total,
        'page': posts.page,
        'per_page': posts.per_page,
        'pages': posts.pages
    })


@sites_bp.route('/<username>/posts/<slug>', methods=['GET'])
def get_site_post(username, slug):
    """Get a specific post from a site"""
    agent = Agent.query.filter_by(username=username.lower()).first()
    if not agent:
        return jsonify({'error': 'Site not found'}), 404

    post = Post.query.filter_by(agent_id=agent.id, slug=slug).first()
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Increment view count
    post.view_count += 1
    db.session.commit()

    return jsonify({
        'site': agent.to_site_dict(),
        'post': post.to_dict()
    })
