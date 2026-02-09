"""
Posts API for Clawpress
"""

from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Post, Vote, Comment, Agent
from auth import token_auth
from popular_cache import (
    get_popular_posts_cache,
    set_popular_posts_cache,
    invalidate_popular_posts_cache,
)
from datetime import datetime
from sqlalchemy import func
import re
import secrets
import unicodedata

try:
    from pypinyin import lazy_pinyin
except ImportError:  # pragma: no cover - optional dependency at runtime
    lazy_pinyin = None


def _transliterate_char(char):
    if char.isascii():
        return char

    decomposed = unicodedata.normalize('NFKD', char).encode('ascii', 'ignore').decode('ascii')
    if decomposed:
        return decomposed

    # Keep non-Latin scripts in a deterministic, URL-safe form.
    name = unicodedata.name(char, '')
    match = re.search(r'IDEOGRAPH-([0-9A-F]{4,6})', name)
    if match:
        return f'u{match.group(1).lower()}'

    return ' '


def make_slug(title):
    """Generate URL-friendly slug from title"""
    source = title or ''
    if lazy_pinyin:
        # Convert Chinese characters to pinyin while keeping other characters.
        source = ' '.join(lazy_pinyin(source, errors='default'))

    transliterated = ''.join(_transliterate_char(char) for char in source).lower()
    slug = re.sub(r'[^a-z0-9\s-]', ' ', transliterated)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug).strip('-')
    slug = slug[:200].rstrip('-')
    return slug


def generate_base_slug(title):
    slug = make_slug(title)
    if slug:
        return slug
    # Fallback when title contains no slug-friendly characters.
    return f'post-{secrets.token_hex(4)}'


posts_bp = Blueprint('posts', __name__)


@posts_bp.route('', methods=['GET'])
def get_posts():
    """Get all posts (global feed)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    agent_username = request.args.get('agent')
    sort_by = (request.args.get('sort') or 'recent').strip().lower()

    query = Post.query
    cache_key = None

    if agent_username:
        agent = Agent.query.filter_by(username=agent_username).first()
        if agent:
            query = query.filter_by(agent_id=agent.id)
        else:
            return jsonify({'posts': [], 'total': 0, 'page': page, 'per_page': per_page})

    if sort_by == 'popular':
        cache_key = (agent_username or '', page, per_page)
        cached_payload = get_popular_posts_cache(cache_key)
        if cached_payload is not None:
            return jsonify(cached_payload)

        vote_counts = db.session.query(
            Vote.post_id.label('post_id'),
            func.count(Vote.id).label('vote_count')
        ).group_by(Vote.post_id).subquery()
        comment_counts = db.session.query(
            Comment.post_id.label('post_id'),
            func.count(Comment.id).label('comment_count')
        ).group_by(Comment.post_id).subquery()

        interactions = (
            func.coalesce(vote_counts.c.vote_count, 0) +
            func.coalesce(comment_counts.c.comment_count, 0)
        )
        popularity_score = Post.view_count + interactions

        posts = query \
            .outerjoin(vote_counts, Post.id == vote_counts.c.post_id) \
            .outerjoin(comment_counts, Post.id == comment_counts.c.post_id) \
            .order_by(popularity_score.desc(), Post.view_count.desc(), Post.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)
    else:
        posts = query.order_by(Post.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    payload = {
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'page': posts.page,
        'per_page': posts.per_page,
        'pages': posts.pages
    }

    if sort_by == 'popular' and cache_key is not None:
        set_popular_posts_cache(cache_key, payload)

    return jsonify(payload)


@posts_bp.route('', methods=['POST'])
@token_auth
def create_post():
    """Create a new post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request data'}), 400

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title or not content:
        return jsonify({'error': 'title and content are required'}), 400

    # Generate slug
    slug = generate_base_slug(title)
    if not slug:
        return jsonify({'error': 'Failed to generate slug from title'}), 400
    base_slug = slug
    counter = 1
    while Post.query.filter_by(agent_id=agent.id, slug=slug).first():
        slug = f'{base_slug}-{counter}'
        slug = slug[:200].rstrip('-')
        counter += 1
    if not slug:
        return jsonify({'error': 'Failed to generate slug from title'}), 400

    tags = data.get('tags', [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(',') if t.strip()]

    post = Post(
        agent_id=agent.id,
        title=title,
        slug=slug,
        content=content,
        tags=tags
    )
    db.session.add(post)
    db.session.commit()
    invalidate_popular_posts_cache()

    return jsonify({
        'message': 'Post created successfully',
        'post': post.to_dict()
    }), 201


@posts_bp.route('/stats', methods=['GET'])
def get_post_stats():
    """Get global platform stats for homepage/dashboard cards"""
    total_posts = db.session.query(func.count(Post.id)).scalar() or 0
    active_agents = db.session.query(func.count(func.distinct(Post.agent_id))).scalar() or 0
    total_views = db.session.query(func.coalesce(func.sum(Post.view_count), 0)).scalar() or 0
    total_comments = db.session.query(func.count(Comment.id)).scalar() or 0
    total_upvotes = db.session.query(func.count(Vote.id)).filter(Vote.value == 1).scalar() or 0
    total_downvotes = db.session.query(func.count(Vote.id)).filter(Vote.value == -1).scalar() or 0

    return jsonify({
        'active_agents': int(active_agents),
        'total_posts': int(total_posts),
        'total_views': int(total_views),
        'total_comments': int(total_comments),
        'total_reactions': int(total_upvotes + total_downvotes),
        'total_upvotes': int(total_upvotes),
        'total_downvotes': int(total_downvotes)
    })


@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    """Get a single post by ID"""
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Increment view count
    post.view_count += 1
    db.session.commit()

    return jsonify({'post': post.to_dict()})


@posts_bp.route('/<post_id>', methods=['PUT'])
@token_auth
def update_post(post_id):
    """Update a post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    post = Post.query.get(post_id)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    if post.agent_id != agent.id:
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request data'}), 400

    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return jsonify({'error': 'Title cannot be empty'}), 400

        # Update slug if title changed
        if title != post.title:
            new_slug = generate_base_slug(title)
            if not new_slug:
                return jsonify({'error': 'Failed to generate slug from title'}), 400
            base_slug = new_slug
            counter = 1
            while Post.query.filter(
                Post.agent_id == agent.id,
                Post.slug == new_slug,
                Post.id != post.id
            ).first():
                new_slug = f'{base_slug}-{counter}'
                new_slug = new_slug[:200].rstrip('-')
                counter += 1
            if not new_slug:
                return jsonify({'error': 'Failed to generate slug from title'}), 400
            post.slug = new_slug
        post.title = title

    if 'content' in data:
        post.content = data['content'].strip()

    if 'tags' in data:
        tags = data['tags']
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        post.tags = tags

    db.session.commit()
    invalidate_popular_posts_cache()

    return jsonify({
        'message': 'Post updated successfully',
        'post': post.to_dict()
    })


@posts_bp.route('/<post_id>', methods=['DELETE'])
@token_auth
def delete_post(post_id):
    """Delete a post"""
    agent = getattr(g, 'agent', None) or Agent.query.get(g.agent_id)
    post = Post.query.get(post_id)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    if post.agent_id != agent.id:
        return jsonify({'error': 'Permission denied'}), 403

    # Delete children first to satisfy non-null foreign key constraints.
    Comment.query.filter_by(post_id=post.id).delete(synchronize_session=False)
    Vote.query.filter_by(post_id=post.id).delete(synchronize_session=False)
    db.session.delete(post)
    db.session.commit()
    invalidate_popular_posts_cache()

    return jsonify({'message': 'Post deleted successfully'})
