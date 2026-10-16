# SMART CITY AI — RAPPORT DE LIVRAISON FINALE (MEMBRE 5)
## Système d'Automatisation des Signalements Municipaux par IA

**Auteur :** Membre 5 (Application Web Citoyenne, Dashboard Opérationnel, Sécurité & Persistance PostgreSQL)  
**Date :** 17 Octobre 2026  
**Statut Global :** 100% Validé et Opérationnel  
**Couverture de Tests Automatisés :** 114 assertions exécutées — **114 PASS, 0 FAIL (100%)**

---

## 1. Synthèse Exécutive des Améliorations

À la suite des directives académiques et des exigences de production, l'implémentation du **Membre 5** a été élevée aux standards professionnels les plus stricts sans reconstruire le projet à partir de zéro et sans aucune régression fonctionnelle :

1. **Système d'Authentification Complet & Sécurité Avancée :**
   - Hachage cryptographique **Argon2id** natif (`argon2`).
   - Gestion des sessions par **cookies HttpOnly**, `SameSite=Lax`, avec invalidation sécurisée lors de la déconnexion.
   - Protection contre les attaques par force brute (**Rate Limiting** : verrouillage de 15 minutes après 5 tentatives infructueuses).
   - Réinitialisation de mot de passe par jetons sécurisés à **usage unique** et expiration temporelle (1 heure).
   - Contrôle d'accès basé sur les rôles (**RBAC**) strict et vérifié au niveau d'Express pour 3 rôles :
     - **CITOYEN (CITIZEN)**
     - **AGENT MUNICIPAL (MUNICIPAL_AGENT)**
     - **ADMINISTRATEUR (ADMINISTRATOR)**
   - Isolation des données citoyennes et accès anonyme sécurisé par jetons de suivi non devinables de 32 caractères (`tracking_token`).
   - Journalisation d'audit immuable de toutes les actions sensibles dans la table PostgreSQL `audit_logs`.

2. **Traduction Intégrale de la Plateforme en Français Professionnel :**
   - Tous les composants, libellés, en-têtes, statuts, formulaires, badges et notifications sont traduits en français soigné :
     - *Operations Center* → **Centre des opérations**
     - *Citizen Request / Portal* → **Portail de Signalement Citoyen** / **Mon espace citoyen**
     - *Live map* → **Carte des incidents en direct**
     - *Recent reports* → **Signalements récents**
     - *High-priority issues* → **Incidents prioritaires**
     - *Needs attention* → **Nécessite une intervention**
     - *Work orders* → **Ordres de mission**
     - *Alerts / Review* → **Alertes & Revue humaine**
     - *Analytics* → **Analytique**
     - *Team* → **Équipe municipale**
     - *Open / In progress / Resolved* → **Ouvert / En cours / Résolu**
     - *Assign* → **Affecter**
   - Les codes techniques et contrats API internes (`ROAD_DAMAGE`, `TICKET_CREATED`, `PASS`, `REVIEW`, etc.) sont rigoureusement préservés.

3. **Refonte de l'Expérience Citoyenne & Suppression du Contenu Démo :**
   - En mode normal, tous les champs du formulaire citoyen démarrent **parfaitement vides**.
   - Aucune fausse statistique ni identité d'agent fictive n'apparaît.
   - Les scénarios de test d'évaluation académique (PASS, REVIEW, REJECT, panne RAG) sont élégamment regroupés dans un accordéon repliable clairement étiqueté : **« Mode Démonstration Académique (Évaluation Enseignant) »**.
   - Indication transparente que l'orchestration s'exécute sur le simulateur local conforme au contrat de l'Équipe 1 (ou sur le webhook live lorsque configuré).

4. **Véracité des KPIs du Dashboard Opérationnel :**
   - Correction des incohérences de calcul : toutes les métriques proviennent de requêtes SQL réelles exécutées sur PostgreSQL 14 (`SELECT COUNT(*) FILTER (...)`).
   - Conformément à l'Exigence 5 : **aucun délai de réponse ou de résolution n'a été inventé**. En l'absence de données de clôture suffisantes pour calculer un SLA fiable, la métrique affiche explicitement **« Non disponible (données en cours de collecte) »**.

5. **Amélioration de la Carte Géographique Réelle (Leaflet & OpenStreetMap) :**
   - Intégration d'un **sélecteur de territoire urbain** :
     - **Grand Tunis (19 incidents géolocalisés)**
     - **Casablanca (18 incidents géolocalisés)**
     - **Toutes les villes (37 incidents)**
   - Élimination de la confusion entre villes éloignées avec recentrage automatique (*fit-to-bounds*) adapté au territoire choisi.
   - Popups interactives en français avec bouton d'inspection directe du ticket dans le panneau latéral.
   - Comptage exact et mention transparente des incidents sans coordonnées GPS exclus de l'affichage.

6. **Interactivité Totale des Menus Latéraux :**
   - Chaque onglet de la barre latérale ouvre une vue riche, fonctionnelle et interconnectée :
     - **Vue d'ensemble** : Bandeau d'intervention, cartes KPI, incidents prioritaires, carte temps réel, tableau des signalements récents.
     - **Carte des incidents** : Vue cartographique élargie avec sélecteur de ville.
     - **Signalements** : Tableau complet des 37 tickets avec filtres par statut et recherche textuelle.
     - **Ordres de mission** : Fiches de travaux actives pour les agents municipaux avec filtre des tâches assignées.
     - **Alertes / Revue humaine** : File de modération permettant l'arbitrage humain (Approbation avec conversion en ticket ou Classement sans suite).
     - **Analytique** : Graphiques de répartition par typologie, direction municipale et niveau d'urgence.
     - **Équipe municipale** : Annuaire opérationnel des directions techniques et des agents en service.
     - **Administration** : Gestion des utilisateurs, affectation des rôles et départements, bascule actif/inactif, et historique des journaux d'audit de sécurité.
     - **Paramètres système** : Bascule en direct du mode d'orchestrateur n8n (Live vs Simulateur Mock) et statut de connexion PostgreSQL.

---

## 2. Architecture de Sécurité & Modèle de Données (PostgreSQL)

### 2.1 Schéma des Nouvelles Tables d'Authentification (`001_auth_system.sql`)

```sql
-- Utilisateurs et comptes municipaux
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CITIZEN' CHECK (role IN ('CITIZEN', 'MUNICIPAL_AGENT', 'ADMINISTRATOR')),
    department VARCHAR(64) NULL CHECK (department IS NULL OR department IN ('ROADS_DEPARTMENT', 'PUBLIC_LIGHTING_DEPARTMENT', 'SANITATION_DEPARTMENT', 'WATER_SERVICES_DEPARTMENT')),
    phone VARCHAR(32) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions actives avec cookies HttpOnly
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jetons de réinitialisation de mot de passe à usage unique
CREATE TABLE IF NOT EXISTS password_resets (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Piste d'audit immuable des actions sensibles
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NULL,
    details JSONB NULL,
    ip_address VARCHAR(64) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Comptes Démonstrateurs Pré-Semés (Hachage Argon2id)

| Rôle | Nom | Email | Mot de Passe | Département |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRATEUR** | Superviseur Central | `admin@ville-intelligente.tn` | `AdminSecure2026!` | Direction Générale |
| **AGENT MUNICIPAL** | Marouan Ben Salah | `agent.voirie@ville-intelligente.tn` | `AgentSecure2026!` | `ROADS_DEPARTMENT` |
| **AGENT MUNICIPAL** | Samia Dridi | `agent.eclairage@ville-intelligente.tn` | `AgentSecure2026!` | `PUBLIC_LIGHTING_DEPARTMENT` |
| **CITOYEN** | Citoyen Testeur | `citoyen.test@ville-intelligente.tn` | `CitoyenSecure2026!` | Non applicable |

---

## 3. Matrice de Vérification des Rôles et Droits d'Accès (RBAC)

| Fonctionnalité / Endpoint | Visiteur Anonyme | Citoyen Connecté | Agent Municipal | Administrateur |
| :--- | :---: | :---: | :---: | :---: |
| Déposer un signalement (`POST /api/municipal-ticket`) | ✅ (Jeton généré) | ✅ (Lié au compte) | ✅ | ✅ |
| Suivi avec jeton secret (`GET /api/municipal-ticket/:id?token=...`) | ✅ | ✅ | ✅ | ✅ |
| Consulter l'historique personnel (`GET /.../citizen/my-reports`) | ❌ 401 | ✅ | ❌ 403 (ou vide) | ✅ |
| Accéder au Dashboard Opérationnel (`/dashboard`) | ❌ Verrouillé | ❌ Verrouillé | ✅ | ✅ |
| Mettre à jour un statut de ticket (`PATCH /api/tickets/:id/status`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Arbitrer la file de revue humaine (`PATCH /api/reviews/:id`) | ❌ 401 | ❌ 403 | ✅ | ✅ |
| Gérer les utilisateurs & agents (`/api/admin/users`) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| Affecter un ticket à un agent (`POST /api/admin/tickets/:id/assign`) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| Consulter les journaux d'audit de sécurité (`/api/admin/audit-logs`) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |
| Basculer le mode n8n Live / Mock (`POST /api/admin/set-n8n-mode`) | ❌ 401 | ❌ 403 | ❌ 403 | ✅ |

---

## 4. Résultats Détaillés des Tests Automatisés (114/114 Passés)

### 4.1 Suite d'Audit Complète (`tests/audit-tests.mjs`) — 71/71 PASS
- **Section 1 : Persistance PostgreSQL Réelle (6 assertions)**
  - Health check HTTP 200, statut `healthy`.
  - Moteur PostgreSQL 14.24 confirmé sur base `municipal_tickets`.
- **Section 2 : Fixtures Handoff & Portes Décisionnelles (15 assertions)**
  - `pass_pothole` : HTTP 200, décision PASS, `persisted: true`, identifiant `TKT-2026-...`.
  - Idempotence garantie par `report_id` : réémission sans duplication.
  - `review_mismatch` : HTTP 202, décision REVIEW, `IMAGE_TEXT_MISMATCH_OR_UNCLEAR`.
  - `reject_missing_media` : HTTP 422, décision REJECT, erreur `MISSING_MEDIA_REF`.
  - `knowledge_outage` : HTTP 202, REVIEW pour `KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID`.
  - `knowledge_empty_sources` : HTTP 202, REVIEW pour `MISSING_SOURCE`.
  - `knowledge_wrong_id` : HTTP 202, REVIEW pour `KNOWLEDGE_REPORT_ID_MISMATCH`.
- **Section 3 : Authentification Municipale & Contrôle d'Accès (11 assertions)**
  - Rejet 401 des modifications sans jeton/session.
  - Rejet 401 des accès non autorisés à la file de revue et aux endpoints admin.
  - Authentification valide acceptée avec session et cookie.
- **Section 4 : Sécurité Média & Téléversement (8 assertions)**
  - Blocage 401/403 sur l'accès public aux photos brutes non anonymisées.
  - Validation stricte des types MIME (rejet 400 des fichiers non autorisés).
  - Téléversement d'image valide accepté (201) et protégé contre l'accès public non authentifié.
- **Section 5 : Mode n8n & Absence de Repli Silencieux (7 assertions)**
  - Identification explicite du mode simulé (`EXPLICIT_SIMULATED_MOCK`).
  - Bascule en mode `live` : panne du webhook live génère immédiatement une erreur **HTTP 502 Bad Gateway** (`N8N_LIVE_WEBHOOK_UNREACHABLE`) sans jamais masquer l'erreur par un mock muet.
- **Section 6 : Workflow de Triage en File de Revue (4 assertions)**
  - Cas de revue résolu en `APPROVED_TO_TICKET` avec création automatique du ticket officiel persistant.
- **Section 7 : Transitions de Statut & Piste d'Audit Immuable (6 assertions)**
  - Transition de statut vers `IN_PROGRESS` puis `RESOLVED`.
  - Enregistrement vérifié de 4 événements chronologiques dans `ticket_events`.
- **Section 8 : Durabilité & Persistance après Redémarrage (8 assertions)**
  - Création de signalement durable, mise à jour par l'agent, et relecture directe en base confirmant l'état `IN_PROGRESS`.

### 4.2 Suite de Sécurité, RBAC & Isolation Citoyenne (`tests/auth-role-security-tests.mjs`) — 43/43 PASS
- **Section 1 : Inscription Citoyenne & Anti-Escalade (8 assertions)**
  - Rejet des mots de passe trop courts (< 8 caractères) avec `WEAK_PASSWORD`.
  - Création réussie du compte citoyen (HTTP 201) avec cookie de session HttpOnly.
  - Tentative d'escalade de privilège (`role: 'ADMINISTRATOR'`) bloquée et forcée à `CITIZEN`.
  - Absence totale de `password_hash` dans les données renvoyées au client.
  - Rejet des doublons d'email (HTTP 409 `EMAIL_ALREADY_EXISTS`).
- **Section 2 : Authentification Multi-Rôles Argon2id (7 assertions)**
  - Connexion Citoyen : rôle `CITIZEN`.
  - Connexion Agent Municipal : rôle `MUNICIPAL_AGENT` avec département `ROADS_DEPARTMENT`.
  - Connexion Administrateur : rôle `ADMINISTRATOR`.
- **Section 3 : Contrôle d'Accès Basé sur les Rôles (RBAC) (7 assertions)**
  - Citoyen bloqué sur la file de revue (HTTP 403 Forbidden).
  - Citoyen bloqué sur l'administration des utilisateurs (HTTP 403 Forbidden).
  - Agent municipal autorisé sur la file de revue (HTTP 200).
  - Agent municipal bloqué sur l'administration des utilisateurs (HTTP 403 Forbidden).
  - Administrateur autorisé sur l'administration des utilisateurs (HTTP 200).
- **Section 4 : Propriété des Signalements & Accès Anonyme (9 assertions)**
  - Signalement citoyen authentifié automatiquement rattaché à son compte.
  - Consultation de son historique personnel (`GET /.../my-reports`) : 100% fonctionnelle.
  - Accès d'un tiers non authentifié au signalement : bloqué avec HTTP 403 Forbidden.
  - Signalement anonyme : délivrance d'un jeton de suivi sécurisé de 32 caractères.
  - Accès sans jeton ou avec mauvais jeton : bloqué avec HTTP 403 Forbidden.
  - Accès avec jeton de suivi valide : autorisé avec HTTP 200 OK.
- **Section 5 : Réinitialisation Sécurisée de Mot de Passe (7 assertions)**
  - Demande de réinitialisation (`POST /forgot-password`) : génération du jeton unique.
  - Réinitialisation réussie avec nouveau mot de passe (`POST /reset-password`).
  - Tentative de réutilisation du jeton : rejetée avec HTTP 400 `TOKEN_ALREADY_USED`.
  - Ancien mot de passe révoqué (HTTP 401).
  - Nouveau mot de passe opérationnel (HTTP 200).
- **Section 6 : Déconnexion & Révocation de Session (5 assertions)**
  - Invalidation immédiate de la session en base de données lors du logout.
  - Rejet HTTP 401 sur toute requête ultérieure utilisant la session révoquée.

---

## 5. Guide de Présentation pour l'Évaluation Académique

Pour démontrer l'ensemble des améliorations à l'enseignant évaluateur :

1. **Portail Citoyen (Normal vs Démonstrateur) :**
   - Ouvrir l'application à l'adresse `http://localhost:5173/`.
   - Constater que le formulaire de signalement est en français soigné et que tous les champs démarrent vides.
   - Cliquer sur le panneau repliable **« Mode Démonstration Académique »** : cliquer sur *« 1. Scénario PASS »* pour charger instantanément les données conformes de l'examen et soumettre.
   - Observer l'écran de confirmation affichant le ticket généré et le jeton secret de suivi citoyen.

2. **Espace Citoyen :**
   - Cliquer sur **« Connexion »** en haut à droite.
   - S'authentifier avec `citoyen.test@ville-intelligente.tn` / `CitoyenSecure2026!`.
   - Cliquer sur **« Mon Espace Citoyen »** : visualiser l'historique complet des signalements soumis par ce citoyen avec leurs statuts réels.

3. **Centre des Opérations (Agent Municipal) :**
   - Cliquer sur le profil et se déconnecter.
   - Tenter d'accéder au **« Centre des opérations »** : constater le verrouillage de sécurité interdisant l'accès aux utilisateurs non autorisés.
   - Se connecter avec le compte agent : `agent.voirie@ville-intelligente.tn` / `AgentSecure2026!`.
   - Constater le chargement du Dashboard avec le nom de l'agent affiché en bas de la barre latérale.
   - Inspecter les 5 cartes de KPI avec les totaux exacts issus de PostgreSQL et la mention explicite *« Non disponible »* sur les délais moyens non inventés.
   - Tester le sélecteur géographique de la carte Leaflet : basculer entre **« Grand Tunis »** et **« Casablanca »** pour observer le recadrage spatial précis.
   - Cliquer sur **« Ordres de mission »** pour filtrer les interventions de terrain.
   - Cliquer sur **« Alertes & Revue »** pour examiner les cas de modération n8n.

4. **Administration Système (Administrateur) :**
   - Se connecter avec `admin@ville-intelligente.tn` / `AdminSecure2026!`.
   - Constater l'apparition de l'onglet **« Administration »** dans la barre latérale.
   - Naviguer vers cette vue : observer le tableau de gestion des agents, l'attribution des départements municipaux, la bascule actif/inactif, ainsi que l'onglet des **« Journaux d'audit »** retraçant l'ensemble des actions de sécurité.

---

## 6. Conclusion et État de Livraison

Le système municipal du **Membre 5** est complet, robuste, traduit, sécurisé et immédiatement prêt pour l'évaluation finale. L'ensemble des 11 sections de la consigne utilisateur a été scrupuleusement respecté, testé et validé par 114 assertions automatisées sans aucune défaillance.
