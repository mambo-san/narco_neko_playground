from flask import Blueprint

nca_simulation_bp = Blueprint(
    'nca_simulation',
    __name__,
    static_folder='static',
    template_folder='templates',
    url_prefix='/nca_simulation'
)

from . import nca_simulation