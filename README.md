# Invoice Designer Engine

Un éditeur WYSIWYG de templates de factures avec support du glisser-déposer, permettant aux utilisateurs de créer, éditer et gérer des mises en page de factures personnalisées.

## 🚀 Installation Locale

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 20 ou supérieure) - [Télécharger Node.js](https://nodejs.org/)
- **PostgreSQL** (version 12 ou supérieure) - [Télécharger PostgreSQL](https://www.postgresql.org/download/)
- **npm** (généralement inclus avec Node.js)

### Installation Rapide

#### Option 1 : Utiliser le script d'installation automatique (Recommandé)

1. Clonez le dépôt :
```bash
git clone https://github.com/hackolite/Invoice-Designer-engine.git
cd Invoice-Designer-engine
```

2. Exécutez le script d'installation :
```bash
./setup.sh
```

Le script va :
- ✓ Vérifier les prérequis (Node.js, PostgreSQL)
- ✓ Créer le fichier de configuration `.env`
- ✓ Installer les dépendances npm
- ✓ Configurer la base de données PostgreSQL
- ✓ Exécuter les migrations de la base de données

3. Suivez les instructions à l'écran pour configurer votre connexion à la base de données.

#### Option 2 : Installation Manuelle

1. Clonez le dépôt :
```bash
git clone https://github.com/hackolite/Invoice-Designer-engine.git
cd Invoice-Designer-engine
```

2. Créez le fichier `.env` à partir du template :
```bash
cp .env.example .env
```

3. Éditez le fichier `.env` avec vos paramètres de base de données :
```env
DATABASE_URL=postgresql://votre_utilisateur:votre_mot_de_passe@localhost:5432/invoice_designer
NODE_ENV=development
PORT=5000
SESSION_SECRET=votre_secret_aleatoire_ici
```

4. Créez la base de données PostgreSQL :
```bash
# Connectez-vous à PostgreSQL
psql -U postgres

# Créez la base de données
CREATE DATABASE invoice_designer;

# Créez un utilisateur (optionnel)
CREATE USER invoice_user WITH PASSWORD 'invoice_password';
GRANT ALL PRIVILEGES ON DATABASE invoice_designer TO invoice_user;

# Quittez psql
\q
```

5. Installez les dépendances :
```bash
npm install
```

6. Exécutez les migrations de base de données :
```bash
npm run db:push
```

## 🎯 Utilisation

### Démarrer l'application en mode développement

```bash
npm run dev
```

L'application sera accessible à : **http://localhost:5000**

### Build et démarrage en mode production

```bash
# Construire l'application
npm run build

# Démarrer en production
npm start
```

## 📋 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur de développement avec rechargement automatique |
| `npm run build` | Construit l'application pour la production |
| `npm start` | Démarre l'application en mode production |
| `npm run check` | Vérifie les types TypeScript |
| `npm run db:push` | Applique le schéma de base de données |
| `npm run db:setup` | Configure la base de données (création + schéma) |
| `npm run db:setup:reset` | Réinitialise complètement la base de données |
| `npm run db:setup:seed` | Ajoute des données d'exemple |

## 🗄️ Configuration de la Base de Données

### Structure de la Base de Données

Le projet utilise **PostgreSQL** avec **Drizzle ORM**. La base de données contient :

- **Table `templates`** : Stocke les templates de factures
  - `id` : Identifiant unique
  - `name` : Nom du template
  - `description` : Description du template
  - `layout` : Configuration JSON de la mise en page
  - `sample_data` : Données JSON d'exemple pour la prévisualisation
  - `created_at` : Date de création
  - `updated_at` : Date de dernière modification

### Gestion des Migrations

Pour mettre à jour le schéma de base de données après des modifications :

```bash
npm run db:push
```

### Script de Configuration Avancé

Pour une configuration plus complète de la base de données, utilisez le script dédié :

```bash
# Configuration standard (création + initialisation)
npm run db:setup

# Réinitialisation complète (⚠️ supprime toutes les données)
npm run db:setup:reset

# Ajout de données d'exemple pour tester
npm run db:setup:seed
```

📖 Pour plus de détails sur le script de configuration, consultez [DATABASE_SETUP.md](DATABASE_SETUP.md).

## 🏗️ Architecture Technique

### Frontend
- **Framework** : React avec TypeScript
- **Build** : Vite
- **Routing** : Wouter
- **State Management** : TanStack React Query
- **UI Components** : shadcn/ui (basé sur Radix UI)
- **Styling** : Tailwind CSS
- **Canvas Editor** : react-rnd (glisser-déposer)

### Backend
- **Runtime** : Node.js avec Express 5
- **Language** : TypeScript
- **ORM** : Drizzle ORM
- **Database** : PostgreSQL
- **Validation** : Zod

## 🔧 Dépannage

### Problème : "DATABASE_URL must be set"

**Solution** : Assurez-vous que le fichier `.env` existe et contient une URL de base de données valide.

### Problème : "Connection refused" lors de la connexion à PostgreSQL

**Solutions** :
1. Vérifiez que PostgreSQL est démarré : `sudo service postgresql start` (Linux) ou vérifiez les services (Windows)
2. Vérifiez les paramètres de connexion dans `.env`
3. Vérifiez que l'utilisateur et la base de données existent

### Problème : "psql: command not found"

**Solution** : Ajoutez PostgreSQL à votre PATH ou utilisez le chemin complet vers psql.

**Windows** : `C:\Program Files\PostgreSQL\XX\bin\psql.exe`
**macOS** : Installez via Homebrew : `brew install postgresql`
**Linux** : `sudo apt-get install postgresql-client`

### Problème : Port 5000 déjà utilisé

**Solution** : Modifiez le port dans le fichier `.env` :
```env
PORT=3000
```

## 📚 Documentation Supplémentaire

- [CLONE_FEATURE.md](CLONE_FEATURE.md) - Fonctionnalité de clonage
- [FEATURE_VERIFICATION.md](FEATURE_VERIFICATION.md) - Vérification des fonctionnalités
- [GRID_PRICE_TABLES.md](GRID_PRICE_TABLES.md) - Tables de prix
- [UI_CHANGES.md](UI_CHANGES.md) - Changements de l'interface utilisateur
- [VISUAL_GUIDE.md](VISUAL_GUIDE.md) - Guide visuel

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 💡 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
