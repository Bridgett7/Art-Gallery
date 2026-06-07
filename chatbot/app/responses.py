"""
Bilingual response generator (FR/EN).
Maps intents to response templates, role-aware and language-aware.
"""

from typing import Dict, List, Optional

# --- Bilingual text helper ---
def t(fr: str, en: str, lang: str) -> str:
    return fr if lang == "fr" else en


def get_suggestions_for_role(role: str, lang: str) -> List[str]:
    if role == "ADMIN":
        return [
            t("📊 Chiffre d'affaires", "📊 Revenue", lang),
            t("📦 Commandes en attente", "📦 Pending orders", lang),
            t("👥 Utilisateurs", "👥 Users", lang),
            t("🎫 Ventes tickets", "🎫 Ticket sales", lang),
        ]
    elif role == "ARTIST":
        return [
            t("🎨 Mes œuvres", "🎨 My artworks", lang),
            t("📅 Mon planning", "📅 My schedule", lang),
            t("📦 Mes commandes", "📦 My orders", lang),
            t("🎫 Événements", "🎫 Events", lang),
        ]
    else:
        return [
            t("🛒 Produits disponibles", "🛒 Available products", lang),
            t("🎫 Événements à venir", "🎫 Upcoming events", lang),
            t("📦 Mes commandes", "📦 My orders", lang),
            t("❓ Aide", "❓ Help", lang),
        ]


def get_response(intent: str, data: Optional[Dict] = None, role: str = "VISITOR", username: str = "", lang: str = "fr") -> Dict:
    static = _get_static_response(intent, role, username, lang)
    if static is not None:
        return static

    if data and len(data) > 0:
        return _build_dynamic_response(intent, data, role, lang)

    if intent in DYNAMIC_INTENTS:
        return {
            "reply": _get_dynamic_placeholder(intent, lang),
            "suggestions": get_suggestions_for_role(role, lang),
            "needsData": True,
            "dataType": intent
        }

    return {
        "reply": t("Je ne suis pas sûr de comprendre. 🤔", "I'm not sure I understand. 🤔", lang),
        "suggestions": get_suggestions_for_role(role, lang)
    }


DYNAMIC_INTENTS = [
    "list_artworks", "list_events", "event_ongoing", "ticket_price",
    "order_status", "list_products", "list_courses", "course_beginner",
    "planning", "my_profile", "my_notifications", "stats", "user_count"
]


def _get_static_response(intent: str, role: str, username: str, lang: str) -> Optional[Dict]:
    suggestions = get_suggestions_for_role(role, lang)

    if intent == "greeting":
        name_part = f" {username}" if username else ""
        return {
            "reply": t(
                f"Bonjour{name_part} ! 👋 Je suis l'assistant MetaMuse. Comment puis-je vous aider ?",
                f"Hello{name_part}! 👋 I'm the MetaMuse assistant. How can I help you?",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "farewell":
        return {
            "reply": t(
                "Au revoir ! N'hésitez pas à revenir. 🎨",
                "Goodbye! Don't hesitate to come back. 🎨",
                lang
            ),
            "suggestions": []
        }

    elif intent == "help":
        if role == "ADMIN":
            reply = t(
                "Voici ce que je peux faire (Admin) :\n\n• 📊 Stats globales\n• 📦 Gérer les commandes\n• 👥 Utilisateurs\n• 🎨 Artworks, événements, cours\n• 🎫 Ventes de tickets",
                "Here's what I can do (Admin):\n\n• 📊 Global stats\n• 📦 Manage orders\n• 👥 Users\n• 🎨 Artworks, events, courses\n• 🎫 Ticket sales",
                lang
            )
        elif role == "ARTIST":
            reply = t(
                "Voici ce que je peux faire (Artiste) :\n\n• 🎨 Gérer vos artworks\n• 📚 Créer des cours\n• 🎫 Créer des événements\n• 📦 Suivre vos commandes\n• 📅 Planning",
                "Here's what I can do (Artist):\n\n• 🎨 Manage your artworks\n• 📚 Create courses\n• 🎫 Create events\n• 📦 Track your orders\n• 📅 Planning",
                lang
            )
        else:
            reply = t(
                "Voici ce que je peux faire :\n\n• 🎨 Voir la galerie\n• 🎫 Événements & tickets\n• 🛒 Marketplace\n• 📦 Suivre vos commandes\n• 📚 Cours disponibles",
                "Here's what I can do:\n\n• 🎨 Browse gallery\n• 🎫 Events & tickets\n• 🛒 Marketplace\n• 📦 Track your orders\n• 📚 Available courses",
                lang
            )
        return {"reply": reply, "suggestions": suggestions}

    elif intent == "create_artwork":
        if role == "VISITOR":
            return {
                "reply": t(
                    "⚠️ La création d'artworks est réservée aux artistes et admins.",
                    "⚠️ Creating artworks is reserved for artists and admins.",
                    lang
                ),
                "suggestions": suggestions
            }
        return {
            "reply": t(
                "Pour créer un artwork :\n1. Allez dans **Artworks**\n2. Cliquez **+ Add Artwork**\n3. Remplissez les infos et uploadez une image",
                "To create an artwork:\n1. Go to **Artworks**\n2. Click **+ Add Artwork**\n3. Fill in the info and upload an image",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "buy_ticket":
        return {
            "reply": t(
                "Pour acheter un ticket :\n1. **Exhibitions** → trouvez un événement\n2. Cliquez **Acheter un ticket**",
                "To buy a ticket:\n1. **Exhibitions** → find an event\n2. Click **Buy Ticket**",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "cancel_order":
        return {
            "reply": t(
                "Vous pouvez annuler une commande en statut **En attente**.\nOrders → ouvrez la commande → **Annuler**.",
                "You can cancel an order with **Pending** status.\nOrders → open the order → **Cancel Order**.",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "download_invoice":
        return {
            "reply": t(
                "La facture est disponible après confirmation.\nOrders → ouvrez la commande → **Télécharger la facture**.",
                "The invoice is available after confirmation.\nOrders → open the order → **Download Invoice**.",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "add_to_cart":
        return {
            "reply": t(
                "**Marketplace** → cliquez **Ajouter au panier** sur un produit.",
                "**Marketplace** → click **Add to Cart** on a product.",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "change_password":
        return {
            "reply": t(
                "**Compte** → section Mot de passe → changez votre mot de passe.",
                "**Account** → Password section → change your password.",
                lang
            ),
            "suggestions": suggestions
        }

    elif intent == "stats":
        if role != "ADMIN":
            return {
                "reply": t(
                    "📊 Les stats globales sont réservées aux admins. Consultez votre Dashboard.",
                    "📊 Global stats are for admins only. Check your Dashboard.",
                    lang
                ),
                "suggestions": suggestions
            }
        return None

    elif intent == "user_count":
        if role != "ADMIN":
            return {
                "reply": t("⚠️ Information réservée aux admins.", "⚠️ Admin-only information.", lang),
                "suggestions": suggestions
            }
        return None

    elif intent == "unknown":
        return {
            "reply": t(
                "Je ne suis pas sûr de comprendre. 🤔\nEssayez : artworks, événements, commandes, cours.",
                "I'm not sure I understand. 🤔\nTry: artworks, events, orders, courses.",
                lang
            ),
            "suggestions": suggestions
        }

    return None


def _build_dynamic_response(intent: str, data: Dict, role: str, lang: str) -> Dict:
    suggestions = get_suggestions_for_role(role, lang)

    if intent == "list_artworks":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun artwork trouvé.", "No artworks found.", lang), "suggestions": suggestions}
        text = t("🎨 Artworks disponibles :\n\n", "🎨 Available artworks:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('title', '')}** — {item.get('artist', 'N/A')}\n"
        if len(items) > 5:
            text += t(f"\n... et {len(items)-5} autres.", f"\n... and {len(items)-5} more.", lang)
        return {"reply": text, "suggestions": suggestions}

    elif intent == "list_events":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun événement à venir.", "No upcoming events.", lang), "suggestions": suggestions}
        text = t("🎫 Événements à venir :\n\n", "🎫 Upcoming events:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — {item.get('startDate', '')} @ {item.get('location', '')}\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "event_ongoing":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun événement en cours.", "No ongoing events.", lang), "suggestions": suggestions}
        text = t("🎫 Événements en cours :\n\n", "🎫 Ongoing events:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — {t('jusqu au', 'until', lang)} {item.get('endDate', '')}\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "order_status":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucune commande.", "No orders.", lang), "suggestions": suggestions}
        text = t("📦 Vos commandes :\n\n", "📦 Your orders:\n\n", lang)
        for item in items[:5]:
            text += f"• #{item.get('id', '')} — {item.get('status', '')} ({item.get('total', 0):.2f} DT)\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "list_products":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun produit disponible.", "No products available.", lang), "suggestions": suggestions}
        text = t("🛒 Produits :\n\n", "🛒 Products:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — {item.get('price', 0)} DT\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "list_courses":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun cours disponible.", "No courses available.", lang), "suggestions": suggestions}
        text = t("📚 Cours :\n\n", "📚 Courses:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('title', '')}** — {item.get('level', 'N/A')} ({item.get('price', 'Free')} DT)\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "course_beginner":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun cours débutant.", "No beginner courses.", lang), "suggestions": suggestions}
        text = t("📚 Cours débutants :\n\n", "📚 Beginner courses:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('title', '')}** — {item.get('duration', '?')}h\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "planning":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucune séance planifiée.", "No sessions scheduled.", lang), "suggestions": suggestions}
        text = t("📅 Prochaines séances :\n\n", "📅 Upcoming sessions:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('course', '')}** — {item.get('startTime', '')} ({t('Salle', 'Room', lang)}: {item.get('room', 'N/A')})\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "my_profile":
        profile = data.get("profile", {})
        text = t("👤 Votre profil :\n\n", "👤 Your profile:\n\n", lang)
        text += f"• {t('Nom', 'Name', lang)} : **{profile.get('username', 'N/A')}**\n"
        text += f"• Email : {profile.get('email', 'N/A')}\n"
        text += f"• {t('Rôle', 'Role', lang)} : **{profile.get('role', 'N/A')}**\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "my_notifications":
        count = data.get("count", 0)
        if count == 0:
            return {"reply": t("✅ Aucune notification non lue.", "✅ No unread notifications.", lang), "suggestions": suggestions}
        return {"reply": t(f"🔔 Vous avez **{count}** notification(s) non lue(s).", f"🔔 You have **{count}** unread notification(s).", lang), "suggestions": suggestions}

    elif intent == "stats":
        stats = data.get("stats", {})
        if not stats:
            return {"reply": t("Aucune statistique.", "No statistics available.", lang), "suggestions": suggestions}
        text = t("📊 Statistiques :\n\n", "📊 Statistics:\n\n", lang)
        text += f"• {t('Revenue totale', 'Total revenue', lang)} : **{stats.get('totalRevenue', 0):.2f} DT**\n"
        text += f"• {t('Commandes', 'Orders', lang)} : **{stats.get('totalOrders', 0)}**\n"
        text += f"• {t('Événements', 'Events', lang)} : **{stats.get('totalEvents', 0)}**\n"
        text += f"• {t('Utilisateurs', 'Users', lang)} : **{stats.get('totalUsers', 0)}**\n"
        return {"reply": text, "suggestions": suggestions}

    elif intent == "user_count":
        count = data.get("count", 0)
        return {"reply": t(f"👥 Il y a **{count}** utilisateurs inscrits.", f"👥 There are **{count}** registered users.", lang), "suggestions": suggestions}

    elif intent == "ticket_price":
        items = data.get("items", [])
        if not items:
            return {"reply": t("Aucun événement avec billetterie.", "No events with ticketing.", lang), "suggestions": suggestions}
        text = t("🎫 Tarifs :\n\n", "🎫 Prices:\n\n", lang)
        for item in items[:5]:
            text += f"• **{item.get('name', '')}** — Visitor: {item.get('ticketPriceVisitor', 'N/A')} DT | Artist: {item.get('ticketPriceArtist', 'N/A')} DT\n"
        return {"reply": text, "suggestions": suggestions}

    return {"reply": t("Je n'ai pas pu traiter cette demande.", "I couldn't process this request.", lang), "suggestions": suggestions}


def _get_dynamic_placeholder(intent: str, lang: str) -> str:
    placeholders_fr = {
        "list_artworks": "Je cherche les artworks...",
        "list_events": "Je consulte les événements...",
        "event_ongoing": "Je vérifie les événements en cours...",
        "ticket_price": "Je cherche les tarifs...",
        "order_status": "Je vérifie vos commandes...",
        "list_products": "Je consulte le marketplace...",
        "list_courses": "Je cherche les cours...",
        "course_beginner": "Je filtre les cours débutants...",
        "planning": "Je consulte le planning...",
        "my_profile": "Je récupère vos informations...",
        "my_notifications": "Je vérifie vos notifications...",
        "stats": "Je calcule les statistiques...",
        "user_count": "Je compte les utilisateurs...",
    }
    placeholders_en = {
        "list_artworks": "Looking up artworks...",
        "list_events": "Checking events...",
        "event_ongoing": "Checking ongoing events...",
        "ticket_price": "Looking up prices...",
        "order_status": "Checking your orders...",
        "list_products": "Browsing marketplace...",
        "list_courses": "Searching courses...",
        "course_beginner": "Filtering beginner courses...",
        "planning": "Checking planning...",
        "my_profile": "Getting your info...",
        "my_notifications": "Checking notifications...",
        "stats": "Computing statistics...",
        "user_count": "Counting users...",
    }
    source = placeholders_fr if lang == "fr" else placeholders_en
    return source.get(intent, t("Traitement en cours...", "Processing...", lang))
