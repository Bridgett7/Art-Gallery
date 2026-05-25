from flask import Flask, jsonify
from app.routes import router

app = Flask(__name__)
app.register_blueprint(router, url_prefix="/chat")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "metamuse-chatbot"})
