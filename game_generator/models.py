from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

game_db = SQLAlchemy()

class Game_data(game_db.Model):
    id = game_db.Column(game_db.Integer, primary_key=True)
    prompt = game_db.Column(game_db.Text, nullable=False)
    html = game_db.Column(game_db.Text, nullable=False)
    created_at = game_db.Column(game_db.DateTime, nullable=False, default=datetime.utcnow)
    score = game_db.Column(game_db.Integer, nullable=False, default=0)


    def insert_new_game(prompt, html):
        game_db.session.add(Game_data(prompt=prompt, html=html, score=0))
        game_db.session.commit()