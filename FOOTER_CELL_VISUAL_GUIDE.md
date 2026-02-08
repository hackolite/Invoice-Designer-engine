# Visual Guide: Footer Cell Independent Storage

## Overview

This document provides a visual explanation of how footer cells in invoice tables are stored independently.

---

## 📊 Data Structure

### Storage in Memory

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLE CONFIG                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  headerInlineData: [...]      ← Header cells               │
│                                                             │
│  inlineData: [...]            ← Body cells                 │
│                                                             │
│  footerInlineData: [          ← Footer cells (INDEPENDENT) │
│    { row: 0, field: 'label', content: 'Sous-total' }      │
│    { row: 0, field: 'value', content: '$2,500.00' }       │
│    { row: 1, field: 'label', content: 'TVA' }             │
│    { row: 1, field: 'value', content: '$250.00' }         │
│    { row: 1, field: 'middle', col: 1, content: 'Info' }   │
│    { row: 2, field: 'label', content: 'Total' }           │
│    { row: 2, field: 'value', content: '$3,000.00' }       │
│  ]                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Visual Representation

```
┌────────────────────────────────────────────────────────────────┐
│                    INVOICE TABLE                              │
├───────────┬──────────┬────────┬────────┬──────────────────────┤
│ Header 1  │ Header 2 │ Hdr 3  │ Hdr 4  │ Header 5             │
├───────────┼──────────┼────────┼────────┼──────────────────────┤
│ Body      │ Body     │ Body   │ Body   │ Body                 │
│ Cell      │ Cell     │ Cell   │ Cell   │ Cell                 │
├───────────┴──────────┴────────┴────────┴──────────────────────┤
│ FOOTER ROW 0                                                  │
├───────────┬──────────┬────────┬────────┬──────────────────────┤
│ Label     │ Middle 1 │ Mid 2  │ Mid 3  │ Value                │
│ "Sous-    │          │        │        │ "$2,500.00"          │
│  total"   │          │        │        │                      │
│           │          │        │        │                      │
│ Key:      │ Key:     │ Key:   │ Key:   │ Key:                 │
│ {0,       │ {0,      │ {0,    │ {0,    │ {0,                  │
│  'label'} │  'middle'│'middle'│'middle'│  'value'}            │
│           │  col:1}  │ col:2} │ col:3} │                      │
├───────────┼──────────┼────────┼────────┼──────────────────────┤
│ FOOTER ROW 1                                                  │
├───────────┼──────────┼────────┼────────┼──────────────────────┤
│ Label     │ Middle 1 │ Mid 2  │ Mid 3  │ Value                │
│ "TVA"     │ "Info"   │        │        │ "$250.00"            │
│           │          │        │        │                      │
│ Key:      │ Key:     │        │        │ Key:                 │
│ {1,       │ {1,      │        │        │ {1,                  │
│  'label'} │  'middle'│        │        │  'value'}            │
│           │  col:1}  │        │        │                      │
└───────────┴──────────┴────────┴────────┴──────────────────────┘
```

---

## 🔧 Update Flow

### Scenario: User Edits Footer Row 0, Label Cell

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User clicks on label cell in row 0                    │
│         Current: "Subtotal"                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: User types "Sous-total" and presses Enter             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: onBlur event fires                                     │
│         → createFooterCellBlurHandler(row=0, field='label')    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Find cell in footerInlineData                         │
│         → Search for: cell.row === 0 && cell.field === 'label'│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Update ONLY this cell                                 │
│                                                                │
│   Before:                                                      │
│   footerInlineData: []                                         │
│                                                                │
│   After:                                                       │
│   footerInlineData: [                                          │
│     { row: 0, field: 'label', content: 'Sous-total' }         │
│   ]                                                            │
│                                                                │
│   ✅ Row 0 value cell: UNCHANGED                              │
│   ✅ Row 1 label cell: UNCHANGED                              │
│   ✅ Row 1 value cell: UNCHANGED                              │
│   ✅ Header cells: UNCHANGED                                  │
│   ✅ Body cells: UNCHANGED                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Re-render ONLY the edited cell                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Independence Test Matrix

### Test: Edit Different Cells

```
Initial State:
┌─────────────────────────────────────────────────────────┐
│ footerInlineData: []  (empty - no edits yet)           │
└─────────────────────────────────────────────────────────┘

Edit 1: Row 0, Label → "Sous-total"
┌─────────────────────────────────────────────────────────┐
│ footerInlineData: [                                    │
│   { row: 0, field: 'label', content: 'Sous-total' }   │
│ ]                                                       │
│                                                         │
│ ✅ Length: 1 (only 1 cell added)                       │
└─────────────────────────────────────────────────────────┘

Edit 2: Row 0, Value → "$2,500.00"
┌─────────────────────────────────────────────────────────┐
│ footerInlineData: [                                    │
│   { row: 0, field: 'label', content: 'Sous-total' },  │ ← PRESERVED
│   { row: 0, field: 'value', content: '$2,500.00' }    │ ← NEW
│ ]                                                       │
│                                                         │
│ ✅ Length: 2 (label preserved, value added)            │
└─────────────────────────────────────────────────────────┘

Edit 3: Row 1, Label → "TVA"
┌─────────────────────────────────────────────────────────┐
│ footerInlineData: [                                    │
│   { row: 0, field: 'label', content: 'Sous-total' },  │ ← PRESERVED
│   { row: 0, field: 'value', content: '$2,500.00' },   │ ← PRESERVED
│   { row: 1, field: 'label', content: 'TVA' }          │ ← NEW
│ ]                                                       │
│                                                         │
│ ✅ Length: 3 (row 0 cells preserved, row 1 added)      │
└─────────────────────────────────────────────────────────┘
```

### Independence Verification

| Edit Action | Row 0 Label | Row 0 Value | Row 1 Label | Row 1 Value |
|-------------|-------------|-------------|-------------|-------------|
| Initial     | -           | -           | -           | -           |
| Edit R0 L   | ✓ Updated   | - Unchanged | - Unchanged | - Unchanged |
| Edit R0 V   | ✓ Preserved | ✓ Updated   | - Unchanged | - Unchanged |
| Edit R1 L   | ✓ Preserved | ✓ Preserved | ✓ Updated   | - Unchanged |
| Edit R1 V   | ✓ Preserved | ✓ Preserved | ✓ Preserved | ✓ Updated   |

**Legend:** ✓ = Modified, - = Unchanged

---

## 📄 PDF/Preview Rendering

### Rendering Flow

```
┌────────────────────────────────────────────────────────────┐
│ renderElementForExport(config, sampleData, isPreviewMode) │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Step 1: Build Map from footerInlineData                   │
│                                                            │
│   const inlineDataMap = new Map();                         │
│   footerInlineData.forEach(cell => {                       │
│     if (cell.field === 'middle') {                         │
│       inlineDataMap.set(                                   │
│         `${cell.row}-${cell.field}-${cell.col}`,          │
│         cell.content                                       │
│       );                                                   │
│     } else {                                               │
│       inlineDataMap.set(                                   │
│         `${cell.row}-${cell.field}`,                      │
│         cell.content                                       │
│       );                                                   │
│     }                                                      │
│   });                                                      │
│                                                            │
│   Result: O(1) lookups                                    │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│ Step 2: For each footer row, render cells independently   │
│                                                            │
│   For row 0:                                               │
│     labelKey = "0-label"                                   │
│     valueKey = "0-value"                                   │
│                                                            │
│     inlineLabel = inlineDataMap.get(labelKey)              │
│     inlineValue = inlineDataMap.get(valueKey)              │
│                                                            │
│   Priority:                                                │
│   1. Inline edit (if exists)                               │
│   2. Binding resolution (if preview mode)                  │
│   3. Original value                                        │
└────────────────────────────────────────────────────────────┘
```

### Example: Row 0 Rendering

```
Configuration:
  footerRows[0] = { label: 'Subtotal', value: '{subtotal}', format: 'currency' }
  
Inline Edits:
  footerInlineData = [
    { row: 0, field: 'label', content: 'Sous-total' }
  ]

Sample Data:
  { subtotal: 2500 }

Edit Mode (isPreviewMode = false):
  ┌─────────────────┬──────────────┐
  │ Label           │ Value        │
  ├─────────────────┼──────────────┤
  │ "Sous-total"    │ "{subtotal}" │ ← Shows binding syntax
  │ (inline edit)   │ (original)   │
  └─────────────────┴──────────────┘

Preview Mode (isPreviewMode = true):
  ┌─────────────────┬──────────────┐
  │ Label           │ Value        │
  ├─────────────────┼──────────────┤
  │ "Sous-total"    │ "$2,500.00"  │ ← Resolves binding
  │ (inline edit)   │ (binding →   │
  │                 │  currency)   │
  └─────────────────┴──────────────┘
```

---

## ✅ Test Results Summary

### Test 1: Storage Independence
```
┌────────────────────────────────────────────────┐
│ ✅ Update label: only label affected          │
│ ✅ Update value: only value affected          │
│ ✅ Different row: rows independent            │
│ ✅ Middle cells: independent from label/value │
│ ✅ Update existing: no duplicates created     │
└────────────────────────────────────────────────┘
```

### Test 2: Rendering Correctness
```
┌────────────────────────────────────────────────┐
│ ✅ Edit mode: shows inline edits correctly    │
│ ✅ Preview mode: resolves bindings correctly  │
│ ✅ Independence: only edited cells affected   │
│ ✅ Pure bindings: works without inline edits  │
│ ✅ Performance: O(1) Map lookups              │
└────────────────────────────────────────────────┘
```

---

## 🔑 Key Takeaways

1. **Unique Keys:** Each cell has a unique identifier
   - Label: `{row, 'label'}`
   - Value: `{row, 'value'}`
   - Middle: `{row, 'middle', col}`

2. **No Shared References:** Each cell stored independently in array

3. **Independent Updates:** Editing one cell doesn't affect others

4. **Correct Rendering:** PDF and preview retrieve values correctly

5. **High Performance:** Map-based lookups provide O(1) access

---

**Status:** ✅ All requirements verified and met  
**Date:** 2026-02-07
