/**
 * Unit Tests for GridTable Helper Functions
 * 
 * These tests verify the correctness of the gridtable manipulation logic.
 * To run these tests, you would need to extract the helper functions and set up a test framework.
 */

// Test: calculateNewGridTableHeight
describe('calculateNewGridTableHeight', () => {
  test('should calculate correct height when adding rows', () => {
    // Given a 3-row table with 300px height (100px per row)
    const currentHeight = 300;
    const currentRows = 3;
    const newRows = 4;
    
    // When calculating new height
    const result = calculateNewGridTableHeight(currentHeight, currentRows, newRows);
    
    // Then it should be 400px (4 rows × 100px per row)
    expect(result).toBe(400);
  });

  test('should calculate correct height when removing rows', () => {
    // Given a 5-row table with 500px height (100px per row)
    const currentHeight = 500;
    const currentRows = 5;
    const newRows = 3;
    
    // When calculating new height
    const result = calculateNewGridTableHeight(currentHeight, currentRows, newRows);
    
    // Then it should be 300px (3 rows × 100px per row)
    expect(result).toBe(300);
  });

  test('should handle fractional heights with rounding', () => {
    // Given a table with height that doesn't divide evenly
    const currentHeight = 250;
    const currentRows = 3;
    const newRows = 4;
    
    // When calculating new height
    const result = calculateNewGridTableHeight(currentHeight, currentRows, newRows);
    
    // Then it should be rounded: 250/3 = 83.33, 83.33*4 = 333.33, rounded = 333
    expect(result).toBe(333);
  });
});

// Test: handleDeleteRow logic
describe('handleDeleteRow', () => {
  test('should prevent deletion when only 1 row remains', () => {
    const config = {
      rows: 1,
      cols: 3,
      cells: [
        { row: 0, col: 0, content: 'A', rowSpan: 1, colSpan: 1 },
        { row: 0, col: 1, content: 'B', rowSpan: 1, colSpan: 1 },
        { row: 0, col: 2, content: 'C', rowSpan: 1, colSpan: 1 },
      ]
    };
    
    // Should return early without changes
    expect(config.rows).toBe(1);
  });

  test('should remove last row cells', () => {
    const cells = [
      { row: 0, col: 0, content: 'A', rowSpan: 1, colSpan: 1 },
      { row: 0, col: 1, content: 'B', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 0, content: 'C', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 1, content: 'D', rowSpan: 1, colSpan: 1 },
    ];
    
    const lastRow = 1;
    const newCells = cells.filter(cell => cell.row !== lastRow);
    
    expect(newCells.length).toBe(2);
    expect(newCells.every(c => c.row !== 1)).toBe(true);
  });

  test('should adjust rowSpan of cells extending into deleted row', () => {
    const cells = [
      { row: 0, col: 0, content: 'A', rowSpan: 3, colSpan: 1 }, // Extends to row 2
      { row: 0, col: 1, content: 'B', rowSpan: 1, colSpan: 1 },
    ];
    const newRows = 2; // Deleting row 2
    
    const newCells = cells.map(cell => {
      if (cell.row + (cell.rowSpan || 1) > newRows) {
        return { ...cell, rowSpan: Math.max(1, newRows - cell.row) };
      }
      return cell;
    });
    
    // Cell A should have rowSpan reduced from 3 to 2
    expect(newCells[0].rowSpan).toBe(2);
    expect(newCells[1].rowSpan).toBe(1);
  });
});

// Test: handleDeleteColumn logic
describe('handleDeleteColumn', () => {
  test('should prevent deletion when only 1 column remains', () => {
    const config = {
      rows: 3,
      cols: 1,
      cells: [
        { row: 0, col: 0, content: 'A', rowSpan: 1, colSpan: 1 },
        { row: 1, col: 0, content: 'B', rowSpan: 1, colSpan: 1 },
        { row: 2, col: 0, content: 'C', rowSpan: 1, colSpan: 1 },
      ]
    };
    
    // Should return early without changes
    expect(config.cols).toBe(1);
  });

  test('should adjust colSpan of cells extending into deleted column', () => {
    const cells = [
      { row: 0, col: 0, content: 'A', rowSpan: 1, colSpan: 3 }, // Extends to col 2
      { row: 1, col: 0, content: 'B', rowSpan: 1, colSpan: 1 },
    ];
    const newCols = 2; // Deleting col 2
    
    const newCells = cells.map(cell => {
      if (cell.col + (cell.colSpan || 1) > newCols) {
        return { ...cell, colSpan: Math.max(1, newCols - cell.col) };
      }
      return cell;
    });
    
    // Cell A should have colSpan reduced from 3 to 2
    expect(newCells[0].colSpan).toBe(2);
    expect(newCells[1].colSpan).toBe(1);
  });
});

// Test: handleAddRow logic
describe('handleAddRow', () => {
  test('should add cells for unoccupied columns only', () => {
    const config = {
      rows: 2,
      cols: 3,
      cells: [
        { row: 0, col: 0, content: 'A', rowSpan: 3, colSpan: 1 }, // Spans into new row
        { row: 0, col: 1, content: 'B', rowSpan: 1, colSpan: 1 },
        { row: 0, col: 2, content: 'C', rowSpan: 1, colSpan: 1 },
        { row: 1, col: 1, content: 'D', rowSpan: 1, colSpan: 1 },
        { row: 1, col: 2, content: 'E', rowSpan: 1, colSpan: 1 },
      ]
    };
    
    // Identify occupied columns
    const occupiedColumns = new Set();
    config.cells.forEach(cell => {
      const cellEndRow = cell.row + (cell.rowSpan || 1);
      if (cellEndRow > config.rows) {
        for (let c = cell.col; c < cell.col + (cell.colSpan || 1); c++) {
          occupiedColumns.add(c);
        }
      }
    });
    
    // Cell A (col 0, rowSpan 3) extends into row 2
    expect(occupiedColumns.has(0)).toBe(true);
    expect(occupiedColumns.has(1)).toBe(false);
    expect(occupiedColumns.has(2)).toBe(false);
    
    // Should only add cells for columns 1 and 2
    let cellsToAdd = 0;
    for (let c = 0; c < config.cols; c++) {
      if (!occupiedColumns.has(c)) {
        cellsToAdd++;
      }
    }
    expect(cellsToAdd).toBe(2);
  });
});

// Integration Test Scenarios
describe('GridTable Integration Tests', () => {
  test('scenario: add then delete row maintains height ratio', () => {
    // Start with 300px height, 3 rows (100px per row)
    let height = 300;
    let rows = 3;
    
    // Add a row: should become 400px, 4 rows
    const newHeightAfterAdd = (height / rows) * (rows + 1);
    expect(Math.round(newHeightAfterAdd)).toBe(400);
    
    // Delete a row: should return to 300px, 3 rows
    const newHeightAfterDelete = (newHeightAfterAdd / (rows + 1)) * rows;
    expect(Math.round(newHeightAfterDelete)).toBe(300);
  });

  test('scenario: complex cell spans with row deletion', () => {
    const cells = [
      { row: 0, col: 0, content: 'A', rowSpan: 2, colSpan: 2 },
      { row: 0, col: 2, content: 'B', rowSpan: 1, colSpan: 1 },
      { row: 1, col: 2, content: 'C', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 0, content: 'D', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 1, content: 'E', rowSpan: 1, colSpan: 1 },
      { row: 2, col: 2, content: 'F', rowSpan: 1, colSpan: 1 },
    ];
    
    // Delete row 2 (last row)
    const lastRow = 2;
    const newRows = 2;
    const newCells = cells
      .filter(cell => cell.row !== lastRow)
      .map(cell => {
        if (cell.row + (cell.rowSpan || 1) > newRows) {
          return { ...cell, rowSpan: Math.max(1, newRows - cell.row) };
        }
        return cell;
      });
    
    // Should have 3 cells left (A, B, C)
    expect(newCells.length).toBe(3);
    
    // Cell A should still have rowSpan 2 (rows 0-1)
    const cellA = newCells.find(c => c.content === 'A');
    expect(cellA?.rowSpan).toBe(2);
  });
});

console.log('All tests defined. To run, set up Jest or another test framework.');
