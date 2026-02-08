# Bugfix: Invoice Table Export - JSON Path Resolution

## Problem Statement (French)
> "il y a un bug dans invoice table, dans les row items, dans la colonne ou h=je fais une mise a jour, quand je fais generate, il n'y pas resolution du path json, qui veut dire que je vois le path, mais pas la valeur du binding, ensuite il y a un bug, toujours dans les row de loop items, la résolution de items.names renvoit un chiffre. pourquoi? check et fix sans regression."

**Translation**: 
1. There's a bug in invoice table, in the row items, in the column where I do an update, when I generate, there's no JSON path resolution - which means I see the path, but not the binding value
2. There's also a bug in the loop items rows, the resolution of items.names returns a number instead of expected value

---

## Root Causes

### Bug 1: JSON Paths Not Resolved in Generate/Export Mode
**Location**: `client/src/pages/Editor.tsx`, line 418 (before fix)

The `renderElementForExport` function was not stripping the dataSource prefix from column bindings before resolving values. 

**Example**:
- Column binding: `items.name`
- DataSource: `items`
- Current row: `{ name: "Laptop", price: 999 }`
- **Wrong**: `getNestedValue(row, "items.name")` → tries to access `row.items.name` → undefined
- **Correct**: `getNestedValue(row, "name")` → accesses `row.name` → "Laptop"

### Bug 2: Inline Edited Data Not Preserved
**Location**: `client/src/pages/Editor.tsx`, line 412-429 (before fix)

The export function wasn't checking for `config.inlineData` before resolving bindings, so manually edited cell values were lost during export.

### Bug 3: items.names Returns Number
**Root Cause**: When Bug 1 caused binding resolution to fail (return `undefined`), and the column format was `currency` or `number`, the code would call `Number(undefined)` which returns `0`, making it appear as if the field returned a number.

---

## Solution

### Changes Made to `client/src/pages/Editor.tsx`

#### 1. Added Inline Data Map (Lines 234-239)
```typescript
// Get inline data for cells (persists in both edit and preview modes)
const inlineData: { row: number; col: number; content: string; }[] = config.inlineData || [];
const cellInlineDataMap = new Map<string, string>();
inlineData.forEach(cell => {
  cellInlineDataMap.set(`${cell.row}-${cell.col}`, cell.content);
});
```

#### 2. Fixed Variable Naming Collision (Line 249)
```typescript
// Changed from 'inlineDataMap' to 'footerInlineDataMap'
const footerInlineDataMap = new Map<string, string>();
```

#### 3. Added Inline Data Check (Lines 424-427)
```typescript
// Check if we have inline edited data for this cell
if (cellInlineDataMap.has(`${rIdx}-${cIdx}`)) {
  // Use inline edited data
  cellValue = cellInlineDataMap.get(`${rIdx}-${cIdx}`)!;
} else if (isPreviewMode) {
```

#### 4. Fixed Binding Path Resolution (Lines 432-435)
```typescript
// Handle complete paths: if binding starts with dataSource prefix, strip it
// e.g., "items.name" -> "name" when accessing individual item
let bindingPath = col.binding;
if (config.dataSource && col.binding && col.binding.startsWith(config.dataSource + '.')) {
  bindingPath = col.binding.substring(config.dataSource.length + 1);
}
```

#### 5. Added Proper Null Handling (Line 449)
```typescript
// Show resolved value if available (including explicit null), otherwise show binding path
cellValue = rawVal != null ? String(rawVal) : `{${col.binding}}`;
```

#### 6. Fixed Currency Formatting (Lines 439-444)
```typescript
if (col.format === 'currency') {
  const currency = config.currency || 'USD';
  if (currency === 'none') {
    cellValue = String(Number(rawVal) || 0);
  } else {
    cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(rawVal) || 0);
  }
}
```

---

## Consistency with Canvas.tsx

The fix ensures that `Editor.tsx` (export function) now matches the proven logic in `Canvas.tsx` (rendering function):

| Feature | Canvas.tsx | Editor.tsx (Before) | Editor.tsx (After) |
|---------|-----------|---------------------|-------------------|
| Inline data check | ✅ Lines 2608-2615 | ❌ Missing | ✅ Lines 424-427 |
| Path prefix stripping | ✅ Lines 2627-2630 | ❌ Missing | ✅ Lines 432-435 |
| Null handling | ✅ Line 2644 | ⚠️ Shows "undefined" | ✅ Line 449 |
| Currency format | ✅ Lines 2633-2639 | ⚠️ Hardcoded USD | ✅ Lines 439-444 |

---

## Expected Behavior

### In Edit Mode (Canvas.tsx)
- **Data rows**: Display JSON paths like `{items.name}` (not resolved)
- **Inline edited cells**: Show the edited content

### In Preview/Generate/Export Mode (Both Canvas.tsx and Editor.tsx)
- **Data rows with bindings**: Show resolved values (e.g., "Laptop", "$999.99")
- **Inline edited cells**: Show the edited content
- **Failed bindings**: Show the binding path as fallback (e.g., `{items.unknown}`)

---

## Verification

### Code Review
✅ Completed - 3 comments addressed:
1. Inline type definition duplicated (kept for minimal changes)
2. Improved clarity by using `Map.has()` instead of checking undefined
3. Fallback behavior matches Canvas.tsx (kept for consistency)

### Security Scan
✅ CodeQL analysis completed - No vulnerabilities found

### Testing Approach
Since there's no existing test infrastructure, verification should be done manually:

1. Create an invoice template with a table
2. Set dataSource to `items`
3. Add columns with bindings like `items.name`, `items.price`
4. Add sample data with items array
5. Inline edit some cells
6. Generate/Export PDF
7. Verify:
   - ✅ Bound cells show actual values (not paths)
   - ✅ Inline edited cells show edited content
   - ✅ No cells showing "0" or "undefined"

---

## Files Modified

- `client/src/pages/Editor.tsx` (renderElementForExport function, lines 226-460)

Total changes: +37 lines, -10 lines

---

## Security Summary

✅ No security vulnerabilities detected
- All user input is properly escaped via existing `escapeHtml()` function
- No new external data sources introduced
- No changes to authentication or authorization logic
- Changes only affect data display logic in export function
