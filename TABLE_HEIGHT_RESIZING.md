# Table Height Resizing Implementation

## Overview
This document describes the implementation of minimum height constraints for table resizing in the Invoice Designer Engine. The feature ensures that when users resize tables (grid, price, invoice) using the blue selection border, the tables cannot be reduced below a minimum viable height.

## Problem Statement
Previously, while width resizing worked well with constraints, height resizing for tables had no minimum constraints. This could lead to:
- Tables being resized to unusable heights
- Rows becoming too small to display content
- Poor user experience when accidentally over-reducing table height

## Solution
The solution implements minimum height constraints based on the number of rows in each table type, multiplied by the `MIN_ROW_HEIGHT` constant (20 pixels).

## Implementation Details

### 1. Helper Functions
Three new helper functions calculate the minimum height for each table type:

#### Grid Table
```typescript
function getMinimumHeightForGridTable(config: any): number {
  if (!config || !config.rows) return MIN_ROW_HEIGHT;
  return config.rows * MIN_ROW_HEIGHT;
}
```
- Calculates: `number of rows × MIN_ROW_HEIGHT`
- Example: A 5-row grid table has a minimum height of 50px (5 × 10px)

#### Price Table
```typescript
function getMinimumHeightForPriceTable(config: any): number {
  if (!config) return MIN_ROW_HEIGHT;
  const totalRows = config.columns.length + (config.additionalRows?.length || 0);
  return totalRows * MIN_ROW_HEIGHT;
}
```
- Calculates: `(columns + additional rows) × MIN_ROW_HEIGHT`
- Columns in price tables become rows in the display
- Example: A price table with 3 columns and 2 additional rows has a minimum height of 50px (5 × 10px)

#### Invoice Table
```typescript
function getMinimumHeightForInvoiceTable(config: any): number {
  if (!config) return MIN_ROW_HEIGHT;
  const headerRows = 1;
  const dataRows = INVOICE_TABLE_EDITOR_DATA_ROWS;
  const footerRowsCount = config.footerRows?.length || 0;
  const totalRows = headerRows + dataRows + footerRowsCount;
  return totalRows * MIN_ROW_HEIGHT;
}
```
- Calculates: `(header + data rows + footer rows) × MIN_ROW_HEIGHT`
- Uses `INVOICE_TABLE_EDITOR_DATA_ROWS` constant (3 rows) for sample data display
- Example: An invoice table with 1 header, 3 data rows, and 2 footer rows has a minimum height of 60px (6 × 10px)

### 2. Rnd Component Configuration
The `minHeight` prop is applied to the react-rnd `Rnd` component:

```typescript
{layout.elements.map((el) => {
  const isSelected = selectedElementIds.includes(el.id);
  
  // Calculate minimum height based on element type
  let minHeight = MIN_ROW_HEIGHT; // Default minimum height
  if (el.type === 'gridtable' && el.gridTableConfig) {
    minHeight = getMinimumHeightForGridTable(el.gridTableConfig);
  } else if (el.type === 'table' && el.tableConfig) {
    if (el.tableConfig.tableType === 'price') {
      minHeight = getMinimumHeightForPriceTable(el.tableConfig);
    } else if (el.tableConfig.tableType === 'invoice') {
      minHeight = getMinimumHeightForInvoiceTable(el.tableConfig);
    }
  }

  return (
    <Rnd
      key={el.id}
      size={{ width: el.width, height: el.height }}
      position={{ x: el.x, y: el.y }}
      dragGrid={[GRID_SIZE, GRID_SIZE]}
      resizeGrid={[GRID_SIZE, GRID_SIZE]}
      minHeight={minHeight}  // FIXED: Enforces minimum height constraint during resize
      lockAspectRatio={false}  // FIXED: Allows independent height resizing
      // ... other props
    />
  );
})}
```

### 3. Key Changes

#### Fixed: Minimum Height Constraints
- `minHeight={minHeight}` - Uses the proper react-rnd API prop name
- Previously used invalid `minConstraints` prop which was not recognized by react-rnd
- The `minHeight` prop properly enforces the calculated minimum height during resize operations
- This prevents the blue border from "passing through" when reaching minimum height

#### Fixed: Aspect Ratio Locking
- Changed `lockAspectRatio={isSelected}` to `lockAspectRatio={false}`
- Previous implementation locked aspect ratio when element was selected, preventing independent height resizing
- New implementation allows independent width and height resizing

## Bug Fix: Correct minHeight Implementation

### Problem
The initial implementation used `minConstraints={[undefined, minHeight]}` which is not a valid react-rnd prop. This caused the minimum height constraint to be completely ignored, allowing the blue selection border to "pass through" or compress beyond the minimum viable size.

### Solution
Changed to use the proper `minHeight={minHeight}` prop, which is the correct react-rnd API for enforcing minimum height constraints during resize operations.

## User Experience

### Before
- Tables could be resized to extremely small heights
- No feedback when minimum viable size was reached
- Risk of creating unusable table layouts

### After
- Tables can be resized in height independently from width
- Blue selection border resize handles stop reducing height when minimum is reached
- Minimum height is calculated based on table content (number of rows)
- Each row is guaranteed at least 10 pixels of height (MIN_ROW_HEIGHT = 10px)
- Visual feedback: resize handles become unresponsive when minimum is reached

## Constants Used

```typescript
const MIN_ROW_HEIGHT = 10; // Minimum height for a row in pixels (reduced from 20px for maximum compression, aligns with GRID_SIZE)
const INVOICE_TABLE_EDITOR_DATA_ROWS = 3; // Fixed number of sample data rows displayed in editor
```

## Benefits

1. **Prevents User Errors**: Users cannot accidentally make tables too small to be usable
2. **Content Protection**: Ensures all table content remains visible and readable
3. **Consistent Behavior**: Height resizing now has the same constraint behavior as width resizing
4. **Intuitive Feedback**: The blue border naturally stops reducing, signaling the minimum has been reached
5. **Flexible by Content**: Minimum height adapts to the actual number of rows in each table

## Technical Notes

- The implementation uses the react-rnd library's built-in `minHeight` prop (not `minConstraints`)
- Calculations are performed dynamically for each element during rendering
- Non-table elements (text, images, etc.) default to `MIN_ROW_HEIGHT` as minimum
- The grid snapping (`resizeGrid`) still applies, ensuring heights snap to 10px intervals

## Future Enhancements

Potential improvements for future iterations:
- Add maximum height constraints if needed
- Make `MIN_ROW_HEIGHT` configurable per template
- Add visual indicators showing the minimum height limit
- Implement column-level minimum width constraints for tables

## Testing Recommendations

To verify the implementation:
1. Create a grid table with multiple rows
2. Select the table (blue border appears)
3. Try to resize the table height by dragging the bottom edge
4. Verify that the table cannot be reduced below `rows × 10px`
5. Repeat for price tables and invoice tables
6. Verify that width resizing still works independently

## References

- react-rnd documentation: https://github.com/bokuweb/react-rnd
- Problem statement: See GitHub issue for original requirement (in French)
- Related constants: See Canvas.tsx lines 135-150
