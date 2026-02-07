# Table Height Resizing - Visual Guide

## Before vs After

### Before This Change ❌

**Problem:** Tables could be resized to unusably small heights

```
┌─────────────────────────┐
│  Grid Table (5 rows)    │  Height: 100px
│  Row 1                  │
│  Row 2                  │
│  Row 3                  │  User drags bottom edge UP ↑
│  Row 4                  │
│  Row 5                  │
└─────────────────────────┘
           ↓
           ↓  User keeps dragging...
           ↓
┌─────────────────────────┐
│Grid Table│                Height: 10px ⚠️
└─────────────────────────┘
   TOO SMALL - UNUSABLE!
```

**Issues:**
- ❌ No minimum height enforcement
- ❌ Tables could become illegible
- ❌ Content gets cut off
- ❌ Poor user experience

---

### After This Change ✅

**Solution:** Minimum height based on table content

```
┌─────────────────────────┐
│  Grid Table (5 rows)    │  Height: 150px
│  Row 1                  │
│  Row 2                  │
│  Row 3                  │  User drags bottom edge UP ↑
│  Row 4                  │
│  Row 5                  │
└─────────────────────────┘
           ↓
           ↓  User drags...
           ↓
┌─────────────────────────┐
│  Grid Table (5 rows)    │  Height: 100px
│  Row 1                  │  (5 rows × 20px = 100px)
│  Row 2                  │
│  Row 3                  │  🛑 STOPS HERE
│  Row 4                  │  Cannot reduce further!
│  Row 5                  │
└─────────────────────────┘
   MINIMUM REACHED ✓
   Each row guaranteed 20px
```

**Benefits:**
- ✅ Minimum height enforced: `rows × 20px`
- ✅ Content always visible
- ✅ Blue border stops naturally
- ✅ Great user experience

---

## How to Use

### 1. Select a Table
Click on any table to select it. A **blue border** appears.

```
┌─────────────────────────┐
│  ╔═══════════════════╗  │  ← Blue selection border
│  ║ Price Table       ║  │
│  ║ Item 1: $10.00    ║  │
│  ║ Item 2: $20.00    ║  │
│  ║ Tax:    $3.00     ║  │
│  ║ Total:  $33.00    ║  │
│  ╚═══════════════════╝  │
└─────────────────────────┘
```

### 2. Resize Height
Drag the **bottom edge** of the blue border to resize height.

```
     ⬇ Drag down to INCREASE
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║ Price Table       ║  │
│  ║ Item 1: $10.00    ║  │
│  ║ Item 2: $20.00    ║  │
│  ║ Tax:    $3.00     ║  │
│  ║ Total:  $33.00    ║  │
│  ╚═══════════════════╝  │
│           ═══            │  ← Drag handle
└─────────────────────────┘
     ⬆ Drag up to DECREASE
```

### 3. Minimum Height Reached
When you reach the minimum, the border **stops moving**.

```
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║ Price Table       ║  │  Height = 100px
│  ║ Item 1: $10.00    ║  │  (5 rows × 20px)
│  ║ Item 2: $20.00    ║  │
│  ║ Tax:    $3.00     ║  │  🛑 MINIMUM REACHED
│  ║ Total:  $33.00    ║  │  Cannot reduce more!
│  ╚═══════════════════╝  │
└─────────────────────────┘
```

---

## Minimum Heights by Table Type

### Grid Table
```
Minimum Height = Number of Rows × 20px

Examples:
┌─────────────┐
│ 3 rows      │  → 60px minimum
│ Row 1       │
│ Row 2       │
│ Row 3       │
└─────────────┘

┌─────────────┐
│ 10 rows     │  → 200px minimum
│ Row 1       │
│ Row 2       │
│ ...         │
│ Row 10      │
└─────────────┘
```

### Price Table
```
Minimum Height = (Number of Items + Footer Rows) × 20px

Example with 3 items + 2 footer rows:
┌─────────────────┐
│ Item 1: $10.00  │  ← Item row
│ Item 2: $20.00  │  ← Item row
│ Item 3: $15.00  │  ← Item row
│ Tax:    $4.50   │  ← Footer row
│ Total:  $49.50  │  ← Footer row
└─────────────────┘
5 rows × 20px = 100px minimum
```

### Invoice Table
```
Minimum Height = (1 Header + 3 Data Rows + Footer Rows) × 20px

Example with 2 footer rows:
┌──────────────────────────┐
│ Description | Qty | Price│  ← Header
│ Widget A    | 2   | $20  │  ← Data row 1
│ Widget B    | 1   | $15  │  ← Data row 2
│ Widget C    | 3   | $45  │  ← Data row 3
│ Subtotal:   |     | $80  │  ← Footer row 1
│ Total:      |     | $80  │  ← Footer row 2
└──────────────────────────┘
6 rows × 20px = 120px minimum
```

---

## Width vs Height Resizing

### Width Resizing (Already Working)
```
← →  Can resize left/right freely
     (With column minimum constraints)
```

### Height Resizing (NEW!)
```
↑ ↓  Can resize up/down independently
     (With row-based minimum constraints)
```

### Both Work Independently ✅
```
    ↑
← ╔═══╗ →  Resize width AND height
  ║   ║     without affecting each other
  ╚═══╝
    ↓
```

---

## Technical Details

### Minimum Row Height Constant
```typescript
const MIN_ROW_HEIGHT = 20; // pixels per row
```

### Calculation Examples

**Grid Table (5 rows):**
```
5 rows × 20px/row = 100px minimum
```

**Price Table (3 items + 2 footers):**
```
(3 + 2) rows × 20px/row = 100px minimum
```

**Invoice Table (1 header + 3 data + 2 footers):**
```
(1 + 3 + 2) rows × 20px/row = 120px minimum
```

---

## User Feedback

### Visual Cues
- ✅ **Blue border** indicates selected table
- ✅ **Resize handles** appear on edges
- ✅ **Border stops** moving at minimum
- ✅ **Cursor changes** to resize icon

### No Error Messages Needed
The natural resistance of the border provides intuitive feedback. Users understand they've reached the limit without explicit messages.

---

## Grid Snapping

Heights snap to **10px grid** for clean alignment:

```
Dragging:   87px  →  Snaps to: 90px
Dragging:   94px  →  Snaps to: 90px
Dragging:  103px  →  Snaps to: 100px
```

**Note:** Minimum height is enforced BEFORE grid snapping, so the actual minimum might be the next 10px increment above the calculated minimum.

Example:
- Calculated minimum: 97px
- After grid snap: 100px ✓

---

## What Changed in the Code

### Files Modified
- `client/src/components/Canvas.tsx`
  - Added 3 helper functions for calculating minimums
  - Added `minConstraints` prop to Rnd component
  - Fixed `lockAspectRatio` to enable independent resizing

### Files Created
- `TABLE_HEIGHT_RESIZING.md` - Technical documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `TABLE_HEIGHT_VISUAL_GUIDE.md` - This visual guide

---

## FAQ

**Q: Can I still resize width?**
A: Yes! Width and height resize independently.

**Q: What happens if I add more rows?**
A: The minimum height increases automatically (new row count × 20px).

**Q: Can I override the minimum height?**
A: No, the minimum ensures tables remain usable. It's a safety feature.

**Q: Does this affect existing templates?**
A: No! Existing templates keep their current heights. The minimum only affects future resizing.

**Q: Why 20px per row?**
A: This is the `MIN_ROW_HEIGHT` constant, chosen to ensure text remains readable while allowing compact layouts.

---

## Testing Checklist

To verify the feature works:

- [ ] Select a grid table
- [ ] Drag bottom edge down (height increases) ✓
- [ ] Drag bottom edge up (height decreases) ✓
- [ ] Continue dragging up until it stops ✓
- [ ] Verify height = rows × 20px ✓
- [ ] Try resizing width (should still work) ✓
- [ ] Repeat for price tables ✓
- [ ] Repeat for invoice tables ✓

---

## Troubleshooting

**Problem:** Can't resize height at all
- **Check:** Is the table selected? (blue border visible?)
- **Check:** Are you dragging the bottom edge, not the corner?

**Problem:** Height jumps in large increments
- **Explanation:** This is grid snapping (10px intervals) - working as designed

**Problem:** Minimum seems too restrictive
- **Explanation:** Minimum is rows × 20px to ensure readability
- **Solution:** Add/remove rows to change table structure

---

## Summary

✅ **Simple** - Just drag the blue border  
✅ **Safe** - Can't make tables too small  
✅ **Smart** - Minimum adapts to content  
✅ **Smooth** - Natural, intuitive behavior  

The blue border now works consistently for both width AND height resizing, with appropriate constraints for each dimension.
