# Architecture d'Authentification & Contrôle d'Accès — Membre 5

Ce document détaille la sécurité applicative, la gestion des sessions et la séparation stricte des privilèges entre le portail citoyen et le cockpit des opérations municipales.

---

## 1. Principes de Sécurité

1. **Aucun Secret en Dur dans le Code Frontend :**  
   Le jeton d'accès n'est jamais codé en dur dans les fichiers TypeScript ou React. Il est exclusivement lu depuis la variable d'environnement serveur `STAFF_AUTH_TOKEN`.
2. **Cloisonnement Strict Citoyen vs. Agent Municipal :**
   - Le citoyen peut librement déposer des signalements (`POST /api/reports`), téléverser des preuves (`POST /api/upload`) et consulter le statut de son dossier (`GET /api/reports/:id`).
   - Toutes les actions de gestion (mise à jour de statut, arbitrage de la modération, modification du mode n8n) requièrent impérativement une authentification agent.
3. **Protection des Preuves Photographiques Citoyennes :**
   - Les photos brutes stockées dans `uploads/raw/` ne sont jamais exposées publiquement (`HTTP 401 Unauthorized`).
   - Les photos publiques doivent être certifiées anonymisées (`safe/`). En l'absence de floutage, l'accès est bloqué avec `HTTP 403 Forbidden` (`VISUAL_ANONYMIZATION_UNAVAILABLE`).

---

## 2. Mécanisme d'Authentification des Agents Municipaux

### 2.1. Le Jeton Bearer d'Environnement
- Configuré dans `apps/backend/.env` via la variable `STAFF_AUTH_TOKEN` (par exemple : `municipal-staff-secret-2026`).
- Transmis par les clients autorisés dans l'en-tête HTTP :
  ```http
  Authorization: Bearer municipal-staff-secret-2026
  ```

### 2.2. Endpoints d'Authentification Dédiés

#### Connexion d'un Agent : `POST /api/auth/login`
- **Body :**
  ```json
  {
    "token": "municipal-staff-secret-2026"
  }
  ```
- **Réponse Succès (`HTTP 200 OK`) :**
  ```json
  {
    "success": true,
    "role": "MUNICIPAL_STAFF",
    "token": "municipal-staff-secret-2026",
    "message": "Authentification réussie. Session active pour les opérations municipales."
  }
  ```
- **Échec (`HTTP 401 Unauthorized`) :**
  ```json
  {
    "error": "UNAUTHORIZED",
    "message": "Jeton d'authentification invalide"
  }
  ```

#### Vérification de Validité de Session : `GET /api/auth/verify`
- Permet au frontend de vérifier si le jeton actuellement stocké en mémoire locale est toujours valide auprès du backend.

---

## 3. Matrice des Droits d'Accès par Endpoint

| Endpoint | Méthode | Rôle Requis | Conséquence en cas de Défaut |
|---|---|---|---|
| `/api/reports` | `POST` | Public (Citoyen) | Accessible |
| `/api/reports/:id` | `GET` | Public (Citoyen) | Accessible |
| `/api/upload` | `POST` | Public (Citoyen) | Type de fichier et taille validés |
| `/api/dashboard/stats` | `GET` | Public / Cockpit | Données agrégées réelles de la BD |
| `/api/tickets` | `GET` | Public / Cockpit | Liste des tickets persistants |
| `/api/tickets/:id` | `GET` | Public / Cockpit | Détails du ticket et événements |
| `/api/tickets/:id/status` | `PATCH` | **Agent Municipal** | **Bloqué : `HTTP 401 Unauthorized`** |
| `/api/reviews` | `GET` | **Agent Municipal** | **Bloqué : `HTTP 401 Unauthorized`** |
| `/api/reviews/:id/resolve` | `POST` | **Agent Municipal** | **Bloqué : `HTTP 401 Unauthorized`** |
| `/api/admin/set-n8n-mode` | `POST` | **Agent Municipal** | **Bloqué : `HTTP 401 Unauthorized`** |
| `/api/uploads/raw/:file` | `GET` | **Agent Municipal** | **Bloqué : `HTTP 401 Unauthorized`** |
| `/api/uploads/media/:file` | `GET` | Public (si anonymisé) | **Bloqué `HTTP 403` si non anonymisé** |
