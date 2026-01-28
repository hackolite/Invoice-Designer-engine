import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Templates Routes ===

  app.get(api.templates.list.path, async (req, res) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });

  app.get(api.templates.get.path, async (req, res) => {
    const template = await storage.getTemplate(Number(req.params.id));
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  });

  app.post(api.templates.create.path, async (req, res) => {
    try {
      const input = api.templates.create.input.parse(req.body);
      const template = await storage.createTemplate(input);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.templates.update.path, async (req, res) => {
    try {
      const input = api.templates.update.input.parse(req.body);
      const updated = await storage.updateTemplate(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle not found via storage check if preferred, or generic 500
      // For simplicity in this Lite build, assuming ID exists or next generic catch hits.
      // Ideally check existence first.
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.delete(api.templates.delete.path, async (req, res) => {
    await storage.deleteTemplate(Number(req.params.id));
    res.status(204).send();
  });

  // Seed database if needed
  await seedDatabase();

  return httpServer;
}

// Seed function to populate database with an example template
export async function seedDatabase() {
  const templates = await storage.getTemplates();
  if (templates.length === 0) {
    console.log("Seeding database with example template...");
    
    const sampleData = {
      invoiceNumber: "INV-2023-001",
      date: "2023-10-25",
      provider: {
        name: "Acme Corp",
        address: "123 Business Rd, Tech City",
        email: "contact@acme.com"
      },
      client: {
        name: "John Doe",
        address: "456 Customer Ln, Buyer Town"
      },
      items: [
        { description: "Web Development", quantity: 10, price: 50, total: 500 },
        { description: "Hosting Setup", quantity: 1, price: 100, total: 100 },
        { description: "Domain Registration", quantity: 1, price: 15, total: 15 }
      ],
      subtotal: 615,
      tax: 61.5,
      total: 676.5
    };

    const layout = {
      pageSize: "A4",
      orientation: "portrait",
      elements: [
        {
          id: "el_1",
          type: "text",
          x: 20,
          y: 20,
          width: 200,
          height: 40,
          content: "INVOICE",
          style: { fontSize: "24px", fontWeight: "bold" }
        },
        {
          id: "el_2",
          type: "text",
          x: 20,
          y: 70,
          width: 200,
          height: 60,
          binding: "provider.name",
          style: { fontSize: "14px" }
        },
        {
          id: "el_3",
          type: "text",
          x: 350,
          y: 70,
          width: 200,
          height: 60,
          binding: "client.name",
          style: { fontSize: "14px", textAlign: "right" }
        },
        {
          id: "el_table",
          type: "table",
          x: 20,
          y: 150,
          width: 550,
          height: 300,
          tableConfig: {
            dataSource: "items",
            columns: [
              { header: "Description", binding: "description", width: "50%" },
              { header: "Qty", binding: "quantity", width: "15%" },
              { header: "Price", binding: "price", width: "15%", format: "currency" },
              { header: "Total", binding: "total", width: "20%", format: "currency" }
            ]
          }
        }
      ]
    };

    await storage.createTemplate({
      name: "Standard Invoice",
      description: "A clean, standard invoice layout.",
      layout: layout,
      sampleData: sampleData
    });
    
    console.log("Database seeded!");
  }
}
