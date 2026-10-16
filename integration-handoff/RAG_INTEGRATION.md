# Guide d'Intégration du Module RAG & Connaissances Municipales — Membre 4 & Membre 5

**Destinataire Principal :** Membre 4 (Spécialiste RAG, Embeddings & Recherche Vectorielle de Politiques Publiques)  
**Auteur :** Membre 5 (Frontend Web, Backend Express, PostgreSQL)

---

## 1. Rôle du Module RAG dans le Système

Le rôle de Membre 4 est d'interroger la base documentaire de la municipalité (arrêtés municipaux, normes AFNOR/INNORPI, fiches d'intervention des services techniques) afin de :
1. Identifier la **procédure standard d'intervention** applicable à l'incident.
2. Déterminer le **délai maximal contractuel (SLA)** pour la résolution du problème.
3. Fournir les **citations juridiques et opérationnelles exactes** (sources vérifiables) aux agents municipaux.

---

## 2. Format des Données de Connaissances RAG

Le module RAG doit fournir à l'orchestrateur n8n une structure respectant le contrat suivant :

```json
{
  "rag_result": {
    "report_id": "RPT-2026-TEST-001",
    "applicable_directive": "Plan de Maintenance Voirie — Ville de Tunis (Édition 2024)",
    "article_ref": "Article 12-B : Dégradations ponctuelles de couche de roulement",
    "procedure_summary": "1. Balisage de sécurité du périmètre sous 4h.\n2. Élimination des débris et décapage du bitume détérioré.\n3. Application d'enrobé à chaud et compactage mécanique.\n4. Contrôle de planéité et réouverture à la circulation sous 48h.",
    "sla_hours": 48,
    "confidence_score": 0.91,
    "sources": [
      {
        "document_name": "Guide_Intervention_Voirie_2024.pdf",
        "page_number": 42,
        "extracted_chunk": "Tout nid-de-poule d'une profondeur supérieure à 4 cm sur voie à fort trafic requiert un colmatage sous 48 heures ouvrées."
      }
    ]
  }
}
```

---

## 3. Garde-fous RAG & Cas d'Escalade en Modération Humaine

Le système de Membre 5 intègre des garde-fous stricts conformes aux exigences du projet :

### 3.1. Panne ou Indisponibilité du Service RAG (`KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID`)
Si l'index vectoriel ou le serveur d'embeddings de Membre 4 ne répond pas, l'incident **n'est pas perdu**. Il bascule immédiatement en statut `HTTP 202 Accepted (REVIEW)` pour qu'un agent humain affecte la procédure manuellement.

### 3.2. Absence de Sources Documentaires Vérifiées (`MISSING_SOURCE`)
Si le modèle de langage génère une procédure sans citer de document officiel valide dans le tableau `sources`, le garde-fou bloque l'émission directe du ticket et escalade le dossier en modération humaine avec le motif `MISSING_SOURCE`.

### 3.3. Incohérence d'Identifiant de Signalement (`KNOWLEDGE_REPORT_ID_MISMATCH`)
Si la réponse vectorielle renvoie des métadonnées associées à un autre signalement que celui en cours d'analyse, l'incident est consigné en modération humaine pour prévenir toute contamination de données.

---

## 4. Affichage dans le Tableau de Bord Municipal

Les extraits documentaires fournis par Membre 4 sont directement affichés dans le panneau latéral de détails (`TicketDetailDrawer.tsx`) sous la section dédiée :
> **"Procédure d'Intervention Standard (Extraits RAG Officiels)"**  
> Les agents peuvent ainsi s'appuyer sur la réglementation exacte pour motiver leurs interventions sans risque d'hallucination de l'IA.
