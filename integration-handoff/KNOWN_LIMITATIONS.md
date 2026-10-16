# Périmètre de Responsabilité & Limitations Connues — Membre 5

**Auteur :** Membre 5 (Frontend Web, Tableau de Bord Municipal, Base PostgreSQL & Contrats d'Intégration)  
**Destinataires :** Tous les membres de l'équipe, Enseignant & Évaluateurs

---

## 1. Délimitation Stricte des Rôles & Honnêteté Technique

Conformément à la déontologie académique et aux directives du projet d'Examen Deep Learning Avancé, **Membre 5 ne s'attribue pas le travail d'IA réalisé par les autres membres** et documente explicitement les frontières architecturales suivantes :

| Composant | Rôle Responsable | Ce que Membre 5 Fournit | Ce qui Dépend d'un Autre Membre |
|---|---|---|---|
| **Portail Citoyen & Cockpit** | **Membre 5** | Interface complète React/TypeScript, design GovTech en français, traçabilité, formulaire, KPI réels | Aucun (100% Membre 5) |
| **Persistance & Données** | **Membre 5** | Schéma PostgreSQL, migrations DDL, transactions ACID, idempotence, journal d'audit immuable | Aucun (100% Membre 5) |
| **Orchestration de Flux** | **Membre 1** | Contrat JSON, connecteur HTTP n8n, gestion des statuts 200/202/422, simulateur déterministe certifié | Fichier de workflow `.json` n8n et nœuds internes exécutés sur l'instance n8n |
| **Classification NLP** | **Membre 2** | Réception de la catégorie, affichage du label, gestion des incohérences texte | Entraînement et inférence des modèles de langage / Transformers |
| **Vision & Anonymisation** | **Membre 3** | Endpoint de téléversement sécurisé, stockage isolé `raw/`, bouclier d'accès public RGPD (HTTP 403) | Modèle de détection YOLO/ResNet et algorithme de floutage des visages/plaques |
| **RAG & Documentation** | **Membre 4** | Affichage des procédures, citations textuelles, calcul de SLA, garde-fous anti-hallucination | Base vectorielle (Chroma/FAISS), embeddings et indexation des PDF municipaux |

---

## 2. Statut des Données en Mode Démonstration

- **Persistance des Données :** **100% Authentique.** Les signalements, tickets, événements d'audit et cas de modération sont physiquement écrits dans PostgreSQL 14 et persistent après extinction ou redémarrage du serveur.
- **Statistiques du Cockpit (KPIs) :** **100% Authentiques.** Les cartes de métriques et le taux de résolution sont calculés par des requêtes SQL `COUNT` directes sur la base de données.
- **Cartographie :** Les coordonnées de latitude et longitude affichées sur les fiches proviennent des signalements réels stockés en base. Le fond de carte interactif utilise un radar stylisé conforme à l'infrastructure municipale de Tunis.

---

## 3. Recommandations pour un Déploiement en Production Réelle

Bien que l'application soit conçue selon les meilleures pratiques d'ingénierie logicielle (architecture modulaire, typage strict TypeScript, validation entrante, politique CORS, gestion des erreurs), un passage en production municipale nécessiterait les durcissements suivants :
1. **Terminaison SSL/TLS :** Déploiement derrière un reverse-proxy Nginx ou Traefik avec certificats Let's Encrypt HTTPS.
2. **Gestionnaire de Sessions Distribué :** Remplacement du jeton Bearer unique d'environnement par un serveur d'authentification centralisé (Keycloak, OAuth2/OIDC) avec stockage Redis pour la révocation instantanée.
3. **Anonymisation Asynchrone :** Découplage du floutage d'images via une file de messages RabbitMQ ou Apache Kafka pour traiter les gros volumes sans latence HTTP.
4. **Pare-feu Applicatif (WAF) :** Filtrage anti-DDoS et limitation de débit IP distribuée (Rate Limiting) sur les endpoints de signalement citoyen.
