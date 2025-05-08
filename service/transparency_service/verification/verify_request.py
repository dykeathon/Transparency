from google.oauth2 import id_token
from google.auth.transport import requests
from flask import Flask, request, jsonify

CLIENT_ID = "142254257490-e9a9pqk1kkpq999tll0hqlt51g27d1dg.apps.googleusercontent.com"

app = Flask(__name__)

@app.route('/api/verify', methods=['POST'])
def secure_data():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Unauthorized"}), 401

    token = auth_header.split("Bearer ")[-1]

    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        user_email = idinfo['email']
        return jsonify({"message": f"valid user, {user_email}!"})
    except ValueError:
        return jsonify({"error": "Invalid token"}), 401
