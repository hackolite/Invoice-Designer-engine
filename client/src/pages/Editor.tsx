import { useEffect, useState, useMemo } from "react";
import { useRoute } from "wouter";
import { useTemplate, useUpdateTemplate } from "@/hooks/use-templates";
import { Canvas } from "@/components/Canvas";
import { ElementProperties } from "@/components/ElementProperties";
import { TextPresets } from "@/components/TextPresets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, Save, Type, Image as ImageIcon, Table as TableIcon, 
  Square, Layout, Eye, EyeOff, RotateCcw, Minus, Play, QrCode, PenTool, Award, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TemplateElement, TemplateLayout } from "@shared/schema";
import { Link } from "wouter";

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
  const [scale, setScale] = useState(0.8);
  const [name, setName] = useState("");

  // Initialize state when data loads
  useEffect(() => {
    if (template) {
      setLayout(template.layout as TemplateLayout);
      setSampleData(JSON.stringify(template.sampleData, null, 2));
      setName(template.name);
    }
  }, [template]);

  const selectedElement = useMemo(() => 
    layout?.elements.find(el => el.id === selectedElementId) || null
  , [layout, selectedElementId]);

  const handleAddElement = (type: TemplateElement['type']) => {
    if (!layout) return;

    const newElement: TemplateElement = {
      id: crypto.randomUUID(),
      type,
      x: 50,
      y: 50,
      width: type === 'table' ? 400 : (type === 'line' ? 200 : 200),
      height: type === 'table' ? 150 : (type === 'line' ? 2 : 50),
      style: { color: '#000000', fontSize: 14 },
    };

    if (type === 'line') {
      newElement.orientation = 'horizontal';
      newElement.style = { ...newElement.style, backgroundColor: '#000000' };
    } else if (type === 'table') {
      newElement.tableConfig = {
        dataSource: 'items',
        columns: [
          { header: 'Description', binding: 'description', width: '50%' },
          { header: 'Price', binding: 'price', width: '20%', format: 'currency' },
          { header: 'Qty', binding: 'quantity', width: '15%' }
        ]
      };
    } else if (type === 'text') {
        newElement.content = "Double click to edit";
    }

    setLayout(prev => prev ? ({
      ...prev,
      elements: [...prev.elements, newElement]
    }) : null);
    
    setSelectedElementId(newElement.id);
  };

  const handleElementUpdate = (id: string, updates: Partial<TemplateElement>) => {
    setLayout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        elements: prev.elements.map(el => 
          el.id === id ? { ...el, ...updates } : el
        )
      };
    });
  };

  const handleDeleteElement = (id: string) => {
    setLayout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        elements: prev.elements.filter(el => el.id !== id)
      };
    });
    setSelectedElementId(null);
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
    th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; font-size: 12px; }
  </style>
</head>
<body>
  <div class="page">
    ${layout.elements.map(el => {
      const style = Object.entries(el.style || {}).map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}: ${v}${typeof v === 'number' ? 'px' : ''}`).join('; ');
      const content = el.type === 'text' ? (el.binding ? `{{${el.binding}}}` : el.content) : 
                     el.type === 'badge' ? (el.content || `{{${el.binding}}}`) : '';
      
      return `
      <div class="element" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; ${style}">
        ${el.type === 'text' || el.type === 'badge' ? content : ''}
        ${el.type === 'line' || el.type === 'box' ? '' : ''}
      </div>`;
    }).join('')}
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
        {/* Left Sidebar - Components and Text Presets */}
        <aside className="w-64 border-r bg-white flex flex-col shrink-0 z-10 shadow-sm">
          <Tabs defaultValue="components" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="presets">Text Presets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="components" className="flex-1 flex flex-col m-0">
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
                  <span className="text-xs">Table</span>
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
                        { id: "t5", type: "table", x: 20, y: 200, width: 750, height: 300, tableConfig: { dataSource: "items", columns: [{ header: "Item", binding: "description", width: "60%" }, { header: "Total", binding: "total", width: "40%", format: "currency" }] } },
                        { id: "q1", type: "qr", x: 20, y: 550, width: 100, height: 100, content: "https://pay.example.com/inv-001" },
                        { id: "s1", type: "signature", x: 550, y: 550, width: 200, height: 80 }
                      ]
                    };
                    setLayout(demoLayout as any);
                  }}
                >
                  Load Demo Template
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="presets" className="flex-1 m-0">
              <TextPresets 
                onSelectPreset={(preset) => {
                  if (!layout) return;
                  const newElement: TemplateElement = {
                    id: crypto.randomUUID(),
                    ...preset.element,
                    x: 50,
                    y: 50,
                  };
                  setLayout(prev => prev ? ({
                    ...prev,
                    elements: [...prev.elements, newElement]
                  }) : null);
                  setSelectedElementId(newElement.id);
                }}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-auto border-t">
            <div className="p-4 border-b">
               <h3 className="font-semibold text-sm text-foreground/80 flex items-center justify-between">
                 Sample Data (JSON)
                 <Button variant="ghost" size="icon" className="h-5 w-5" title="Reset Data" onClick={() => setSampleData(JSON.stringify(template.sampleData, null, 2))}>
                   <RotateCcw className="w-3 h-3" />
                 </Button>
               </h3>
            </div>
            <div className="h-64">
              <Textarea 
                value={sampleData}
                onChange={(e) => setSampleData(e.target.value)}
                className="h-full w-full resize-none font-mono text-xs border-0 focus-visible:ring-0 p-4 rounded-none bg-muted/10"
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
                sampleData={JSON.parse(sampleData || '{}')}
                selectedElementId={selectedElementId}
                onElementSelect={setSelectedElementId}
                onElementUpdate={handleElementUpdate}
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
           />
        </aside>
      </div>
    </div>
  );
}
