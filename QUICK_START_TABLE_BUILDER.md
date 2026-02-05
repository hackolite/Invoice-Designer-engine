# Invoice Table Builder - Quick Start

## What is this?

A TypeScript module for building dynamic invoice price tables with add/remove footer row functionality.

## Quick Example

```typescript
import { InvoiceTableStructureBuilder, InvoiceFooterPresets, InvoiceTableHTMLRenderer } from '@shared/invoiceTableBuilder';

// Create builder
const builder = new InvoiceTableStructureBuilder('USD');

// Add footer rows
builder
  .addFooterRow(InvoiceFooterPresets.subtotal('totals.subtotal'))
  .addFooterRow(InvoiceFooterPresets.tax('totals.tax', 10))
  .addFooterRow(InvoiceFooterPresets.grandTotal('totals.total'));

// Remove last row
builder.removeLastFooterRow();

// Check count (for UI button state)
const canRemove = builder.getFooterRowCount() > 0;

// Render to HTML
const data = { totals: { subtotal: 1000, tax: 100, total: 1100 } };
const renderer = new InvoiceTableHTMLRenderer(data);
const html = renderer.renderHTMLTable(builder.getStructure());
```

## Key Methods

- **`addFooterRow(spec)`** - Add a footer/summary row
- **`removeLastFooterRow()`** - Remove the last footer row
- **`getFooterRowCount()`** - Get footer row count (for button state)
- **`moveFooterRow(from, to)`** - Reorder rows
- **`updateFooterRow(index, updates)`** - Update row properties
- **`duplicateFooterRow(index)`** - Duplicate a row

## Run Example

```bash
npx tsx shared/examples/invoiceTableBuilderExample.ts
```

## Full Documentation

See [docs/INVOICE_TABLE_BUILDER.md](docs/INVOICE_TABLE_BUILDER.md) for complete API reference and examples.

## Implementation Summary

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed implementation notes.
