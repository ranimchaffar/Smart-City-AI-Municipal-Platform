# Portail Métropolitain des Incidents Urbains — Plateforme Smart City (Membre 5)
**Système Automatisé de Billetterie Municipale & Orchestration Multi-Agents d'IA**  
**Rôle :** Membre 5 (Portail Citoyen, Cockpit Municipal, Persistance PostgreSQL & Passerelles d'Intégration)  
**Cadre Académique :** Examen Deep Learning Avancé — ESPRIT 5DS  
**Intégration de Référence :** Handoff Phase 5 Membre 1 (`Member5_Handoff_Package/` — strictement préservé)

---

## 1. Vue d'Ensemble du Système

Le Membre 5 a la charge de la couche applicative complète et de la persistance relationnelle du projet :
- **Guichet Citoyen (`apps/frontend`) :** Application web moderne en français permettant aux administrés de déclarer les anomalies urbaines (voirie, éclairage, propreté, eau), d'attacher des photos avec bouclier de confidentialité RGPD, de géolocaliser l'incident et de suivre le traitement en direct via une timeline dynamique.
- **Cockpit des Opérations Métropolitaines (`apps/frontend`) :** Tableau de bord pour les agents communaux avec 4 KPIs réels calculés en direct depuis PostgreSQL, registre complet avec recherche et filtres multicritères, panneau latéral avec extraits RAG et SLA, file de modération humaine pour les escalades d'IA, et cartographie d'intervention.
- **API Backend & Passerelle d'Intégration (`apps/backend`) :** API REST Express.js / TypeScript typée, sécurisée par jeton Bearer d'environnement, assurant l'idempotence des soumissions par `report_id`, l'isolation des photos brutes, et le raccordement au webhook n8n de Membre 1 avec gestion transparente des statuts `200 PASS`, `202 REVIEW` et `422 REJECT`.
- **Persistance PostgreSQL 14 (`database/`) :** Schéma relationnel normalisé (`schema.sql`) pour `reports`, `tickets`, `ticket_events` (journal d'audit append-only immuable) et `review_cases`.
- **Dossier d'Intégration d'Équipe (`integration-handoff/`) :** Ensemble complet de 10 spécifications techniques pour permettre aux Membres 1, 2, 3 et 4 de brancher leurs modèles sans casser l'architecture.

> [!IMPORTANT]
> **Engagement de Transparence & Vérité Terrain :**  
> L'application distingue rigoureusement la simulation locale certifiée (`EXPLICIT_SIMULATED_MOCK`) de l'orchestration en direct (`live`). Tout échec du webhook live renvoie explicitement une erreur `HTTP 502 Bad Gateway` sans basculer silencieusement en mode mock.

---

## 2. Architecture Globale

```text
[ Guichet Citoyen (fr) ]                  [ Cockpit des Opérations ]
         │                                            │
         ▼                                            ▼
┌─────────────────────────────────────────────────────────────┐
│          API Backend Express.js (Membre 5 : Port 3001)      │
│                                                             │
│   • POST /api/reports          • POST /api/upload           │
│   • GET  /api/reports/:id      • GET  /api/uploads/media/:f │
│   • GET  /api/tickets          • PATCH /api/tickets/:id     │
│   • GET  /api/reviews          • POST /api/reviews/:id      │
│   • GET  /api/dashboard/stats  • GET  /api/health           │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│ Orchestrateur n8n (Membre 1) │ │ Base de Données PostgreSQL   │
│                              │ │ (Port 5432 : 14.x)          │
│ • Webhook en direct (live)   │ │                             │
│ • Simulateur 20 nœuds (mock) │ │ • reports (idempotence)     │
│                              │ │ • tickets (persistance ACID)│
│ [NLP 2]  [Vision 3]  [RAG 4] │ │ • ticket_events (audit trail│
│                              │ │ • review_cases (escalades)  │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 3. Démarrage Rapide

### Option A : Déploiement Local Standard

1. **Base de données PostgreSQL :**
   ```bash
   # Créer la base municipal_tickets et exécuter le schéma
   psql -U postgres -d municipal_tickets -f database/schema.sql
   ```

2. **Démarrer le Backend :**
   ```bash
   cd apps/backend
   cp .env.example .env
   npm install
   npm run build
   npm start
   ```
   *Écoute sur `http://localhost:3001`.*

3. **Démarrer le Frontend :**
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```
   *Disponible sur `http://localhost:5173`.*

---

### Option B : Déploiement Conteneurisé (Docker Compose)

```bash
docker-compose up --build
```
*Lance automatiquement PostgreSQL 14, le backend Express et le frontend React avec volumes persistants.*

---

## 4. Validation des Tests Automatisés

Pour exécuter la suite d'audit rigoureuse comprenant **71 assertions vérifiées** :
```bash
node tests/audit-tests.mjs
```

Pour vérifier la persistance des données après redémarrage forcé du serveur :
```bash
node tests/restart-persistence-test.mjs
```

Pour tester l'ensemble des endpoints via cURL :
```bash
bash integration-handoff/test-all-integrations.sh
```

---

## 5. Structure du Projet

```
municipal-member5/
├── apps/
│   ├── backend/                 # API Express.js, pool PostgreSQL, routeurs, auth, upload
│   │   ├── src/                 # Code source TypeScript
│   │   ├── uploads/raw/         # Photos brutes isolées (HTTP 401 pour non-staff)
│   │   ├── Dockerfile           # Image de production backend
│   │   └── .env.example         # Paramètres d'environnement
│   └── frontend/                # Application React 18, Vite, TypeScript, Vanilla CSS GovTech
│       ├── src/
│       │   ├── components/
│       │   │   ├── CitizenPortal/       # Guichet Citoyen (formulaire, RGPD, suivi)
│       │   │   ├── MunicipalityDashboard/# Cockpit (KPIs, registre, modération, radar)
│       │   │   └── Navbar.tsx           # Navigation institutionnelle avec bascule de thème
│       │   ├── index.css                # Système de design GovTech en français
│       │   └── App.tsx                  # Assemblage principal
│       └── Dockerfile           # Image de production frontend
├── database/
│   └── schema.sql               # Schéma DDL PostgreSQL 14 reproductible
├── docs/                        # Documentation de présentation et conformité
│   ├── PROFESSOR_REQUIREMENTS_MATRIX.md   # Matrice de conformité aux 20 consignes
│   ├── MEMBER5_TECHNICAL_CONTRIBUTION.md # Rôle et choix techniques
│   ├── PROFESSOR_DEMO_GUIDE.md           # Scénario de soutenance 5 minutes
│   ├── ARCHITECTURE_EXPLANATION.md       # Diagrammes et modèles de données
│   └── TECHNICAL_QA.md                   # Questions pièges et réponses de soutenance
├── integration-handoff/          # Livrables d'intégration pour les Membres 1, 2, 3 et 4
│   ├── README_FOR_TEAM.md
│   ├── API_CONTRACT.md
│   ├── N8N_SETUP.md
│   ├── VISION_INTEGRATION.md
│   ├── RAG_INTEGRATION.md
│   ├── ENVIRONMENT_SETUP.md
│   ├── AUTHENTICATION.md
│   ├── TEST_SCENARIOS.md
│   ├── KNOWN_LIMITATIONS.md
│   ├── .env.example
│   ├── municipal_api_postman_collection.json
│   └── test-all-integrations.sh
├── Member5_Handoff_Package/     # Package de référence Membre 1 (strictement préservé)
├── tests/                       # Suites de tests automatisés
│   ├── audit-tests.mjs          # 71 assertions d'audit unifiées
│   └── restart-persistence-test.mjs # Test de persistance après kill -9 du serveur
├── docker-compose.yml           # Orchestration conteneurisée complète
├── FINAL_AUDIT_MEMBER5.md       # Rapport d'audit de sécurité et persistance
└── FINAL_MEMBER5_DELIVERY.md    # Rapport de validation finale et verdict de conformité
```
