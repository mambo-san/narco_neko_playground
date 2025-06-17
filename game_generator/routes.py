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
    #User needs to complete the stupid game every use
    session.pop('rain_complete', None)
    print('Redirect to game_generator')
    return render_template('game_generator.html')

@game_generator_bp.route('/submit_prompt', methods=['POST'])
def submit_prompt():
    data = request.get_json()
    user_prompt = data.get('prompt', '')
    screen = data.get('screen', {})
    viewport_width = screen.get('viewportWidth')
    viewport_height = screen.get('viewportHeight')
    is_likely_on_mobile = 'Mobi' in request.user_agent.string #Find out if user is on phone
    print(f"[DEBUG] Received prompt: {user_prompt}")
    print(f"[DEBUG] Received view_port size: {viewport_width} x {viewport_height}")

    if not user_prompt:
        return jsonify({'error': 'Empty prompt'}), 400

    message =messages = build_game_generation_prompt(
        prompt= user_prompt,
        viewport_width=1280,
        viewport_height=720,
        is_likely_on_mobile=False
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
        print("[DEBUG] API response received.")

        cleaned_html = re.sub(r"^```html\s*|\s*```$", "", raw_html.strip(), flags=re.IGNORECASE)
        print("[DEBUG] API response cleaned: " + cleaned_html)

        session['generated_html'] = cleaned_html
        return jsonify({'status': 'ok'})

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({'error': 'Server error'}), 500

@game_generator_bp.route('/play')
def play_game():
    game_html = session.get('generated_html')
    if not game_html:
        return redirect(url_for('game_generator.game_generator'))

    return game_html






def build_game_generation_prompt(prompt, viewport_width, viewport_height, is_likely_on_mobile):
    full_prompt = (
        f"Generate a game in a single valid HTML file.\n"
        f"The screen size is {viewport_width} x {viewport_height}.\n"
        f"The game must have an objective or goal. It should be possible to win or lose.\n"
        f"Game duration should be short — no more than 1–2 minutes per session.\n"
        f"The game must be fun, surprising, or satisfying in some way.\n"
        f"Use canvas or DOM manipulation to build the game UI. Avoid using <iframe> or <embed>.\n"
        f"Use sound effects or visual feedback if appropriate.\n"
    )

    if is_likely_on_mobile:
        full_prompt += (
            "The game must be mobile friendly.\n"
            "Control must work via touch panel — tap, swipe, or drag.\n"
    )
    else:
        full_prompt += (
            "Use keyboard (WASD or arrows) or mouse for control.\n"
            "Include visible instructions inside the HTML that explain the game’s goal and controls.\n"
    )

    full_prompt += f"\nUser wants a game with the following description: {prompt}"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an HTML game generator assistant.\n"
                "Only respond with a single valid HTML file — no explanation, no markdown.\n"
                "The HTML must be complete, self-contained, and use only inline JavaScript and CSS.\n"
                "Do not load any external libraries or assets.\n"
                "The game must be interactive and include randomness and a clear goal.\n"
                "Avoid relying on <form> or <input type='text'> unless they are part of the gameplay.\n"
                "Only return clean, raw HTML that can be copied and saved directly as a playable game."
            )
        },
        {"role": "user", "content": full_prompt}
    ]

    return messages