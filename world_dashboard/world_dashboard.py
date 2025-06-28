from flask import Blueprint, render_template, request, jsonify, current_app
import requests
from datetime import datetime, timezone
import pytz
from timezonefinder import TimezoneFinder
import json
import os
from pathlib import Path

world_dashboard_bp = Blueprint(
    'world_dashboard',
    __name__,
    template_folder='templates',
    static_folder='static',
)

#Keep a cache of the ISO numeric to country mapping
_iso_cache = None
iso_json_path = Path(__file__).parent / "static" / "isoNumericToCountry.json"

def get_country_iso():
    global _iso_cache
    if _iso_cache is None:
        with open(iso_json_path, "r", encoding="utf-8") as f:
            _iso_cache = json.load(f)
    return _iso_cache



@world_dashboard_bp.route('/')
def index():
    current_app.logger.debug("Redirecting to world dashboard index")
    return render_template('world_dashboard.html')

@world_dashboard_bp.route('/country/info', methods=['POST'])
def get_country_info():
    data = request.get_json()
    numeric_code = str(data.get("country"))
    country_info = get_country_iso().get(numeric_code)
    return jsonify(country_info or {})

@world_dashboard_bp.route('/country/time', methods=['POST'])
def get_time_info():
    data = request.get_json()
    lat, lon = data.get("lat"), data.get("lon")
    response = {"local_time": None, "offset_hours": None, "timezone": None}

    if lat is not None and lon is not None:
        tf = TimezoneFinder()
        tz_name = tf.timezone_at(lat=lat, lng=lon)
        if tz_name:
            now_utc = datetime.now(timezone.utc)
            tz = pytz.timezone(tz_name)
            local_dt = now_utc.astimezone(tz)
            user_dt = datetime.now().astimezone()
            offset = round((local_dt - user_dt).total_seconds() / 3600)
            response.update({
                "local_time": local_dt.strftime("%H:%M"),
                "offset_hours": offset,
                "timezone": tz_name
            })
    return jsonify(response)

@world_dashboard_bp.route('/country/holidays', methods=['POST'])
def get_holidays():
    data = request.get_json()
    country_code = str(data.get("country"))
    
    country_info = get_country_iso().get(country_code)
    alpha2 = country_info.get("alpha2") if country_info else None

    holidays = []
    if alpha2:
        try:
            year = datetime.now().year
            r = requests.get(f"https://date.nager.at/api/v3/PublicHolidays/{year}/{alpha2}")
            if r.status_code == 200:
                today = datetime.now().date()
                holidays = [
                    {"date": h["date"], "name": h["name"]}
                    for h in r.json()
                    if datetime.fromisoformat(h["date"]).date()
                ][:5]
        except Exception as e:
            current_app.logger.warning(f"Holiday fetch failed: {e}")

    return jsonify(holidays)



@world_dashboard_bp.route('/country/wiki', methods=['POST'])
def get_wiki_summary():
    data = request.get_json()
    numeric_code = str(data.get("country"))
    country_info = get_country_iso().get(numeric_code)
    country_name = country_info.get("name") if country_info else None
    
    current_app.logger.debug(f"Fetching wiki summary for country: {country_name}")  

    if not country_name:
        return jsonify({"error": "Unknown country"}), 400

    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{country_name}"
        response = requests.get(url)
        response.raise_for_status()
        summary = response.json()
        return jsonify({
            "title": summary.get("title"),
            "extract": summary.get("extract"),
            "image": summary.get("thumbnail", {}).get("source"),
            "url": summary.get("content_urls", {}).get("desktop", {}).get("page")
        })
    except Exception as e:
        current_app.logger.warning(f"Wiki fetch failed: {e}")
        return jsonify({"error": "Failed to fetch Wikipedia data"}), 500