import os, io, sys

from flask import Flask, request
from flask_mail import Mail
from config import Config
from dotenv import load_dotenv
from extensions import limiter, mail
from game_generator.models import game_db
#Blue prints
from game_generator.routes import game_generator_bp
from routes import home_bp

#For testing 
import webbrowser #for dev only
from livereload import Server
import socket


load_dotenv()  # loads variables from .env



@limiter.request_filter
def exempt_internal():
    return request.remote_addr == "127.0.0.1"  # skip local dev

def is_server_running(host='127.0.0.1', port=5000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        return result == 0  # 0 means port is in use (server is running)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    #Email setup
    mail.init_app(app)

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

    game_db.init_app(app)

    ################### Set limiter... Just in case.
    limiter.init_app(app)

    # Create tables
    with app.app_context():
        game_db.create_all()

    # Register Blueprints here
    app.register_blueprint(home_bp, url_prefix='/')
    app.register_blueprint(game_generator_bp, url_prefix='/game_generator')

    #Handle printing of emojis to console (in case you are on windows)
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    return app


if __name__ == '__main__':
    app = create_app()
    if os.getenv('FLASK_ENV') == 'development':
        if is_server_running():
            print("Server is already running on 127.0.0.1:5000/")
        else:
            print(app.url_map)  
            #Live reload server
            server = Server(app.wsgi_app)
            server.watch('**/*.html')
            server.watch('**/*.css')
            server.watch('**/*.js')
            server.watch('**/*.py')
            #
            server.serve(host='127.0.0.1', port=5000, debug=True)
            #app.run(host='0.0.0.0', port=5000)
    else: #PROD
         app.run(host='0.0.0.0', port=5000)
