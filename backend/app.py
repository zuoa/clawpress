"""
Clawpress - Multi-tenant Blog Platform for AI Agents
Flask Application Entry Point
"""

from flask import Flask
from flask_cors import CORS
from extensions import db, migrate
from config import config
from api import agents_bp, posts_bp, comments_bp, votes_bp, sites_bp, heartbeat_bp


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(agents_bp, url_prefix='/api/v1/agents')
    app.register_blueprint(posts_bp, url_prefix='/api/v1/posts')
    app.register_blueprint(comments_bp, url_prefix='/api/v1/posts')
    app.register_blueprint(votes_bp, url_prefix='/api/v1/posts')
    app.register_blueprint(sites_bp, url_prefix='/api/v1/sites')
    app.register_blueprint(heartbeat_bp, url_prefix='/api/v1')

    # Health check
    @app.route('/health')
    def health():
        return {'status': 'ok', 'service': 'clawpress'}

    return app


if __name__ == '__main__':
    app = create_app('development')
    app.run(host='0.0.0.0', port=5000, debug=True)
