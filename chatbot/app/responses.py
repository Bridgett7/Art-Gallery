"""
Response generator — maps intents to response templates.
Responses are role-aware and can be static or dynamic.
"""

from typing import Dict, List, Optional


def get_suggestions_for_role(role: str) -> List[str]:
    """Get default suggestions based on user role."""
    if role == "ADMIN":
        return ["� Chiffre d'affaires", "📦 Commandes en attente", "👥 Utilisateurs", "🎫 Ventes tickets"]
    elif role == "ARTIST":
        return ["🎨 Mes œuvres", "📅 Mon planning", "📦 Mes commandes", "🎫 Événements"]
    else:  # VISITOR
        return ["🛒 Produits disponibles", "🎫 Événements à venir", "📦 Mes commandes", "❓ Aide"]


def get_response(intent: str, data: Optional[Dict] = None, role: str = "VISITOR", username: str = "") -> Dict:
    """
    Generate a response based on intent, optional data, and user role.
    """
    # Check static response first (handles role-based access control)
    static = _get_static_response(intent, role, username)

    # If static returned a response (including access denied), use it
    if static is not None:
        return static

    # Dynamic responses with actual data
    if data and len(data) > 0:
        return _build_dynamic_response(intent, data, role)

    # Dynamic intent without data — signal that we need data
    if intent in DYNAMIC_INTENTS:
        return {
            "reply": _get_dynamic_placeholder(intent),
            "suggestions": get_suggestions_for_role(role),
            "needsData": True,
            "dataType": intent
        }

    return {
        "reply": "Je ne suis pas sûr de comprendre. 🤔",
        "suggestions": get_suggestions_for_role(role)
    }


# Dynamic intents — these need data from the backend
DYNAMIC_INTENTS = [
    "list_artworks", "list_events", "event_ongoing", "ticket_price",
    "order_status", "list_products", "list_courses", "course_beginner",
    "planning", "my_profile", "my_notifications", "stats", "user_count"
]


def _get_static_response(intent: str, role: str, username: str) -> Dict:
    """Get static response adapted to user role."""

    if intent == "greeting":
        name_part = f" {username}" if username else ""
        return {
            "reply": f"Bonjour{name_part} ! 👋 Je suis l'assistant MetaMuse. Comment puis-je vous aider ?",
            "suggestions": get_suggestions_for_role(role)
        }

    elif intent == "farewell":
        return {
            "reply": "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions. 🎨",
            "suggestions": []
        }

    elif intent == "help":
        if role == "ADMIN":
            reply = ("Voici ce que je peux faire pour vous (Admin) :\n\n"
                     "• 📊 Consulter les statistiques globales\n"
                     "• 📦 Gérer toutes les commandes\n"
                     "• 👥 Voir les utilisateurs inscrits\n"
                     "• 🎨 Gérer les artworks, événements, cours\n"
                     "• 🎫 Voir les ventes de tickets\n\n"
                     "Posez-moi une question !")
        elif role == "ARTIST":
            reply = ("Voici ce que je peux faire pour vous (Artiste) :\n\n"
                     "• 🎨 Gérer vos artworks et les mettre en vente\n"
                     "• � Créer et gérer vos cours\n"
                     "• 🎫 Créer des événements\n"
                     "• 📦 Suivre vos commandes\n"
                     "• 📅 Consulter le planning\n\n"
                     "Posez-moi une question !")
        else:
            reply = ("Voici ce que je peux faire pour vous :\n\n"
                     "• 🎨 Consulter les artworks de la galerie\n"
                     "• 🎫 Voir les événements et acheter des tickets\n"
                     "• 🛒 Explorer le marketplace et acheter\n"
                     "• 📦 Suivre vos commandes\n"
                     "• 📚 Découvrir les cours disponibles\n\n"
                     "Posez-moi une question !")
        return {"reply": reply, "suggestions": get_suggestions_for_role(role)}

    elif intent == "create_artwork":
        if role == "VISITOR":
            return {
                "reply": "⚠️ La création d'artworks est réservée aux **artistes** et **admins**.\n\n"
                         "Vous pouvez consulter la galerie ou acheter des œuvres dans le marketplace.",
                "suggestions": ["🎨 Voir la galerie", "🛒 Marketplace"]
            }
        return {
            "reply": ("Pour créer un artwork :\n\n"
                      "1. Allez dans **Artworks**\n"
                      "2. Cliquez sur **+ Add Artwork**\n"
                      "3. Remplissez titre, description, année\n"
                      "4. Activez **For Sale** pour le vendre dans le marketplace\n"
                      "5. Définissez le prix et le stock"),
            "suggestions": ["🎨 Mes artworks", "🛒 Marketplace"]
        }

    elif intent == "buy_ticket":
        return {
            "reply": ("Pour acheter un ticket :\n\n"
                      "1. Allez dans **Exhibitions**\n"
                      "2. Trouvez un événement (PUBLISHED ou ONGOING)\n"
                      "3. Cliquez **Buy Ticket**\n\n"
                      f"{'Le prix Artist est appliqué pour vous.' if role == 'ARTIST' else 'Le prix Visitor sera appliqué.'}"),
            "suggestions": ["� Événements à venir", "🎫 Mes tickets"]
        }

    elif intent == "cancel_order":
        return {
            "reply": "Vous pouvez annuler une commande tant qu'elle est en statut **PENDING**.\n\n"
                     "Allez dans **Orders** → ouvrez la commande → **Cancel Order**.",
            "suggestions": ["� Mes commandes"]
        }

    elif intent == "download_invoice":
        return {
            "reply": "La facture PDF est disponible une fois la commande **confirmée**.\n\n"
                     "Orders → ouvrez la commande → **Download Invoice**.",
            "suggestions": ["📦 Mes commandes"]
        }

    elif intent == "add_to_cart":
        return {
            "reply": "Pour ajouter au panier :\n\n"
                     "1. **Marketplace** → cliquez **Add to Cart**\n"
                     "2. **Orders** pour voir votre panier et passer commande",
            "suggestions": ["🛒 Marketplace", "📦 Mes commandes"]
        }

    elif intent == "change_password":
        return {
            "reply": "Pour changer votre mot de passe :\n\n"
                     "• Connecté : **Account** → section mot de passe\n"
                     "• Oublié : **Forgot Password** sur la page de connexion",
            "suggestions": ["� Mon profil"]
        }

    elif intent == "stats":
        if role != "ADMIN":
            return {
                "reply": "📊 Les statistiques globales sont réservées aux administrateurs.\n\n"
                         "Vous pouvez voir vos propres stats dans le **Dashboard**.",
                "suggestions": ["📦 Mes commandes", "🎫 Mes tickets"]
            }
        # ADMIN: needs dynamic data
        return None

    elif intent == "user_count":
        if role != "ADMIN":
            return {
                "reply": "⚠️ Cette information est réservée aux administrateurs.",
                "suggestions": get_suggestions_for_role(role)
            }
        # ADMIN: needs dynamic data
        return None

    elif intent == "unknown":
        return {
            "reply": "Je ne suis pas sûr de comprendre. 🤔\n\n"
                     "Essayez de me demander des infos sur les artworks, événements, commandes ou cours.",
            "suggestions": get_suggestions_for_role(role)
        }

    return None


def _build_dynamic_response(intent: str, data: Dict, role: str) -> Dict:
    """Build response using data from the backend."""
    suggestions = get_suggestions_for_role(role)

    if intent == "list_artworks":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun artwork trouvé dans la galerie.", "suggestions": suggestions}
        text = "🎨 Artworks disponibles :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('title', 'Sans titre')}** — {item.get('artist', 'Inconnu')}\n"
        if len(items) > 5:
            text += f"\n... et {len(items) - 5} autres."
        return {"reply": text, "suggestions": ["🎨 Créer un artwork", "🛒 Marketplace"] if role != "VISITOR" else ["🛒 Marketplace"]}

    elif intent == "list_events":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun événement à venir pour le moment.", "suggestions": suggestions}
        text = "🎫 Événements à venir :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — {item.get('startDate', '')} à {item.get('location', '')}\n"
        return {"reply": text, "suggestions": ["🎫 Acheter un ticket", "� Planning"]}

    elif intent == "event_ongoing":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun événement en cours actuellement.", "suggestions": suggestions}
        text = "🎫 Événements en cours :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — jusqu'au {item.get('endDate', '')} à {item.get('location', '')}\n"
        return {"reply": text, "suggestions": ["🎫 Acheter un ticket"]}

    elif intent == "order_status":
        items = data.get("items", [])
        if not items:
            return {"reply": "Vous n'avez aucune commande.", "suggestions": ["🛒 Marketplace"]}
        text = "📦 Vos commandes :\n\n"
        for item in items[:5]:
            text += f"• Commande **#{item.get('id', '')}** — {item.get('status', '')} ({item.get('total', 0):.2f} DT)\n"
        return {"reply": text, "suggestions": ["� Marketplace", "📄 Télécharger facture"]}

    elif intent == "list_products":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun produit disponible.", "suggestions": suggestions}
        text = "🛒 Produits disponibles :\n\n"
        for item in items[:5]:
            stock_info = f"({item.get('stock', 0)} en stock)" if item.get('stock', 0) > 0 else "(rupture)"
            text += f"• **{item.get('name', '')}** — {item.get('price', 0)} DT {stock_info}\n"
        return {"reply": text, "suggestions": ["🛒 Ajouter au panier"]}

    elif intent == "list_courses":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun cours disponible.", "suggestions": suggestions}
        text = "📚 Cours disponibles :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('title', '')}** — {item.get('level', 'N/A')} ({item.get('price', 'Gratuit')} DT)\n"
        if role != "VISITOR":
            return {"reply": text, "suggestions": ["📚 Créer un cours", "📅 Planning"]}
        return {"reply": text, "suggestions": ["📅 Planning"]}

    elif intent == "course_beginner":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun cours débutant disponible.", "suggestions": ["📚 Tous les cours"]}
        text = "📚 Cours pour débutants :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('title', '')}** — {item.get('duration', '?')}h ({item.get('price', 'Gratuit')} DT)\n"
        return {"reply": text, "suggestions": ["📚 Tous les cours", "📅 Planning"]}

    elif intent == "planning":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucune séance planifiée.", "suggestions": suggestions}
        text = "📅 Prochaines séances :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('course', '')}** — {item.get('startTime', '')} (Salle: {item.get('room', 'N/A')})\n"
        return {"reply": text, "suggestions": ["📚 Cours"]}

    elif intent == "my_profile":
        profile = data.get("profile", {})
        text = f"👤 Votre profil :\n\n"
        text += f"• Nom : **{profile.get('username', 'N/A')}**\n"
        text += f"• Email : {profile.get('email', 'N/A')}\n"
        text += f"• Rôle : **{profile.get('role', 'N/A')}**\n"
        return {"reply": text, "suggestions": ["🔑 Changer mot de passe"]}

    elif intent == "my_notifications":
        count = data.get("count", 0)
        if count == 0:
            return {"reply": "✅ Aucune notification non lue.", "suggestions": suggestions}
        return {"reply": f"🔔 Vous avez **{count}** notification(s) non lue(s).", "suggestions": suggestions}

    elif intent == "stats":
        stats = data.get("stats", {})
        if not stats:
            return {"reply": "Aucune statistique disponible.", "suggestions": suggestions}
        text = "📊 Statistiques globales :\n\n"
        text += f"• Revenue totale : **{stats.get('totalRevenue', 0):.2f} DT**\n"
        text += f"• Commandes : **{stats.get('totalOrders', 0)}**\n"
        text += f"• Événements : **{stats.get('totalEvents', 0)}**\n"
        return {"reply": text, "suggestions": ["👥 Utilisateurs", "📦 Commandes"]}

    elif intent == "user_count":
        count = data.get("count", 0)
        if count == 0 and not data:
            return {"reply": "Information non disponible.", "suggestions": suggestions}
        return {"reply": f"👥 Il y a **{count}** utilisateurs inscrits.", "suggestions": ["📊 Stats"]}

    elif intent == "ticket_price":
        items = data.get("items", [])
        if not items:
            return {"reply": "Aucun événement avec billetterie trouvé.", "suggestions": suggestions}
        text = "🎫 Tarifs :\n\n"
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — Visitor: {item.get('ticketPriceVisitor', 'N/A')} DT | Artist: {item.get('ticketPriceArtist', 'N/A')} DT\n"
        return {"reply": text, "suggestions": ["🎫 Acheter un ticket"]}

    return {"reply": "Je n'ai pas pu traiter cette demande.", "suggestions": suggestions}


def _get_dynamic_placeholder(intent: str) -> str:
    """Placeholder messages for dynamic intents."""
    placeholders = {
        "list_artworks": "Je cherche les artworks disponibles...",
        "list_events": "Je consulte les événements à venir...",
        "event_ongoing": "Je vérifie les événements en cours...",
        "ticket_price": "Je cherche les tarifs...",
        "order_status": "Je vérifie vos commandes...",
        "list_products": "Je consulte le marketplace...",
        "list_courses": "Je cherche les cours disponibles...",
        "course_beginner": "Je filtre les cours débutants...",
        "planning": "Je consulte le planning...",
        "my_profile": "Je récupère vos informations...",
        "my_notifications": "Je vérifie vos notifications...",
        "stats": "Je calcule les statistiques...",
        "user_count": "Je compte les utilisateurs...",
    }
    return placeholders.get(intent, "Traitement en cours...")
