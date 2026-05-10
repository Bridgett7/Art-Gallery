# MetaMuse Web — Art Gallery Management System

 Plateforme complète de gestion de galerie d'art avec e-commerce, événements, cours, forum communautaire et notifications en temps réel.

---

## Architecture

```
metamuse-web/
├── backend/          → Spring Boot 3.2.5 (Java 17) — REST API
│   ├── src/main/java/com/metamuse/
│   │   ├── controller/    → 13 REST controllers
│   │   ├── service/       → 10 services métier (IService<T>)
│   │   ├── repository/    → 18 Spring Data JPA repositories
│   │   ├── model/         → 18 entités JPA
│   │   ├── enums/         → 4 enums (UserRole, OrderStatus, EventStatus, LessonLevel)
│   │   ├── security/      → JWT auth (filter, service, config)
│   │   ├── config/        → WebSocket, Async, WebMvc, CORS
│   │   └── dto/           → DTOs (auth requests/responses)
│   └── src/main/resources/
│       └── application.yml
│
├── frontend/         → React 18 + TypeScript + Vite + Ant Design
│   ├── src/
│   │   ├── pages/         → 13 pages (Login, Register, Dashboard, etc.)
│   │   ├── layouts/       → MainLayout (sidebar + header)
│   │   ├── components/    → GlobalSearch
│   │   ├── contexts/      → AuthContext
│   │   ├── hooks/         → useNotifications (WebSocket)
│   │   └── api/           → 8 modules API (axios)
│   └── package.json
│
└── README.md
```

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Backend | Spring Boot 3.2.5, Java 17, Spring Security, Spring Data JPA |
| Frontend | React 18, TypeScript, Vite 5, Ant Design 5 |
| Base de données | MySQL 8.0+ (Hibernate auto-DDL) |
| Authentification | JWT (JJWT 0.12.5), BCrypt (cost 12) |
| Paiement | Stripe API |
| PDF | iText 8 (kernel + layout) |
| Email | Spring Mail (SMTP Gmail) |
| Temps réel | WebSocket (STOMP over SockJS) |
| Charts | Recharts |

---

## Modules & Fonctionnalités

### Authentification & Utilisateurs
- Login / Register avec validation
- Rôles : ADMIN, ARTIST, VISITOR
- Forgot Password (code par email)
- Profil utilisateur avec photo de profil
- Gestion admin des utilisateurs

### Artworks (Œuvres d'art)
- CRUD avec permissions (artiste = ses œuvres, admin = tout)
- Upload d'images
- Catégories et Catalogues
- Recherche par titre

### Exhibitions (Événements)
- CRUD avec géolocalisation
- Statut auto-mis à jour selon les dates (PUBLISHED → ONGOING → COMPLETED)
- Billetterie (achat de tickets avec prix par rôle)
- Onglet "My Tickets"

### Marketplace (Produits)
- Catalogue de produits avec images
- Ajout au panier
- Onglets "All Products" / "My Products"

### Orders (Commandes)
- Panier → Confirmation → Expédition → Livraison
- Gestion d'adresse de livraison
- Facture PDF auto-générée à la confirmation
- Téléchargement de facture in-app
- Admin : filtres avancés + changement de statut
- Notification à chaque changement de statut

### Courses & Lessons
- Catalogue de cours (All / My Courses)
- Leçons en drawer latéral par cours
- Niveaux : BEGINNER, INTERMEDIATE, ADVANCED

### Planning (Calendrier)
- Vue calendrier Ant Design
- Affiche les leçons planifiées ET les événements
- Badges colorés par statut
- Détail au clic sur un jour

### Forum
- Posts, commentaires
- Discussions, messages

### Dashboard
- Stats filtrées par rôle (Admin global, Artist/Visitor personnel)
- Revenue trend 7 jours (commandes + tickets)
- KPIs : revenue, commandes, produits, événements, cours

### Notifications
- Temps réel via WebSocket (fallback polling 30s)
- Badge compteur dans le header
- Déclenchées automatiquement (status change, ticket, invoice)
- Endpoint de test disponible

### Recherche Globale
- Barre de recherche dans le header
- Recherche cross-entités (artworks, events, products, courses)

### Paiement Stripe
- PaymentIntent pour commandes et tickets
- Mode test intégré

---

## Prérequis

- **Java 17+** (JDK)
- **Maven 3.6+**
- **Node.js 18+** et **npm**
- **MySQL 8.0+** (via XAMPP ou standalone)

---

## Configuration

### 1. Base de données

```sql
CREATE DATABASE metamuse;
```

Le schéma est auto-généré par Hibernate (`ddl-auto: update`).

### 2. Backend

Fichier : `backend/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/metamuse
    username: root
    password:        # ← ton mot de passe MySQL

  mail:
    username: ${MAIL_USERNAME}    # ← Gmail
    password: ${MAIL_PASSWORD}    # ← App password Gmail

app:
  jwt:
    secret: ${JWT_SECRET}         # ← clé secrète 64+ chars
  stripe:
    secret-key: ${STRIPE_SECRET_KEY}  # ← clé Stripe test
```

Variables d'environnement optionnelles :
- `JWT_SECRET` — clé de signature JWT
- `MAIL_USERNAME` / `MAIL_PASSWORD` — pour l'envoi d'emails
- `STRIPE_SECRET_KEY` — pour les paiements

### 3. Frontend

Le proxy Vite redirige `/api` vers `http://localhost:8080`. Aucune config supplémentaire nécessaire en dev.

---

## Lancement

### Backend

```bash
cd backend
mvn spring-boot:run
```

Le serveur démarre sur `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app est accessible sur `http://localhost:5173`.

---

## Structure des Services (Pattern IService)

Tous les services métier implémentent l'interface générique :

```java
public interface IService<T> {
    T add(T entity);
    T update(T entity);
    void delete(Long id);
    T findById(Long id);
    List<T> getAll();
}
```

Services : `ArtworkService`, `EventService`, `OrderService`, `ProductService`, `CourseService`, `UserService`, `ForumService`, `NotificationService`

Services d'infrastructure : `StripePaymentService`, `EmailService`, `InvoiceService`, `FileStorageService`, `SearchService`

---

## API Endpoints (principaux)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/login | Connexion |
| POST | /api/auth/register | Inscription |
| POST | /api/auth/forgot-password | Demande reset |
| POST | /api/auth/reset-password | Reset mot de passe |
| GET | /api/dashboard | Stats (filtrées par rôle) |
| GET/POST/PUT/DELETE | /api/artworks | CRUD artworks |
| GET/POST/PUT/DELETE | /api/events | CRUD events |
| POST | /api/events/{id}/tickets | Achat ticket |
| GET/POST/PUT/DELETE | /api/products | CRUD products |
| GET/POST/PUT/DELETE | /api/orders | CRUD orders |
| GET | /api/orders/{id}/invoice | Télécharger facture PDF |
| GET/POST/PUT/DELETE | /api/courses | CRUD courses + lessons + planning |
| GET/POST | /api/forum/* | Posts, comments, discussions |
| GET/POST | /api/notifications | Notifications |
| POST | /api/notifications/test | Test notification |
| GET | /api/search?q= | Recherche globale |
| POST | /api/payments/orders/{id}/pay | Paiement Stripe commande |
| POST | /api/files/upload | Upload fichier |

---

## Sécurité

- JWT stateless (24h expiration)
- BCrypt cost 12
- CORS configuré pour localhost:5173
- Endpoints publics : login, register, forgot/reset password, WebSocket
- Role-based : `/api/admin/**` → ADMIN only
- Permissions vérifiées dans les services (ownership checks)

### Matrice des permissions

| Action | VISITOR | ARTIST | ADMIN |
|--------|---------|--------|-------|
| Voir artworks / events / produits / cours | ✅ | ✅ | ✅ |
| Acheter produits (panier, commandes) | ✅ | ✅ | ✅ |
| Acheter tickets événements | ✅ | ✅ | ✅ |
| Voir ses propres commandes | ✅ | ✅ | ✅ |
| Annuler sa commande (PENDING) | ✅ | ✅ | ✅ |
| Télécharger sa facture | ✅ | ✅ | ✅ |
| Poster sur le forum | ✅ | ✅ | ✅ |
| Créer des artworks | ❌ | ✅ (les siens) | ✅ (tous) |
| Créer des événements | ❌ | ✅ | ✅ |
| Créer des cours / leçons | ❌ | ✅ | ✅ |
| Créer des produits | ❌ | ✅ | ✅ |
| Modifier/supprimer ses propres créations | ❌ | ✅ | ✅ |
| Modifier/supprimer toute création | ❌ | ❌ | ✅ |
| Gérer tous les utilisateurs | ❌ | ❌ | ✅ |
| Voir toutes les commandes | ❌ | ❌ | ✅ |
| Changer le statut des commandes | ❌ | ❌ | ✅ |
| Dashboard stats globales | ❌ | ❌ | ✅ |
| Dashboard stats personnelles | ✅ | ✅ | ❌ (voit global) |

---

## WebSocket

- Endpoint : `/ws` (SockJS)
- Broker : `/topic` (broadcast), `/queue` (user-specific)
- Les notifications sont pushées en temps réel via `/user/{userId}/queue/notifications`

---

## Auteurs

Projet académique — MetaMuse (Spring Boot + React)
