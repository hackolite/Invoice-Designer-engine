# Context Menu and GridTable Enhancements - User Guide

## New Features Overview

This update adds three major enhancements to the Invoice Designer editor to improve usability and functionality:

### 1. 🎨 Opaque Context Menu for Better Visibility
**What Changed**: The right-click context menu is now fully opaque instead of semi-transparent.

**Why It Matters**: The transparent menu was difficult to read, especially when hovering over complex layouts or colored elements.

**How to Use**:
- Simply right-click on any GridTable cell
- The menu will appear with a solid white (light mode) or dark (dark mode) background
- All menu items are now clearly visible

### 2. 🔗 JSON Data Binding Navigation
**What Changed**: Added a "Bind Data" option to the context menu that lets you navigate through your JSON data structure like a file tree.

**Why It Matters**: 
- Previously, you had to manually type binding paths (e.g., `invoice.customer.address.city`)
- Now you can browse and select from available data fields
- Shows the full path for each field to avoid confusion when keys appear multiple times

**How to Use**:
1. Right-click on a GridTable cell
2. Look for the "Bind Data" menu item (with a Database icon 🗄️)
3. Hover over it to see the cascading menu of available data fields
4. Navigate through nested objects:
   - Top-level fields like `total` or `date`
   - Nested fields under `invoice` → `customer` → `name`
   - Deeply nested fields like `invoice` → `customer` → `address` → `city`
5. Click on any field to bind it to the cell
6. The cell will show `{{path}}` in edit mode (e.g., `{{invoice.customer.name}}`)
7. Switch to preview mode to see the actual data

**Example JSON Structure**:
```json
{
  "invoice": {
    "number": "INV-2024-001",
    "date": "2024-01-15",
    "customer": {
      "name": "John Doe",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "zip": "10001"
      }
    }
  },
  "total": 175.00
}
```

**Resulting Menu**:
```
Bind Data →
  ├─ invoice →
  │   ├─ number → invoice.number
  │   ├─ date → invoice.date
  │   └─ customer →
  │       ├─ name → invoice.customer.name
  │       └─ address →
  │           ├─ street → invoice.customer.address.street
  │           ├─ city → invoice.customer.address.city
  │           └─ zip → invoice.customer.address.zip
  └─ total → total
```

### 3. 📏 Proportional GridTable Row Resizing
**What Changed**: When you resize a GridTable's height, all rows now scale proportionally to maintain their relative sizes.

**Why It Matters**: 
- Previously, resizing a table could make some rows too large or too small
- Now all rows maintain their size relationships (e.g., if row 1 is twice as tall as row 2, it stays that way)

**How to Use**:
1. Create or select a GridTable element
2. Adjust individual row heights if desired (using row resize handles)
3. Click on the table to select it
4. Drag the bottom edge of the table to resize its overall height
5. Watch as all rows scale proportionally together

**Before**:
- Table height: 300px
- Row 1: 100px (33%)
- Row 2: 200px (67%)

**After Resizing to 450px**:
- Table height: 450px
- Row 1: 150px (33% - maintained!)
- Row 2: 300px (67% - maintained!)

## Technical Details

### Files Modified
1. `client/src/components/ui/context-menu.tsx`
   - Added `opacity-100` for full opacity

2. `client/src/index.css`
   - Added `--popover` and `--popover-foreground` CSS variables

3. `client/src/components/Canvas.tsx`
   - Added `buildDataPathTree()` function
   - Added `renderDataTree()` method
   - Added `handleCellBindingUpdate()` method
   - Modified `onResizeStop` handler for proportional resizing
   - Added "Bind Data" menu to context menu

### Compatibility
- ✅ Backwards compatible with existing templates
- ✅ Works with both light and dark themes
- ✅ No breaking changes to existing functionality
- ✅ TypeScript type-safe

### Browser Support
- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported

## FAQ

**Q: Will the binding work if my JSON structure changes?**
A: Yes, but if the field path no longer exists in the new data, it will display the binding syntax (e.g., `{{old.path}}`) as a fallback.

**Q: Can I still manually type binding paths?**
A: Yes! You can still edit cell content directly and type binding syntax manually if preferred.

**Q: What happens if I resize width instead of height?**
A: Width resizing works as before - it doesn't affect row heights, only column widths.

**Q: Does this work with merged cells?**
A: Yes! Merged cells can be bound to data just like regular cells.

**Q: Can I bind arrays?**
A: Arrays show up as a single binding path (e.g., `items`). For iterating over array items, use the existing Table element with `dataSource` binding.

## Tips and Tricks

1. **Quick Binding**: Double-click a cell to edit, then right-click and select from "Bind Data"
2. **Full Paths**: The menu shows both the short name and full path (e.g., "city → invoice.customer.address.city")
3. **Theme Support**: The opaque menu works great in both light and dark modes
4. **Proportional Resizing**: Set your row heights first, then resize the table - the proportions will be maintained
5. **Nested Objects**: Use the arrow keys to navigate through nested menus quickly

## Support

For issues or questions, please open an issue on GitHub.
