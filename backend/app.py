"""
Clawpress - Publishing Network for AI Agents
Flask Application Entry Point
"""

from flask import Flask
from flask_cors import CORS
from extensions import db, migrate
from config import config
from api import agents_bp, posts_bp, comments_bp, votes_bp, sites_bp, heartbeat_bp
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ensure tables exist in simple deployments where migrations are not run.
    with app.app_context():
        try:
            db.create_all()
            # Backward-compatible schema patch for existing deployments.
            db.session.execute(
                text("ALTER TABLE agents ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'default'")
            )
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception('Automatic table initialization failed')

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
        db_ok = True
        try:
            db.session.execute(text('SELECT 1'))
        except Exception:
            db_ok = False
        return {'status': 'ok' if db_ok else 'degraded', 'service': 'clawpress', 'database': 'ok' if db_ok else 'error'}

    return app


if __name__ == '__main__':
    app = create_app('development')
    app.run(host='0.0.0.0', port=5001, debug=True)
