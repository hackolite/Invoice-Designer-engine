# Grid and Price Table Feature

## Overview

This feature introduces two distinct table types in the Invoice Designer Engine:

1. **Grid Table**: Displays array data with editable columns (e.g., invoice items, charges)
2. **Price Table**: Displays object data as key-value pairs (e.g., summary, totals)

## Table Types

### Grid Table

**Purpose**: Display arrays of data items

**Data Structure**: 
```json
{
  "items": [
    { "description": "Product A", "quantity": 2, "price": 100, "total": 200 },
    { "description": "Product B", "quantity": 1, "price": 150, "total": 150 }
  ]
}
```

**Features**:
- ✅ Add/remove columns
- ✅ Configurable column headers, bindings, widths, and formats
- ✅ Multiple rows from array data
- ✅ Table header row
- ✅ Border color and thickness controls (inline and properties panel)
- ✅ Three style variants: Classic, Minimalist, Modern

**Use Cases**:
- Invoice line items
- Product lists
- Charge breakdowns
- Passenger/guest lists

### Price Table

**Purpose**: Display summary data as key-value pairs

**Data Structure**:
```json
{
  "summary": {
    "subtotal": 600,
    "tax": 60,
    "shipping": 15,
    "discount": 25,
    "total": 650
  }
}
```

**Features**:
- ✅ Two-column layout (label + value)
- ✅ Each column definition creates one row
- ✅ No header row
- ✅ Border color and thickness controls (inline and properties panel)
- ✅ Three style variants: Classic, Minimalist, Modern
- ❌ Cannot add/remove columns (rows are defined by JSON structure)

**Use Cases**:
- Financial summaries
- Totals and subtotals
- Key-value data display
- Summary information

## Configuration

### Schema Definition

```typescript
tableConfig: {
  dataSource: string;           // JSON path to data (e.g., "items" or "summary")
  tableType?: 'grid' | 'price'; // Table type (defaults to 'grid')
  columns: {
    header: string;             // Column header text
    binding: string;            // Data field binding
    width?: string;             // Column width (e.g., "50%", "100px")
    format?: 'currency' | 'number' | 'text'; // Value formatting
  }[];
}
```

### Grid Table Example

```typescript
{
  id: "items_table",
  type: "table",
  x: 20,
  y: 200,
  width: 750,
  height: 300,
  tableConfig: {
    dataSource: "items",
    tableType: "grid",
    columns: [
      { header: "Description", binding: "description", width: "50%" },
      { header: "Quantity", binding: "quantity", width: "15%" },
      { header: "Price", binding: "price", width: "20%", format: "currency" },
      { header: "Total", binding: "total", width: "15%", format: "currency" }
    ]
  },
  style: { 
    tableVariant: "modern",
    gridBorderColor: "#0ea5e9",
    gridBorderWidth: 2
  }
}
```

### Price Table Example

```typescript
{
  id: "summary_table",
  type: "table",
  x: 450,
  y: 460,
  width: 320,
  height: 180,
  tableConfig: {
    dataSource: "summary",
    tableType: "price",
    columns: [
      { header: "Subtotal", binding: "subtotal", format: "currency" },
      { header: "Tax (10%)", binding: "tax", format: "currency" },
      { header: "Shipping", binding: "shipping", format: "currency" },
      { header: "Discount", binding: "discount", format: "currency" },
      { header: "Total", binding: "total", format: "currency" }
    ]
  },
  style: { 
    tableVariant: "default",
    gridBorderColor: "#22c55e",
    gridBorderWidth: 2
  }
}
```

## Styling Controls

Both table types support the same styling options:

### Border Color
- **Property Panel**: Color picker and hex input
- **Inline Control**: Quick color picker when table is selected
- **Style Key**: `gridBorderColor`
- **Default**: `#000000` (black)

### Border Thickness
- **Property Panel**: Number input (0-10px)
- **Inline Control**: Quick number input when table is selected
- **Style Key**: `gridBorderWidth`
- **Default**: `1` (pixel)

### Table Variants
- **Classic**: Gray header with standard borders
- **Minimalist**: Bold lines, no background
- **Modern**: Primary color header with alternating row colors

## User Interface

### Element Properties Panel

When a table element is selected, the properties panel shows:

1. **Table Type Selector** (dropdown)
   - Grid Table (Items/Data Array)
   - Price Table (Summary/Totals)
   - Description text explaining the selected type

2. **Table Style Selector** (dropdown)
   - Classic (Gray Header)
   - Minimalist (Bold Line)
   - Modern (Primary Color)

3. **Grid Border Color** (color picker + text input)

4. **Grid Border Thickness** (number input with px label)

5. **Data Source** (text input)
   - Label changes based on table type
   - Placeholder shows appropriate example

6. **Columns Section**
   - "Add" button (only for Grid Tables)
   - Column cards with remove button (only for Grid Tables)
   - Header, Binding, Width, Format inputs for each column

### Inline Controls (Canvas)

When a table is selected on the canvas, inline controls appear below the table:

- **Border Color**: Quick color picker
- **Border Width**: Number input (0-10px)

These controls are available for both Grid and Price tables.

## Implementation Details

### Files Modified

1. **shared/schema.ts**
   - Added `tableType?: 'grid' | 'price'` to `tableConfig`

2. **client/src/pages/Editor.tsx**
   - Default new tables to `tableType: 'grid'`

3. **client/src/components/ElementProperties.tsx**
   - Added table type selector
   - Made column add/remove buttons conditional (Grid only)
   - Updated data source labels based on table type

4. **client/src/components/Canvas.tsx**
   - Added separate rendering logic for Grid vs Price tables
   - Price tables render as two-column key-value layout
   - Grid tables render with header row and multiple data rows

5. **server/routes.ts**
   - Updated seed templates to include `tableType: 'grid'`
   - Added demo template showcasing both table types

## Demo Template

A new template "Grid & Price Table Demo" has been added to demonstrate both table types:

- **Grid Table**: Shows invoice items with 4 columns
  - Border: Blue (#0ea5e9), 2px width
  - Style: Modern variant

- **Price Table**: Shows financial summary
  - Border: Green (#22c55e), 2px width
  - Style: Classic variant

## Backward Compatibility

Existing templates without `tableType` will default to `'grid'`, ensuring backward compatibility with all existing data.

## Future Enhancements

Potential future improvements:
- Row-level styling for Price tables
- Conditional formatting based on values
- Footer rows for Grid tables
- Column spanning
- Cell-level data binding expressions
