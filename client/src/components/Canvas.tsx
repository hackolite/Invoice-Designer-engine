import { Rnd } from "react-rnd";
import { type TemplateElement, type TemplateLayout } from "@shared/schema";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";

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

      const data = isPreviewMode 
        ? getValue(sampleData, config.dataSource, []) 
        : [1, 2, 3]; // Dummy rows for editor

      const tableStyle = (el.style?.tableVariant as string) || 'default';
      
      return (
        <div className={clsx(
          "w-full h-full overflow-hidden",
          tableStyle === 'default' && "border border-gray-200",
          tableStyle === 'minimal' && "border-0",
          tableStyle === 'modern' && "border border-primary/20 rounded-lg shadow-sm"
        )}>
          <table className="w-full text-sm text-left border-collapse">
            <thead className={clsx(
              tableStyle === 'default' && "bg-gray-100 text-gray-700 font-medium",
              tableStyle === 'minimal' && "border-b-2 border-gray-900 text-gray-900 font-bold",
              tableStyle === 'modern' && "bg-primary text-primary-foreground font-semibold"
            )}>
              <tr>
                {config.columns.map((col, idx) => (
                  <th key={idx} className="p-2 border-b" style={{ width: col.width }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.map((row, rIdx) => (
                <tr key={rIdx} className={clsx(
                  "border-b last:border-0",
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
                      <td key={cIdx} className="p-2">
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
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}
