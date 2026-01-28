import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Stores the invoice templates created in the WYSIWYG editor
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // The layout configuration: positions, types, content, and data bindings of elements
  // Structure: { elements: [ { id, type, x, y, width, height, content, binding, style, ... } ] }
  layout: jsonb("layout").notNull(), 
  // Sample JSON data to use for previewing this template
  sampleData: jsonb("sample_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertTemplateSchema = createInsertSchema(templates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

// Element Types for the WYSIWYG Editor
export type ElementType = 'text' | 'image' | 'table' | 'box' | 'line';

export interface TemplateElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; 
  binding?: string; 
  orientation?: 'horizontal' | 'vertical'; // For lines
  tableConfig?: {
    dataSource: string; 
    columns: {
      header: string;
      binding: string; 
      width?: string;
      format?: 'currency' | 'number' | 'text';
    }[];
  };
  style?: Record<string, string | number>;
}

export interface TemplateLayout {
  elements: TemplateElement[];
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

// Request/Response types
export type CreateTemplateRequest = InsertTemplate;
export type UpdateTemplateRequest = Partial<InsertTemplate>;
export type TemplateListResponse = Template[];
