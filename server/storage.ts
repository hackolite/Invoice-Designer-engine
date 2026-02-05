import { db } from "./db";
import {
  templates,
  type Template,
  type InsertTemplate
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Templates
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.updatedAt);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const result = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    
    if (!result[0]) {
      throw new Error('Failed to create template');
    }
    
    return result[0];
  }

  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template> {
    const result = await db
      .update(templates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error('Template not found');
    }
    
    return result[0];
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }
}

export const storage = new DatabaseStorage();
