# GridTable Component Implementation

## Overview

This document describes the implementation of the new GridTable component and keyboard shortcuts for the Invoice Designer Engine.

## Features Implemented

### 1. GridTable Component

A new Google Docs-style table component with the following features:

#### Cell Merging and Splitting
- Support for `rowSpan` and `colSpan` properties on individual cells
- Cells can be merged both horizontally and vertically
- The rendering logic automatically handles occupied cells to prevent overlaps

#### Content Types
- **Hard Text**: Static text content directly in cells
- **Data Binding**: Dynamic content from JSON data using binding expressions
  - Example: `{{invoice.date}}` or binding property: `invoice.date`
- **Mixed Content**: Text with embedded bindings (e.g., "Total: {{total}}")

#### Visual Controls
- **Border Color Selector**: Inline color picker (appears when table is selected)
- **Border Width Selector**: Inline number input for border thickness (0-10px)
- Both controls appear in a floating toolbar below the selected table

### 2. Price Table Renaming

The existing "table" component button is now labeled "Price Table" to distinguish it from the new GridTable.

### 3. Keyboard Shortcuts

Global keyboard shortcuts for element manipulation:

- **Ctrl+C / Cmd+C**: Clone (duplicate) the selected element
  - Creates an exact copy with a new ID
  - Positioned with a 20px offset from the original
  - Works with all element types including GridTable and Price Table
  
- **Delete / Backspace**: Delete the selected element
  - Removes the element from the canvas
  - Deselects any selected element

**Note**: Shortcuts are disabled when typing in input fields or textareas to prevent conflicts.

## Technical Implementation

### Schema Changes (`shared/schema.ts`)

```typescript
// Added new element type
export type ElementType = 'text' | 'image' | 'table' | 'gridtable' | 'box' | 'line' | 'qr' | 'signature' | 'badge';

// Added gridTableConfig to TemplateElement
export interface TemplateElement {
  // ... existing properties
  gridTableConfig?: {
    rows: number;
    cols: number;
    cells: {
      row: number;
      col: number;
      rowSpan?: number;
      colSpan?: number;
      content?: string;
      binding?: string;
    }[];
  };
  // ... rest of properties
}
```

### Editor Changes (`client/src/pages/Editor.tsx`)

1. **Import Grid Icon**:
   ```typescript
   import { Grid3x3 } from "lucide-react";
   ```

2. **Added GridTable Button**:
   ```tsx
   <Button variant="outline" onClick={() => handleAddElement('gridtable')}>
     <Grid3x3 className="w-6 h-6" />
     <span className="text-xs">Grid Table</span>
   </Button>
   ```

3. **Updated handleAddElement**:
   - Initializes a 3x3 grid by default
   - Creates all cells with default content and spans
   - Sets default border color and width

4. **Added Keyboard Event Handler**:
   ```typescript
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       // Skip if typing in input fields
       if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
         return;
       }

       // Ctrl+C / Cmd+C - Clone element
       if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementId) {
         e.preventDefault();
         handleCloneElement(selectedElementId);
       }
       
       // Delete / Backspace - Delete element
       if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
         e.preventDefault();
         handleDeleteElement(selectedElementId);
       }
     };

     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [selectedElementId]);
   ```

### Canvas Rendering (`client/src/components/Canvas.tsx`)

#### GridTable Rendering Logic

```typescript
if (el.type === 'gridtable') {
  const config = el.gridTableConfig;
  
  // Create a map of cells for efficient lookup
  const cellMap = new Map<string, typeof config.cells[0]>();
  const occupiedCells = new Set<string>();
  
  // Mark cells occupied by spans
  config.cells.forEach(cell => {
    const key = `${cell.row}-${cell.col}`;
    cellMap.set(key, cell);
    
    for (let r = cell.row; r < cell.row + (cell.rowSpan || 1); r++) {
      for (let c = cell.col; c < cell.col + (cell.colSpan || 1); c++) {
        if (r !== cell.row || c !== cell.col) {
          occupiedCells.add(`${r}-${c}`);
        }
      }
    }
  });
  
  // Render table with proper spans
  return (
    <table className="w-full h-full">
      <tbody>
        {Array.from({ length: config.rows }, (_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: config.cols }, (_, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              
              // Skip occupied cells
              if (occupiedCells.has(key)) return null;
              
              const cell = cellMap.get(key);
              const rowSpan = cell?.rowSpan || 1;
              const colSpan = cell?.colSpan || 1;
              
              let content = cell?.content || '';
              
              // Handle data binding
              if (isPreviewMode && cell?.binding) {
                content = getValue(sampleData, cell.binding, `{{${cell.binding}}}`);
              }
              
              // Process embedded bindings
              if (isPreviewMode && typeof content === 'string') {
                content = content.replace(/\{\{([^}]+)\}\}/g, (match, binding) => {
                  return getValue(sampleData, binding.trim(), match);
                });
              }
              
              return (
                <td 
                  key={colIdx}
                  rowSpan={rowSpan}
                  colSpan={colSpan}
                  className="p-2 border"
                  style={{ 
                    borderColor: gridBorderColor,
                    borderWidth: `${gridBorderWidth}px`,
                  }}
                >
                  {content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### Inline Controls for GridTable

Added inline controls (similar to Price Table) that appear when a gridtable is selected:
- Color picker for border color
- Number input for border width (0-10px)
- Clone button for quick duplication

### Properties Panel (`client/src/components/ElementProperties.tsx`)

#### GridTable Properties

1. **Border Styling**:
   - Color picker with hex input
   - Border thickness slider (0-10px)

2. **Grid Dimensions**:
   - Rows input (1-20)
   - Columns input (1-20)
   - Automatically adds/removes cells when dimensions change

3. **Cell Editor**:
   - Scrollable list of all cells
   - For each cell:
     - Content input (hard text)
     - Binding input (data binding expression)
     - Row span input (for vertical merging)
     - Col span input (for horizontal merging)
   - Cells sorted by row, then column for easy navigation

## Usage Examples

### Example 1: Simple Contact Table

```typescript
{
  type: 'gridtable',
  gridTableConfig: {
    rows: 3,
    cols: 2,
    cells: [
      { row: 0, col: 0, content: 'Name:', rowSpan: 1, colSpan: 1 },
      { row: 0, col: 1, binding: 'contact.name', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 0, content: 'Email:', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 1, binding: 'contact.email', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 0, content: 'Phone:', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 1, binding: 'contact.phone', rowSpan: 1, colSpan: 1 }
    ]
  },
  style: { gridBorderColor: '#000000', gridBorderWidth: 1 }
}
```

### Example 2: Merged Header Table

```typescript
{
  type: 'gridtable',
  gridTableConfig: {
    rows: 3,
    cols: 4,
    cells: [
      // Header spanning all columns
      { row: 0, col: 0, content: 'Invoice Summary', rowSpan: 1, colSpan: 4 },
      // Data rows
      { row: 1, col: 0, content: 'Item', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 1, content: 'Quantity', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 2, content: 'Price', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 3, content: 'Total', rowSpan: 1, colSpan: 1 },
      // Data with bindings
      { row: 2, col: 0, binding: 'item.name', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 1, binding: 'item.qty', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 2, binding: 'item.price', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 3, binding: 'item.total', rowSpan: 1, colSpan: 1 }
    ]
  },
  style: { gridBorderColor: '#0ea5e9', gridBorderWidth: 2 }
}
```

### Example 3: Mixed Content

```typescript
{
  type: 'gridtable',
  gridTableConfig: {
    rows: 2,
    cols: 1,
    cells: [
      { row: 0, col: 0, content: 'Invoice #{{invoice.number}}', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 0, content: 'Date: {{invoice.date}}', rowSpan: 1, colSpan: 1 }
    ]
  },
  style: { gridBorderColor: '#22c55e', gridBorderWidth: 1 }
}
```

## Differences: GridTable vs Price Table

| Feature | GridTable | Price Table |
|---------|-----------|-------------|
| Purpose | Google Docs-style table with custom layout | Display object data as key-value pairs |
| Data Source | Individual cell bindings | Array data source with columns |
| Cell Merging | ✅ Full support via rowSpan/colSpan | ❌ Not supported |
| Hard Text | ✅ Each cell can have static text | ❌ Only headers have static text |
| Layout | Fully customizable | Fixed two-column layout |
| Best For | Custom layouts, forms, summaries | Line items, data lists |

## Testing Checklist

- [x] GridTable button appears in component sidebar
- [x] Clicking GridTable button creates a 3x3 table
- [x] Table has default border color and width
- [x] Inline controls appear when table is selected
- [x] Border color can be changed via inline picker
- [x] Border width can be changed via inline input
- [x] Properties panel shows GridTable-specific options
- [x] Grid dimensions can be changed
- [x] Cell content can be edited
- [x] Cell bindings work in preview mode
- [x] rowSpan and colSpan work correctly
- [x] Ctrl+C duplicates the selected element
- [x] Delete key removes the selected element
- [x] Keyboard shortcuts don't interfere with typing
- [x] Price Table button shows correct label

## Future Enhancements

Potential improvements for future versions:

1. **Visual Cell Editing**: Click directly on cells to edit content
2. **Context Menu**: Right-click to merge/split cells
3. **Cell Styling**: Individual cell background colors and text formatting
4. **Drag-to-Merge**: Select multiple cells and merge them visually
5. **Table Templates**: Pre-defined layouts for common use cases
6. **Auto-sizing**: Automatically adjust cell sizes based on content
7. **Accessibility**: Keyboard navigation between cells
8. **Copy/Paste**: Copy cell content between cells

## Backward Compatibility

All changes are additive and fully backward compatible:

- Existing Price Table (type: 'table') elements continue to work
- New GridTable (type: 'gridtable') is a separate element type
- Keyboard shortcuts only affect elements when selected
- No database migrations required
