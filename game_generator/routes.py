from flask import Blueprint, render_template, session, redirect, url_for, jsonify, request, current_app
from extensions import limiter
from openai import OpenAI
from dotenv import load_dotenv
import os
import re

from .models import Game_data

game_generator_bp = Blueprint(
	'game_generator', 
	__name__, 
	template_folder='templates'
)

load_dotenv()
openai_api_key = os.getenv('AI_API_KEY')
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY is not set in environment variables")

###Make it rain routes
@game_generator_bp.route('/make_it_rain')
def index():
    print('make_it_rain requested')
    return render_template('make_it_rain.html')

@game_generator_bp.route('/complete_rain', methods=['POST'])
def complete_rain():
    # Called from JS when rain is fully completed
    session['rain_complete'] = True
    return jsonify({'status': 'ok'})

@limiter.limit("5 per minute",scope="function")
@game_generator_bp.route('/game_generator')
def game_generator():

    if not session.get('rain_complete'):
        return redirect(url_for('game_generator.index'))
    #User needs to complete the stupid game every use.
    #session.pop('rain_complete', None)
    return render_template('game_generator.html')

@game_generator_bp.route('/submit_prompt', methods=['POST'])
def submit_prompt():
    data = request.get_json()
    user_prompt = data.get('prompt', '')
    screen = data.get('screen', {})
    current_app.logger.debug(f"[DEBUG] Received prompt: {user_prompt}")
    current_app.logger.debug(f"[DEBUG] Received screen data: {screen}")
    
    if not user_prompt:
        return jsonify({'error': 'Empty prompt'}), 400

    message =messages = build_game_generation_prompt(
        prompt= user_prompt,
        viewport_width=screen.get('viewportWidth') -10,
        viewport_height=screen.get('viewportHeight') -10,
        is_likely_on_mobile='Mobi' in request.user_agent.string #Find out if user is on phone
    )
    ### Ask OpenAI very nicely and pray ⛩️:
    try:

        client = OpenAI(
            api_key = os.getenv('AI_API_KEY')
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7, # The higher this value, the more "creative" but also higher risk of malformed response.
            max_tokens=4000
        )
        raw_html = response.choices[0].message.content
        current_app.logger.debug(f"[DEBUG] API response received.")

        cleaned_html = re.sub(r"^```html\s*|\s*```$", "", raw_html.strip(), flags=re.IGNORECASE)
        current_app.logger.debug(f"[DEBUG] API response cleanded.")
        session['user_prompt'] = user_prompt
        session['generated_html'] = cleaned_html
        return jsonify({'status': 'ok'})

    except Exception as e:
        import traceback
        traceback.print_exc()
        current_app.logger.error(f"[ERROR] {str(e)}")
        return jsonify({'error': 'Server error'}), 500


@game_generator_bp.route('/play')
def play_game():
    game_html = session.get('generated_html')
    if not game_html:
        return redirect(url_for('game_generator.game_generator'))
    return render_template('play_game.html')

@game_generator_bp.route('/embedded_game')
def embedded_game():
    game_html = session.get('generated_html')
    if not game_html:
        return "<p>No game generated yet.</p>"
    return game_html


@game_generator_bp.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()

    prompt = session.get('user_prompt')
    html = session.get('generated_html')

    if not prompt or not html:
        return jsonify({'error': 'Missing game data'}), 400

    Game_data.insert_new_game(prompt, html)

    return jsonify({'status': 'feedback saved'})

def build_game_generation_prompt(prompt, viewport_width, viewport_height, is_likely_on_mobile):
    full_prompt = (
        f"Generate a game in a single valid HTML file that can be embedded into an <iframe>.\n"
        f"Design the game to fit a default screen size of {viewport_width} x {viewport_height}, "
        f"but make the HTML layout fully responsive to changes in the parent <iframe>'s size.\n"
        f"The game must stretch or scale to fill 100% of the iframe's width and height using responsive canvas or layout techniques.\n"
        f"Use <canvas> or DOM manipulation for the game UI — do NOT use nested <iframe> or <embed>.\n"
        f"The game must include an objective or goal, and it should be possible to win or lose.\n"
        f"Keep gameplay short and replayable (1–2 minutes max).\n"
        f"The game should be fun, surprising, or satisfying in some way.\n"
        f"Include visual or audio feedback where appropriate.\n"
    )

    if is_likely_on_mobile:
        full_prompt += (
            "The game must be mobile friendly.\n"
            "Control must work via touch panel — tap, swipe, or drag.\n"
    )
    else:
        full_prompt += (
            "Use keyboard and/or mouse for control.\n"
            "Include visible instructions inside the HTML that explain the game’s goal and controls.\n"
    )

    full_prompt += f"\nUser wants a game with the following description: {prompt}"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an HTML game generator assistant.\n"
                "Only respond with a single valid HTML file — no explanation, no markdown.\n"
                "The HTML must be complete, self-contained, and use only inline scripts. e.g. JavaScript and CSS.\n"
                "Do not load any external libraries or assets.\n"
                "The game must be interactive and include randomness and a clear goal.\n"
                "Avoid relying on <form> or <input type='text'> unless they are part of the gameplay.\n"
                "Only return clean, raw HTML that can be copied and saved directly as a playable game."
                "The graphical aspect of the game needs to use elements of math to make it interesting. E.g. Use sine, cosine to control enemy movement."
            )
        },
        {"role": "user", "content": full_prompt}
    ]

    return messages


@game_generator_bp.route('/public_library')
def public_library():
    games = Game_data.query.order_by(Game_data.created_at.desc()).all()
    return render_template('public_library.html', games=games)

@game_generator_bp.route('/public_library/vote', methods=['POST'])
def vote_on_game():
    data = request.get_json()
    game_id = data.get('id')
    delta = data.get('delta', 0)

    game = Game_data.query.get(game_id)
    if not game:
        return jsonify({'success': False, 'error': 'Game not found'}), 404

    new_score = game.adjust_score(delta)
    
    minimum_score = -2
    if game.score < minimum_score:
        game.delete_game()
        return jsonify({'success': True, 'message': f"Score went below the minimum_score of {minimum_score}. Game deleted."})
    
    
    return jsonify({'success': True, 'message': f'Thanks for your feedback! New score: {new_score}'})