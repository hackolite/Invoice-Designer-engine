# Script de Configuration de la Base de Données

Ce document explique l'utilisation du script de configuration de la base de données pour Invoice Designer Engine.

## 📋 Vue d'ensemble

Le script `setup-database.ts` permet de gérer la configuration complète de la base de données PostgreSQL pour le projet. Il offre plusieurs modes d'opération pour différents scénarios d'utilisation.

## 🚀 Commandes disponibles

### 1. Configuration standard

Configure la base de données (création si nécessaire et initialisation du schéma) :

```bash
npm run db:setup
```

**Ce que fait cette commande :**
- ✓ Vérifie si la base de données existe
- ✓ Crée la base de données si elle n'existe pas
- ✓ Initialise le schéma (tables, colonnes, index)
- ✓ Prêt pour l'utilisation

### 2. Réinitialisation complète

Supprime et recrée la base de données (⚠️ **ATTENTION : Supprime toutes les données**) :

```bash
npm run db:setup:reset
```

**Ce que fait cette commande :**
- ⚠️ Termine toutes les connexions actives
- ⚠️ Supprime la base de données existante
- ✓ Crée une nouvelle base de données vide
- ✓ Initialise le schéma

**Cas d'usage :**
- Repartir d'une base de données propre
- Après des changements majeurs du schéma
- Pour les tests et le développement

### 3. Ajout de données d'exemple

Ajoute des données d'exemple pour tester l'application :

```bash
npm run db:setup:seed
```

**Ce que fait cette commande :**
- ✓ Insère un template de facture d'exemple
- ✓ Inclut des données complètes (société, client, articles)
- ✓ Prêt pour tester l'éditeur WYSIWYG

## 🔧 Fonctionnalités du script

### Création automatique de la base de données

Le script peut créer automatiquement la base de données PostgreSQL si elle n'existe pas :

```typescript
// Détecte automatiquement les paramètres depuis DATABASE_URL
// Crée la base si nécessaire
```

### Initialisation du schéma

Crée la table `templates` avec tous les champs nécessaires :

```sql
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL,
  sample_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Données d'exemple (Seed)

Le mode seed insère un template de facture standard avec :

- **En-tête** : Logo et informations de la société
- **Détails de la facture** : Numéro, dates
- **Tableau d'articles** : Description, quantité, prix
- **Totaux** : Sous-total, taxes, total TTC

## 📝 Prérequis

Avant d'utiliser le script, assurez-vous que :

1. **PostgreSQL est installé et démarré**
   ```bash
   # Vérifier l'installation
   psql --version
   
   # Démarrer PostgreSQL (Linux)
   sudo service postgresql start
   ```

2. **Le fichier .env existe et contient DATABASE_URL**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/invoice_designer
   ```

3. **Les dépendances npm sont installées**
   ```bash
   npm install
   ```

## 🎯 Cas d'usage typiques

### Nouvelle installation

```bash
# 1. Cloner le projet
git clone https://github.com/hackolite/Invoice-Designer-engine.git
cd Invoice-Designer-engine

# 2. Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Installer les dépendances
npm install

# 4. Configurer la base de données
npm run db:setup

# 5. (Optionnel) Ajouter des données d'exemple
npm run db:setup:seed
```

### Développement et tests

```bash
# Réinitialiser la base pour repartir d'une base propre
npm run db:setup:reset

# Ajouter des données de test
npm run db:setup:seed

# Démarrer le serveur de développement
npm run dev
```

### Migration après changement de schéma

Si vous modifiez le schéma dans `shared/schema.ts` :

```bash
# Option 1 : Utiliser Drizzle Kit (recommandé pour la production)
npm run db:push

# Option 2 : Réinitialiser complètement (développement uniquement)
npm run db:setup:reset
```

## 🔍 Format de DATABASE_URL

Le script parse automatiquement l'URL de connexion au format :

```
postgresql://[utilisateur]:[mot_de_passe]@[hôte]:[port]/[nom_base_données]
```

**Exemples :**

```env
# Base de données locale
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoice_designer

# Base de données avec utilisateur personnalisé
DATABASE_URL=postgresql://invoice_user:secure_pass@localhost:5432/invoice_db

# Base de données distante
DATABASE_URL=postgresql://user:pass@db.example.com:5432/production_db
```

## ⚠️ Sécurité

### Mode Reset

Le mode `db:setup:reset` est **destructif** et supprime toutes les données. Utilisez-le avec précaution :

- ✅ **OK pour le développement local**
- ✅ **OK pour les tests automatisés**
- ❌ **JAMAIS en production**
- ❌ **JAMAIS avec des données réelles**

Le script inclut un délai de 3 secondes pour annuler :

```bash
npm run db:setup:reset
# Mode RESET activé - La base de données sera supprimée et recréée
# Attente de 3 secondes... (Ctrl+C pour annuler)
```

### Injection SQL

Le script utilise des requêtes paramétrées et des identifiants entre guillemets pour prévenir les injections SQL :

```typescript
// ✓ Sécurisé - identifiant entre guillemets
await client.query(`CREATE DATABASE "${dbName}"`);

// ✓ Sécurisé - requête paramétrée
await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
```

## 🐛 Dépannage

### Erreur : "DATABASE_URL n'est pas définie"

**Solution :**
```bash
# Créer le fichier .env
cp .env.example .env

# Éditer le fichier avec vos paramètres
nano .env  # ou votre éditeur préféré
```

### Erreur : "ECONNREFUSED"

**Cause :** PostgreSQL n'est pas démarré ou n'est pas accessible.

**Solutions :**
```bash
# Vérifier l'état de PostgreSQL
sudo service postgresql status

# Démarrer PostgreSQL
sudo service postgresql start

# Vérifier que PostgreSQL écoute sur le bon port
sudo netstat -tlnp | grep 5432
```

### Erreur : "28P01" (Authentification échouée)

**Cause :** Identifiants incorrects dans DATABASE_URL.

**Solutions :**
1. Vérifier les identifiants dans `.env`
2. Créer l'utilisateur PostgreSQL si nécessaire :
   ```sql
   CREATE USER invoice_user WITH PASSWORD 'votre_mot_de_passe';
   GRANT ALL PRIVILEGES ON DATABASE invoice_designer TO invoice_user;
   ```

### Erreur : Permission denied

**Cause :** L'utilisateur n'a pas les droits pour créer des bases de données.

**Solutions :**
```sql
-- Se connecter en tant que superutilisateur
psql -U postgres

-- Donner les droits de création de base de données
ALTER USER invoice_user CREATEDB;
```

### La table existe déjà

Si vous obtenez des erreurs sur des tables existantes, le script utilise `CREATE TABLE IF NOT EXISTS` qui devrait les ignorer. Si le problème persiste :

```bash
# Réinitialiser complètement
npm run db:setup:reset
```

## 📚 Ressources complémentaires

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Guide d'installation principal](README.md)

## 💡 Contribution

Pour améliorer ce script :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails
