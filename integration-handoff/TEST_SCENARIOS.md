# Scénarios de Test & Cas de Validation — Membre 5

Ce document recense les scénarios d'essai d'intégration et les jeux de données permettant de valider l'ensemble du cycle de vie des incidents urbains.

---

## 1. Scénarios Officiels du Package de Handoff (Membre 1)

### Scénario 1 : Approbation Automatique (`pass_pothole`)
- **Objectif :** Valider le chemin nominal d'ingestion directe.
- **Entrée :**
  - `report_id`: `"RPT-2026-FIXTURE-PASS"`
  - `description`: `"Large pothole on Avenue Habib Bourguiba causing damage to car tires."`
  - `category_hint`: `"ROAD_DAMAGE"`
  - `media_ref`: `"raw/pothole.jpg"`
- **Résultat Attendu :**
  - Statut HTTP : `200 OK`
  - `decision`: `"PASS"`
  - `category`: `"ROAD_DAMAGE"`
  - `department`: `"ROADS_DEPARTMENT"`
  - `storage_status`: `"PERSISTED"`
  - Un ticket officiel `TKT-...` est inséré dans PostgreSQL avec l'événement initial `TICKET_CREATED`.

---

### Scénario 2 : Incohérence Multimodale (`review_mismatch`)
- **Objectif :** Vérifier l'escalade automatique lorsque la vision et le texte se contredisent.
- **Entrée :**
  - `report_id`: `"RPT-2026-FIXTURE-REV-MISMATCH"`
  - `description`: `"Broken public street light pole near Central Market."`
  - `category_hint`: `"STREET_LIGHTING"`
  - `media_ref`: `"raw/water_leak_photo.jpg"`
- **Résultat Attendu :**
  - Statut HTTP : `202 Accepted`
  - `decision`: `"REVIEW"`
  - `ticket`: `null`
  - `review_reasons`: `["IMAGE_TEXT_MISMATCH_OR_UNCLEAR"]`
  - Un dossier de révision est créé dans la table `review_cases`.

---

### Scénario 3 : Absence de Preuve Multimédia (`reject_missing_media`)
- **Objectif :** Rejeter les signalements incomplets sans création de ticket ni charge sur les services.
- **Entrée :**
  - `report_id`: `"RPT-2026-FIXTURE-REJ-MEDIA"`
  - `description`: `"Accumulated garbage on sidewalk."`
  - `category_hint`: `"WASTE"`
  - `media_ref`: `""` *(champ vide ou absent)*
- **Résultat Attendu :**
  - Statut HTTP : `422 Unprocessable Entity`
  - `decision`: `"REJECT"`
  - `rejection_errors`: `["MISSING_MEDIA_REF"]`
  - Aucun ticket ni dossier de révision n'est persisté.

---

### Scénario 4 : Panne du Service RAG (`knowledge_outage`)
- **Objectif :** Assurer la résilience en cas de défaillance de la base vectorielle.
- **Entrée :** Simulation d'indisponibilité de l'agent RAG de Membre 4.
- **Résultat Attendu :**
  - Statut HTTP : `202 Accepted`
  - `decision`: `"REVIEW"`
  - `review_reasons`: `["KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID"]`
  - Le signalement est sauvegardé pour traitement manuel sans perte de données.

---

### Scénario 5 : Absence de Citations Documentaires (`knowledge_empty_sources`)
- **Objectif :** Bloquer les hallucinations sans sources officielles.
- **Résultat Attendu :**
  - Statut HTTP : `202 Accepted`
  - `decision`: `"REVIEW"`
  - `review_reasons`: `["MISSING_SOURCE"]`

---

### Scénario 6 : Idempotence de la Soumission (`idempotent_retry`)
- **Objectif :** Garantir qu'une re-soumission du même `report_id` ne crée pas de doublon.
- **Résultat Attendu :**
  - Le second appel renvoie `HTTP 200 OK` avec exactement le même `ticket_id` que le premier appel.
  - La base PostgreSQL ne contient qu'une seule ligne pour ce `report_id`.

---

## 2. Scénarios Opérationnels du Tableau de Bord Municipal

### Scénario 7 : Arbitrage Humain d'un Cas en Attente (`resolve_review`)
1. L'agent superviseur consulte la file de modération (`GET /api/reviews`).
2. Il sélectionne un dossier en attente et valide l'affectation au service de voirie (`POST /api/reviews/:id/resolve`).
3. Le statut du dossier devient `RESOLVED_TO_TICKET` et un ticket officiel est instantanément émis en base.

### Scénario 8 : Cycle de Vie d'un Ticket (`ticket_lifecycle`)
1. **Création :** Statut initial `TICKET_CREATED`.
2. **Affectation :** L'agent assigne une équipe terrain -> Statut `ASSIGNED`.
3. **Intervention :** Les ouvriers débutent les travaux -> Statut `IN_PROGRESS`.
4. **Clôture :** Travaux validés avec note de fin de chantier -> Statut `RESOLVED`.
5. Chaque transition est consignée de manière immuable dans `ticket_events`.

---

## 3. Scénario de Tolérance aux Pannes n8n (`live_n8n_failure`)

1. L'administrateur active le mode en direct (`N8N_MODE=live`).
2. Le serveur n8n est arrêté ou inaccessible.
3. Le citoyen soumet un signalement.
4. **Comportement Vérifié :** L'API renvoie **`HTTP 502 Bad Gateway`** (`N8N_LIVE_WEBHOOK_UNREACHABLE`).  
   **Aucun basculement silencieux en mock n'a lieu.** L'erreur est transparente et documentée.
