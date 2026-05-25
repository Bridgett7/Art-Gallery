"""
NLP Engine using NLTK for intent detection and entity extraction.
Pipeline: Tokenization → Stopword removal → Lemmatization → Intent classification
"""

import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from typing import Dict, List, Tuple
import re

# Initialize NLTK components
lemmatizer = WordNetLemmatizer()

try:
    stop_words_fr = set(stopwords.words('french'))
except LookupError:
    stop_words_fr = set()

try:
    stop_words_en = set(stopwords.words('english'))
except LookupError:
    stop_words_en = set()

STOP_WORDS = stop_words_fr | stop_words_en

# Intent patterns — keywords and phrases mapped to intents
INTENT_PATTERNS: Dict[str, List[str]] = {
    "greeting": ["bonjour", "salut", "hello", "hi", "hey", "bonsoir", "coucou"],
    "farewell": ["au revoir", "bye", "bientot", "merci", "thanks", "thank"],
    "help": ["aide", "help", "comment", "how", "quoi faire", "guide", "fonctionnalite"],

    # Artworks
    "list_artworks": ["artwork", "oeuvre", "galerie", "gallery", "art disponible", "artworks"],
    "create_artwork": ["creer artwork", "ajouter oeuvre", "add artwork", "nouvelle oeuvre", "creer oeuvre"],

    # Events
    "list_events": ["evenement", "event", "exhibition", "exposition", "venir", "upcoming", "evenements"],
    "event_ongoing": ["en cours", "ongoing", "maintenant", "now", "actuel"],
    "buy_ticket": ["ticket", "billet", "acheter ticket", "buy ticket", "reserver"],
    "ticket_price": ["prix ticket", "combien coute", "ticket price", "tarif", "prix evenement"],

    # Orders
    "order_status": ["commande", "order", "statut", "status", "suivi", "tracking", "commandes"],
    "cancel_order": ["annuler", "cancel", "annulation", "annuler commande"],
    "download_invoice": ["facture", "invoice", "telecharger", "download", "pdf"],

    # Marketplace
    "list_products": ["produit", "product", "marketplace", "boutique", "shop", "stock", "produits"],
    "add_to_cart": ["panier", "cart", "ajouter panier", "add cart"],

    # Courses
    "list_courses": ["cours", "course", "formation", "apprendre", "learn", "courses"],
    "course_beginner": ["debutant", "beginner", "initiation"],

    # Planning
    "planning": ["planning", "calendrier", "schedule", "seance", "next lesson", "prochaine"],

    # Account
    "my_profile": ["profil", "profile", "compte", "account", "role"],
    "change_password": ["mot de passe", "password", "changer password"],
    "my_notifications": ["notification", "alerte", "alert", "notifications"],

    # Stats (admin)
    "stats": ["statistique", "stats", "chiffre affaire", "revenue", "revenu"],
    "user_count": ["utilisateur", "user", "inscrit", "combien utilisateur"],
}


def preprocess(text: str) -> List[str]:
    """
    NLP preprocessing pipeline:
    1. Lowercase
    2. Remove accents for matching
    3. Tokenize
    4. Remove stopwords
    5. Lemmatize
    """
    # Normalize
    text_clean = text.lower().strip()
    # Remove accents for better matching
    text_normalized = _remove_accents(text_clean)

    # Tokenize
    try:
        tokens = word_tokenize(text_normalized, language='french')
    except LookupError:
        tokens = word_tokenize(text_normalized)

    # Remove stopwords and punctuation
    tokens = [t for t in tokens if t.isalnum() and t not in STOP_WORDS and len(t) > 1]

    # Lemmatize
    tokens = [lemmatizer.lemmatize(t) for t in tokens]

    return tokens


def detect_intent(text: str) -> Tuple[str, float]:
    """
    Detect the user's intent using NLP preprocessing + keyword matching with scoring.
    Returns (intent_name, confidence_score).
    """
    tokens = preprocess(text)
    text_lower = _remove_accents(text.lower())

    best_intent = "unknown"
    best_score = 0.0

    for intent, keywords in INTENT_PATTERNS.items():
        score = 0.0

        for keyword in keywords:
            keyword_normalized = _remove_accents(keyword)

            # Exact phrase match in original text (highest weight)
            if keyword_normalized in text_lower:
                score += 0.5 * len(keyword_normalized.split())

            # Token-level match
            keyword_tokens = keyword_normalized.split()
            matched_tokens = sum(1 for kt in keyword_tokens if kt in tokens)
            if matched_tokens > 0:
                score += 0.3 * (matched_tokens / len(keyword_tokens))

        if score > best_score:
            best_score = score
            best_intent = intent

    # Normalize confidence to 0-1
    confidence = min(best_score, 1.0)

    # Fallback: question detection
    if confidence < 0.2:
        if any(w in text_lower for w in ["comment", "how", "quoi", "what", "ou", "where", "pourquoi", "why"]):
            return "help", 0.3
        if any(w in text_lower for w in ["combien", "how much", "prix", "price", "cout"]):
            return "ticket_price", 0.3

    return best_intent, round(confidence, 2)


def extract_entities(text: str) -> Dict[str, str]:
    """
    Extract entities from user message using regex patterns and POS tagging.
    """
    entities = {}

    # Extract order ID
    order_match = re.search(r'(?:commande|order)\s*#?\s*(\d+)', text, re.IGNORECASE)
    if order_match:
        entities["order_id"] = order_match.group(1)

    # Extract numbers (prices, quantities)
    number_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:dt|dinar|€|eur)', text, re.IGNORECASE)
    if number_match:
        entities["amount"] = number_match.group(1)

    # Extract dates
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
    if date_match:
        entities["date"] = date_match.group(1)

    # POS tagging for proper nouns (names, places)
    try:
        tokens = word_tokenize(text)
        tagged = nltk.pos_tag(tokens)
        proper_nouns = [word for word, tag in tagged if tag in ('NNP', 'NNPS')]
        if proper_nouns:
            entities["name"] = " ".join(proper_nouns)
    except Exception:
        pass

    return entities


def _remove_accents(text: str) -> str:
    """Remove French accents for better keyword matching."""
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'î': 'i', 'ï': 'i',
        'ô': 'o', 'ö': 'o',
        'ç': 'c',
    }
    for accent, replacement in replacements.items():
        text = text.replace(accent, replacement)
    return text
