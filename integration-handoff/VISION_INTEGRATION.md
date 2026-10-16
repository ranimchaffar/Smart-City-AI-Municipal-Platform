# Guide d'Intégration du Module de Vision & Multimodalité — Membre 3 & Membre 5

**Destinataire Principal :** Membre 3 (Ingénieur Vision par Ordinateur & Modèles Multimodaux)  
**Auteur :** Membre 5 (Frontend Web, Backend Express, PostgreSQL)

---

## 1. Rôle du Module de Vision dans la Plateforme

Le module de vision développé par Membre 3 assume deux responsabilités critiques :
1. **Analyse Multimodale de l'Image :** Détection de la classe de dégradation (ex. nid-de-poule, lampadaire brisé, dépôts sauvages, fuite d'eau) et validation de la cohérence avec le texte saisi par le citoyen.
2. **Protection de la Vie Privée & Bouclier RGPD :** Anonymisation visuelle automatique (floutage ou masquage des visages humains et des plaques d'immatriculation automobiles) avant toute mise à disposition dans le registre municipal public.

---

## 2. Accès aux Images Téléversées par les Citoyens

Lorsqu'un citoyen soumet un signalement via le portail web, l'image est enregistrée dans le répertoire sécurisé du backend :
- **Chemin brut :** `apps/backend/uploads/raw/<nom_de_fichier>.jpg`
- **Référence API :** `raw/<nom_de_fichier>.jpg`
- **Taille Max :** 5 Mo
- **Formats Acceptés :** `image/jpeg`, `image/png`, `image/webp`

### Protection des Images Brutes
Pour prévenir toute violation de la vie privée, l'accès direct aux images du dossier `raw/` par un utilisateur non authentifié est **systématiquement bloqué par un code HTTP 401 Unauthorized**.

---

## 3. Format des Métadonnées Attendues du Module de Vision

Membre 3 doit retourner les métadonnées suivantes à l'orchestrateur n8n (Membre 1) pour consolidation :

```json
{
  "vision_agent": {
    "model_name": "YOLOv8-Municipal-FineTuned",
    "detected_class": "ROAD_DAMAGE",
    "raw_label": "pothole_asphalt",
    "confidence_score": 0.942,
    "bounding_boxes": [
      {
        "x_min": 120,
        "y_min": 250,
        "x_max": 480,
        "y_max": 620,
        "label": "pothole",
        "confidence": 0.942
      }
    ],
    "text_image_alignment": {
      "alignment_score": 0.89,
      "coherent": true,
      "notes": "L'image montre un cratère de voirie cohérent avec le texte citoyen."
    },
    "anonymization": {
      "faces_detected": 0,
      "license_plates_detected": 1,
      "status": "ANONYMIZED_SUCCESS",
      "anonymized_media_ref": "safe/anonymized_upload_1792138920123.jpg"
    }
  }
}
```

---

## 4. Politique de Sécurité RGPD en l'Absence d'Anonymisation

> [!IMPORTANT]
> **Règle de Sécurité Stricte de Membre 5 :**  
> Si le service de floutage visuel de Membre 3 est hors ligne ou n'a pas encore généré le fichier anonymisé dans `safe/`, l'API de Membre 5 :
> 1. **Refuse catégoriquement** de diffuser l'image brute au public via le guichet web (`HTTP 403 Forbidden` avec code d'erreur `VISUAL_ANONYMIZATION_UNAVAILABLE`).
> 2. Permet uniquement aux agents municipaux dûment authentifiés avec leur jeton d'inspecter la pièce d'origine à des fins de vérification officielle.

---

## 5. Jeux de Test & Fixtures de Validation

Pour tester l'intégration de la vision sans dépendre du modèle lourd :
- `pass_pothole` : Image claire de nid-de-poule avec alignement parfait -> `decision: PASS`.
- `review_mismatch` : Photo de graffiti soumise avec la description "fuite d'eau" -> déclenche la règle `IMAGE_TEXT_MISMATCH_OR_UNCLEAR` (`decision: REVIEW`).
- `reject_missing_media` : Signalement sans photo -> violation de la directive municipale (`decision: REJECT`).
