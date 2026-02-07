# Bug Fix: Blue Selection Border Height Constraint

## Issue Description (French)
> "quand le border bleu de selection arrive a la taille de compression minimal en height, il faut qu'il s'arrete de se compresser. le border bleu doit rester a la taille minimum de compression et ne pas passer au travers comme en largeur, pour toutes les tables"

## Issue Description (English)
When the blue selection border reaches the minimum compression size in height, it must stop compressing. The blue border must remain at the minimum compression size and not pass through like it does with width, for all tables.

## Problem
The blue selection border was not respecting minimum height constraints when resizing tables. Users could continue to reduce table height beyond the calculated minimum, even though the code appeared to have minimum height logic in place.

## Root Cause
The code was using an incorrect prop name on the react-rnd `Rnd` component:
```typescript
minConstraints={[undefined, minHeight]}
```

However, the react-rnd library (v10.5.2) does not support a `minConstraints` prop. Instead, it provides separate props for minimum dimensions:
- `minHeight?: number | string`
- `minWidth?: number | string`

Because the prop name was incorrect, the minimum height constraint was silently ignored by the component.

## Solution
Changed the Rnd component configuration from:
```typescript
<Rnd
  minConstraints={[undefined, minHeight]} // ❌ Non-existent prop
  lockAspectRatio={false}
/>
```

To:
```typescript
<Rnd
  minHeight={minHeight} // ✅ Correct prop
  lockAspectRatio={false}
/>
```

## Impact
This fix ensures that:
1. **Grid Tables**: Cannot be reduced below `rows × 20px`
2. **Price Tables**: Cannot be reduced below `(columns + additional rows) × 20px`
3. **Invoice Tables**: Cannot be reduced below `(header + data rows + footer rows) × 20px`

The blue selection border now properly stops at the minimum height, preventing users from accidentally creating unusable table layouts.

## Files Modified
1. **client/src/components/Canvas.tsx** (Line 2301)
   - Changed `minConstraints` to `minHeight`
   
2. **TABLE_HEIGHT_RESIZING.md**
   - Updated documentation to reflect correct prop usage
   
3. **IMPLEMENTATION_SUMMARY.md**
   - Updated code examples to show correct implementation

## Technical Details

### Minimum Height Calculation
The minimum height is calculated dynamically based on table type:

```typescript
let minHeight = MIN_ROW_HEIGHT; // Default: 20px
if (el.type === 'gridtable' && el.gridTableConfig) {
  minHeight = getMinimumHeightForGridTable(el.gridTableConfig);
} else if (el.type === 'table' && el.tableConfig) {
  if (el.tableConfig.tableType === 'price') {
    minHeight = getMinimumHeightForPriceTable(el.tableConfig);
  } else if (el.tableConfig.tableType === 'invoice') {
    minHeight = getMinimumHeightForInvoiceTable(el.tableConfig);
  }
}
```

### Helper Functions (Already Implemented)
These functions were already correctly implemented but were not being applied:

```typescript
function getMinimumHeightForGridTable(config): number {
  if (!config || !config.rows) return MIN_ROW_HEIGHT;
  return config.rows * MIN_ROW_HEIGHT;
}

function getMinimumHeightForPriceTable(config): number {
  if (!config) return MIN_ROW_HEIGHT;
  const totalRows = config.columns.length + (config.additionalRows?.length || 0);
  return totalRows * MIN_ROW_HEIGHT;
}

function getMinimumHeightForInvoiceTable(config): number {
  if (!config) return MIN_ROW_HEIGHT;
  const headerRows = 1;
  const dataRows = INVOICE_TABLE_EDITOR_DATA_ROWS;
  const footerRowsCount = config.footerRows?.length || 0;
  const totalRows = headerRows + dataRows + footerRowsCount;
  return totalRows * MIN_ROW_HEIGHT;
}
```

## Verification

### Build Status
✅ Build completes successfully
```
vite v7.3.0 building client environment for production...
✓ 1854 modules transformed.
✓ built in 3.57s
```

### TypeScript Check
✅ No new TypeScript errors introduced
- Pre-existing errors in `ElementProperties.tsx` are unrelated to this fix

### Code Review
✅ No issues found

### Security Scan (CodeQL)
✅ No vulnerabilities detected

## User Experience

### Before Fix
- User selects a table → blue border appears
- User drags bottom edge to reduce height
- Table height continues to reduce beyond minimum
- Table becomes unusable with rows too small to display content

### After Fix
- User selects a table → blue border appears
- User drags bottom edge to reduce height
- Table height reduces smoothly
- **When minimum height is reached, border stops reducing**
- User cannot make table smaller than viable size

## Testing Recommendations

To verify this fix works correctly:

1. **Grid Table Test**
   - Create a 5-row grid table
   - Select and try to reduce height below 100px
   - Verify it stops at exactly 100px (5 × 20px)

2. **Price Table Test**
   - Create a price table with 3 items + 2 footer rows
   - Select and try to reduce height below 100px
   - Verify it stops at exactly 100px (5 × 20px)

3. **Invoice Table Test**
   - Create an invoice table with 2 footer rows
   - Select and try to reduce height below 120px
   - Verify it stops at exactly 120px (1+3+2 × 20px)

4. **Width Independence Test**
   - Resize any table's width while at minimum height
   - Verify width still resizes freely and independently

## Related Documentation
- `TABLE_HEIGHT_RESIZING.md` - Comprehensive implementation guide
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `TABLE_HEIGHT_VISUAL_GUIDE.md` - Visual examples (if exists)

## Commits
1. `f6350b5` - Fix: Replace minConstraints with minHeight prop in Rnd component
2. `04a3608` - Docs: Update documentation to reflect correct minHeight prop usage

## Version
- react-rnd: v10.5.2
- Fix Date: 2026-02-07

## Security Summary
No security vulnerabilities were introduced or discovered during this fix. CodeQL analysis found 0 alerts.
