from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail


limiter = Limiter(key_func=get_remote_address, default_limits=["1000 per hour"], storage_uri="memory://")
mail = Mail()