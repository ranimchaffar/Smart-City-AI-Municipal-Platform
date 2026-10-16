# Spécification Technique de Référence Visuelle — Smart City AI (Membre 5)

Ce document établit la spécification de reproduction fidèle des deux références visuelles fournies par l'utilisateur pour la plateforme Smart City AI.

---

## 1. Analyse Détaillée de l'Image de Référence 1 : Cockpit des Opérations (« Fixly City Dashboard » / « Operations Center »)

### 1.1. Structure Générale & Proportions
- **Barre Latérale Gauche (Sidebar) :**
  - Largeur : ~250px, fond blanc `#ffffff`, bordure droite subtile `#e2e8f0`.
  - En-tête : Icône pin géolocalisation bleue (`#2563eb`) + Titre de marque en gras « Fixly » (ou « SmartCity ») + sous-titre gris « City Dashboard ».
  - Groupes de Navigation hiérarchisés avec titres de section en majuscules gris clair (`font-size: 11px`, `letter-spacing: 0.05em`) :
    - `WORKSPACE` : Élément `Overview` actif avec fond capsule bleu clair (`rgba(37, 99, 235, 0.08)`), texte bleu `#2563eb`, icône grille 4 carrés.
    - `OPERATIONS` : `Map` (icône carte), `Reports` (icône document), `Work Orders` (icône clé plate / outils), `Alerts` (icône mégaphone / cloche).
    - `MANAGEMENT` : `Analytics` (icône histogramme), `Team` (icône utilisateurs), `Members` (icône ajout utilisateur), `Settings` (icône engrenage).
  - Pied de Sidebar : Carte profil utilisateur avec avatar circulaire bleu initiales « SK », nom en gras « Sarah Khan », rôle « Administrator » et chevron dropdown.
- **Zone de Contenu Principal :**
  - Fond gris très clair / blanc cassé (`#f8fafc`).
  - Marges intérieures : ~28px - 32px.

### 1.2. En-Tête du Tableau de Bord (Header)
- Titre : « Operations Center » (`font-size: 26px`, `font-weight: 700`, couleur `#0f172a`).
- Sous-titre : « Here's what's happening in your city today. » (`font-size: 14px`, couleur `#64748b`).
- Contrôles supérieurs droits :
  - Sélecteur de date en capsule blanche avec bordure : Icône calendrier + « Saturday, April 25 » (ou date du jour).
  - Cloche de notification avec badge circulaire orange « 3 ».
  - Commutateur de session Agent Municipal (jeton Bearer d'environnement).

### 1.3. Bandeau d'Attention Opérationnelle (« Needs Attention »)
- Conteneur arrondi (`border-radius: 16px`), fond dégradé doux teinté orange clair (`#fff7ed`), bordure subtile ambre (`#fed7aa`).
- En-tête du bandeau : Icône mégaphone orange + Titre en gras « Needs Attention » + Badge capsule orange vif « ACTION REQUIRED » + Sous-titre « 3 items need action right now ».
- Grille horizontale de 3 cartes d'alerte :
  1. **Overdue SLA :** Icône triangle d'alerte rouge + « 2 overdue — all within SLA » + « Every active report still has time on the clock. » + Bouton « Resolve now ».
  2. **Unassigned Priority :** Icône utilisateur orange + « 3 unassigned high-priority » + Badge circulaire ambre « NEEDS AN OWNER » + « Assign a team to start the clock. » + Bouton plein orange « Assign now ».
  3. **Tight SLA :** Icône horloge ambre + « 1 nearing SLA breach » + Badge « TIGHTEST: 2H REMAINING » + « Less than 25% of SLA window remaining. » + Bouton plein orange « Review now » (ouvre la file de modération).

### 1.4. Ligne des 5 Cartes KPIs Synthétiques
Disposition en grille de 5 cartes blanches (`border-radius: 12px`, bordure `#e2e8f0`, ombre portée subtile) :
1. `OPEN ISSUES` : Icône presse-papier bleue (`#2563eb`) | Valeur : « 2,128 » (ou tickets réels) | Tendance : « ↗ 8% vs. last week »
2. `OVERDUE` : Icône horloge rouge (`#ef4444`) | Valeur : « 126 » | Tendance : « ↗ 15% vs. last week »
3. `UNASSIGNED` : Icône équipe orange (`#f97316`) | Valeur : « 18 » | Tendance : « ↗ 20% vs. last week »
4. `AVG. RESPONSE TIME` : Icône éclair violette (`#8b5cf6`) | Valeur : « 10h 24m » | Tendance : « ↘ 5% vs. last week »
5. `AVG. RESOLUTION TIME` : Icône cercle vert (`#10b981`) | Valeur : « 18h 42m » | Tendance : « ↘ 7% vs. last week »

### 1.5. Section Centrale : « High-Priority Issues » & « Live Map »
- **Colonne Gauche (High-priority issues) :**
  - Carte blanche avec titre « High-priority issues » + pastille rouge « High » + Lien « View all ».
  - Liste de 5 incidents prioritaires réels :
    - Icône de catégorie colorée en cercle (rouge voirie, jaune éclairage, violet propreté/graffiti, vert déchets).
    - Titre d'incident en gras (ex. « Pothole on 4th & Main ») + coordonnées GPS en sous-titre.
    - Badge de priorité (`• High`, `Medium`, `• Low`).
    - Compteur temps SLA restant en capsule (`⏱ 7h left`, `⏱ 2h left`).
    - Statut en capsule (`IN PROGRESS`, `OPEN`, `RESOLVED`).
    - Bouton d'action « Assign » avec flèche + menu 3 points.
  - Pied : « Showing 1-5 of 24 high-priority issues ».
- **Colonne Droite (Live map) :**
  - Carte blanche avec titre « Live map » + Lien « View full map ».
  - Vue cartographique stylisée représentant le plan urbain avec pins de géolocalisation colorés (Riverview, Oakwide, Downtown, Central District, Lakeside Park).
  - Contrôles de zoom `+` / `-` et recentrage.
  - Légende basse : `● 5 Open` (rouge), `● 3 In progress` (orange), `● 2 Unassigned` (violet), `● 14 Resolved` (vert).

### 1.6. Section Basse : « Recent Reports »
- Carte blanche avec titre « Recent reports » et onglets filtres en capsules :
  - `All 24` (actif, fond bleu), `Open 8`, `In progress 6`, `Resolved 10`.
  - Tableau moderne aux lignes aérées :
    - Colonnes : `Issue`, `Location`, `Category`, `Status`, `Priority`, `Reported`, `Age`.
    - Lignes interactives : le clic ouvre le tiroir d'intervention complet (`TicketDetailDrawer`) avec les sources RAG et le contrôle d'état.

---

## 2. Analyse Détaillée de l'Image de Référence 2 : Portail Citoyen (« Citizen Request » / « Citizen Services »)

### 2.1. En-Tête du Portail (Header)
- Fond blanc pur `#ffffff`, bordure basse discrète `#e2e8f0`.
- Gauche : Icône cercle plein bleu marine sombre (`#19234e`) + Titre de marque en gras « Citizen Request » avec barre de soulignement bleue sous le titre.
- Droite : Liens de navigation et sélecteur d'espace (« Guichet Citoyen » / « Cockpit des Opérations »).

### 2.2. Composition Principale à Deux Colonnes
- **Colonne Gauche (~40% de largeur) :**
  - Grand titre institutionnel : « Citizen Services / Streets and Sidewalks » (`font-size: 24px`, gras, `#1e293b`).
  - Grille 2x2 de grandes cartes de services citoyennes :
    1. **Code Violation :** Boîte d'icône carrée filaire avec document & loupe | Titre : « Code Violation » | Sous-titre : « Report code violation ».
    2. **Sidewalk Repair :** Boîte d'icône carrée avec piéton marchant sur trottoir | Titre : « Sidewalk Repair » | Sous-titre : « Request a sidewalk repair » (sélectionnable avec contour bleu vif).
    3. **Street lights :** Boîte d'icône carrée avec double lampadaire urbain | Titre : « Street lights » | Sous-titre : « Report broken street light ».
    4. **Pothole Repair :** Boîte d'icône carrée avec ouvrier réparant la chaussée | Titre : « Pothole Repair » | Sous-titre : « Request pothole repair ».
  - *Comportement :* Le clic sur l'une des cartes sélectionne immédiatement la catégorie et met à jour dynamiquement le formulaire de droite !
- **Colonne Droite (~60% de largeur) : Formulaire d'Enregistrement :**
  - Carte blanche surélevée (`border-radius: 12px`, bordure `#e2e8f0`, ombre douce).
  - En-tête de carte :
    - Titre du service actif (ex. « Sidewalk Repair » ou « Pothole Repair »).
    - Bouton haut-droit : Bouton contour avec icône imprimante « Print Form » (ou déclencheur de préréglages de test rapide).
  - Bandeau d'alerte / information : Barre rose/rouge clair avec icône avertissement et notice de traitement (ex. SLA d'intervention ou bouclier RGPD).
  - Sous-titre : « Please complete the details below as part of your submission. »
  - Champs du formulaire :
    - Ligne avec « Address » (champ large) et « Zip » (champ code postal / secteur).
    - « Please describe issue » : Zone de texte multiligne avec bordure soignée et coins arrondis.
    - Ligne des boutons d'upload :
      - Bouton capsule violette/bleue claire : `Upload Photos (optional)` avec icône téléversement (permet le vrai upload de photo !).
      - Bouton capsule violette/bleue claire : `Upload Video (optional)`.
    - Champ de suivi : « How long has sidewalk been damaged? » (ou ancienneté de l'anomalie).
    - Case à cocher personnalisée bleu marine cochée : « Does area of repair include ADA sidewalk ramp ».
    - Bouton d'action principal : Bouton arrondi bleu marine plein (`#19234e`, texte blanc) : « Save » (ou « Transmettre le Signalement »).

### 2.3. Continuité Fonctionnelle des Résultats & Suivi
- Sous le formulaire, intégration élégante de la confirmation de soumission (`SubmissionResult`) avec trace animée n8n et décision `PASS`, `REVIEW`, `REJECT`.
- Onglet de suivi citoyen (`TicketTracker`) accessible directement pour consulter la timeline en temps réel.

---

## 3. Charte Graphique & Tokens de Design

| Token | Valeur CSS | Utilisation |
|---|---|---|
| `--bg-app` | `#f8fafc` | Fond d'écran général de l'application |
| `--surface-card` | `#ffffff` | Cartes, tables, conteneurs surélevés |
| `--border-color` | `#e2e8f0` | Bordures de cartes, séparateurs de table |
| `--text-dark` | `#0f172a` | Titres principaux (h1, h2, h3) |
| `--text-body` | `#334155` | Textes de paragraphe, descriptions |
| `--text-muted` | `#64748b` | Sous-titres, libellés secondaires, dates |
| `--primary-blue` | `#2563eb` | Éléments actifs, pins de carte, tendances positives |
| `--navy-button` | `#19234e` | Bouton principal « Save », en-tête citoyen |
| `--accent-orange` | `#f97316` / `#ea580c` | Bannière Needs Attention, boutons d'alerte |
| `--accent-orange-bg` | `#fff7ed` | Fond du conteneur Needs Attention |
| `--accent-orange-border`| `#fed7aa` | Bordure du conteneur Needs Attention |
| `--status-inprogress-bg`| `#fffbeb` | Fond statut In Progress |
| `--status-inprogress-txt`| `#b45309` | Texte statut In Progress |
| `--status-open-bg` | `#fef2f2` | Fond statut Open |
| `--status-open-txt` | `#b91c1c` | Texte statut Open |
| `--status-resolved-bg` | `#ecfdf5` | Fond statut Resolved |
| `--status-resolved-txt` | `#047857` | Texte statut Resolved |
| `--radius-sm` | `6px` | Badges, petites capsules |
| `--radius-md` | `10px` | Champs de formulaire, boutons standards |
| `--radius-lg` | `14px` | Cartes principales, panneaux de contenu |
| `--radius-xl` | `18px` | Bandeau Needs Attention |
