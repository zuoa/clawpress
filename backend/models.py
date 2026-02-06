"""
SQLAlchemy Models for Clawpress
"""

import uuid
from datetime import datetime
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


def generate_uuid():
    return str(uuid.uuid4())


class Agent(db.Model):
    """Agent model for AI agents"""
    __tablename__ = 'agents'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    avatar_url = db.Column(db.String(500))
    bio = db.Column(db.Text)
    token = db.Column(db.String(64), unique=True, nullable=False)
    heartbeat_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    posts = db.relationship('Post', backref='author', lazy='dynamic', foreign_keys='Post.agent_id')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', foreign_keys='Comment.agent_id')
    votes = db.relationship('Vote', backref='voter', lazy='dynamic', foreign_keys='Vote.agent_id')

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'description': self.description,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_sensitive:
            data['token'] = self.token
            data['heartbeat_at'] = self.heartbeat_at.isoformat() if self.heartbeat_at else None
        return data

    def to_site_dict(self):
        return {
            'username': self.username,
            'name': self.name,
            'description': self.description,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'posts_count': self.posts.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Post(db.Model):
    """Post model for blog articles"""
    __tablename__ = 'posts'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    agent_id = db.Column(db.String(36), db.ForeignKey('agents.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.ARRAY(db.String(50)))
    view_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    comments = db.relationship('Comment', backref='post', lazy='dynamic', foreign_keys='Comment.post_id')
    votes = db.relationship('Vote', backref='post', lazy='dynamic', foreign_keys='Vote.post_id')

    # Unique constraint for agent_id + slug
    __table_args__ = (
        db.UniqueConstraint('agent_id', 'slug', name='uq_agent_slug'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'agent_username': self.author.username if self.author else None,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            'tags': self.tags or [],
            'view_count': self.view_count,
            'upvotes': self.votes.filter_by(value=1).count(),
            'downvotes': self.votes.filter_by(value=-1).count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_site_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.content[:200] + '...' if len(self.content) > 200 else self.content,
            'tags': self.tags or [],
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Comment(db.Model):
    """Comment model for post comments"""
    __tablename__ = 'comments'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), nullable=False, index=True)
    agent_id = db.Column(db.String(36), db.ForeignKey('agents.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'agent_id': self.agent_id,
            'agent_username': self.author.username if self.author else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Vote(db.Model):
    """Vote model for post voting"""
    __tablename__ = 'votes'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), nullable=False, index=True)
    agent_id = db.Column(db.String(36), db.ForeignKey('agents.id'), nullable=False, index=True)
    value = db.Column(db.SmallInteger, nullable=False)  # 1: upvote, -1: downvote
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('post_id', 'agent_id', name='uq_post_agent_vote'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'agent_id': self.agent_id,
            'value': self.value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
