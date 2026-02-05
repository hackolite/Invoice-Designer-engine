# Invoice Table Builder Documentation

## Overview

The Invoice Table Builder is a specialized utility for building dynamic invoice table structures in the Invoice Designer Engine. It provides a fluent API for managing price table rows, including footer/summary rows with add/remove functionality.

## Features

- ✅ Fluent builder pattern for constructing table structures
- ✅ Add, remove, insert, and reorder footer rows dynamically
- ✅ Support for multiple currency formats (USD, EUR, none)
- ✅ Customizable row styling (alignment, font weight, etc.)
- ✅ HTML rendering with data binding
- ✅ Preset templates for common invoice footer rows
- ✅ Type-safe TypeScript API

## Core Classes

### `InvoiceTableStructureBuilder`

Main class for building table structures with a fluent API.

```typescript
const builder = new InvoiceTableStructureBuilder('USD');

builder
  .addFooterRow({
    labelText: 'Subtotal',
    valueBinding: 'summary.subtotal',
    displayFormat: 'money'
  })
  .addFooterRow({
    labelText: 'Tax (10%)',
    valueBinding: 'summary.tax',
    displayFormat: 'money'
  })
  .addFooterRow({
    labelText: 'Total',
    valueBinding: 'summary.total',
    displayFormat: 'money',
    customStyle: { fontWeight: 'bold' }
  });

const structure = builder.getStructure();
```

### `InvoiceTableHTMLRenderer`

Renders table structures to HTML with data binding.

```typescript
const data = {
  summary: {
    subtotal: 1000,
    tax: 100,
    total: 1100
  }
};

const renderer = new InvoiceTableHTMLRenderer(data);
const html = renderer.renderHTMLTable(structure);
```

## API Reference

### InvoiceTableStructureBuilder Methods

#### Constructor
```typescript
new InvoiceTableStructureBuilder(currencyCode?: 'USD' | 'EUR' | 'none')
```
Creates a new builder instance with optional currency code (default: 'USD').

#### addMainRow(spec: TableRowSpec)
Adds a main data row to the table.

#### addFooterRow(spec: TableRowSpec)
Adds a footer/summary row to the table. **This is the primary method for creating footer rows.**

#### removeLastFooterRow()
Removes the last footer row from the table. **Used for the "Remove" button functionality.**

#### removeFooterRowAt(index: number)
Removes a specific footer row by index.

#### insertFooterRowAt(index: number, spec: TableRowSpec)
Inserts a footer row at a specific position.

#### moveFooterRow(fromIndex: number, toIndex: number)
Reorders footer rows by moving from one index to another.

#### updateFooterRow(index: number, updates: Partial<TableRowSpec>)
Updates properties of an existing footer row.

#### duplicateFooterRow(index: number)
Duplicates a footer row at the given index.

#### clearFooterRows()
Removes all footer rows.

#### getTotalRowCount()
Returns the total number of rows (main + footer).

#### getFooterRowCount()
Returns the number of footer rows. **Useful for enabling/disabling the "Remove" button.**

#### getStructure()
Returns the current table structure.

### TableRowSpec Interface

```typescript
interface TableRowSpec {
  labelText: string;              // Display label for the row
  valueBinding: string;           // Data path (e.g., 'summary.total')
  displayFormat?: 'money' | 'plain' | 'percentage';
  customStyle?: RowStyleConfig;
}
```

### RowStyleConfig Interface

```typescript
interface RowStyleConfig {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}
```

## Preset Footer Rows

The `InvoiceFooterPresets` object provides common invoice footer row templates:

```typescript
import { InvoiceFooterPresets } from '@shared/invoiceTableBuilder';

// Subtotal row
builder.addFooterRow(InvoiceFooterPresets.subtotal('summary.subtotal'));

// Tax row with percentage
builder.addFooterRow(InvoiceFooterPresets.tax('summary.tax', 10));

// Shipping row
builder.addFooterRow(InvoiceFooterPresets.shipping('summary.shipping'));

// Discount row
builder.addFooterRow(InvoiceFooterPresets.discount('summary.discount'));

// Grand total row (bold by default)
builder.addFooterRow(InvoiceFooterPresets.grandTotal('summary.total'));

// Custom row
builder.addFooterRow(
  InvoiceFooterPresets.custom('Processing Fee', 'fees.processing', 'money')
);
```

## Quick Start Function

For standard invoice summaries, use the convenience function:

```typescript
import { buildStandardInvoiceSummary } from '@shared/invoiceTableBuilder';

const structure = buildStandardInvoiceSummary(
  {
    subtotal: 'summary.subtotal',
    tax: 'summary.tax',
    shipping: 'summary.shipping',
    discount: 'summary.discount',
    total: 'summary.total'
  },
  'USD'
);
```

## Usage Examples

### Example 1: Building a Basic Price Table with Add/Remove

```typescript
import { InvoiceTableStructureBuilder, InvoiceTableHTMLRenderer, InvoiceFooterPresets } from '@shared/invoiceTableBuilder';

// Create builder
const builder = new InvoiceTableStructureBuilder('USD');

// Add initial footer rows
builder.addFooterRow(InvoiceFooterPresets.subtotal('financials.subtotal'));
builder.addFooterRow(InvoiceFooterPresets.tax('financials.tax', 8.5));

// User clicks "Add Row" button
builder.addFooterRow({
  labelText: 'Service Fee',
  valueBinding: 'financials.serviceFee',
  displayFormat: 'money'
});

// User clicks "Remove Row" button
if (builder.getFooterRowCount() > 0) {
  builder.removeLastFooterRow();
}

// Render to HTML
const data = {
  financials: {
    subtotal: 500,
    tax: 42.50
  }
};

const renderer = new InvoiceTableHTMLRenderer(data);
const html = renderer.renderHTMLTable(builder.getStructure());
```

### Example 2: Dynamic Row Management

```typescript
const builder = new InvoiceTableStructureBuilder('EUR');

// Add several footer rows
builder
  .addFooterRow({ labelText: 'Subtotal', valueBinding: 'sub', displayFormat: 'money' })
  .addFooterRow({ labelText: 'VAT', valueBinding: 'vat', displayFormat: 'money' })
  .addFooterRow({ labelText: 'Shipping', valueBinding: 'ship', displayFormat: 'money' })
  .addFooterRow({ labelText: 'Total', valueBinding: 'tot', displayFormat: 'money' });

// Move shipping before VAT
builder.moveFooterRow(2, 1);

// Duplicate the VAT row
builder.duplicateFooterRow(1);

// Update a row's label
builder.updateFooterRow(1, { labelText: 'VAT (20%)' });

// Remove a specific row
builder.removeFooterRowAt(2);

console.log(`Total footer rows: ${builder.getFooterRowCount()}`);
```

### Example 3: Custom Styling

```typescript
builder.addFooterRow({
  labelText: 'TOTAL DUE',
  valueBinding: 'totalDue',
  displayFormat: 'money',
  customStyle: {
    textAlign: 'right',
    fontWeight: 'bold',
    textDecoration: 'underline'
  }
});
```

### Example 4: Rendering Partial Updates

```typescript
const renderer = new InvoiceTableHTMLRenderer(data);
const structure = builder.getStructure();

// Render only footer rows (for dynamic updates)
const footerHTML = renderer.renderFooterRows(structure.footerRows, structure.currencyCode);

// Render only body rows
const bodyHTML = renderer.renderBodyRows(structure.mainRows, structure.currencyCode);
```

## Integration with Canvas Component

To integrate with the existing Canvas.tsx add/remove button functionality:

```typescript
// In your component
import { InvoiceTableStructureBuilder } from '@shared/invoiceTableBuilder';

const handlePriceTableAddRow = (elementId: string) => {
  const element = layout.elements.find(e => e.id === elementId);
  if (!element || !element.tableConfig) return;
  
  const builder = new InvoiceTableStructureBuilder(element.tableConfig.currency);
  
  // Populate from existing config
  (element.tableConfig.additionalRows || []).forEach(row => {
    builder.addFooterRow({
      labelText: row.label,
      valueBinding: row.value,
      displayFormat: row.format as any,
      customStyle: row.style
    });
  });
  
  // Add new row
  builder.addFooterRow({
    labelText: 'Total',
    valueBinding: '{total}',
    displayFormat: 'money'
  });
  
  const structure = builder.getStructure();
  // Update element.tableConfig.additionalRows with structure.footerRows
};

const handlePriceTableRemoveRow = (elementId: string) => {
  const element = layout.elements.find(e => e.id === elementId);
  if (!element?.tableConfig?.additionalRows) return;
  
  const builder = new InvoiceTableStructureBuilder(element.tableConfig.currency);
  
  // Populate from existing config
  element.tableConfig.additionalRows.forEach(row => {
    builder.addFooterRow({
      labelText: row.label,
      valueBinding: row.value,
      displayFormat: row.format as any,
      customStyle: row.style
    });
  });
  
  // Remove last row
  if (builder.getFooterRowCount() > 0) {
    builder.removeLastFooterRow();
  }
  
  const structure = builder.getStructure();
  // Update element.tableConfig.additionalRows with structure.footerRows
};
```

## Benefits

1. **Type Safety**: Full TypeScript support with proper interfaces
2. **Fluent API**: Chainable methods for readable code
3. **Separation of Concerns**: Structure building separate from rendering
4. **Flexibility**: Easy to extend with custom row types
5. **Maintainability**: Centralized table logic instead of scattered UI code
6. **Testability**: Pure functions easy to unit test

## Future Enhancements

Potential improvements:
- Calculation expressions (sum, average, etc.)
- Conditional row visibility
- Row grouping and subtotals
- Export to different formats (CSV, JSON)
- Validation rules for row data
- Accessibility attributes for screen readers
