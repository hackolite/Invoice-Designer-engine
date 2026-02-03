# Guide de Démarrage Rapide - Invoice Designer Engine

## 🚀 Installation en 3 étapes

### Étape 1 : Préparation

Assurez-vous d'avoir installé :
- Node.js (version 20+) : https://nodejs.org/
- PostgreSQL (version 12+) : https://www.postgresql.org/download/

### Étape 2 : Cloner et Installer

```bash
# Clonez le projet
git clone https://github.com/hackolite/Invoice-Designer-engine.git
cd Invoice-Designer-engine

# Lancez le script d'installation
./setup.sh
```

**Sur Windows**, utilisez plutôt :
```cmd
setup.bat
```

### Étape 3 : Configuration

Le script vous demandera de configurer votre base de données dans le fichier `.env` :

```env
DATABASE_URL=postgresql://votre_utilisateur:votre_mot_de_passe@localhost:5432/invoice_designer
```

**Exemple avec des valeurs par défaut PostgreSQL** :
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoice_designer
```

## 🎯 Démarrage

Une fois l'installation terminée :

```bash
npm run dev
```

Ouvrez votre navigateur sur : **http://localhost:5000**

## 📋 Configuration PostgreSQL Rapide

### Option 1 : Utiliser l'utilisateur postgres par défaut

```bash
# Connectez-vous à PostgreSQL
psql -U postgres

# Créez la base de données
CREATE DATABASE invoice_designer;

# Quittez
\q
```

Puis dans `.env` :
```env
DATABASE_URL=postgresql://postgres:votre_mot_de_passe_postgres@localhost:5432/invoice_designer
```

### Option 2 : Créer un utilisateur dédié (recommandé)

```bash
# Connectez-vous à PostgreSQL
psql -U postgres

# Créez un utilisateur
CREATE USER invoice_user WITH PASSWORD 'invoice_password';

# Créez la base de données
CREATE DATABASE invoice_designer OWNER invoice_user;

# Donnez les permissions
GRANT ALL PRIVILEGES ON DATABASE invoice_designer TO invoice_user;

# Quittez
\q
```

Puis dans `.env` :
```env
DATABASE_URL=postgresql://invoice_user:invoice_password@localhost:5432/invoice_designer
```

## 🔧 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Mode développement avec rechargement auto |
| `npm run build` | Compile pour la production |
| `npm start` | Démarre en mode production |
| `npm run db:push` | Met à jour le schéma de la base |
| `npm run check` | Vérifie les types TypeScript |

## ❓ Problèmes Courants

### "DATABASE_URL must be set"
→ Vérifiez que le fichier `.env` existe et contient DATABASE_URL

### "Connection refused" 
→ PostgreSQL n'est pas démarré :
- **Windows** : Services → PostgreSQL → Démarrer
- **Linux** : `sudo service postgresql start`
- **macOS** : `brew services start postgresql`

### "psql: command not found"
→ Ajoutez PostgreSQL au PATH ou utilisez le chemin complet

### Port 5000 occupé
→ Changez le port dans `.env` :
```env
PORT=3000
```

## 📚 Documentation Complète

Consultez [README.md](README.md) pour la documentation détaillée.

## 💡 Support

Des questions ? Ouvrez une issue sur GitHub !
