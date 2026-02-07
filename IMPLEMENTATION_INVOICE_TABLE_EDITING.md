# Invoice Table Editing Enhancements - Implementation Summary

## Overview
This document describes the implementation of enhanced editing features for invoice tables in the Invoice Designer Engine, as requested in the problem statement.

## Problem Statement (Original - French)
> "edition inline de invoice table doit permettre d'effacer avec del et supp, la suppression de table doit etre possible uniquement quand la table est selectionnée. l'edition de footer et header doit poivoir proposer le contexte clique droit, et les champs de for loop doivent permettre l'édition par colonne, l'edition d'une cell de une colonne doit permettre de changer les éléments de toute la colonne sauf header et footer"

## Requirements Translation
1. Inline editing of invoice tables must allow deletion with DEL and DELETE keys
2. Table deletion should only be possible when the table is selected
3. Header and footer editing must support right-click context menus
4. For loop fields must allow column-based editing
5. Editing a cell in a column must allow changing all elements in that column except header and footer

---

## Implementation Details

### 1. DEL/Delete Key Support in Cells ✅

**Location**: `client/src/components/Canvas.tsx`

**Implementation**:
- Added keyboard handlers to `onKeyDown` event for header, data, and footer cells
- Handlers check for `e.key === 'Delete' || e.key === 'Backspace'`
- Call `e.stopPropagation()` to prevent event bubbling to window level

**Why stopPropagation()?**
The Editor.tsx has a window-level keydown listener that deletes selected elements when Delete/Backspace is pressed:
```typescript
// From Editor.tsx line 501-503
if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
  e.preventDefault();
  handleDeleteElements(selectedElementIds);
}
```
By calling stopPropagation() in cell handlers, we prevent this window-level handler from firing, thus protecting the table from deletion while editing cells.

**Code Example** (Header Cell):
```typescript
onKeyDown={(e) => {
  if (!isPreviewMode) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      e.currentTarget.textContent = originalValue;
      e.currentTarget.blur();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Allow Delete/Backspace to clear header content
      // Stop propagation to prevent table deletion
      e.stopPropagation();
    }
  }
}}
```

**Applied to**:
- Header cells (line ~2126)
- Data cells (line ~2290)
- Footer label cells (line ~2490)
- Footer value cells (line ~2620)

---

### 2. Header Cell Context Menu ✅

**Location**: `client/src/components/Canvas.tsx` (lines ~1996-2129)

**Implementation**:
- Wrapped header `<th>` elements with `<ContextMenu>` component
- Added `<ContextMenuTrigger>` around the cell
- Added `<ContextMenuContent>` with text formatting options

**New Handler**:
```typescript
const handleInvoiceTableHeaderStyleUpdate = (
  elementId: string, 
  col: number, 
  styleKey: string, 
  styleValue: string | number
) => {
  // Updates config.headerStyles array
  // Each entry: { col: number, style: { textAlign, fontWeight, etc. } }
}
```

**Context Menu Options**:
1. **Text Align** submenu:
   - Left, Center, Right, Justify
2. **Text Style** submenu:
   - Bold/Remove Bold
   - Italic/Remove Italic
   - Underline/Remove Underline

**Style Storage**:
```typescript
// In tableConfig
headerStyles?: {
  col: number;
  style?: Record<string, string | number>;
}[];
```

**Style Application**:
```typescript
// Retrieval
const headerStyles = config.headerStyles || [];
const headerStyle = headerStyles.find(h => h.col === colIdx)?.style || {};

// Applied to <th> style
style={{
  textAlign: (headerStyle.textAlign as React.CSSProperties['textAlign']) || 'left',
  fontWeight: headerStyle.fontWeight || 'bold',
  fontStyle: (headerStyle.fontStyle as React.CSSProperties['fontStyle']) || 'normal',
  textDecoration: headerStyle.textDecoration || 'none',
  // ... other styles
}}
```

---

### 3. Footer Label Context Menu ✅

**Location**: `client/src/components/Canvas.tsx` (lines ~2468-2585)

**Implementation**:
- Wrapped footer label `<td>` elements with `<ContextMenu>` component
- Similar structure to header context menu
- Uses field-specific styling ('label' vs 'value')

**New Handler**:
```typescript
const handleInvoiceTableFooterStyleUpdate = (
  elementId: string, 
  row: number, 
  field: 'label' | 'value', 
  styleKey: string, 
  styleValue: string | number
) => {
  // Updates config.footerStyles array
  // Each entry: { row: number, field: 'label'|'value', style: {...} }
}
```

**Style Storage**:
```typescript
// In tableConfig
footerStyles?: {
  row: number;
  field: 'label' | 'value';
  style?: Record<string, string | number>;
}[];
```

**Key Difference from Headers**:
Footer styles are distinguished by both `row` index and `field` ('label' or 'value'), allowing independent styling of footer labels and values.

**Style Application**:
```typescript
// Retrieval
const footerStyles = config.footerStyles || [];
const footerLabelStyle = footerStyles.find(
  f => f.row === idx && f.field === 'label'
)?.style || {};

// Applied with fallback to footerRow.style for backwards compatibility
style={{
  textAlign: (footerLabelStyle.textAlign as React.CSSProperties['textAlign']) 
    || (footerRow.style?.textAlign as React.CSSProperties['textAlign']) 
    || 'left',
  // ... similar for other styles
}}
```

---

### 4. Column-Based Editing ("Apply to Column") ✅

**Location**: `client/src/components/Canvas.tsx` (lines ~2390-2406)

**Implementation**:
Added "Apply to Column" submenu to data cell context menus with two operations:

#### 4.1 Apply Content to Column
**Handler**:
```typescript
const handleApplyCellToColumn = (
  elementId: string, 
  sourceRow: number, 
  col: number
) => {
  const sourceCellData = currentInlineData.find(
    (cell) => cell.row === sourceRow && cell.col === col
  );
  
  if (!sourceCellData) return;
  
  // Apply to all rows in the column (0, 1, 2)
  for (let row = 0; row < INVOICE_TABLE_EDITOR_DATA_ROWS; row++) {
    if (row === sourceRow) continue; // Skip source row
    
    updatedInlineData.push({ 
      row, 
      col, 
      content: sourceCellData.content 
    });
  }
}
```

**What it does**:
- Copies the inline edited content from the source cell
- Applies it to all other rows in the same column
- Skips header and footer (only operates on data rows)
- Updates `config.inlineData` array

#### 4.2 Apply Style to Column
**Handler**:
```typescript
const handleApplyCellStyleToColumn = (
  elementId: string, 
  sourceRow: number, 
  col: number
) => {
  const sourceCellStyle = cellStyles.find(
    c => c.row === sourceRow && c.col === col
  );
  
  if (!sourceCellStyle || !sourceCellStyle.style) return;
  
  // Apply to all rows in the column (0, 1, 2)
  for (let row = 0; row < INVOICE_TABLE_EDITOR_DATA_ROWS; row++) {
    if (row === sourceRow) continue;
    
    updatedCellStyles.push({
      row,
      col,
      style: { ...sourceCellStyle.style }
    });
  }
}
```

**What it does**:
- Copies the style (textAlign, fontWeight, etc.) from the source cell
- Applies it to all other rows in the same column
- Skips header and footer (only operates on data rows)
- Updates `config.cellStyles` array

**Context Menu Structure**:
```typescript
<ContextMenuSub>
  <ContextMenuSubTrigger>
    <Columns className="w-4 h-4 mr-2" />
    Apply to Column
  </ContextMenuSubTrigger>
  <ContextMenuSubContent>
    <ContextMenuItem onClick={() => handleApplyCellToColumn(el.id, rowIdx, colIdx)}>
      <Copy className="w-4 h-4 mr-2" />
      Apply Content
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleApplyCellStyleToColumn(el.id, rowIdx, colIdx)}>
      <Palette className="w-4 h-4 mr-2" />
      Apply Style
    </ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>
```

**Important Constants**:
```typescript
const INVOICE_TABLE_EDITOR_DATA_ROWS = 3; // Fixed number of data rows in edit mode
```
This constant determines how many rows are shown in edit mode for invoice tables. Column operations iterate through these 3 rows only.

---

## Schema Changes

**File**: `shared/schema.ts`

**Added Properties** to `tableConfig`:

```typescript
tableConfig?: {
  // ... existing properties ...
  
  headerStyles?: {
    col: number;
    style?: Record<string, string | number>;
  }[];
  
  footerStyles?: {
    row: number;
    field: 'label' | 'value';
    style?: Record<string, string | number>;
  }[];
}
```

These new properties follow the same pattern as existing `cellStyles`, ensuring consistency across the schema.

---

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `client/src/components/Canvas.tsx` | +420, -84 | Main implementation file with all handlers and UI |
| `shared/schema.ts` | +9 | Schema updates for headerStyles and footerStyles |

**Total**: 429 insertions, 84 deletions

---

## Testing & Quality Assurance

### Code Review
✅ **Passed** - All identified issues were addressed:
- Fixed footer label style retrieval to use `footerStyles` array
- Fixed toggle logic to check only the relevant style source
- Ensured stopPropagation is used appropriately

### Security Check (CodeQL)
✅ **Passed** - No security vulnerabilities detected
- 0 alerts found in JavaScript analysis
- All user inputs are properly handled
- No SQL injection risks (uses parameterized queries elsewhere)
- No XSS vulnerabilities (React handles escaping)

### Manual Testing
⚠️ **Limited** - Could not fully test due to database requirements
- Application requires PostgreSQL database connection
- Dev server cannot start without database
- Code review and static analysis performed instead
- All patterns follow existing codebase conventions

---

## Usage Guide

### For End Users

#### Using DEL/Delete in Cells
1. Click on a cell in the invoice table (header, data, or footer)
2. Press DEL or Backspace to delete content
3. The table itself will not be deleted (only cell content)

#### Using Header Context Menu
1. Right-click on a header cell
2. Choose from:
   - **Text Align** → Select alignment
   - **Text Style** → Toggle bold, italic, or underline

#### Using Footer Label Context Menu
1. Right-click on a footer label cell
2. Choose from:
   - **Text Align** → Select alignment
   - **Text Style** → Toggle bold, italic, or underline

#### Using Column-Based Editing
1. Edit a cell in the data row area
2. Right-click on the same cell
3. Choose **Apply to Column** → **Apply Content** or **Apply Style**
4. The content or style will be copied to all other rows in that column

### For Developers

#### Adding New Style Properties
To add a new style property (e.g., fontSize):

1. Update the handlers:
```typescript
handleInvoiceTableHeaderStyleUpdate(elementId, col, 'fontSize', '16px')
```

2. Add to context menu:
```typescript
<ContextMenuItem onClick={() => 
  handleInvoiceTableHeaderStyleUpdate(el.id, colIdx, 'fontSize', '16px')
}>
  16px Font
</ContextMenuItem>
```

3. Apply in style:
```typescript
style={{
  fontSize: headerStyle.fontSize || '14px',
  // ... other styles
}}
```

#### Important Constants

```typescript
// Number of data rows shown in edit mode for invoice tables
const INVOICE_TABLE_EDITOR_DATA_ROWS = 3;

// Visual feedback colors for cell editing
const CELL_EDIT_OUTLINE_COLOR = '#3b82f6'; // Blue-500
const CELL_EDIT_BACKGROUND_COLOR = '#eff6ff'; // Blue-50
```

---

## Architecture Notes

### Style Precedence
The style application follows a fallback chain for backwards compatibility:

1. **Primary Source**: `headerStyles`, `footerStyles`, `cellStyles`
2. **Fallback Source** (footer only): `footerRow.style`
3. **Default**: Hard-coded defaults (e.g., 'bold' for headers)

This ensures:
- New styles from context menus are applied
- Old styles from footerRow.style still work
- Sensible defaults for unstyled cells

### Data Flow

#### Style Update Flow:
```
User clicks context menu
    ↓
handleInvoiceTableHeaderStyleUpdate/FooterStyleUpdate
    ↓
Update config.headerStyles/footerStyles array
    ↓
onElementUpdate(elementId, { tableConfig: { ...newStyles }})
    ↓
Canvas re-renders with new styles
    ↓
Styles applied to cell via inline style attribute
```

#### Column Operation Flow:
```
User clicks "Apply Content/Style"
    ↓
handleApplyCellToColumn/StyleToColumn
    ↓
Find source cell in inlineData/cellStyles
    ↓
Iterate through INVOICE_TABLE_EDITOR_DATA_ROWS (3 rows)
    ↓
Copy content/style to each row (excluding source row)
    ↓
Update config.inlineData/cellStyles array
    ↓
onElementUpdate(elementId, { tableConfig: { ...newData }})
    ↓
Canvas re-renders with updated column data/styles
```

---

## Future Enhancements

Potential improvements for future iterations:

1. **Footer Value Context Menu**: Add the same context menu to footer value cells (currently only footer labels have it)

2. **Column-wide Style Application**: Add a "Format Column" option to apply styles to the entire column including header

3. **Keyboard Shortcuts**: Add keyboard shortcuts for common operations:
   - Ctrl+B for bold
   - Ctrl+I for italic
   - Ctrl+Shift+C for apply to column

4. **Undo/Redo**: Enhance undo/redo to work specifically for cell-level edits

5. **Cell Selection Indicator**: Add visual feedback showing which cell is currently selected for operations

6. **Multi-cell Selection**: Allow selecting multiple cells and applying operations to all at once

---

## Known Limitations

1. **Edit Mode Only**: Column operations only work on the 3 data rows shown in edit mode, not on all rows in preview mode with actual data

2. **No Footer Value Context Menu**: Only footer label cells have context menus, footer value cells only have data binding context menu

3. **Fixed Row Count**: Column operations assume INVOICE_TABLE_EDITOR_DATA_ROWS = 3, changing this constant would require testing

4. **Style Conflicts**: If both footerRow.style and footerStyles have values, footerStyles takes precedence but this could cause confusion

---

## Troubleshooting

### Issue: Delete key deletes the table instead of cell content
**Solution**: Make sure you've clicked inside the cell to focus it. The cell should show a blue outline when focused.

### Issue: Context menu doesn't appear
**Solution**: 
- Ensure you're not in Preview mode (toggle the Preview button)
- Right-click directly on the cell, not outside it
- Check that the contentEditable attribute is enabled

### Issue: Apply to Column doesn't work
**Solution**:
- Make sure you've edited the cell content first
- The source cell must have inline data or styles to copy
- Only works in edit mode, not preview mode

### Issue: Styles not showing after applying
**Solution**:
- Check the browser console for errors
- Verify the style is valid CSS (e.g., 'bold' not 'Bold')
- Try refreshing the page to reload the template

---

## Commit History

| Commit | Description |
|--------|-------------|
| d47e9b4 | Add DEL/Delete key support and context menus for headers and footer labels |
| 26de0b9 | Add column-based editing feature for invoice tables |
| dfdac51 | Fix footer label styles to use footerStyles array from config |
| 47f5e44 | Fix footer label style toggle logic to only check footerLabelStyle |

---

## Related Documentation

- [INVOICE_TABLE_CONTEXT_MENU_CHANGES.md](./INVOICE_TABLE_CONTEXT_MENU_CHANGES.md) - Previous context menu implementation
- [INVOICE_TABLE_BINDING_ENHANCEMENT.md](./INVOICE_TABLE_BINDING_ENHANCEMENT.md) - Data binding features
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration guide
- [README.md](./README.md) - Main project documentation

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 2026-02-07  
**Implementation Version**: v1.0  
**Author**: GitHub Copilot Agent
