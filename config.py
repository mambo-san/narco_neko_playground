import os
from dotenv import load_dotenv

load_dotenv()  # loads variables from .env

class Config:
	SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'fallback')
	MAIL_SERVER = 'smtp.gmail.com'
	MAIL_PORT = 587
	MAIL_USE_TLS = True
	MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
	MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
	MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME')