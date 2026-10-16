# Architecture Système & Conception Technique — Membre 5

Ce document présente l'architecture logicielle, le modèle de données PostgreSQL et les mécanismes d'intégration développés par Membre 5.

---

## 1. Vue d'Ensemble de l'Architecture en Couches

L'application de Membre 5 s'organise selon une architecture découplée en 4 couches garantissant la séparation des responsabilités :

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COUCHE PRÉSENTATION (React 18)                 │
│                                                                        │
│   [Guichet Citoyen]                       [Cockpit des Opérations]     │
│   • Formulaire 4 Catégories               • 4 KPIs Calculés en Direct  │
│   • Téléversement & RGPD                  • Registre Tickets & Filtres │
│   • Détection Coordonnées GPS             • File Modération Humaine    │
│   • Traçabilité n8n & Timeline            • Panneau Latéral & RAG SLA  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP / REST / JSON
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        COUCHE API (Express.js / Node.js)               │
│                                                                        │
│   • Routeur Ingestion : /api/reports, /api/municipal-ticket            │
│   • Routeur Opérations : /api/tickets, /api/reviews, /api/stats        │
│   • Routeur Authentification : /api/auth/login, /api/auth/verify       │
│   • Routeur Téléversement : /api/upload, /api/uploads                  │
│   • Middleware Sécurité : Bearer Token Check (STAFF_AUTH_TOKEN)        │
│   • Middleware RGPD : Blocage d'accès public aux photos brutes         │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼ (1) Orchestration n8n           ▼ (2) Persistance ACID
┌──────────────────────────────────────┐   ┌─────────────────────────────┐
│       MOTEUR D'ORCHESTRATION         │   │   BASE DE DONNÉES           │
│                                      │   │   PostgreSQL 14 (Port 5432) │
│  • Mode En Direct (N8N_MODE=live) :  │   │                             │
│    Appel HTTP POST sur webhook n8n   │   │   • reports (Signalements)  │
│  • Mode Déterministe (mock) :        │   │   • tickets (Tickets offic.)│
│    Simulateur 20 nœuds conforme      │   │   • ticket_events (Audit)   │
│    aux fixtures de Membre 1          │   │   • review_cases (Escalades)│
└──────────────────────────────────────┘   └─────────────────────────────┘
```

---

## 2. Modèle de Données & Schéma PostgreSQL

Le schéma relationnel normalisé est conçu pour garantir l'intégrité référentielle, la traçabilité immuable et la conformité ACID :

```mermaid
erDiagram
    REPORTS ||--o| TICKETS : generates
    REPORTS ||--o| REVIEW_CASES : escalates
    TICKETS ||--o{ TICKET_EVENTS : logs

    REPORTS {
        string report_id PK "UNIQUE, contrainte d'idempotence"
        text description "Description brute saisie par le citoyen"
        string category_hint "Catégorie suggérée lors du dépôt"
        string media_ref "Référence sécurisée du fichier téléversé"
        jsonb location "Adresse textuelle et coordonnées GPS"
        string status "SUBMITTED, PROCESSED, ESCALATED, REJECTED"
        string decision "PASS, REVIEW, REJECT"
        timestamp created_at "Horodatage de soumission"
    }

    TICKETS {
        string ticket_id PK "Identifiant officiel métropolitain TKT-..."
        string report_id FK "Référence unique vers reports"
        string category "ROAD_DAMAGE, STREET_LIGHTING, WASTE, WATER_LEAK"
        string department "Direction municipale affectée"
        string severity "LOW, MEDIUM, HIGH"
        string priority "P1, P2, P3"
        string status "TICKET_CREATED, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED"
        text procedure "Procédure standard issue du RAG"
        timestamp deadline "Délai contractuel de résolution SLA"
        string anonymized_media_ref "Chemin vers l'image protégée"
        timestamp created_at "Date d'émission"
        timestamp updated_at "Dernière modification"
    }

    TICKET_EVENTS {
        serial event_id PK "Identifiant séquentiel de l'événement"
        string ticket_id FK "Clé étrangère vers tickets"
        string from_status "Ancien statut d'intervention"
        string to_status "Nouveau statut d'intervention"
        string actor "Identifiant de l'agent ou service responsable"
        text notes "Justification opérationnelle ou motif"
        timestamp created_at "Horodatage immuable"
    }

    REVIEW_CASES {
        string review_id PK "Identifiant de modération REV-..."
        string report_id FK "Référence vers reports"
        text[] review_reasons "Codes d'anomalie détectés par les garde-fous"
        jsonb raw_payload "Données complètes du signalement initial"
        string status "PENDING, APPROVED_TO_TICKET, DISMISSED"
        string reviewer "Nom de l'agent modérateur"
        text decision_notes "Motifs de l'arbitrage humain"
        timestamp created_at "Date de mise en file"
        timestamp resolved_at "Date d'arbitrage"
    }
```

---

## 3. Mécanisme d'Idempotence & Prévention des Doublons

Pour éviter que des doubles-clics citoyens ou des renvois automatiques de paquets réseau ne polluent le registre municipal, l'ingestion applique une vérification transactionnelle stricte :
1. Chaque signalement possède un identifiant `report_id` unique garanti par la contrainte SQL `UNIQUE(report_id)`.
2. À la réception d'une requête `POST /api/reports`, le backend effectue un `SELECT ticket_id FROM tickets WHERE report_id = $1`.
3. Si un ticket existe déjà pour ce `report_id`, le système renvoie immédiatement le ticket persistant existant en statut `HTTP 200 OK` sans exécuter de nouvel appel d'IA ni insérer de doublon.

---

## 4. Machine à États & Journal d'Audit Immuable

Les tickets municipaux suivent un cycle de vie contrôlé :
```
[TICKET_CREATED] ──> [ASSIGNED] ──> [IN_PROGRESS] ──> [RESOLVED]
       │                                                     ▲
       └──────────────────> [REJECTED] ──────────────────────┘
```

Chaque transition d'état appelle la méthode `updateTicketStatus(ticketId, newStatus, actor, notes)` qui :
1. Exécute la mise à jour atomique `UPDATE tickets SET status = $1, updated_at = NOW() WHERE ticket_id = $2`.
2. Insère instantanément une ligne dans la table append-only `ticket_events` enregistrant l'ancien statut, le nouveau statut, le nom de l'agent et ses notes.
3. Cette table ne possède **aucun endpoint de modification (`UPDATE`) ni de suppression (`DELETE`)**, garantissant un historique inviolable en cas de litige administratif.
