"""
WeChat JS-SDK config API.
"""

import hashlib
import json
import secrets
import time
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from flask import Blueprint, current_app, jsonify, request


wechat_bp = Blueprint('wechat', __name__)

_TOKEN_CACHE = {
    'access_token': '',
    'access_token_expires_at': 0,
    'jsapi_ticket': '',
    'jsapi_ticket_expires_at': 0,
}


def _now():
    return int(time.time())


def _fetch_json(url):
    with urlopen(url, timeout=8) as response:
        payload = response.read().decode('utf-8')
        return json.loads(payload)


def _get_access_token(app_id, app_secret):
    if _TOKEN_CACHE['access_token'] and _TOKEN_CACHE['access_token_expires_at'] > _now():
        return _TOKEN_CACHE['access_token']

    query = urlencode({
        'grant_type': 'client_credential',
        'appid': app_id,
        'secret': app_secret,
    })
    data = _fetch_json(f'https://api.weixin.qq.com/cgi-bin/token?{query}')

    token = data.get('access_token', '')
    expires_in = int(data.get('expires_in') or 7200)
    if not token:
        raise RuntimeError(data.get('errmsg') or 'Failed to fetch WeChat access_token')

    _TOKEN_CACHE['access_token'] = token
    _TOKEN_CACHE['access_token_expires_at'] = _now() + max(expires_in - 120, 60)
    return token


def _get_jsapi_ticket(access_token):
    if _TOKEN_CACHE['jsapi_ticket'] and _TOKEN_CACHE['jsapi_ticket_expires_at'] > _now():
        return _TOKEN_CACHE['jsapi_ticket']

    query = urlencode({
        'access_token': access_token,
        'type': 'jsapi',
    })
    data = _fetch_json(f'https://api.weixin.qq.com/cgi-bin/ticket/getticket?{query}')

    ticket = data.get('ticket', '')
    expires_in = int(data.get('expires_in') or 7200)
    if not ticket:
        raise RuntimeError(data.get('errmsg') or 'Failed to fetch WeChat jsapi_ticket')

    _TOKEN_CACHE['jsapi_ticket'] = ticket
    _TOKEN_CACHE['jsapi_ticket_expires_at'] = _now() + max(expires_in - 120, 60)
    return ticket


@wechat_bp.route('/js-sdk-config', methods=['GET'])
def get_js_sdk_config():
    app_id = (current_app.config.get('WECHAT_APP_ID') or '').strip()
    app_secret = (current_app.config.get('WECHAT_APP_SECRET') or '').strip()
    if not app_id or not app_secret:
        return jsonify({'error': 'WeChat JS-SDK not configured'}), 503

    raw_url = (request.args.get('url') or '').strip()
    if not raw_url:
        return jsonify({'error': 'url is required'}), 400
    page_url = raw_url.split('#', 1)[0]

    site_url = (current_app.config.get('SITE_URL') or '').strip().rstrip('/')
    if site_url and not page_url.startswith(site_url):
        return jsonify({'error': 'url must be under SITE_URL'}), 400

    try:
        access_token = _get_access_token(app_id, app_secret)
        jsapi_ticket = _get_jsapi_ticket(access_token)
    except (RuntimeError, URLError) as exc:
        current_app.logger.exception('Failed to fetch WeChat credentials')
        return jsonify({'error': str(exc)}), 502

    timestamp = str(_now())
    nonce_str = secrets.token_hex(8)
    string_to_sign = (
        f'jsapi_ticket={jsapi_ticket}'
        f'&noncestr={nonce_str}'
        f'&timestamp={timestamp}'
        f'&url={page_url}'
    )
    signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()

    return jsonify({
        'appId': app_id,
        'timestamp': timestamp,
        'nonceStr': nonce_str,
        'signature': signature,
    })
