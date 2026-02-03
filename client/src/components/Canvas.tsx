import { Rnd } from "react-rnd";
import { type TemplateElement, type TemplateLayout } from "@shared/schema";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Ruler, Copy } from "lucide-react";

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

  // Magnetic snap helper
  const snapToGrid = (num: number) => {
    return Math.round(num / GRID_SIZE) * GRID_SIZE;
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
      
      return (
        <div 
          className="w-full h-full overflow-hidden whitespace-pre-wrap"
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
          }}
        >
          {displayContent}
        </div>
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
        
        return (
          <div className={clsx(
            "w-full h-full overflow-hidden",
            tableStyle === 'default' && "",
            tableStyle === 'minimal' && "",
            tableStyle === 'modern' && "rounded-lg shadow-sm"
          )} style={{
            border: `${gridBorderWidth}px solid ${gridBorderColor}`
          }}>
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                {config.columns.map((col, idx) => {
                  let cellValue;
                  if (isPreviewMode) {
                    const rawVal = getValue(sourceData, col.binding);
                    if (col.format === 'currency') {
                      cellValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(rawVal) || 0);
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
                        borderBottom: idx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none',
                        borderRight: `${gridBorderWidth}px solid ${gridBorderColor}`
                      }}>
                        {col.header}
                      </th>
                      <td className="p-2" style={{ 
                        borderBottom: idx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'
                      }}>
                        {cellValue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        )} style={{
          border: `${gridBorderWidth}px solid ${gridBorderColor}`
        }}>
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
                    borderBottom: `${gridBorderWidth}px solid ${gridBorderColor}`,
                    borderRight: idx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'
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
                        borderBottom: rIdx < data.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none',
                        borderRight: cIdx < config.columns.length - 1 ? `${gridBorderWidth}px solid ${gridBorderColor}` : 'none'
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
      
      return (
        <div className="w-full h-full overflow-hidden" style={{
          border: `${gridBorderWidth}px solid ${gridBorderColor}`
        }}>
          <table className="w-full h-full text-sm text-left border-collapse">
            <tbody>
              {Array.from({ length: config.rows }, (_, rowIdx) => (
                <tr key={rowIdx}>
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
                    
                    return (
                      <td 
                        key={colIdx}
                        rowSpan={rowSpan}
                        colSpan={colSpan}
                        className="p-2 border"
                        style={{ 
                          borderColor: gridBorderColor,
                          borderWidth: `${gridBorderWidth}px`,
                        }}
                      >
                        {content}
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
              onElementUpdate(el.id, { x: snapToGrid(d.x), y: snapToGrid(d.y) });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onElementUpdate(el.id, {
                width: snapToGrid(parseInt(ref.style.width)),
                height: snapToGrid(parseInt(ref.style.height)),
                x: snapToGrid(position.x),
                y: snapToGrid(position.y),
              });
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
                   className="absolute -bottom-14 left-0 right-0 bg-white border rounded-lg shadow-lg p-2 flex items-center gap-3 pointer-events-auto z-40"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <div className="flex items-center gap-2 flex-1">
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
                   <div className="flex items-center gap-2 flex-1">
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
                    className="absolute -bottom-14 left-0 right-0 bg-white border rounded-lg shadow-lg p-2 flex items-center gap-3 pointer-events-auto z-40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 flex-1">
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
                    <div className="flex items-center gap-2 flex-1">
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
