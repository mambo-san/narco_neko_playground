import os

from flask import Flask, render_template, redirect, url_for, session, request, jsonify, flash
from flask_mail import Message, Mail
from config import Config
from dotenv import load_dotenv
from extensions.limiter import limiter
#Blue prints
from game_generator.routes import game_generator_bp

#For testing 
import webbrowser #for dev only
from livereload import Server
import socket


load_dotenv()  # loads variables from .env

app = Flask(__name__)
# Email setup
app.config.from_object(Config)
mail = Mail(app)

#Blueprints:
app.register_blueprint(game_generator_bp)

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
limiter.init_app(app)
@limiter.request_filter
def exempt_internal():
    return request.remote_addr == "127.0.0.1"  # skip local dev

################### routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    name = request.form.get('name')
    email = request.form.get('email')
    message = request.form.get('message')

    if not (name and email and message):
        flash("All fields are required.", "error")
        return redirect('/')

    print(f"[Contact Form] {name} ({email}) said: {message}")
    print("Default sender is:", app.config.get('MAIL_DEFAULT_SENDER'))
    try:
        msg = Message(subject=f"[NNP:Contact] from {name}",
                      sender=app.config['MAIL_DEFAULT_SENDER'],
                      recipients=[app.config['MAIL_USERNAME']],
                      body=f"From: {name} <{email}>\n\n{message}")

        mail.send(msg)
        flash("Thanks for reaching out! I’ll get back to you soon.", "success")
    except Exception as e:
        print(f"Mail error: {e}")
        flash("Oops. Message failed to send.", "error")

    return redirect('/')



@app.route('/action2')
def action2():
    print("Button 2 clicked")
    return redirect(url_for('welcome'))



################### Error handler 
@app.errorhandler(429)
def rate_limit_exceeded(e):
    return render_template("too_many_requests.html", error=e), 429





def is_server_running(host='127.0.0.1', port=5000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        return result == 0  # 0 means port is in use (server is running)

if __name__ == '__main__':
    if is_server_running():
        print("Server is already running on 127.0.0.1:5000/")
    else:
        print(app.url_map)  
        server = Server(app.wsgi_app)
        server.watch('templates/*.html')
        server.watch('static/*.css')
        # this starts Flask + opens browser automatically
        server.serve(open_url_delay=1, host='127.0.0.1', port=5000, debug=True)
        #server.serve(open_url_delay=1, host='0.0.0.0', port=5000, debug=True)
