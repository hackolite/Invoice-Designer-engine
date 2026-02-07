# Invoice Table Context Menu Implementation

## Summary of Changes

This document describes the changes made to add right-click context menu functionality to invoice table cells, matching the features available in grid table cells.

## Problem Statement

Previously, invoice table cells in the editor lacked right-click context menu functionality that grid table cells already had, including:
- Text alignment options (Left, Center, Right, Justify)
- Text styling options (Bold, Italic, Underline)
- Data binding capabilities

## Solution

### 1. Schema Changes (`shared/schema.ts`)

Added a new `cellStyles` field to the `tableConfig` type to store cell-level styles for invoice tables:

```typescript
cellStyles?: { // For storing cell-level styles in invoice tables
  row: number;
  col: number;
  style?: Record<string, string | number>; // Support for cell-level styling
}[];
```

### 2. Canvas Component Changes (`client/src/components/Canvas.tsx`)

#### Added New Handler Functions:

1. **`handleInvoiceTableCellStyleUpdate`** (line 747)
   - Updates cell styles for invoice table cells
   - Creates or updates cell style entries in the `cellStyles` array
   - Similar to `handleCellStyleUpdate` for grid tables

2. **`getInvoiceTableCellStyle`** (line 336)
   - Helper function to retrieve cell styles for invoice table cells
   - Returns style object with defaults for text alignment, font weight, style, decoration, size, and color

3. **`handleInvoiceTableCellBindingUpdate`** (line 581)
   - Updates data binding for invoice table columns
   - Modifies the column configuration to set the binding path

4. **`renderDataTreeForInvoiceTable`** (line 686)
   - Renders data source tree in context menu for invoice table cells
   - Allows selecting data bindings from sample data hierarchy

#### Modified Invoice Table Cell Rendering:

Wrapped invoice table data cells (lines 1782-1900) with `<ContextMenu>` component, adding:

- **Text Align submenu**: Left, Center, Right, Justify options
- **Text Style submenu**: Bold, Italic, Underline toggle options
- **Bind Data submenu**: Dynamic data binding from sample data (when available)
- Applied cell styles to the `<td>` element via the `cellStyle` spread

## Features Added

### 1. Text Alignment
Users can now right-click on invoice table cells and select text alignment:
- Left
- Center  
- Right
- Justify

### 2. Text Styling
Users can toggle text styling options:
- Bold (toggle on/off)
- Italic (toggle on/off)
- Underline (toggle on/off)

### 3. Data Binding
Users can bind invoice table cells to data sources:
- Shows hierarchical data tree in submenu
- Updates column binding configuration
- Works consistently with existing invoice table data binding

## Technical Details

### Cell Style Storage
- Cell styles are stored in `config.cellStyles` array
- Each entry contains row index, column index, and style object
- Styles are retrieved and applied during rendering
- Style updates are persisted through the element update handler

### Context Menu Integration
- Uses existing `@radix-ui/react-context-menu` components
- Consistent with grid table context menu implementation
- Only shown in edit mode (not preview mode)
- Properly handles event propagation with `stopPropagation()`

### Data Binding
- Column-level binding (not individual cell binding)
- Updates the column configuration in `tableConfig.columns`
- Uses hierarchical data tree navigation
- Consistent with existing invoice table binding behavior

## Testing Recommendations

1. **Basic Context Menu**
   - Right-click on invoice table data cells in edit mode
   - Verify context menu appears with all three sections

2. **Text Alignment**
   - Apply different alignments to cells
   - Verify visual alignment changes
   - Check that styles persist after refresh

3. **Text Styling**
   - Toggle bold, italic, and underline
   - Verify visual styling changes
   - Check toggle state indicators (e.g., "Bold" vs "Remove Bold")

4. **Data Binding**
   - Right-click cells with sample data loaded
   - Navigate data tree and select binding
   - Verify column binding updates
   - Check preview mode shows bound data correctly

5. **Regression Testing**
   - Verify grid table context menus still work
   - Verify price table functionality unchanged
   - Check that preview mode doesn't show context menus
   - Ensure existing invoice table features work (content editing, etc.)

## Comparison with Grid Tables

The invoice table context menu now matches grid table functionality with these differences:
- **Grid tables**: Have merge/subdivide cell options (invoice tables don't need these)
- **Grid tables**: Cell-level data binding (invoice tables use column-level binding)
- **Invoice tables**: Use contentEditable for inline editing (grid tables use double-click editor)

## Files Modified

1. `shared/schema.ts` - Added `cellStyles` field to table configuration
2. `client/src/components/Canvas.tsx` - Added handlers and context menu rendering
