# GridTable Component - Quick Reference

## 🚀 What's New

### 1. New GridTable Component
Click the **Grid Table** button in the component sidebar to create a customizable table with:
- Adjustable rows and columns (1-20 each)
- Cell merging (rowSpan/colSpan)
- Hard text and data binding in each cell
- Border color and width controls

### 2. Renamed Price Table
The existing table component is now called **Price Table** for clarity.

### 3. Keyboard Shortcuts
- **Ctrl+C** (or Cmd+C on Mac): Clone the selected element
- **Delete** or **Backspace**: Remove the selected element

## 📋 Quick Start Guide

### Creating a GridTable

1. Click **Grid Table** in the component sidebar
2. A 3×3 table appears on the canvas
3. Select it to see inline controls below:
   - **Color Picker**: Change border color
   - **Width Input**: Adjust border thickness (0-10px)
   - **Clone Button**: Quick duplicate

### Editing Cells

1. Select the GridTable on canvas
2. Open the **Properties Panel** on the right
3. Scroll to the **Cells** section
4. For each cell, you can set:
   - **Content**: Static text (e.g., "Invoice Total")
   - **Binding**: Dynamic data (e.g., `invoice.total`)
   - **Row Span**: Merge cells vertically
   - **Col Span**: Merge cells horizontally

### Changing Grid Size

In the Properties Panel:
1. Find **Grid Dimensions**
2. Adjust **Rows** (1-20)
3. Adjust **Columns** (1-20)
4. Cells are automatically added/removed

### Using Data Binding

**Option 1: Binding Property**
- Set the cell's **Binding** field to a data path
- Example: `customer.name`
- In preview mode, shows the actual value

**Option 2: Content with Placeholders**
- Use `{{placeholder}}` syntax in content
- Example: `Total: {{invoice.total}}`
- Multiple placeholders supported: `{{item}} - {{price}}`

## 🎨 Common Patterns

### Pattern 1: Contact Info Table
```
┌──────────┬─────────────────┐
│ Name:    │ {{customer.name}}│
├──────────┼─────────────────┤
│ Email:   │ {{customer.email}}│
├──────────┼─────────────────┤
│ Phone:   │ {{customer.phone}}│
└──────────┴─────────────────┘
```

**Setup:**
- 3 rows × 2 columns
- Left column: hard text ("Name:", "Email:", "Phone:")
- Right column: data bindings

### Pattern 2: Merged Header
```
┌────────────────────────────┐
│    Invoice Summary         │ ← colSpan = 3
├──────────┬────────┬────────┤
│ Item     │ Qty    │ Total  │
├──────────┼────────┼────────┤
│ Product A│ 2      │ $200   │
└──────────┴────────┴────────┘
```

**Setup:**
- First row: 1 cell with colSpan = 3
- Remaining rows: normal cells

### Pattern 3: Totals Section
```
┌─────────────┬──────────┐
│ Subtotal    │ $500.00  │
├─────────────┼──────────┤
│ Tax (10%)   │ $50.00   │
├─────────────┼──────────┤
│ Total       │ $550.00  │ ← Can span
└─────────────┴──────────┘   multiple rows
```

**Setup:**
- 2 columns
- Left: labels (hard text)
- Right: values (data binding or hard text)

## 🔧 Tips & Tricks

### Merging Cells
1. Select the cell in properties panel
2. Increase **Row Span** to merge downward
3. Increase **Col Span** to merge rightward
4. Example: rowSpan=2, colSpan=1 merges 2 rows

### Border Styling
- **Quick Edit**: Click table → use inline controls
- **Precise Edit**: Use properties panel
- **Color Format**: Hex colors (#000000) or named colors
- **Width Range**: 0-10 pixels

### Data Binding Best Practices
- Use dot notation: `object.property.subproperty`
- Preview mode resolves bindings
- Edit mode shows placeholder text
- Mix hard text and bindings: `"Total: {{amount}}"`

### Keyboard Workflow
1. Add element to canvas
2. Position it where you want
3. **Ctrl+C** to duplicate
4. **Delete** to remove
5. Repeat as needed

## 📊 GridTable vs Price Table

| When to Use          | GridTable                    | Price Table                  |
|---------------------|------------------------------|------------------------------|
| Layout              | Custom, flexible             | Fixed 2-column               |
| Cell Merging        | ✅ Yes                       | ❌ No                        |
| Per-Cell Content    | ✅ Yes                       | ❌ No                        |
| Per-Cell Binding    | ✅ Yes                       | ❌ No                        |
| Best For            | Forms, summaries, layouts    | Line items, data lists       |
| Header Row          | Optional (merge cells)       | Automatic                    |
| Data Source         | Individual cell bindings     | Array with column config     |

**Use GridTable when:**
- You need custom cell layouts
- You want to merge cells
- You have mixed static/dynamic content
- You're creating a form or summary section

**Use Price Table when:**
- You have an array of similar items
- You need a simple data list
- You want automatic row generation
- You're showing invoice line items

## 🎯 Example Scenarios

### Scenario 1: Invoice Header
**Use GridTable** to create a flexible header with company info, invoice details, and client info.

### Scenario 2: Line Items
**Use Price Table** to display an array of products with description, quantity, price, and total.

### Scenario 3: Summary Section
**Use GridTable** to create a totals section with merged cells and calculated values.

### Scenario 4: Terms & Conditions
**Use Text Element** for simple text, or **GridTable** for structured terms with labels.

## 🚨 Common Issues

### Issue: Cell content not showing
**Solution**: Check if cell is occupied by another cell's span. Verify rowSpan/colSpan values don't overlap.

### Issue: Border not appearing
**Solution**: Set border width > 0. Check border color isn't transparent. Use inline controls to verify.

### Issue: Data binding not working
**Solution**: Ensure you're in Preview mode. Check binding path matches your JSON structure. Example: `customer.name` requires `{ "customer": { "name": "..." } }`

### Issue: Keyboard shortcuts not working
**Solution**: Make sure element is selected (has blue border). Check you're not typing in an input field. Shortcuts are disabled in input fields.

## 📚 Related Documentation

- **GRIDTABLE_IMPLEMENTATION.md** - Technical details and API reference
- **GRIDTABLE_UI_CHANGES.md** - Visual guide with diagrams
- **IMPLEMENTATION_COMPLETE.md** - Complete feature summary

## 💡 Remember

1. **GridTable = Custom Layouts** with cell merging
2. **Price Table = Data Lists** with automatic rows
3. **Ctrl+C = Clone**, **Delete = Remove**
4. **Inline controls** for quick edits
5. **Properties panel** for detailed configuration
6. **Preview mode** to see final result with data

---

*Created for Invoice Designer Engine - GridTable Component Implementation*
