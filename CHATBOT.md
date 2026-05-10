# MetaMuse Chatbot — Spécification

## Objectif

Assistant IA intégré à la plateforme MetaMuse qui aide les utilisateurs à naviguer, découvrir du contenu, gérer leurs commandes et obtenir des informations sur la galerie. Le chatbot est contextuel : il a accès aux données de l'application pour fournir des réponses personnalisées.

---

## Architecture Technique

### Backend
- **Service** : `ChatService` — orchestre les requêtes, accède aux données, appelle le LLM
- **Controller** : `ChatController` — endpoint REST `/api/chat`
- **Modèle** : `ChatMessage` — historique des conversations (persisté en base)
- **LLM** : OpenAI GPT-4o (ou Mistral/LLaMA en alternative open source)

### Frontend
- **Composant** : Widget flottant (bulle en bas à droite)
- **UI** : Drawer ou popup avec historique de conversation
- **Suggestions** : Boutons cliquables de questions fréquentes

### Intégration
- Le chatbot a accès en lecture aux données de l'utilisateur connecté (commandes, tickets, profil)
- Il peut interroger les entités publiques (artworks, events, courses, products)
- Il ne peut PAS modifier de données (lecture seule)

---

## Types de Questions Supportées

### 1. Navigation & Aide Générale

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Comment créer un compte ?" | "Cliquez sur Register depuis la page de connexion. Choisissez votre rôle (Visitor ou Artist), remplissez vos informations et validez." |
| "Comment changer mon mot de passe ?" | "Allez dans votre profil (Account) et utilisez la section 'Change Password'. Vous pouvez aussi utiliser 'Forgot Password' depuis la page de connexion." |
| "Quels sont les rôles disponibles ?" | "Il y a 3 rôles : Visitor (achat, consultation), Artist (création de contenu + achat), Admin (gestion complète)." |
| "Comment contacter le support ?" | "Vous pouvez poster dans le Forum ou envoyer un message dans les Discussions." |

### 2. Artworks & Galerie

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Quels artworks sont disponibles ?" | Liste les artworks récents avec titre, artiste et catégorie. |
| "Montre-moi les œuvres de [artiste]" | Filtre et affiche les œuvres de cet artiste. |
| "Quelles catégories d'art existent ?" | Liste les catégories disponibles (peinture, sculpture, etc.) |
| "Comment ajouter une œuvre ?" | "En tant qu'artiste, allez dans Artworks et cliquez 'Add'. Remplissez le titre, description, année et uploadez une image." |

### 3. Exhibitions & Événements

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Quels événements sont à venir ?" | Liste les événements PUBLISHED avec dates et lieu. |
| "Y a-t-il des événements en cours ?" | Liste les événements ONGOING. |
| "Combien coûte un ticket pour [événement] ?" | Affiche le prix visitor et artist pour cet événement. |
| "Comment acheter un ticket ?" | "Allez dans Exhibitions, trouvez l'événement et cliquez 'Buy Ticket'. Le prix dépend de votre rôle." |
| "Combien de places restent pour [événement] ?" | Calcule capacité - tickets vendus. |

### 4. Marketplace & Commandes

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Quels produits sont en stock ?" | Liste les produits avec stock > 0. |
| "Où en est ma commande ?" | Affiche le statut de la dernière commande de l'utilisateur. |
| "Combien j'ai dépensé au total ?" | Calcule le total des commandes DELIVERED. |
| "Comment passer commande ?" | "Ajoutez des produits au panier depuis le Marketplace, puis allez dans Orders et cliquez 'Place Order'." |
| "Puis-je annuler ma commande ?" | "Oui, tant qu'elle est en statut PENDING. Allez dans Orders et cliquez 'Cancel Order'." |
| "Comment télécharger ma facture ?" | "Dans le détail de votre commande (statut CONFIRMED ou plus), cliquez 'Download Invoice'." |

### 5. Cours & Planning

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Quels cours sont disponibles ?" | Liste les cours avec niveau et prix. |
| "Y a-t-il des cours pour débutants ?" | Filtre les cours BEGINNER. |
| "Quand est le prochain cours planifié ?" | Cherche dans le planning la prochaine séance SCHEDULED. |
| "Comment créer un cours ?" | "En tant qu'artiste, allez dans Courses > My Courses et cliquez 'Add Course'. Ajoutez ensuite des leçons." |

### 6. Compte & Profil

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Quel est mon rôle ?" | Affiche le rôle de l'utilisateur connecté. |
| "Combien de tickets j'ai achetés ?" | Compte les tickets de l'utilisateur. |
| "Montre-moi mes notifications" | Résume les notifications non lues. |
| "Comment changer ma photo de profil ?" | "Allez dans Account/Profile et cliquez sur l'avatar pour uploader une nouvelle photo." |

### 7. Statistiques (Admin)

| Question utilisateur | Réponse attendue |
|---------------------|------------------|
| "Quel est le chiffre d'affaires total ?" | Affiche totalRevenue (commandes + tickets). |
| "Combien de commandes sont en attente ?" | Compte les commandes PENDING. |
| "Combien d'utilisateurs sont inscrits ?" | Affiche le nombre total d'utilisateurs. |
| "Quel événement a le plus de ventes ?" | Trouve l'événement avec le plus de tickets vendus. |

---

## Suggestions Affichées (Boutons Cliquables)

### Pour VISITOR
- "📦 Où en est ma commande ?"
- "🎫 Événements à venir"
- "🛒 Produits populaires"
- "📚 Cours disponibles"
- "❓ Comment acheter un ticket ?"

### Pour ARTIST
- "🎨 Mes œuvres"
- "📅 Mon prochain cours planifié"
- "📦 Mes commandes"
- "🎫 Événements à venir"
- "➕ Comment créer un cours ?"

### Pour ADMIN
- "📊 Chiffre d'affaires"
- "📦 Commandes en attente"
- "👥 Nombre d'utilisateurs"
- "🎫 Ventes de tickets aujourd'hui"
- "📈 Tendance des revenus"

---

## Format des Réponses

Le chatbot répond en :
- **Texte court** pour les questions simples
- **Listes formatées** pour les résultats multiples (max 5 items, avec lien "voir plus")
- **Cartes résumées** pour les entités (artwork, event, order) avec infos clés
- **Actions suggérées** : boutons pour naviguer vers la page concernée

---

## Historique & Contexte

- Les conversations sont persistées par utilisateur
- Le chatbot garde le contexte de la session (dernières 10 messages)
- L'utilisateur peut effacer son historique
- Le chatbot connaît le rôle et le nom de l'utilisateur

---

## Limites

- Le chatbot ne peut PAS créer, modifier ou supprimer des données
- Il ne donne PAS de conseils financiers ou juridiques
- Il redirige vers le forum pour les questions hors-scope
- Réponses limitées au domaine MetaMuse (galerie d'art, commandes, événements)

---

## Endpoint API

```
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Quels événements sont à venir ?",
  "sessionId": "optional-session-id"
}

Response:
{
  "reply": "Voici les événements à venir : ...",
  "suggestions": ["🎫 Acheter un ticket", "📅 Voir le planning"],
  "data": [...],  // optional structured data
  "sessionId": "abc123"
}
```

---

## Implémentation Prévue

1. **Phase 1** : Chatbot rule-based (pattern matching sur les questions fréquentes)
2. **Phase 2** : Intégration LLM (OpenAI/Mistral) avec RAG sur les données de l'app
3. **Phase 3** : Actions conversationnelles (acheter un ticket via le chat, etc.)
