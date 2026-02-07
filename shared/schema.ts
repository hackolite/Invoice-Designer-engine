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
export type ElementType = 'text' | 'image' | 'table' | 'gridtable' | 'box' | 'line' | 'qr' | 'signature' | 'badge';

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
    tableType?: 'grid' | 'price' | 'invoice'; // grid = items/data array, price = summary/totals, invoice = header + loopable row + footer
    currency?: 'USD' | 'EUR' | 'none'; // Currency selection for price tables
    columns: {
      header: string;
      binding: string; 
      width?: string;
      format?: 'currency' | 'number' | 'text';
    }[];
    additionalRows?: {
      label: string;
      value: string; // Can be static text or binding
      format?: 'currency' | 'number' | 'text';
      style?: Record<string, string | number>; // Support for row-level styling (textAlign, fontWeight, fontStyle, etc.)
    }[];
    footerRows?: { // For invoice table footer rows that stay at bottom
      label: string;
      value: string; // Can be static text or binding
      format?: 'currency' | 'number' | 'text';
      style?: Record<string, string | number>; // Support for footer-level styling (textAlign, fontWeight, fontStyle, etc.)
    }[];
    inlineData?: { // For storing inline edited cell data in edit mode
      row: number;
      col: number;
      content: string;
    }[];
    headerInlineData?: { // For storing inline edited header cell data in edit mode
      col: number;
      content: string;
    }[];
    footerInlineData?: { // For storing inline edited footer cell data in edit mode
      row: number;
      field: 'label' | 'value' | 'middle';
      col?: number; // Column index for middle cells
      content: string;
    }[];
    cellStyles?: { // For storing cell-level styles in invoice tables
      row: number;
      col: number;
      style?: Record<string, string | number>; // Support for cell-level styling (textAlign, fontWeight, fontStyle, textDecoration, etc.)
    }[];
    headerStyles?: { // For storing header cell styles in invoice tables
      col: number;
      style?: Record<string, string | number>; // Support for header-level styling (textAlign, fontWeight, fontStyle, textDecoration, etc.)
    }[];
    footerStyles?: { // For storing footer cell styles in invoice tables
      row: number;
      field: 'label' | 'value' | 'middle';
      col?: number; // Column index for middle cells
      style?: Record<string, string | number>; // Support for footer-level styling (textAlign, fontWeight, fontStyle, textDecoration, etc.)
    }[];
    rowHeights?: number[]; // Individual height for each row (optional, for custom sizing)
    colWidths?: number[]; // Individual width percentages for each column (optional, for proportional sizing)
  };
  gridTableConfig?: {
    rows: number;
    cols: number;
    heightPerRow?: number; // Stored height per row to maintain consistency when adding/removing rows
    rowHeights?: number[]; // Individual height for each row (optional, for custom sizing)
    colWidths?: number[]; // Individual width percentages for each column (optional, for custom sizing)
    cells: {
      row: number;
      col: number;
      rowSpan?: number;
      colSpan?: number;
      content?: string;
      binding?: string;
      style?: Record<string, string | number>; // Support for cell-level styling (textAlign, fontWeight, fontStyle, etc.)
    }[];
    footer?: {
      label: string;
      value: string; // Can be static text or binding
      format?: 'currency' | 'number' | 'text';
      style?: Record<string, string | number>; // Support for footer-level styling (textAlign, fontWeight, fontStyle, etc.)
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
