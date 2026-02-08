# Visual Guide: Invoice Table Export Fix

## The Problem

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE THE FIX                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User in EDIT MODE                                          │
│  ┌──────────────────────┐                                   │
│  │  Canvas Display:     │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ {items.name}    │ │  ← Shows JSON paths (correct)    │
│  │  │ {items.price}   │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│           │                                                  │
│           │ Click "Export PDF" or "Export HTML"             │
│           ▼                                                  │
│  ┌──────────────────────┐                                   │
│  │  Export Output:      │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ {items.name}    │ │  ← Shows JSON paths (WRONG!)     │
│  │  │ {items.price}   │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│                                                             │
│  ❌ Bug: Export shows paths instead of values               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User in PREVIEW MODE                                       │
│  ┌──────────────────────┐                                   │
│  │  Canvas Display:     │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ Laptop          │ │  ← Shows values (correct)         │
│  │  │ $999.99         │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│           │                                                  │
│           │ Click "Export PDF" or "Export HTML"             │
│           ▼                                                  │
│  ┌──────────────────────┐                                   │
│  │  Export Output:      │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ Laptop          │ │  ← Shows values (correct)         │
│  │  │ $999.99         │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│                                                             │
│  ✅ Works correctly in Preview mode                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## The Solution

```
┌─────────────────────────────────────────────────────────────┐
│                     AFTER THE FIX                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User in EDIT MODE                                          │
│  ┌──────────────────────┐                                   │
│  │  Canvas Display:     │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ {items.name}    │ │  ← Shows JSON paths (correct)    │
│  │  │ {items.price}   │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│           │                                                  │
│           │ Click "Export PDF" or "Export HTML"             │
│           ▼                                                  │
│  ┌──────────────────────┐                                   │
│  │  Export Output:      │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ Laptop          │ │  ← Shows values (FIXED!)         │
│  │  │ $999.99         │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│                                                             │
│  ✅ Fixed: Export now shows resolved values                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User in PREVIEW MODE                                       │
│  ┌──────────────────────┐                                   │
│  │  Canvas Display:     │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ Laptop          │ │  ← Shows values (correct)         │
│  │  │ $999.99         │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│           │                                                  │
│           │ Click "Export PDF" or "Export HTML"             │
│           ▼                                                  │
│  ┌──────────────────────┐                                   │
│  │  Export Output:      │                                   │
│  │  ┌─────────────────┐ │                                   │
│  │  │ Laptop          │ │  ← Shows values (correct)         │
│  │  │ $999.99         │ │                                   │
│  │  └─────────────────┘ │                                   │
│  └──────────────────────┘                                   │
│                                                             │
│  ✅ Still works correctly in Preview mode                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Editor.tsx                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Export HTML Button (Line 1065-1104)                        │
│  ┌─────────────────────────────────────────┐               │
│  │ onClick={() => {                        │               │
│  │   const parsedData = parseSampleData(...)│               │
│  │                                         │               │
│  │   // BEFORE FIX (Line 1091):           │               │
│  │   renderElementForExport(              │               │
│  │     el,                                 │               │
│  │     isPreviewMode,  ← ❌ Wrong!        │               │
│  │     parsedData                          │               │
│  │   )                                     │               │
│  │                                         │               │
│  │   // AFTER FIX (Line 1091):            │               │
│  │   renderElementForExport(              │               │
│  │     el,                                 │               │
│  │     true,           ← ✅ Fixed!        │               │
│  │     parsedData                          │               │
│  │   )                                     │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Export PDF Button (Line 1106-1160)                        │
│  ┌─────────────────────────────────────────┐               │
│  │ onClick(() => {                        │               │
│  │   const parsedData = parseSampleData(...)│               │
│  │                                         │               │
│  │   // BEFORE FIX (Line 1137):           │               │
│  │   renderElementForExport(              │               │
│  │     el,                                 │               │
│  │     isPreviewMode,  ← ❌ Wrong!        │               │
│  │     parsedData                          │               │
│  │   )                                     │               │
│  │                                         │               │
│  │   // AFTER FIX (Line 1137):            │               │
│  │   renderElementForExport(              │               │
│  │     el,                                 │               │
│  │     true,           ← ✅ Fixed!        │               │
│  │     parsedData                          │               │
│  │   )                                     │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          renderElementForExport Function                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  function renderElementForExport(                           │
│    el: TemplateElement,                                     │
│    isPreviewMode: boolean,  ← This parameter!              │
│    sampleData: any                                          │
│  ): string {                                                │
│    ...                                                      │
│    if (el.type === 'invoiceTable') {                        │
│      rows.forEach(row => {                                  │
│        columns.forEach(col => {                             │
│          if (isPreviewMode) {                               │
│            // ✅ Resolve binding                            │
│            cellValue = getNestedValue(row, col.binding);    │
│          } else {                                           │
│            // ❌ Show JSON path                             │
│            cellValue = `{${col.binding}}`;                  │
│          }                                                  │
│        });                                                  │
│      });                                                    │
│    }                                                        │
│    ...                                                      │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Decision Flow

```
                    User Clicks Export
                           │
                           ▼
                ┌──────────────────────┐
                │ What mode are we in? │
                └──────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    ┌────────────┐                  ┌────────────┐
    │ Edit Mode  │                  │ Preview    │
    │            │                  │ Mode       │
    └────────────┘                  └────────────┘
           │                               │
           │                               │
           │  BEFORE FIX:                  │  BEFORE FIX:
           │  Pass isPreviewMode (false)   │  Pass isPreviewMode (true)
           │        │                      │        │
           │        ▼                      │        ▼
           │  Show JSON Paths ❌          │  Show Values ✅
           │                               │
           │  AFTER FIX:                   │  AFTER FIX:
           │  Pass true                    │  Pass true
           │        │                      │        │
           │        ▼                      │        ▼
           │  Show Values ✅               │  Show Values ✅
           │                               │
           └───────────────┬───────────────┘
                           │
                           ▼
                  Export with Values
```

## Sample Data Example

```json
{
  "items": [
    {
      "name": "Laptop",
      "price": 999.99,
      "quantity": 1
    },
    {
      "name": "Mouse",
      "price": 24.99,
      "quantity": 2
    }
  ]
}
```

### Table Configuration
```javascript
{
  type: 'invoiceTable',
  dataSource: 'items',
  columns: [
    { binding: 'items.name', label: 'Product' },
    { binding: 'items.price', label: 'Price', format: 'currency' },
    { binding: 'items.quantity', label: 'Qty', format: 'number' }
  ]
}
```

### Before Fix (Export from Edit Mode)
```
┌──────────┬──────────────┬────────┐
│ Product  │ Price        │ Qty    │
├──────────┼──────────────┼────────┤
│ {items.name} │ {items.price} │ {items.quantity} │ ❌
│ {items.name} │ {items.price} │ {items.quantity} │ ❌
└──────────┴──────────────┴────────┘
```

### After Fix (Export from Edit Mode)
```
┌──────────┬──────────────┬────────┐
│ Product  │ Price        │ Qty    │
├──────────┼──────────────┼────────┤
│ Laptop   │ $999.99      │ 1      │ ✅
│ Mouse    │ $24.99       │ 2      │ ✅
└──────────┴──────────────┴────────┘
```

## Key Takeaways

1. **Canvas Display** (unchanged):
   - Edit mode: Shows JSON paths to help users understand bindings
   - Preview mode: Shows resolved values to see final result

2. **Export Output** (fixed):
   - Always shows resolved values, regardless of current mode
   - Export is always a "preview" operation

3. **Change Impact**:
   - Minimal: Only 3 lines changed
   - Safe: No breaking changes
   - Tested: Code review and security scan passed

4. **User Benefit**:
   - No need to switch to Preview mode before exporting
   - Consistent, predictable export behavior
   - Exports always contain actual data, never placeholders
