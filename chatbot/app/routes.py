from flask import request, jsonify, Blueprint
from app.nlp_engine import detect_intent, extract_entities
from app.responses import get_response, DYNAMIC_INTENTS

router = Blueprint('chat', __name__)


@router.route("/message", methods=["POST"])
def process_message():
    """
    Process a user message:
    1. Detect intent via NLP
    2. Extract entities
    3. Generate role-aware response (static or dynamic with data)
    """
    body = request.get_json()
    message = body.get("message", "")
    user_id = body.get("userId", "")
    role = (body.get("role") or "VISITOR").upper()
    username = body.get("username", "")
    lang = body.get("lang", "fr")
    data = body.get("data")

    print(f"[CHAT] message='{message}' role={role} lang={lang} username={username} hasData={data is not None}")

    # NLP processing
    intent, confidence = detect_intent(message)
    entities = extract_entities(message)

    # Generate response (role-aware, bilingual)
    if intent in DYNAMIC_INTENTS and data:
        response_data = get_response(intent, data, role, username, lang)
    elif intent in DYNAMIC_INTENTS and not data:
        static_check = get_response(intent, role=role, username=username, lang=lang)
        if static_check.get("needsData"):
            response_data = static_check
        else:
            response_data = static_check
    else:
        response_data = get_response(intent, role=role, username=username, lang=lang)

    return jsonify({
        "intent": intent,
        "confidence": confidence,
        "reply": response_data.get("reply", ""),
        "suggestions": response_data.get("suggestions", []),
        "entities": entities,
        "needsData": response_data.get("needsData", False),
        "dataType": response_data.get("dataType"),
    })


@router.route("/intents", methods=["GET"])
def list_intents():
    """List all supported intents."""
    from app.nlp_engine import INTENT_PATTERNS
    return jsonify({"intents": list(INTENT_PATTERNS.keys()), "total": len(INTENT_PATTERNS)})
