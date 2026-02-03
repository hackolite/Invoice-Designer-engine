# Résumé du Script de Configuration de la Base de Données

## 📝 Contexte

Ce document résume la création du script de configuration de la base de données pour Invoice Designer Engine, en réponse à la demande : "crée un script de configuration de la base de données".

## ✨ Ce qui a été créé

### 1. Script Principal : `script/setup-database.ts`

Un script TypeScript complet et robuste qui permet de gérer la configuration de la base de données PostgreSQL avec trois modes d'opération :

#### Mode Setup (Configuration Standard)
```bash
npm run db:setup
```
- Vérifie si la base de données existe
- Crée la base de données si nécessaire
- Initialise le schéma (table `templates` avec toutes les colonnes)
- Prêt pour l'utilisation en développement ou production

#### Mode Reset (Réinitialisation)
```bash
npm run db:setup:reset
```
- ⚠️ **DESTRUCTIF** - Supprime toutes les données
- Termine toutes les connexions actives
- Supprime et recrée la base de données
- Idéal pour le développement et les tests

#### Mode Seed (Données d'exemple)
```bash
npm run db:setup:seed
```
- Insère des données d'exemple pour tester l'application
- Inclut un template de facture complet avec :
  - En-tête et informations de société
  - Numéro de facture et dates
  - Tableau d'articles avec prix
  - Totaux (sous-total, taxes, total TTC)

### 2. Documentation : `DATABASE_SETUP.md`

Une documentation complète en français qui explique :
- ✓ Vue d'ensemble du script
- ✓ Commandes disponibles avec exemples
- ✓ Fonctionnalités détaillées
- ✓ Prérequis et installation
- ✓ Cas d'usage typiques
- ✓ Guide de dépannage
- ✓ Considérations de sécurité

### 3. Scripts NPM dans `package.json`

Trois nouvelles commandes ajoutées :
```json
{
  "scripts": {
    "db:setup": "tsx script/setup-database.ts setup",
    "db:setup:reset": "tsx script/setup-database.ts reset",
    "db:setup:seed": "tsx script/setup-database.ts seed"
  }
}
```

### 4. Mise à jour du README principal

Le fichier `README.md` a été mis à jour pour :
- Référencer les nouveaux scripts de base de données
- Ajouter les commandes dans le tableau des scripts disponibles
- Pointer vers la documentation détaillée `DATABASE_SETUP.md`

## 🎯 Fonctionnalités Clés

### Sécurité
- ✅ Protection contre les injections SQL (requêtes paramétrées)
- ✅ Validation des noms de base de données
- ✅ Délai de sécurité avant suppression en mode reset
- ✅ Identifiants entre guillemets pour éviter les problèmes de syntaxe

### Robustesse
- ✅ Gestion complète des erreurs avec messages clairs
- ✅ Détection automatique des problèmes de connexion
- ✅ Messages d'aide pour chaque type d'erreur
- ✅ Vérification de l'existence de la base avant création

### Convivialité
- ✅ Messages colorés (vert, rouge, jaune, bleu) pour une meilleure lisibilité
- ✅ Affichage de la progression des opérations
- ✅ Messages en français pour l'audience cible
- ✅ Instructions claires et précises

### Flexibilité
- ✅ Parse automatiquement DATABASE_URL
- ✅ Supporte différents modes d'utilisation
- ✅ Compatible avec PostgreSQL local ou distant
- ✅ Fonctionne avec n'importe quelle configuration

## 📊 Structure du Schéma

Le script crée la table suivante :

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

## 🔄 Exemples d'Utilisation

### Installation Initiale
```bash
# 1. Cloner et installer
git clone https://github.com/hackolite/Invoice-Designer-engine.git
cd Invoice-Designer-engine
npm install

# 2. Configurer .env
cp .env.example .env
# Éditer DATABASE_URL dans .env

# 3. Configurer la base de données
npm run db:setup

# 4. Ajouter des données de test
npm run db:setup:seed
```

### Développement Quotidien
```bash
# Réinitialiser pour repartir d'une base propre
npm run db:setup:reset

# Ajouter des données de test
npm run db:setup:seed

# Démarrer l'application
npm run dev
```

### Après Modification du Schéma
```bash
# Pour le développement
npm run db:setup:reset

# Pour la production (recommandé)
npm run db:push  # Utilise Drizzle Kit
```

## 🧪 Tests Effectués

Le script a été validé pour :
- ✅ Compilation TypeScript réussie (npm run check)
- ✅ Gestion correcte des erreurs (DATABASE_URL manquant)
- ✅ Shebang correct pour exécution directe
- ✅ Import correct du schéma Drizzle ORM
- ✅ Syntaxe SQL valide

## 📝 Détails Techniques

### Technologies Utilisées
- **TypeScript** : Typage fort pour éviter les erreurs
- **node-postgres (pg)** : Client PostgreSQL pour Node.js
- **Drizzle ORM** : ORM type-safe pour la gestion du schéma
- **tsx** : Exécution directe de TypeScript

### Architecture
```
script/
  └── setup-database.ts    # Script principal de configuration

shared/
  └── schema.ts            # Définition du schéma Drizzle

DATABASE_SETUP.md          # Documentation détaillée
README.md                  # Documentation principale (mise à jour)
package.json               # Scripts NPM (mis à jour)
```

### Parsing de DATABASE_URL
Le script supporte le format PostgreSQL standard :
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Exemple :
```
postgresql://invoice_user:password@localhost:5432/invoice_designer
```

## 🛡️ Considérations de Sécurité

### Mode Reset - ATTENTION
Le mode `db:setup:reset` est **destructif** :
- ❌ **JAMAIS en production**
- ❌ **JAMAIS avec des données réelles**
- ✅ OK pour le développement
- ✅ OK pour les tests automatisés

Le script inclut :
- Délai de 3 secondes pour annuler (Ctrl+C)
- Message d'avertissement clair
- Terminaison de toutes les connexions actives avant suppression

### Protection contre les Injections SQL
- Requêtes paramétrées : `$1, $2, etc.`
- Identifiants entre guillemets : `"${dbName}"`
- Validation des noms de base de données (alphanumeric + underscore + dash)

## 🔧 Dépannage Commun

### "DATABASE_URL n'est pas définie"
→ Créer le fichier `.env` depuis `.env.example`

### "ECONNREFUSED"
→ Démarrer PostgreSQL : `sudo service postgresql start`

### "28P01" (Authentification échouée)
→ Vérifier les identifiants dans DATABASE_URL

### Permission denied
→ Donner les droits : `ALTER USER username CREATEDB;`

## 📈 Avantages par Rapport à l'Existant

Avant ce script, le projet avait :
- `setup.sh` : Script shell pour l'installation complète
- `npm run db:push` : Command Drizzle Kit pour les migrations

Maintenant, en plus :
- ✅ **Script TypeScript natif** : Cohérent avec le reste du projet
- ✅ **Plus de contrôle** : Gestion fine de la création/suppression
- ✅ **Données de test** : Mode seed pour tester rapidement
- ✅ **Meilleure documentation** : Guide complet en français
- ✅ **Plus flexible** : Trois modes distincts pour différents besoins

## 🎓 Apprentissages

Ce script démontre :
1. Comment interagir avec PostgreSQL depuis Node.js/TypeScript
2. Comment parser une URL de connexion PostgreSQL
3. Comment gérer les bases de données programmatiquement
4. Comment créer des scripts CLI conviviaux avec couleurs
5. Bonnes pratiques de sécurité pour les scripts de base de données

## 🚀 Utilisation Future

Le script est conçu pour être :
- **Extensible** : Facile d'ajouter de nouveaux modes
- **Maintenable** : Code clair et bien documenté
- **Réutilisable** : Peut être adapté pour d'autres projets

Exemples d'extensions possibles :
- Mode backup/restore
- Import de données depuis CSV/JSON
- Migrations personnalisées
- Tests de performance
- Validation de l'intégrité des données

## 📞 Support

Pour toute question sur ce script :
1. Consulter `DATABASE_SETUP.md` pour la documentation détaillée
2. Vérifier la section Dépannage
3. Ouvrir une issue sur GitHub si nécessaire

## ✅ Conclusion

Le script de configuration de la base de données est maintenant prêt et opérationnel, offrant une solution complète, sécurisée et conviviale pour gérer la base de données PostgreSQL de Invoice Designer Engine.

**Commandes principales :**
```bash
npm run db:setup         # Configuration initiale
npm run db:setup:reset   # Réinitialisation
npm run db:setup:seed    # Données d'exemple
```

**Documentation :**
- `DATABASE_SETUP.md` - Guide complet en français
- `README.md` - Documentation principale mise à jour
- Commentaires dans le code source
