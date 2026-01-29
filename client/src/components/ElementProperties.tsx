import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
import type { TemplateElement } from "@shared/schema";

interface ElementPropertiesProps {
  element: TemplateElement | null;
  onChange: (id: string, updates: Partial<TemplateElement>) => void;
  onDelete: (id: string) => void;
}

export function ElementProperties({ element, onChange, onDelete }: ElementPropertiesProps) {
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

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg capitalize">{element.type} Properties</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(element.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
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
                  <Label>Data Source (Array)</Label>
                  <Input 
                    value={element.tableConfig.dataSource} 
                    onChange={(e) => onChange(element.id, { 
                      tableConfig: { ...element.tableConfig!, dataSource: e.target.value } 
                    })}
                    placeholder="e.g. items"
                    className="font-mono text-sm"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Columns</Label>
                    <Button variant="outline" size="sm" onClick={handleTableColumnAdd}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {element.tableConfig.columns.map((col, idx) => (
                    <div key={idx} className="bg-muted/30 p-3 rounded-lg border space-y-2 text-sm relative group">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleTableColumnRemove(idx)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                      
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
                >
                  <AlignLeft className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textAlign === 'center' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textAlign', 'center')}
                >
                  <AlignCenter className="w-4 h-4 mx-auto" />
                </button>
                <button 
                  className={`flex-1 p-2 hover:bg-muted ${element.style?.textAlign === 'right' ? 'bg-muted' : ''}`}
                  onClick={() => handleStyleChange('textAlign', 'right')}
                >
                  <AlignRight className="w-4 h-4 mx-auto" />
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
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
