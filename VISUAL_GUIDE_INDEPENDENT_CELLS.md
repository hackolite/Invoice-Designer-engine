# Visual Guide: Independent Cell Storage in Invoice Tables

## Overview

This guide provides a visual representation of how invoice table cells are stored and updated independently.

---

## Data Structure Visualization

```
Invoice Table Element
│
├── tableConfig
│   │
│   ├── columns[]                    ← Column definitions (shared structure)
│   │   └── { header, binding, width, format }
│   │
│   ├── headerInlineData[]           ← HEADER CELLS (independent)
│   │   └── { col: number, content: string }
│   │
│   ├── inlineData[]                 ← BODY/ITEM CELLS (independent)
│   │   └── { row: number, col: number, content: string }
│   │
│   ├── footerInlineData[]           ← FOOTER CELLS (independent)
│   │   └── { row: number, field: 'label'|'value', content: string }
│   │
│   ├── headerStyles[]               ← Header styling (independent)
│   ├── cellStyles[]                 ← Body styling (independent)
│   └── footerStyles[]               ← Footer styling (independent)
```

---

## Visual Table Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Invoice Table                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HEADER ROW (stored in: headerInlineData[])                  │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ Header 0 │ Header 1 │ Header 2 │ Header 3 │              │
│  │  {col:0} │  {col:1} │  {col:2} │  {col:3} │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                               │
│  ─────────────────────────────────────────────               │
│                                                               │
│  BODY ROWS (stored in: inlineData[])                         │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │  Cell    │  Cell    │  Cell    │  Cell    │  ← Row 0    │
│  │ {r:0,c:0}│ {r:0,c:1}│ {r:0,c:2}│ {r:0,c:3}│              │
│  ├──────────┼──────────┼──────────┼──────────┤              │
│  │  Cell    │  Cell    │  Cell    │  Cell    │  ← Row 1    │
│  │ {r:1,c:0}│ {r:1,c:1}│ {r:1,c:2}│ {r:1,c:3}│              │
│  ├──────────┼──────────┼──────────┼──────────┤              │
│  │  Cell    │  Cell    │  Cell    │  Cell    │  ← Row 2    │
│  │ {r:2,c:0}│ {r:2,c:1}│ {r:2,c:2}│ {r:2,c:3}│              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│      ↑          ↑          ↑          ↑                      │
│    Column    Column    Column    Column                      │
│      0          1          2          3                      │
│  (Edits propagate down each column)                          │
│                                                               │
│  ─────────────────────────────────────────────               │
│                                                               │
│  FOOTER ROWS (stored in: footerInlineData[])                 │
│  ┌──────────────────────┬──────────────────────┐            │
│  │ Label (Subtotal)     │ Value ($2,500.00)    │ ← Row 0   │
│  │ {r:0, field:'label'} │ {r:0, field:'value'} │            │
│  ├──────────────────────┼──────────────────────┤            │
│  │ Label (Tax 10%)      │ Value ($250.00)      │ ← Row 1   │
│  │ {r:1, field:'label'} │ {r:1, field:'value'} │            │
│  ├──────────────────────┼──────────────────────┤            │
│  │ Label (Total)        │ Value ($2,750.00)    │ ← Row 2   │
│  │ {r:2, field:'label'} │ {r:2, field:'value'} │            │
│  └──────────────────────┴──────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Cell Update Flow Diagrams

### 1. Header Cell Edit (Independent)

```
User edits Header Cell in Column 1
         │
         ↓
┌────────────────────────┐
│ createHeaderCellBlur   │
│ Handler(col: 1)        │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ Find in headerInline   │
│ Data: {col: 1}         │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ Update headerInline    │
│ Data[col: 1]           │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ onElementUpdate()      │
│ • headerInlineData ✓   │
│ • inlineData ✗         │  ← Body cells NOT affected
│ • footerInlineData ✗   │  ← Footer cells NOT affected
└────────────────────────┘
         │
         ↓
    ONLY Header Cell in Column 1 re-renders
```

### 2. Footer Cell Edit (Independent)

```
User edits Footer Value in Row 1
         │
         ↓
┌────────────────────────┐
│ createFooterCellBlur   │
│ Handler(row: 1,        │
│         field: 'value')│
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ Find in footerInline   │
│ Data: {row: 1,         │
│        field: 'value'} │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ Update footerInline    │
│ Data[row: 1,           │
│      field: 'value']   │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ onElementUpdate()      │
│ • headerInlineData ✗   │  ← Header cells NOT affected
│ • inlineData ✗         │  ← Body cells NOT affected
│ • footerInlineData ✓   │
└────────────────────────┘
         │
         ↓
    ONLY Footer Value Cell in Row 1 re-renders
```

### 3. Body Cell Edit (With Column Propagation)

```
User edits Body Cell at Row 0, Column 1
         │
         ↓
┌────────────────────────┐
│ createCellBlurHandler  │
│ (row: 0, col: 1)       │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ Update inlineData      │
│ [{row: 0, col: 1}]     │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ COLUMN PROPAGATION     │
│ Loop all rows in col 1:│
│ • row: 1, col: 1       │
│ • row: 2, col: 1       │
│ • ...                  │
└────────────────────────┘
         │
         ↓
┌────────────────────────┐
│ onElementUpdate()      │
│ • headerInlineData ✗   │  ← Header NOT affected
│ • inlineData ✓         │  ← ALL body cells in col 1
│ • footerInlineData ✗   │  ← Footer NOT affected
└────────────────────────┘
         │
         ↓
    ALL Body Cells in Column 1 re-render
    (Header and Footer in Column 1 stay unchanged)
```

---

## Binding Update Isolation

### Header Binding Change

```
User changes Header Binding in Column 1
         │
         ↓
┌────────────────────────────────┐
│ handleInvoiceTableHeader       │
│ BindingUpdate(col: 1)          │
└────────────────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ getClearedTableConfigFor       │
│ HeaderBinding()                │
│                                │
│ Clears ONLY:                   │
│ • headerInlineData[] ✓         │
│ • headerStyles[] ✓             │
│                                │
│ Preserves:                     │
│ • inlineData[] ✗               │
│ • footerInlineData[] ✗         │
│ • cellStyles[] ✗               │
│ • footerStyles[] ✗             │
└────────────────────────────────┘
         │
         ↓
    Header cells reset
    Body and Footer cells preserved
```

### Body Binding Change

```
User changes Body Binding in Column 1
         │
         ↓
┌────────────────────────────────┐
│ handleInvoiceTableCell         │
│ BindingUpdate(col: 1)          │
└────────────────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ getClearedTableConfigFor       │
│ BodyBinding()                  │
│                                │
│ Clears ONLY:                   │
│ • inlineData[] ✓               │
│ • cellStyles[] ✓               │
│ • colWidths ✓                  │
│                                │
│ Preserves:                     │
│ • headerInlineData[] ✗         │
│ • footerInlineData[] ✗         │
│ • headerStyles[] ✗             │
│ • footerStyles[] ✗             │
└────────────────────────────────┘
         │
         ↓
    Body cells reset
    Header and Footer cells preserved
```

### Footer Binding Change

```
User changes Footer Binding in Row 1
         │
         ↓
┌────────────────────────────────┐
│ handleInvoiceTableFooter       │
│ BindingUpdate(row: 1)          │
└────────────────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ getClearedTableConfigFor       │
│ FooterBinding()                │
│                                │
│ Clears ONLY:                   │
│ • footerInlineData[] ✓         │
│ • footerStyles[] ✓             │
│                                │
│ Preserves:                     │
│ • headerInlineData[] ✗         │
│ • inlineData[] ✗               │
│ • headerStyles[] ✗             │
│ • cellStyles[] ✗               │
└────────────────────────────────┘
         │
         ↓
    Footer cells reset
    Header and Body cells preserved
```

---

## Independence Matrix (Visual)

```
┌─────────────────────┬──────────┬──────────┬──────────┐
│ Action              │  Header  │   Body   │  Footer  │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Edit Header Cell    │    ✓     │    ✗     │    ✗     │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Edit Body Cell      │    ✗     │    ✓*    │    ✗     │
│ (* column propagate)│          │          │          │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Edit Footer Cell    │    ✗     │    ✗     │    ✓     │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Change Header       │    ✓     │    ✗     │    ✗     │
│ Binding             │ (clears) │          │          │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Change Body         │    ✗     │    ✓     │    ✗     │
│ Binding             │          │ (clears) │          │
├─────────────────────┼──────────┼──────────┼──────────┤
│ Change Footer       │    ✗     │    ✗     │    ✓     │
│ Binding             │          │          │ (clears) │
└─────────────────────┴──────────┴──────────┴──────────┘

Legend:
  ✓ = Affected
  ✗ = NOT affected
  * = Special behavior (column propagation)
```

---

## Key Takeaways

### ✅ Header Cells
- **Storage**: `headerInlineData[]` with key `{col}`
- **Independence**: Edits affect only header, not body or footer
- **Unique ID**: Column index only

### ✅ Footer Cells
- **Storage**: `footerInlineData[]` with key `{row, field}`
- **Independence**: Edits affect only footer, not header or body
- **Unique ID**: Row index + field type ('label' or 'value')

### ✅ Body/Item Cells
- **Storage**: `inlineData[]` with key `{row, col}`
- **Independence**: Edits affect only body, not header or footer
- **Special**: Column propagation (all rows in same column)
- **Unique ID**: Row index + column index

### ✅ No Cross-Contamination
- Three separate data arrays
- Three separate update handlers
- Three separate clearing functions
- Complete isolation between cell types

---

## Implementation Location

All code in: `client/src/components/Canvas.tsx`

- **Lines 272-341**: Body cell handler
- **Lines 344-382**: Header cell handler
- **Lines 385-424**: Footer cell handler
- **Lines 774-799**: Isolation helper functions

---

**Status:** ✅ VERIFIED - All cells are independent  
**Date:** 2026-02-07
