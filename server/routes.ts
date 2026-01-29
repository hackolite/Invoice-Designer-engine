import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Templates Routes ===

  app.get(api.templates.list.path, async (req, res) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });

  app.get(api.templates.get.path, async (req, res) => {
    const template = await storage.getTemplate(Number(req.params.id));
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  });

  app.post(api.templates.create.path, async (req, res) => {
    try {
      const input = api.templates.create.input.parse(req.body);
      const template = await storage.createTemplate(input);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.templates.update.path, async (req, res) => {
    try {
      const input = api.templates.update.input.parse(req.body);
      const updated = await storage.updateTemplate(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle not found via storage check if preferred, or generic 500
      // For simplicity in this Lite build, assuming ID exists or next generic catch hits.
      // Ideally check existence first.
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.delete(api.templates.delete.path, async (req, res) => {
    await storage.deleteTemplate(Number(req.params.id));
    res.status(204).send();
  });

  // Seed database if needed
  await seedDatabase();

  return httpServer;
}

// Seed function to populate database with example templates
export async function seedDatabase() {
  const templates = await storage.getTemplates();
  if (templates.length === 0) {
    console.log("Seeding database with example templates...");
    
    // Standard Invoice Template
    const sampleData = {
      invoiceNumber: "INV-2023-001",
      date: "2023-10-25",
      provider: {
        name: "Acme Corp",
        address: "123 Business Rd, Tech City",
        email: "contact@acme.com"
      },
      client: {
        name: "John Doe",
        address: "456 Customer Ln, Buyer Town"
      },
      items: [
        { description: "Web Development", quantity: 10, price: 50, total: 500 },
        { description: "Hosting Setup", quantity: 1, price: 100, total: 100 },
        { description: "Domain Registration", quantity: 1, price: 15, total: 15 }
      ],
      subtotal: 615,
      tax: 61.5,
      total: 676.5
    };

    const layout = {
      pageSize: "A4",
      orientation: "portrait",
      elements: [
        {
          id: "el_1",
          type: "text",
          x: 20,
          y: 20,
          width: 200,
          height: 40,
          content: "INVOICE",
          style: { fontSize: "24px", fontWeight: "bold" }
        },
        {
          id: "el_2",
          type: "text",
          x: 20,
          y: 70,
          width: 200,
          height: 60,
          binding: "provider.name",
          style: { fontSize: "14px" }
        },
        {
          id: "el_3",
          type: "text",
          x: 350,
          y: 70,
          width: 200,
          height: 60,
          binding: "client.name",
          style: { fontSize: "14px", textAlign: "right" }
        },
        {
          id: "el_table",
          type: "table",
          x: 20,
          y: 150,
          width: 550,
          height: 300,
          tableConfig: {
            dataSource: "items",
            columns: [
              { header: "Description", binding: "description", width: "50%" },
              { header: "Qty", binding: "quantity", width: "15%" },
              { header: "Price", binding: "price", width: "15%", format: "currency" },
              { header: "Total", binding: "total", width: "20%", format: "currency" }
            ]
          }
        }
      ]
    };

    await storage.createTemplate({
      name: "Standard Invoice",
      description: "A clean, standard invoice layout.",
      layout: layout,
      sampleData: sampleData
    });

    // Marine/Cruise Ship Passenger Invoice Template
    const marineSampleData = {
      invoiceNumber: "CRUISE-2024-4589",
      issueDate: "2024-03-15",
      dueDate: "2024-03-22",
      bookingReference: "OCN-VY-2024-3847",
      cruiseLine: {
        name: "Oceanic Voyages International",
        address: "Port of Miami Terminal 3\n1015 North America Way\nMiami, FL 33132, USA",
        phone: "+1 (800) 555-CRUISE",
        email: "billing@oceanicvoyages.com",
        website: "www.oceanicvoyages.com",
        registrationNumber: "IMO 9876543",
        taxId: "US-TAX-987654321",
        logo: "https://placehold.co/200x80/0369a1/ffffff?text=Oceanic+Voyages"
      },
      vessel: {
        name: "M/V Ocean Majesty",
        registrationNumber: "IMO 1234567",
        flag: "Bahamas",
        tonnage: "142,000 GT",
        passengerCapacity: "3,400 passengers",
        classification: "Luxury Cruise Liner"
      },
      voyage: {
        voyageNumber: "OM-2024-12",
        itinerary: "Caribbean Paradise - 7 Nights",
        departurePort: "Port of Miami, Florida, USA",
        departureDate: "2024-04-05 16:00",
        arrivalPort: "Port of Miami, Florida, USA",
        arrivalDate: "2024-04-12 08:00",
        portsOfCall: [
          { port: "Cozumel, Mexico", arrival: "2024-04-06 08:00", departure: "2024-04-06 18:00" },
          { port: "George Town, Grand Cayman", arrival: "2024-04-07 09:00", departure: "2024-04-07 17:00" },
          { port: "Ocho Rios, Jamaica", arrival: "2024-04-08 10:00", departure: "2024-04-08 19:00" },
          { port: "At Sea", arrival: "2024-04-09 00:00", departure: "2024-04-09 23:59" },
          { port: "Nassau, Bahamas", arrival: "2024-04-10 08:00", departure: "2024-04-10 17:00" }
        ]
      },
      client: {
        leadName: "Captain James Anderson",
        companyName: "Anderson Maritime Consulting",
        address: {
          street: "2847 Seaside Boulevard",
          city: "Santa Monica",
          state: "CA",
          zipCode: "90405",
          country: "USA"
        },
        contact: {
          email: "j.anderson@oceanmail.com",
          phone: "+1 (310) 555-7890",
          mobile: "+1 (310) 555-7899"
        },
        identification: {
          passportNumber: "US-998877665",
          taxId: "US-TAX-112233445"
        },
        emergencyContact: {
          name: "Sarah Anderson",
          relationship: "Spouse",
          phone: "+1 (310) 555-7891"
        },
        loyaltyMember: {
          status: "Platinum",
          memberNumber: "PLT-45678",
          pointsBalance: 125000,
          discountRate: 0.15
        }
      },
      guests: [
        { 
          name: "Captain James Anderson", 
          age: 45, 
          cabinNumber: "A-301",
          deckLevel: "Deck 8 - Promenade",
          cabinType: "Ocean View Balcony Suite"
        },
        { 
          name: "Emily Anderson", 
          age: 42, 
          cabinNumber: "A-301",
          deckLevel: "Deck 8 - Promenade",
          cabinType: "Ocean View Balcony Suite"
        },
        { 
          name: "Sophie Anderson", 
          age: 12, 
          cabinNumber: "A-301",
          deckLevel: "Deck 8 - Promenade",
          cabinType: "Ocean View Balcony Suite"
        }
      ],
      accommodation: {
        cabinNumber: "A-301",
        cabinType: "Ocean View Balcony Suite",
        deckLevel: "Deck 8 - Promenade",
        bedConfiguration: "1 King Bed + 1 Sofa Bed",
        squareFootage: "285 sq ft",
        balconySize: "75 sq ft",
        maxOccupancy: 4,
        amenities: ["Private balcony", "Mini-bar", "Safe", "Premium bedding", "Concierge service"]
      },
      charges: [
        { 
          description: "Cruise Fare - Adult (2 passengers)", 
          category: "Accommodation",
          quantity: 2, 
          unitPrice: 1899.00, 
          total: 3798.00,
          taxable: true
        },
        { 
          description: "Cruise Fare - Child (1 passenger)", 
          category: "Accommodation",
          quantity: 1, 
          unitPrice: 949.00, 
          total: 949.00,
          taxable: true
        },
        { 
          description: "Port Fees & Taxes", 
          category: "Mandatory Fees",
          quantity: 3, 
          unitPrice: 125.00, 
          total: 375.00,
          taxable: false
        },
        { 
          description: "Government Taxes", 
          category: "Mandatory Fees",
          quantity: 3, 
          unitPrice: 89.50, 
          total: 268.50,
          taxable: false
        },
        { 
          description: "Premium Beverage Package", 
          category: "Add-ons",
          quantity: 2, 
          unitPrice: 65.00, 
          total: 130.00,
          taxable: true
        },
        { 
          description: "Shore Excursion - Snorkeling Adventure (Cozumel)", 
          category: "Excursions",
          quantity: 3, 
          unitPrice: 85.00, 
          total: 255.00,
          taxable: true
        },
        { 
          description: "Shore Excursion - Stingray City (Grand Cayman)", 
          category: "Excursions",
          quantity: 3, 
          unitPrice: 95.00, 
          total: 285.00,
          taxable: true
        },
        { 
          description: "Specialty Dining Package (3 nights)", 
          category: "Dining",
          quantity: 2, 
          unitPrice: 45.00, 
          total: 90.00,
          taxable: true
        },
        { 
          description: "Spa & Wellness Package", 
          category: "Wellness",
          quantity: 2, 
          unitPrice: 175.00, 
          total: 350.00,
          taxable: true
        },
        { 
          description: "WiFi Premium Package (7 days)", 
          category: "Services",
          quantity: 1, 
          unitPrice: 149.00, 
          total: 149.00,
          taxable: true
        },
        { 
          description: "Travel Insurance Premium", 
          category: "Insurance",
          quantity: 3, 
          unitPrice: 79.00, 
          total: 237.00,
          taxable: false
        },
        { 
          description: "Pre-Cruise Hotel Package (1 night)", 
          category: "Add-ons",
          quantity: 1, 
          unitPrice: 189.00, 
          total: 189.00,
          taxable: true
        }
      ],
      portCharges: [
        { 
          port: "Miami, USA", 
          description: "Embarkation Port Fee", 
          amount: 125.00,
          currency: "USD"
        },
        { 
          port: "Cozumel, Mexico", 
          description: "Port Docking & Services", 
          amount: 45.00,
          currency: "USD"
        },
        { 
          port: "George Town, Cayman Islands", 
          description: "Harbor Entry & Security", 
          amount: 55.00,
          currency: "USD"
        },
        { 
          port: "Ocho Rios, Jamaica", 
          description: "Port Authority Fee", 
          amount: 38.50,
          currency: "USD"
        },
        { 
          port: "Nassau, Bahamas", 
          description: "Passenger Head Tax", 
          amount: 61.50,
          currency: "USD"
        }
      ],
      financialSummary: {
        subtotal: 7075.50,
        taxableAmount: 6046.00,
        serviceFee: 604.60,
        gratuities: 252.00,
        tax: 484.00,
        total: 8416.10,
        amountPaid: 2000.00,
        balanceDue: 6416.10,
        currency: "USD"
      },
      paymentSchedule: [
        { 
          description: "Initial Deposit", 
          dueDate: "2024-01-15", 
          amount: 2000.00, 
          status: "Paid",
          paidDate: "2024-01-12",
          paymentMethod: "Credit Card ***1234"
        },
        { 
          description: "Second Payment", 
          dueDate: "2024-02-15", 
          amount: 2000.00, 
          status: "Pending"
        },
        { 
          description: "Final Payment", 
          dueDate: "2024-03-22", 
          amount: 4416.10, 
          status: "Pending"
        }
      ],
      terms: {
        cancellationPolicy: "90 days prior: 50% refund | 60 days: 25% refund | 30 days: Non-refundable",
        boardingTime: "14:00 - 15:30 on departure day",
        documentation: "Valid passport required for all passengers",
        medicalRequirements: "Cruise line medical form must be submitted 7 days prior to sailing"
      },
      notes: "Thank you for choosing Oceanic Voyages International. We look forward to welcoming you aboard the M/V Ocean Majesty. For questions regarding your booking, please contact our guest services team.",
      qrCodeData: "https://oceanicvoyages.com/booking/OCN-VY-2024-3847",
      invoiceStatus: "BALANCE DUE",
      approvedBy: "Maria Rodriguez - Revenue Manager",
      processedBy: "System Automated Invoice #AI-94782"
    };

    const marineLayout = {
      pageSize: "A4",
      orientation: "portrait",
      elements: [
        // Header with cruise line name
        {
          id: "m_header_line",
          type: "text",
          x: 20,
          y: 20,
          width: 500,
          height: 45,
          content: "Oceanic Voyages International",
          style: { fontSize: 28, fontWeight: "bold", color: "#0369a1" }
        },
        {
          id: "m_cruise_invoice",
          type: "text",
          x: 550,
          y: 20,
          width: 220,
          height: 50,
          content: "CRUISE INVOICE",
          style: { fontSize: 20, fontWeight: "bold", color: "#1e40af", textAlign: "right" }
        },
        // Status Badge
        {
          id: "m_status_badge",
          type: "badge",
          x: 650,
          y: 75,
          width: 120,
          height: 30,
          binding: "invoiceStatus",
          style: { backgroundColor: "#dc2626", color: "#ffffff", fontSize: 12, fontWeight: "bold" }
        },
        // Company details
        {
          id: "m_company_addr",
          type: "text",
          x: 20,
          y: 70,
          width: 300,
          height: 90,
          binding: "cruiseLine.address",
          style: { fontSize: 11, color: "#4b5563", lineHeight: 1.6 }
        },
        // Vessel Information Section
        {
          id: "m_vessel_heading",
          type: "text",
          x: 20,
          y: 170,
          width: 350,
          height: 30,
          content: "VESSEL INFORMATION",
          style: { fontSize: 14, fontWeight: "bold", color: "#0c4a6e", borderBottom: "2px solid #0ea5e9" }
        },
        {
          id: "m_vessel_name",
          type: "text",
          x: 20,
          y: 210,
          width: 350,
          height: 35,
          binding: "vessel.name",
          style: { fontSize: 18, fontWeight: "600", color: "#0369a1" }
        },
        {
          id: "m_vessel_details",
          type: "text",
          x: 20,
          y: 250,
          width: 350,
          height: 60,
          content: "IMO: {{vessel.registrationNumber}}\nFlag: {{vessel.flag}}\nTonnage: {{vessel.tonnage}}",
          style: { fontSize: 11, color: "#475569", lineHeight: 1.6 }
        },
        // Passenger Information Section
        {
          id: "m_passenger_heading",
          type: "text",
          x: 420,
          y: 170,
          width: 350,
          height: 30,
          content: "PASSENGER INFORMATION",
          style: { fontSize: 14, fontWeight: "bold", color: "#0c4a6e", borderBottom: "2px solid #0ea5e9" }
        },
        {
          id: "m_passenger_name",
          type: "text",
          x: 420,
          y: 210,
          width: 350,
          height: 35,
          binding: "client.leadName",
          style: { fontSize: 16, fontWeight: "600", color: "#1e40af" }
        },
        {
          id: "m_passenger_details",
          type: "text",
          x: 420,
          y: 250,
          width: 350,
          height: 70,
          content: "{{client.address.street}}\n{{client.address.city}}, {{client.address.state}} {{client.address.zipCode}}\n{{client.contact.email}} | {{client.contact.phone}}",
          style: { fontSize: 11, color: "#475569", lineHeight: 1.5 }
        },
        {
          id: "m_passenger_loyalty",
          type: "badge",
          x: 420,
          y: 175,
          width: 90,
          height: 25,
          binding: "client.loyaltyMember.status",
          style: { backgroundColor: "#7c3aed", color: "#ffffff", fontSize: 10, fontWeight: "bold" }
        },
        // Voyage Details Section
        {
          id: "m_voyage_heading",
          type: "text",
          x: 20,
          y: 330,
          width: 750,
          height: 30,
          content: "VOYAGE DETAILS",
          style: { fontSize: 14, fontWeight: "bold", color: "#0c4a6e", borderBottom: "2px solid #0ea5e9" }
        },
        {
          id: "m_voyage_info",
          type: "text",
          x: 20,
          y: 370,
          width: 750,
          height: 70,
          content: "{{voyage.itinerary}}\nDeparture: {{voyage.departurePort}} - {{voyage.departureDate}}\nReturn: {{voyage.arrivalPort}} - {{voyage.arrivalDate}}\nVoyage #: {{voyage.voyageNumber}}",
          style: { fontSize: 12, color: "#1e293b", lineHeight: 1.7 }
        },
        // Cabin Details
        {
          id: "m_cabin_heading",
          type: "text",
          x: 20,
          y: 450,
          width: 350,
          height: 30,
          content: "CABIN ASSIGNMENT",
          style: { fontSize: 13, fontWeight: "bold", color: "#0c4a6e" }
        },
        {
          id: "m_cabin_info",
          type: "text",
          x: 20,
          y: 485,
          width: 350,
          height: 65,
          content: "Cabin: {{accommodation.cabinNumber}}\n{{accommodation.cabinType}}\n{{accommodation.deckLevel}}",
          style: { fontSize: 12, color: "#334155", lineHeight: 1.6 }
        },
        // Booking Reference
        {
          id: "m_booking_ref",
          type: "text",
          x: 420,
          y: 450,
          width: 350,
          height: 30,
          content: "Booking Ref: {{bookingReference}}",
          style: { fontSize: 13, fontWeight: "600", color: "#1e40af" }
        },
        {
          id: "m_invoice_dates",
          type: "text",
          x: 420,
          y: 485,
          width: 350,
          height: 50,
          content: "Invoice #: {{invoiceNumber}}\nIssue Date: {{issueDate}}\nDue Date: {{dueDate}}",
          style: { fontSize: 11, color: "#475569", lineHeight: 1.6 }
        },
        // Charges Table
        {
          id: "m_charges_table",
          type: "table",
          x: 20,
          y: 570,
          width: 750,
          height: 320,
          tableConfig: {
            dataSource: "charges",
            columns: [
              { header: "Description", binding: "description", width: "40%" },
              { header: "Category", binding: "category", width: "20%" },
              { header: "Qty", binding: "quantity", width: "10%" },
              { header: "Unit Price", binding: "unitPrice", width: "15%", format: "currency" },
              { header: "Total", binding: "total", width: "15%", format: "currency" }
            ]
          },
          style: { tableVariant: "modern" }
        },
        // Financial Summary
        {
          id: "m_summary_box",
          type: "box",
          x: 530,
          y: 910,
          width: 240,
          height: 160,
          style: { backgroundColor: "#f0f9ff", border: "2px solid #0ea5e9" }
        },
        {
          id: "m_summary_subtotal",
          type: "text",
          x: 550,
          y: 920,
          width: 200,
          height: 25,
          content: "Subtotal: ${{financialSummary.subtotal}}",
          style: { fontSize: 12, color: "#334155" }
        },
        {
          id: "m_summary_service",
          type: "text",
          x: 550,
          y: 945,
          width: 200,
          height: 25,
          content: "Service Fee: ${{financialSummary.serviceFee}}",
          style: { fontSize: 12, color: "#334155" }
        },
        {
          id: "m_summary_gratuity",
          type: "text",
          x: 550,
          y: 970,
          width: 200,
          height: 25,
          content: "Gratuities: ${{financialSummary.gratuities}}",
          style: { fontSize: 12, color: "#334155" }
        },
        {
          id: "m_summary_tax",
          type: "text",
          x: 550,
          y: 995,
          width: 200,
          height: 25,
          content: "Tax: ${{financialSummary.tax}}",
          style: { fontSize: 12, color: "#334155" }
        },
        {
          id: "m_summary_line",
          type: "line",
          x: 550,
          y: 1023,
          width: 200,
          height: 2,
          style: { backgroundColor: "#0369a1" }
        },
        {
          id: "m_summary_total",
          type: "text",
          x: 550,
          y: 1030,
          width: 200,
          height: 30,
          content: "Total: ${{financialSummary.total}}",
          style: { fontSize: 16, fontWeight: "bold", color: "#0c4a6e" }
        },
        // QR Code
        {
          id: "m_qr_code",
          type: "qr",
          x: 20,
          y: 920,
          width: 110,
          height: 110,
          binding: "qrCodeData"
        },
        {
          id: "m_qr_label",
          type: "text",
          x: 20,
          y: 1035,
          width: 110,
          height: 20,
          content: "Scan to view",
          style: { fontSize: 9, color: "#6b7280", textAlign: "center" }
        },
        // Footer
        {
          id: "m_footer_note",
          type: "text",
          x: 20,
          y: 1080,
          width: 750,
          height: 30,
          binding: "notes",
          style: { fontSize: 9, color: "#9ca3af", textAlign: "center", fontStyle: "italic" }
        }
      ]
    };

    await storage.createTemplate({
      name: "Marine & Cruise Ship Passenger Invoice",
      description: "Comprehensive cruise ship passenger invoice with vessel, voyage, and detailed client information using nested attributes.",
      layout: marineLayout,
      sampleData: marineSampleData
    });

    // Cruise Ship Supplier/Vendor Invoice Template
    const supplierSampleData = {
      invoiceNumber: "SUP-INV-2024-7823",
      issueDate: "2024-03-10",
      dueDate: "2024-04-10",
      paymentTerms: "Net 30 Days",
      purchaseOrderNumber: "PO-CRUISE-2024-4501",
      supplier: {
        name: "Seaport Provisions & Marine Services Ltd.",
        companyType: "Limited Liability Company",
        address: {
          street: "1250 Industrial Port Road, Warehouse 14",
          city: "Fort Lauderdale",
          state: "Florida",
          zipCode: "33316",
          country: "USA"
        },
        contact: {
          name: "Miguel Santos",
          title: "Sales Director",
          email: "m.santos@seaportprovisions.com",
          phone: "+1 (954) 555-0198",
          fax: "+1 (954) 555-0199"
        },
        business: {
          taxId: "US-EIN-98-7654321",
          vatNumber: "VAT-FL-456789",
          registrationNumber: "FL-LLC-2015-8847",
          website: "www.seaportprovisions.com"
        },
        banking: {
          bankName: "Maritime Commerce Bank",
          accountName: "Seaport Provisions Ltd.",
          accountNumber: "****5678",
          routingNumber: "267084131",
          swift: "MCBKUS33FTL"
        },
        certifications: ["ISO 9001:2015", "HACCP Certified", "Maritime Supply Chain Security"]
      },
      client: {
        name: "Oceanic Voyages International",
        vessel: "M/V Ocean Majesty",
        vesselIMO: "IMO 1234567",
        address: {
          street: "Port of Miami Terminal 3",
          address2: "1015 North America Way",
          city: "Miami",
          state: "FL",
          zipCode: "33132",
          country: "USA"
        },
        contact: {
          name: "Robert Chen",
          title: "Chief Procurement Officer",
          department: "Marine Operations",
          email: "r.chen@oceanicvoyages.com",
          phone: "+1 (800) 555-2847",
          extension: "4501"
        },
        business: {
          taxId: "US-TAX-987654321",
          accountNumber: "CUST-OV-2018-445"
        }
      },
      deliveryDetails: {
        location: "Port of Miami - Berth 7",
        vesselName: "M/V Ocean Majesty",
        deliveryDate: "2024-03-18",
        deliveryTime: "08:00 - 10:00 AM",
        receivedBy: "Officer Marcus Thompson",
        deliveryNotes: "All perishable goods stored in designated refrigeration units immediately upon delivery. Quality inspection completed and approved."
      },
      provisions: [
        {
          itemCode: "PROV-FR-001",
          description: "Fresh Vegetables - Premium Grade (Mixed)",
          category: "Perishable Provisions",
          unit: "kg",
          quantity: 450,
          unitPrice: 3.85,
          total: 1732.50,
          storageTemp: "2-4°C",
          expiryDate: "2024-03-25"
        },
        {
          itemCode: "PROV-FR-012",
          description: "Fresh Fruits - Tropical Selection",
          category: "Perishable Provisions",
          unit: "kg",
          quantity: 380,
          unitPrice: 4.50,
          total: 1710.00,
          storageTemp: "10-12°C",
          expiryDate: "2024-03-23"
        },
        {
          itemCode: "PROV-MT-045",
          description: "Premium Beef - Various Cuts",
          category: "Frozen Meats",
          unit: "kg",
          quantity: 285,
          unitPrice: 18.75,
          total: 5343.75,
          storageTemp: "-18°C",
          expiryDate: "2024-09-18"
        },
        {
          itemCode: "PROV-SF-078",
          description: "Fresh Seafood - Daily Catch Assortment",
          category: "Fresh Seafood",
          unit: "kg",
          quantity: 195,
          unitPrice: 22.50,
          total: 4387.50,
          storageTemp: "0-2°C",
          expiryDate: "2024-03-20"
        },
        {
          itemCode: "PROV-DY-156",
          description: "Dairy Products - Milk, Cheese, Yogurt",
          category: "Dairy & Refrigerated",
          unit: "units",
          quantity: 850,
          unitPrice: 3.20,
          total: 2720.00,
          storageTemp: "2-6°C",
          expiryDate: "2024-03-28"
        },
        {
          itemCode: "PROV-BK-201",
          description: "Bakery Products - Fresh Bread & Pastries",
          category: "Bakery",
          unit: "units",
          quantity: 1200,
          unitPrice: 1.85,
          total: 2220.00,
          storageTemp: "Room Temp",
          expiryDate: "2024-03-22"
        },
        {
          itemCode: "PROV-BV-305",
          description: "Beverages - Soft Drinks & Juices (Cases)",
          category: "Beverages",
          unit: "cases",
          quantity: 180,
          unitPrice: 24.50,
          total: 4410.00,
          storageTemp: "Room Temp",
          expiryDate: "2024-12-31"
        },
        {
          itemCode: "PROV-AL-420",
          description: "Premium Wine Selection - International",
          category: "Alcoholic Beverages",
          unit: "bottles",
          quantity: 240,
          unitPrice: 28.00,
          total: 6720.00,
          storageTemp: "12-16°C",
          expiryDate: "2026-03-10"
        }
      ],
      marineServices: [
        {
          serviceCode: "SVC-FUEL-001",
          description: "Marine Diesel Fuel (MDO)",
          category: "Fuel & Lubricants",
          unit: "metric tons",
          quantity: 125.5,
          unitPrice: 845.00,
          total: 106047.50,
          specifications: "ISO 8217:2017 DMB Grade"
        },
        {
          serviceCode: "SVC-WTR-102",
          description: "Potable Water Supply",
          category: "Utilities",
          unit: "cubic meters",
          quantity: 450,
          unitPrice: 4.75,
          total: 2137.50,
          specifications: "WHO Drinking Water Standards"
        },
        {
          serviceCode: "SVC-WST-205",
          description: "Waste Management & Disposal",
          category: "Environmental Services",
          unit: "service",
          quantity: 1,
          unitPrice: 3850.00,
          total: 3850.00,
          specifications: "MARPOL Annex V Compliant"
        },
        {
          serviceCode: "SVC-CLN-310",
          description: "Deep Cleaning & Sanitation Services",
          category: "Cleaning Services",
          unit: "hours",
          quantity: 48,
          unitPrice: 85.00,
          total: 4080.00,
          specifications: "CDC Vessel Sanitation Program Standards"
        },
        {
          serviceCode: "SVC-MNT-415",
          description: "Engine Room Maintenance - Preventive",
          category: "Technical Services",
          unit: "service",
          quantity: 1,
          unitPrice: 8500.00,
          total: 8500.00,
          specifications: "Classification Society Approved"
        }
      ],
      portServices: [
        {
          description: "Docking & Berthing Fees",
          port: "Port of Miami",
          duration: "24 hours",
          amount: 4800.00
        },
        {
          description: "Pilotage Services - Inbound",
          port: "Port of Miami",
          duration: "2 hours",
          amount: 1850.00
        },
        {
          description: "Tug Boat Assistance",
          port: "Port of Miami",
          duration: "1.5 hours",
          amount: 2400.00
        },
        {
          description: "Mooring Services",
          port: "Port of Miami",
          duration: "Full service",
          amount: 950.00
        },
        {
          description: "Shore Power Connection",
          port: "Port of Miami",
          duration: "24 hours",
          amount: 1650.00
        }
      ],
      financialBreakdown: {
        provisionsSubtotal: 29243.75,
        servicesSubtotal: 124615.00,
        portServicesSubtotal: 11650.00,
        subtotal: 165508.75,
        discount: {
          description: "Volume Discount (5%)",
          percentage: 0.05,
          amount: 8275.44
        },
        adjustedSubtotal: 157233.31,
        tax: {
          description: "State Sales Tax (6.5%)",
          rate: 0.065,
          amount: 10220.17
        },
        shippingHandling: 1850.00,
        fuelSurcharge: {
          description: "Fuel Surcharge (2%)",
          rate: 0.02,
          amount: 3144.67
        },
        total: 172448.15,
        currency: "USD",
        exchangeRate: 1.00
      },
      paymentHistory: [
        {
          date: "2024-02-15",
          invoiceNumber: "SUP-INV-2024-7201",
          amount: 148500.00,
          paymentMethod: "Wire Transfer",
          status: "Paid"
        },
        {
          date: "2024-01-20",
          invoiceNumber: "SUP-INV-2024-6844",
          amount: 132750.00,
          paymentMethod: "Wire Transfer",
          status: "Paid"
        }
      ],
      terms: {
        payment: "Net 30 Days from invoice date",
        lateFee: "1.5% per month on overdue balance",
        warranty: "All provisions guaranteed fresh upon delivery. Marine services comply with international maritime standards.",
        returns: "Defective items may be returned within 24 hours of delivery with photographic evidence.",
        jurisdiction: "Governed by the laws of the State of Florida, USA"
      },
      notes: "Thank you for your continued business. For inquiries regarding this invoice, please contact our billing department at billing@seaportprovisions.com or call +1 (954) 555-0198 ext. 202.",
      approvedBy: {
        supplier: "Miguel Santos - Sales Director",
        client: "Robert Chen - CPO",
        date: "2024-03-10"
      }
    };

    const supplierLayout = {
      pageSize: "A4",
      orientation: "portrait",
      elements: [
        // Header - Supplier Information
        {
          id: "s_supplier_name",
          type: "text",
          x: 20,
          y: 20,
          width: 450,
          height: 45,
          binding: "supplier.name",
          style: { fontSize: 26, fontWeight: "bold", color: "#0f172a" }
        },
        {
          id: "s_invoice_title",
          type: "text",
          x: 520,
          y: 20,
          width: 250,
          height: 45,
          content: "SUPPLIER INVOICE",
          style: { fontSize: 20, fontWeight: "bold", color: "#0369a1", textAlign: "right" }
        },
        {
          id: "s_supplier_address",
          type: "text",
          x: 20,
          y: 70,
          width: 350,
          height: 75,
          content: "{{supplier.address.street}}\n{{supplier.address.city}}, {{supplier.address.state}} {{supplier.address.zipCode}}\n{{supplier.contact.email}} | {{supplier.contact.phone}}",
          style: { fontSize: 10, color: "#475569", lineHeight: 1.6 }
        },
        {
          id: "s_invoice_details",
          type: "text",
          x: 520,
          y: 70,
          width: 250,
          height: 75,
          content: "Invoice #: {{invoiceNumber}}\nIssue Date: {{issueDate}}\nDue Date: {{dueDate}}\nPO #: {{purchaseOrderNumber}}",
          style: { fontSize: 11, color: "#1e293b", textAlign: "right", lineHeight: 1.6, fontWeight: "500" }
        },
        // Divider Line
        {
          id: "s_divider_1",
          type: "line",
          x: 20,
          y: 155,
          width: 750,
          height: 2,
          style: { backgroundColor: "#0ea5e9" }
        },
        // Client Section
        {
          id: "s_bill_to_label",
          type: "text",
          x: 20,
          y: 170,
          width: 100,
          height: 25,
          content: "BILL TO:",
          style: { fontSize: 12, fontWeight: "bold", color: "#0c4a6e" }
        },
        {
          id: "s_client_name",
          type: "text",
          x: 20,
          y: 200,
          width: 350,
          height: 30,
          binding: "client.name",
          style: { fontSize: 16, fontWeight: "600", color: "#0f172a" }
        },
        {
          id: "s_client_vessel",
          type: "text",
          x: 20,
          y: 235,
          width: 350,
          height: 20,
          content: "Vessel: {{client.vessel}} ({{client.vesselIMO}})",
          style: { fontSize: 11, color: "#64748b", fontStyle: "italic" }
        },
        {
          id: "s_client_address",
          type: "text",
          x: 20,
          y: 260,
          width: 350,
          height: 60,
          content: "{{client.address.street}}\n{{client.address.city}}, {{client.address.state}} {{client.address.zipCode}}",
          style: { fontSize: 10, color: "#475569", lineHeight: 1.5 }
        },
        // Delivery Details
        {
          id: "s_delivery_label",
          type: "text",
          x: 420,
          y: 170,
          width: 350,
          height: 25,
          content: "DELIVERY DETAILS:",
          style: { fontSize: 12, fontWeight: "bold", color: "#0c4a6e" }
        },
        {
          id: "s_delivery_info",
          type: "text",
          x: 420,
          y: 200,
          width: 350,
          height: 120,
          content: "Location: {{deliveryDetails.location}}\nVessel: {{deliveryDetails.vesselName}}\nDate: {{deliveryDetails.deliveryDate}}\nTime: {{deliveryDetails.deliveryTime}}\nReceived By: {{deliveryDetails.receivedBy}}",
          style: { fontSize: 10, color: "#475569", lineHeight: 1.7 }
        },
        // Provisions Table (Classic Style)
        {
          id: "s_provisions_heading",
          type: "text",
          x: 20,
          y: 340,
          width: 750,
          height: 30,
          content: "PROVISIONS & SUPPLIES",
          style: { fontSize: 13, fontWeight: "bold", color: "#0c4a6e", backgroundColor: "#f0f9ff", paddingBottom: 8 }
        },
        {
          id: "s_provisions_table",
          type: "table",
          x: 20,
          y: 375,
          width: 750,
          height: 200,
          tableConfig: {
            dataSource: "provisions",
            columns: [
              { header: "Item Code", binding: "itemCode", width: "12%" },
              { header: "Description", binding: "description", width: "38%" },
              { header: "Category", binding: "category", width: "18%" },
              { header: "Qty", binding: "quantity", width: "8%" },
              { header: "Unit Price", binding: "unitPrice", width: "12%", format: "currency" },
              { header: "Total", binding: "total", width: "12%", format: "currency" }
            ]
          },
          style: { tableVariant: "default" }
        },
        // Marine Services Table (Modern Style)
        {
          id: "s_services_heading",
          type: "text",
          x: 20,
          y: 590,
          width: 750,
          height: 30,
          content: "MARINE SERVICES",
          style: { fontSize: 13, fontWeight: "bold", color: "#0c4a6e", backgroundColor: "#f0f9ff", paddingBottom: 8 }
        },
        {
          id: "s_services_table",
          type: "table",
          x: 20,
          y: 625,
          width: 750,
          height: 150,
          tableConfig: {
            dataSource: "marineServices",
            columns: [
              { header: "Service Code", binding: "serviceCode", width: "15%" },
              { header: "Description", binding: "description", width: "35%" },
              { header: "Category", binding: "category", width: "20%" },
              { header: "Qty", binding: "quantity", width: "10%" },
              { header: "Rate", binding: "unitPrice", width: "10%", format: "currency" },
              { header: "Total", binding: "total", width: "10%", format: "currency" }
            ]
          },
          style: { tableVariant: "modern" }
        },
        // Port Services Table (Minimal Style)
        {
          id: "s_port_heading",
          type: "text",
          x: 20,
          y: 790,
          width: 750,
          height: 30,
          content: "PORT SERVICES & FEES",
          style: { fontSize: 13, fontWeight: "bold", color: "#0c4a6e", backgroundColor: "#f0f9ff", paddingBottom: 8 }
        },
        {
          id: "s_port_table",
          type: "table",
          x: 20,
          y: 825,
          width: 750,
          height: 120,
          tableConfig: {
            dataSource: "portServices",
            columns: [
              { header: "Service", binding: "description", width: "40%" },
              { header: "Port", binding: "port", width: "25%" },
              { header: "Duration", binding: "duration", width: "20%" },
              { header: "Amount", binding: "amount", width: "15%", format: "currency" }
            ]
          },
          style: { tableVariant: "minimal" }
        },
        // Financial Summary Box
        {
          id: "s_summary_box",
          type: "box",
          x: 480,
          y: 960,
          width: 290,
          height: 140,
          style: { backgroundColor: "#f8fafc", border: "2px solid #cbd5e1" }
        },
        {
          id: "s_summary_subtotal",
          type: "text",
          x: 500,
          y: 970,
          width: 250,
          height: 20,
          content: "Subtotal: ${{financialBreakdown.subtotal}}",
          style: { fontSize: 11, color: "#334155" }
        },
        {
          id: "s_summary_discount",
          type: "text",
          x: 500,
          y: 995,
          width: 250,
          height: 20,
          content: "Discount (5%): -${{financialBreakdown.discount.amount}}",
          style: { fontSize: 11, color: "#16a34a" }
        },
        {
          id: "s_summary_adjusted",
          type: "text",
          x: 500,
          y: 1020,
          width: 250,
          height: 20,
          content: "Adjusted: ${{financialBreakdown.adjustedSubtotal}}",
          style: { fontSize: 11, color: "#334155" }
        },
        {
          id: "s_summary_tax",
          type: "text",
          x: 500,
          y: 1045,
          width: 250,
          height: 20,
          content: "Tax (6.5%): ${{financialBreakdown.tax.amount}}",
          style: { fontSize: 11, color: "#334155" }
        },
        {
          id: "s_summary_line",
          type: "line",
          x: 500,
          y: 1070,
          width: 250,
          height: 2,
          style: { backgroundColor: "#0369a1" }
        },
        {
          id: "s_summary_total",
          type: "text",
          x: 500,
          y: 1077,
          width: 250,
          height: 23,
          content: "TOTAL DUE: ${{financialBreakdown.total}}",
          style: { fontSize: 14, fontWeight: "bold", color: "#0c4a6e" }
        },
        // Payment Terms
        {
          id: "s_payment_terms",
          type: "text",
          x: 20,
          y: 970,
          width: 440,
          height: 60,
          content: "Payment Terms: {{terms.payment}}\n\nBank Details:\n{{supplier.banking.bankName}}\nAccount: {{supplier.banking.accountNumber}} | Swift: {{supplier.banking.swift}}",
          style: { fontSize: 9, color: "#64748b", lineHeight: 1.6 }
        },
        // Footer Note
        {
          id: "s_footer_note",
          type: "text",
          x: 20,
          y: 1080,
          width: 750,
          height: 25,
          binding: "notes",
          style: { fontSize: 8, color: "#94a3b8", textAlign: "center", fontStyle: "italic" }
        }
      ]
    };

    await storage.createTemplate({
      name: "Cruise Ship Supplier Invoice",
      description: "Comprehensive supplier invoice for marine provisions, services, and port fees. Demonstrates multiple table styles (classic, modern, minimal) and extensive use of nested JSON attributes.",
      layout: supplierLayout,
      sampleData: supplierSampleData
    });
    
    console.log("Database seeded with 3 templates!");
  }
}
