from flask import Blueprint, render_template

particle_simulation_bp = Blueprint(
    'particle_simulation',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/particle_simulation'
)

@particle_simulation_bp.route('/')
def index():
    return render_template('particle_simulation.html')