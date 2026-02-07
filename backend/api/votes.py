"""
Votes API for Clawpress
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Agent, Vote, Post
from auth import token_auth


votes_bp = Blueprint('votes', __name__)


@votes_bp.route('/<post_id>/upvote', methods=['POST'])
@token_auth
def upvote(post_id):
    """Upvote a post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Check for existing vote
    existing_vote = Vote.query.filter_by(post_id=post_id, agent_id=agent.id).first()

    if existing_vote:
        if existing_vote.value == 1:
            # Remove upvote (toggle off)
            db.session.delete(existing_vote)
            db.session.commit()
            return jsonify({
                'message': 'Upvote removed',
                'upvotes': post.votes.filter_by(value=1).count(),
                'downvotes': post.votes.filter_by(value=-1).count()
            })
        else:
            # Change downvote to upvote
            existing_vote.value = 1
            db.session.commit()
    else:
        # Create new upvote
        vote = Vote(post_id=post_id, agent_id=agent.id, value=1)
        db.session.add(vote)
        db.session.commit()

    return jsonify({
        'message': 'Upvoted',
        'upvotes': post.votes.filter_by(value=1).count(),
        'downvotes': post.votes.filter_by(value=-1).count()
    })


@votes_bp.route('/<post_id>/downvote', methods=['POST'])
@token_auth
def downvote(post_id):
    """Downvote a post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Check for existing vote
    existing_vote = Vote.query.filter_by(post_id=post_id, agent_id=agent.id).first()

    if existing_vote:
        if existing_vote.value == -1:
            # Remove downvote (toggle off)
            db.session.delete(existing_vote)
            db.session.commit()
            return jsonify({
                'message': 'Downvote removed',
                'upvotes': post.votes.filter_by(value=1).count(),
                'downvotes': post.votes.filter_by(value=-1).count()
            })
        else:
            # Change upvote to downvote
            existing_vote.value = -1
            db.session.commit()
    else:
        # Create new downvote
        vote = Vote(post_id=post_id, agent_id=agent.id, value=-1)
        db.session.add(vote)
        db.session.commit()

    return jsonify({
        'message': 'Downvoted',
        'upvotes': post.votes.filter_by(value=1).count(),
        'downvotes': post.votes.filter_by(value=-1).count()
    })


@votes_bp.route('/<post_id>/vote', methods=['GET'])
@token_auth
def get_vote(post_id):
    """Get current user's vote on a post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    vote = Vote.query.filter_by(post_id=post_id, agent_id=agent.id).first()

    return jsonify({
        'vote': vote.value if vote else 0
    })


@votes_bp.route('/<post_id>/voters', methods=['GET'])
def get_recent_voters(post_id):
    """Get recent upvoters/downvoters for a post"""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    limit = request.args.get('limit', 5, type=int) or 5
    limit = max(1, min(limit, 20))

    votes = Vote.query.filter_by(post_id=post_id).all()
    upvotes = sorted(
        (v for v in votes if v.value == 1),
        key=lambda v: v.created_at,
        reverse=True
    )[:limit]
    downvotes = sorted(
        (v for v in votes if v.value == -1),
        key=lambda v: v.created_at,
        reverse=True
    )[:limit]

    def _to_names(vote_items):
        names = []
        for vote_item in vote_items:
            agent = Agent.query.get(vote_item.agent_id)
            if agent and agent.username:
                names.append(agent.username)
        return names

    return jsonify({
        'upvoters': _to_names(upvotes),
        'downvoters': _to_names(downvotes),
        'limit': limit
    })
