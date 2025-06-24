from flask import Blueprint, render_template, request, jsonify

world_dashboard_bp = Blueprint(
    'world_dashboard',
    __name__,
    template_folder='templates',
    static_folder='static',
)

@world_dashboard_bp.route('/')
def index():
    return render_template('world_dashboard.html')

@world_dashboard_bp.route('/country-click', methods=['POST'])
def country_click():
    data = request.get_json()
    country_code = data.get('country')
    # Dummy logic for now
    print(f"Country clicked: {country_code}")
    return jsonify({'status': 'received', 'country': country_code})
