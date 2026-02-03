# Visual Guide: Grid vs Price Tables

## Grid Table Example

### Visual Representation
```
┌─────────────────────────────────────────────────────────┐
│              GRID TABLE (Array Data)                    │
├─────────────┬──────────┬────────────┬──────────────────┤
│ Description │ Quantity │ Unit Price │ Total            │ ← Header Row
├─────────────┼──────────┼────────────┼──────────────────┤
│ Product A   │    2     │   $100.00  │   $200.00        │ ← Data Row 1
├─────────────┼──────────┼────────────┼──────────────────┤
│ Product B   │    1     │   $150.00  │   $150.00        │ ← Data Row 2
├─────────────┼──────────┼────────────┼──────────────────┤
│ Service C   │    5     │    $50.00  │   $250.00        │ ← Data Row 3
└─────────────┴──────────┴────────────┴──────────────────┘
```

### JSON Data Structure
```json
{
  "items": [
    { "description": "Product A", "quantity": 2, "price": 100, "total": 200 },
    { "description": "Product B", "quantity": 1, "price": 150, "total": 150 },
    { "description": "Service C", "quantity": 5, "price": 50, "total": 250 }
  ]
}
```

### Table Configuration
```typescript
{
  tableType: "grid",
  dataSource: "items",  // Points to array
  columns: [
    { header: "Description", binding: "description", width: "50%" },
    { header: "Quantity", binding: "quantity", width: "15%" },
    { header: "Unit Price", binding: "price", width: "20%", format: "currency" },
    { header: "Total", binding: "total", width: "15%", format: "currency" }
  ]
}
```

### Features
- ✅ Multiple rows from array iteration
- ✅ Header row with column titles
- ✅ Can add/remove columns in UI
- ✅ Each item in array = one table row
- ✅ Horizontal layout

---

## Price Table Example

### Visual Representation
```
┌────────────────────┬──────────────┐
│    PRICE TABLE     │              │
│  (Object Data)     │              │
├────────────────────┼──────────────┤
│ Subtotal           │   $600.00    │ ← Row 1 (from column 1)
├────────────────────┼──────────────┤
│ Tax (10%)          │    $60.00    │ ← Row 2 (from column 2)
├────────────────────┼──────────────┤
│ Shipping           │    $15.00    │ ← Row 3 (from column 3)
├────────────────────┼──────────────┤
│ Discount           │   -$25.00    │ ← Row 4 (from column 4)
├────────────────────┼──────────────┤
│ Total              │   $650.00    │ ← Row 5 (from column 5)
└────────────────────┴──────────────┘
```

### JSON Data Structure
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

### Table Configuration
```typescript
{
  tableType: "price",
  dataSource: "summary",  // Points to object
  columns: [  // Each column = one row in output!
    { header: "Subtotal", binding: "subtotal", format: "currency" },
    { header: "Tax (10%)", binding: "tax", format: "currency" },
    { header: "Shipping", binding: "shipping", format: "currency" },
    { header: "Discount", binding: "discount", format: "currency" },
    { header: "Total", binding: "total", format: "currency" }
  ]
}
```

### Features
- ✅ Key-value pairs (label → value)
- ✅ No header row
- ✅ Cannot add/remove rows in UI (structure from JSON)
- ✅ Each column definition = one table row
- ✅ Two-column layout (label | value)

---

## Side-by-Side Comparison

| Feature                | Grid Table | Price Table |
|------------------------|------------|-------------|
| **Purpose**            | Display lists/arrays | Display summaries/totals |
| **Data Source**        | Array `[]` | Object `{}` |
| **Layout**             | Horizontal (columns) | Vertical (rows) |
| **Header Row**         | ✅ Yes | ❌ No |
| **Multiple Rows**      | ✅ Yes (from array) | ❌ No (fixed structure) |
| **Add/Remove Columns** | ✅ Yes | ❌ No |
| **Border Controls**    | ✅ Yes | ✅ Yes |
| **Style Variants**     | ✅ Yes (3 styles) | ✅ Yes (3 styles) |
| **Inline Controls**    | ✅ Yes | ✅ Yes |

---

## How Price Table "Columns" Become "Rows"

This is the key concept that makes Price Tables unique:

### Traditional Grid Table (4 columns × N rows)
```
Column 1    Column 2    Column 3    Column 4
─────────────────────────────────────────────
Item 1.1    Item 1.2    Item 1.3    Item 1.4
Item 2.1    Item 2.2    Item 2.3    Item 2.4
Item 3.1    Item 3.2    Item 3.3    Item 3.4
```

### Price Table (2 columns × N rows, where N = column definitions)
```
Label (header)     Value (binding)
──────────────────────────────────
Subtotal           $600.00         ← Column definition 1
Tax                $60.00          ← Column definition 2
Shipping           $15.00          ← Column definition 3
Total              $650.00         ← Column definition 4
```

**In Price Tables:**
- Each "column" definition creates one **row** in the output
- The `header` field becomes the **label** (left column)
- The `binding` field gets the **value** (right column)
- This creates a natural key-value display

---

## Usage Guidelines

### Use Grid Table When:
- You have an **array** of similar items
- Each item has the **same structure**
- You want to display in **columns**
- You need **multiple rows** of data
- Examples: Invoice items, product lists, charge breakdowns

### Use Price Table When:
- You have an **object** with properties
- Each property is **unique/different**
- You want **key-value pairs**
- You want **vertical layout** of labels and values
- Examples: Totals, summaries, financial calculations, key information

---

## UI Controls

### Properties Panel Controls (Both Types)

1. **Table Type Selector**
   ```
   [Grid Table (Items/Data Array)    ▼]
   ```
   or
   ```
   [Price Table (Summary/Totals)     ▼]
   ```

2. **Border Color**
   ```
   [🎨] [#000000                     ]
   ```

3. **Border Thickness**
   ```
   [2              ] px
   ```

4. **Columns** (Grid only shows Add button)
   ```
   Columns                        [+ Add]  ← Only for Grid
   ```

### Canvas Inline Controls (Both Types)

When table is selected:
```
┌────────────────────────────────────────┐
│         Table Content Here             │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ 🎨 Border: [🎨] │ 📏 Width: [2  ] px   │ ← Inline controls
└────────────────────────────────────────┘
```

---

## Code Examples

### Creating a Grid Table

```typescript
const gridTable = {
  id: "items_table",
  type: "table",
  x: 20, y: 200,
  width: 750, height: 300,
  tableConfig: {
    dataSource: "items",
    tableType: "grid",
    columns: [
      { header: "Item", binding: "name", width: "60%" },
      { header: "Price", binding: "price", width: "40%", format: "currency" }
    ]
  },
  style: { 
    gridBorderColor: "#0ea5e9",
    gridBorderWidth: 2
  }
};
```

### Creating a Price Table

```typescript
const priceTable = {
  id: "summary_table",
  type: "table",
  x: 450, y: 460,
  width: 320, height: 150,
  tableConfig: {
    dataSource: "totals",
    tableType: "price",
    columns: [
      { header: "Subtotal", binding: "subtotal", format: "currency" },
      { header: "Tax", binding: "tax", format: "currency" },
      { header: "Total", binding: "total", format: "currency" }
    ]
  },
  style: { 
    gridBorderColor: "#22c55e",
    gridBorderWidth: 1
  }
};
```

---

## Migration Guide

### Existing Templates

All existing table elements will automatically default to `tableType: "grid"`, maintaining backward compatibility.

### Converting Grid to Price

To convert an existing Grid table to Price:

1. Select the table element
2. In Properties Panel, change "Table Type" to "Price Table"
3. Update "Data Source" to point to an object instead of array
4. Adjust column definitions if needed

### Converting Price to Grid

To convert a Price table to Grid:

1. Select the table element
2. In Properties Panel, change "Table Type" to "Grid Table"
3. Update "Data Source" to point to an array instead of object
4. The "Add Column" button will appear
5. Adjust column definitions for horizontal layout

---

## Best Practices

### For Grid Tables
- Use clear, concise column headers
- Set appropriate column widths (percentages work well)
- Use currency format for monetary values
- Keep data structure consistent across array items

### For Price Tables
- Use descriptive labels as headers
- Order items logically (e.g., subtotal → tax → total)
- Place totals at the bottom
- Use bold/larger font for final total (via style)

### For Both Types
- Choose border color that matches your brand
- Use appropriate border thickness (1-2px for clean look)
- Select table variant that fits your design
- Test with real data before finalizing
