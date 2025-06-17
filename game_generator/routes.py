from flask import Blueprint, render_template, session, redirect, url_for, jsonify, request
from extensions.limiter import limiter
from openai import OpenAI
from dotenv import load_dotenv
import os
import re

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
    return render_template('make_it_rain.html')

@game_generator_bp.route('/complete-rain', methods=['POST'])
def complete_rain():
    # Called from JS when rain is fully completed
    session['rain_complete'] = True
    return jsonify({'status': 'ok'})

@limiter.limit("5 per minute",scope="function")
@game_generator_bp.route('/game_generator')
def game_generator():
    if not session.get('rain_complete'):
        return redirect(url_for('game_generator.index'))
    #User needs to complete the stupid game every use
    session.pop('rain_complete', None)
    return render_template('game_generator.html')

@game_generator_bp.route('/game_generator/submit_prompt', methods=['POST'])
def submit_prompt():
    data = request.get_json()
    prompt = data.get('prompt', '')
    screen = data.get('screen', {})
    viewport_width = screen.get('viewportWidth')
    viewport_height = screen.get('viewportHeight')
    print(f"[DEBUG] Received prompt: {prompt}")
    print(f"[DEBUG] Received view_port size: {viewport_width} x {viewport_height}")

    if not prompt:
        return jsonify({'error': 'Empty prompt'}), 400

    #Find out if user is on phone
    is_likely_on_mobile = 'Mobi' in request.user_agent.string

    print('Mobile game?:' + str(is_likely_on_mobile))
    full_prompt = (
        f"Generate a game in a single valid HTML."
        f"The screen size is {viewport_width} x {viewport_height}"
    )
    if is_likely_on_mobile:
        full_prompt += (
            f"The game must be mobile friendly." 
            f"The game control must be done via touch panel."
        )
    else:
        full_prompt += f"Within the HTML, have a text box that shows the control and goal of the game within the HTML."
    
    full_prompt += (
         f"User wants game with the following description: {prompt}"
    )

    ### Ask OpenAI very nicely and pray ⛩️:
    try:

        client = OpenAI(
            api_key = os.getenv('AI_API_KEY')
        )
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system",
                    "content": (
                        "You are an HTML game generator assistant. "
                        "Only respond with a single valid HTML from start to finish."
                        "The output must be immediately usable as a standalone HTML page (do not load external resource from the HTML). "
                        "Only return clean, raw HTML."
                        "The game you generate needs randomness and a goal."

                    )},
                {"role": "user", "content": full_prompt}
            ],
            temperature=0.7, # The higher this value, the more "creative" but also higher risk of malformed response.
            max_tokens=4000
        )

        raw_html = response.choices[0].message.content
        print("[DEBUG] API response received.")

        cleaned_html = re.sub(r"^```html\s*|\s*```$", "", raw_html.strip(), flags=re.IGNORECASE)
        print("[DEBUG] API response cleaned: " + cleaned_html)

        session['generated_html'] = cleaned_html
        return jsonify({'status': 'ok'})

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({'error': 'Server error'}), 500

@game_generator_bp.route('/game_generator/play')
def play_game():
    game_html = session.get('generated_html')
    if not game_html:
        return redirect(url_for('game_generator.game_generator'))

    return game_html