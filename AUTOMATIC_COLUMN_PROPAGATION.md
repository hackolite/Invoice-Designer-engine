# Automatic Column Propagation for Invoice Tables

## Overview

This feature automatically propagates cell content changes to all cells in the same column when editing invoice table data cells. This applies only to "for loop" cells (data rows), excluding header and footer cells.

## Problem Statement (Original - French)

> "quand je change un élément d'une colonne hors header et footer de cellules "for loop", je veux que ça change dans toutes les cells de la colonne qui sont des items de la for loop y compris la cell d'edition, except header et footer dans la invoice table."

**Translation**: 
"When I change an element in a column outside header and footer of 'for loop' cells, I want it to change in all cells of the column that are items of the for loop including the edit cell, except header and footer in the invoice table."

## Implementation

### Modified Function

**File**: `client/src/components/Canvas.tsx`  
**Function**: `createCellBlurHandler` (lines 271-340)

### How It Works

1. **User edits a cell**: User clicks on a data cell in the invoice table and edits its content
2. **Cell loses focus (onBlur)**: When the user clicks away or presses Enter, the blur handler is triggered
3. **Automatic propagation**: The handler now:
   - Saves the edited content to the current cell
   - Iterates through all data rows in the column
   - Applies the same content to all cells in that column
   - Excludes header and footer cells (they have separate handlers)

### Key Changes

#### Before
```typescript
function createCellBlurHandler(...) {
  return (e: React.FocusEvent<HTMLTableCellElement>) => {
    // Only updated the single edited cell
    const newContent = e.currentTarget.textContent || '';
    updatedInlineData[existingCellIndex] = { 
      row: rowIdx, 
      col: colIdx, 
      content: newContent 
    };
  };
}
```

#### After
```typescript
function createCellBlurHandler(...) {
  return (e: React.FocusEvent<HTMLTableCellElement>) => {
    // Updates the edited cell
    const newContent = e.currentTarget.textContent || '';
    updatedInlineData[existingCellIndex] = { 
      row: rowIdx, 
      col: colIdx, 
      content: newContent 
    };
    
    // AUTOMATIC COLUMN PROPAGATION:
    // Apply to all other rows in the column
    for (let row = 0; row < INVOICE_TABLE_EDITOR_DATA_ROWS; row++) {
      if (row === rowIdx) continue; // Skip source row
      
      // Update or add cell data for this row
      updatedInlineData[targetCellIndex] = { 
        row, 
        col: colIdx, 
        content: newContent 
      };
    }
  };
}
```

## Scope and Limitations

### Applies To
- ✅ **Data rows** in invoice tables (the "for loop" cells)
- ✅ **Edit mode only** (not preview mode)
- ✅ All columns in the invoice table

### Does NOT Apply To
- ❌ **Header cells** - use separate editing handler (`createHeaderCellBlurHandler`)
- ❌ **Footer cells** - use separate editing handler (`createFooterCellBlurHandler`)
- ❌ **Preview mode** - shows actual bound data from JSON
- ❌ **Other table types** - only applies to invoice tables with `tableType: 'invoice'`

### Data Rows in Edit Mode
- Invoice tables show exactly **3 sample data rows** in edit mode
- This is controlled by `INVOICE_TABLE_EDITOR_DATA_ROWS = 3` constant
- The propagation loop iterates through these 3 rows (indices 0, 1, 2)

## User Experience

### Before This Feature
1. User edits a cell in column A, row 1
2. Content is saved to that single cell only
3. To apply to other rows, user must:
   - Right-click on the cell
   - Select "Apply to Column" → "Apply Content"
   - Manual action required

### After This Feature
1. User edits a cell in column A, row 1
2. Content is **automatically** saved to:
   - Column A, row 1 (the edited cell)
   - Column A, row 2 (automatically propagated)
   - Column A, row 3 (automatically propagated)
3. No manual action required
4. User can still see visual feedback in real-time

## Technical Details

### Data Structure

The feature updates the `inlineData` array in the table configuration:

```typescript
tableConfig: {
  inlineData: [
    { row: 0, col: 0, content: "Item A" },  // Edited cell
    { row: 1, col: 0, content: "Item A" },  // Auto-propagated
    { row: 2, col: 0, content: "Item A" },  // Auto-propagated
  ]
}
```

### Rendering Logic

**Edit Mode** (lines 2316, 2330-2332):
```typescript
// Render 3 sample rows
{[1, 2, 3].map((dataItem: any, rowIdx: number) => {
  // Check for inline edited data
  const cellData = inlineData.find((cell) => 
    cell.row === rowIdx && cell.col === colIdx
  );
  
  if (cellData) {
    displayValue = cellData.content; // Shows propagated content
  }
})}
```

**Preview Mode**:
```typescript
// Render actual data from JSON
{sourceData.map((dataItem: any, rowIdx: number) => {
  const rawVal = getValue(dataItem, col.binding);
  displayValue = formatValue(rawVal); // Shows bound data, ignores inlineData
})}
```

## Relationship to Existing Features

### "Apply to Column" Feature (Still Available)

The existing "Apply to Column" feature from the context menu is still available and useful for:

1. **Apply Style to Column**: Propagates text formatting (bold, italic, alignment, etc.)
2. **Manual override**: If automatic propagation is unwanted for a specific case

**Location**: Canvas.tsx lines 1090-1140 and 1143-1180

### Header and Footer Editing

Headers and footers continue to work independently:
- **Header cells**: Use `createHeaderCellBlurHandler` (lines 313-351)
- **Footer cells**: Use `createFooterCellBlurHandler` (lines 354-393)
- They do NOT propagate to other rows/columns

## Testing

### Manual Testing Checklist

- [x] ✅ Build succeeds without errors
- [x] ✅ TypeScript compilation passes
- [x] ✅ No security vulnerabilities (CodeQL check)
- [ ] Manual UI testing (requires database setup):
  - [ ] Edit a cell in column 1, verify all rows in column 1 update
  - [ ] Edit a cell in column 2, verify all rows in column 2 update
  - [ ] Edit a header cell, verify it does NOT propagate to data rows
  - [ ] Edit a footer cell, verify it does NOT propagate to data rows
  - [ ] Switch to preview mode, verify bound data is shown correctly

### Code Quality

**TypeScript Check**: ✅ Passes  
**Build**: ✅ Successful  
**Code Review**: ✅ 2 minor style comments (not blocking)  
**Security (CodeQL)**: ✅ No alerts found  

## Architecture Notes

### Why Edit Mode Only?

In **preview mode**, cells display actual data from the bound JSON object:
```json
{
  "items": [
    { "name": "Product A", "price": 100 },
    { "name": "Product B", "price": 200 }
  ]
}
```

Each row shows different data from the array. Propagating edits in preview mode would incorrectly overwrite distinct data items.

In **edit mode**, we show 3 sample rows for layout design. These rows represent the template structure, not actual data. Propagating content here makes sense because all rows should have the same template.

### Integration with Data Binding

This feature works alongside data binding:

1. **Design time (edit mode)**: User designs the layout with sample content
   - Automatic propagation ensures consistent column structure
   
2. **Runtime (preview mode)**: Template renders with real data
   - Each row shows its own data via `col.binding`
   - `inlineData` is ignored in preview mode

## Future Enhancements

Potential improvements:

1. **Optional toggle**: Add a setting to enable/disable automatic propagation per table
2. **Undo support**: Allow undoing automatic propagation separately from the edit
3. **Visual indicator**: Show which cells will be affected before propagation
4. **Style propagation**: Automatically propagate styles along with content
5. **Cross-column operations**: Propagate entire row content to other rows

## Backward Compatibility

✅ **Fully backward compatible**

- Existing templates continue to work without changes
- The "Apply to Column" feature is still available
- Header and footer editing behavior unchanged
- Preview mode rendering unchanged
- Only affects new edits in edit mode

## Related Documentation

- [IMPLEMENTATION_INVOICE_TABLE_EDITING.md](./IMPLEMENTATION_INVOICE_TABLE_EDITING.md) - Invoice table editing features
- [INVOICE_TABLE_BINDING_ENHANCEMENT.md](./INVOICE_TABLE_BINDING_ENHANCEMENT.md) - Data binding
- [INVOICE_TABLE_CONTEXT_MENU_CHANGES.md](./INVOICE_TABLE_CONTEXT_MENU_CHANGES.md) - Context menus

---

**Implementation Date**: 2026-02-07  
**Version**: v1.0  
**Author**: GitHub Copilot Agent
