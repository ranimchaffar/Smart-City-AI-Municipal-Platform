# Guide de Connexion & Orchestration n8n — Membre 1 & Membre 5

**Destinataire Principal :** Membre 1 (Architecte d'Intégration & Spécialiste de Flux n8n)  
**Auteur :** Membre 5 (Frontend Web, Backend Express, PostgreSQL)

---

## 1. Rôle de l'Orchestrateur n8n

Dans l'architecture du projet, **n8n agit comme le chef d'orchestre central des agents d'IA** :
1. Il reçoit le signalement brut envoyé par l'application Express de Membre 5.
2. Il distribue le traitement aux microservices d'IA (NLP Membre 2, Vision Membre 3, RAG Membre 4).
3. Il consolide les scores de confiance et applique les règles de décision académiques.
4. Il renvoie la décision finale (PASS, REVIEW ou REJECT) au backend de Membre 5, qui se charge de la persistance PostgreSQL.

---

## 2. Configuration du Webhook n8n

### 2.1. Nœud Déclencheur (Webhook Node) dans n8n
- **HTTP Method :** `POST`
- **Path :** `webhook/municipal-ticket-v1` (ou configurable dans `.env`)
- **Authentication :** Aucune (ou Header Auth selon convenance)
- **Respond :** `Using 'Respond to Webhook' Node` (pour retourner le résultat consolidé de manière synchrone).

### 2.2. Configuration Côté Membre 5 (`apps/backend/.env`)
```bash
# Pour brancher le véritable flux n8n :
N8N_MODE=live
N8N_WEBHOOK_URL=http://localhost:5678/webhook/municipal-ticket-v1
N8N_TIMEOUT_MS=15000
```

---

## 3. Format des Payloads Échangés

### 3.1. Payload Envoyé par Membre 5 à n8n
```json
{
  "report_id": "RPT-2026-1016-0042",
  "description": "Affaissement important de la chaussée devant le marché.",
  "category_hint": "ROAD_DAMAGE",
  "media_ref": "raw/pothole_high_res.jpg",
  "location": {
    "address": "Marché Central, Avenue de Paris, Tunis",
    "latitude": 36.8015,
    "longitude": 10.1798
  },
  "timestamp": "2026-10-16T12:00:00.000Z"
}
```

### 3.2. Payload de Réponse Attendu par Membre 5

#### Cas A : Approbation Automatique (`HTTP 200 OK` — PASS)
```json
{
  "decision": "PASS",
  "ticket": {
    "ticket_id": "TKT-2026-00042",
    "report_id": "RPT-2026-1016-0042",
    "category": "ROAD_DAMAGE",
    "department": "ROADS_DEPARTMENT",
    "severity": "HIGH",
    "priority": "P1",
    "status": "TICKET_CREATED",
    "procedure": "Déploiement sous 24h selon la directive municipale VOIRIE-2024-ART4.",
    "deadline": "2026-10-17T12:00:00.000Z",
    "anonymized_media_ref": "safe/anonymized_pothole_high_res.jpg"
  }
}
```

#### Cas B : Escalade vers la Modération Humaine (`HTTP 202 Accepted` — REVIEW)
```json
{
  "decision": "REVIEW",
  "ticket": null,
  "review_reasons": [
    "VISION_CONFIDENCE_BELOW_THRESHOLD",
    "IMAGE_TEXT_MISMATCH_OR_UNCLEAR"
  ],
  "raw_payload": {
    "report_id": "RPT-2026-1016-0042",
    "description": "Affaissement important...",
    "media_ref": "raw/pothole_high_res.jpg"
  }
}
```

#### Cas C : Rejet Immédiat (`HTTP 422 Unprocessable Entity` — REJECT)
```json
{
  "decision": "REJECT",
  "ticket": null,
  "rejection_errors": [
    "REPORT_OUT_OF_MUNICIPAL_SCOPE",
    "OFFENSIVE_LANGUAGE_FLAGGED"
  ]
}
```

---

## 4. Idempotence & Prévention des Doublons

Membre 5 garantit l'idempotence via la contrainte d'unicité SQL `UNIQUE(report_id)`.  
Si n8n ou le client soumet plusieurs fois le même `report_id`, le backend ne crée **aucun doublon** et renvoie le ticket déjà persistant avec son identifiant unique originel.

---

## 5. Résilience & Gestion des Pannes

- **Timeout :** Si n8n ne répond pas sous 15 000 ms, Membre 5 lève une erreur explicite.
- **Transparence Absolue :** Membre 5 **ne bascule JAMAIS silencieusement en mode mock** si le serveur n8n tombe en panne en mode `live`. L'API renvoie un statut d'erreur HTTP 502 documentant clairement l'indisponibilité du service n8n.
