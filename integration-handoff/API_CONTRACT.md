# Contrat d'Interface d'API REST — Membre 5 (Backend Express & PostgreSQL)

**Version de l'API :** `v1.0.0-fr-enterprise`  
**Base URL Locale :** `http://localhost:3001`  
**Format de Données :** `application/json` (ou `multipart/form-data` pour l'upload)

---

## 1. Vue d'Ensemble des Codes de Statut HTTP

L'API de billetterie municipale suit rigoureusement la sémantique HTTP définie dans le guide de projet de l'enseignant :

- **`HTTP 200 OK` — PASS / Succès :** Le signalement est validé automatiquement par l'IA et inséré en base sous forme de ticket persistant officiel.
- **`HTTP 202 Accepted` — REVIEW :** Le signalement nécessite une modération humaine (incohérence texte/image, faible confiance vision, panne RAG). Enregistré dans la table `review_cases`.
- **`HTTP 422 Unprocessable Entity` — REJECT :** Le signalement viole les règles d'intégrité (image manquante, texte hors sujet, coordonnées invalides).
- **`HTTP 401 Unauthorized` :** Jeton Bearer manquant ou invalide pour les opérations réservées aux agents municipaux.
- **`HTTP 403 Forbidden` :** Accès bloqué pour motif de confidentialité citoyenne (ex. tentative d'accès direct à une photo sans anonymisation certifiée).
- **`HTTP 502 Bad Gateway` :** Le webhook n8n en direct (`N8N_MODE=live`) est injoignable ou a expiré (pas de basculement silencieux en mock).

---

## 2. Spécification Détaillée des Endpoints

### 2.1. Ingestion de Signalement Citoyen : `POST /api/reports`

Reçoit un signalement citoyen, l'orchestre avec n8n (ou simulateur déterministe) et persiste le résultat dans PostgreSQL.

#### Requête
- **Headers :** `Content-Type: application/json`
- **Body :**
```json
{
  "report_id": "RPT-2026-TEST-001",
  "description": "Grand nid-de-poule dangereux sur la chaussée.",
  "category_hint": "ROAD_DAMAGE",
  "media_ref": "raw/pothole_fixture.jpg",
  "location": {
    "address": "Avenue Habib Bourguiba, Tunis",
    "latitude": 36.8002,
    "longitude": 10.1865
  }
}
```

#### Réponses Possibles

##### Cas 1 : Décision PASS (`HTTP 200 OK`)
```json
{
  "decision": "PASS",
  "ticket": {
    "ticket_id": "TKT-2026-00017",
    "report_id": "RPT-2026-TEST-001",
    "category": "ROAD_DAMAGE",
    "department": "ROADS_DEPARTMENT",
    "severity": "MEDIUM",
    "priority": "P2",
    "status": "TICKET_CREATED",
    "procedure": "Déploiement d'une équipe de voirie pour colmatage sous 48h.",
    "deadline": "2026-10-18T10:00:00.000Z",
    "anonymized_media_ref": "safe/anonymized_pothole_fixture.jpg",
    "persisted": true,
    "storage_status": "PERSISTED"
  },
  "provenance": {
    "mode": "EXPLICIT_SIMULATED_MOCK",
    "notice": "Simulateur déterministe certifié Membre 5"
  }
}
```

##### Cas 2 : Décision REVIEW (`HTTP 202 Accepted`)
```json
{
  "decision": "REVIEW",
  "ticket": null,
  "review_reasons": ["IMAGE_TEXT_MISMATCH_OR_UNCLEAR"],
  "review_case_id": "REV-2026-00008",
  "provenance": {
    "mode": "EXPLICIT_SIMULATED_MOCK",
    "notice": "Orienté vers la file de modération humaine du Cockpit"
  }
}
```

##### Cas 3 : Décision REJECT (`HTTP 422 Unprocessable Entity`)
```json
{
  "decision": "REJECT",
  "ticket": null,
  "rejection_errors": ["MISSING_MEDIA_REF"],
  "provenance": {
    "mode": "EXPLICIT_SIMULATED_MOCK",
    "notice": "Signalement rejeté en amont : absence de preuve multimédia"
  }
}
```

---

### 2.2. Téléversement de Médias : `POST /api/upload`

Permet au citoyen de joindre une photo de preuve. Les types MIME sont vérifiés (JPEG, PNG, WebP) et la taille est plafonnée à 5 Mo.

- **Content-Type :** `multipart/form-data`
- **Field Name :** `photo`
- **Réponse Succès (`HTTP 201 Created`) :**
```json
{
  "success": true,
  "media_ref": "raw/upload_1792138920123.jpg",
  "filename": "upload_1792138920123.jpg",
  "size": 142050,
  "mimetype": "image/jpeg",
  "shield_policy": "RGPD_RAW_ISOLATED"
}
```

---

### 2.3. Accès aux Médias Anonymisés : `GET /api/uploads/media/:filename`

Protège les données privées des citoyens (visages, plaques d'immatriculation).

- **Si l'anonymisation automatique par l'IA (Membre 3) n'a pas encore traité l'image :**  
  Renvoie **`HTTP 403 Forbidden`** :
  ```json
  {
    "error": "VISUAL_ANONYMIZATION_UNAVAILABLE",
    "message": "L'image originale contient potentiellement des données identifiables (visages/plaques) non anonymisées par le module de vision. Accès public restreint par précaution RGPD."
  }
  ```
- **Si l'agent municipal est authentifié (`Authorization: Bearer <STAFF_AUTH_TOKEN>`) :**  
  Renvoie le fichier image en `HTTP 200` avec le bon `Content-Type`.

---

### 2.4. Consultation & Suivi Citoyen : `GET /api/reports/:id`

Permet au citoyen de suivre l'avancement d'un signalement via son `report_id` ou `ticket_id`.

- **Réponse Succès (`HTTP 200 OK`) :**
```json
{
  "report": {
    "report_id": "RPT-2026-TEST-001",
    "description": "Grand nid-de-poule dangereux sur la chaussée.",
    "category_hint": "ROAD_DAMAGE",
    "status": "PROCESSED",
    "decision": "PASS",
    "created_at": "2026-10-16T12:00:00.000Z"
  },
  "ticket": {
    "ticket_id": "TKT-2026-00017",
    "status": "IN_PROGRESS",
    "department": "ROADS_DEPARTMENT",
    "deadline": "2026-10-18T10:00:00.000Z"
  },
  "events": [
    {
      "event_id": "EVT-2026-00030",
      "from_status": null,
      "to_status": "TICKET_CREATED",
      "actor": "system_n8n",
      "notes": "Ticket initialement généré",
      "created_at": "2026-10-16T12:00:05.000Z"
    },
    {
      "event_id": "EVT-2026-00031",
      "from_status": "TICKET_CREATED",
      "to_status": "IN_PROGRESS",
      "actor": "superviseur_municipal",
      "notes": "Équipe de voirie dépêchée sur les lieux",
      "created_at": "2026-10-16T14:30:00.000Z"
    }
  ]
}
```

---

### 2.5. Mise à Jour de Statut Opérationnel : `PATCH /api/tickets/:id/status`

> [!CAUTION]
> **Endpoint Protégé :** Requiert le header `Authorization: Bearer <STAFF_AUTH_TOKEN>`. Les citoyens non authentifiés reçoivent `HTTP 401 Unauthorized`.

- **Body :**
```json
{
  "status": "RESOLVED",
  "actor": "agent_voirie_tunis",
  "notes": "Colmatage au bitume achevé avec succès. Chaussée rétablie."
}
```
- **Réponse Succès (`HTTP 200 OK`) :**
```json
{
  "success": true,
  "ticket_id": "TKT-2026-00017",
  "old_status": "IN_PROGRESS",
  "new_status": "RESOLVED",
  "persisted": true,
  "event_id": "EVT-2026-00032"
}
```

---

### 2.6. Arbitrage de Modération Humaine : `POST /api/reviews/:id/resolve`

Permet à un agent superviseur de trancher un cas mis en attente par l'IA.

- **Headers :** `Authorization: Bearer <STAFF_AUTH_TOKEN>`
- **Body (Validation en Ticket) :**
```json
{
  "action": "APPROVED_TO_TICKET",
  "reviewer": "agent_superviseur",
  "notes": "Photo vérifiée manuellement : affaissement avéré nécessitant une intervention.",
  "override_data": {
    "category": "ROAD_DAMAGE",
    "department": "ROADS_DEPARTMENT",
    "severity": "HIGH",
    "procedure": "Intervention d'urgence prioritaire sous 24h."
  }
}
```
- **Réponse Succès (`HTTP 200 OK`) :**
```json
{
  "success": true,
  "review_id": "REV-2026-00008",
  "action": "APPROVED_TO_TICKET",
  "generated_ticket_id": "TKT-2026-00018",
  "status": "RESOLVED_TO_TICKET"
}
```

---

### 2.7. Basculement Administratif du Moteur n8n : `POST /api/admin/set-n8n-mode`

Permet aux intégrateurs de basculer le backend entre le simulateur local et le véritable webhook n8n sans redémarrer le serveur.

- **Headers :** `Authorization: Bearer <STAFF_AUTH_TOKEN>`
- **Body :**
```json
{
  "mode": "live",
  "liveWebhookUrl": "http://localhost:5678/webhook/municipal-ticket-v1"
}
```
- **Réponse Succès (`HTTP 200 OK`) :**
```json
{
  "success": true,
  "mode": "live",
  "liveWebhookUrl": "http://localhost:5678/webhook/municipal-ticket-v1",
  "message": "Orchestration en direct activée. Tout échec du serveur n8n renverra HTTP 502."
}
```
