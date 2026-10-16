# Guide de Configuration de l'Environnement Local — Membre 5

Ce document permet à n'importe quel membre de l'équipe ou correcteur d'installer et d'exécuter localement la plateforme complète de Membre 5 sur une machine Windows, macOS ou Linux/WSL.

---

## 1. Prérequis Système

- **Node.js :** Version 18.x ou 20.x LTS
- **npm :** Version 9.x ou supérieure
- **PostgreSQL :** Version 14 (ou compatible 15/16)
- **Git :** Pour cloner et gérer les versions
- **Navigateur Web Moderne :** Chrome, Firefox, Safari ou Edge

---

## 2. Configuration de la Base de Données PostgreSQL

### 2.1. Création de la Base de Données
Dans votre terminal PostgreSQL (`psql` ou pgAdmin) :
```sql
CREATE DATABASE municipal_tickets;
```

### 2.2. Exécution du Schéma DDL
Le fichier de schéma reproductible est situé à la racine sous `database/schema.sql` :
```bash
# Sous Linux / macOS / WSL :
psql -U postgres -d municipal_tickets -f database/schema.sql

# Ou sous Windows PowerShell :
psql -U postgres -d municipal_tickets -f database\schema.sql
```

Ce script initialise de manière idempotente :
- La table `reports` (signalements initiaux avec contrainte `UNIQUE(report_id)`)
- La table `tickets` (tickets d'intervention officiels avec index sur `status`, `category`, `department`)
- La table `ticket_events` (journal d'audit immuable des transitions d'état)
- La table `review_cases` (file de modération humaine pour les cas d'escalade)

---

## 3. Configuration des Variables d'Environnement

Copiez le fichier d'exemple fourni dans `apps/backend/` :
```bash
cp apps/backend/.env.example apps/backend/.env
```

Vérifiez les paramètres dans `apps/backend/.env` :
```ini
# Port du serveur backend Express
PORT=3001

# Chaîne de connexion PostgreSQL authentique
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/municipal_tickets

# Jeton d'authentification des agents municipaux (sécurité environnementale)
STAFF_AUTH_TOKEN=municipal-staff-secret-2026

# Mode d'orchestration n8n (mock = simulateur déterministe certifié, live = serveur webhook réel)
N8N_MODE=mock
N8N_WEBHOOK_URL=http://localhost:5678/webhook/municipal-ticket-v1
N8N_TIMEOUT_MS=15000

# Environnement d'exécution
NODE_ENV=development
```

---

## 4. Installation des Dépendances & Démarrage

### 4.1. Démarrage du Backend Express
Dans un premier terminal :
```bash
cd apps/backend
npm install
npm run build
npm start
```
*Le serveur démarre sur `http://localhost:3001` et se connecte à PostgreSQL.*

### 4.2. Démarrage du Frontend React Vite
Dans un second terminal :
```bash
cd apps/frontend
npm install
npm run dev
```
*L'application s'ouvre sur `http://localhost:5173` avec proxy automatique vers le backend.*

---

## 5. Vérification Immédiate du Bon Fonctionnement

Dans un troisième terminal, lancez :
```bash
curl http://localhost:3001/api/health
```
**Réponse attendue :**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "engine": "PostgreSQL",
    "version": "PostgreSQL 14.x ..."
  },
  "n8n": {
    "mode": "EXPLICIT_SIMULATED_MOCK"
  }
}
```

Pour exécuter la suite de tests automatisés :
```bash
node tests/audit-tests.mjs
```
*Doit afficher : `AUDIT SUMMARY: 71 PASSED, 0 FAILED`.*
