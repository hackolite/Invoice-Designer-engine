# Price Table Footer & Currency Feature Guide

## Overview

This guide demonstrates the **Footer** and **Currency** features available for Price Tables in the Invoice Designer Engine.

## Features Verified

### ✅ 1. Footer Feature (Near "px" on Price Table)

The footer feature allows you to add summary rows to price tables, positioned conveniently near the "px" (border width) control.

#### Location
- **Inline Controls**: When a price table is selected, inline controls appear below the table
- **Footer Button Position**: Located immediately after the "px" text in the border width control
- The button is labeled **"+ Footer"** (Add footer row)

#### How to Use
1. Select a price table on the canvas
2. In the inline controls below the table, find the border controls showing "Border:" and "Width: [X] px"
3. Click the **"+ Footer"** button located right next to "px"
4. A footer row is added to the table with default values:
   - Label: "Total"
   - Value: "{total}" (bindable to JSON data)
   - Format: "Currency"

#### Footer Management
- **Add Multiple Footers**: Click "+ Footer" multiple times to add multiple footer rows
- **Remove Footer**: Click the "− Footer" button (appears when footer exists)
- **Edit Footer**: 
  - In the properties panel, scroll to "Footer Rows" section
  - Edit Label, Value (can use data bindings like {total}), and Format for each footer

### ✅ 2. Currency Format Selection

Price tables support three currency format options for displaying monetary values.

#### Available Options

1. **US Dollar ($)**
   - Displays values as: `$X,XXX.XX`
   - Example: `$1,234.56`
   - Default format

2. **Euro (€)**
   - Displays values as: `€X,XXX.XX`
   - Example: `€1,234.56`

3. **None (Number only)**
   - Displays values as plain numbers: `X` or `X.XX`
   - Example: `1234.56` or `0`
   - No currency symbol

#### How to Use
1. Select a price table on the canvas
2. In the **Properties Panel** (right side), find the "Currency Format" dropdown
3. Select your preferred currency format:
   - US Dollar ($)
   - Euro (€)
   - None (Number only)
4. The change applies to all columns formatted as "Currency" and footer rows with "Currency" format

## Technical Details

### Schema Definition

The currency format is defined in the table configuration:

```typescript
tableConfig: {
  dataSource: string;
  tableType: 'price';  // Must be 'price' type
  currency?: 'USD' | 'EUR' | 'none';  // Currency selection
  columns: [...],
  footer?: [
    {
      label: string;     // Footer label (e.g., "Total")
      value: string;     // Value or binding (e.g., "{total}")
      format?: 'currency' | 'number' | 'text';
    }
  ]
}
```

### Implementation Files

- **Schema**: `/shared/schema.ts` - Contains type definitions
- **Canvas Rendering**: `/client/src/components/Canvas.tsx` - Renders tables and inline controls
- **Properties Panel**: `/client/src/components/ElementProperties.tsx` - Currency and footer controls

### Currency Formatting Logic

The currency is applied using JavaScript's `Intl.NumberFormat`:

```javascript
// USD
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

// EUR
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value)

// None
Number(value)  // Plain number, no formatting
```

## Screenshots Evidence

All screenshots are available in `/tmp/playwright-logs/`:

1. **01-homepage.png** - Application homepage
2. **02-editor-initial.png** - Template editor view
3. **03-price-table-with-footer-button.png** - Price table showing "Footer" button near "px"
4. **04-footer-added-to-price-table.png** - Footer successfully added with "Total" row
5. **05-preview-with-usd-currency.png** - Preview showing USD format ($0.00)
6. **06-preview-with-euro-currency.png** - Preview showing Euro format (€0.00)
7. **07-preview-with-no-currency.png** - Preview showing no currency (0)

## User Experience

### Footer Button Position
The footer button is strategically placed near the "px" text because:
- It's in the inline controls that appear when a table is selected
- It's grouped with other table manipulation controls (border settings, clone)
- Easy to access without opening the properties panel
- Visible and discoverable when working with the table

### Currency Options
The three currency options cover common use cases:
- **USD**: For US-based invoices
- **EUR**: For European invoices
- **None**: For quantity displays, percentages, or non-monetary values

## Example Usage

### Creating a Summary Price Table with Footer

1. Add a Price Table to your template
2. Configure columns to bind to summary data (e.g., subtotal, tax, shipping)
3. Set currency format to USD or EUR
4. Click the "Footer" button near "px" to add a total row
5. Configure the footer to show the grand total

### Data Binding Example

Sample JSON data:
```json
{
  "summary": {
    "subtotal": 2900,
    "tax": 580,
    "total": 3480
  }
}
```

Price Table Configuration:
- Data Source: "summary"
- Columns: Subtotal, Tax (each with currency format)
- Footer: Label "Total", Value "{total}", Format "Currency"
- Currency: USD

Result displays:
```
Subtotal    $2,900.00
Tax         $580.00
Total       $3,480.00
```

## Compatibility

- ✅ Works with all table styles (Classic, Minimalist, Modern)
- ✅ Compatible with existing templates (defaults to USD if not specified)
- ✅ Footer supports data bindings and static text
- ✅ Currency applies to both column values and footer values

## Conclusion

Both the **Footer** feature and **Currency selection** are fully implemented and working as expected. The features provide flexible options for creating professional invoice templates with proper monetary formatting.
