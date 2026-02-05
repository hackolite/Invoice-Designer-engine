# Price Table Inline Controls Implementation

## Overview
This document describes the changes made to move price table row add/remove controls from the property panel to inline toolbar buttons, matching the GridTable implementation style.

## Changes Summary

### 1. Removed Table Type Selector
**Location**: `ElementProperties.tsx` (Property Panel)

**Before**:
- Had a dropdown selector to switch between "Grid Table" and "Price Table"
- Located at the top of the table configuration section

**After**:
- Selector completely removed
- Table type is now determined by the element's configuration and doesn't change dynamically

### 2. Moved Add/Remove Row Controls to Inline Toolbar
**Location**: `Canvas.tsx` (Table Toolbar)

**Before**:
- Add Row button was in the ElementProperties panel header
- Remove Row button (trash icon) was on each individual row in the properties panel

**After**:
- Both buttons now appear in the inline toolbar that shows up when a price table is selected
- Positioned alongside the existing Border and Width controls
- Styled to match GridTable's add/remove row buttons

**Button Details**:

#### Add Row Button
```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
  onClick={(e) => {
    e.stopPropagation();
    handlePriceTableAddRow(el.id);
  }}
  title="Add row"
  aria-label="Add row"
>
  <Plus className="w-3 h-3 mr-1" />
  <Rows className="w-4 h-4" />
</Button>
```
- Icon: Plus (small) + Rows (larger)
- Color: Primary (blue)
- Action: Adds a new additional row with default values (label: "Total", value: "{total}", format: "currency")

#### Remove Row Button
```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
  onClick={(e) => {
    e.stopPropagation();
    handlePriceTableRemoveRow(el.id);
  }}
  title="Remove last row"
  aria-label="Remove last row"
  disabled={!el.tableConfig?.additionalRows || el.tableConfig.additionalRows.length === 0}
>
  <Minus className="w-3 h-3 mr-1" />
  <Rows className="w-4 h-4" />
</Button>
```
- Icon: Minus (small) + Rows (larger)
- Color: Destructive (red)
- Action: Removes the last additional row
- Disabled: When there are no additional rows to remove

### 3. Updated Property Panel
**Location**: `ElementProperties.tsx`

**What Remains**:
- Border and Width controls (still in toolbar)
- Additional rows configuration section with:
  - Row count badge
  - Duplicate button for each row
  - Move up/down buttons for reordering
  - Full configuration for each row:
    - Label input
    - Value input (with binding support)
    - Format selector (text/currency/number)
    - Text alignment buttons
    - Text style buttons (bold, italic, underline)
  - Updated help text directing users to toolbar buttons

**What Was Removed**:
- "Add Row" button from header
- Trash icon (delete) button from each row
- Table type selector dropdown

## Implementation Details

### New Functions in Canvas.tsx

#### handlePriceTableAddRow
```typescript
const handlePriceTableAddRow = (elementId: string) => {
  const element = layout.elements.find(e => e.id === elementId);
  if (!element || !element.tableConfig) return;
  
  const config = element.tableConfig;
  const newAdditionalRow = { label: "Total", value: "{total}", format: 'currency' as const };
  
  onElementUpdate(elementId, {
    tableConfig: {
      ...config,
      additionalRows: [...(config.additionalRows || []), newAdditionalRow]
    }
  });
};
```

#### handlePriceTableRemoveRow
```typescript
const handlePriceTableRemoveRow = (elementId: string) => {
  const element = layout.elements.find(e => e.id === elementId);
  if (!element || !element.tableConfig || !element.tableConfig.additionalRows) return;
  
  const config = element.tableConfig;
  if (config.additionalRows.length === 0) return;
  
  const newAdditionalRows = [...config.additionalRows];
  newAdditionalRows.pop(); // Remove last row
  
  onElementUpdate(elementId, {
    tableConfig: {
      ...config,
      additionalRows: newAdditionalRows
    }
  });
};
```

## Visual Layout

### Toolbar Layout (when price table is selected)
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Border: 🎨 ▓] [Width: [1] px] ─────── [+ Rows] [- Rows] [Copy]      │
└────────────────────────────────────────────────────────────────────────┘
```

### Property Panel Layout
```
┌─────────────────────────────────────────────────┐
│ Additional Rows Configuration          (2)      │
├─────────────────────────────────────────────────┤
│ Configure additional rows for displaying        │
│ totals and summaries. Use the toolbar          │
│ buttons to add or remove rows.                  │
│                                                  │
│ ╔═══════════════════════════════════════╗       │
│ ║ [Copy+]                               ║       │
│ ║ ↑↓                                    ║       │
│ ║ Label: [Total          ]              ║       │
│ ║ Value: [{total}        ]              ║       │
│ ║ Format: [Currency      ▼]             ║       │
│ ║ Text Align: [L][C][R][J]              ║       │
│ ║ Text Style: [B][I][U]                 ║       │
│ ╚═══════════════════════════════════════╝       │
└─────────────────────────────────────────────────┘
```

## User Workflow

### Adding a Row
1. Select a price table element
2. Look for the inline toolbar above/below the table
3. Click the "+ Rows" button (blue)
4. A new row is added with default values
5. Configure the row in the property panel

### Removing a Row
1. Select a price table element
2. Look for the inline toolbar above/below the table
3. Click the "- Rows" button (red)
4. The last additional row is removed
5. Button is disabled if there are no rows to remove

### Configuring Rows
1. All row configuration remains in the property panel
2. Use duplicate button to copy an existing row
3. Use up/down arrows to reorder rows
4. Edit label, value, format, and styling in the panel

## Benefits

1. **Consistent UI**: Price table controls now match GridTable's inline button style
2. **Better UX**: Add/remove actions are closer to the visual table element
3. **Cleaner Property Panel**: Focuses on configuration rather than CRUD operations
4. **Inline Actions**: Operations that affect the table structure are inline with the table
5. **Less Clutter**: Removed redundant table type selector

## Files Modified

- `client/src/components/Canvas.tsx` - Added inline buttons and handler functions
- `client/src/components/ElementProperties.tsx` - Removed buttons and selector, updated help text
