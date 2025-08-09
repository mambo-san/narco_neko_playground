from flask import render_template, url_for
from . import community_project_bp

@community_project_bp.route('/')
def index():
    return render_template("roadmap.html")