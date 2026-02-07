# Invoice Table Header and Footer Context Menu Enhancement

## Problem Statement

**Original Request (French):**
> "il faut mettre binding data dans header et dans footer aussi, pour ce ui est de clique droit edition pour table invoice"

**Translation:**
> "need to put binding data in header and in footer also, for what is right click edit for invoice table"

## Issue Analysis

The invoice table right-click context menu had incomplete functionality:

### Before Implementation

#### Header Cells
- ✓ Text Align (Left, Center, Right, Justify)
- ✓ Text Style (Bold, Italic, Underline)
- ✗ **Bind Data** (MISSING)

#### Footer Value Cells
- ✓ Bind Data
- ✗ **Text Align** (MISSING)
- ✗ **Text Style** (MISSING)

### Root Cause
The context menu implementation was incomplete:
1. Header cells lacked data binding capability despite having styling options
2. Footer value cells could bind data but couldn't be styled independently from footer labels

## Solution Overview

Added missing context menu options to achieve complete feature parity across all invoice table cell types.

## Implementation Details

### 1. Header Data Binding

#### Added Handler Function
**Location:** `client/src/components/Canvas.tsx` (lines 780-797)

```typescript
// Handle header cell binding updates for invoice tables
const handleInvoiceTableHeaderBindingUpdate = (elementId: string, col: number, binding: string) => {
  const element = layout.elements.find(e => e.id === elementId);
  if (!element || !element.tableConfig) return;
  
  const config = element.tableConfig;
  const newColumns = [...config.columns];
  if (col >= 0 && col < newColumns.length) {
    newColumns[col] = {
      ...newColumns[col],
      header: `{${binding}}`  // Store as {bindingName} format
    };
    
    onElementUpdate(elementId, {
      tableConfig: { ...config, columns: newColumns }
    });
  }
};
```

**Key Points:**
- Stores binding in `{bindingName}` format (consistent with footer values)
- Updates the column configuration in `tableConfig.columns`
- Wraps binding with curly braces for template processing

#### Added Render Function
**Location:** `client/src/components/Canvas.tsx` (lines 945-973)

```typescript
// Recursive function to render JSON data tree in context menu for invoice table header cells
const renderDataTreeForInvoiceTableHeader = (tree: Record<string, any>, elementId: string, col: number): JSX.Element[] => {
  return Object.keys(tree).map((key) => {
    const value = tree[key];
    
    if (typeof value === 'string') {
      // Leaf node - this is a full path
      return (
        <ContextMenuItem 
          key={value}
          onClick={() => handleInvoiceTableHeaderBindingUpdate(elementId, col, value)}
        >
          {key} → {value}
        </ContextMenuItem>
      );
    } else {
      // Nested object - create submenu
      return (
        <ContextMenuSub key={key}>
          <ContextMenuSubTrigger>{key}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {renderDataTreeForInvoiceTableHeader(value, elementId, col)}
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    }
  });
};
```

**Key Points:**
- Recursively renders data tree as nested submenus
- Shows hierarchical structure of available data fields
- Calls `handleInvoiceTableHeaderBindingUpdate()` on selection

#### Context Menu Addition
**Location:** `client/src/components/Canvas.tsx` (after line 2267)

```tsx
{sampleData && (
  <ContextMenuSub>
    <ContextMenuSubTrigger>
      <Database className="w-4 h-4 mr-2" />
      Bind Data
    </ContextMenuSubTrigger>
    <ContextMenuSubContent>
      {renderDataTreeForInvoiceTableHeader(
        buildDataPathTreeExcludingItems(sampleData, config.dataSource), 
        el.id, 
        colIdx
      )}
    </ContextMenuSubContent>
  </ContextMenuSub>
)}
```

**Key Points:**
- Uses `buildDataPathTreeExcludingItems()` - excludes array items, only top-level fields
- Only shown when `sampleData` is available
- Integrates seamlessly with existing Text Align and Text Style submenus

### 2. Footer Value Text Styling

#### Updated Cell Style Usage
**Location:** `client/src/components/Canvas.tsx` (lines 2693-2705)

**Before:**
```typescript
style={{
  textAlign: (footerRow.style?.textAlign as React.CSSProperties['textAlign']) || 'right',
  fontWeight: footerRow.style?.fontWeight || 'bold',
  // ... used footerRow.style directly
}}
```

**After:**
```typescript
style={{
  textAlign: (footerValueStyle.textAlign as React.CSSProperties['textAlign']) || 
            (footerRow.style?.textAlign as React.CSSProperties['textAlign']) || 'right',
  fontWeight: footerValueStyle.fontWeight || footerRow.style?.fontWeight || 'bold',
  fontStyle: (footerValueStyle.fontStyle as React.CSSProperties['fontStyle']) || 
            (footerRow.style?.fontStyle as React.CSSProperties['fontStyle']) || 'normal',
  textDecoration: footerValueStyle.textDecoration || footerRow.style?.textDecoration || 'none',
  // ... uses footerValueStyle with fallbacks
}}
```

**Key Points:**
- Now uses `footerValueStyle` variable (field-specific style)
- Falls back to `footerRow.style` (row-level style)
- Falls back to default values
- Allows independent styling of value cell from label cell

#### Added Text Align Submenu
**Location:** `client/src/components/Canvas.tsx` (lines 2717-2733)

```tsx
<ContextMenuSub>
  <ContextMenuSubTrigger>
    <AlignLeft className="w-4 h-4 mr-2" />
    Text Align
  </ContextMenuSubTrigger>
  <ContextMenuSubContent>
    <ContextMenuItem onClick={() => handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'textAlign', 'left')}>
      <AlignLeft className="w-4 h-4 mr-2" />
      Left
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'textAlign', 'center')}>
      <AlignCenter className="w-4 h-4 mr-2" />
      Center
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'textAlign', 'right')}>
      <AlignRight className="w-4 h-4 mr-2" />
      Right
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'textAlign', 'justify')}>
      <AlignJustify className="w-4 h-4 mr-2" />
      Justify
    </ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>
```

**Key Points:**
- Uses existing `handleInvoiceTableFooterStyleUpdate()` handler
- Passes `'value'` as the field parameter (distinguishes from label)
- Provides all standard alignment options

#### Added Text Style Submenu
**Location:** `client/src/components/Canvas.tsx` (lines 2734-2763)

```tsx
<ContextMenuSub>
  <ContextMenuSubTrigger>
    <Bold className="w-4 h-4 mr-2" />
    Text Style
  </ContextMenuSubTrigger>
  <ContextMenuSubContent>
    <ContextMenuItem onClick={() => {
      const currentWeight = footerValueStyle.fontWeight;
      handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'fontWeight', 
        currentWeight === 'bold' ? 'normal' : 'bold');
    }}>
      <Bold className="w-4 h-4 mr-2" />
      {footerValueStyle.fontWeight === 'bold' ? 'Remove Bold' : 'Bold'}
    </ContextMenuItem>
    <ContextMenuItem onClick={() => {
      const currentStyle = footerValueStyle.fontStyle;
      handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'fontStyle', 
        currentStyle === 'italic' ? 'normal' : 'italic');
    }}>
      <Italic className="w-4 h-4 mr-2" />
      {footerValueStyle.fontStyle === 'italic' ? 'Remove Italic' : 'Italic'}
    </ContextMenuItem>
    <ContextMenuItem onClick={() => {
      const currentDecoration = footerValueStyle.textDecoration;
      handleInvoiceTableFooterStyleUpdate(el.id, idx, 'value', 'textDecoration', 
        currentDecoration === 'underline' ? 'none' : 'underline');
    }}>
      <Underline className="w-4 h-4 mr-2" />
      {footerValueStyle.textDecoration === 'underline' ? 'Remove Underline' : 'Underline'}
    </ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>
```

**Key Points:**
- Toggle behavior for Bold, Italic, Underline
- Dynamic menu item labels (e.g., "Bold" vs "Remove Bold")
- Uses `footerValueStyle` to determine current state

## Complete Feature Matrix

| Cell Type | Text Align | Text Style | Bind Data | Notes |
|-----------|------------|------------|-----------|-------|
| **Header** | ✓ | ✓ | ✓ (NEW) | Now supports data binding |
| **Body** | ✓ | ✓ | ✓ | Already complete |
| **Footer Label** | ✓ | ✓ | N/A | Static text, no binding needed |
| **Footer Value** | ✓ (NEW) | ✓ (NEW) | ✓ | Now supports independent styling |

## Data Sources and Handlers

### Data Sources
| Cell Type | Data Source Function | Purpose |
|-----------|---------------------|---------|
| Header | `buildDataPathTreeExcludingItems()` | Top-level fields only (e.g., `client.name`, `total`) |
| Body | `buildDataPathTreeForItems()` | Item array fields (e.g., `description`, `price`) |
| Footer | `buildDataPathTreeExcludingItems()` | Top-level fields (e.g., `subtotal`, `tax`) |

### Handler Functions
| Operation | Function | Parameters |
|-----------|----------|------------|
| Header Binding | `handleInvoiceTableHeaderBindingUpdate()` | elementId, col, binding |
| Header Styling | `handleInvoiceTableHeaderStyleUpdate()` | elementId, col, styleKey, styleValue |
| Footer Binding | `handleInvoiceTableFooterBindingUpdate()` | elementId, footerRowIndex, binding |
| Footer Styling | `handleInvoiceTableFooterStyleUpdate()` | elementId, row, field, styleKey, styleValue |

## Binding Format Consistency

All cells now use consistent binding format:

| Storage Location | Format | Example |
|-----------------|--------|---------|
| Header (`col.header`) | `{bindingName}` | `{client.name}` |
| Body (`col.binding`) | `bindingName` | `description` |
| Footer (`footerRow.value`) | `{bindingName}` | `{total}` |

**Note:** Body cells display as `{bindingName}` in edit mode but store without braces.

## Files Modified

1. **client/src/components/Canvas.tsx** - 118 lines added/modified
   - Added header binding handler (18 lines)
   - Added header render function (28 lines)
   - Added header "Bind Data" submenu (11 lines)
   - Updated footer value style usage (5 lines)
   - Added footer "Text Align" submenu (20 lines)
   - Added footer "Text Style" submenu (36 lines)

## Testing Checklist

### Header Data Binding
- [ ] Right-click on header cell in edit mode
- [ ] Verify "Bind Data" submenu appears with hierarchical data tree
- [ ] Select a data binding (e.g., `client.name`)
- [ ] Verify header updates to show `{client.name}`
- [ ] Switch to preview mode
- [ ] Verify header displays actual data from sample data

### Footer Value Text Align
- [ ] Right-click on footer value cell in edit mode
- [ ] Verify "Text Align" submenu appears
- [ ] Test each alignment option (Left, Center, Right, Justify)
- [ ] Verify visual alignment changes immediately
- [ ] Save and reload template
- [ ] Verify alignment persists after reload

### Footer Value Text Style
- [ ] Right-click on footer value cell in edit mode
- [ ] Verify "Text Style" submenu appears
- [ ] Toggle Bold - verify menu shows "Bold" / "Remove Bold"
- [ ] Toggle Italic - verify menu shows "Italic" / "Remove Italic"
- [ ] Toggle Underline - verify menu shows "Underline" / "Remove Underline"
- [ ] Apply multiple styles simultaneously
- [ ] Verify all styles render correctly

### Regression Testing
- [ ] Verify existing header styling (Text Align, Text Style) still works
- [ ] Verify existing footer label context menu still works
- [ ] Verify existing footer value binding still works
- [ ] Verify body cell context menus unchanged
- [ ] Test in both edit and preview modes
- [ ] Verify no console errors

## Usage Examples

### Header Data Binding

**Before:** Header shows static text "Customer Name"

**After:** 
1. Right-click header cell → Bind Data → client → name
2. Header updates to show `{client.name}`
3. In preview mode, shows actual customer name from data

### Footer Value Styling

**Before:** Footer value inherits all styling from row-level style

**After:**
1. Right-click footer value → Text Align → Center
2. Footer value centers independently of label
3. Right-click footer value → Text Style → Bold
4. Footer value becomes bold while label remains normal weight

## Benefits

1. **Consistency**: All invoice table cells have complete feature parity
2. **Flexibility**: Headers can now display dynamic data
3. **Control**: Footer values can be styled independently from labels
4. **Productivity**: Fewer manual updates needed for changing data
5. **User Experience**: Intuitive right-click menus across all cell types

## Backward Compatibility

✓ All changes are additive - no breaking changes
✓ Existing templates continue to work unchanged
✓ New features are opt-in via context menu
✓ No schema migrations required
✓ Existing data structures unmodified

## Technical Notes

### Why Different Data Sources?
- **Header/Footer**: Use `buildDataPathTreeExcludingItems()` because they typically show summary data (totals, customer info) rather than item details
- **Body**: Uses `buildDataPathTreeForItems()` because it displays array items (product descriptions, prices, quantities)

### Style Precedence
Footer value styles follow this priority:
1. Field-specific style (`footerValueStyle`)
2. Row-level style (`footerRow.style`)
3. Default value

This allows maximum flexibility while maintaining sensible defaults.

### Performance Impact
- Minimal: Only adds conditional rendering in edit mode
- No additional API calls or data fetching
- Leverages existing handler functions
- No impact on preview mode rendering

## Related Documentation

- [INVOICE_TABLE_CONTEXT_MENU_CHANGES.md](./INVOICE_TABLE_CONTEXT_MENU_CHANGES.md) - Original body cell context menu implementation
- [INVOICE_TABLE_BINDING_ENHANCEMENT.md](./INVOICE_TABLE_BINDING_ENHANCEMENT.md) - Invoice table binding system
- [IMPLEMENTATION_INVOICE_TABLE_EDITING.md](./IMPLEMENTATION_INVOICE_TABLE_EDITING.md) - Inline editing implementation

## Security

✓ CodeQL security scan completed - **0 vulnerabilities found**
✓ No user input directly executed
✓ All data binding goes through controlled `getValue()` function
✓ Context menus only accessible in edit mode
✓ No SQL injection risks (frontend only changes)

## Conclusion

This implementation completes the context menu functionality for invoice tables, providing users with complete control over data binding and styling across all cell types. The changes follow existing patterns, maintain consistency with the codebase, and introduce no breaking changes or security vulnerabilities.
