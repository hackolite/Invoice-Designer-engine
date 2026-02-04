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

interface CanvasProps {
  layout: TemplateLayout;
  sampleData: any;
  selectedElementId: string | null;
  onElementSelect: (id: string | null) => void;
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

// Default footer row for price tables
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
  selectedElementId,
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
  const [editingFooterCell, setEditingFooterCell] = useState<{ elementId: string; footerIdx: number; field: 'label' | 'value' } | null>(null);

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

  // Handlers for footer cell updates in price tables
  const handleFooterCellUpdate = (elementId: string, footerIdx: number, field: 'label' | 'value', newValue: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.tableConfig || !element.tableConfig.footer) return;
    
    const config = element.tableConfig;
    const footer = config.footer; // Extract footer for type narrowing
    if (!footer) return; // Additional safety check
    const newFooter = [...footer];
    newFooter[footerIdx] = { ...newFooter[footerIdx], [field]: newValue };
    
    onElementUpdate(elementId, {
      tableConfig: { ...config, footer: newFooter }
    });
  };

  // Handler to add footer row to price table
  const handleAddFooter = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.tableConfig) return;
    
    const config = element.tableConfig;
    
    onElementUpdate(elementId, {
      tableConfig: {
        ...config,
        footer: [...(config.footer || []), DEFAULT_FOOTER_ROW]
      }
    });
  };

  // Handler to remove last footer row from price table
  const handleRemoveLastFooter = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.tableConfig) return;
    
    const config = element.tableConfig;
    const footer = config.footer;
    
    // Early return if no footer or empty footer array
    if (!footer || footer.length === 0) return;
    
    const newFooter = [...footer];
    newFooter.pop(); // Remove last footer row
    
    onElementUpdate(elementId, {
      tableConfig: {
        ...config,
        footer: newFooter
      }
    });
  };

  // Handler to add footer row to gridtable
  const handleAddGridTableFooter = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    
    onElementUpdate(elementId, {
      gridTableConfig: {
        ...config,
        footer: [...(config.footer || []), DEFAULT_FOOTER_ROW]
      }
    });
  };

  // Handler to remove last footer row from gridtable
  const handleRemoveLastGridTableFooter = (elementId: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig) return;
    
    const config = element.gridTableConfig;
    const footer = config.footer;
    
    // Early return if no footer or empty footer array
    if (!footer || footer.length === 0) return;
    
    const newFooter = [...footer];
    newFooter.pop(); // Remove last footer row
    
    onElementUpdate(elementId, {
      gridTableConfig: {
        ...config,
        footer: newFooter
      }
    });
  };

  // Handler to update footer cell in gridtable
  const handleGridTableFooterCellUpdate = (elementId: string, footerIdx: number, field: 'label' | 'value', newValue: string) => {
    const element = layout.elements.find(e => e.id === elementId);
    if (!element || !element.gridTableConfig || !element.gridTableConfig.footer) return;
    
    const config = element.gridTableConfig;
    const footer = config.footer || [];
    if (footer.length === 0) return;
    
    const newFooter = [...footer];
    newFooter[footerIdx] = { ...newFooter[footerIdx], [field]: newValue };
    
    onElementUpdate(elementId, {
      gridTableConfig: { ...config, footer: newFooter }
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
    const totalRows = config.columns.length + (config.footer?.length || 0);
    
    // Guard against invalid row index (resize handles exist between rows, so max index is totalRows - 2)
    if (totalRows <= 0 || rowIndex >= totalRows - 1) return;
    
    const rowHeights = config.rowHeights || (totalRows > 0 ? Array(totalRows).fill(element.height / totalRows) : []);
    const newRowHeights = [...rowHeights];
    newRowHeights[rowIndex] = Math.max(MIN_ROW_HEIGHT, newHeight);
    
    // Update total element height
    const newTotalHeight = newRowHeights.reduce((sum, h) => sum + h, 0);
    
    onElementUpdate(elementId, {
      tableConfig: { ...config, rowHeights: newRowHeights },
      height: newTotalHeight
    });
  };

  // Detect and apply fusion between nearby gridtables
  const applyTableFusion = (movedElementId: string, newX: number, newY: number) => {
    const movedElement = layout.elements.find(e => e.id === movedElementId);
    if (!movedElement || movedElement.type !== 'gridtable' || !movedElement.gridTableConfig) return { x: newX, y: newY };

    const updates: { id: string; updates: Partial<TemplateElement> }[] = [];
    let finalX = newX;
    let finalY = newY;

    // Check against other gridtables
    for (const otherEl of layout.elements) {
      if (otherEl.id === movedElementId || otherEl.type !== 'gridtable' || !otherEl.gridTableConfig) continue;

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
        const totalRows = config.columns.length + (config.footer?.length || 0);
        const rowHeights = config.rowHeights || (totalRows > 0 ? Array(totalRows).fill(el.height / totalRows) : []);
        
        return (
          <div className="w-full h-full pointer-events-auto relative">
            <div className={clsx(
              "w-full h-full overflow-hidden",
              tableStyle === 'default' && "",
              tableStyle === 'minimal' && "",
              tableStyle === 'modern' && "rounded-lg shadow-sm"
            )}>
              <table className="w-full text-sm text-left border-collapse">
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
                  
                  return (
                    <tr key={idx} className={clsx(
                      tableStyle === 'default' && "hover:bg-gray-50",
                      tableStyle === 'modern' && idx % 2 === 0 ? "bg-primary/5" : "bg-white"
                    )}>
                      <th className="p-2 text-left font-medium" style={{ 
                        width: col.width || '50%',
                        borderWidth: `${gridBorderWidth}px`,
                        borderStyle: 'solid',
                        borderColor: gridBorderColor
                      }}>
                        {col.header}
                      </th>
                      <td className="p-2" style={{ 
                        borderWidth: `${gridBorderWidth}px`,
                        borderStyle: 'solid',
                        borderColor: gridBorderColor
                      }}>
                        {cellValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {config.footer && config.footer.length > 0 && (
                <tfoot className="bg-gray-50 font-semibold">
                  {config.footer.map((footerRow, idx) => {
                    let footerValue;
                    if (isPreviewMode) {
                      // Try to parse as binding first - check for pattern {bindingName}
                      if (footerRow.value.startsWith('{') && footerRow.value.endsWith('}') && footerRow.value.length > 2) {
                        const binding = footerRow.value.slice(1, -1).trim();
                        if (binding.length > 0) {
                          const rawVal = getValue(sourceData, binding);
                          if (footerRow.format === 'currency') {
                            const currency = config.currency || 'USD';
                            if (currency === 'none') {
                              footerValue = Number(rawVal) || 0;
                            } else {
                              footerValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(rawVal) || 0);
                            }
                          } else if (footerRow.format === 'number') {
                            footerValue = new Intl.NumberFormat('en-US').format(Number(rawVal) || 0);
                          } else {
                            footerValue = rawVal;
                          }
                        } else {
                          footerValue = footerRow.value;
                        }
                      } else {
                        // Static text
                        footerValue = footerRow.value;
                      }
                    } else {
                      footerValue = footerRow.value;
                    }
                    
                    const isEditingLabel = editingFooterCell?.elementId === el.id && editingFooterCell?.footerIdx === idx && editingFooterCell?.field === 'label';
                    const isEditingValue = editingFooterCell?.elementId === el.id && editingFooterCell?.footerIdx === idx && editingFooterCell?.field === 'value';
                    
                    return (
                      <tr key={`footer-${idx}`}>
                        <th 
                          className={clsx(
                            "p-2 text-left font-semibold",
                            !isPreviewMode && "cursor-text hover:bg-blue-50"
                          )}
                          style={{
                            width: '50%',
                            borderWidth: `${gridBorderWidth}px`,
                            borderStyle: 'solid',
                            borderColor: gridBorderColor
                          }}
                          onDoubleClick={(e) => {
                            if (!isPreviewMode) {
                              e.stopPropagation();
                              setEditingFooterCell({ elementId: el.id, footerIdx: idx, field: 'label' });
                            }
                          }}
                        >
                          {isEditingLabel && !isPreviewMode ? (
                            <input
                              autoFocus
                              className="w-full pointer-events-auto border-none outline-none bg-transparent font-semibold"
                              value={footerRow.label}
                              onChange={(e) => {
                                handleFooterCellUpdate(el.id, idx, 'label', e.target.value);
                              }}
                              onBlur={() => setEditingFooterCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape' || e.key === 'Enter') {
                                  setEditingFooterCell(null);
                                  e.stopPropagation();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            footerRow.label
                          )}
                        </th>
                        <td 
                          className={clsx(
                            "p-2 font-semibold",
                            !isPreviewMode && "cursor-text hover:bg-blue-50"
                          )}
                          style={{
                            borderWidth: `${gridBorderWidth}px`,
                            borderStyle: 'solid',
                            borderColor: gridBorderColor
                          }}
                          onDoubleClick={(e) => {
                            if (!isPreviewMode) {
                              e.stopPropagation();
                              setEditingFooterCell({ elementId: el.id, footerIdx: idx, field: 'value' });
                            }
                          }}
                        >
                          {isEditingValue && !isPreviewMode ? (
                            <input
                              autoFocus
                              className="w-full pointer-events-auto border-none outline-none bg-transparent font-semibold"
                              value={footerRow.value}
                              onChange={(e) => {
                                handleFooterCellUpdate(el.id, idx, 'value', e.target.value);
                              }}
                              onBlur={() => setEditingFooterCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape' || e.key === 'Enter') {
                                  setEditingFooterCell(null);
                                  e.stopPropagation();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            footerValue
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tfoot>
              )}
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

      // Handle grid table (array of items)
      const data = isPreviewMode 
        ? getValue(sampleData, config.dataSource, []) 
        : [1, 2, 3]; // Dummy rows for editor
      
      return (
        <div className={clsx(
          "w-full h-full overflow-hidden",
          tableStyle === 'default' && "",
          tableStyle === 'minimal' && "",
          tableStyle === 'modern' && "rounded-lg shadow-sm"
        )}>
          <table className="w-full text-sm text-left border-collapse">
            <thead className={clsx(
              tableStyle === 'default' && "bg-gray-100 text-gray-700 font-medium",
              tableStyle === 'minimal' && "text-gray-900 font-bold",
              tableStyle === 'modern' && "bg-primary text-primary-foreground font-semibold"
            )}>
              <tr>
                {config.columns.map((col, idx) => (
                  <th key={idx} className="p-2" style={{ 
                    width: col.width,
                    borderWidth: `${gridBorderWidth}px`,
                    borderStyle: 'solid',
                    borderColor: gridBorderColor
                  }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.map((row, rIdx) => (
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
                    
                    return (
                      <td key={cIdx} className="p-2" style={{ 
                        borderWidth: `${gridBorderWidth}px`,
                        borderStyle: 'solid',
                        borderColor: gridBorderColor
                      }}>
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
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
      
      // Ensure row heights fit within container height to prevent overflow/cropping
      const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
      if (totalHeight > 0 && Math.abs(totalHeight - el.height) > 0.01) {
        // Normalize row heights to fit exactly within container
        const scaleFactor = el.height / totalHeight;
        rowHeights = rowHeights.map(h => h * scaleFactor);
      }
      
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
            {config.footer && config.footer.length > 0 && (
              <tfoot className="bg-gray-50 font-semibold">
                {config.footer.map((footerRow, idx) => {
                  let footerValue;
                  if (isPreviewMode) {
                    // Try to parse as binding first - check for pattern {bindingName}
                    if (footerRow.value.startsWith('{') && footerRow.value.endsWith('}') && footerRow.value.length > 2) {
                      const binding = footerRow.value.slice(1, -1).trim();
                      if (binding.length > 0) {
                        const rawVal = getValue(sampleData, binding);
                        if (footerRow.format === 'currency') {
                          footerValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(rawVal) || 0);
                        } else if (footerRow.format === 'number') {
                          footerValue = new Intl.NumberFormat('en-US').format(Number(rawVal) || 0);
                        } else {
                          footerValue = rawVal;
                        }
                      } else {
                        footerValue = footerRow.value;
                      }
                    } else {
                      // Static text
                      footerValue = footerRow.value;
                    }
                  } else {
                    footerValue = footerRow.value;
                  }
                  
                  const isEditingLabel = editingFooterCell?.elementId === el.id && editingFooterCell?.footerIdx === idx && editingFooterCell?.field === 'label';
                  const isEditingValue = editingFooterCell?.elementId === el.id && editingFooterCell?.footerIdx === idx && editingFooterCell?.field === 'value';
                  
                  return (
                    <tr key={`footer-${idx}`}>
                      <th 
                        className={clsx(
                          "p-2 text-left font-semibold",
                          !isPreviewMode && "cursor-text hover:bg-blue-50"
                        )}
                        style={{
                          borderWidth: `${gridBorderWidth}px`,
                          borderStyle: 'solid',
                          borderColor: gridBorderColor
                        }}
                        colSpan={config.cols > 1 ? config.cols - 1 : 1}
                        onDoubleClick={(e) => {
                          if (!isPreviewMode) {
                            e.stopPropagation();
                            setEditingFooterCell({ elementId: el.id, footerIdx: idx, field: 'label' });
                          }
                        }}
                      >
                        {isEditingLabel && !isPreviewMode ? (
                          <input
                            autoFocus
                            className="w-full pointer-events-auto border-none outline-none bg-transparent font-semibold"
                            value={footerRow.label}
                            onChange={(e) => {
                              handleGridTableFooterCellUpdate(el.id, idx, 'label', e.target.value);
                            }}
                            onBlur={() => setEditingFooterCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape' || e.key === 'Enter') {
                                setEditingFooterCell(null);
                                e.stopPropagation();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          footerRow.label
                        )}
                      </th>
                      {config.cols > 1 && (
                        <td 
                          className={clsx(
                            "p-2 font-semibold",
                            !isPreviewMode && "cursor-text hover:bg-blue-50"
                          )}
                          style={{
                            borderWidth: `${gridBorderWidth}px`,
                            borderStyle: 'solid',
                            borderColor: gridBorderColor
                          }}
                          onDoubleClick={(e) => {
                            if (!isPreviewMode) {
                              e.stopPropagation();
                              setEditingFooterCell({ elementId: el.id, footerIdx: idx, field: 'value' });
                            }
                          }}
                        >
                          {isEditingValue && !isPreviewMode ? (
                            <input
                              autoFocus
                              className="w-full pointer-events-auto border-none outline-none bg-transparent font-semibold"
                              value={footerRow.value}
                              onChange={(e) => {
                                handleGridTableFooterCellUpdate(el.id, idx, 'value', e.target.value);
                              }}
                              onBlur={() => setEditingFooterCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape' || e.key === 'Enter') {
                                  setEditingFooterCell(null);
                                  e.stopPropagation();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            footerValue
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tfoot>
            )}
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
          onElementSelect(null);
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
        const isSelected = selectedElementId === el.id;

        return (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            dragGrid={[GRID_SIZE, GRID_SIZE]}
            resizeGrid={[GRID_SIZE, GRID_SIZE]}
            onDragStop={(e, d) => {
              if (el.type === 'gridtable') {
                const { x, y } = applyTableFusion(el.id, d.x, d.y);
                onElementUpdate(el.id, { x, y });
              } else {
                onElementUpdate(el.id, { x: snapToGrid(d.x), y: snapToGrid(d.y) });
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
                onElementSelect(el.id);
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
                           handleAddFooter(el.id);
                         }}
                         title="Add footer row"
                         aria-label="Add footer row"
                       >
                         <Plus className="w-3 h-3 mr-1" />
                         Footer
                       </Button>
                       {el.tableConfig?.footer && el.tableConfig.footer.length > 0 && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleRemoveLastFooter(el.id);
                           }}
                           title="Remove last footer row"
                           aria-label="Remove last footer row"
                         >
                           <Minus className="w-3 h-3 mr-1" />
                           Footer
                         </Button>
                       )}
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
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddGridTableFooter(el.id);
                      }}
                      title="Add footer row"
                      aria-label="Add footer row"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Footer
                    </Button>
                    {el.gridTableConfig?.footer && el.gridTableConfig.footer.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLastGridTableFooter(el.id);
                        }}
                        title="Remove last footer row"
                        aria-label="Remove last footer row"
                      >
                        <Minus className="w-3 h-3 mr-1" />
                        Footer
                      </Button>
                    )}
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
