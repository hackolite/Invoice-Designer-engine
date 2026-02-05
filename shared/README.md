# Shared Utilities

This directory contains shared utilities and modules used across the Invoice Designer Engine.

## Modules

### Invoice Table Builder (`invoiceTableBuilder.ts`)

A specialized utility for building dynamic invoice table structures with add/remove footer row functionality.

**Key Features:**
- Fluent builder API for constructing price tables
- Dynamic add/remove footer rows
- Support for multiple currency formats (USD, EUR, none)
- Custom row styling
- HTML rendering with data binding
- Preset templates for common invoice rows

**Quick Example:**

```typescript
import { InvoiceTableStructureBuilder, InvoiceFooterPresets } from '@shared/invoiceTableBuilder';

const builder = new InvoiceTableStructureBuilder('USD');

// Add footer rows
builder
  .addFooterRow(InvoiceFooterPresets.subtotal('summary.subtotal'))
  .addFooterRow(InvoiceFooterPresets.tax('summary.tax', 10))
  .addFooterRow(InvoiceFooterPresets.grandTotal('summary.total'));

// Remove last row
builder.removeLastFooterRow();

// Get row count (for button state management)
const count = builder.getFooterRowCount();
```

**Documentation:** See `/docs/INVOICE_TABLE_BUILDER.md` for complete API reference and examples.

**Example:** Run `tsx shared/examples/invoiceTableBuilderExample.ts` to see it in action.

### Schema (`schema.ts`)

Database schema definitions and TypeScript types for templates, elements, and layouts.

### Routes (`routes.ts`)

Shared route definitions for API endpoints.

## Examples

The `examples/` directory contains runnable example scripts demonstrating how to use the shared utilities.

Run examples with:
```bash
npx tsx shared/examples/<example-name>.ts
```
