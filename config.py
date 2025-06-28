import os
from dotenv import load_dotenv

load_dotenv()  # loads variables from .env

class Config:
	#API keys and stuff
	SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'fallback')
	#Email stuff
	MAIL_SERVER = 'smtp.gmail.com'
	MAIL_PORT = 587
	MAIL_USE_TLS = True
	MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
	MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
	MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME')
	#DB stuff
	SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
	SQLALCHEMY_TRACK_MODIFICATIONS = False

	#New project to be added here to display as card on the home page
	MINI_PROJECTS = [
        {'name': '🎮 Game Generator', 'endpoint': 'game_generator.game_generator','description': 'Generate games with AI'},
        {"name": "🌎 World Dashbaord", 'endpoint': 'world_dashboard.index','description': 'Something useful'},
    ]