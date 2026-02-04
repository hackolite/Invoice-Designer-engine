# Text Component Editing and Context Menu Features

## Overview
This document describes the new features added to text components in the Invoice Designer Engine to match the functionality available for grid table cells.

## New Features

### 1. Double-Click Editing
Text elements can now be edited inline by double-clicking on them.

**How it works:**
- Double-click any text element on the canvas (when not in preview mode)
- A textarea appears with the current content
- Edit the text directly with all styling preserved
- Press Escape or click outside to exit edit mode

**Implementation Details:**
- State management via `editingTextElement` state variable
- Textarea inherits all style properties from the element (fontSize, color, fontWeight, etc.)
- Edit mode is only available in editor mode (not preview mode)

### 2. Right-Click Context Menu
Text elements now have a comprehensive context menu (right-click) with styling and data binding options.

#### Available Options:

##### Text Alignment Submenu
- **Left**: Aligns text to the left
- **Center**: Centers the text
- **Right**: Aligns text to the right  
- **Justify**: Justifies the text

##### Text Style Submenu
- **Bold**: Toggles bold font weight (normal ↔ bold)
- **Italic**: Toggles italic font style (normal ↔ italic)
- **Underline**: Toggles text underline decoration (none ↔ underline)

##### Data Binding Submenu
- Hierarchical data picker that shows the structure of sample data
- Navigate through nested objects to select data binding paths
- Selected path is automatically bound to the text element
- Bound data displays as `{{path.to.value}}` in editor mode
- In preview mode, shows actual data values

**Implementation Details:**
- Uses Radix UI ContextMenu component
- All context menu items update element properties through dedicated handlers
- Data tree is built recursively from sample data structure
- Same pattern as grid table cell context menu

### 3. PDF Export with Attributes
Text element attributes are properly displayed in PDF exports.

**How it works:**
- All style properties (fontSize, color, fontWeight, textAlign, fontStyle, textDecoration, etc.) are converted to inline CSS
- The `convertStyleObjectToCss` function handles the conversion
- Data bindings are resolved when exporting in preview mode
- Both HTML and PDF exports preserve all text styling

## Code Structure

### New State Variables
```typescript
const [editingTextElement, setEditingTextElement] = useState<string | null>(null);
```

### New Handler Functions
```typescript
// Update text content when editing
handleTextContentUpdate(elementId: string, content: string)

// Bind data source to text element  
handleTextBindingUpdate(elementId: string, binding: string)

// Update text style properties (alignment, bold, italic, etc.)
handleTextStyleUpdate(elementId: string, styleKey: string, styleValue: string | number)

// Render hierarchical data tree for binding picker
renderDataTreeForText(tree: Record<string, any>, elementId: string)
```

## User Workflows

### Editing Text Content
1. Double-click on any text element
2. Edit the text in the textarea
3. Press Escape or click outside to finish editing

### Applying Text Styling
1. Right-click on a text element
2. Navigate to "Text Align" or "Text Style" submenu
3. Select desired option (e.g., Center, Bold)
4. Styling is applied immediately

### Binding Data to Text
1. Right-click on a text element  
2. Navigate to "Bind Data" submenu
3. Browse through the data structure
4. Click on desired data path (e.g., "invoice → number")
5. Text element now displays bound data in preview mode

### Generating PDF with Styled Text
1. Style text elements using context menu or properties panel
2. Click "Export PDF" button
3. All text attributes (size, color, alignment, weight, etc.) are preserved in the PDF

## Technical Notes

- Text editing respects all existing style properties
- Context menu only appears in editor mode (not preview mode)
- Data bindings use `{{path.to.value}}` syntax
- PDF generation uses browser's native print-to-PDF functionality
- All changes follow existing patterns from grid table implementation

## Compatibility

- Works with all existing text element properties
- Compatible with data binding system
- Maintains backward compatibility with existing templates
- Follows same UX patterns as grid table cells

## Testing Recommendations

To test the new features:
1. Create a new template or open existing one
2. Add a text element to the canvas
3. Test double-click editing
4. Test right-click context menu options
5. Test data binding with sample data
6. Generate PDF and verify attributes are preserved
