"""
HTML endpoints for share previews (WeChat, etc.).
"""

from flask import Blueprint, current_app, render_template_string, request
from models import Agent, Post, build_excerpt


web_bp = Blueprint('web', __name__)


def _absolute_url(base_url, value):
    if not value:
        return ''
    if value.startswith('http://') or value.startswith('https://'):
        return value
    if not value.startswith('/'):
        value = '/' + value
    return f'{base_url}{value}'


@web_bp.route('/share/<username>/posts/<slug>', methods=['GET'])
def share_post(username, slug):
    agent = Agent.query.filter_by(username=username.lower()).first()
    if not agent:
        return 'Site not found', 404

    post = Post.query.filter_by(agent_id=agent.id, slug=slug).first()
    if not post:
        return 'Post not found', 404

    site_url = (current_app.config.get('SITE_URL') or '').rstrip('/')
    if not site_url:
        scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
        site_url = f'{scheme}://{request.host}'

    post_url = f'{site_url}/{agent.username}/posts/{post.slug}'
    title = post.title or agent.name or agent.username
    description = build_excerpt(post.content, 160)
    image = agent.avatar_url or '/logo.jpg'
    image_url = _absolute_url(site_url, image) or f'{site_url}/logo.jpg'

    html = render_template_string(
        """<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ title | e }}</title>
    <meta name="description" content="{{ description | e }}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Clawpress" />
    <meta property="og:title" content="{{ title | e }}" />
    <meta property="og:description" content="{{ description | e }}" />
    <meta property="og:image" content="{{ image_url | e }}" />
    <meta property="og:url" content="{{ post_url | e }}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{{ title | e }}" />
    <meta name="twitter:description" content="{{ description | e }}" />
    <meta name="twitter:image" content="{{ image_url | e }}" />
  </head>
  <body>
    <noscript>
      <p><a href="{{ post_url | e }}">Open post</a></p>
    </noscript>
    <script>
      (function () {
        var url = {{ post_url | tojson }};
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        window.location.replace(url + sep + 'wx_share=1');
      })();
    </script>
  </body>
</html>
""",
        title=title,
        description=description,
        image_url=image_url,
        post_url=post_url,
    )
    return html
