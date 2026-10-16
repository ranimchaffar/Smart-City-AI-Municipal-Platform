# Guide d'Intégration & Handoff Technique — Membre 5 (Web & Persistance)

**Projet :** Système Automatisé de Billetterie Municipale & Plateforme Smart City Multi-Agents  
**Cadre Académique :** Examen Deep Learning Avancé — ESPRIT 5DS  
**Auteur / Rôle :** Membre 5 (Portail Citoyen, Tableau de Bord Municipal, Base PostgreSQL & API d'Intégration)  
**Date de Révision :** Octobre 2026  
**Statut Global :** Prêt pour Intégration (Production-Ready pour les Membres 1, 2, 3, 4)

---

## 1. Vue d'Ensemble pour l'Équipe

Ce dossier `integration-handoff/` fournit à tous les membres de l'équipe (Membre 1 — Orchestration n8n, Membre 2 — Classification Texte & Garde-fous, Membre 3 — Vision Multimodale & Anonymisation RGPD, Membre 4 — RAG & Base de Connaissances Municipales) l'ensemble des spécifications techniques nécessaires pour connecter leurs modèles d'IA sans casser l'architecture ni modifier le schéma de base de données PostgreSQL.

```
       [Citoyen (Portail Web fr)]       [Agents Municipaux (Cockpit)]
                  │                                  │
                  ▼                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │     API Express.js / TypeScript (Membre 5 : Port 3001)  │
      └────────────────────────────────────────────────────────┘
                  │                                  │
         (1) Ingestion Signalement          (4) Événements / SLA
                  │                                  │
                  ▼                                  ▼
      ┌────────────────────────┐           ┌───────────────────┐
      │  Orchestrateur n8n     │           │ PostgreSQL 14 DB  │
      │  (Membre 1 / Port 5678)│           │ (Port 5432)       │
      └────────────────────────┘           │                   │
        │         │          │             │  • reports        │
        ▼         ▼          ▼             │  • tickets        │
    [Membre 2] [Membre 3] [Membre 4]       │  • ticket_events  │
    (Texte/NLP) (Vision)  (RAG / Doc)      │  • review_cases   │
                                           └───────────────────┘
```

---

## 2. Sommaire des Fichiers de ce Dossier

| Fichier | Destinataire Principal | Objet |
|---|---|---|
| [API_CONTRACT.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/API_CONTRACT.md) | Tous les membres | Spécification exhaustive des endpoints REST, schémas JSON, codes HTTP (200, 202, 422) |
| [N8N_SETUP.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/N8N_SETUP.md) | Membre 1 (n8n) | Configuration du webhook en direct, basculement mode mock/live, corrélation `report_id` |
| [VISION_INTEGRATION.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/VISION_INTEGRATION.md) | Membre 3 (Vision) | Contrat des métadonnées d'image, bouclier d'anonymisation RGPD (visages/plaques), accès sécurisé |
| [RAG_INTEGRATION.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/RAG_INTEGRATION.md) | Membre 4 (RAG) | Format des procédures d'intervention, citations textuelles, gestion des erreurs et sources vides |
| [ENVIRONMENT_SETUP.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/ENVIRONMENT_SETUP.md) | DevOps / Équipe | Installation de Node.js, PostgreSQL 14, initialisation du schéma et variables d'environnement |
| [AUTHENTICATION.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/AUTHENTICATION.md) | Équipe / Sécurité | Authentification Bearer token, session agent municipal, protection des données citoyennes |
| [TEST_SCENARIOS.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/TEST_SCENARIOS.md) | QA / Membres 1-4 | Jeux de données d'essai (Nid-de-poule PASS, Incohérence REVIEW, Média manquant REJECT, etc.) |
| [KNOWN_LIMITATIONS.md](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/KNOWN_LIMITATIONS.md) | Équipe & Professeur | Délimitations strictes entre le code local de Membre 5 et les modules d'IA externes |
| [.env.example](file:///c:/Users/ranni/OneDrive/Bureau/municipal-member5/integration-handoff/.env.example) | Développeur local | Modèle de configuration avec secrets et URL par défaut |
| `municipal_api_postman_collection.json` | Testeurs API | Collection Postman exécutable avec toutes les requêtes pré-configurées |
| `test-all-integrations.sh` | Terminal / CI | Script bash exécutant tous les appels de test cURL |

---

## 3. Règle Fondamentale d'Intégration : Transparence & Vérité Terrain

> [!IMPORTANT]
> **Pas de Fausses Affirmations d'IA :**  
> L'application de Membre 5 supporte nativement deux modes de fonctionnement :
> 1. **Mode Simulation Déclaré (`N8N_MODE=mock`) :** Utilise un simulateur déterministe conforme aux fixtures du handoff pour développer et valider la persistance sans dépendre du serveur n8n.
> 2. **Mode En Direct (`N8N_MODE=live`) :** Appelle le véritable webhook n8n sur `N8N_WEBHOOK_URL`. Si n8n est éteint ou renvoie une erreur (502/timeout), l'application **refuse de basculer silencieusement en mock** et renvoie explicitement une erreur `N8N_LIVE_WEBHOOK_UNREACHABLE` (HTTP 502).

---

## 4. Démarrage Rapide pour un Membre de l'Équipe

1. Cloner ou ouvrir le projet dans VS Code / Antigravity.
2. Copier `.env.example` vers `apps/backend/.env`.
3. S'assurer que PostgreSQL 14 est lancé avec la base `municipal_tickets`.
4. Lancer le backend :
   ```bash
   cd apps/backend && npm install && npm run build && npm start
   ```
5. Lancer le frontend :
   ```bash
   cd apps/frontend && npm install && npm run dev
   ```
6. Ouvrir `http://localhost:5173` dans le navigateur.
