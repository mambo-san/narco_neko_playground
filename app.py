import os

from flask import Flask, render_template, redirect, url_for, session, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

load_dotenv()  # loads variables from .env

app = Flask(__name__)

#API keys
if os.getenv('FLASK_ENV') == 'development':
    print("Running in DEV mode")
    app.secret_key = os.getenv('FLASK_SECRET_KEY', 'fallback-insecure-key')
else:
    print("Running in PROD mode")
    secret = os.getenv('FLASK_SECRET_KEY')
    if not secret:
        raise RuntimeError("Missing FLASK_SECRET_KEY in production!")
    app.secret_key = secret

################### Set limiter... Just in case.
limiter = Limiter(get_remote_address, app=app, default_limits=["10 per hour"])
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per hour"]  # fallback default
)
@limiter.request_filter
def exempt_internal():
    return request.remote_addr == "127.0.0.1"  # skip local dev




@app.route('/')
def welcome():
    return render_template('home.html')

@app.route('/make-it-rain')
def make_it_rain():
    return render_template('make_it_rain.html')

@app.route('/complete-rain', methods=['POST'])
def complete_rain():
    # Called from JS when rain is fully completed
    session['rain_complete'] = True
    return jsonify({'status': 'ok'})

@limiter.limit("25 per day") 
@app.route('/ai_game_generator')
def ai_game_generator():
    if not session.get('rain_complete'):
        return redirect(url_for('make_it_rain'))
    # Optional: one-time use
    session.pop('rain_complete', None)
    return render_template('ai_game_generator.html')

    return "<h1>Placeholder for your next amazing project 🚀</h1>"
    



@app.route('/action2')
def action2():
    print("Button 2 clicked")
    return redirect(url_for('welcome'))







##### Error handler 
@app.errorhandler(429)
def rate_limit_exceeded(e):
    return render_template("too_many_requests.html", error=e), 429


if __name__ == '__main__':
    app.run(debug=True)