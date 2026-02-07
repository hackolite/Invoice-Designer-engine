# Invoice Table Context Menu - Visual Guide

## Before (Without Context Menu)

```
┌─────────────────────────────────────────┐
│  Invoice Table Data Cell                │
│                                         │
│  - Only contentEditable for text input  │
│  - No right-click menu                  │
│  - No styling options                   │
│  - No data binding UI                   │
│                                         │
│  Right Click → No menu appears ❌       │
└─────────────────────────────────────────┘
```

## After (With Context Menu)

```
┌─────────────────────────────────────────┐
│  Invoice Table Data Cell                │
│                                         │
│  Right Click → Context Menu Opens ✅    │
│                                         │
│  ┌───────────────────────────────┐     │
│  │  ▶ Text Align                  │     │
│  │    ├─ Left                     │     │
│  │    ├─ Center                   │     │
│  │    ├─ Right                    │     │
│  │    └─ Justify                  │     │
│  │                                │     │
│  │  ▶ Text Style                  │     │
│  │    ├─ Bold / Remove Bold       │     │
│  │    ├─ Italic / Remove Italic   │     │
│  │    └─ Underline / Remove...    │     │
│  │                                │     │
│  │  ─────────────────             │     │
│  │                                │     │
│  │  ▶ Bind Data (if available)   │     │
│  │    └─ [Data source tree]      │     │
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## Feature Comparison

### Grid Table Cells (Already Had)
✅ Right-click context menu  
✅ Text Align (Left, Center, Right, Justify)  
✅ Text Style (Bold, Italic, Underline)  
✅ Data binding from sample data  
✅ Merge cells option  
✅ Subdivide cell option  

### Invoice Table Cells (Now Have)
✅ Right-click context menu **[NEW]**  
✅ Text Align (Left, Center, Right, Justify) **[NEW]**  
✅ Text Style (Bold, Italic, Underline) **[NEW]**  
✅ Data binding from sample data **[NEW]**  
❌ Merge cells (not needed for invoice tables)  
❌ Subdivide cell (not needed for invoice tables)  

## How to Use

### 1. Text Alignment
1. Right-click on any invoice table data cell
2. Hover over "Text Align" 
3. Select desired alignment (Left, Center, Right, or Justify)
4. Cell content aligns accordingly

### 2. Text Styling
1. Right-click on any invoice table data cell
2. Hover over "Text Style"
3. Click Bold, Italic, or Underline to toggle
4. Menu shows current state (e.g., "Bold" or "Remove Bold")

### 3. Data Binding
1. Ensure sample data is loaded in the editor
2. Right-click on any invoice table data cell
3. Hover over "Bind Data"
4. Navigate the data tree and select a field
5. The entire column binds to that field

## Implementation Notes

- Context menu only appears in **edit mode** (not preview mode)
- Styles are stored in `tableConfig.cellStyles` array
- Data binding is at **column level** (all cells in column use same binding)
- Styles persist when template is saved
- Compatible with existing invoice table features (contentEditable, etc.)

## Context Menu Structure

```javascript
<ContextMenu>
  <ContextMenuTrigger>
    <td>{cell content}</td>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuSub> {/* Text Align */}
      <ContextMenuSubTrigger>Text Align</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Left</ContextMenuItem>
        <ContextMenuItem>Center</ContextMenuItem>
        <ContextMenuItem>Right</ContextMenuItem>
        <ContextMenuItem>Justify</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    
    <ContextMenuSub> {/* Text Style */}
      <ContextMenuSubTrigger>Text Style</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Bold</ContextMenuItem>
        <ContextMenuItem>Italic</ContextMenuItem>
        <ContextMenuItem>Underline</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    
    <ContextMenuSeparator />
    
    <ContextMenuSub> {/* Bind Data (conditional) */}
      <ContextMenuSubTrigger>Bind Data</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {/* Recursive data tree rendering */}
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>
```

## Testing Checklist

- [ ] Right-click invoice table cell shows context menu
- [ ] Text alignment options work correctly
- [ ] Text style toggles work (bold, italic, underline)
- [ ] Data binding menu appears when sample data loaded
- [ ] Styles persist after save/reload
- [ ] Context menu doesn't appear in preview mode
- [ ] Grid table context menus still work
- [ ] No regression in existing invoice table features
