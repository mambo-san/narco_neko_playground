from flask import Blueprint, render_template, current_app, request, flash, redirect, url_for
from flask_mail import Message
from extensions import mail 

home_bp = Blueprint('home', __name__)

_cached_projects = None

@home_bp.route('/')
def index():
	global _cached_projects
	if _cached_projects is None:
		_cached_projects = current_app.config['MINI_PROJECTS']
	return render_template('index.html', projects=_cached_projects, my_email = current_app.config.get('MAIL_DEFAULT_SENDER'))

@home_bp.route('/submit_contact', methods=['POST'])
def submit_contact():
    name = request.form.get('name')
    email = request.form.get('email')
    message = request.form.get('message')

    if not (name and email and message):
        flash("All fields are required.", "error")
        return redirect('/')

    print(f"[Contact Form] {name} ({email}) said: {message}")
    print("Default sender is:", current_app.config.get('MAIL_DEFAULT_SENDER'))
    try:
        msg = Message(subject=f"[NNP:Contact] from {name}",
                      sender=current_app.config['MAIL_DEFAULT_SENDER'],
                      recipients=[current_app.config['MAIL_USERNAME']],
                      body=f"From: {name} <{email}>\n\n{message}")

        mail.send(msg)
        flash("Thanks for reaching out! I’ll get back to you soon.", "success")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR]Mail error: {e}")
        flash("Oops. Message failed to send.", "error")

    return redirect('/')



@home_bp.route('/action2')
def action2():
    print("Button 2 clicked")
    return redirect(url_for('welcome'))



################### Error handler 
@home_bp.errorhandler(429)
def rate_limit_exceeded(e):
    return render_template("too_many_requests.html", error=e), 429





