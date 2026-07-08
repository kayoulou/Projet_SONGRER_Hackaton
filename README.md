# Plateforme SONGRE

SONGRE est une plateforme bilatérale sécurisée et temps réel conçue pour l'aide, le signalement et la protection des victimes de Violences Basées sur le Genre (VBG). 

La plateforme se compose de trois modules complémentaires :
- 📱 **songrer-mobile** : Application mobile interactive et anonyme développée en React Native / Expo pour les victimes et témoins.
- 💻 **songrer-dashboard** : Tableau de bord d'administration développé en Next.js pour la gestion des dossiers et la coordination des secours par les ONG.
- ⚙️ **songrer-api** : API REST Node.js / Express servant de passerelle de communication temps réel, avec Prisma ORM et base de données PostgreSQL.

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

### 2. Démarrage de la base de données & du Backend (Docker)
Assurez-vous que Docker est démarré, puis lancez les conteneurs PostgreSQL et l'API :

```bash
docker compose up -d --build
```
*Cette commande initialise automatiquement la base de données, applique les migrations Prisma et pré-alimente la base avec les organisations d'aide et les vidéos de sensibilisation.*

### 3. Lancement du Dashboard (ONG / Administrateur)
Ouvrez un nouveau terminal et exécutez :

```bash
cd songrer-dashboard
npm install
npm run dev
```
Accédez au Dashboard sur : **`http://localhost:3000`**

**Identifiants de démonstration :**
- **Email** : `admin@songrer.org`
- **Mot de passe** : `admin123`

### 4. Lancement de l'Application Mobile
Ouvrez un nouveau terminal et exécutez :

```bash
cd songrer-mobile
npm install
npx expo start --port 8082
```
- Appuyez sur **`w`** pour ouvrir l'application dans votre navigateur internet (`http://localhost:8082`).
- Ou scannez le code QR avec votre téléphone via l'application **Expo Go**.
