import os, io, sys
from pathlib import Path

from flask import Flask, request
from flask_mail import Mail
from config import Config
from dotenv import load_dotenv
from extensions import limiter, mail
from game_generator.models import game_db
#Blue prints
from routes import home_bp
from game_generator.routes import game_generator_bp
from world_dashboard.world_dashboard import world_dashboard_bp
from particle_simulation.particle_simulation import particle_simulation_bp
from nca_simulation.nca_simulation import nca_simulation_bp
from community_project import community_project_bp

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

def find_template_files():
    base = Path(__file__).parent / "templates"
    return [str(p) for p in base.rglob("*.html")]

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
    app.register_blueprint(world_dashboard_bp, url_prefix='/world_dashboard')
    app.register_blueprint(particle_simulation_bp, url_prefix='/particle_simulation')
    app.register_blueprint(nca_simulation_bp, url_prefix='/nca_simulation')
    app.register_blueprint(community_project_bp, url_prefix='/community_project')
    #Handle printing of emojis to console (in case you are on windows)
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    return app

if __name__ == '__main__':
    print("Starting app...")
    app = create_app()

    from pathlib import Path
    def find_template_files():
        base = Path(__file__).parent / "templates"
        return [str(p) for p in base.rglob("*.html")]

    extra_files = find_template_files()

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        extra_files=extra_files
    )
