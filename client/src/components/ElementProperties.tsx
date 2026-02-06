import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Type, Copy, ArrowUp, ArrowDown, CopyPlus } from "lucide-react";
import type { TemplateElement } from "@shared/schema";

interface ElementPropertiesProps {
  element: TemplateElement | null;
  onChange: (id: string, updates: Partial<TemplateElement>) => void;
  onDelete: (id: string) => void;
  onClone: (id: string) => void;
}

export function ElementProperties({ element, onChange, onDelete, onClone }: ElementPropertiesProps) {
  if (!element) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <Type className="w-12 h-12 mb-4 opacity-20" />
        <p>Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  const handleChange = (field: keyof TemplateElement, value: any) => {
    onChange(element.id, { [field]: value });
  };

  const handleStyleChange = (key: string, value: any) => {
    onChange(element.id, {
      style: { ...element.style, [key]: value }
    });
  };

  const handleCellStyleChange = (cellIndex: number, styleKey: string, styleValue: any) => {
    if (!element.gridTableConfig) return;
    const config = element.gridTableConfig;
    const newCells = [...config.cells];
    newCells[cellIndex] = { 
      ...newCells[cellIndex], 
      style: { ...newCells[cellIndex].style, [styleKey]: styleValue }
    };
    onChange(element.id, {
      gridTableConfig: { ...config, cells: newCells }
    });
  };

  const handleTableColumnAdd = () => {
    if (!element.tableConfig) return;
    const newCol = { header: "New Column", binding: "newKey", width: "100px" };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        columns: [...element.tableConfig.columns, newCol]
      }
    });
  };

  const handleTableColumnRemove = (index: number) => {
    if (!element.tableConfig) return;
    const newCols = [...element.tableConfig.columns];
    newCols.splice(index, 1);
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        columns: newCols
      }
    });
  };

  const handleTableColumnUpdate = (index: number, field: string, value: any) => {
    if (!element.tableConfig) return;
    const newCols = [...element.tableConfig.columns];
    newCols[index] = { ...newCols[index], [field]: value };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        columns: newCols
      }
    });
  };

  const handleTableAdditionalRowAdd = () => {
    if (!element.tableConfig) return;
    const newAdditionalRow = { label: "Total", value: "{total}", format: 'currency' as const };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: [...(element.tableConfig.additionalRows || []), newAdditionalRow]
      }
    });
  };

  const handleTableAdditionalRowRemove = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.additionalRows) return;
    const newAdditionalRows = [...element.tableConfig.additionalRows];
    newAdditionalRows.splice(index, 1);
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: newAdditionalRows
      }
    });
  };

  const removeMostRecentRow = () => {
    const rows = element.tableConfig?.additionalRows;
    if (rows && rows.length > 0) {
      handleTableAdditionalRowRemove(rows.length - 1);
    }
  };

  const canRemoveRows = () => {
    return (element.tableConfig?.additionalRows?.length ?? 0) > 0;
  };

  // Invoice table footer row handlers
  const handleInvoiceTableFooterRowAdd = () => {
    if (!element.tableConfig) return;
    const newFooterRow = { label: "Total", value: "{total}", format: 'currency' as const };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        footerRows: [...(element.tableConfig.footerRows || []), newFooterRow]
      }
    });
  };

  const removeInvoiceTableFooterRow = () => {
    const footerRows = element.tableConfig?.footerRows;
    if (footerRows && footerRows.length > 0) {
      const newFooterRows = [...footerRows];
      newFooterRows.pop();
      onChange(element.id, {
        tableConfig: {
          ...element.tableConfig!,
          footerRows: newFooterRows
        }
      });
    }
  };

  const handleInvoiceTableFooterRowUpdate = (index: number, field: string, value: any) => {
    if (!element.tableConfig || !element.tableConfig.footerRows) return;
    const newFooterRows = [...element.tableConfig.footerRows];
    newFooterRows[index] = { ...newFooterRows[index], [field]: value };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        footerRows: newFooterRows
      }
    });
  };

  const handleInvoiceTableFooterRowDuplicate = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.footerRows) return;
    const footerRowToDuplicate = element.tableConfig.footerRows[index];
    const newFooterRows = [...element.tableConfig.footerRows];
    // Deep copy to avoid shared references
    newFooterRows.splice(index + 1, 0, { 
      ...footerRowToDuplicate, 
      style: { ...(footerRowToDuplicate.style || {}) } 
    });
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        footerRows: newFooterRows
      }
    });
  };

  const handleInvoiceTableFooterRowMoveUp = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.footerRows || index === 0) return;
    const newFooterRows = [...element.tableConfig.footerRows];
    [newFooterRows[index - 1], newFooterRows[index]] = [newFooterRows[index], newFooterRows[index - 1]];
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        footerRows: newFooterRows
      }
    });
  };

  const handleInvoiceTableFooterRowMoveDown = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.footerRows || index === element.tableConfig.footerRows.length - 1) return;
    const newFooterRows = [...element.tableConfig.footerRows];
    [newFooterRows[index], newFooterRows[index + 1]] = [newFooterRows[index + 1], newFooterRows[index]];
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        footerRows: newFooterRows
      }
    });
  };

  const handleInvoiceTableFooterRowStyleChange = (index: number, styleKey: string, styleValue: string | number) => {
    if (!element.tableConfig || !element.tableConfig.footerRows) return;
    const newFooterRows = [...element.tableConfig.footerRows];
    newFooterRows[index] = { 
      ...newFooterRows[index], 
      style: { ...(newFooterRows[index].style || {}), [styleKey]: styleValue } 
    };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        footerRows: newFooterRows
      }
    });
  };

  const handleTableAdditionalRowUpdate = (index: number, field: string, value: any) => {
    if (!element.tableConfig || !element.tableConfig.additionalRows) return;
    const newAdditionalRows = [...element.tableConfig.additionalRows];
    newAdditionalRows[index] = { ...newAdditionalRows[index], [field]: value };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: newAdditionalRows
      }
    });
  };

  const handleTableAdditionalRowDuplicate = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.additionalRows) return;
    const additionalRowToDuplicate = element.tableConfig.additionalRows[index];
    const newAdditionalRows = [...element.tableConfig.additionalRows];
    newAdditionalRows.splice(index + 1, 0, { ...additionalRowToDuplicate });
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: newAdditionalRows
      }
    });
  };

  const handleTableAdditionalRowMoveUp = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.additionalRows || index === 0) return;
    const newAdditionalRows = [...element.tableConfig.additionalRows];
    [newAdditionalRows[index - 1], newAdditionalRows[index]] = [newAdditionalRows[index], newAdditionalRows[index - 1]];
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: newAdditionalRows
      }
    });
  };

  const handleTableAdditionalRowMoveDown = (index: number) => {
    if (!element.tableConfig || !element.tableConfig.additionalRows || index === element.tableConfig.additionalRows.length - 1) return;
    const newAdditionalRows = [...element.tableConfig.additionalRows];
    [newAdditionalRows[index], newAdditionalRows[index + 1]] = [newAdditionalRows[index + 1], newAdditionalRows[index]];
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: newAdditionalRows
      }
    });
  };

  const handleTableAdditionalRowAddMultiple = (count: number) => {
    if (!element.tableConfig || count < 1) return;
    const currentCount = element.tableConfig.additionalRows?.length || 0;
    const newAdditionalRows = Array.from({ length: count }, (_, i) => ({
      label: `Row ${currentCount + i + 1}`,
      value: "",
      format: 'text' as const
    }));
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: [...(element.tableConfig.additionalRows || []), ...newAdditionalRows]
      }
    });
  };

  const handleTableAdditionalRowStyleChange = (index: number, styleKey: string, styleValue: string | number) => {
    if (!element.tableConfig || !element.tableConfig.additionalRows) return;
    const newAdditionalRows = [...element.tableConfig.additionalRows];
    newAdditionalRows[index] = { 
      ...newAdditionalRows[index], 
      style: { ...(newAdditionalRows[index].style || {}), [styleKey]: styleValue } 
    };
    onChange(element.id, {
      tableConfig: {
        ...element.tableConfig,
        additionalRows: newAdditionalRows
      }
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg capitalize">{element.type} Properties</h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => onClone(element.id)}
              title="Clone element"
              aria-label="Clone element"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(element.id)}
              title="Delete element"
              aria-label="Delete element"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 pt-4">
            {element.type === 'text' && (
              <>
                <div className="space-y-2">
                  <Label>Static Text</Label>
                  <Input 
                    value={element.content || ''} 
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Enter text..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">OR</Label>
                </div>
                <div className="space-y-2">
                  <Label>Data Binding</Label>
                  <Input 
                    value={element.binding || ''} 
                    onChange={(e) => handleChange('binding', e.target.value)}
                    placeholder="e.g. client.name"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Key from your JSON data</p>
                </div>
              </>
            )}

            {element.type === 'image' && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input 
                  value={element.content || ''} 
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {element.type === 'qr' && (
              <div className="space-y-2">
                <Label>QR Data / URL</Label>
                <Input 
                  value={element.content || ''} 
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="e.g. payment link"
                />
              </div>
            )}

            {element.type === 'badge' && (
              <>
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input 
                    value={element.content || ''} 
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="e.g. PAID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Binding (Optional)</Label>
                  <Input 
                    value={element.binding || ''} 
                    onChange={(e) => handleChange('binding', e.target.value)}
                    placeholder="e.g. status"
                  />
                </div>
              </>
            )}

            {element.type === 'table' && element.tableConfig && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Table Style</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={element.style?.tableVariant as string || 'default'}
                    onChange={(e) => handleStyleChange('tableVariant', e.target.value)}
                  >
                    <option value="default">Classic (Gray Header)</option>
                    <option value="minimal">Minimalist (Bold Line)</option>
                    <option value="modern">Modern (Primary Color)</option>
                  </select>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Grid Border Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-12 p-1 h-10"
                      value={element.style?.gridBorderColor as string || '#000000'}
                      onChange={(e) => handleStyleChange('gridBorderColor', e.target.value)}
                    />
                    <Input 
                      type="text"
                      value={element.style?.gridBorderColor as string || '#000000'}
                      onChange={(e) => handleStyleChange('gridBorderColor', e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Grid Border Thickness</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      value={element.style?.gridBorderWidth as number || 1} 
                      onChange={(e) => handleStyleChange('gridBorderWidth', parseInt(e.target.value) || 1)} 
                      min={0}
                      max={10}
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                  </div>
                </div>
                
                {element.tableConfig.tableType === 'price' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Manage Summary Rows</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleTableAdditionalRowAdd}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Row
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={removeMostRecentRow}
                          disabled={!canRemoveRows()}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Remove Row
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {element.tableConfig.tableType === 'invoice' && (
                  <>
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label>Footer Rows Configuration</Label>
                          {element.tableConfig.footerRows && element.tableConfig.footerRows.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {element.tableConfig.footerRows.length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Configure footer rows for displaying totals and summaries at the bottom of the invoice table. Use the toolbar buttons to add or remove rows.
                      </p>
                      
                      {(!element.tableConfig.footerRows || element.tableConfig.footerRows.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">
                          No footer rows yet. Click "Add Row" in the toolbar to create one.
                        </p>
                      )}
                    
                    {element.tableConfig.footerRows && element.tableConfig.footerRows.map((footerRow, idx) => (
                        <div key={idx} className="bg-muted/30 p-3 rounded-lg border space-y-2 text-sm relative group">
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleInvoiceTableFooterRowDuplicate(idx)}
                              title="Duplicate row"
                            >
                              <CopyPlus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* Move up/down buttons */}
                          {element.tableConfig.footerRows.length > 1 && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                              {idx > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleInvoiceTableFooterRowMoveUp(idx)}
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                              )}
                              {idx < element.tableConfig.footerRows.length - 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleInvoiceTableFooterRowMoveDown(idx)}
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Label</Label>
                              <Input 
                                value={footerRow.label} 
                                onChange={(e) => handleInvoiceTableFooterRowUpdate(idx, 'label', e.target.value)}
                                className="h-8"
                                placeholder="e.g. Total"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Value</Label>
                              <Input 
                                value={footerRow.value} 
                                onChange={(e) => handleInvoiceTableFooterRowUpdate(idx, 'value', e.target.value)}
                                className="h-8 font-mono"
                                placeholder="e.g. {total}"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Format</Label>
                              <select 
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={footerRow.format || 'text'}
                                onChange={(e) => handleInvoiceTableFooterRowUpdate(idx, 'format', e.target.value)}
                              >
                                <option value="text">Text</option>
                                <option value="currency">Currency</option>
                                <option value="number">Number</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Text Align</Label>
                            <div className="flex border rounded-md overflow-hidden divide-x">
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.textAlign === 'left' ? 'bg-muted' : ''}`}
                                onClick={() => handleInvoiceTableFooterRowStyleChange(idx, 'textAlign', 'left')}
                                title="Align Left"
                              >
                                <AlignLeft className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.textAlign === 'center' ? 'bg-muted' : ''}`}
                                onClick={() => handleInvoiceTableFooterRowStyleChange(idx, 'textAlign', 'center')}
                                title="Align Center"
                              >
                                <AlignCenter className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.textAlign === 'right' ? 'bg-muted' : ''}`}
                                onClick={() => handleInvoiceTableFooterRowStyleChange(idx, 'textAlign', 'right')}
                                title="Align Right"
                              >
                                <AlignRight className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.textAlign === 'justify' ? 'bg-muted' : ''}`}
                                onClick={() => handleInvoiceTableFooterRowStyleChange(idx, 'textAlign', 'justify')}
                                title="Justify"
                              >
                                <AlignJustify className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Text Style</Label>
                            <div className="flex border rounded-md overflow-hidden divide-x">
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.fontWeight === 'bold' ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  const currentWeight = footerRow.style?.fontWeight;
                                  handleInvoiceTableFooterRowStyleChange(idx, 'fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
                                }}
                                title="Bold"
                              >
                                <Bold className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.fontStyle === 'italic' ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  const currentStyle = footerRow.style?.fontStyle;
                                  handleInvoiceTableFooterRowStyleChange(idx, 'fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
                                }}
                                title="Italic"
                              >
                                <Italic className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${footerRow.style?.textDecoration === 'underline' ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  const currentDecoration = footerRow.style?.textDecoration;
                                  handleInvoiceTableFooterRowStyleChange(idx, 'textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
                                }}
                                title="Underline"
                              >
                                <Underline className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>
                    {element.tableConfig.tableType === 'price' 
                      ? 'Data Source (Object)' 
                      : 'Data Source (Array)'}
                  </Label>
                  <Input 
                    value={element.tableConfig.dataSource} 
                    onChange={(e) => onChange(element.id, { 
                      tableConfig: { ...element.tableConfig!, dataSource: e.target.value } 
                    })}
                    placeholder={element.tableConfig.tableType === 'price' ? 'e.g. financialSummary' : 'e.g. items'}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {element.tableConfig.tableType === 'price' 
                      ? 'Path to the object containing summary data' 
                      : 'Path to the array of items to display'}
                  </p>
                </div>
                
                {(element.tableConfig.tableType === 'price' || element.tableConfig.tableType === 'invoice') && (
                  <div className="space-y-2">
                    <Label>Currency Format</Label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={element.tableConfig.currency || 'USD'}
                      onChange={(e) => onChange(element.id, { 
                        tableConfig: { ...element.tableConfig!, currency: e.target.value as 'USD' | 'EUR' | 'none' } 
                      })}
                    >
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="none">None (Number only)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Currency symbol for values formatted as currency
                    </p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Columns</Label>
                    {element.tableConfig.tableType !== 'price' && (
                      <Button variant="outline" size="sm" onClick={handleTableColumnAdd}>
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  
                  {element.tableConfig.columns.map((col, idx) => (
                    <div key={idx} className="bg-muted/30 p-3 rounded-lg border space-y-2 text-sm relative group">
                      {element.tableConfig!.tableType !== 'price' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleTableColumnRemove(idx)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Header</Label>
                          <Input 
                            value={col.header} 
                            onChange={(e) => handleTableColumnUpdate(idx, 'header', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Binding</Label>
                          <Input 
                            value={col.binding} 
                            onChange={(e) => handleTableColumnUpdate(idx, 'binding', e.target.value)}
                            className="h-8 font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input 
                            value={col.width} 
                            onChange={(e) => handleTableColumnUpdate(idx, 'width', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Format</Label>
                          <select 
                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={col.format || 'text'}
                            onChange={(e) => handleTableColumnUpdate(idx, 'format', e.target.value)}
                          >
                            <option value="text">Text</option>
                            <option value="currency">Currency</option>
                            <option value="number">Number</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {element.tableConfig.tableType === 'price' && (
                  <>
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label>Additional Rows Configuration</Label>
                          {element.tableConfig.additionalRows && element.tableConfig.additionalRows.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {element.tableConfig.additionalRows.length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Configure additional rows for displaying totals and summaries after the items loop. Use the toolbar buttons to add or remove rows.
                      </p>
                      
                      {(!element.tableConfig.additionalRows || element.tableConfig.additionalRows.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">
                          No additional rows yet. Click "Add Row" in the toolbar to create one.
                        </p>
                      )}
                    
                    {element.tableConfig.additionalRows && element.tableConfig.additionalRows.map((additionalRow, idx) => (
                        <div key={idx} className="bg-muted/30 p-3 rounded-lg border space-y-2 text-sm relative group">
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleTableAdditionalRowDuplicate(idx)}
                              title="Duplicate row"
                            >
                              <CopyPlus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* Move up/down buttons */}
                          {element.tableConfig?.additionalRows && element.tableConfig.additionalRows.length > 1 && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                              {idx > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleTableAdditionalRowMoveUp(idx)}
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                              )}
                              {element.tableConfig?.additionalRows && idx < element.tableConfig.additionalRows.length - 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleTableAdditionalRowMoveDown(idx)}
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Label</Label>
                              <Input 
                                value={additionalRow.label} 
                                onChange={(e) => handleTableAdditionalRowUpdate(idx, 'label', e.target.value)}
                                className="h-8"
                                placeholder="e.g. Total"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Value</Label>
                              <Input 
                                value={additionalRow.value} 
                                onChange={(e) => handleTableAdditionalRowUpdate(idx, 'value', e.target.value)}
                                className="h-8 font-mono"
                                placeholder="e.g. {total}"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Format</Label>
                              <select 
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={additionalRow.format || 'text'}
                                onChange={(e) => handleTableAdditionalRowUpdate(idx, 'format', e.target.value)}
                              >
                                <option value="text">Text</option>
                                <option value="currency">Currency</option>
                                <option value="number">Number</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Text Align</Label>
                            <div className="flex border rounded-md overflow-hidden divide-x">
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.textAlign === 'left' ? 'bg-muted' : ''}`}
                                onClick={() => handleTableAdditionalRowStyleChange(idx, 'textAlign', 'left')}
                                title="Align Left"
                              >
                                <AlignLeft className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.textAlign === 'center' ? 'bg-muted' : ''}`}
                                onClick={() => handleTableAdditionalRowStyleChange(idx, 'textAlign', 'center')}
                                title="Align Center"
                              >
                                <AlignCenter className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.textAlign === 'right' ? 'bg-muted' : ''}`}
                                onClick={() => handleTableAdditionalRowStyleChange(idx, 'textAlign', 'right')}
                                title="Align Right"
                              >
                                <AlignRight className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.textAlign === 'justify' ? 'bg-muted' : ''}`}
                                onClick={() => handleTableAdditionalRowStyleChange(idx, 'textAlign', 'justify')}
                                title="Justify"
                              >
                                <AlignJustify className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs">Text Style</Label>
                            <div className="flex border rounded-md overflow-hidden divide-x">
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.fontWeight === 'bold' ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  const currentWeight = additionalRow.style?.fontWeight;
                                  handleTableAdditionalRowStyleChange(idx, 'fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
                                }}
                                title="Bold"
                              >
                                <Bold className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.fontStyle === 'italic' ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  const currentStyle = additionalRow.style?.fontStyle;
                                  handleTableAdditionalRowStyleChange(idx, 'fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
                                }}
                                title="Italic"
                              >
                                <Italic className="w-3 h-3 mx-auto" />
                              </button>
                              <button 
                                className={`flex-1 p-1 hover:bg-muted ${additionalRow.style?.textDecoration === 'underline' ? 'bg-muted' : ''}`}
                                onClick={() => {
                                  const currentDecoration = additionalRow.style?.textDecoration;
                                  handleTableAdditionalRowStyleChange(idx, 'textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
                                }}
                                title="Underline"
                              >
                                <Underline className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {element.type === 'gridtable' && element.gridTableConfig && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Grid Border Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-12 p-1 h-10"
                      value={element.style?.gridBorderColor as string || '#000000'}
                      onChange={(e) => handleStyleChange('gridBorderColor', e.target.value)}
                    />
                    <Input 
                      type="text"
                      value={element.style?.gridBorderColor as string || '#000000'}
                      onChange={(e) => handleStyleChange('gridBorderColor', e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Grid Border Thickness</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      value={element.style?.gridBorderWidth as number || 1} 
                      onChange={(e) => handleStyleChange('gridBorderWidth', parseInt(e.target.value) || 1)} 
                      min={0}
                      max={10}
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Grid Dimensions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Rows</Label>
                      <Input 
                        type="number"
                        value={element.gridTableConfig.rows} 
                        onChange={(e) => {
                          const newRows = parseInt(e.target.value) || 1;
                          const config = element.gridTableConfig!;
                          
                          // Calculate new height to maintain consistent row heights
                          const heightPerRow = element.height / config.rows;
                          const newHeight = Math.round(heightPerRow * newRows);
                          
                          // Filter out cells that are now out of bounds
                          const newCells = config.cells.filter(cell => cell.row < newRows);
                          
                          // Add new cells for new rows if needed
                          for (let r = config.rows; r < newRows; r++) {
                            for (let c = 0; c < config.cols; c++) {
                              newCells.push({
                                row: r,
                                col: c,
                                content: `Cell ${r}-${c}`,
                                rowSpan: 1,
                                colSpan: 1
                              });
                            }
                          }
                          
                          onChange(element.id, {
                            gridTableConfig: { ...config, rows: newRows, cells: newCells },
                            height: newHeight
                          });
                        }}
                        min={1}
                        max={20}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Columns</Label>
                      <Input 
                        type="number"
                        value={element.gridTableConfig.cols} 
                        onChange={(e) => {
                          const newCols = parseInt(e.target.value) || 1;
                          const config = element.gridTableConfig!;
                          
                          // Filter out cells that are now out of bounds
                          const newCells = config.cells.filter(cell => cell.col < newCols);
                          
                          // Add new cells for new columns if needed
                          for (let r = 0; r < config.rows; r++) {
                            for (let c = config.cols; c < newCols; c++) {
                              newCells.push({
                                row: r,
                                col: c,
                                content: `Cell ${r}-${c}`,
                                rowSpan: 1,
                                colSpan: 1
                              });
                            }
                          }
                          
                          onChange(element.id, {
                            gridTableConfig: { ...config, cols: newCols, cells: newCells }
                          });
                        }}
                        min={1}
                        max={20}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Cells</Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Edit cell content and bindings. Use rowSpan/colSpan to merge cells.
                  </div>
                  
                  <ScrollArea className="h-64 border rounded p-2">
                    {element.gridTableConfig.cells
                      .sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row)
                      .map((cell, idx) => (
                      <div key={idx} className="bg-muted/30 p-2 rounded border mb-2 space-y-2 text-sm">
                        <div className="font-medium text-xs text-muted-foreground">
                          Cell [{cell.row},{cell.col}]
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Content</Label>
                            <Input 
                              value={cell.content || ''} 
                              onChange={(e) => {
                                const config = element.gridTableConfig!;
                                const newCells = [...config.cells];
                                newCells[idx] = { ...newCells[idx], content: e.target.value };
                                onChange(element.id, {
                                  gridTableConfig: { ...config, cells: newCells }
                                });
                              }}
                              className="h-7 text-xs"
                              placeholder="Text..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Binding</Label>
                            <Input 
                              value={cell.binding || ''} 
                              onChange={(e) => {
                                const config = element.gridTableConfig!;
                                const newCells = [...config.cells];
                                newCells[idx] = { ...newCells[idx], binding: e.target.value };
                                onChange(element.id, {
                                  gridTableConfig: { ...config, cells: newCells }
                                });
                              }}
                              className="h-7 text-xs font-mono"
                              placeholder="e.g. data.key"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Row Span</Label>
                            <Input 
                              type="number"
                              value={cell.rowSpan || 1} 
                              onChange={(e) => {
                                const config = element.gridTableConfig!;
                                const newCells = [...config.cells];
                                newCells[idx] = { ...newCells[idx], rowSpan: parseInt(e.target.value) || 1 };
                                onChange(element.id, {
                                  gridTableConfig: { ...config, cells: newCells }
                                });
                              }}
                              min={1}
                              max={element.gridTableConfig?.rows || 10}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Col Span</Label>
                            <Input 
                              type="number"
                              value={cell.colSpan || 1} 
                              onChange={(e) => {
                                const config = element.gridTableConfig!;
                                const newCells = [...config.cells];
                                newCells[idx] = { ...newCells[idx], colSpan: parseInt(e.target.value) || 1 };
                                onChange(element.id, {
                                  gridTableConfig: { ...config, cells: newCells }
                                });
                              }}
                              min={1}
                              max={element.gridTableConfig?.cols || 10}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Text Align</Label>
                          <div className="flex border rounded-md overflow-hidden divide-x">
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.textAlign === 'left' ? 'bg-muted' : ''}`}
                              onClick={() => handleCellStyleChange(idx, 'textAlign', 'left')}
                              title="Align Left"
                            >
                              <AlignLeft className="w-3 h-3 mx-auto" />
                            </button>
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.textAlign === 'center' ? 'bg-muted' : ''}`}
                              onClick={() => handleCellStyleChange(idx, 'textAlign', 'center')}
                              title="Align Center"
                            >
                              <AlignCenter className="w-3 h-3 mx-auto" />
                            </button>
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.textAlign === 'right' ? 'bg-muted' : ''}`}
                              onClick={() => handleCellStyleChange(idx, 'textAlign', 'right')}
                              title="Align Right"
                            >
                              <AlignRight className="w-3 h-3 mx-auto" />
                            </button>
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.textAlign === 'justify' ? 'bg-muted' : ''}`}
                              onClick={() => handleCellStyleChange(idx, 'textAlign', 'justify')}
                              title="Justify"
                            >
                              <AlignJustify className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Text Style</Label>
                          <div className="flex border rounded-md overflow-hidden divide-x">
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.fontWeight === 'bold' ? 'bg-muted' : ''}`}
                              onClick={() => {
                                const currentWeight = cell.style?.fontWeight;
                                handleCellStyleChange(idx, 'fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
                              }}
                              title="Bold"
                            >
                              <Bold className="w-3 h-3 mx-auto" />
                            </button>
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.fontStyle === 'italic' ? 'bg-muted' : ''}`}
                              onClick={() => {
                                const currentStyle = cell.style?.fontStyle;
                                handleCellStyleChange(idx, 'fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
                              }}
                              title="Italic"
                            >
                              <Italic className="w-3 h-3 mx-auto" />
                            </button>
                            <button 
                              className={`flex-1 p-1 hover:bg-muted ${cell.style?.textDecoration === 'underline' ? 'bg-muted' : ''}`}
                              onClick={() => {
                                const currentDecoration = cell.style?.textDecoration;
                                handleCellStyleChange(idx, 'textDecoration', currentDecoration === 'underline' ? 'none' : 'underline');
                              }}
                              title="Underline"
                            >
                              <Underline className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>X Position</Label>
                <Input 
                  type="number" 
                  value={element.x} 
                  onChange={(e) => handleChange('x', parseInt(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Y Position</Label>
                <Input 
                  type="number" 
                  value={element.y} 
                  onChange={(e) => handleChange('y', parseInt(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Width</Label>
                <Input 
                  type="number" 
                  value={element.width} 
                  onChange={(e) => handleChange('width', parseInt(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input 
                  type="number" 
                  value={element.height} 
                  onChange={(e) => handleChange('height', parseInt(e.target.value))} 
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Font Size</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  value={element.style?.fontSize || 14} 
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))} 
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Text Align</Label>
              <div className="flex border rounded-md overflow-hidden divide-x">
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textAlign === 'left' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textAlign', 'left')}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textAlign === 'center' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textAlign', 'center')}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textAlign === 'right' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textAlign', 'right')}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textAlign === 'justify' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textAlign', 'justify')}
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Text Style</Label>
              <div className="flex border rounded-md overflow-hidden divide-x">
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.fontWeight === 'bold' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('fontWeight', element.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                  title="Bold"
                >
                  <Bold className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.fontStyle === 'italic' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('fontStyle', element.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                  title="Italic"
                >
                  <Italic className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textDecoration === 'underline' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textDecoration', element.style?.textDecoration === 'underline' ? 'none' : 'underline')}
                  title="Underline"
                >
                  <Underline className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  className="w-12 p-1 h-10"
                  value={element.style?.color as string || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                />
                <Input 
                  type="text"
                  value={element.style?.color as string || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            {(element.type === 'box' || element.type === 'line') && (
               <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Border (CSS)</Label>
                 <Input 
                   value={element.style?.border as string || ''} 
                   onChange={(e) => handleStyleChange('border', e.target.value)}
                   placeholder="e.g. 1px solid black"
                 />
               </div>
               <div className="space-y-2">
                 <Label>{element.type === 'line' ? 'Line Color' : 'Background Color'}</Label>
                 <div className="flex gap-2">
                   <Input 
                     type="color" 
                     className="w-12 p-1 h-10"
                     value={element.style?.backgroundColor as string || (element.type === 'line' ? '#000000' : '#ffffff')}
                     onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                   />
                   <Input 
                     type="text"
                     value={element.style?.backgroundColor as string || (element.type === 'line' ? '#000000' : '#ffffff')}
                     onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                     className="flex-1 font-mono"
                   />
                 </div>
               </div>
               </div>
            )}

            {element.type === 'table' && element.tableConfig && element.tableConfig.tableType === 'price' && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Additional Rows</Label>
                      {element.tableConfig.additionalRows && element.tableConfig.additionalRows.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {element.tableConfig.additionalRows.length}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar buttons to add or remove additional rows for displaying totals and summaries
                  </p>
                  
                  {element.tableConfig.additionalRows && element.tableConfig.additionalRows.map((additionalRow, idx) => (
                      <div key={idx} className="bg-muted/30 p-3 rounded-lg border space-y-2 text-sm relative group">
                        <div className="text-xs font-medium text-muted-foreground">
                          Row {idx + 1}: {additionalRow.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
