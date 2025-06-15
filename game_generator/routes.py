from flask import Blueprint, render_template, session, redirect, url_for, jsonify
from extensions.limiter import limiter

game_generator_bp = Blueprint(
	'game_generator', 
	__name__, 
	template_folder='templates'
)

@game_generator_bp.route('/game_generator')
def index():
    return render_template('make_it_rain.html')

@game_generator_bp.route('/make-it-rain')
def make_it_rain():
    return render_template('make_it_rain.html')

@game_generator_bp.route('/complete-rain', methods=['POST'])
def complete_rain():
    # Called from JS when rain is fully completed
    session['rain_complete'] = True
    return jsonify({'status': 'ok'})

@limiter.limit("5 per minute",scope="function")
@game_generator_bp.route('/ai_game_generator')
def ai_game_generator():
    if not session.get('rain_complete'):
        return redirect(url_for('game_generator.make_it_rain'))
    # Optional: one-time use
    session.pop('rain_complete', None)
    return render_template('game_generator.html')