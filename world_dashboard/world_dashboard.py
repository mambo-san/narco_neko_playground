from flask import Blueprint, render_template, request, jsonify, current_app
from datetime import datetime, timezone
import pytz
from timezonefinder import TimezoneFinder
import json
import os

world_dashboard_bp = Blueprint(
    'world_dashboard',
    __name__,
    template_folder='templates',
    static_folder='static',
)

@world_dashboard_bp.route('/')
def index():
    current_app.logger.debug("Redirecting to world dashboard index")
    return render_template('world_dashboard.html')

@world_dashboard_bp.route('/country-click', methods=['POST'])
def country_click():
    current_app.logger.debug("Country clicked!")
    data = request.get_json()
    country_code = data.get("country")
    lat = data.get("lat")
    lon = data.get("lon")
    current_app.logger.debug(f"Country clicked: {country_code} - {lat}, {lon}")
    # Fallback/defaults
    country_info = {
        'country': 'Unknown',
        'timezone': None,
        'local_time': None,
        'offset_hours': None,
    }

    tz_name = None
    local_time = None
    offset = None

    if lat is not None and lon is not None:
        tf = TimezoneFinder()
        tz_name = tf.timezone_at(lat=lat, lng=lon)

        if tz_name:
            now_utc = datetime.now(timezone.utc)
            tz = pytz.timezone(tz_name)
            local_dt = now_utc.astimezone(tz)

            user_dt = datetime.now().astimezone()  # Local time with system timezone

            offset = round((local_dt - user_dt).total_seconds() / 3600)
            local_time = local_dt.strftime("%H:%M")

    return jsonify({
        "country": country_code,
        "timezone": tz_name,
        "local_time": local_time,
        "offset_hours": offset
    })