# Questions Techniques Fréquentes (Q&A de Soutenance) — Membre 5

Ce document prépare l'étudiant Membre 5 à répondre avec précision, rigueur et franchise aux questions pointues de l'enseignant et du jury d'examen Deep Learning Avancé.

---

### Q1. "Comment me prouvez-vous que vous utilisez une vraie base PostgreSQL et non un stockage en mémoire ou un fichier JSON local ?"
> **Réponse Technique :**  
> "Monsieur, notre persistance s'appuie sur une instance PostgreSQL 14 active connectée via le pool `pg`. Pour le prouver en direct :
> 1. L'endpoint `/api/health` exécute la requête SQL `SELECT version()` et retourne le binaire officiel : `PostgreSQL 14.24 (Ubuntu)`.
> 2. Nous avons écrit un test automatisé de persistance après redémarrage (`tests/restart-persistence-test.mjs`) qui crée un ticket, tue violemment le processus Node.js (`kill -9`), relance le serveur et requête PostgreSQL : 100% des données et des événements d'audit sont conservés sans aucune perte.
> 3. Nous pouvons ouvrir un terminal `psql` et inspecter directement les tables `reports`, `tickets`, `ticket_events` et `review_cases`."

---

### Q2. "Que se passe-t-il si le serveur n8n de Membre 1 tombe en panne ou ne répond pas pendant qu'un citoyen signale un incident ?"
> **Réponse Technique :**  
> "Dans notre architecture, nous appliquons une politique de **tolérance aux pannes avec transparence absolue**.
> Lorsque le mode `N8N_MODE=live` est configuré, nous envoyons la requête avec un timeout de 15 secondes. Si n8n ne répond pas ou renvoie un code 500, notre API renvoie explicitement une erreur `HTTP 502 Bad Gateway` avec le message `N8N_LIVE_WEBHOOK_UNREACHABLE`.
> **Nous refusons catégoriquement de basculer silencieusement en mode mock.** Le citoyen et les administrateurs sont immédiatement informés de l'indisponibilité du service d'orchestration, ce qui évite de générer des données factices à l'insu des utilisateurs."

---

### Q3. "Comment protégez-vous la vie privée des citoyens (RGPD) lors de l'envoi de photos de voirie où apparaissent des passants ou des véhicules ?"
> **Réponse Technique :**  
> "Nous avons mis en place une politique de **cloisonnement et de bouclier de confidentialité** :
> 1. Les photos brutes envoyées par les citoyens sont stockées dans le dossier restreint `uploads/raw/`. L'accès public direct à ce dossier est **bloqué par un code HTTP 401 Unauthorized**.
> 2. Seules les images certifiées anonymisées (`safe/`) par le module de vision de Membre 3 (visages floutés, plaques masquées) peuvent être consultées publiquement.
> 3. Si l'anonymisation visuelle automatique n'est pas encore disponible, notre endpoint d'exposition bloque l'accès public avec un code **`HTTP 403 Forbidden`** (`VISUAL_ANONYMIZATION_UNAVAILABLE`). Seul un agent municipal authentifié peut visualiser la pièce originale dans le cadre de ses fonctions."

---

### Q4. "Pourquoi avoir prévu une file de modération humaine (Human Review Queue) plutôt que d'automatiser la création de ticket à 100% ?"
> **Réponse Technique :**  
> "C'est une exigence fondamentale de l'ingénierie des systèmes d'IA critiques (Human-in-the-Loop) :
> Lorsqu'un modèle de vision hésite (faible score de confiance), lorsqu'il y a une contradiction entre le texte et l'image (ex. description d'un lampadaire avec une photo de fuite d'eau), ou lorsque le module RAG subit une panne, **le système ne doit ni rejeter arbitrairement le citoyen, ni créer un faux ticket municipal**.
> Notre système renvoie alors un code `HTTP 202 Accepted (REVIEW)`. L'incident est consigné dans la table `review_cases` et soumis à l'arbitrage d'un agent municipal dans le cockpit. L'agent peut alors affecter le bon service technique ou classer l'affaire sans suite avec une justification tracée."

---

### Q5. "Comment évitez-vous qu'un citoyen cliquant frénétiquement sur le bouton d'envoi ne crée 10 tickets pour le même trou dans la route ?"
> **Réponse Technique :**  
> "Nous garantissons l'**idempotence au niveau de l'API et de la base de données** :
> Chaque formulaire génère un identifiant unique `report_id` (ou utilise la référence transmise). Dans PostgreSQL, la colonne `report_id` possède une contrainte d'unicité `UNIQUE(report_id)`.
> Si une requête se répète avec le même identifiant, notre backend intercepte l'appel, vérifie l'existence en base et renvoie le ticket originel déjà créé sans réexécuter le pipeline d'IA ni insérer de doublon. Cela est vérifié par notre assertion d'idempotence dans les tests d'audit."

---

### Q6. "Pourquoi avoir développé l'interface en Vanilla CSS plutôt que d'importer Tailwind ou Bootstrap ?"
> **Réponse Technique :**  
> "Trois raisons majeures :
> 1. **Contrôle & Esthétique GovTech Sur-Mesure :** Nous voulions un design institutionnel élégant inspiré du système Marianne (palette bleu marine `#1e3a8a`, émeraude `#059669`, ambre `#d97706`) sans l'aspect générique des templates préfabriqués.
> 2. **Performance & Légèreté :** Notre bundle CSS de production ne pèse que 11 Ko minifié (3 Ko gzippé), sans aucune dépendance externe superflue ni surcharge de build.
> 3. **Conformité aux Directives :** Le prompt et les consignes architecturales préconisent expressément l'utilisation de Vanilla CSS moderne avec variables CSS (`:root`, `var(--primary)`) et support natif du mode sombre."

---

### Q7. "Comment garantissez-vous l'honnêteté technique sur les modèles d'IA présentés lors de cette démo ?"
> **Réponse Technique :**  
> "Nous déclarons explicitement la provenance dans l'en-tête de l'application, dans la trace visuelle et dans chaque réponse JSON :
> Quand nous sommes en mode démo locale, l'attribut `provenance.mode` indique `EXPLICIT_SIMULATED_MOCK`. Nous n'inventons pas de faux scores de confiance neuronaux et nous expliquons clairement que le simulateur déterministe valide la robustesse de l'intégration logicielle et de la persistance PostgreSQL en attendant le raccordement du serveur n8n de Membre 1."
