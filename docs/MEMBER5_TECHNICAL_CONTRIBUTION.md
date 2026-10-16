# Contribution Technique & Responsabilités — Membre 5

**Étudiant :** Membre 5  
**Projet :** Système Automatisé de Billetterie Municipale & Plateforme Smart City Multi-Agents  
**Cours :** Examen Deep Learning Avancé — ESPRIT 5DS  
**Périmètre Attribué :** Application Web Citoyenne, Tableau de Bord Municipal, Persistance PostgreSQL & Interfaces d'Intégration d'Équipe

---

## 1. Rôle dans l'Architecture Multi-Agents

Au sein de l'équipe de 5 membres, **Membre 5 est le garant de l'expérience utilisateur finale, de l'intégrité des données persistantes et de la passerelle d'intégration**.

Alors que les Membres 1 à 4 se concentrent sur le pipeline d'IA (orchestration n8n, classification NLP, vision par ordinateur, recherche RAG), **Membre 5 transforme ces modèles théoriques en un service public opérationnel, ergonomique et conforme aux standards de sécurité gouvernementaux (GovTech)** :

1. **Portail Citoyen Moderne ("Guichet Citoyen") :** Interface accessible et responsive en français permettant aux administrés de signaler les anomalies urbaines (nids-de-poule, lampadaires brisés, dépôts sauvages, fuites d'eau) avec téléversement de photos et géolocalisation.
2. **Cockpit des Opérations Métropolitaines ("Cockpit des Opérations") :** Tableau de bord pour les agents communaux avec KPIs réels calculés depuis PostgreSQL, registre complet des tickets, file de modération humaine (garde-fous) et cartographie d'intervention.
3. **Persistance des Données (PostgreSQL 14) :** Conception du schéma relationnel normalisé, gestion des transactions ACID, idempotence par `report_id` et journal d'audit immuable (`ticket_events`).
4. **Contrats & Passerelles d'Intégration :** Réception et validation des statuts HTTP officiels (`200 PASS`, `202 REVIEW`, `422 REJECT`), bouclier de confidentialité RGPD pour les images, et connecteur transparent vers l'orchestrateur n8n de Membre 1.

---

## 2. Justification des Choix Technologiques

| Technologie | Rôle | Rationale Architectural |
|---|---|---|
| **React 18 + Vite + TypeScript** | Frontend | Rendu ultra-rapide (HMR < 50ms), typage strict garantissant la cohérence avec les payloads d'IA, modularité par composants réutilisables, pas de framework CSS externe lourd (Vanilla CSS GovTech sur-mesure inspiré du système Marianne). |
| **Express.js + Node.js (ESM)** | Backend API | Léger, non-bloquant et hautement performant pour l'orchestration asynchrone d'appels HTTP vers n8n. Architecture claire avec routeurs spécialisés, validation des requêtes et gestion centralisée des erreurs. |
| **PostgreSQL 14** | Persistance | Base relationnelle ACID robuste garantissant l'intégrité référentielle, contraintes d'unicité pour l'idempotence, index b-tree optimisés pour les requêtes du dashboard, et traçabilité inviolable sans perte de données au redémarrage. |
| **Vanilla CSS Design System** | UI/UX | Palette institutionnelle soignée (Bleu nuit `#1e3a8a`, Émeraude `#059669`, Ambre `#d97706`), typage Inter/JetBrains Mono, micro-animations discrètes, conformité WCAG d'accessibilité et adaptabilité mobile/desktop. |

---

## 3. Matrice de Réalisation des Objectifs Membre 5

| Objectif Spécifié | Statut | Preuve d'Implémentation |
|---|---|---|
| **Guichet Citoyen en Français** | **100% PASS** | Formulaire avec 4 catégories, téléversement avec bouclier RGPD, détection GPS, 4 boutons de préréglage de test (`ReportForm.tsx`). |
| **Traçabilité du Signalement** | **100% PASS** | Suivi par ID de ticket/signalement avec timeline verticale alimentée par les événements SQL réels (`TicketTracker.tsx`). |
| **Cockpit Municipal & KPIs** | **100% PASS** | 4 cartes statistiques calculées par requêtes `COUNT` PostgreSQL en direct (`KpiCards.tsx`, `/api/dashboard/stats`). |
| **File de Modération Humaine** | **100% PASS** | Interface de tri des escalades avec modal d'arbitrage pour valider ou rejeter un signalement mis en attente (`ReviewQueue.tsx`). |
| **Sécurité & Authentification** | **100% PASS** | Jeton Bearer d'environnement `STAFF_AUTH_TOKEN`, blocage HTTP 401 pour les actions non autorisées, protection HTTP 403 des photos non anonymisées (`StaffAuthModal.tsx`). |
| **Persistance PostgreSQL** | **100% PASS** | Données confirmées dans PostgreSQL 14 (18+ rapports, 13+ tickets, 31+ événements, 9+ révisions). Survit aux arrêts du serveur (`tests/restart-persistence-test.mjs`). |
| **Intégration n8n (Live & Mock)** | **100% PASS** | Basculement sans arrêt serveur via `/api/admin/set-n8n-mode`. Erreur HTTP 502 explicite si le serveur live n8n échoue, sans basculement silencieux trompeur. |
| **Dossier d'Intégration Équipe** | **100% PASS** | 10 fichiers techniques complets dans `integration-handoff/`, collection Postman et script de validation cURL. |
