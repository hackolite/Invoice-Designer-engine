import { useEffect, useState, useMemo } from "react";
import { useRoute } from "wouter";
import { useTemplate, useUpdateTemplate } from "@/hooks/use-templates";
import { Canvas } from "@/components/Canvas";
import { ElementProperties } from "@/components/ElementProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, Save, Type, Image as ImageIcon, Table as TableIcon, Grid3x3,
  Square, Layout, Eye, EyeOff, RotateCcw, Minus, Play, QrCode, PenTool, Award, Download, AlertCircle, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TemplateElement, TemplateLayout } from "@shared/schema";
import { Link } from "wouter";

// CSS properties that should not have 'px' appended when numeric
const UNITLESS_CSS_PROPERTIES = new Set([
  'opacity', 'z-index', 'font-weight', 'line-height', 'flex', 'flex-grow', 
  'flex-shrink', 'order', 'zoom', 'animation-iteration-count'
]);

// Helper function to convert camelCase style object to CSS string
const convertStyleObjectToCss = (style: Record<string, string | number>): string => {
  return Object.entries(style)
    .map(([key, value]) => {
      const kebabKey = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
      const cssValue = typeof value === 'number' && !UNITLESS_CSS_PROPERTIES.has(kebabKey)
        ? `${value}px` 
        : value;
      return `${kebabKey}: ${cssValue}`;
    })
    .join('; ');
};

const BLOB_URL_CLEANUP_DELAY_MS = 2000; // Time to allow window to load before cleaning up blob URL

// Helper function to resolve nested object paths for data binding
function getNestedValue(obj: any, path: string, defaultValue?: any) {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === undefined || result === null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

// Helper function to format currency values
function formatCurrency(value: any): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

// Helper function to parse sample data JSON
function parseSampleData(sampleData: string): any {
  try {
    return JSON.parse(sampleData || '{}');
  } catch (e) {
    console.error('Failed to parse sample data:', e);
    return {};
  }
}

// Helper function to render element content for PDF/HTML export
// Supports data binding when isPreviewMode is true
const renderElementForExport = (el: TemplateElement, isPreviewMode: boolean, sampleData: any): string => {
  const style = convertStyleObjectToCss(el.style || {});
  
  // Text element
  if (el.type === 'text') {
    let content: string;
    
    if (isPreviewMode && el.binding) {
      // Use actual data from binding in preview mode
      content = String(getNestedValue(sampleData, el.binding, `{{${el.binding}}}`));
    } else {
      // Show binding placeholder or static content
      content = el.binding ? `{{${el.binding}}}` : (el.content || 'Text');
    }
    
    // Process content to replace bindings with values in preview mode
    if (isPreviewMode && content) {
      content = content.replace(/\{\{([^}]+)\}\}/g, (match, binding) => {
        return String(getNestedValue(sampleData, binding.trim(), match));
      });
    }
    
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; ${style}">${content}</div>`;
  }
  
  // Badge element
  if (el.type === 'badge') {
    let content: string;
    
    if (isPreviewMode && el.binding) {
      // Use actual data from binding in preview mode
      content = String(getNestedValue(sampleData, el.binding, el.content || 'PAID'));
    } else {
      // Show binding placeholder or static content
      content = el.content || (el.binding ? `{{${el.binding}}}` : 'PAID');
    }
    
    return `<div class="element badge" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; ${style}">${content}</div>`;
  }
  
  // Line or Box element
  if (el.type === 'line' || el.type === 'box') {
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; ${style}"></div>`;
  }
  
  // Image element
  if (el.type === 'image') {
    const src = el.content || 'https://placehold.co/400?text=Image';
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;"><img src="${src}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`;
  }
  
  // QR Code element
  if (el.type === 'qr') {
    let qrData: string;
    
    if (isPreviewMode && el.binding) {
      // Use actual data from binding in preview mode
      qrData = String(getNestedValue(sampleData, el.binding, el.content || 'https://replit.com'));
    } else {
      // Use static content
      qrData = el.content || 'https://replit.com';
    }
    
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;"><img src="${src}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`;
  }
  
  // Signature element
  if (el.type === 'signature') {
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;"><img src="https://placehold.co/200x100?text=Signature" style="width: 100%; height: 100%; object-fit: contain;" /></div>`;
  }
  
  // Table element (data-bound table)
  if (el.type === 'table' && el.tableConfig) {
    const config = el.tableConfig;
    const gridBorderColor = (el.style?.gridBorderColor as string) || '#000000';
    const gridBorderWidth = (el.style?.gridBorderWidth as number) || 1;
    
    let tableHtml = '';
    
    if (config.tableType === 'price') {
      // Price table (key-value pairs from object)
      const sourceData = isPreviewMode 
        ? getNestedValue(sampleData, config.dataSource, {}) 
        : {}; // Empty object for template mode
      
      tableHtml = `<table style="width: 100%; border-collapse: collapse; border: ${gridBorderWidth}px solid ${gridBorderColor};">
        <tbody>
          ${config.columns.map((col, idx) => {
            let cellValue: string;
            
            if (isPreviewMode) {
              const rawVal = getNestedValue(sourceData, col.binding);
              if (col.format === 'currency') {
                cellValue = formatCurrency(rawVal);
              } else {
                cellValue = String(rawVal);
              }
            } else {
              cellValue = `{${col.binding}}`;
            }
            
            return `
            <tr>
              <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: ${idx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'}; border-right: ${gridBorderWidth}px solid ${gridBorderColor};">${col.header}</th>
              <td style="padding: 8px; border-bottom: ${idx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'};">${cellValue}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>`;
    } else {
      // Grid table (array of items)
      const data = isPreviewMode 
        ? getNestedValue(sampleData, config.dataSource, []) 
        : [{}]; // Single dummy row for template mode
      
      const rows = Array.isArray(data) ? data : [data];
      
      tableHtml = `<table style="width: 100%; border-collapse: collapse; border: ${gridBorderWidth}px solid ${gridBorderColor};">
        <thead>
          <tr>
            ${config.columns.map((col, idx) => `
              <th style="padding: 8px; background: #f3f4f6; border-bottom: ${gridBorderWidth}px solid ${gridBorderColor}; border-right: ${idx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'};">${col.header}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, rIdx) => `
            <tr>
              ${config.columns.map((col, cIdx) => {
                let cellValue: string;
                
                if (isPreviewMode) {
                  const rawVal = getNestedValue(row, col.binding);
                  if (col.format === 'currency') {
                    cellValue = formatCurrency(rawVal);
                  } else {
                    cellValue = String(rawVal);
                  }
                } else {
                  cellValue = `{${col.binding}}`;
                }
                
                return `<td style="padding: 8px; border-bottom: ${rIdx < rows.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'}; border-right: ${cIdx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'};">${cellValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    }
    
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; overflow: hidden;">${tableHtml}</div>`;
  }
  
  // Grid table element (static grid)
  if (el.type === 'gridtable' && el.gridTableConfig) {
    const config = el.gridTableConfig;
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
    
    // Generate table HTML with proper cell spanning
    const rowsHtml = Array.from({ length: config.rows }, (_, rowIdx) => {
      const cellsHtml = Array.from({ length: config.cols }, (_, colIdx) => {
        const key = `${rowIdx}-${colIdx}`;
        
        // Skip cells that are occupied by a spanning cell
        if (occupiedCells.has(key)) {
          return '';
        }
        
        const cell = cellMap.get(key);
        const rowSpan = cell?.rowSpan || 1;
        const colSpan = cell?.colSpan || 1;
        const content = cell?.content || '';
        
        // Build cell style
        const cellStyle = cell?.style || {};
        const textAlign = cellStyle.textAlign || 'left';
        const fontWeight = cellStyle.fontWeight || 'normal';
        const fontStyle = cellStyle.fontStyle || 'normal';
        const textDecoration = cellStyle.textDecoration || 'none';
        const fontSize = cellStyle.fontSize ? `${cellStyle.fontSize}px` : '12px';
        const color = cellStyle.color || 'inherit';
        
        return `<td ${rowSpan > 1 ? `rowspan="${rowSpan}"` : ''} ${colSpan > 1 ? `colspan="${colSpan}"` : ''} style="padding: 8px; border: ${gridBorderWidth}px solid ${gridBorderColor}; text-align: ${textAlign}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; font-size: ${fontSize}; color: ${color};">${content}</td>`;
      }).filter(html => html !== '').join('');
      
      return `<tr>${cellsHtml}</tr>`;
    }).join('');
    
    const tableHtml = `<table style="width: 100%; height: 100%; border-collapse: collapse; border: ${gridBorderWidth}px solid ${gridBorderColor};"><tbody>${rowsHtml}</tbody></table>`;
    
    return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; overflow: hidden;">${tableHtml}</div>`;
  }
  
  // Default fallback
  return `<div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; ${style}"></div>`;
};

export default function Editor() {
  const [, params] = useRoute("/editor/:id");
  const id = params?.id ? parseInt(params.id) : null;
  
  const { data: template, isLoading, isError } = useTemplate(id);
  const updateTemplate = useUpdateTemplate();
  const { toast } = useToast();

  const [layout, setLayout] = useState<TemplateLayout | null>(null);
  const [sampleData, setSampleData] = useState<string>("");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [name, setName] = useState("");
  const [copiedElement, setCopiedElement] = useState<TemplateElement | null>(null);
  
  // Validate JSON and cache the result
  const isValidJson = useMemo(() => {
    try {
      JSON.parse(sampleData || '{}');
      return true;
    } catch (e) {
      return false;
    }
  }, [sampleData]);
  
  // Undo/Redo state management
  const [history, setHistory] = useState<TemplateLayout[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const MAX_HISTORY_SIZE = 50;

  // Initialize state when data loads
  useEffect(() => {
    if (template) {
      const templateLayout = template.layout as TemplateLayout;
      
      // Ensure all gridtable elements have heightPerRow initialized
      const normalizedLayout = {
        ...templateLayout,
        elements: templateLayout.elements.map(el => {
          if (el.type === 'gridtable' && el.gridTableConfig && !el.gridTableConfig.heightPerRow) {
            // Calculate heightPerRow from current height and rows
            const heightPerRow = el.height / el.gridTableConfig.rows;
            return {
              ...el,
              gridTableConfig: {
                ...el.gridTableConfig,
                heightPerRow
              }
            };
          }
          return el;
        })
      };
      
      setLayout(normalizedLayout);
      setSampleData(JSON.stringify(template.sampleData, null, 2));
      setName(template.name);
      // Initialize history with the normalized template
      setHistory([structuredClone(normalizedLayout)]);
      setHistoryIndex(0);
    }
  }, [template]);

  const selectedElement = useMemo(() => 
    layout?.elements.find(el => el.id === selectedElementId) || null
  , [layout, selectedElementId]);

  // Save layout to history
  const saveToHistory = (newLayout: TemplateLayout) => {
    // Remove any redo history when a new action is performed
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(structuredClone(newLayout));
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayout(structuredClone(history[newIndex]));
      toast({
        title: "Undo",
        description: "Action undone successfully."
      });
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayout(structuredClone(history[newIndex]));
      toast({
        title: "Redo",
        description: "Action redone successfully."
      });
    }
  };

  // Keyboard shortcuts for copy, paste, delete, undo, and redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y / Cmd+Shift+Z - Redo
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+C / Cmd+C - Copy element to clipboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementId) {
        e.preventDefault();
        const elementToCopy = layout?.elements.find(el => el.id === selectedElementId);
        if (elementToCopy) {
          setCopiedElement(structuredClone(elementToCopy));
          toast({
            title: "Element copied",
            description: "Press Ctrl+V to paste the element."
          });
        }
      }
      
      // Ctrl+V / Cmd+V - Paste copied element
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedElement) {
        e.preventDefault();
        handlePasteElement();
      }
      
      // Delete / Backspace - Delete element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, copiedElement, layout, historyIndex, history]);

  const handleAddElement = (type: TemplateElement['type']) => {
    if (!layout) return;

    const newElement: TemplateElement = {
      id: crypto.randomUUID(),
      type,
      x: 50,
      y: 50,
      width: type === 'table' || type === 'gridtable' ? 400 : (type === 'line' ? 200 : 200),
      height: type === 'table' || type === 'gridtable' ? 150 : (type === 'line' ? 2 : 50),
      style: { color: '#000000', fontSize: 14 },
    };

    if (type === 'line') {
      newElement.orientation = 'horizontal';
      newElement.style = { ...newElement.style, backgroundColor: '#000000' };
    } else if (type === 'table') {
      newElement.tableConfig = {
        dataSource: 'items',
        tableType: 'price', // Default to price table
        columns: [
          { header: 'Description', binding: 'description', width: '50%' },
          { header: 'Price', binding: 'price', width: '20%', format: 'currency' },
          { header: 'Qty', binding: 'quantity', width: '15%' }
        ]
      };
      newElement.style = { ...newElement.style, gridBorderColor: '#000000', gridBorderWidth: 1 };
    } else if (type === 'gridtable') {
      // Initialize a simple 3x3 grid
      const rows = 3;
      const cols = 3;
      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            row: r,
            col: c,
            content: r === 0 ? `Header ${c + 1}` : `Cell ${r}-${c}`,
            rowSpan: 1,
            colSpan: 1
          });
        }
      }
      // Calculate initial heightPerRow to maintain consistent row heights
      const heightPerRow = 150 / rows; // 150 is the initial height set above
      newElement.gridTableConfig = { rows, cols, cells, heightPerRow };
      newElement.style = { ...newElement.style, gridBorderColor: '#000000', gridBorderWidth: 1 };
    } else if (type === 'text') {
        newElement.content = "Double click to edit";
    }

    const newLayout = {
      ...layout,
      elements: [...layout.elements, newElement]
    };
    setLayout(newLayout);
    saveToHistory(newLayout);
    
    setSelectedElementId(newElement.id);
  };

  const handleElementUpdate = (id: string, updates: Partial<TemplateElement>) => {
    if (!layout) return;
    const newLayout = {
      ...layout,
      elements: layout.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    };
    setLayout(newLayout);
    saveToHistory(newLayout);
  };

  const handleDeleteElement = (id: string) => {
    if (!layout) return;
    const newLayout = {
      ...layout,
      elements: layout.elements.filter(el => el.id !== id)
    };
    setLayout(newLayout);
    saveToHistory(newLayout);
    setSelectedElementId(null);
  };

  const handleCloneElement = (id: string) => {
    if (!layout) return;
    const elementToClone = layout.elements.find(el => el.id === id);
    if (!elementToClone) return;
    
    // Create a deep copy of the element with a new ID and offset position
    // Using structuredClone for proper deep copy of all nested properties
    const clonedElement: TemplateElement = {
      ...structuredClone(elementToClone),
      id: crypto.randomUUID(),
      x: elementToClone.x + 20, // Offset by 20px
      y: elementToClone.y + 20
    };
    
    const newLayout = {
      ...layout,
      elements: [...layout.elements, clonedElement]
    };
    setLayout(newLayout);
    saveToHistory(newLayout);
    
    toast({
      title: "Element cloned",
      description: "The element has been duplicated successfully."
    });
  };

  const handlePasteElement = () => {
    if (!copiedElement || !layout) return;
    
    // Create a new element from the copied one with a new ID and offset position
    const pastedElement: TemplateElement = {
      ...structuredClone(copiedElement),
      id: crypto.randomUUID(),
      x: copiedElement.x + 20, // Offset by 20px
      y: copiedElement.y + 20
    };
    
    const newLayout = {
      ...layout,
      elements: [...layout.elements, pastedElement]
    };
    setLayout(newLayout);
    saveToHistory(newLayout);
    
    toast({
      title: "Element pasted",
      description: "The copied element has been pasted successfully."
    });
  };

  const handleSave = async () => {
    if (!id || !layout) return;
    
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(sampleData);
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please fix the sample data JSON before saving.",
          variant: "destructive"
        });
        return;
      }

      await updateTemplate.mutateAsync({
        id,
        name,
        layout: layout as any,
        sampleData: parsedData
      });
      
      toast({ title: "Saved successfully", description: "Your template has been updated." });
    } catch (error) {
      toast({ title: "Save failed", description: "Could not save changes.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (isError || !template) return <div className="h-screen flex items-center justify-center">Template not found</div>;
  if (!layout) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 border-transparent hover:border-input focus:border-input text-lg font-semibold px-2 -ml-2 w-64 bg-transparent"
            />
            <span className="text-xs text-muted-foreground px-2">A4 Invoice Template</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
            <Button 
              variant={isPreviewMode ? "ghost" : "secondary"} 
              size="sm" 
              onClick={() => setIsPreviewMode(false)}
              className="h-7 text-xs"
            >
              <Layout className="w-3 h-3 mr-1.5" /> Edit
            </Button>
            <Button 
              variant={isPreviewMode ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setIsPreviewMode(true)}
              className="h-7 text-xs"
            >
              <Play className="w-3 h-3 mr-1.5" /> Play / Generate
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (!layout) return;
              
              // Parse sample data from string to object
              const parsedData = parseSampleData(sampleData);
              
              const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; font-family: sans-serif; }
    .page { width: 794px; height: 1123px; position: relative; background: white; }
    .element { position: absolute; overflow: hidden; }
    .line { background: black; }
    .badge { border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; font-size: 12px; }
  </style>
</head>
<body>
  <div class="page">
    ${layout.elements.map(el => renderElementForExport(el, isPreviewMode, parsedData)).join('')}
  </div>
</body>
</html>`;
              const blob = new Blob([html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `template-${isPreviewMode ? 'values' : 'attributes'}.html`;
              a.click();
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Export HTML
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (!layout) return;
              
              // Parse sample data from string to object
              const parsedData = parseSampleData(sampleData);
              
              const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name || 'Template'}</title>
  <style>
    @media print {
      @page { margin: 0; size: A4 portrait; }
      body { margin: 0; }
    }
    body { margin: 0; font-family: sans-serif; }
    .page { width: 794px; height: 1123px; position: relative; background: white; }
    .element { position: absolute; overflow: hidden; }
    .line { background: black; }
    .badge { border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; font-size: 12px; }
  </style>
</head>
<body>
  <div class="page">
    ${layout.elements.map(el => renderElementForExport(el, isPreviewMode, parsedData)).join('')}
  </div>
  <script>
    window.onload = () => {
      window.print();
      // Close window after user finishes printing
      window.onafterprint = () => {
        window.close();
      };
    };
  </script>
</body>
</html>`;
              const blob = new Blob([html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const printWindow = window.open(url, '_blank');
              // Clean up the blob URL after a delay to allow the window to load
              if (printWindow) {
                setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_CLEANUP_DELAY_MS);
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          
          <Separator orientation="vertical" className="h-6" />

          <Button 
             onClick={handleSave} 
             disabled={updateTemplate.isPending}
             className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {updateTemplate.isPending ? <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components */}
        <aside className="w-64 border-r bg-white flex flex-col shrink-0 z-10 shadow-sm">
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm text-foreground/80">Components</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add elements to your template
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('text')}>
                  <Type className="w-6 h-6" />
                  <span className="text-xs">Text</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('image')}>
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Image</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('table')}>
                  <TableIcon className="w-6 h-6" />
                  <span className="text-xs">Price Table</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('gridtable')}>
                  <Grid3x3 className="w-6 h-6" />
                  <span className="text-xs">Grid Table</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('box')}>
                  <Square className="w-6 h-6" />
                  <span className="text-xs">Box</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('line')}>
                  <Minus className="w-6 h-6" />
                  <span className="text-xs">Line</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('qr')}>
                  <QrCode className="w-6 h-6" />
                  <span className="text-xs">QR Code</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('signature')}>
                  <PenTool className="w-6 h-6" />
                  <span className="text-xs">Signature</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors" onClick={() => handleAddElement('badge')}>
                  <Award className="w-6 h-6" />
                  <span className="text-xs">Badge</span>
                </Button>
              </div>

              <div className="p-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    const demoLayout = {
                      pageSize: "A4",
                      orientation: "portrait",
                      elements: [
                        { id: "h1", type: "text", x: 20, y: 20, width: 300, height: 40, content: "DEMO INVOICE", style: { fontSize: 24, fontWeight: "bold" } },
                        { id: "b1", type: "badge", x: 650, y: 20, width: 100, height: 30, content: "PAID", style: { backgroundColor: "#22c55e", color: "#ffffff", fontSize: 14, fontWeight: "bold" } },
                        { id: "l1", type: "line", x: 20, y: 65, width: 750, height: 2, style: { backgroundColor: "#000" } },
                        { id: "t1", type: "text", x: 20, y: 80, width: 200, height: 20, content: "Date:", style: { fontWeight: "bold" } },
                        { id: "t2", type: "text", x: 80, y: 80, width: 200, height: 20, binding: "date" },
                        { id: "t3", type: "text", x: 20, y: 100, width: 200, height: 20, content: "Client:", style: { fontWeight: "bold" } },
                        { id: "t4", type: "text", x: 80, y: 100, width: 200, height: 40, binding: "client.name" },
                        { id: "t5", type: "table", x: 20, y: 200, width: 750, height: 300, tableConfig: { dataSource: "items", columns: [{ header: "Item", binding: "description", width: "60%" }, { header: "Total", binding: "total", width: "40%", format: "currency" }] }, style: { gridBorderColor: "#000000", gridBorderWidth: 1 } },
                        { id: "q1", type: "qr", x: 20, y: 550, width: 100, height: 100, content: "https://pay.example.com/inv-001" },
                        { id: "s1", type: "signature", x: 550, y: 550, width: 200, height: 80 }
                      ]
                    };
                    setLayout(demoLayout as any);
                    saveToHistory(demoLayout as any);
                  }}
                >
                  Load Demo Template
                </Button>
              </div>
            </ScrollArea>
          </div>

          <div className="mt-auto border-t">
            <div className="p-4 border-b">
               <h3 className="font-semibold text-sm text-foreground/80 flex items-center justify-between">
                 <span className="flex items-center gap-2">
                   Sample Data (JSON)
                   {!isValidJson && (
                     <span className="flex items-center gap-1 text-destructive text-xs font-normal">
                       <AlertCircle className="w-3 h-3" />
                       Invalid JSON
                     </span>
                   )}
                   {isValidJson && (
                     <span className="flex items-center gap-1 text-green-600 text-xs font-normal">
                       <CheckCircle className="w-3 h-3" />
                       Valid
                     </span>
                   )}
                 </span>
                 <Button variant="ghost" size="icon" className="h-5 w-5" title="Reset Data" onClick={() => setSampleData(JSON.stringify(template.sampleData, null, 2))}>
                   <RotateCcw className="w-3 h-3" />
                 </Button>
               </h3>
            </div>
            <div className="h-64">
              <Textarea 
                value={sampleData}
                onChange={(e) => setSampleData(e.target.value)}
                className={`h-full w-full resize-none font-mono text-xs border-0 focus-visible:ring-0 p-4 rounded-none ${isValidJson ? 'bg-muted/10' : 'bg-destructive/5'}`}
                spellCheck={false}
              />
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-muted/20 overflow-auto relative flex flex-col items-center py-12">
           <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-md shadow-sm border p-1">
              <span className="text-xs text-muted-foreground px-2">Scale</span>
              <Input 
                type="number" 
                value={Math.round(scale * 100)} 
                onChange={(e) => setScale(Number(e.target.value) / 100)}
                className="w-16 h-7 text-xs"
                min={25}
                max={200}
              />
              <span className="text-xs text-muted-foreground pr-2">%</span>
           </div>

           {/* The actual canvas */}
           <div className="shadow-2xl">
             <Canvas 
                layout={layout}
                sampleData={parseSampleData(sampleData)}
                selectedElementId={selectedElementId}
                onElementSelect={setSelectedElementId}
                onElementUpdate={handleElementUpdate}
                onClone={handleCloneElement}
                isPreviewMode={isPreviewMode}
                scale={scale}
             />
           </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l bg-white flex flex-col shrink-0 z-10 shadow-sm">
           <ElementProperties 
              element={selectedElement}
              onChange={handleElementUpdate}
              onDelete={handleDeleteElement}
              onClone={handleCloneElement}
           />
        </aside>
      </div>
    </div>
  );
}
