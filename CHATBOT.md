# MetaMuse Chatbot — Architecture & NLP Pipeline

## Vue d'ensemble

Le chatbot MetaMuse est un assistant conversationnel intégré à la plateforme. Il combine deux approches NLP complémentaires :

- **NLTK** pour l'extraction structurée d'entités (regex, POS tagging)
- **Sentence-Transformers** pour la compréhension sémantique des intentions (embeddings)

Le chatbot est bilingue (FR/EN), contextuel (adapté au rôle utilisateur) et connecté aux données live de l'application.

---

## Architecture Technique

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  ChatWidget.tsx → POST /chat {message, lang, role}      │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  CHATBOT API (Flask :5000)               │
│                                                         │
│  routes.py → nlp_engine.py → responses.py               │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP (si données live nécessaires)
                             ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Spring Boot :8080)                │
│  /api/artworks, /api/events, /api/orders, etc.          │
└─────────────────────────────────────────────────────────┘
```

---

## Pipeline NLP — Étape par étape

```
        ┌────────────────────────────────┐
        │        Message Utilisateur      │
        │  "Quel est le chiffre d'affaires ?"  │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   1. EXTRACTION D'ENTITÉS      │
        │         (NLTK)                 │
        │                                │
        │  • Tokenisation (word_tokenize)│
        │  • Regex: commande #123,       │
        │    montants (20.5 DT),         │
        │    dates (12/06/2026)          │
        │  • POS Tagging: noms propres   │
        │                                │
        │  Résultat: {order_id: "123"}   │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   2. ENCODAGE SÉMANTIQUE       │
        │   (Sentence-Transformers)      │
        │                                │
        │  Modèle: all-MiniLM-L6-v2     │
        │  • 22 Mo, pas de GPU requis    │
        │  • Multilingue (FR/EN/+)       │
        │  • Encode en vecteur 384 dims  │
        │                                │
        │  "chiffre d'affaires" →        │
        │  [0.12, -0.34, 0.56, ...]     │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   3. DÉTECTION D'INTENT        │
        │     (Cosine Similarity)        │
        │                                │
        │  Compare le vecteur du message │
        │  avec les embeddings pré-      │
        │  calculés de chaque intent     │
        │                                │
        │  stats:         0.89 ← BEST    │
        │  ticket_price:  0.42           │
        │  list_orders:   0.31           │
        │  greeting:      0.08           │
        │                                │
        │  Seuil: > 0.35 = match        │
        │  Résultat: intent="stats"      │
        │            confiance=0.89      │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   4. GÉNÉRATION DE RÉPONSE     │
        │     (Response Generator)       │
        │                                │
        │  • Vérifie le rôle (ADMIN?)    │
        │  • Intent statique ou          │
        │    dynamique ?                 │
        │  • Si dynamique → appelle      │
        │    l'API backend pour les      │
        │    données live                │
        │  • Génère la réponse dans la   │
        │    langue demandée (FR/EN)     │
        │  • Ajoute des suggestions      │
        │    cliquables                  │
        │                                │
        │  Résultat:                     │
        │  "📊 Statistiques :            │
        │   • Revenue: 1250.00 DT       │
        │   • Commandes: 23             │
        │   • Événements: 5"            │
        └────────────────────────────────┘
```

---

## Pourquoi combiner NLTK + Transformers ?

| Composant | Rôle | Forces |
|-----------|------|--------|
| **NLTK** | Extraction d'entités | Regex précis pour IDs, montants, dates. POS tagging pour noms propres. Rapide, déterministe. |
| **Sentence-Transformers** | Compréhension d'intention | Comprend les synonymes et reformulations. "Y a quoi comme expos ?" = "Quels événements sont à venir ?". Multilingue natif. |

### Exemple de complémentarité

Message : "Où en est ma commande #456 ?"

1. **NLTK** extrait : `{order_id: "456"}` (regex)
2. **Transformers** détecte : `intent = "order_status"` (cosine 0.91)
3. **Response** utilise l'ID 456 pour appeler `/api/orders/456` et retourner le statut réel

---

## Intents Supportés (20+)

| Catégorie | Intents | Exemples |
|-----------|---------|----------|
| Général | `greeting`, `farewell`, `help` | "Bonjour", "Au revoir", "Aide" |
| Artworks | `list_artworks`, `create_artwork` | "Quels artworks ?", "Créer une œuvre" |
| Événements | `list_events`, `event_ongoing`, `buy_ticket`, `ticket_price` | "Expos à venir", "Acheter un ticket" |
| Commandes | `order_status`, `cancel_order`, `download_invoice` | "Ma commande", "Annuler", "Facture" |
| Marketplace | `list_products`, `add_to_cart` | "Produits dispo", "Ajouter au panier" |
| Cours | `list_courses`, `course_beginner`, `planning` | "Cours débutant", "Planning" |
| Compte | `my_profile`, `change_password`, `my_notifications` | "Mon profil", "Mes notifications" |
| Admin | `stats`, `user_count` | "Chiffre d'affaires", "Nombre d'utilisateurs" |

---

## Embeddings pré-calculés

Au démarrage du chatbot :
1. Chaque intent a 6-10 phrases exemples
2. Le modèle encode chaque phrase en vecteur 384D
3. On calcule la **moyenne** des vecteurs par intent → 1 embedding représentatif par intent
4. Ces embeddings sont stockés en mémoire (pas de BDD nécessaire)

```python
# Exemple simplifié
INTENT_EXAMPLES = {
    "stats": [
        "chiffre d'affaires", "revenue total", "combien on a gagné",
        "statistiques", "analytics", "bilan des ventes"
    ]
}
# → embedding["stats"] = mean(encode(examples)) → vecteur [384 dims]
```

---

## Gestion des rôles

Le chatbot adapte ses réponses selon le rôle :

| Intent | VISITOR | ARTIST | ADMIN |
|--------|---------|--------|-------|
| `stats` | ⚠️ "Réservé aux admins" | ⚠️ "Réservé aux admins" | 📊 Stats complètes |
| `create_artwork` | ⚠️ "Réservé aux artistes" | ✅ Instructions | ✅ Instructions |
| `list_events` | ✅ Liste publique | ✅ Liste publique | ✅ Liste publique |
| `order_status` | ✅ Ses commandes | ✅ Ses commandes | ✅ Toutes les commandes |

---

## Bilingue FR/EN

Le frontend envoie `lang: "fr"` ou `lang: "en"` basé sur la langue de l'interface (i18next).

```python
# Helper de traduction
def t(fr: str, en: str, lang: str) -> str:
    return fr if lang == "fr" else en

# Usage
reply = t("Aucun événement à venir.", "No upcoming events.", lang)
```

Toutes les réponses, suggestions et messages d'erreur sont disponibles dans les deux langues.

---

## Données Live (Dynamic Intents)

Certains intents nécessitent des données fraîches de l'application :

```
User: "Quels événements sont à venir ?"
  → intent: list_events (dynamique)
  → Frontend appelle /api/events/upcoming
  → Renvoie les données au chatbot
  → Chatbot formate la réponse avec les vrais événements
```

**Flow complet pour un intent dynamique :**
1. User envoie message → Chatbot détecte intent `list_events`
2. Chatbot retourne `{needsData: true, dataType: "list_events"}`
3. Frontend appelle l'API Spring Boot correspondante
4. Frontend renvoie les données au chatbot
5. Chatbot génère la réponse formatée avec les données réelles

---

## Fichiers du projet

| Fichier | Rôle |
|---------|------|
| `app/nlp_engine.py` | Pipeline NLP (tokenisation, embeddings, cosine similarity) |
| `app/responses.py` | Génération de réponses bilingues, role-aware |
| `app/routes.py` | Endpoints Flask API |
| `app/main.py` | Configuration Flask |
| `setup.py` | Installation initiale (NLTK data + modèle) |
| `run.py` | Point d'entrée |
| `requirements.txt` | Dépendances Python |

---

## API Endpoint

```
POST http://localhost:5000/chat/message
Content-Type: application/json

{
  "message": "Quels événements sont à venir ?",
  "userId": "USR123",
  "role": "VISITOR",
  "username": "Alice",
  "lang": "fr",
  "data": null
}

→ Response:
{
  "intent": "list_events",
  "confidence": 0.87,
  "reply": "🎫 Événements à venir :\n• Event1 — 2026-06-15 @ Tunis\n• Event2 — ...",
  "suggestions": ["🎫 Acheter un ticket", "📅 Planning"],
  "entities": {},
  "needsData": false,
  "dataType": null
}
```

---

## Installation & Lancement

```bash
cd chatbot

# 1. Environnement virtuel (recommandé)
py -3.12 -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# 2. Dépendances
pip install -r requirements.txt

# 3. Setup initial (NLTK data + télécharge le modèle 22Mo)
python setup.py

# 4. Lancer
python run.py
# → http://localhost:5000
# → Health check: GET http://localhost:5000/health
```

---

## Performance

- **Temps de réponse** : ~50-100ms par message (CPU)
- **Mémoire** : ~200 Mo (modèle chargé en RAM)
- **Précision** : ~85-90% sur les intents testés
- **Seuil de confiance** : 0.35 (en dessous → "unknown")
- **Pas de GPU requis** — fonctionne sur un laptop standard
