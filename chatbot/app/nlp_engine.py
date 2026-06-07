"""
NLP Engine: NLTK + Sentence-Transformers pipeline.

Pipeline:
1. [NLTK] Tokenization → Entity extraction (regex + POS tagging)
2. [Sentence-Transformers] Semantic intent detection via cosine similarity
3. Combined: accurate entity extraction + flexible intent understanding

Model: all-MiniLM-L6-v2 (22MB, multilingual, no GPU needed)
"""

import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from typing import Dict, List, Tuple
import re
import numpy as np

# Sentence-Transformers for semantic understanding
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize components
lemmatizer = WordNetLemmatizer()

print("[NLP] Loading sentence-transformers model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("[NLP] Model loaded.")

# --- Intent definitions with example phrases (used for embedding) ---
# Each intent has multiple example phrases that represent it.
# The model computes embeddings for these, then compares user input.
INTENT_EXAMPLES: Dict[str, List[str]] = {
    "greeting": [
        "bonjour", "salut", "hello", "hi", "hey", "bonsoir",
        "bonjour comment ça va", "salut ça va", "hello there",
    ],
    "farewell": [
        "au revoir", "bye", "à bientôt", "merci au revoir",
        "thanks bye", "bonne journée", "ciao",
    ],
    "help": [
        "aide", "help", "comment faire", "qu'est-ce que tu peux faire",
        "quelles sont tes fonctionnalités", "guide", "how does this work",
        "je ne sais pas quoi faire", "what can you do",
    ],
    "list_artworks": [
        "quels artworks sont disponibles", "montre moi les oeuvres",
        "les artworks de la galerie", "gallery artworks", "voir les oeuvres",
        "qu'est-ce qu'il y a comme art", "show me artworks", "art disponible",
    ],
    "create_artwork": [
        "créer un artwork", "ajouter une oeuvre", "comment créer une oeuvre",
        "add new artwork", "je veux publier une oeuvre", "nouvelle creation",
    ],
    "list_events": [
        "quels événements sont à venir", "les prochaines expositions",
        "upcoming events", "y a quoi comme expos", "événements disponibles",
        "prochains événements", "what events are coming", "exhibitions à venir",
    ],
    "event_ongoing": [
        "événements en cours", "expos actuelles", "ongoing events",
        "qu'est-ce qui se passe maintenant", "events happening now",
    ],
    "buy_ticket": [
        "acheter un ticket", "je veux un billet", "buy ticket",
        "réserver une place", "comment avoir un ticket", "purchase ticket",
    ],
    "ticket_price": [
        "combien coûte un ticket", "prix du billet", "ticket price",
        "tarif de l'événement", "how much is a ticket", "prix billet",
        "tarif entrée", "entrance fee", "event ticket cost",
    ],
    "order_status": [
        "où en est ma commande", "statut de ma commande", "order status",
        "suivi commande", "mes commandes", "tracking", "my orders",
    ],
    "cancel_order": [
        "annuler ma commande", "cancel order", "je veux annuler",
        "comment annuler une commande", "cancellation",
    ],
    "download_invoice": [
        "télécharger la facture", "download invoice", "ma facture",
        "obtenir le pdf", "invoice pdf", "je veux ma facture",
    ],
    "list_products": [
        "produits disponibles", "voir les produits", "marketplace",
        "qu'est-ce qu'il y a à acheter", "boutique", "shop products",
        "what products are available", "articles en vente",
    ],
    "add_to_cart": [
        "ajouter au panier", "add to cart", "mettre dans le panier",
        "je veux acheter ça", "put in cart",
    ],
    "list_courses": [
        "cours disponibles", "quels cours", "formations",
        "what courses are available", "voir les cours", "apprendre",
    ],
    "course_beginner": [
        "cours pour débutant", "beginner courses", "cours initiation",
        "je suis débutant", "cours facile", "easy courses",
    ],
    "planning": [
        "planning", "calendrier des cours", "prochaine séance",
        "schedule", "quand est le prochain cours", "next lesson",
        "séances planifiées", "lesson calendar",
    ],
    "my_profile": [
        "mon profil", "mes informations", "my profile", "my account",
        "quel est mon rôle", "voir mon compte",
    ],
    "change_password": [
        "changer mon mot de passe", "change password", "modifier password",
        "oublié mon mot de passe", "reset password",
    ],
    "my_notifications": [
        "mes notifications", "ai-je des notifications", "notifications",
        "alertes", "check notifications", "unread messages",
    ],
    "stats": [
        "statistiques", "chiffre d'affaires", "revenue total", "revenu",
        "combien on a gagné", "dashboard stats", "analytics",
        "performance", "bilan", "résultats", "chiffre affaires",
        "total revenue", "how much revenue", "earnings",
        "gains totaux", "combien a-t-on vendu", "sales report",
        "rapport de ventes", "revenue globale",
    ],
    "user_count": [
        "combien d'utilisateurs", "nombre d'inscrits", "user count",
        "how many users", "total utilisateurs",
    ],
}

# Pre-compute intent embeddings (average of all example embeddings per intent)
print("[NLP] Computing intent embeddings...")
INTENT_EMBEDDINGS: Dict[str, np.ndarray] = {}
for intent, examples in INTENT_EXAMPLES.items():
    embeddings = model.encode(examples)
    INTENT_EMBEDDINGS[intent] = np.mean(embeddings, axis=0)
print(f"[NLP] {len(INTENT_EMBEDDINGS)} intent embeddings ready.")


def detect_intent(text: str) -> Tuple[str, float]:
    """
    Detect intent using semantic similarity (sentence-transformers).
    Returns (intent_name, confidence_score 0-1).
    """
    if not text.strip():
        return "unknown", 0.0

    # Encode user message
    user_embedding = model.encode([text])[0]

    # Compute cosine similarity with each intent
    best_intent = "unknown"
    best_score = 0.0

    for intent, intent_embedding in INTENT_EMBEDDINGS.items():
        score = cosine_similarity(
            user_embedding.reshape(1, -1),
            intent_embedding.reshape(1, -1)
        )[0][0]

        if score > best_score:
            best_score = score
            best_intent = intent

    # Confidence threshold
    if best_score < 0.35:
        return "unknown", round(best_score, 2)

    return best_intent, round(float(best_score), 2)


def extract_entities(text: str) -> Dict[str, str]:
    """
    Extract entities using NLTK (regex + POS tagging).
    Handles: order IDs, amounts, dates, proper nouns.
    """
    entities = {}

    # Order ID
    order_match = re.search(r'(?:commande|order)\s*#?\s*(\d+)', text, re.IGNORECASE)
    if order_match:
        entities["order_id"] = order_match.group(1)

    # Amounts / prices
    amount_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:dt|dinar|€|eur|dinars)', text, re.IGNORECASE)
    if amount_match:
        entities["amount"] = amount_match.group(1).replace(',', '.')

    # Dates
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if date_match:
        entities["date"] = date_match.group(1)

    # Event/course name extraction (after keywords)
    name_match = re.search(r'(?:événement|event|cours|course|expo)\s+["\']?([^"\'?,]+)', text, re.IGNORECASE)
    if name_match:
        entities["name"] = name_match.group(1).strip()

    # POS tagging for proper nouns
    try:
        tokens = word_tokenize(text)
        tagged = nltk.pos_tag(tokens)
        proper_nouns = [word for word, tag in tagged if tag in ('NNP', 'NNPS')]
        if proper_nouns:
            entities["proper_nouns"] = " ".join(proper_nouns)
    except Exception:
        pass

    return entities
