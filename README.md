# Plateforme SONGRER

SONGRER est une plateforme bilatérale sécurisée et temps réel conçue pour l'aide, le signalement et la protection des victimes de Violences Basées sur le Genre (VBG). 

La plateforme se compose de trois modules complémentaires :
- 📱 **songrer-mobile** : Application mobile interactive et anonyme développée en React Native / Expo pour les victimes et témoins.
- 💻 **songrer-dashboard** : Tableau de bord d'administration développé en Next.js pour la gestion des dossiers et la coordination des secours par les ONG.
- ⚙️ **songrer-api** : API REST Node.js / Express servant de passerelle de communication temps réel, avec Prisma ORM et base de données PostgreSQL.

---

## 🔒 Sécurité, anonymat et vérification des signalements

### Anonymat des dossiers
Les dossiers sont conçus pour être **anonymes au niveau applicatif** :
- aucune identité civile n’est demandée pour déposer un signalement
- l’application crée un `anonymousId` technique pour suivre un dossier
- le dossier est consultable uniquement via ce code de suivi ou via le portail sécurisé des ONG

**Important :** un dossier est **pseudonyme**, pas “anonyme absolu” au sens mathématique ou juridique. Cela veut dire que :
- l’application ne collecte pas de nom, prénom ou email pour le suivi
- mais l’infrastructure technique peut quand même avoir des métadonnées d’exploitation (logs applicatifs, horodatage, traces serveur, etc.) selon le mode de déploiement
- pour une confidentialité renforcée, il faut limiter les logs, protéger l’accès à la base et mettre une politique de rétention courte

### Comment vérifier la véracité d’un signalement
Une plateforme de protection ne peut pas “prouver” automatiquement qu’un témoignage est vrai ou faux. Le bon fonctionnement repose sur une **validation humaine et graduelle** :

1. **Triage automatique**
	- le système détecte des signaux de danger, d’urgence ou de violence
	- le dossier reçoit un statut initial comme `pending` ou `urgent`

2. **Revue par un humain / ONG**
	- une personne habilitée lit le dossier
	- elle vérifie la cohérence du récit, la gravité et le niveau de risque

3. **Croisement des indices**
	- comparaison avec d’autres signalements éventuels
	- éléments de contexte géographique ou temporel
	- messages, notes, audio ou détails fournis par la victime

4. **Demande de précisions si possible**
	- sans mettre la victime en danger
	- sans exiger de preuve immédiate pour recevoir de l’aide

5. **Décision opérationnelle**
	- `urgent` : intervention rapide si le risque est élevé
	- `in_progress` : enquête / suivi en cours
	- `resolved` ou `closed` : dossier traité ou clôturé

### Bonne pratique recommandée
Pour améliorer la fiabilité sans casser l’anonymat :
- ne jamais exiger de pièce d’identité à l’entrée du dossier
- conserver un historique minimal mais utile
- séparer la **confidentialité** du **niveau de confiance** du dossier
- permettre un statut “à confirmer” ou “à vérifier” côté ONG
- garder l’humain dans la boucle pour toute décision sensible

### Ce qu’il faut éviter
- considérer un signalement comme “vrai” ou “faux” uniquement par automatisation
- afficher des données sensibles à des rôles non autorisés
- stocker plus d’informations que nécessaire
- rendre les identifiants de suivi devinables

---

## 🧪 Audit de sécurité de l’application

L’audit statique réalisé sur la solution a mis en évidence plusieurs points sensibles, dont certains ont déjà été corrigés.

### Problèmes identifiés

#### Contrôle d’accès trop faible sur l’API
- certaines routes d’administration étaient seulement protégées par l’authentification
- cela permettait à un utilisateur connecté non autorisé de modifier des ressources sensibles

#### Identifiants de suivi prévisibles
- les anciens codes anonymes étaient générés côté client avec `Math.random()`
- le format était facile à deviner et exposait les dossiers au bruteforce

#### Session d’administration trop exposée
- le token admin était initialement stocké côté navigateur de manière trop accessible
- en cas de XSS, l’accès au compte pouvait être compromis

#### Mots de passe et secrets trop visibles
- présence de valeurs de démonstration et de secrets par défaut dans la configuration
- risque élevé si un environnement de test est réutilisé en production

#### Endpoints sensibles sans anti-abus spécifique
- login, chat IA et tracking public pouvaient être abusés par envoi répété de requêtes

### Corrections appliquées

- ajout d’un contrôle de rôles sur les routes sensibles de l’API
- génération serveur du `anonymousId` pour les signalements
- durcissement des validations Zod sur les payloads
- ajout de rate limits dédiés sur `/auth/login`, `/chat`, `/reports` et `/reports/track/:anonymousId`
- passage du dashboard à une session `HttpOnly`
- retrait des secrets et identifiants de démo codés en dur
- ajout de fichiers `.env` / `.env.example` avec variables explicites

### Risques résiduels à surveiller

- le mode offline/mock du mobile reste utile mais doit être considéré comme un mode de démonstration, pas comme un mécanisme de sécurité
- un dossier est **pseudonyme** et non “anonyme absolu” au sens légal : il faut donc appliquer une politique stricte de logs et de rétention
- la validation finale des signalements doit toujours être humaine pour éviter les faux positifs / faux négatifs

### Recommandations opérationnelles

- conserver l’accès au dashboard pour `SUPER_ADMIN`, `ADMIN`, `NGO` uniquement
- protéger l’API derrière HTTPS et un reverse proxy
- limiter la rétention des logs techniques
- utiliser des secrets longs et uniques en production
- garder un processus de vérification humaine pour chaque dossier sensible

### Vérification complémentaire (mise à jour)

Un second passage a confirmé les points suivants :

**Points sains, vérifiés dans le code actuel :**
- endpoints d’administration (`reports`, `organizations`, `statistics`, `videos`) correctement protégés par `requireAuth` + `requireRole`, avec les bons rôles selon la ressource
- `requireAuth` revérifie que l’utilisateur est actif (`isActive`) en base à chaque requête, pas seulement la validité du token
- `helmet()`, liste blanche CORS stricte, limite de taille du body JSON (100kb), rate limit global + rate limits dédiés (`/auth/login`, `/chat`, `/reports`, `/reports/track/:anonymousId`)
- gestion d’erreurs qui ne fuit aucun détail technique en production
- le cookie de session (`songrer_admin_session`) est bien `HttpOnly` / `sameSite: lax` / `secure` en production, et le token JWT renvoyé dans le corps JSON de `/auth/login` n’est ni stocké ni réutilisé côté client (seules les infos non sensibles de l’utilisateur vont en `localStorage`)

**Points restants à traiter (non bloquants pour la démo) :**
- `GET /organizations`, `GET /statistics`, `GET /videos` sont publics (sans authentification) — à confirmer que ce sont bien des données destinées à être publiques
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` : toute valeur `NEXT_PUBLIC_*` est intégrée en clair dans le bundle JS du dashboard au build. Ce mode ne doit donc être activé qu’avec un compte de démonstration factice, jamais avec un vrai compte admin, et désactivé (`ENABLE_DEMO_LOGIN=false`) pour tout déploiement au-delà de la démo
- fichiers `songrer-api/test_db*.mjs` : scripts de debug contenant une URL Postgres locale en dur — à retirer du dépôt (ajoutés au `.gitignore`)
- signalements mis en cache en clair dans le `localStorage` du mobile (mode hors-ligne) — acceptable pour la démo, à chiffrer ou limiter dans le temps pour un usage réel, vu la sensibilité des données pour des victimes de VBG
- **visibilité du dépôt GitHub** : à date, le dépôt est public, donc le code source est librement cloneable par n’importe qui. À décider selon les règles du hackathon (repo privé + organisateurs en collaborateurs si le règlement le permet), avec dans tous les cas une licence explicite (« tous droits réservés ») plutôt que le `LICENSE` MIT résiduel du template Expo actuellement présent dans `songrer-mobile/`

---

## 🚀 Guide de Démarrage Rapide

### 1. Configuration des variables d'environnement
À la racine du projet, créez les fichiers de configuration locale à partir des modèles :

```bash
# Pour le backend API
cp songrer-api/.env.example songrer-api/.env

# Pour le Dashboard Next.js
cp songrer-dashboard/.env.example songrer-dashboard/.env.local

# Pour l'application mobile
cp songrer-mobile/.env.example songrer-mobile/.env
```

### 1.1 Vérification des prérequis locaux
Avant de lancer quoi que ce soit, assurez-vous d’avoir :
- **Docker Desktop** démarré
- **Node.js 18+** installé sur votre machine
- un terminal PowerShell / VS Code qui voit bien `node`, `npm` et `docker`

Si `node` ou `npm` ne sont pas reconnus, installez Node.js ou ajoutez-le au `PATH` avant de continuer.

### 2. Démarrage de la base de données & du Backend (Docker)
Assurez-vous que Docker est démarré, puis lancez les conteneurs PostgreSQL et l'API :

```bash
docker compose up -d --build
```
*Cette commande initialise automatiquement la base de données, applique les migrations Prisma et pré-alimente la base avec les organisations d'aide et les vidéos de sensibilisation.*

Si vous voulez vérifier que l’API répond, ouvrez :

- `http://localhost:4000/health`

### 3. Lancement du Dashboard (ONG / Administrateur)

Le dashboard utilise la configuration de `songrer-dashboard/.env.local`. Le fichier de base à copier est `songrer-dashboard/.env.example`.

Ouvrez un nouveau terminal et exécutez :

```bash
cd songrer-dashboard
npm install
npm run dev
```
Accédez au Dashboard sur : **`http://localhost:3000`**

**Identifiants de démonstration :**
- définis via les variables d’environnement locales (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) avant le seed.

### 4. Lancement de l'Application Mobile

Le mobile utilise `songrer-mobile/.env` (copié depuis `songrer-mobile/.env.example`).

Ouvrez un nouveau terminal et exécutez :

```bash
cd songrer-mobile
npm install
npx expo start --port 8082
```
- Appuyez sur **`w`** pour ouvrir l'application dans votre navigateur internet (`http://localhost:8082`).
- Ou scannez le code QR avec votre téléphone via l'application **Expo Go**.

### Variables d’environnement importantes
- `JWT_SECRET` : secret de signature des sessions
- `DATABASE_URL` : connexion PostgreSQL
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` : compte admin créé au seed
- `CORS_ORIGIN` : origines autorisées pour l’API
- `LLM_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL` : configuration du module IA
- `NEXT_PUBLIC_API_URL` : URL de l’API utilisée par le dashboard / mobile
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` : active ou non le mode démo du dashboard

### Recommandations de déploiement
- ne jamais laisser `admin123` ou un secret par défaut en production
- activer des logs limités et une politique de rétention courte
- restreindre l’accès au dashboard aux seuls rôles autorisés
- conserver le service API derrière un reverse proxy HTTPS