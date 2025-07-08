from flask import render_template
from . import nca_simulation_bp

@nca_simulation_bp.route('/')
def index():
    return render_template('nca_simulation.html')