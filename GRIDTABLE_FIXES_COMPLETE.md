# GridTable Fixes - Implementation Complete

## Summary

This PR implements three critical fixes for the GridTable component as requested:

### Issue 1: Scale Default Value ✅
**Problem**: The editor scale was defaulting to 0.8 (80%), making the initial view smaller than expected.

**Solution**: Changed the default scale from 0.8 to 1.0 (100%) in `Editor.tsx` line 300.

```typescript
// Before
const [scale, setScale] = useState(0.8);

// After  
const [scale, setScale] = useState(1);
```

### Issue 2: Icon Persistence on Selected Row ✅
**Problem**: The delete row icon was disappearing when the mouse left a row, even if that row should remain selected.

**Solution**: 
1. Added a new `selectedRow` state separate from `hoveredRow`
2. Added `onClick` handler to rows to set the selected row
3. Updated delete button visibility logic to show on either `selectedRow` OR `hoveredRow` (with hover taking priority)
4. Clear `selectedRow` when clicking outside the gridtable

**Changes in `Canvas.tsx`**:
- Line 70: Added `const [selectedRow, setSelectedRow] = useState<...>(null);`
- Lines 822-828: Added `onClick` to row to set selected row
- Lines 1031-1084: Updated delete button logic to use `displayRow = hoveredRow || selectedRow`
- Line 1158: Clear selectedRow when clicking canvas background

**Behavior**:
- Hovering over a row shows the delete icon temporarily
- Clicking a row selects it and keeps the icon visible
- The icon remains on the selected row even after the mouse leaves
- Hovering another row temporarily shows icon on that row
- Clicking outside the gridtable clears the selection

### Issue 3: Doubled Borders on Merged Cells ✅
**Problem**: When cells were merged using `rowSpan` or `colSpan`, borders appeared doubled/thicker than normal cells.

**Solution**: Removed the duplicate border styling by removing the `"border"` Tailwind class while keeping the inline border styles.

**Changes in `Canvas.tsx`**:
- Line 894: Removed `"border"` from className
- Line 900: Added explicit `borderStyle: 'solid'` to inline styles

```typescript
// Before
className="p-2 border"
style={{ 
  borderColor: gridBorderColor,
  borderWidth: `${gridBorderWidth}px`,
  ...getCellStyle(cell)
}}

// After
className="p-2"
style={{ 
  borderColor: gridBorderColor,
  borderWidth: `${gridBorderWidth}px`,
  borderStyle: 'solid',
  ...getCellStyle(cell)
}}
```

The table already uses `border-collapse` which handles merged cell borders correctly, but the dual styling (both class and inline) was causing visual artifacts.

## Files Modified

1. **client/src/pages/Editor.tsx**
   - Changed scale default from 0.8 to 1.0

2. **client/src/components/Canvas.tsx**
   - Added selectedRow state
   - Updated row selection logic
   - Modified delete button visibility
   - Fixed doubled borders on merged cells

## Testing

- ✅ TypeScript compilation passes (`npm run check`)
- ✅ Build succeeds (`npm run build`)
- All changes are minimal and surgical
- No breaking changes to existing functionality

## Validation Required

To fully validate these changes, the following should be tested in a running application:

1. **Scale Test**: Open the editor and verify the initial zoom is at 100%
2. **Icon Persistence Test**: 
   - Add a gridtable with multiple rows
   - Click on a row - verify the delete icon appears
   - Move mouse away from the row - verify the icon stays visible
   - Click outside the gridtable - verify the icon disappears
3. **Merged Cell Border Test**:
   - Add a gridtable
   - Merge some cells (right-click > Merge Cell)
   - Verify the borders on merged cells are the same thickness as regular cells
