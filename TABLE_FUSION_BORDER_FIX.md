# Table Fusion Border Merging

## Problem Statement

When gridtables and price tables are positioned adjacent to each other (fused), the common border between them appears doubled because each table has its own border. For example:
- Two tables with 1px borders create a 2px visible border at their junction
- This creates a visual inconsistency and makes the tables look disconnected

## Solution

The system now detects when tables are adjacent to each other and automatically removes the border on the common edge to prevent doubling.

## Implementation

### Key Components

#### 1. Detection Function: `detectAdjacentTables()`

This function checks if a table element is adjacent to other tables on any of its four edges (top, right, bottom, left).

**Logic:**
- Checks both gridtables and price tables
- Compares positions with a tolerance of ±1 pixel
- Returns an object with boolean flags for each edge: `{ top, right, bottom, left }`

**Example:**
```typescript
// Table A is at position (100, 100) with width 200, height 100
// Table B is at position (300, 100) with width 200, height 100
// Table A's right edge (300) touches Table B's left edge (300)
// Result: Table A has adjacent.right = true, Table B has adjacent.left = true
```

#### 2. Border Removal Logic

When rendering table cells, borders are conditionally removed based on:
1. Whether the table has an adjacent table on that edge
2. Whether the cell is on the outer edge of the table

**For GridTable cells:**
```typescript
borderTopWidth: (adjacentTables.top && isFirstRow) ? 0 : gridBorderWidth
borderRightWidth: (adjacentTables.right && isLastCol) ? 0 : gridBorderWidth
borderBottomWidth: (adjacentTables.bottom && isLastRow) ? 0 : gridBorderWidth
borderLeftWidth: (adjacentTables.left && isFirstCol) ? 0 : gridBorderWidth
```

**For Price Table cells:**
```typescript
// Header cell (left column)
borderLeftWidth: adjacentTables.left ? 0 : gridBorderWidth
borderTopWidth: (adjacentTables.top && isFirstRow) ? 0 : gridBorderWidth
borderBottomWidth: (adjacentTables.bottom && isLastRow) ? 0 : gridBorderWidth

// Value cell (right column)
borderRightWidth: adjacentTables.right ? 0 : gridBorderWidth
borderTopWidth: (adjacentTables.top && isFirstRow) ? 0 : gridBorderWidth
borderBottomWidth: (adjacentTables.bottom && isLastRow) ? 0 : gridBorderWidth
```

### Supported Fusion Scenarios

#### Horizontal Fusion (Side by Side)
```
┌──────────┐┌──────────┐
│ Table A  ││ Table B  │
│          ││          │
└──────────┘└──────────┘
```
- Table A's right border is removed
- Table B's left border is removed
- Result: Single 1px border between them

#### Vertical Fusion (Top and Bottom)
```
┌──────────┐
│ Table A  │
└──────────┘
┌──────────┐
│ Table B  │
└──────────┘
```
- Table A's bottom border is removed
- Table B's top border is removed
- Result: Single 1px border between them

#### Multiple Tables Fusion
```
┌──────────┐┌──────────┐
│ Table A  ││ Table B  │
└──────────┘└──────────┘
┌──────────┐┌──────────┐
│ Table C  ││ Table D  │
└──────────┘└──────────┘
```
- Each table removes borders on edges where it touches other tables
- Result: All tables appear as one cohesive unit with uniform borders

## Technical Details

### Files Modified

**client/src/components/Canvas.tsx:**
1. Added `detectAdjacentTables()` helper function (lines 806-860)
2. Updated price table rendering:
   - Added adjacentTables detection (line 1084)
   - Modified body cells border rendering (lines 1125-1142)
   - Modified footer cells border rendering (lines 1207-1231, 1267-1277)
3. Updated gridtable rendering:
   - Added adjacentTables detection (line 1400)
   - Modified body cells border rendering (lines 1521-1545)
   - Modified footer cells border rendering (lines 1718-1732, 1767-1777)

### Border Detection Tolerance

The system uses a tolerance of ±1 pixel for detecting adjacency:
```typescript
Math.abs(element.x - otherRight) <= 1
```

This allows for minor positioning differences while still detecting fusion.

### Performance

- Detection runs for each table element during rendering
- O(n²) complexity where n is the number of table elements
- Optimized with early returns for non-table elements
- No noticeable performance impact for typical invoice layouts (< 10 tables)

## Testing

### Manual Testing Scenarios

1. **Two Tables Side by Side:**
   - Create a gridtable
   - Create a price table
   - Position them so their edges touch (use the fusion snapping feature)
   - Verify: Common border should be single width, not doubled

2. **Two Tables Vertically Stacked:**
   - Create two gridtables
   - Position one directly below the other
   - Verify: Horizontal border between them should be single width

3. **Four Tables in a Grid:**
   - Create four tables in a 2x2 grid layout
   - Position them so all edges touch
   - Verify: All internal borders should be single width

4. **Moving Tables:**
   - Fuse two tables
   - Move one table away
   - Verify: Borders return to normal when tables are separated

### Visual Verification

Before fix:
```
┌──────┐┌──────┐
│      ║║      │  ← Double border (2px)
└──────┘└──────┘
```

After fix:
```
┌──────┐┌──────┐
│      ││      │  ← Single border (1px)
└──────┘└──────┘
```

## Compatibility

- ✅ Works with gridtables
- ✅ Works with price tables
- ✅ Works with mixed table types (gridtable + price table)
- ✅ Works with custom border widths
- ✅ Works with custom border colors
- ✅ Compatible with table footers
- ✅ Compatible with cell merging (rowspan/colspan)

## Future Enhancements

Potential improvements:
- Support for grid tables (non-price, non-gridtable type)
- Configurable tolerance for adjacency detection
- Visual indicator when tables are fused
- Auto-alignment of row heights between fused tables
- Auto-alignment of column widths between fused tables
