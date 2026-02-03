#!/usr/bin/env tsx

/**
 * Script de configuration de la base de données
 * Database Configuration Script
 * 
 * Ce script permet de:
 * - Créer la base de données si elle n'existe pas
 * - Initialiser le schéma de la base de données
 * - Réinitialiser la base de données (mode reset)
 * - Peupler avec des données d'exemple (mode seed)
 * 
 * Usage:
 *   npm run db:setup          # Configure la base de données
 *   npm run db:setup:reset    # Réinitialise la base de données
 *   npm run db:setup:seed     # Configure avec données d'exemple
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.ts";

const { Pool, Client } = pg;

// Codes de couleur pour l'affichage
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function printSuccess(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printError(message: string) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`);
}

function printInfo(message: string) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function printWarning(message: string) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function printHeader(message: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${message}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
}

// Parse l'URL de connexion PostgreSQL
function parseConnectionString(url: string) {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Format invalide pour DATABASE_URL');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

// Vérifie si la base de données existe
async function databaseExists(config: any, dbName: string): Promise<boolean> {
  const client = new Client({
    ...config,
    database: 'postgres', // Connexion à la base postgres par défaut
  });
  
  try {
    await client.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    return result.rows.length > 0;
  } catch (error) {
    throw error;
  } finally {
    await client.end();
  }
}

// Crée la base de données
async function createDatabase(config: any, dbName: string) {
  const client = new Client({
    ...config,
    database: 'postgres',
  });
  
  try {
    await client.connect();
    // Note: Utiliser l'identifiant pour éviter les injections SQL
    await client.query(`CREATE DATABASE "${dbName}"`);
    printSuccess(`Base de données "${dbName}" créée avec succès`);
  } catch (error: any) {
    if (error.code === '42P04') {
      printInfo(`La base de données "${dbName}" existe déjà`);
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

// Supprime la base de données (pour le mode reset)
async function dropDatabase(config: any, dbName: string) {
  const client = new Client({
    ...config,
    database: 'postgres',
  });
  
  try {
    await client.connect();
    // Termine toutes les connexions actives
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [dbName]);
    
    // Supprime la base de données
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    printSuccess(`Base de données "${dbName}" supprimée`);
  } catch (error) {
    throw error;
  } finally {
    await client.end();
  }
}

// Initialise le schéma de la base de données
async function initializeSchema(connectionString: string) {
  printInfo('Initialisation du schéma de la base de données...');
  
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  
  try {
    // Crée la table templates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        layout JSONB NOT NULL,
        sample_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    printSuccess('Schéma de la base de données initialisé');
  } catch (error) {
    throw error;
  } finally {
    await pool.end();
  }
}

// Peuple la base de données avec des données d'exemple
async function seedDatabase(connectionString: string) {
  printInfo('Ajout de données d\'exemple...');
  
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  
  try {
    // Vérifie si des données existent déjà
    const existingTemplates = await db.query.templates.findMany();
    
    if (existingTemplates.length > 0) {
      printWarning('Des templates existent déjà dans la base de données');
      return;
    }
    
    // Données d'exemple pour un template de facture simple
    const sampleTemplate = {
      name: 'Template de Facture Standard',
      description: 'Un template de facture simple et professionnel',
      layout: {
        elements: [
          {
            id: 'header-text',
            type: 'text',
            x: 50,
            y: 50,
            width: 300,
            height: 40,
            content: 'FACTURE',
            style: { fontSize: '24px', fontWeight: 'bold' }
          },
          {
            id: 'company-name',
            type: 'text',
            x: 50,
            y: 100,
            width: 250,
            height: 30,
            binding: 'company.name',
            style: { fontSize: '16px', fontWeight: 'bold' }
          },
          {
            id: 'invoice-number',
            type: 'text',
            x: 450,
            y: 100,
            width: 200,
            height: 25,
            content: 'N° Facture:',
            binding: 'invoice.number',
            style: { fontSize: '14px' }
          },
          {
            id: 'items-table',
            type: 'table',
            x: 50,
            y: 250,
            width: 600,
            height: 200,
            tableConfig: {
              dataSource: 'items',
              tableType: 'grid',
              columns: [
                { header: 'Description', binding: 'description', width: '50%' },
                { header: 'Quantité', binding: 'quantity', width: '15%', format: 'number' },
                { header: 'Prix Unit.', binding: 'unitPrice', width: '20%', format: 'currency' },
                { header: 'Total', binding: 'total', width: '15%', format: 'currency' }
              ]
            }
          }
        ],
        pageSize: 'A4',
        orientation: 'portrait'
      },
      sampleData: {
        company: {
          name: 'Ma Société SARL',
          address: '123 Rue Exemple',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        invoice: {
          number: 'INV-2024-001',
          date: '2024-01-15',
          dueDate: '2024-02-15'
        },
        customer: {
          name: 'Client Exemple',
          address: '456 Avenue Test',
          city: 'Lyon',
          postalCode: '69000'
        },
        items: [
          { description: 'Service de consultation', quantity: 10, unitPrice: 100, total: 1000 },
          { description: 'Développement web', quantity: 20, unitPrice: 80, total: 1600 },
          { description: 'Support technique', quantity: 5, unitPrice: 60, total: 300 }
        ],
        totals: {
          subtotal: 2900,
          tax: 580,
          total: 3480
        }
      }
    };
    
    // Insère le template d'exemple
    await db.insert(schema.templates).values(sampleTemplate);
    
    printSuccess('Données d\'exemple ajoutées avec succès');
    printInfo('1 template de facture a été créé');
  } catch (error) {
    throw error;
  } finally {
    await pool.end();
  }
}

// Fonction principale
async function main() {
  printHeader('Script de Configuration de la Base de Données');
  
  // Récupère les arguments de la ligne de commande
  const args = process.argv.slice(2);
  const mode = args[0] || 'setup'; // setup, reset, seed
  
  // Vérifie que DATABASE_URL est définie
  if (!process.env.DATABASE_URL) {
    printError('DATABASE_URL n\'est pas définie dans les variables d\'environnement');
    printInfo('Assurez-vous que le fichier .env existe et contient DATABASE_URL');
    process.exit(1);
  }
  
  try {
    // Parse la chaîne de connexion
    const dbConfig = parseConnectionString(process.env.DATABASE_URL);
    printInfo(`Configuration détectée:`);
    console.log(`  Hôte: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`  Base de données: ${dbConfig.database}`);
    console.log(`  Utilisateur: ${dbConfig.user}\n`);
    
    // Mode reset: supprime et recrée la base de données
    if (mode === 'reset') {
      printWarning('Mode RESET activé - La base de données sera supprimée et recréée');
      printInfo('Attente de 3 secondes... (Ctrl+C pour annuler)');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await dropDatabase(dbConfig, dbConfig.database);
      await createDatabase(dbConfig, dbConfig.database);
      await initializeSchema(process.env.DATABASE_URL);
      printSuccess('Base de données réinitialisée avec succès');
    }
    // Mode setup normal
    else if (mode === 'setup') {
      // Vérifie si la base existe
      const exists = await databaseExists(dbConfig, dbConfig.database);
      
      if (!exists) {
        printInfo('La base de données n\'existe pas, création...');
        await createDatabase(dbConfig, dbConfig.database);
      } else {
        printInfo('La base de données existe déjà');
      }
      
      // Initialise le schéma
      await initializeSchema(process.env.DATABASE_URL);
    }
    // Mode seed: ajoute des données d'exemple
    else if (mode === 'seed') {
      await seedDatabase(process.env.DATABASE_URL);
    }
    else {
      printError(`Mode inconnu: ${mode}`);
      printInfo('Modes disponibles: setup, reset, seed');
      process.exit(1);
    }
    
    printHeader('Configuration terminée avec succès!');
    console.log('La base de données est prête à être utilisée.\n');
    
  } catch (error: any) {
    printError('Erreur lors de la configuration de la base de données:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      printWarning('Impossible de se connecter à PostgreSQL');
      printInfo('Vérifiez que PostgreSQL est démarré et accessible');
    } else if (error.code === '28P01') {
      printWarning('Authentification échouée');
      printInfo('Vérifiez les identifiants dans DATABASE_URL');
    }
    
    process.exit(1);
  }
}

// Exécute le script
main();
