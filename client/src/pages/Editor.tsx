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
  ChevronLeft, Save, Type, Image as ImageIcon, Table as TableIcon, 
  Square, Layout, Eye, EyeOff, RotateCcw 
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
      width: type === 'table' ? 400 : 200,
      height: type === 'table' ? 150 : 50,
      style: { color: '#000000', fontSize: 14 },
    };

    if (type === 'table') {
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
              <Eye className="w-3 h-3 mr-1.5" /> Preview
            </Button>
          </div>
          
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
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm text-foreground/80">Components</h3>
          </div>
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
          </div>

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
