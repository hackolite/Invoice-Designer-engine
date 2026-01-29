import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TemplateElement } from "@shared/schema";

export interface TextPreset {
  id: string;
  name: string;
  description: string;
  element: Omit<TemplateElement, 'id' | 'x' | 'y'>;
}

export const textPresets: TextPreset[] = [
  {
    id: "address-block",
    name: "Address Block",
    description: "Multi-line address with proper spacing",
    element: {
      type: "text",
      width: 250,
      height: 80,
      content: "Company Name\n123 Street Address\nCity, State ZIP\nCountry",
      style: {
        fontSize: 12,
        lineHeight: 1.5,
        color: "#333333"
      }
    }
  },
  {
    id: "supplier-name",
    name: "Supplier Name",
    description: "Large bold supplier/company name",
    element: {
      type: "text",
      width: 300,
      height: 50,
      content: "Supplier Name",
      style: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a1a1a"
      }
    }
  },
  {
    id: "client-name",
    name: "Client Name",
    description: "Client or customer name heading",
    element: {
      type: "text",
      width: 250,
      height: 40,
      content: "Client Name",
      style: {
        fontSize: 18,
        fontWeight: "600",
        color: "#2c3e50"
      }
    }
  },
  {
    id: "invoice-title",
    name: "Invoice Title",
    description: "Large prominent invoice header",
    element: {
      type: "text",
      width: 200,
      height: 50,
      content: "INVOICE",
      style: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#2563eb",
        textTransform: "uppercase",
        letterSpacing: 2
      }
    }
  },
  {
    id: "invoice-number",
    name: "Invoice Number",
    description: "Invoice number with label",
    element: {
      type: "text",
      width: 200,
      height: 30,
      content: "Invoice #: INV-001",
      style: {
        fontSize: 14,
        fontWeight: "500",
        color: "#4b5563"
      }
    }
  },
  {
    id: "date-label",
    name: "Date Field",
    description: "Date with label",
    element: {
      type: "text",
      width: 200,
      height: 25,
      content: "Date: {{date}}",
      binding: "date",
      style: {
        fontSize: 12,
        color: "#6b7280"
      }
    }
  },
  {
    id: "section-heading",
    name: "Section Heading",
    description: "Bold section heading with underline",
    element: {
      type: "text",
      width: 200,
      height: 30,
      content: "Section Heading",
      style: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
        borderBottom: "2px solid #d1d5db",
        paddingBottom: 5
      }
    }
  },
  {
    id: "total-amount",
    name: "Total Amount",
    description: "Large total amount display",
    element: {
      type: "text",
      width: 200,
      height: 40,
      content: "$0.00",
      style: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#059669",
        textAlign: "right"
      }
    }
  },
  {
    id: "label-value",
    name: "Label & Value",
    description: "Label with value (e.g., Status: Paid)",
    element: {
      type: "text",
      width: 200,
      height: 25,
      content: "Label: Value",
      style: {
        fontSize: 13,
        color: "#374151"
      }
    }
  },
  {
    id: "footer-text",
    name: "Footer Text",
    description: "Small footer or disclaimer text",
    element: {
      type: "text",
      width: 400,
      height: 40,
      content: "Thank you for your business",
      style: {
        fontSize: 11,
        color: "#9ca3af",
        textAlign: "center",
        fontStyle: "italic"
      }
    }
  },
  {
    id: "contact-info",
    name: "Contact Info",
    description: "Contact details block",
    element: {
      type: "text",
      width: 250,
      height: 60,
      content: "Email: contact@company.com\nPhone: +1 234 567 8900\nWebsite: www.company.com",
      style: {
        fontSize: 11,
        color: "#6b7280",
        lineHeight: 1.6
      }
    }
  },
  {
    id: "marine-vessel",
    name: "Vessel Name",
    description: "Ship or vessel name (marine themed)",
    element: {
      type: "text",
      width: 300,
      height: 45,
      content: "M/V Ocean Voyager",
      style: {
        fontSize: 20,
        fontWeight: "600",
        color: "#0369a1",
        fontFamily: "serif"
      }
    }
  },
  {
    id: "marine-port",
    name: "Port Information",
    description: "Port of call details",
    element: {
      type: "text",
      width: 250,
      height: 50,
      content: "Port: Miami, FL\nDeparture: {{departureDate}}",
      style: {
        fontSize: 13,
        color: "#475569",
        lineHeight: 1.5
      }
    }
  },
  {
    id: "cabin-number",
    name: "Cabin Number",
    description: "Cabin or suite number",
    element: {
      type: "text",
      width: 200,
      height: 35,
      content: "Cabin: A-101",
      style: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0c4a6e"
      }
    }
  }
];

interface TextPresetsProps {
  onSelectPreset: (preset: TextPreset) => void;
}

export function TextPresets({ onSelectPreset }: TextPresetsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-foreground/80">Text Block Presets</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Pre-styled text blocks for common invoice elements
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {textPresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="w-full h-auto flex flex-col items-start p-3 hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => onSelectPreset(preset)}
            >
              <span className="font-medium text-sm">{preset.name}</span>
              <span className="text-xs text-muted-foreground mt-1 text-left">
                {preset.description}
              </span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
