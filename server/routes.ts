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

    // Marine/Cruise Ship Invoice Template
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
        taxId: "US-TAX-987654321"
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
      passenger: {
        leadName: "Captain James Anderson",
        address: "2847 Seaside Boulevard\nSanta Monica, CA 90405\nUSA",
        email: "j.anderson@oceanmail.com",
        phone: "+1 (310) 555-7890",
        passportNumber: "US-998877665",
        emergencyContact: "Sarah Anderson - +1 (310) 555-7891"
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
          binding: "passenger.leadName",
          style: { fontSize: 16, fontWeight: "600", color: "#1e40af" }
        },
        {
          id: "m_passenger_details",
          type: "text",
          x: 420,
          y: 250,
          width: 350,
          height: 70,
          binding: "passenger.address",
          style: { fontSize: 11, color: "#475569", lineHeight: 1.5 }
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
      name: "Marine & Cruise Ship Invoice",
      description: "Comprehensive cruise ship invoice with vessel, voyage, and passenger details.",
      layout: marineLayout,
      sampleData: marineSampleData
    });
    
    console.log("Database seeded with 2 templates!");
  }
}
