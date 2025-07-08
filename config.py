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
        {
			'name': '🎮 Game Generator', 
			'endpoint': 'game_generator.game_generator',
			'description': 'Generate proto type HTML game with AI. Give Feed back to other people\'s creation.'}, 
        {
			"name": "🌎 World Dashbaord", 
			'endpoint': 'world_dashboard.index',
			'description': 'Check timzone difference and learn geography along the way. '}, 
		{
			"name": "🧬 Particle Simulator", 
			'endpoint': 'particle_simulation.index',
			'description': 'Ponder the mechanism of life formation from chaos. '}
    ]