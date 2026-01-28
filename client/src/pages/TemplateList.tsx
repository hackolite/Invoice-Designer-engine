import { useTemplates, useCreateTemplate, useDeleteTemplate } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, FileText, Trash2, Edit, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

// Default template structure for new creations
const DEFAULT_LAYOUT = {
  pageSize: "A4",
  orientation: "portrait",
  elements: [
    {
      id: "title",
      type: "text",
      x: 40,
      y: 40,
      width: 300,
      height: 50,
      content: "INVOICE",
      style: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a' }
    }
  ]
};

const DEFAULT_SAMPLE_DATA = {
  invoiceNumber: "INV-001",
  date: "2024-05-20",
  client: {
    name: "Acme Corp",
    address: "123 Business Rd, Tech City"
  },
  items: [
    { description: "Web Development", quantity: 1, price: 1500 },
    { description: "Hosting (Yearly)", quantity: 1, price: 200 }
  ],
  total: 1700
};

export default function TemplateList() {
  const [, setLocation] = useLocation();
  const { data: templates, isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newTemplate = await createTemplate.mutateAsync({
        name: "New Invoice Template",
        description: "Created from dashboard",
        layout: DEFAULT_LAYOUT as any,
        sampleData: DEFAULT_SAMPLE_DATA
      });
      setLocation(`/editor/${newTemplate.id}`);
    } catch (error) {
      console.error("Failed to create", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTemplate.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground">Templates</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage your invoice designs and layouts.</p>
          </div>
          
          <Button 
            onClick={handleCreate} 
            disabled={isCreating}
            className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            size="lg"
          >
            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create New Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create Card (Alternative Trigger) */}
          <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="group flex flex-col items-center justify-center h-full min-h-[250px] border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-primary">Create Empty Template</span>
          </button>

          {templates?.map((template) => (
            <Card 
              key={template.id} 
              className="group hover:shadow-xl hover:shadow-black/5 hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => setLocation(`/editor/${template.id}`)}
            >
              <div className="aspect-[210/297] bg-muted/20 border-b relative overflow-hidden">
                {/* Preview Placeholder - Could be a thumbnail in the future */}
                <div className="absolute inset-4 bg-background shadow-sm rounded-sm flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                  <FileText className="w-16 h-16 text-muted-foreground/30" />
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="bg-white px-4 py-2 rounded-full font-medium text-sm shadow-lg text-primary">Edit Design</span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="truncate text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-1">{template.description || "No description"}</CardDescription>
              </CardHeader>
              
              <CardFooter className="mt-auto pt-4 border-t bg-muted/5 flex justify-between items-center text-sm text-muted-foreground">
                <span>{new Date(template.updatedAt || template.createdAt || Date.now()).toLocaleDateString()}</span>
                
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the template
                          "{template.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => handleDelete(template.id, e as any)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
