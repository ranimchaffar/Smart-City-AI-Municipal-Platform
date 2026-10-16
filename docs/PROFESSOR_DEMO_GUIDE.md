# Guide de Démonstration pour l'Évaluation — Membre 5

**Destiné à :** Monsieur l'Enseignant & Jury d'Examen Deep Learning Avancé  
**Durée Recommandée :** 5 à 7 minutes  
**Application :** Portail Métropolitain des Incidents Urbains (Guichet Citoyen & Cockpit Opérationnel)

---

## 1. Déroulé Chronologique de la Soutenance

### Étape 1 : Présentation de l'Architecture & Démarrage (1 min)
1. Ouvrir le navigateur sur `http://localhost:5173`.
2. Mettre en avant le design institutionnel GovTech en langue française inspiré des plateformes Smart City européennes (palette bleu marine `#1e3a8a`, typographie moderne, badges de statut).
3. Montrer l'indicateur d'état en haut à droite : **`PostgreSQL Actif • Mode Mock Déclaré`** (gage d'honnêteté technique : transparence sur l'état de la simulation).

---

### Étape 2 : Parcours Citoyen Nominal — Cas PASS (1 min 30 s)
1. Dans l'onglet **"Guichet Citoyen"**, cliquer sur le bouton de préréglage :  
   👉 **`[Test: Nid-de-poule (PASS)]`**.
2. Observer le pré-remplissage automatique :
   - Catégorie sélectionnée : **Voirie & Chaussée**
   - Description : *Nid-de-poule dangereux sur l'Avenue Habib Bourguiba...*
   - Géolocalisation simulée avec coordonnées exactes.
   - Bouclier RGPD actif.
3. Cliquer sur le bouton **"Transmettre le Signalement"**.
4. **Observer le résultat affiché instantanément :**
   - Bannière verte : **`PASS — Signalement Validé Automatiquement`**.
   - Trace animée du flux n8n à 5 étapes (Ingestion -> Contrôle d'Entrée -> Vision -> Procédure RAG -> Persistance SQL).
   - Numéro de ticket généré : `TKT-2026-XXXXX`.
   - Copier ce numéro de ticket pour l'étape suivante.

---

### Étape 3 : Suivi Citoyen en Temps Réel (1 min)
1. Cliquer sur le sous-onglet **"Suivre un Signalement"**.
2. Coller le numéro de ticket copié (ou cliquer sur le bouton d'exemple rapide).
3. Cliquer sur **"Consulter l'Avancement"**.
4. Observer la **Timeline d'Intervention** dynamique :
   - Étape `TICKET_CREATED` horodatée à la seconde près, directement extraite de la table SQL `ticket_events`.

---

### Étape 4 : Démonstration des Garde-fous — Cas REVIEW (1 min)
1. Revenir à **"Déclarer une Anomalie Urbaine"**.
2. Cliquer sur le bouton de préréglage :  
   👉 **`[Test: Incohérence (REVIEW)]`** *(ex. Texte Voirie + Photo Éclairage)*.
3. Cliquer sur **"Transmettre le Signalement"**.
4. Observer la réponse :
   - Bannière ambre : **`REVIEW — Escalade vers Modération Humaine`**.
   - Motif d'alerte explicite : `IMAGE_TEXT_MISMATCH_OR_UNCLEAR`.
   - Indication au citoyen : *Votre dossier a été transmis aux agents municipaux pour vérification visuelle manuelle.*

---

### Étape 5 : Cockpit des Opérations Municipales & Arbitrage (1 min 30 s)
1. Basculer sur l'onglet **"Cockpit des Opérations"**.
2. **KPIs en Direct :** Montrer les 4 cartes statistiques (Total Tickets, Modération, En Cours, Taux de Clôture) alimentées par de vraies requêtes PostgreSQL.
3. **Sécurité Agent :** Montrer la bannière rouge indiquant une session non authentifiée.
4. Cliquer sur **"Connexion Agent"**, entrer le jeton `municipal-staff-secret-2026`, et valider : la bannière devient verte avec les privilèges d'administration.
5. Aller dans le sous-onglet **"File de Modération Humaine"** :
   - Le dossier d'incohérence soumis à l'Étape 4 y apparaît avec son horodatage et ses motifs.
   - Cliquer sur **"Arbitrer"**, affecter la catégorie réelle et cliquer sur **"Valider & Émettre le Ticket Officiel"**.
   - Le dossier disparaît de la file et devient un ticket persistant officiel.
6. Revenir à **"Gestion des Tickets"** :
   - Cliquer sur **"Détails"** d'un ticket.
   - Montrer la section **Extraits RAG Officiels** (procédure d'intervention et délai SLA).
   - Changer le statut vers `IN_PROGRESS` avec une note d'intervention -> Valider.
   - Observer l'immédiate mise à jour du journal d'audit immuable en bas du panneau latéral.

---

### Étape 6 : Preuve de Persistance & Audit Automatisé (1 min)
1. Ouvrir le terminal et exécuter :
   ```bash
   node tests/audit-tests.mjs
   ```
2. Montrer les **71 assertions auditées avec 0 échec** :
   - PostgreSQL 14 authentique (version, moteur, base `municipal_tickets`).
   - Fixtures PASS/REVIEW/REJECT validées.
   - Authentification et contrôle d'accès vérifiés.
   - Isolation des médias et bouclier RGPD validés.
   - Transparence n8n et gestion des pannes vérifiées.
   - Durabilité et absence de perte de données après redémarrage confirmées.
