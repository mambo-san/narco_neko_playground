from flask import Blueprint

community_project_bp = Blueprint(
    'community_project',
    __name__,
    static_folder='static',
    template_folder='templates',
    url_prefix='/community_project'
)

from . import community_project