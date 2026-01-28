import { Rnd } from "react-rnd";
import { type TemplateElement, type TemplateLayout } from "@shared/schema";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";
import { get } from "lodash"; // We might not have lodash, I'll write a simple getter

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
      
      return (
        <div 
          className="w-full h-full overflow-hidden whitespace-pre-wrap"
          style={{
            fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : '14px',
            textAlign: (el.style?.textAlign as any) || 'left',
            color: el.style?.color as string || 'inherit',
            fontWeight: el.style?.fontWeight as any || 'normal',
          }}
        >
          {displayContent}
        </div>
      );
    }

    if (el.type === 'image') {
      const src = el.content || "https://placehold.co/400?text=Image";
      return (
        <img 
          src={src} 
          alt="Element" 
          className="w-full h-full object-cover pointer-events-none" 
        />
      );
    }

    if (el.type === 'box' || el.type === 'line') {
      return (
        <div 
          className="w-full h-full"
          style={{
            backgroundColor: el.style?.backgroundColor as string || (el.type === 'line' ? '#000' : '#eee'),
            border: el.style?.border as string || 'none',
          }}
        />
      );
    }

    if (el.type === 'table') {
      const config = el.tableConfig;
      if (!config) return <div>Invalid Table Config</div>;

      const data = isPreviewMode 
        ? getValue(sampleData, config.dataSource, []) 
        : [1, 2, 3]; // Dummy rows for editor

      return (
        <div className="w-full h-full overflow-hidden border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 font-medium">
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
                <tr key={rIdx} className="border-b last:border-0">
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
      onClick={() => onElementSelect(null)} // Deselect when clicking background
    >
      {layout.elements.map((el) => {
        const isSelected = selectedElementId === el.id;

        return (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            onDragStop={(e, d) => {
              onElementUpdate(el.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onElementUpdate(el.id, {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                ...position,
              });
            }}
            bounds="parent"
            disableDragging={isPreviewMode}
            enableResizing={!isPreviewMode}
            className={clsx(
              "transition-colors",
              !isPreviewMode && isSelected && "element-selected z-10",
              !isPreviewMode && !isSelected && "hover:element-hovered"
            )}
            onMouseDown={(e) => {
              e.stopPropagation(); // Prevent canvas click
              onElementSelect(el.id);
            }}
          >
            <div className="w-full h-full relative">
               {renderElementContent(el)}
               {/* Click capture overlay for all modes to ensure selection works */}
               <div className={clsx(
                 "absolute inset-0 z-20",
                 !isPreviewMode ? "cursor-move" : "cursor-default"
               )} />
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}
