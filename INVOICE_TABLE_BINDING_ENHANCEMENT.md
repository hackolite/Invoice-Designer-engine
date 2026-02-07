# Invoice Table Data Binding Enhancement

## Problem Statement (French)
Pour invoice table, le binding data qui doit être utilisé pour le champs des item est ce qu'il y a comme clées dans items et values. Dans le header de invoice table et dans footer de invoice table, on peut mettre le reste des clées et values, mais pas ce qu'il y a dans item, ça n'aurais pas de sens.

## Problem Statement (English Translation)
For invoice tables, the data binding that should be used for item fields is what's available as keys in items and their values. In the header and footer of the invoice table, we can use other keys and values, but NOT those from items, as that wouldn't make sense.

## Solution Overview
This implementation ensures proper data binding separation for invoice tables:

1. **Item cells** (data rows): Show only keys from the items array
2. **Footer cells**: Show all keys EXCEPT those from the items array

## Changes Made

### 1. New Helper Functions

#### `buildDataPathTreeForItems(data, dataSource)`
- Extracts the structure from the first item in the items array
- Returns only the keys available within each item
- Used for item cell binding context menus

**Example:**
```javascript
// Given data:
{
  "invoiceNumber": "INV-001",
  "total": 1000,
  "items": [
    { "name": "Item 1", "price": 300, "quantity": 1 }
  ]
}

// With dataSource = "items"
// Returns: { "name": "name", "price": "price", "quantity": "quantity" }
```

#### `buildDataPathTreeExcludingItems(data, dataSource)`
- Builds a data tree of all top-level keys EXCEPT the items array
- Used for footer row binding context menus

**Example:**
```javascript
// Given same data as above with dataSource = "items"
// Returns: { "invoiceNumber": "invoiceNumber", "total": "total" }
// Note: "items" is excluded
```

### 2. UI Enhancements

#### Item Cell Context Menu
- Right-click on any item cell in the invoice table
- Select "Bind Data" from context menu
- See only item-level fields (e.g., name, price, quantity)
- Cannot see top-level fields (e.g., total, invoiceNumber)

#### Footer Row Context Menu (NEW)
- Right-click on footer row value cells
- Select "Bind Data" from context menu
- See only top-level fields (e.g., total, subtotal, tax, invoiceNumber)
- Cannot see item-level fields (e.g., name, price, quantity)

### 3. New Handler Function

#### `handleInvoiceTableFooterBindingUpdate(elementId, footerRowIndex, binding)`
- Updates footer row value with selected binding
- Automatically wraps binding in curly braces: `{binding}`
- Triggered when user selects a field from the footer context menu

### 4. Updated Rendering Function

#### `renderDataTreeForInvoiceTableFooter(tree, elementId, footerRowIndex)`
- Renders the context menu for footer row bindings
- Similar to item cell menu but uses different data tree
- Recursively handles nested objects (e.g., customer.name, customer.email)

## Usage Example

### Sample Data Structure
```json
{
  "invoiceNumber": "INV-001",
  "date": "2024-01-15",
  "total": 1000,
  "subtotal": 900,
  "tax": 100,
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "name": "Web Development",
      "description": "Full-stack development",
      "price": 500,
      "quantity": 1,
      "total": 500
    },
    {
      "name": "Consulting",
      "description": "Technical consulting",
      "price": 200,
      "quantity": 2,
      "total": 400
    }
  ]
}
```

### Item Cells Binding Options
When right-clicking on an item cell, users will see:
- name
- description
- price
- quantity
- total (item total)

### Footer Cells Binding Options
When right-clicking on a footer cell, users will see:
- invoiceNumber
- date
- total (invoice total)
- subtotal
- tax
- customer (expandable)
  - name
  - email

## Known Limitations

### Nested DataSources
The current implementation assumes the dataSource is a top-level key (e.g., `"items"`).

For nested dataSources (e.g., `"invoice.items"`), the entire parent object (`"invoice"`) will be excluded from footer bindings.

**Workaround:**
1. Restructure your data to have items at the top level, OR
2. Manually enter binding paths in the properties panel (this still works)

**Example of nested dataSource limitation:**
```json
{
  "invoice": {
    "number": "INV-001",
    "total": 1000,
    "items": [...]
  }
}
```

If dataSource is set to `"invoice.items"`, the footer binding menu will NOT show `invoice.number` or `invoice.total`. However, you can still manually type `{invoice.number}` in the properties panel.

## Testing

### Unit Test Verification
A test script was created to verify the logic:

```javascript
const sampleData = {
  invoiceNumber: "INV-001",
  total: 1000,
  items: [
    { name: "Item 1", price: 300, quantity: 1 }
  ]
};

// Test 1: Item bindings
const itemTree = buildDataPathTreeForItems(sampleData, "items");
// Result: { "name": "name", "price": "price", "quantity": "quantity" }

// Test 2: Footer bindings
const footerTree = buildDataPathTreeExcludingItems(sampleData, "items");
// Result: { "invoiceNumber": "invoiceNumber", "total": "total" }
```

### Build Verification
- ✅ Build succeeds without errors
- ✅ No new TypeScript errors introduced
- ✅ CodeQL security scan: 0 alerts

## Files Modified

### `/client/src/components/Canvas.tsx`
- Added `buildDataPathTreeForItems()` function
- Added `buildDataPathTreeExcludingItems()` function
- Added `handleInvoiceTableFooterBindingUpdate()` handler
- Added `renderDataTreeForInvoiceTableFooter()` rendering function
- Updated item cell context menu to use `buildDataPathTreeForItems()`
- Added context menu to footer row value cells

## Benefits

1. **Better UX**: Users can now easily select appropriate fields from context menus
2. **Prevents Errors**: Reduces chance of binding item fields in footers (which would error or show incorrect data)
3. **Clearer Separation**: Makes the data model more intuitive and easier to understand
4. **Consistency**: Footer rows now have the same binding UI as item cells

## Migration Notes

This change is **fully backward compatible**. Existing templates will continue to work:
- Existing item cell bindings remain unchanged
- Existing footer row bindings (manually entered in properties panel) remain unchanged
- The only change is the addition of context menus and filtering of available fields
