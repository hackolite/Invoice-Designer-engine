import { Rnd } from "react-rnd";
import { type TemplateElement, type TemplateLayout } from "@shared/schema";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Ruler, Copy, Plus, Grid3x3, Columns, Rows, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Trash2, Database } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";

// Constants for table height normalization
const HEIGHT_NORMALIZATION_THRESHOLD = 0.5; // Threshold in pixels for detecting height mismatches
const INVOICE_TABLE_EDITOR_DATA_ROWS = 3; // Fixed number of sample data rows displayed in editor for invoice tables

// Simple lodash.get alternative for binding resolution
function getValue(obj: any, path: string, defaultValue?: any) {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === undefined || result === null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

// Normalize row heights to fit exactly within container using integer pixels
// This prevents floating-point rounding gaps between fused tables
function normalizeRowHeights(rowHeights: number[], containerHeight: number): number[] {
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  
  // Only normalize if there's a significant difference
  if (totalHeight > 0 && Math.abs(totalHeight - containerHeight) > HEIGHT_NORMALIZATION_THRESHOLD) {
    const scaleFactor = containerHeight / totalHeight;
    let remainingHeight = containerHeight;
    
    return rowHeights.map((h, i) => {
      if (i === rowHeights.length - 1) {
        // Assign all remaining height to last row to ensure perfect fit
        return remainingHeight;
      }
      const scaledHeight = Math.round(h * scaleFactor);
      remainingHeight -= scaledHeight;
      return scaledHeight;
    });
  }
  
  return rowHeights;
}

// Build JSON data path tree for navigation
// Returns an object with keys as JSON property names and values as either nested objects or full paths
function buildDataPathTree(data: any, currentPath: string = ''): Record<string, any> {
  if (!data || typeof data !== 'object') return {};
  
  const tree: Record<string, any> = {};
  
  for (const key of Object.keys(data)) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const value = data[key];
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Nested object - create submenu
      tree[key] = buildDataPathTree(value, fullPath);
    } else {
      // Leaf node or array - store the full path
      tree[key] = fullPath;
    }
  }
  
  return tree;
}

// Initialize column widths from string widths (e.g., "50%", "25%") to percentages array
// This allows proportional resizing when table width changes
// NOTE: Assumes width values are percentages. Non-percentage widths (e.g., "100px") will be converted to equal distribution.
function initializeColumnWidths(columns: Array<{ width?: string }>): number[] {
  if (!columns || columns.length === 0) return [];
  
  const colWidths: number[] = [];
  let totalAssigned = 0;
  
  for (const col of columns) {
    if (col.width) {
      // Parse percentage from string like "50%" or "25%"
      const match = col.width.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        const percent = parseFloat(match[1]);
        colWidths.push(percent);
        totalAssigned += percent;
      } else {
        // If not a percentage (e.g., fixed pixels), distribute equally
        colWidths.push(100 / columns.length);
      }
    } else {
      // No width specified, distribute equally
      colWidths.push(100 / columns.length);
    }
  }
  
  // Normalize to ensure sum is exactly 100%
  if (totalAssigned > 0 && Math.abs(totalAssigned - 100) > PERCENTAGE_TOLERANCE) {
    const scale = 100 / totalAssigned;
    return colWidths.map(w => w * scale);
  }
  
  return colWidths;
}

interface CanvasProps {
  layout: TemplateLayout;
  sampleData: any;
  selectedElementIds: string[];
  onElementSelect: (ids: string[], isMultiSelect: boolean) => void;
  onElementUpdate: (id: string, updates: Partial<TemplateElement>) => void;
  onClone: (id: string) => void;
  isPreviewMode: boolean;
  scale?: number;
}

// A4 Dimensions in pixels at 96 DPI (approx)
// A4 is 210mm x 297mm. 
// 1mm = 3.78px
const PAGE_WIDTH = 794;  // 210mm * 3.78
const PAGE_HEIGHT = 1123; // 297mm * 3.78
const GRID_SIZE = 10;
const TOOLBAR_HEIGHT = 56; // Height of inline toolbar (14 * 4px for -bottom-14 or -top-14)

// GridTable constraints and settings
const MIN_ROW_HEIGHT = 20; // Minimum height for a row in pixels
const MIN_COL_WIDTH_PERCENT = 5; // Minimum width for a column as percentage
const FUSION_THRESHOLD = 15; // Distance in pixels for table fusion snapping
const RESIZE_HANDLE_SIZE = 4; // Size of resize handle in pixels
const RESIZE_HANDLE_OFFSET = 2; // Offset for centering resize handle in pixels
const ALIGNMENT_TOLERANCE = 1.5; // Tolerance in pixels for detecting table alignment during fusion

// Table column width constants
const PERCENTAGE_TOLERANCE = 0.01; // Tolerance for floating-point percentage comparison
const DEFAULT_PRICE_TABLE_COL_WIDTHS = [50, 50]; // Price tables always have 2 columns: label (50%) and value (50%)

// Default footer row for price tables (used when adding summary rows inline)
const DEFAULT_FOOTER_ROW = { label: "Total", value: "{total}", format: 'currency' as const };

// Helper function to determine toolbar positioning based on available space
function getToolbarPositionClass(element: TemplateElement, pageHeight: number): string {
  const tableBottom = element.y + element.height;
  const spaceBelow = pageHeight - tableBottom;
  return spaceBelow < TOOLBAR_HEIGHT ? "-top-14" : "-bottom-14";
}

export function Canvas({
  layout,
  sampleData,
  selectedElementIds,
  onElementSelect,
  onElementUpdate,
  onClone,
  isPreviewMode,
  scale = 1
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ elementId: string; row: number; col: number } | null>(null);
  const [contextMenuCell, setContextMenuCell] = useState<{ elementId: string; row: number; col: number } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{ elementId: string; row: number } | null>(null);
  const [selectedRow, setSelectedRow] = useState<{ elementId: string; row: number } | null>(null);
  const [resizingBorder, setResizingBorder] = useState<{ elementId: string; type: 'row' | 'col'; index: number; startPos: number; startSize: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editingTextElement, setEditingTextElement] = useState<string | null>(null);
  const [editingAdditionalRowCell, setEditingAdditionalRowCell] = useState<{ elementId: string; additionalRowIdx: number; field: 'label' | 'value' } | null>(null);

  // Handle resize border dragging
  useEffect(() => {
    if (!resizingBorder) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingBorder) return;
      
      const element = layout.elements.find(el => el.id === resizingBorder.elementId);
      if (!element) return;

      // Handle GridTable resizing
      if (element.gridTableConfig) {
        if (resizingBorder.type === 'row') {
          const delta = e.clientY - resizingBorder.startPos;
          const newHeight = Math.max(20, resizingBorder.startSize + delta / scale);
          handleRowHeightResize(resizingBorder.elementId, resizingBorder.index, newHeight);
        } else if (resizingBorder.type === 'col') {
          const delta = e.clientX - resizingBorder.startPos;
          const elementWidth = element.width;
          const deltaPercent = (delta / scale / elementWidth) * 100;
          const newWidthPercent = resizingBorder.startSize + deltaPercent;
          handleColWidthResize(resizingBorder.elementId, resizingBorder.index, newWidthPercent);
        }
      }
      // Handle PriceTable resizing
      else if (element.tableConfig && element.tableConfig.tableType === 'price') {
        if (resizingBorder.type === 'row') {
          const delta = e.clientY - resizingBorder.startPos;
          const newHeight = Math.max(20, resizingBorder.startSize + delta / scale);
          handlePriceTableRowHeightResize(resizingBorder.elementId, resizingBorder.index, newHeight);
        }
      }
      // Handle InvoiceTable resizing (same as price table)
      else if (element.tableConfig && element.tableConfig.tableType === 'invoice') {
        if (resizingBorder.type === 'row') {
          const delta = e.clientY - resizingBorder.startPos;
          const newHeight = Math.max(20, resizingBorder.startSize + delta / scale);
          handlePriceTableRowHeightResize(resizingBorder.elementId, resizingBorder.index, newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setResizingBorder(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingBorder, layout.elements, scale]);

  // Magnetic snap helper
  const snapToGrid = (num: number) => {
    return Math.round(num / GRID_SIZE) * GRID_SIZE;
  };

  // Helper to get cell styles
  const getCellStyle = (cell: any) => ({
    textAlign: (cell?.style?.textAlign as any) || 'left',
    fontWeight: (cell?.style?.fontWeight as any) || 'normal',
    fontStyle: (cell?.style?.fontStyle as any) || 'normal',
    textDecoration: (cell?.style?.textDecoration as string) || 'none',
    fontSize: cell?.style?.fontSize ? `${cell.style.fontSize}px` : '12px',
    color: (cell?.style?.color as string) || 'inherit',
  });

  // Helper functions for gridtable manipulation
  const handleAddRow = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const newRows = config.rows + 1;
    const newCells = [...config.cells];
    
    // Get or initialize heightPerRow to maintain consistent row heights
    // This prevents rounding errors from accumulating when adding multiple rows
    const heightPerRow = config.heightPerRow ?? (element.height / config.rows);
    const newHeight = Math.round(heightPerRow * newRows);
    
    // Track which columns in the new row are already occupied by spanning cells
    const occupiedColumns = new Set<number>();
    
    // Check for cells with rowSpan that extend into the new row
    config.cells.forEach(cell => {
      const cellEndRow = cell.row + (cell.rowSpan || 1);
      if (cellEndRow > config.rows) {
        // This cell spans into the new row, mark its columns as occupied
        for (let c = cell.col; c < cell.col + (cell.colSpan || 1); c++) {
          occupiedColumns.add(c);
        }
      }
    });
    
    // Add cells for the new row only in unoccupied columns
    for (let c = 0; c < config.cols; c++) {
      if (!occupiedColumns.has(c)) {
        newCells.push({
          row: config.rows,
          col: c,
          content: '',
          rowSpan: 1,
          colSpan: 1
        });
      }
    }
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, rows: newRows, cells: newCells, heightPerRow },
      height: newHeight
    });
  };

  const handleAddColumn = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const newCols = config.cols + 1;
    const newCells = [...config.cells];
    
    // Track which rows in the new column are already occupied by spanning cells
    const occupiedRows = new Set<number>();
    
    // Check for cells with colSpan that extend into the new column
    config.cells.forEach(cell => {
      const cellEndCol = cell.col + (cell.colSpan || 1);
      if (cellEndCol > config.cols) {
        // This cell spans into the new column, mark its rows as occupied
        for (let r = cell.row; r < cell.row + (cell.rowSpan || 1); r++) {
          occupiedRows.add(r);
        }
      }
    });
    
    // Add cells for the new column only in unoccupied rows
    for (let r = 0; r < config.rows; r++) {
      if (!occupiedRows.has(r)) {
        newCells.push({
          row: r,
          col: config.cols,
          content: '',
          rowSpan: 1,
          colSpan: 1
        });
      }
    }
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cols: newCols, cells: newCells }
    });
  };

  const handleDeleteRow = (elementId: string, rowIndex?: number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    // Don't allow deleting if only 1 row remains
    if (config.rows <= 1) return;
    
    // Default to last row if no specific row index provided
    const rowToDelete = rowIndex !== undefined ? rowIndex : config.rows - 1;
    const newRows = config.rows - 1;
    
    // Get or initialize heightPerRow to maintain consistent row heights
    const heightPerRow = config.heightPerRow ?? (element.height / config.rows);
    const newHeight = Math.round(heightPerRow * newRows);
    
    // Remove cells from the specified row and adjust other cells
    const newCells = config.cells
      .filter(cell => cell.row !== rowToDelete) // Remove cells that start in the deleted row
      .map(cell => {
        // Shift rows that are after the deleted row up by one
        const newRow = cell.row > rowToDelete ? cell.row - 1 : cell.row;
        
        // Adjust rowSpan if it extends into or past the deleted row
        let newRowSpan = cell.rowSpan || 1;
        if (cell.row < rowToDelete && cell.row + newRowSpan > rowToDelete) {
          // Cell starts before deleted row and spans through it
          newRowSpan = Math.max(1, newRowSpan - 1);
        }
        
        return { ...cell, row: newRow, rowSpan: newRowSpan };
      });
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, rows: newRows, cells: newCells, heightPerRow },
      height: newHeight
    });
  };

  const handleDeleteColumn = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    // Don't allow deleting if only 1 column remains
    if (config.cols <= 1) return;
    
    const lastCol = config.cols - 1;
    const newCols = config.cols - 1;
    
    // Remove cells from the last column and adjust cells with colSpan that extend into it
    const newCells = config.cells
      .filter(cell => cell.col !== lastCol) // Remove cells that start in the last column
      .map(cell => {
        // Adjust colSpan if it extends into the deleted column
        if (cell.col + (cell.colSpan || 1) > newCols) {
          return { ...cell, colSpan: Math.max(1, newCols - cell.col) };
        }
        return cell;
      });
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cols: newCols, cells: newCells }
    });
  };

  const handleMergeCells = (elementId: string, row: number, col: number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const cellIndex = config.cells.findIndex(c => c.row === row && c.col === col);
    if (cellIndex === -1) return;
    
    const cell = config.cells[cellIndex];
    const newCells = [...config.cells];
    
    // Increase colSpan if possible
    if (col + (cell.colSpan || 1) < config.cols) {
      newCells[cellIndex] = { ...cell, colSpan: (cell.colSpan || 1) + 1 };
    } else if (row + (cell.rowSpan || 1) < config.rows) {
      // If can't merge right, merge down
      newCells[cellIndex] = { ...cell, rowSpan: (cell.rowSpan || 1) + 1 };
    }
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cells: newCells }
    });
  };

  const handleSubdivideCell = (elementId: string, row: number, col: number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const cellIndex = config.cells.findIndex(c => c.row === row && c.col === col);
    if (cellIndex === -1) return;
    
    const cell = config.cells[cellIndex];
    const newCells = [...config.cells];
    
    // Reset both spans to single cell
    newCells[cellIndex] = { ...cell, colSpan: 1, rowSpan: 1 };
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cells: newCells }
    });
  };

  const handleCellContentUpdate = (elementId: string, row: number, col: number, content: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const cellIndex = config.cells.findIndex(c => c.row === row && c.col === col);
    if (cellIndex === -1) return;
    
    const newCells = [...config.cells];
    newCells[cellIndex] = { ...newCells[cellIndex], content };
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cells: newCells }
    });
  };

  const handleCellBindingUpdate = (elementId: string, row: number, col: number, binding: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const cellIndex = config.cells.findIndex(c => c.row === row && c.col === col);
    if (cellIndex === -1) return;
    
    const newCells = [...config.cells];
    // Update the binding and set content to show the binding placeholder
    newCells[cellIndex] = { 
      ...newCells[cellIndex], 
      binding,
      content: `{{${binding}}}`
    };
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cells: newCells }
    });
  };

  // Handlers for text element updates
  const handleTextContentUpdate = (elementId: string, content: string) => {
    onElementUpdate(elementId, { content });
  };

  const handleTextBindingUpdate = (elementId: string, binding: string) => {
    onElementUpdate(elementId, { 
      binding,
      content: `{{${binding}}}`
    });
  };

  const handleTextStyleUpdate = (elementId: string, styleKey: string, styleValue: string | number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element) return;
    
    onElementUpdate(elementId, {
      style: { ...element.style, [styleKey]: styleValue }
    });
  };



  // Recursive function to render JSON data tree in context menu for text elements
  const renderDataTreeForText = (tree: Record<string, any>, elementId: string): JSX.Element[] => {
    return Object.keys(tree).map((key) => {
      const value = tree[key];
      
      if (typeof value === 'string') {
        // Leaf node - this is a full path
        return (
          <ContextMenuItem 
            key={value}
            onClick={() => handleTextBindingUpdate(elementId, value)}
          >
            {key} → {value}
          </ContextMenuItem>
        );
      } else {
        // Nested object - create submenu
        return (
          <ContextMenuSub key={key}>
            <ContextMenuSubTrigger>
              {key}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {renderDataTreeForText(value, elementId)}
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      }
    });
  };

  // Recursive function to render JSON data tree in context menu
  const renderDataTree = (tree: Record<string, any>, elementId: string, row: number, col: number): JSX.Element[] => {
    return Object.keys(tree).map((key) => {
      const value = tree[key];
      
      if (typeof value === 'string') {
        // Leaf node - this is a full path
        return (
          <ContextMenuItem 
            key={value}
            onClick={() => handleCellBindingUpdate(elementId, row, col, value)}
          >
            {key} → {value}
          </ContextMenuItem>
        );
      } else {
        // Nested object - create submenu
        return (
          <ContextMenuSub key={key}>
            <ContextMenuSubTrigger>
              {key}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {renderDataTree(value, elementId, row, col)}
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      }
    });
  };

  const handleCellStyleUpdate = (elementId: string, row: number, col: number, styleKey: string, styleValue: any) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const cellIndex = config.cells.findIndex(c => c.row === row && c.col === col);
    if (cellIndex === -1) return;
    
    const newCells = [...config.cells];
    const currentStyle = newCells[cellIndex].style || {};
    newCells[cellIndex] = { 
      ...newCells[cellIndex], 
      style: { ...currentStyle, [styleKey]: styleValue }
    };
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, cells: newCells }
    });
  };

  // Handle row height resizing
  const handleRowHeightResize = (elementId: string, rowIndex: number, newHeight: number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    // Guard against division by zero
    if (config.rows <= 0) return;
    
    const rowHeights = config.rowHeights || Array(config.rows).fill(element.height / config.rows);
    const newRowHeights = [...rowHeights];
    newRowHeights[rowIndex] = Math.max(MIN_ROW_HEIGHT, newHeight);
    
    // Update total element height
    const newTotalHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, rowHeights: newRowHeights },
      height: newTotalHeight
    });
  };

  // Handle column width resizing
  const handleColWidthResize = (elementId: string, colIndex: number, newWidthPercent: number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    // Guard against division by zero
    if (config.cols <= 0) return;
    
    const colWidths = config.colWidths || Array(config.cols).fill(100 / config.cols);
    const newColWidths = [...colWidths];
    
    // Calculate the delta
    const delta = newWidthPercent - colWidths[colIndex];
    
    // Ensure minimum width constraints
    const clampedNewWidth = Math.max(MIN_COL_WIDTH_PERCENT, newWidthPercent);
    const actualDelta = clampedNewWidth - colWidths[colIndex];
    
    // If this is the last column, redistribute to all previous columns proportionally
    if (colIndex === config.cols - 1) {
      // For the last column, we need to adjust all other columns
      const remainingWidth = 100 - clampedNewWidth;
      const otherColsTotal = colWidths.slice(0, -1).reduce((sum, w) => sum + w, 0);
      
      if (otherColsTotal > 0) {
        for (let i = 0; i < config.cols - 1; i++) {
          newColWidths[i] = (colWidths[i] / otherColsTotal) * remainingWidth;
        }
      }
      newColWidths[colIndex] = clampedNewWidth;
    } else {
      // For non-last columns, only adjust the resized column and the one to its right
      const rightColIndex = colIndex + 1;
      const rightColNewWidth = colWidths[rightColIndex] - actualDelta;
      
      // Ensure the right column doesn't go below minimum
      if (rightColNewWidth >= MIN_COL_WIDTH_PERCENT) {
        newColWidths[colIndex] = clampedNewWidth;
        newColWidths[rightColIndex] = rightColNewWidth;
      } else {
        // If right column would be too small, resize to the limit
        newColWidths[rightColIndex] = MIN_COL_WIDTH_PERCENT;
        newColWidths[colIndex] = colWidths[colIndex] + (colWidths[rightColIndex] - MIN_COL_WIDTH_PERCENT);
      }
    }
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, colWidths: newColWidths }
    });
  };

  // Handle row height resizing for Price Tables
  const handlePriceTableRowHeightResize = (elementId: string, rowIndex: number, newHeight: number) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.tableConfig) return;
    
    const config = element.tableConfig;
    const totalRows = config.columns.length + (config.additionalRows?.length || 0);
    
    // Guard against invalid row index (resize handles exist between rows, so max index is totalRows - 2)
    if (totalRows <= 0 || rowIndex >= totalRows - 1) return;
    
    const rowHeights = config.rowHeights || (totalRows > 0 ? Array(totalRows).fill(element.height / totalRows) : []);
    const newRowHeights = [...rowHeights];
    newRowHeights[rowIndex] = Math.max(MIN_ROW_HEIGHT, newHeight);
    
    // Update total element height
    const oldHeight = element.height;
    const newTotalHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      tableConfig: { ...config, rowHeights: newRowHeights },
      height: newTotalHeight
    });
    
    // Adjust any tables that are vertically fused below this price table
    adjustVerticallyFusedTables(
      { ...element, height: newTotalHeight },
      oldHeight,
      newTotalHeight
    );
  };

  const getPriceTableRowHeights = (element: TemplateElement, config: NonNullable<TemplateElement['tableConfig']>, totalRows: number) => {
    if (config.rowHeights && config.rowHeights.length === totalRows) {
      return config.rowHeights;
    }
    if (totalRows > 0) {
      return Array(totalRows).fill(element.height / totalRows);
    }
    return [];
  };

  // Handle adding additional rows to Price Tables
  const handlePriceTableAddRow = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.tableConfig) return;
    
    const config = element.tableConfig;
    const currentAdditionalRows = config.additionalRows || [];
    const totalRowsBefore = config.columns.length + currentAdditionalRows.length;
    const existingRowHeights = getPriceTableRowHeights(element, config, totalRowsBefore);
    const newRowHeight = Math.max(
      MIN_ROW_HEIGHT,
      existingRowHeights[existingRowHeights.length - 1] ?? (element.height / Math.max(1, totalRowsBefore + 1))
    );
    const newRowHeights = [...existingRowHeights, newRowHeight];
    const newHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      tableConfig: {
        ...config,
        additionalRows: [...currentAdditionalRows, { ...DEFAULT_FOOTER_ROW }],
        rowHeights: newRowHeights
      },
      height: newHeight
    });
    
    adjustVerticallyFusedTables(
      { ...element, height: newHeight },
      element.height,
      newHeight
    );
  };

  // Handle removing additional rows from Price Tables
  const handlePriceTableRemoveRow = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    const tableConfig = element?.tableConfig;
    if (!element || !tableConfig?.additionalRows || tableConfig.additionalRows.length === 0) return;
    
    const additionalRows = tableConfig.additionalRows;
    const newAdditionalRows = [...additionalRows];
    newAdditionalRows.pop();
    
    const totalRowsBefore = tableConfig.columns.length + additionalRows.length;
    const existingRowHeights = getPriceTableRowHeights(element, tableConfig, totalRowsBefore);
    const newTotalRows = tableConfig.columns.length + newAdditionalRows.length;
    const newRowHeights = existingRowHeights.slice(0, newTotalRows);
    const newHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      tableConfig: {
        ...tableConfig,
        additionalRows: newAdditionalRows,
        rowHeights: newRowHeights
      },
      height: newHeight
    });
    
    adjustVerticallyFusedTables(
      { ...element, height: newHeight },
      element.height,
      newHeight
    );
  };

  // Handle adding footer rows to Invoice Tables
  const handleInvoiceTableAddFooterRow = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.tableConfig) return;
    
    const config = element.tableConfig;
    const currentFooterRows = config.footerRows || [];
    const headerRows = 1; // Invoice table has 1 header row
    const dataRows = INVOICE_TABLE_EDITOR_DATA_ROWS;
    const totalRowsBefore = headerRows + dataRows + currentFooterRows.length;
    const existingRowHeights = getPriceTableRowHeights(element, config, totalRowsBefore);
    const newRowHeight = Math.max(
      MIN_ROW_HEIGHT,
      existingRowHeights[existingRowHeights.length - 1] ?? (element.height / Math.max(1, totalRowsBefore + 1))
    );
    const newRowHeights = [...existingRowHeights, newRowHeight];
    const newHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      tableConfig: {
        ...config,
        footerRows: [...currentFooterRows, { label: "Total", value: "{total}", format: 'currency' as const }],
        rowHeights: newRowHeights
      },
      height: newHeight
    });
    
    adjustVerticallyFusedTables(
      { ...element, height: newHeight },
      element.height,
      newHeight
    );
  };

  // Handle removing footer rows from Invoice Tables
  const handleInvoiceTableRemoveFooterRow = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    const tableConfig = element?.tableConfig;
    if (!element || !tableConfig?.footerRows || tableConfig.footerRows.length === 0) return;
    
    const footerRows = tableConfig.footerRows;
    const newFooterRows = [...footerRows];
    newFooterRows.pop();
    
    const headerRows = 1;
    const dataRows = INVOICE_TABLE_EDITOR_DATA_ROWS;
    const totalRowsBefore = headerRows + dataRows + footerRows.length;
    const existingRowHeights = getPriceTableRowHeights(element, tableConfig, totalRowsBefore);
    const newTotalRows = headerRows + dataRows + newFooterRows.length;
    const newRowHeights = existingRowHeights.slice(0, newTotalRows);
    const newHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      tableConfig: {
        ...tableConfig,
        footerRows: newFooterRows,
        rowHeights: newRowHeights
      },
      height: newHeight
    });
    
    adjustVerticallyFusedTables(
      { ...element, height: newHeight },
      element.height,
      newHeight
    );
  };

  // Detect and apply fusion between nearby gridtables and price tables
  const applyTableFusion = (movedElementId: string, newX: number, newY: number) => {
    const movedElement = layout.elements.find(e => e.id === movedElementId);
    if (!movedElement || movedElement.type !== 'gridtable' || !movedElement.gridTableConfig) return { x: newX, y: newY };

    const updates: { id: string; updates: Partial<TemplateElement> }[] = [];
    let finalX = newX;
    let finalY = newY;

    // Check against other gridtables and price tables
    for (const otherEl of layout.elements) {
      if (otherEl.id === movedElementId) continue;
      
      // Check if the other element is a gridtable or a price table
      const isOtherGridTable = otherEl.type === 'gridtable' && otherEl.gridTableConfig;
      const isOtherPriceTable = otherEl.type === 'table' && otherEl.tableConfig?.tableType === 'price';
      const isOtherInvoiceTable = otherEl.type === 'table' && otherEl.tableConfig?.tableType === 'invoice';
      
      if (!isOtherGridTable && !isOtherPriceTable && !isOtherInvoiceTable) continue;

      const movedRight = finalX + movedElement.width;
      const movedBottom = finalY + movedElement.height;
      const otherRight = otherEl.x + otherEl.width;
      const otherBottom = otherEl.y + otherEl.height;

      // Check for horizontal alignment (side by side)
      const horizontalOverlap = !(movedBottom < otherEl.y || finalY > otherBottom);
      
      // Left edge of moved aligns with right edge of other
      if (horizontalOverlap && Math.abs(finalX - otherRight) < FUSION_THRESHOLD) {
        finalX = otherRight; // Snap to right edge
        
        // Align rows if they're close
        if (Math.abs(finalY - otherEl.y) < FUSION_THRESHOLD) {
          finalY = otherEl.y;
          // Could optionally sync row heights here
        }
      }
      
      // Right edge of moved aligns with left edge of other
      if (horizontalOverlap && Math.abs(movedRight - otherEl.x) < FUSION_THRESHOLD) {
        finalX = otherEl.x - movedElement.width; // Snap to left edge
        
        // Align rows if they're close
        if (Math.abs(finalY - otherEl.y) < FUSION_THRESHOLD) {
          finalY = otherEl.y;
        }
      }

      // Check for vertical alignment (top and bottom)
      const verticalOverlap = !(movedRight < otherEl.x || finalX > otherRight);
      
      // Top edge of moved aligns with bottom edge of other
      if (verticalOverlap && Math.abs(finalY - otherBottom) < FUSION_THRESHOLD) {
        finalY = otherBottom; // Snap to bottom edge
        
        // Align columns if they're close
        if (Math.abs(finalX - otherEl.x) < FUSION_THRESHOLD) {
          finalX = otherEl.x;
        }
      }
      
      // Bottom edge of moved aligns with top edge of other
      if (verticalOverlap && Math.abs(movedBottom - otherEl.y) < FUSION_THRESHOLD) {
        finalY = otherEl.y - movedElement.height; // Snap to top edge
        
        // Align columns if they're close
        if (Math.abs(finalX - otherEl.x) < FUSION_THRESHOLD) {
          finalX = otherEl.x;
        }
      }
    }

    return { x: snapToGrid(finalX), y: snapToGrid(finalY) };
  };

  // Helper to check if two tables are fully aligned (same position and size)
  const isFullyAligned = (pos1: number, pos2: number, size1: number, size2: number, tolerance: number): boolean => {
    const posAligned = Math.abs(pos1 - pos2) <= tolerance;
    const sizesMatch = Math.abs(size1 - size2) <= tolerance;
    return posAligned && sizesMatch;
  };

  // Detect which edges of a table are adjacent to other tables (for border merging)
  const detectAdjacentTables = (element: TemplateElement): { top: boolean; right: boolean; bottom: boolean; left: boolean } => {
    const adjacent = { top: false, right: false, bottom: false, left: false };
    
    // Only check for gridtables, price tables, invoice tables, and grid tables
    const isGridTable = element.type === 'gridtable' && element.gridTableConfig;
    const isPriceTable = element.type === 'table' && element.tableConfig?.tableType === 'price';
    const isInvoiceTable = element.type === 'table' && element.tableConfig?.tableType === 'invoice';
    const isGridDataTable = element.type === 'table' && element.tableConfig?.tableType === 'grid';
    
    if (!isGridTable && !isPriceTable && !isInvoiceTable && !isGridDataTable) return adjacent;

    const elementRight = element.x + element.width;
    const elementBottom = element.y + element.height;

    // Check against all other tables
    for (const otherEl of layout.elements) {
      if (otherEl.id === element.id) continue;
      
      // Check if the other element is a gridtable, price table, invoice table, or grid table
      const isOtherGridTable = otherEl.type === 'gridtable' && otherEl.gridTableConfig;
      const isOtherPriceTable = otherEl.type === 'table' && otherEl.tableConfig?.tableType === 'price';
      const isOtherInvoiceTable = otherEl.type === 'table' && otherEl.tableConfig?.tableType === 'invoice';
      const isOtherGridDataTable = otherEl.type === 'table' && otherEl.tableConfig?.tableType === 'grid';
      
      if (!isOtherGridTable && !isOtherPriceTable && !isOtherInvoiceTable && !isOtherGridDataTable) continue;

      const otherRight = otherEl.x + otherEl.width;
      const otherBottom = otherEl.y + otherEl.height;

      // Check for horizontal alignment (same Y range)
      const horizontalOverlap = !(elementBottom <= otherEl.y || element.y >= otherBottom);
      
      // For left/right fusion, tables should be nearly fully aligned in Y to avoid partial border removal
      const fullyAlignedY = isFullyAligned(element.y, otherEl.y, element.height, otherEl.height, ALIGNMENT_TOLERANCE);
      
      // Check if left edge of element touches right edge of other table
      // Use ALIGNMENT_TOLERANCE to handle sub-pixel positioning from scaling/transforms
      if (horizontalOverlap && fullyAlignedY && Math.abs(element.x - otherRight) <= ALIGNMENT_TOLERANCE) {
        adjacent.left = true;
      }
      
      // Check if right edge of element touches left edge of other table
      if (horizontalOverlap && fullyAlignedY && Math.abs(elementRight - otherEl.x) <= ALIGNMENT_TOLERANCE) {
        adjacent.right = true;
      }

      // Check for vertical alignment (same X range)
      const verticalOverlap = !(elementRight <= otherEl.x || element.x >= otherRight);
      
      // For top/bottom fusion, tables should be nearly fully aligned in X to avoid partial border removal
      const fullyAlignedX = isFullyAligned(element.x, otherEl.x, element.width, otherEl.width, ALIGNMENT_TOLERANCE);
      
      // Check if top edge of element touches bottom edge of other table
      if (verticalOverlap && fullyAlignedX && Math.abs(element.y - otherBottom) <= ALIGNMENT_TOLERANCE) {
        adjacent.top = true;
      }
      
      // Check if bottom edge of element touches top edge of other table
      if (verticalOverlap && fullyAlignedX && Math.abs(elementBottom - otherEl.y) <= ALIGNMENT_TOLERANCE) {
        adjacent.bottom = true;
      }
    }

    return adjacent;
  };

  // Find and adjust position of tables that are vertically fused below a given table
  // This ensures that when a table's height changes, any table directly below it moves to stay fused
  const adjustVerticallyFusedTables = (changedElement: TemplateElement, oldHeight: number, newHeight: number) => {
    // Only applicable for tables
    const isChangedTable = 
      (changedElement.type === 'gridtable' && changedElement.gridTableConfig) ||
      (changedElement.type === 'table' && changedElement.tableConfig);
    
    if (!isChangedTable) return;

    const oldBottom = changedElement.y + oldHeight;
    const newBottom = changedElement.y + newHeight;
    const heightDelta = newHeight - oldHeight;

    // No height change, no adjustment needed
    if (Math.abs(heightDelta) < HEIGHT_NORMALIZATION_THRESHOLD) return;

    // Find all tables that were vertically fused below this table
    for (const otherEl of layout.elements) {
      if (otherEl.id === changedElement.id) continue;
      
      // Check if the other element is a table type that can be fused
      const isOtherTable = 
        (otherEl.type === 'gridtable' && otherEl.gridTableConfig) ||
        (otherEl.type === 'table' && otherEl.tableConfig);
      
      if (!isOtherTable) continue;
      
      // Check for full horizontal alignment (same X and width)
      const fullyAlignedX = isFullyAligned(changedElement.x, otherEl.x, changedElement.width, otherEl.width, ALIGNMENT_TOLERANCE);
      
      // Check if this table's top edge was touching the changed table's old bottom edge
      if (fullyAlignedX && Math.abs(otherEl.y - oldBottom) <= ALIGNMENT_TOLERANCE) {
        // This table is vertically fused below - adjust its Y position
        const newY = newBottom;
        onElementUpdate(otherEl.id, { y: newY });
      }
    }
  };

  // Helper to render content based on element type and mode
  const renderElementContent = (el: TemplateElement) => {
    // Determine the text content
    let displayContent = "";

    if (el.type === 'text') {
      if (isPreviewMode && el.binding) {
        displayContent = getValue(sampleData, el.binding, `{{${el.binding}}}`);
      } else {
        displayContent = el.content || (el.binding ? `{{${el.binding}}}` : "Text");
      }
      
      // Process content to replace bindings with values in preview mode
      if (isPreviewMode && displayContent && typeof displayContent === 'string') {
        displayContent = displayContent.replace(/\{\{([^}]+)\}\}/g, (match, binding) => {
          return getValue(sampleData, binding.trim(), match);
        });
      }
      
      const isEditing = editingTextElement === el.id;
      
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div 
              className="w-full h-full overflow-hidden whitespace-pre-wrap pointer-events-auto cursor-text"
              style={{
                fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : '14px',
                textAlign: (el.style?.textAlign as any) || 'left',
                color: el.style?.color as string || 'inherit',
                fontWeight: el.style?.fontWeight as any || 'normal',
                lineHeight: el.style?.lineHeight as any || 'normal',
                fontStyle: el.style?.fontStyle as any || 'normal',
                textTransform: el.style?.textTransform as any || 'none',
                letterSpacing: el.style?.letterSpacing ? `${el.style.letterSpacing}px` : 'normal',
                fontFamily: el.style?.fontFamily as string || 'inherit',
                borderBottom: el.style?.borderBottom as string || 'none',
                paddingBottom: el.style?.paddingBottom ? `${el.style.paddingBottom}px` : '0',
                textDecoration: el.style?.textDecoration as string || 'none',
              }}
              onDoubleClick={(e) => {
                if (!isPreviewMode) {
                  e.stopPropagation();
                  setEditingTextElement(el.id);
                }
              }}
              onContextMenu={(e) => {
                if (!isPreviewMode) {
                  e.stopPropagation();
                }
              }}
            >
              {isEditing && !isPreviewMode ? (
                <textarea
                  autoFocus
                  className="w-full h-full pointer-events-auto border-none outline-none resize-none bg-transparent"
                  style={{
                    fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : '14px',
                    textAlign: (el.style?.textAlign as any) || 'left',
                    color: el.style?.color as string || 'inherit',
                    fontWeight: el.style?.fontWeight as any || 'normal',
                    lineHeight: el.style?.lineHeight as any || 'normal',
                    fontStyle: el.style?.fontStyle as any || 'normal',
                    textTransform: el.style?.textTransform as any || 'none',
                    letterSpacing: el.style?.letterSpacing ? `${el.style.letterSpacing}px` : 'normal',
                    fontFamily: el.style?.fontFamily as string || 'inherit',
                    textDecoration: el.style?.textDecoration as string || 'none',
                  }}
                  value={el.content || ''}
                  onChange={(e) => {
                    handleTextContentUpdate(el.id, e.target.value);
                  }}
                  onBlur={() => setEditingTextElement(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingTextElement(null);
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                displayContent
              )}
            </div>
          </ContextMenuTrigger>
          {!isPreviewMode && (
            <ContextMenuContent className="pointer-events-auto">
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <AlignLeft className="w-4 h-4 mr-2" />
                  Text Align
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onClick={() => handleTextStyleUpdate(el.id, 'textAlign', 'left')}>
                    <AlignLeft className="w-4 h-4 mr-2" />
                    Left
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTextStyleUpdate(el.id, 'textAlign', 'center')}>
                    <AlignCenter className="w-4 h-4 mr-2" />
                    Center
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTextStyleUpdate(el.id, 'textAlign', 'right')}>
                    <AlignRight className="w-4 h-4 mr-2" />
                    Right
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTextStyleUpdate(el.id, 'textAlign', 'justify')}>
                    <AlignJustify className="w-4 h-4 mr-2" />
                    Justify
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Bold className="w-4 h-4 mr-2" />
                  Text Style
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onClick={() => {
                    const currentWeight = el.style?.fontWeight;
                    handleTextStyleUpdate(el.id, 'fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
                  }}>
                    <Bold className="w-4 h-4 mr-2" />
                    {el.style?.fontWeight === 'bold' ? 'Remove Bold' : 'Bold'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => {
                    const currentStyle = el.style?.fontStyle;
                    handleTextStyleUpdate(el.id, 'fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
                  }}>
                    <Italic className="w-4 h-4 mr-2" />
                    {el.style?.fontStyle === 'italic' ? 'Remove Italic' : 'Italic'}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => {
                    const currentDecoration = el.style?.textDecoration;
                    handleTextStyleUpdate(el.id, 'textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
                  }}>
                    <Underline className="w-4 h-4 mr-2" />
                    {el.style?.textDecoration === 'underline' ? 'Remove Underline' : 'Underline'}
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              {sampleData && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <Database className="w-4 h-4 mr-2" />
                    Bind Data
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {renderDataTreeForText(buildDataPathTree(sampleData), el.id)}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
            </ContextMenuContent>
          )}
        </ContextMenu>
      );
    }

    if (el.type === 'image' || el.type === 'qr' || el.type === 'signature') {
      let src = el.content || "https://placehold.co/400?text=Image";
      
      if (el.type === 'qr') {
        // Support binding for QR codes in preview mode
        const qrData = (isPreviewMode && el.binding) 
          ? getValue(sampleData, el.binding, el.content) 
          : el.content;
        src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData || 'https://replit.com')}`;
      }
      
      if (el.type === 'signature') {
        src = "https://placehold.co/200x100?text=Signature";
      }

      return (
        <img 
          src={src} 
          alt={el.type} 
          className="w-full h-full object-contain pointer-events-none" 
          key={src} // Force re-render when src changes
        />
      );
    }

    if (el.type === 'box' || el.type === 'line' || el.type === 'badge') {
      return (
        <div 
          className={clsx(
            "w-full h-full flex items-center justify-center overflow-hidden",
            el.type === 'badge' && "rounded-full"
          )}
          style={{
            backgroundColor: el.style?.backgroundColor as string || (el.type === 'line' ? '#000' : (el.type === 'badge' ? '#3b82f6' : '#eee')),
            border: el.style?.border as string || 'none',
            color: el.style?.color as string || '#fff',
            fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : '12px',
          }}
        >
          {el.type === 'badge' && (el.content || (el.binding ? getValue(sampleData, el.binding, `{{${el.binding}}}`) : "PAID"))}
        </div>
      );
    }

    if (el.type === 'table') {
      const config = el.tableConfig;
      if (!config) return <div>Invalid Table Config</div>;

      const tableType = config.tableType || 'grid';
      const tableStyle = (el.style?.tableVariant as string) || 'default';
      const gridBorderColor = (el.style?.gridBorderColor as string) || '#000000';
      const gridBorderWidth = (el.style?.gridBorderWidth as number) || 1;
      
      // Handle price table (summary/totals from object)
      if (tableType === 'price') {
        const sourceData = isPreviewMode 
          ? getValue(sampleData, config.dataSource, {}) 
          : {}; // Empty object for editor
        
        // Calculate row heights for price table
        const totalRows = config.columns.length + (config.additionalRows?.length || 0);
        let rowHeights = config.rowHeights || (totalRows > 0 ? Array(totalRows).fill(el.height / totalRows) : []);
        
        // Normalize row heights to prevent floating-point gaps
        rowHeights = normalizeRowHeights(rowHeights, el.height);
        
        // Calculate column widths for price table
        // Price tables always have exactly 2 columns (label and value), regardless of number of rows
        // If colWidths is not set, initialize it to equal distribution
        const colWidths = config.colWidths && config.colWidths.length === 2 
          ? config.colWidths 
          : DEFAULT_PRICE_TABLE_COL_WIDTHS;
        
        // Detect adjacent tables for border merging
        const adjacentTables = detectAdjacentTables(el);
        
        return (
          <div className="w-full h-full pointer-events-auto relative">
            <div className={clsx(
              "w-full h-full",
              tableStyle === 'default' && "",
              tableStyle === 'minimal' && "",
              tableStyle === 'modern' && "rounded-lg shadow-sm"
            )}>
              <table className="w-full text-sm text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  {/* Price tables always have 2 columns: label and value */}
                  {colWidths.map((width, idx) => (
                    <col key={idx} style={{ width: `${width}%` }} />
                  ))}
                </colgroup>
                <tbody>
                {config.columns.map((col, idx) => {
                  let cellValue;
                  if (isPreviewMode) {
                    const rawVal = getValue(sourceData, col.binding);
                    if (col.format === 'currency') {
                      const currency = config.currency || 'USD';
                      if (currency === 'none') {
                        cellValue = Number(rawVal) || 0;
                      } else {
                        cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(rawVal) || 0);
                      }
                    } else {
                      cellValue = rawVal;
                    }
                  } else {
                    cellValue = `{${col.binding}}`;
                  }
                  
                  const isFirstRow = idx === 0;
                  const isLastRow = idx === config.columns.length - 1 && (!config.additionalRows || config.additionalRows.length === 0);
                  
                  return (
                    <tr key={idx} className={clsx(
                      tableStyle === 'default' && "hover:bg-gray-50",
                      tableStyle === 'modern' && idx % 2 === 0 ? "bg-primary/5" : "bg-white"
                    )}
                    style={{
                      height: rowHeights[idx] ? `${rowHeights[idx]}px` : 'auto'
                    }}>
                      <th className="p-2 text-left font-medium" style={{ 
                        borderWidth: `${gridBorderWidth}px`,
                        borderStyle: 'solid',
                        borderColor: gridBorderColor,
                        borderTopWidth: (adjacentTables.top && isFirstRow) ? 0 : `${gridBorderWidth}px`,
                        borderLeftWidth: adjacentTables.left ? 0 : `${gridBorderWidth}px`,
                        borderBottomWidth: `${gridBorderWidth}px`,
                      }}>
                        {col.header}
                      </th>
                      <td className="p-2" style={{ 
                        borderWidth: `${gridBorderWidth}px`,
                        borderStyle: 'solid',
                        borderColor: gridBorderColor,
                        borderTopWidth: (adjacentTables.top && isFirstRow) ? 0 : `${gridBorderWidth}px`,
                        borderRightWidth: `${gridBorderWidth}px`,
                        borderBottomWidth: `${gridBorderWidth}px`,
                      }}>
                        {cellValue}
                      </td>
                    </tr>
                  );
                })}
                {/* Additional rows that come after the columns loop */}
                {config.additionalRows && config.additionalRows.map((additionalRow, idx) => {
                  let additionalValue;
                  if (isPreviewMode) {
                    // Try to parse as binding first - check for pattern {bindingName}
                    if (additionalRow.value.startsWith('{') && additionalRow.value.endsWith('}') && additionalRow.value.length > 2) {
                      const binding = additionalRow.value.slice(1, -1).trim();
                      if (binding.length > 0) {
                        const rawVal = getValue(sourceData, binding);
                        if (additionalRow.format === 'currency') {
                          const currency = config.currency || 'USD';
                          if (currency === 'none') {
                            additionalValue = Number(rawVal) || 0;
                          } else {
                            additionalValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(rawVal) || 0);
                          }
                        } else if (additionalRow.format === 'number') {
                          additionalValue = new Intl.NumberFormat('en-US').format(Number(rawVal) || 0);
                        } else {
                          additionalValue = rawVal;
                        }
                      } else {
                        additionalValue = additionalRow.value;
                      }
                    } else {
                      // Static text
                      additionalValue = additionalRow.value;
                    }
                  } else {
                    additionalValue = additionalRow.value;
                  }
                  
                  const isEditingLabel = editingAdditionalRowCell?.elementId === el.id && editingAdditionalRowCell?.additionalRowIdx === idx && editingAdditionalRowCell?.field === 'label';
                  const isEditingValue = editingAdditionalRowCell?.elementId === el.id && editingAdditionalRowCell?.additionalRowIdx === idx && editingAdditionalRowCell?.field === 'value';
                  
                  // Calculate the row index in the rowHeights array
                  // Additional rows come after all column rows
                  const rowHeightIndex = config.columns.length + idx;
                  
                  const isLastAdditionalRow = idx === config.additionalRows!.length - 1;
                  
                  return (
                    <tr key={`additional-${idx}`} className={clsx(
                      tableStyle === 'default' && "hover:bg-gray-50 bg-gray-50",
                      tableStyle === 'modern' && "bg-primary/10"
                    )}
                      style={{
                        height: rowHeights[rowHeightIndex] ? `${rowHeights[rowHeightIndex]}px` : 'auto'
                      }}>
                      <th 
                        className={clsx(
                          "p-2 text-left font-semibold",
                          !isPreviewMode && "cursor-text hover:bg-blue-50"
                        )}
                        style={{
                          borderWidth: `${gridBorderWidth}px`,
                          borderStyle: 'solid',
                          borderColor: gridBorderColor,
                          borderLeftWidth: adjacentTables.left ? 0 : `${gridBorderWidth}px`,
                          borderBottomWidth: `${gridBorderWidth}px`,
                          textAlign: (additionalRow.style?.textAlign as React.CSSProperties['textAlign']) || 'left',
                          fontWeight: additionalRow.style?.fontWeight || 'bold',
                          fontStyle: (additionalRow.style?.fontStyle as React.CSSProperties['fontStyle']) || 'normal',
                          textDecoration: additionalRow.style?.textDecoration || 'none'
                        }}
                        onDoubleClick={(e) => {
                          if (!isPreviewMode) {
                            e.stopPropagation();
                            setEditingAdditionalRowCell({ elementId: el.id, additionalRowIdx: idx, field: 'label' });
                          }
                        }}
                      >
                        {additionalRow.label}
                      </th>
                      <td 
                        className={clsx(
                          "p-2 font-semibold",
                          !isPreviewMode && "cursor-text hover:bg-blue-50"
                        )}
                        style={{
                          borderWidth: `${gridBorderWidth}px`,
                          borderStyle: 'solid',
                          borderColor: gridBorderColor,
                          borderRightWidth: `${gridBorderWidth}px`,
                          borderBottomWidth: `${gridBorderWidth}px`,
                          textAlign: (additionalRow.style?.textAlign as React.CSSProperties['textAlign']) || 'left',
                          fontWeight: additionalRow.style?.fontWeight || 'bold',
                          fontStyle: (additionalRow.style?.fontStyle as React.CSSProperties['fontStyle']) || 'normal',
                          textDecoration: additionalRow.style?.textDecoration || 'none'
                        }}
                        onDoubleClick={(e) => {
                          if (!isPreviewMode) {
                            e.stopPropagation();
                            setEditingAdditionalRowCell({ elementId: el.id, additionalRowIdx: idx, field: 'value' });
                          }
                        }}
                      >
                        {additionalValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Row resize handles for PriceTable */}
          {!isPreviewMode && rowHeights.length > 1 && rowHeights.slice(0, -1).map((_, rowIdx) => {
            const topPos = rowHeights.slice(0, rowIdx + 1).reduce((sum, h) => sum + h, 0);
            return (
              <div
                key={`row-resize-${rowIdx}`}
                className="absolute left-0 right-0 pointer-events-auto cursor-row-resize hover:bg-blue-500/20"
                style={{
                  top: `${topPos - RESIZE_HANDLE_OFFSET}px`,
                  height: `${RESIZE_HANDLE_SIZE}px`,
                  zIndex: 5
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingBorder({
                    elementId: el.id,
                    type: 'row',
                    index: rowIdx,
                    startPos: e.clientY,
                    startSize: rowHeights[rowIdx]
                  });
                }}
              />
            );
          })}
        </div>
        );
      }

      // Handle invoice table (header + loopable row + footer)
      if (tableType === 'invoice') {
        const sourceData = isPreviewMode 
          ? getValue(sampleData, config.dataSource, []) 
          : [1, 2, 3]; // Dummy rows for editor
        
        // Calculate row heights for invoice table
        // Structure: 1 header + fixed 3 data rows for editor mode + footer rows
        const headerRows = 1;
        const dataRows = INVOICE_TABLE_EDITOR_DATA_ROWS;
        const footerRowsCount = config.footerRows?.length || 0;
        const totalRows = headerRows + dataRows + footerRowsCount;
        let rowHeights = config.rowHeights || (totalRows > 0 ? Array(totalRows).fill(el.height / totalRows) : []);
        
        // Normalize row heights to prevent floating-point gaps
        rowHeights = normalizeRowHeights(rowHeights, el.height);
        
        // Calculate column widths (use custom colWidths or initialize from columns)
        const colWidths = config.colWidths || initializeColumnWidths(config.columns);
        
        // Detect adjacent tables for border merging
        const adjacentTables = detectAdjacentTables(el);
        
        return (
          <div className="w-full h-full pointer-events-auto relative">
            <div className={clsx(
              "w-full h-full",
              tableStyle === 'default' && "",
              tableStyle === 'minimal' && "",
              tableStyle === 'modern' && "rounded-lg shadow-sm"
            )}>
              <table className="w-full text-sm text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  {/* Invoice tables have columns based on config */}
                  {colWidths.map((width, idx) => (
                    <col key={idx} style={{ width: `${width}%` }} />
                  ))}
                </colgroup>
                <tbody>
                {/* Header row */}
                <tr className={clsx(
                  tableStyle === 'default' && "bg-gray-100 font-semibold",
                  tableStyle === 'modern' && "bg-primary/10 font-semibold"
                )}
                style={{
                  height: rowHeights[0] ? `${rowHeights[0]}px` : 'auto'
                }}>
                  {config.columns.map((col, colIdx) => (
                    <th key={colIdx} className="p-2 text-left font-semibold" style={{ 
                      borderWidth: `${gridBorderWidth}px`,
                      borderStyle: 'solid',
                      borderColor: gridBorderColor,
                      borderTopWidth: adjacentTables.top ? 0 : `${gridBorderWidth}px`,
                      borderLeftWidth: (colIdx === 0 && adjacentTables.left) ? 0 : `${gridBorderWidth}px`,
                      borderRightWidth: (colIdx === config.columns.length - 1) ? `${gridBorderWidth}px` : 0,
                      borderBottomWidth: `${gridBorderWidth}px`,
                    }}>
                      {col.header}
                    </th>
                  ))}
                </tr>
                {/* Data rows (loopable) */}
                {(isPreviewMode ? sourceData : [1, 2, 3]).map((dataItem: any, rowIdx: number) => {
                  const rowHeightIndex = headerRows + rowIdx;
                  return (
                    <tr key={rowIdx} className={clsx(
                      tableStyle === 'default' && "hover:bg-gray-50",
                      tableStyle === 'modern' && rowIdx % 2 === 0 ? "bg-white" : "bg-primary/5"
                    )}
                    style={{
                      height: rowHeights[rowHeightIndex] ? `${rowHeights[rowHeightIndex]}px` : 'auto'
                    }}>
                      {config.columns.map((col, colIdx) => {
                        let cellValue;
                        if (isPreviewMode && col.binding) {
                          const rawVal = getValue(dataItem, col.binding);
                          if (col.format === 'currency') {
                            const currency = config.currency || 'USD';
                            if (currency === 'none') {
                              cellValue = Number(rawVal) || 0;
                            } else {
                              cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(rawVal) || 0);
                            }
                          } else if (col.format === 'number') {
                            cellValue = new Intl.NumberFormat('en-US').format(Number(rawVal) || 0);
                          } else {
                            cellValue = rawVal;
                          }
                        } else {
                          cellValue = `{${col.binding}}`;
                        }
                        
                        return (
                          <td key={colIdx} className="p-2" style={{ 
                            borderWidth: `${gridBorderWidth}px`,
                            borderStyle: 'solid',
                            borderColor: gridBorderColor,
                            borderLeftWidth: (colIdx === 0 && adjacentTables.left) ? 0 : `${gridBorderWidth}px`,
                            borderRightWidth: (colIdx === config.columns.length - 1) ? `${gridBorderWidth}px` : 0,
                            borderBottomWidth: `${gridBorderWidth}px`,
                          }}>
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Footer rows that stay at bottom */}
                {config.footerRows && config.footerRows.map((footerRow, idx) => {
                  let footerLabelValue = footerRow.label;
                  let footerDataValue;
                  
                  if (isPreviewMode) {
                    // Try to parse as binding first - check for pattern {bindingName}
                    if (footerRow.value.startsWith('{') && footerRow.value.endsWith('}') && footerRow.value.length > 2) {
                      const binding = footerRow.value.slice(1, -1).trim();
                      if (binding.length > 0) {
                        const rawVal = getValue(sampleData, binding);
                        if (footerRow.format === 'currency') {
                          const currency = config.currency || 'USD';
                          if (currency === 'none') {
                            footerDataValue = Number(rawVal) || 0;
                          } else {
                            footerDataValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(rawVal) || 0);
                          }
                        } else if (footerRow.format === 'number') {
                          footerDataValue = new Intl.NumberFormat('en-US').format(Number(rawVal) || 0);
                        } else {
                          footerDataValue = rawVal;
                        }
                      } else {
                        footerDataValue = footerRow.value;
                      }
                    } else {
                      // Static text
                      footerDataValue = footerRow.value;
                    }
                  } else {
                    footerDataValue = footerRow.value;
                  }
                  
                  // Calculate the row index in the rowHeights array
                  const rowHeightIndex = headerRows + dataRows + idx;
                  
                  return (
                    <tr key={`footer-${idx}`} className={clsx(
                      tableStyle === 'default' && "bg-gray-100 font-semibold",
                      tableStyle === 'modern' && "bg-primary/10 font-semibold"
                    )}
                      style={{
                        height: rowHeights[rowHeightIndex] ? `${rowHeights[rowHeightIndex]}px` : 'auto'
                      }}>
                      {/* First cell shows the label */}
                      <td 
                        className="p-2 font-semibold"
                        style={{
                          borderWidth: `${gridBorderWidth}px`,
                          borderStyle: 'solid',
                          borderColor: gridBorderColor,
                          borderLeftWidth: adjacentTables.left ? 0 : `${gridBorderWidth}px`,
                          borderBottomWidth: `${gridBorderWidth}px`,
                          textAlign: (footerRow.style?.textAlign as React.CSSProperties['textAlign']) || 'left',
                          fontWeight: footerRow.style?.fontWeight || 'bold',
                          fontStyle: (footerRow.style?.fontStyle as React.CSSProperties['fontStyle']) || 'normal',
                          textDecoration: footerRow.style?.textDecoration || 'none'
                        }}
                      >
                        {footerLabelValue}
                      </td>
                      {/* Remaining cells span or show the value in the last column */}
                      {config.columns.slice(1, -1).map((_, colIdx) => (
                        <td 
                          key={colIdx + 1}
                          className="p-2"
                          style={{
                            borderWidth: `${gridBorderWidth}px`,
                            borderStyle: 'solid',
                            borderColor: gridBorderColor,
                            borderBottomWidth: `${gridBorderWidth}px`,
                          }}
                        />
                      ))}
                      <td 
                        className="p-2 font-semibold"
                        style={{
                          borderWidth: `${gridBorderWidth}px`,
                          borderStyle: 'solid',
                          borderColor: gridBorderColor,
                          borderRightWidth: `${gridBorderWidth}px`,
                          borderBottomWidth: `${gridBorderWidth}px`,
                          textAlign: (footerRow.style?.textAlign as React.CSSProperties['textAlign']) || 'right',
                          fontWeight: footerRow.style?.fontWeight || 'bold',
                          fontStyle: (footerRow.style?.fontStyle as React.CSSProperties['fontStyle']) || 'normal',
                          textDecoration: footerRow.style?.textDecoration || 'none'
                        }}
                      >
                        {footerDataValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Row resize handles for InvoiceTable */}
          {!isPreviewMode && rowHeights.length > 1 && rowHeights.slice(0, -1).map((_, rowIdx) => {
            const topPos = rowHeights.slice(0, rowIdx + 1).reduce((sum, h) => sum + h, 0);
            return (
              <div
                key={`row-resize-${rowIdx}`}
                className="absolute left-0 right-0 pointer-events-auto cursor-row-resize hover:bg-blue-500/20"
                style={{
                  top: `${topPos - RESIZE_HANDLE_OFFSET}px`,
                  height: `${RESIZE_HANDLE_SIZE}px`,
                  zIndex: 5
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingBorder({
                    elementId: el.id,
                    type: 'row',
                    index: rowIdx,
                    startPos: e.clientY,
                    startSize: rowHeights[rowIdx]
                  });
                }}
              />
            );
          })}
        </div>
        );
      }

      // Handle grid table (array of items)
      const data = isPreviewMode 
        ? getValue(sampleData, config.dataSource, []) 
        : [1, 2, 3]; // Dummy rows for editor
      
      // Calculate column widths (use custom colWidths or initialize from columns)
      const gridColWidths = config.colWidths || initializeColumnWidths(config.columns);
      
      // Detect adjacent tables for border merging
      const adjacentTables = detectAdjacentTables(el);
      
      return (
        <div className={clsx(
          "w-full h-full",
          tableStyle === 'default' && "",
          tableStyle === 'minimal' && "",
          tableStyle === 'modern' && "rounded-lg shadow-sm"
        )}>
          <table className="w-full text-sm text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {gridColWidths.map((width, idx) => (
                <col key={idx} style={{ width: `${width}%` }} />
              ))}
            </colgroup>
            <thead className={clsx(
              tableStyle === 'default' && "bg-gray-100 text-gray-700 font-medium",
              tableStyle === 'minimal' && "text-gray-900 font-bold",
              tableStyle === 'modern' && "bg-primary text-primary-foreground font-semibold"
            )}>
              <tr>
                {config.columns.map((col, idx) => {
                  const isFirstCol = idx === 0;
                  const isLastCol = idx === config.columns.length - 1;
                  
                  return (
                    <th key={idx} className="p-2" style={{ 
                      borderWidth: `${gridBorderWidth}px`,
                      borderStyle: 'solid',
                      borderColor: gridBorderColor,
                      borderTopWidth: adjacentTables.top ? 0 : `${gridBorderWidth}px`,
                      borderLeftWidth: (adjacentTables.left && isFirstCol) ? 0 : `${gridBorderWidth}px`,
                      borderRightWidth: `${gridBorderWidth}px`,
                    }}>
                      {col.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.map((row, rIdx) => {
                const isLastRow = rIdx === data.length - 1;
                
                return (
                  <tr key={rIdx} className={clsx(
                    tableStyle === 'default' && "hover:bg-gray-50",
                    tableStyle === 'modern' && rIdx % 2 === 0 ? "bg-primary/5" : "bg-white"
                  )}>
                    {config.columns.map((col, cIdx) => {
                      let cellValue;
                      if (isPreviewMode) {
                        const rawVal = getValue(row, col.binding);
                        if (col.format === 'currency') {
                          cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(rawVal) || 0);
                        } else {
                          cellValue = rawVal;
                        }
                      } else {
                        cellValue = `{${col.binding}}`;
                      }
                      
                      const isFirstCol = cIdx === 0;
                      const isLastCol = cIdx === config.columns.length - 1;
                      
                      return (
                        <td key={cIdx} className="p-2" style={{ 
                          borderWidth: `${gridBorderWidth}px`,
                          borderStyle: 'solid',
                          borderColor: gridBorderColor,
                          borderLeftWidth: (adjacentTables.left && isFirstCol) ? 0 : `${gridBorderWidth}px`,
                          borderRightWidth: `${gridBorderWidth}px`,
                          borderBottomWidth: `${gridBorderWidth}px`,
                        }}>
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (el.type === 'gridtable') {
      const config = el.gridTableConfig;
      if (!config) return <div>Invalid Grid Table Config</div>;

      const gridBorderColor = (el.style?.gridBorderColor as string) || '#000000';
      const gridBorderWidth = (el.style?.gridBorderWidth as number) || 1;
      
      // Detect adjacent tables for border merging
      const adjacentTables = detectAdjacentTables(el);
      
      // Create a map of cells by position for easier lookup
      const cellMap = new Map<string, typeof config.cells[0]>();
      const occupiedCells = new Set<string>();
      
      config.cells.forEach(cell => {
        const key = `${cell.row}-${cell.col}`;
        cellMap.set(key, cell);
        
        // Mark all cells that are occupied by this cell (including spans)
        for (let r = cell.row; r < cell.row + (cell.rowSpan || 1); r++) {
          for (let c = cell.col; c < cell.col + (cell.colSpan || 1); c++) {
            if (r !== cell.row || c !== cell.col) {
              occupiedCells.add(`${r}-${c}`);
            }
          }
        }
      });
      
      // Calculate column widths (use custom or equal distribution)
      // Guard against division by zero
      const colWidths = config.colWidths || (config.cols > 0 ? Array(config.cols).fill(100 / config.cols) : [100]);
      
      // Calculate row heights and normalize to fit container exactly
      let rowHeights = config.rowHeights || (config.rows > 0 ? Array(config.rows).fill(el.height / config.rows) : [el.height]);
      
      // Normalize row heights to prevent floating-point gaps
      rowHeights = normalizeRowHeights(rowHeights, el.height);
      
      return (
        <div className="w-full h-full pointer-events-auto relative">
          <div className="w-full h-full">
            <table className="w-full h-full text-sm text-left border-collapse pointer-events-auto" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {colWidths.map((width, colIdx) => (
                <col key={colIdx} style={{ width: `${width}%` }} />
              ))}
            </colgroup>
            <tbody>
              {Array.from({ length: config.rows }, (_, rowIdx) => {
                const rowHeight = rowHeights[rowIdx];
                const isHovered = hoveredRow?.elementId === el.id && hoveredRow?.row === rowIdx;
                
                return (
                  <tr 
                    key={rowIdx}
                    style={{ height: `${rowHeight}px` }}
                    onClick={() => {
                      if (!isPreviewMode) {
                        setSelectedRow({ elementId: el.id, row: rowIdx });
                      }
                    }}
                    onMouseEnter={() => {
                      if (!isPreviewMode) {
                        // Cancel any pending timeout when entering a row
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                          hoverTimeoutRef.current = null;
                        }
                        setHoveredRow({ elementId: el.id, row: rowIdx });
                      }
                    }}
                    onMouseLeave={(e) => {
                      // Don't clear hover if moving to the delete button
                      if (!isPreviewMode) {
                        // Cancel any existing timeout to avoid race conditions
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                        }
                        // Use setTimeout(0) to defer execution until after the current event loop,
                        // allowing the delete button's onMouseEnter to fire first
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredRow(prev => {
                            // Only clear if we're still on the same row (not re-entered)
                            if (prev?.elementId === el.id && prev?.row === rowIdx) {
                              return null;
                            }
                            return prev;
                          });
                          hoverTimeoutRef.current = null;
                        }, 0);
                      }
                    }}
                  >
                  {Array.from({ length: config.cols }, (_, colIdx) => {
                    const key = `${rowIdx}-${colIdx}`;
                    
                    // Skip cells that are occupied by a spanning cell
                    if (occupiedCells.has(key)) {
                      return null;
                    }
                    
                    const cell = cellMap.get(key);
                    const rowSpan = cell?.rowSpan || 1;
                    const colSpan = cell?.colSpan || 1;
                    
                    let content = cell?.content || '';
                    
                    // Handle data binding in preview mode
                    if (isPreviewMode && cell?.binding) {
                      content = getValue(sampleData, cell.binding, `{{${cell.binding}}}`);
                    }
                    
                    // Process content to replace bindings with values in preview mode
                    if (isPreviewMode && content && typeof content === 'string') {
                      content = content.replace(/\{\{([^}]+)\}\}/g, (match, binding) => {
                        return getValue(sampleData, binding.trim(), match);
                      });
                    }
                    
                    const isEditing = editingCell?.elementId === el.id && editingCell?.row === rowIdx && editingCell?.col === colIdx;
                    
                    // Determine which borders to hide based on adjacent tables and cell position
                    const isFirstRow = rowIdx === 0;
                    const isLastRow = rowIdx === config.rows - 1;
                    const isFirstCol = colIdx === 0;
                    const isLastCol = colIdx === config.cols - 1;
                    
                    return (
                      <ContextMenu key={colIdx}>
                        <ContextMenuTrigger asChild>
                          <td 
                            rowSpan={rowSpan}
                            colSpan={colSpan}
                            className={clsx(
                              "p-2",
                              !isPreviewMode && "cursor-text hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            )}
                            style={{ 
                              borderColor: gridBorderColor,
                              borderWidth: `${gridBorderWidth}px`,
                              borderStyle: 'solid',
                              borderTopWidth: (adjacentTables.top && isFirstRow) ? 0 : `${gridBorderWidth}px`,
                              borderRightWidth: `${gridBorderWidth}px`,
                              borderBottomWidth: `${gridBorderWidth}px`,
                              borderLeftWidth: (adjacentTables.left && isFirstCol) ? 0 : `${gridBorderWidth}px`,
                              ...getCellStyle(cell)
                            }}
                            tabIndex={isPreviewMode ? undefined : 0}
                            role={isPreviewMode ? undefined : "button"}
                            aria-label={isPreviewMode ? undefined : `Cell at row ${rowIdx}, column ${colIdx}. Double-click to edit.`}
                            onDoubleClick={(e) => {
                              if (!isPreviewMode) {
                                e.stopPropagation();
                                setEditingCell({ elementId: el.id, row: rowIdx, col: colIdx });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (!isPreviewMode && e.key === 'Enter') {
                                e.stopPropagation();
                                setEditingCell({ elementId: el.id, row: rowIdx, col: colIdx });
                              }
                            }}
                            onContextMenu={(e) => {
                              if (!isPreviewMode) {
                                e.stopPropagation();
                                setContextMenuCell({ elementId: el.id, row: rowIdx, col: colIdx });
                              }
                            }}
                          >
                            {isEditing && !isPreviewMode ? (
                              <textarea
                                autoFocus
                                className="w-full h-auto min-h-[24px] text-xs pointer-events-auto border-none outline-none resize-none bg-transparent"
                                value={cell?.content || ''}
                                aria-label={`Edit content for cell at row ${rowIdx}, column ${colIdx}`}
                                onChange={(e) => {
                                  handleCellContentUpdate(el.id, rowIdx, colIdx, e.target.value);
                                }}
                                onBlur={() => setEditingCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    e.stopPropagation();
                                  }
                                  // Don't stop propagation for Enter to allow line breaks
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={getCellStyle(cell)}
                              />
                            ) : (
                              <div style={{ 
                                whiteSpace: 'pre-wrap', 
                                wordBreak: 'break-word',
                                ...getCellStyle(cell)
                              }}>
                                {content}
                              </div>
                            )}
                          </td>
                        </ContextMenuTrigger>
                        {!isPreviewMode && (
                          <ContextMenuContent className="pointer-events-auto">
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <AlignLeft className="w-4 h-4 mr-2" />
                                Text Align
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent>
                                <ContextMenuItem onClick={() => handleCellStyleUpdate(el.id, rowIdx, colIdx, 'textAlign', 'left')}>
                                  <AlignLeft className="w-4 h-4 mr-2" />
                                  Left
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleCellStyleUpdate(el.id, rowIdx, colIdx, 'textAlign', 'center')}>
                                  <AlignCenter className="w-4 h-4 mr-2" />
                                  Center
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleCellStyleUpdate(el.id, rowIdx, colIdx, 'textAlign', 'right')}>
                                  <AlignRight className="w-4 h-4 mr-2" />
                                  Right
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleCellStyleUpdate(el.id, rowIdx, colIdx, 'textAlign', 'justify')}>
                                  <AlignJustify className="w-4 h-4 mr-2" />
                                  Justify
                                </ContextMenuItem>
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <Bold className="w-4 h-4 mr-2" />
                                Text Style
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent>
                                <ContextMenuItem onClick={() => {
                                  const currentWeight = cell?.style?.fontWeight;
                                  handleCellStyleUpdate(el.id, rowIdx, colIdx, 'fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
                                }}>
                                  <Bold className="w-4 h-4 mr-2" />
                                  {cell?.style?.fontWeight === 'bold' ? 'Remove Bold' : 'Bold'}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => {
                                  const currentStyle = cell?.style?.fontStyle;
                                  handleCellStyleUpdate(el.id, rowIdx, colIdx, 'fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
                                }}>
                                  <Italic className="w-4 h-4 mr-2" />
                                  {cell?.style?.fontStyle === 'italic' ? 'Remove Italic' : 'Italic'}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => {
                                  const currentDecoration = cell?.style?.textDecoration;
                                  handleCellStyleUpdate(el.id, rowIdx, colIdx, 'textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
                                }}>
                                  <Underline className="w-4 h-4 mr-2" />
                                  {cell?.style?.textDecoration === 'underline' ? 'Remove Underline' : 'Underline'}
                                </ContextMenuItem>
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                            <ContextMenuSeparator />
                            {sampleData && (
                              <ContextMenuSub>
                                <ContextMenuSubTrigger>
                                  <Database className="w-4 h-4 mr-2" />
                                  Bind Data
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent>
                                  {renderDataTree(buildDataPathTree(sampleData), el.id, rowIdx, colIdx)}
                                </ContextMenuSubContent>
                              </ContextMenuSub>
                            )}
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => handleMergeCells(el.id, rowIdx, colIdx)}>
                              <Grid3x3 className="w-4 h-4 mr-2" />
                              Merge with next cell
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleSubdivideCell(el.id, rowIdx, colIdx)}>
                              <Grid3x3 className="w-4 h-4 mr-2" />
                              Subdivide cell
                            </ContextMenuItem>
                          </ContextMenuContent>
                        )}
                      </ContextMenu>
                    );
                  })}
                </tr>
              );
            })}
            </tbody>
          </table>
          </div>
          {/* Overlay delete buttons for rows */}
          {!isPreviewMode && (selectedRow || hoveredRow) && config.rows > 1 && (() => {
            // Priority: hoveredRow takes precedence over selectedRow to provide immediate visual feedback
            const displayRow = hoveredRow?.elementId === el.id ? hoveredRow : selectedRow;
            if (!displayRow || displayRow.elementId !== el.id) return null;
            
            return (
            <div
              className="absolute right-0 pointer-events-auto"
              style={{
                top: `${rowHeights.slice(0, displayRow.row).reduce((sum, h) => sum + h, 0)}px`,
                height: `${rowHeights[displayRow.row]}px`,
                display: 'flex',
                alignItems: 'center',
                transform: 'translateX(calc(100% + 4px))',
                zIndex: 10
              }}
              onMouseEnter={() => {
                // Cancel any pending timeout when entering the delete button
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
                // Maintain the hover state when entering the delete button area
                if (displayRow && displayRow.elementId === el.id) {
                  setHoveredRow({ elementId: el.id, row: displayRow.row });
                }
              }}
              onMouseLeave={() => {
                // Clear hover state when leaving the delete button area
                setHoveredRow(null);
                // Clear any pending timeout
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-80 hover:opacity-100 shadow-sm border border-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRow(el.id, displayRow.row);
                  setHoveredRow(null);
                  setSelectedRow(null);
                }}
                title={`Delete row ${displayRow.row + 1}`}
                aria-label={`Delete row ${displayRow.row + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            );
          })()}
          {/* Row resize handles */}
          {!isPreviewMode && config.rows > 1 && rowHeights.slice(0, -1).map((_, rowIdx) => {
            const topPos = rowHeights.slice(0, rowIdx + 1).reduce((sum, h) => sum + h, 0);
            return (
              <div
                key={`row-resize-${rowIdx}`}
                className="absolute left-0 right-0 pointer-events-auto cursor-row-resize hover:bg-blue-500/20"
                style={{
                  top: `${topPos - RESIZE_HANDLE_OFFSET}px`,
                  height: `${RESIZE_HANDLE_SIZE}px`,
                  zIndex: 5
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingBorder({
                    elementId: el.id,
                    type: 'row',
                    index: rowIdx,
                    startPos: e.clientY,
                    startSize: rowHeights[rowIdx]
                  });
                }}
              />
            );
          })}
          {/* Column resize handles */}
          {!isPreviewMode && config.cols > 1 && colWidths.slice(0, -1).map((_, colIdx) => {
            const leftPercent = colWidths.slice(0, colIdx + 1).reduce((sum, w) => sum + w, 0);
            return (
              <div
                key={`col-resize-${colIdx}`}
                className="absolute top-0 bottom-0 pointer-events-auto cursor-col-resize hover:bg-blue-500/20"
                style={{
                  left: `${leftPercent}%`,
                  width: `${RESIZE_HANDLE_SIZE}px`,
                  transform: `translateX(-${RESIZE_HANDLE_OFFSET}px)`,
                  zIndex: 5
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingBorder({
                    elementId: el.id,
                    type: 'col',
                    index: colIdx,
                    startPos: e.clientX,
                    startSize: colWidths[colIdx]
                  });
                }}
              />
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      className="relative mx-auto paper-canvas transition-transform origin-top"
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        transform: `scale(${scale})`,
        marginBottom: `${PAGE_HEIGHT * (scale - 1)}px` // Compensate for scale affecting flow
      }}
      ref={containerRef}
      onMouseDown={(e) => {
        // Only deselect if clicking directly on the canvas background
        if (e.target === e.currentTarget) {
          onElementSelect([], false);
          setSelectedRow(null);
        }
      }}
    >
      {/* Grid Rules Background */}
      {!isPreviewMode && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
          }}
        />
      )}
      {layout.elements.map((el) => {
        const isSelected = selectedElementIds.includes(el.id);

        return (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            dragGrid={[GRID_SIZE, GRID_SIZE]}
            resizeGrid={[GRID_SIZE, GRID_SIZE]}
            onDragStop={(e, d) => {
              // d.x and d.y are already snapped by dragGrid prop
              // Calculate the delta for this element
              const deltaX = d.x - el.x;
              const deltaY = d.y - el.y;
              
              // If multiple elements are selected, move them all
              if (selectedElementIds.length > 1 && selectedElementIds.includes(el.id)) {
                selectedElementIds.forEach(id => {
                  const element = layout.elements.find(e => e.id === id);
                  if (element) {
                    if (element.type === 'gridtable') {
                      const { x, y } = applyTableFusion(element.id, element.x + deltaX, element.y + deltaY);
                      onElementUpdate(element.id, { x, y });
                    } else {
                      onElementUpdate(element.id, { 
                        x: element.x + deltaX, 
                        y: element.y + deltaY 
                      });
                    }
                  }
                });
              } else {
                // Single element move
                if (el.type === 'gridtable') {
                  const { x, y } = applyTableFusion(el.id, d.x, d.y);
                  onElementUpdate(el.id, { x, y });
                } else {
                  onElementUpdate(el.id, { x: d.x, y: d.y });
                }
              }
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              const newWidth = snapToGrid(parseInt(ref.style.width));
              const newHeight = snapToGrid(parseInt(ref.style.height));
              const newX = snapToGrid(position.x);
              const newY = snapToGrid(position.y);
              
              // For gridtable, handle proportional resizing on height change
              if (el.type === 'gridtable' && el.gridTableConfig && el.height !== newHeight) {
                const config = el.gridTableConfig;
                const oldHeight = el.height;
                const heightRatio = newHeight / oldHeight;
                
                // Scale all row heights proportionally
                // Note: Column widths are stored as percentages, so they scale naturally with width changes
                let newRowHeights: number[] | undefined;
                if (config.rowHeights && config.rowHeights.length > 0) {
                  newRowHeights = config.rowHeights.map(h => h * heightRatio);
                } else {
                  // If no custom row heights, create proportional ones based on equal distribution
                  const scaledRowHeight = (oldHeight / config.rows) * heightRatio;
                  newRowHeights = Array(config.rows).fill(scaledRowHeight);
                }
                
                onElementUpdate(el.id, {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                  gridTableConfig: {
                    ...config,
                    rowHeights: newRowHeights
                  }
                });
              } else if (el.type === 'table' && el.tableConfig && el.tableConfig.tableType === 'price') {
                // For price tables, handle proportional resizing on height and/or width change
                const config = el.tableConfig;
                const heightChanged = el.height !== newHeight;
                const widthChanged = el.width !== newWidth;
                
                // Calculate total rows for price table (columns + additional rows)
                const totalRows = config.columns.length + (config.additionalRows?.length || 0);
                
                let newRowHeights: number[] | undefined = config.rowHeights;
                let newColWidths: number[] | undefined = config.colWidths;
                
                // Handle height changes - scale row heights proportionally
                if (heightChanged) {
                  const oldHeight = el.height;
                  const heightRatio = newHeight / oldHeight;
                  
                  if (config.rowHeights && config.rowHeights.length > 0) {
                    newRowHeights = config.rowHeights.map(h => h * heightRatio);
                  } else if (totalRows > 0) {
                    // If no custom row heights, create proportional ones based on equal distribution
                    const scaledRowHeight = newHeight / totalRows;
                    newRowHeights = Array(totalRows).fill(scaledRowHeight);
                  } else {
                    // Edge case: no rows defined, keep undefined to use default rendering
                    newRowHeights = undefined;
                  }
                }
                
                // Handle width changes - ensure colWidths are initialized for proportional scaling
                // Price tables always have 2 columns (label and value)
                // Column widths are already percentages, so they scale naturally with width changes
                if (widthChanged || !config.colWidths) {
                  if (!config.colWidths || config.colWidths.length !== 2) {
                    // Initialize to equal distribution for 2 columns
                    newColWidths = DEFAULT_PRICE_TABLE_COL_WIDTHS;
                  } else {
                    // Keep existing colWidths (percentages scale naturally)
                    newColWidths = config.colWidths;
                  }
                }
                
                onElementUpdate(el.id, {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                  tableConfig: {
                    ...config,
                    rowHeights: newRowHeights,
                    colWidths: newColWidths
                  }
                });
                
                // Adjust any tables that are vertically fused below this price table
                if (heightChanged) {
                  adjustVerticallyFusedTables(
                    { ...el, width: newWidth, height: newHeight, x: newX, y: newY },
                    el.height,
                    newHeight
                  );
                }
              } else if (el.type === 'table' && el.tableConfig && el.tableConfig.tableType === 'invoice') {
                // For invoice tables, handle proportional resizing on height and/or width change
                const config = el.tableConfig;
                const heightChanged = el.height !== newHeight;
                const widthChanged = el.width !== newWidth;
                
                // Calculate total rows for invoice table (header + data rows + footer rows)
                const headerRows = 1;
                const dataRows = INVOICE_TABLE_EDITOR_DATA_ROWS;
                const footerRowsCount = config.footerRows?.length || 0;
                const totalRows = headerRows + dataRows + footerRowsCount;
                
                let newRowHeights: number[] | undefined = config.rowHeights;
                let newColWidths: number[] | undefined = config.colWidths;
                
                // Handle height changes - scale row heights proportionally
                if (heightChanged) {
                  const oldHeight = el.height;
                  const heightRatio = newHeight / oldHeight;
                  
                  if (config.rowHeights && config.rowHeights.length > 0) {
                    newRowHeights = config.rowHeights.map(h => h * heightRatio);
                  } else if (totalRows > 0) {
                    // If no custom row heights, create proportional ones based on equal distribution
                    const scaledRowHeight = newHeight / totalRows;
                    newRowHeights = Array(totalRows).fill(scaledRowHeight);
                  } else {
                    // Edge case: no rows defined, keep undefined to use default rendering
                    newRowHeights = undefined;
                  }
                }
                
                // Handle width changes - ensure colWidths are initialized for proportional scaling
                // Column widths are already percentages, so they scale naturally with width changes
                // We just need to ensure they're initialized if they don't exist yet
                if (widthChanged || !config.colWidths) {
                  if (!config.colWidths) {
                    // Initialize from existing column widths
                    newColWidths = initializeColumnWidths(config.columns);
                  } else {
                    // Keep existing colWidths (percentages scale naturally)
                    newColWidths = config.colWidths;
                  }
                }
                
                onElementUpdate(el.id, {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                  tableConfig: {
                    ...config,
                    rowHeights: newRowHeights,
                    colWidths: newColWidths
                  }
                });
                
                // Adjust any tables that are vertically fused below this invoice table
                if (heightChanged) {
                  adjustVerticallyFusedTables(
                    { ...el, width: newWidth, height: newHeight, x: newX, y: newY },
                    el.height,
                    newHeight
                  );
                }
              } else if (el.type === 'table' && el.tableConfig && el.tableConfig.tableType === 'grid') {
                // For grid tables (data array tables), handle proportional resizing on width change
                const config = el.tableConfig;
                const widthChanged = el.width !== newWidth;
                
                let newColWidths: number[] | undefined = config.colWidths;
                
                // Handle width changes - ensure colWidths are initialized for proportional scaling
                // Column widths are already percentages, so they scale naturally with width changes
                // We just need to ensure they're initialized if they don't exist yet
                if (widthChanged || !config.colWidths) {
                  if (!config.colWidths) {
                    // Initialize from existing column widths
                    newColWidths = initializeColumnWidths(config.columns);
                  } else {
                    // Keep existing colWidths (percentages scale naturally)
                    newColWidths = config.colWidths;
                  }
                }
                
                onElementUpdate(el.id, {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                  tableConfig: {
                    ...config,
                    colWidths: newColWidths
                  }
                });
              } else {
                onElementUpdate(el.id, {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                });
              }
            }}
            bounds="parent"
            disableDragging={isPreviewMode}
            enableResizing={!isPreviewMode}
            className={clsx(
              "transition-colors",
              !isPreviewMode && "cursor-move",
              !isPreviewMode && isSelected && "element-selected z-10",
              !isPreviewMode && !isSelected && "hover:element-hovered"
            )}
            onMouseDown={(e) => {
              if (!isPreviewMode) {
                e.stopPropagation();
                const isMultiSelect = e.ctrlKey || e.metaKey;
                
                if (isMultiSelect) {
                  // Toggle selection
                  if (selectedElementIds.includes(el.id)) {
                    onElementSelect(selectedElementIds.filter(id => id !== el.id), true);
                  } else {
                    onElementSelect([...selectedElementIds, el.id], true);
                  }
                } else {
                  // Single selection
                  onElementSelect([el.id], false);
                }
              }
            }}
          >
            <div className="w-full h-full relative pointer-events-none">
               {renderElementContent(el)}
               {!isPreviewMode && (
                 <div 
                   className={clsx(
                     "absolute inset-0 z-30 border-2 pointer-events-none",
                     isSelected ? "border-primary bg-primary/5" : "border-transparent"
                   )}
                 />
               )}
               {!isPreviewMode && isSelected && el.type === 'table' && (
                 <div 
                   className={clsx(
                     "absolute left-0 right-0 bg-white border rounded-lg shadow-lg p-2 flex items-center gap-3 pointer-events-auto z-40",
                     getToolbarPositionClass(el, PAGE_HEIGHT)
                      )}
                      onClick={(e) => e.stopPropagation()}
                 >
                   <div className="flex items-center gap-2">
                     <Palette className="w-4 h-4 text-muted-foreground" />
                     <Label className="text-xs text-muted-foreground whitespace-nowrap">Border:</Label>
                     <Input 
                       type="color" 
                       className="w-10 h-8 p-1 cursor-pointer"
                       value={el.style?.gridBorderColor as string || '#000000'}
                       onChange={(e) => {
                         e.stopPropagation();
                         onElementUpdate(el.id, {
                           style: { ...el.style, gridBorderColor: e.target.value }
                         });
                       }}
                       onClick={(e) => e.stopPropagation()}
                     />
                   </div>
                   <div className="flex items-center gap-2">
                     <Ruler className="w-4 h-4 text-muted-foreground" />
                     <Label className="text-xs text-muted-foreground whitespace-nowrap">Width:</Label>
                     <Input 
                       type="number"
                       className="w-16 h-8 text-sm"
                       value={el.style?.gridBorderWidth as number || 1} 
                       onChange={(e) => {
                         e.stopPropagation();
                         onElementUpdate(el.id, {
                           style: { ...el.style, gridBorderWidth: parseInt(e.target.value) || 1 }
                         });
                       }}
                       onClick={(e) => e.stopPropagation()}
                       min={0}
                       max={10}
                     />
                     <span className="text-xs text-muted-foreground">px</span>
                   </div>
                   <div className="flex-1" />
                    {el.tableConfig?.tableType === 'price' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePriceTableAddRow(el.id);
                          }}
                          title="Add row"
                          aria-label="Add row"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          <Rows className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePriceTableRemoveRow(el.id);
                          }}
                          title="Remove last row"
                          aria-label="Remove last row"
                          disabled={!el.tableConfig?.additionalRows || el.tableConfig.additionalRows.length === 0}
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          <Rows className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {el.tableConfig?.tableType === 'invoice' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvoiceTableAddFooterRow(el.id);
                          }}
                          title="Add footer row"
                          aria-label="Add footer row"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          <Rows className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvoiceTableRemoveFooterRow(el.id);
                          }}
                          title="Remove last footer row"
                          aria-label="Remove last footer row"
                          disabled={!el.tableConfig?.footerRows || el.tableConfig.footerRows.length === 0}
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          <Rows className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClone(el.id);
                      }}
                      title="Clone table"
                      aria-label="Clone table"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                 </div>
               )}
                {!isPreviewMode && isSelected && el.type === 'gridtable' && (
                  <div 
                    className={clsx(
                      "absolute left-0 right-0 bg-white border rounded-lg shadow-lg p-2 flex items-center gap-2 pointer-events-auto z-40",
                      getToolbarPositionClass(el, PAGE_HEIGHT)
                      )}
                      onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="color" 
                        className="w-10 h-8 p-1 cursor-pointer"
                        value={el.style?.gridBorderColor as string || '#000000'}
                        onChange={(e) => {
                          e.stopPropagation();
                          onElementUpdate(el.id, {
                            style: { ...el.style, gridBorderColor: e.target.value }
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="number"
                        className="w-12 h-8 text-sm"
                        value={el.style?.gridBorderWidth as number || 1} 
                        onChange={(e) => {
                          e.stopPropagation();
                          onElementUpdate(el.id, {
                            style: { ...el.style, gridBorderWidth: parseInt(e.target.value) || 1 }
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        min={0}
                        max={10}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddRow(el.id);
                      }}
                      title="Add row"
                      aria-label="Add row"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      <Rows className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(el.id);
                      }}
                      title="Delete last row"
                      aria-label="Delete last row"
                      disabled={el.gridTableConfig?.rows === 1}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      <Rows className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddColumn(el.id);
                      }}
                      title="Add column"
                      aria-label="Add column"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      <Columns className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteColumn(el.id);
                      }}
                      title="Delete last column"
                      aria-label="Delete last column"
                      disabled={el.gridTableConfig?.cols === 1}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      <Columns className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClone(el.id);
                      }}
                      title="Clone grid table"
                      aria-label="Clone grid table"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}
