# Table Fusion Positioning Fix

## Problem Statement

Si pricestable est moins height lors de la generation que sur le template, il faut que le gridtable qui lui est fusionné suive. En fait en mode fusion, le gridtable sous pricetable doit toujours être en dessous quand fusionné.

Translation:
"If pricetable is less height during generation than on the template, the gridtable merged with it must follow. In fact, in fusion mode, the gridtable under pricetable must always be below when merged."

## Solution

When a price table's height changes (either through manual resizing or row height adjustments), any gridtable that is vertically fused directly below it will now automatically adjust its Y position to remain directly beneath the price table, maintaining the fusion.

## Implementation Details

### New Function: `adjustVerticallyFusedTables()`

Location: `client/src/components/Canvas.tsx` (lines 793-828)

This function:
1. Detects if the changed element is a table (gridtable or price table)
2. Calculates the height delta (change in height)
3. Searches for other tables that are vertically fused below the changed table
4. Automatically updates the Y position of fused tables to maintain fusion

**Detection criteria for vertical fusion:**
- Tables must have full horizontal alignment (same X position and width, within tolerance)
- The bottom edge of the changed table must touch the top edge of the other table (within tolerance)
- Uses `isFullyAligned()` helper with `ALIGNMENT_TOLERANCE` of 1.5px

### Integration Points

#### 1. On Price Table Resize (`onResizeStop`)

Location: `client/src/components/Canvas.tsx` (lines 1981-1986)

When a price table is resized:
```typescript
// Adjust any tables that are vertically fused below this price table
adjustVerticallyFusedTables(
  { ...el, width: newWidth, height: newHeight, x: newX, y: newY },
  oldHeight,
  newHeight
);
```

#### 2. On Price Table Row Height Change (`handlePriceTableRowHeightResize`)

Location: `client/src/components/Canvas.tsx` (lines 637-641)

When individual row heights in a price table are adjusted:
```typescript
// Adjust any tables that are vertically fused below this price table
adjustVerticallyFusedTables(
  { ...element, height: newTotalHeight },
  oldHeight,
  newTotalHeight
);
```

## Testing Instructions

### Manual Test Scenario

1. **Setup:**
   - Start the application with `npm run dev`
   - Open the invoice designer
   - Create a new template or open an existing one

2. **Create Fused Tables:**
   - Add a price table to the canvas
   - Add a gridtable to the canvas
   - Position the gridtable directly below the price table until they snap together (fusion snapping at 15px threshold)
   - Verify that the tables are fused (borders should merge cleanly)

3. **Test Height Resize:**
   - Select the price table
   - Drag the bottom resize handle to make it taller or shorter
   - **Expected Result:** The gridtable below should automatically move to stay directly beneath the price table
   - **Verify:** The fusion is maintained (no gap between tables, borders still merged)

4. **Test Row Height Adjustment:**
   - Select the price table
   - Hover over the border between two rows to see the row resize handle
   - Drag the row border up or down to adjust row height
   - **Expected Result:** The gridtable below should automatically move to accommodate the new total height
   - **Verify:** The fusion is maintained

5. **Test Edge Cases:**
   - Try with multiple gridtables stacked vertically
   - Try with gridtables that are NOT perfectly aligned (should not move)
   - Try with gridtables that are side-by-side (should not move)

### Expected Behavior

**Before Fix:**
- When resizing a price table, the gridtable below would stay in place
- A gap would appear between the tables, breaking the fusion
- Borders would no longer merge cleanly

**After Fix:**
- When resizing a price table, the gridtable below automatically moves
- The fusion is maintained at all times
- Borders continue to merge cleanly

## Technical Notes

### Constants Used
- `HEIGHT_NORMALIZATION_THRESHOLD`: 0.5px - Minimum height difference to trigger adjustment
- `ALIGNMENT_TOLERANCE`: 1.5px - Maximum position/size difference for fusion detection
- `FUSION_THRESHOLD`: 15px - Distance for initial fusion snapping during drag

### Performance Considerations
- The function has O(n) complexity where n is the number of table elements
- Only runs when a table's height actually changes
- Early returns prevent unnecessary calculations
- No performance impact for typical invoice layouts (< 20 tables)

### Compatibility
- ✅ Works with price tables (type: 'table', tableType: 'price')
- ✅ Works with gridtables (type: 'gridtable')
- ✅ Works with grid data tables (type: 'table', tableType: 'grid')
- ✅ Works with manual resizing
- ✅ Works with row height adjustments
- ✅ Compatible with existing border merging logic
- ✅ Compatible with table footers

## Future Enhancements

Potential improvements:
- Extend to support cascade adjustments (table A moves, table B below it moves, table C below B moves, etc.)
- Add support for horizontal fusion adjustments when table width changes
- Add visual feedback when fusion adjustment occurs
- Support for undo/redo with fusion adjustments

## Related Files

- `client/src/components/Canvas.tsx` - Main implementation
- `TABLE_FUSION_BORDER_FIX.md` - Documentation on border merging in fused tables
- `GRIDTABLE_QUICK_REFERENCE.md` - General gridtable documentation
