# Visual Guide: Text Presets and Marine Template

## 1. Text Presets Panel

The new Text Presets tab provides 14 pre-configured text block styles:

### Standard Presets
```
┌─────────────────────────────────────────┐
│  Text Presets                           │
│  Pre-styled text blocks for common      │
│  invoice elements                        │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ Address Block                    │   │
│  │ Multi-line address with proper   │   │
│  │ spacing                          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Supplier Name                    │   │
│  │ Large bold supplier/company name │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Invoice Title                    │   │
│  │ Large prominent invoice header   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Total Amount                     │   │
│  │ Large total amount display       │   │
│  └─────────────────────────────────┘   │
│  ...and 10 more presets              │
└─────────────────────────────────────────┘
```

### Marine-Specific Presets
```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐   │
│  │ Vessel Name                      │   │
│  │ Ship or vessel name (marine     │   │
│  │ themed)                          │   │
│  │                                  │   │
│  │ M/V Ocean Voyager                │   │
│  │ [Serif font, ocean blue color]   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Port Information                 │   │
│  │ Port of call details             │   │
│  │                                  │   │
│  │ Port: Miami, FL                  │   │
│  │ Departure: {{departureDate}}     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Cabin Number                     │   │
│  │ Cabin or suite number            │   │
│  │                                  │   │
│  │ Cabin: A-101                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 2. Editor Interface Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Header: Template Name, Edit/Preview Toggle, Export, Save                 │
├──────────────┬────────────────────────────────────────────┬────────────────┤
│              │                                            │                │
│  Left Panel  │            Canvas Area                     │  Right Panel   │
│              │                                            │                │
│ ┌──────────┐ │  ┌──────────────────────────────────┐    │  Element       │
│ │Components│ │  │                                  │    │  Properties    │
│ │  Presets │ │  │   A4 Page (794x1123px)          │    │                │
│ └──────────┘ │  │   Grid: 10px × 10px              │    │  ┌──────────┐  │
│              │  │                                  │    │  │ Position  │  │
│ [Text    ]   │  │   [Elements snap to grid]        │    │  │ Size      │  │
│ [Image   ]   │  │                                  │    │  │ Style     │  │
│ [Table   ]   │  │   Zoom: 80%                      │    │  │ Content   │  │
│ [Box     ]   │  │                                  │    │  └──────────┘  │
│              │  └──────────────────────────────────┘    │                │
│ Sample Data  │                                            │                │
│ JSON Editor  │                                            │                │
│              │                                            │                │
└──────────────┴────────────────────────────────────────────┴────────────────┘
```

## 3. Marine Template Structure

### Visual Layout (A4 Page - 794x1123px)

```
┌────────────────────────────────────────────────────────────────┐
│  Y:20   Oceanic Voyages International      CRUISE INVOICE      │ ← Header
│                                            [BALANCE DUE]        │
│  Y:70   Port of Miami Terminal 3                               │
│         1015 North America Way                                 │
│         Miami, FL 33132, USA                                   │
├────────────────────────────────────────────────────────────────┤
│  Y:170  ═══ VESSEL INFORMATION ═══  ═══ PASSENGER INFO ═══    │ ← Section
│                                                                 │
│  Y:210  M/V Ocean Majesty           Captain James Anderson     │
│                                                                 │
│  Y:250  IMO: 1234567                2847 Seaside Boulevard     │
│         Flag: Bahamas               Santa Monica, CA 90405     │
│         Tonnage: 142,000 GT         USA                        │
├────────────────────────────────────────────────────────────────┤
│  Y:330  ════════════════ VOYAGE DETAILS ═══════════════════    │ ← Voyage
│                                                                 │
│  Y:370  Caribbean Paradise - 7 Nights                          │
│         Departure: Port of Miami - 2024-04-05 16:00            │
│         Return: Port of Miami - 2024-04-12 08:00               │
│         Voyage #: OM-2024-12                                   │
├────────────────────────────────────────────────────────────────┤
│  Y:450  ═══ CABIN ASSIGNMENT ═══    Booking Ref: OCN-VY-...   │ ← Details
│                                     Invoice #: CRUISE-2024-... │
│  Y:485  Cabin: A-301                Issue Date: 2024-03-15     │
│         Ocean View Balcony Suite    Due Date: 2024-03-22       │
│         Deck 8 - Promenade                                     │
├────────────────────────────────────────────────────────────────┤
│  Y:570  ┌───────────────────────────────────────────────────┐ │ ← Table
│         │ Description          │ Category │ Qty │ Unit │ Tot│ │
│         ├───────────────────────────────────────────────────┤ │
│         │ Cruise Fare - Adult  │ Accomm   │ 2   │$1899│... │ │
│         │ Cruise Fare - Child  │ Accomm   │ 1   │$949 │... │ │
│         │ Port Fees & Taxes    │ Fees     │ 3   │$125 │... │ │
│         │ Beverage Package     │ Add-ons  │ 2   │$65  │... │ │
│         │ Shore Excursion 1    │ Excur    │ 3   │$85  │... │ │
│         │ Shore Excursion 2    │ Excur    │ 3   │$95  │... │ │
│         │ Specialty Dining     │ Dining   │ 2   │$45  │... │ │
│         │ Spa Package          │ Wellness │ 2   │$175 │... │ │
│         │ WiFi Package         │ Services │ 1   │$149 │... │ │
│         │ Travel Insurance     │ Insurance│ 3   │$79  │... │ │
│         │ Pre-Cruise Hotel     │ Add-ons  │ 1   │$189 │... │ │
│         └───────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│  Y:920  ┌──────────┐                ┌────────────────────────┐│ ← Footer
│         │   QR     │                │ Subtotal:    $7,075.50 ││
│         │   CODE   │                │ Service Fee:   $604.60 ││
│         │          │                │ Gratuities:    $252.00 ││
│         │          │                │ Tax:           $484.00 ││
│         └──────────┘                │ ───────────────────────││
│  Y:1030 Scan to view               │ TOTAL:       $8,416.10 ││
│                                     └────────────────────────┘│
│  Y:1080 Thank you for choosing Oceanic Voyages International   │
└────────────────────────────────────────────────────────────────┘
```

### Grid Alignment Example

All elements align to 10px grid:
```
X coordinates: 20, 30, 40, 50, ... 420, 530, 550, 650, 750, 770
Y coordinates: 20, 70, 170, 210, 250, 330, 370, 450, 485, 570, ...
Widths: 100, 110, 200, 220, 240, 250, 300, 350, 500, 750
Heights: 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 160, 320
```

Every value is a multiple of 10!

## 4. Data Structure Overview

### Marine Sample Data Hierarchy
```
marineSampleData
├── invoiceNumber: "CRUISE-2024-4589"
├── issueDate: "2024-03-15"
├── dueDate: "2024-03-22"
├── bookingReference: "OCN-VY-2024-3847"
├── cruiseLine
│   ├── name: "Oceanic Voyages International"
│   ├── address: "Port of Miami Terminal 3..."
│   ├── phone: "+1 (800) 555-CRUISE"
│   ├── email: "billing@oceanicvoyages.com"
│   └── ... (website, registration, tax ID)
├── vessel
│   ├── name: "M/V Ocean Majesty"
│   ├── registrationNumber: "IMO 1234567"
│   ├── flag: "Bahamas"
│   └── ... (tonnage, capacity, class)
├── voyage
│   ├── voyageNumber: "OM-2024-12"
│   ├── itinerary: "Caribbean Paradise - 7 Nights"
│   ├── departurePort: "Port of Miami, Florida, USA"
│   ├── departureDate: "2024-04-05 16:00"
│   └── portsOfCall: [array of 5 ports]
├── passenger
│   ├── leadName: "Captain James Anderson"
│   ├── address: "2847 Seaside Boulevard..."
│   └── ... (email, phone, passport, emergency)
├── guests: [3 passengers with cabin details]
├── accommodation
│   ├── cabinNumber: "A-301"
│   ├── cabinType: "Ocean View Balcony Suite"
│   └── ... (deck, beds, size, amenities)
├── charges: [12 detailed line items]
│   ├── Cruise Fare - Adult (2 × $1,899.00)
│   ├── Cruise Fare - Child (1 × $949.00)
│   ├── Port Fees & Taxes (3 × $125.00)
│   ├── Beverage Package (2 × $65.00)
│   ├── Shore Excursions (various)
│   ├── Specialty Dining (2 × $45.00)
│   └── ... (spa, wifi, insurance, hotel)
├── financialSummary
│   ├── subtotal: $7,075.50
│   ├── serviceFee: $604.60
│   ├── gratuities: $252.00
│   ├── tax: $484.00
│   ├── total: $8,416.10
│   ├── amountPaid: $2,000.00
│   └── balanceDue: $6,416.10
├── paymentSchedule: [3 payment installments]
├── terms: {cancellation, boarding, documentation}
├── notes: "Thank you for choosing..."
├── qrCodeData: "https://oceanicvoyages.com/..."
└── invoiceStatus: "BALANCE DUE"
```

## 5. Text Preset Examples with Styles

### Address Block (250×80px)
```
┌────────────────────────────┐
│ Company Name               │  fontSize: 12px
│ 123 Street Address         │  lineHeight: 1.5
│ City, State ZIP            │  color: #333333
│ Country                    │  
└────────────────────────────┘
```

### Supplier Name (300×50px)
```
┌────────────────────────────────┐
│                                │
│    Supplier Name               │  fontSize: 24px
│                                │  fontWeight: bold
└────────────────────────────────┘  color: #1a1a1a
```

### Invoice Title (200×50px)
```
┌──────────────────┐
│                  │
│   INVOICE        │  fontSize: 32px
│                  │  fontWeight: bold
└──────────────────┘  color: #2563eb
                      textTransform: uppercase
                      letterSpacing: 2px
```

### Vessel Name (300×45px)
```
┌────────────────────────────────┐
│                                │
│  M/V Ocean Voyager             │  fontSize: 20px
│                                │  fontWeight: 600
└────────────────────────────────┘  color: #0369a1
                                    fontFamily: serif
```

## 6. Grid Snapping Behavior

### Before: Element at (47, 83)
```
┌─────────────────────────┐
│  ·  ·  ·  ·  ·  ·  ·  ·│  Grid dots (10px)
│  ·  ·  ·  ·  ·  ·  ·  ·│
│  ·  ·  ·  ·  ·  ·  ·  ·│
│  ·  · ┌──────┐·  ·  ·  │  Element at (47, 83)
│  ·  ·│Text  │·  ·  ·  │  Not aligned!
│  ·  · └──────┘·  ·  ·  │
│  ·  ·  ·  ·  ·  ·  ·  ·│
└─────────────────────────┘
```

### After: Element at (50, 80)
```
┌─────────────────────────┐
│  ·  ·  ·  ·  ·  ·  ·  ·│  Grid dots (10px)
│  ·  ·  ·  ·  ·  ·  ·  ·│
│  ·  ·  ·  ·  ·  ·  ·  ·│
│  ·  · ┌──────┐  ·  ·  ·│  Element at (50, 80)
│  ·  ·│Text  │  ·  ·  ·│  Perfectly aligned!
│  ·  · └──────┘  ·  ·  ·│
│  ·  ·  ·  ·  ·  ·  ·  ·│
└─────────────────────────┘
```

The `snapToGrid()` function rounds to nearest 10px:
- 47 → 50
- 83 → 80
- 125 → 130
- 238 → 240

## 7. Color Palette

### Marine Template Colors
```
Primary Blues (Ocean Theme):
  #0369a1 ▓▓▓▓ Vessel names, major headings
  #0c4a6e ▓▓▓▓ Section headings
  #1e40af ▓▓▓▓ Passenger name, invoice title
  #0ea5e9 ▓▓▓▓ Borders, accents

Text Grays (Readability):
  #1e293b ▓▓▓▓ Voyage details
  #334155 ▓▓▓▓ Cabin info
  #475569 ▓▓▓▓ Invoice dates, contact
  #4b5563 ▓▓▓▓ Company address
  #6b7280 ▓▓▓▓ QR label

Backgrounds:
  #f0f9ff ░░░░ Light blue (summary box)
  #ffffff ░░░░ White (main background)

Status Colors:
  #dc2626 ▓▓▓▓ Red (balance due)
  #22c55e ▓▓▓▓ Green (paid status)
```

## 8. Usage Instructions

### Adding a Text Preset
1. Click "Text Presets" tab in left sidebar
2. Click desired preset (e.g., "Vessel Name")
3. Element appears at (50, 50) on canvas
4. Element is automatically selected
5. Drag to desired position (snaps to grid)
6. Edit content in right properties panel

### Using the Marine Template
1. Select "Marine & Cruise Ship Invoice" from template list
2. Click "Play / Generate" to preview with data
3. All {{bindings}} are replaced with actual values
4. Table shows all 12 charge items
5. Financial totals calculated automatically
6. QR code renders with booking URL

### Customizing Elements
1. Select any element on canvas
2. Right panel shows properties:
   - Position (X, Y)
   - Size (Width, Height)
   - Style (Font, Color, etc.)
   - Content/Binding
3. Changes apply immediately
4. Grid snapping maintains alignment

## Benefits Summary

✅ **Grid Alignment**: All elements snap to 10px grid automatically
✅ **Time Saving**: Pre-styled text blocks ready to use
✅ **Consistency**: Marine theme with proper color scheme
✅ **Comprehensive**: 400+ lines of realistic sample data
✅ **Professional**: Production-ready invoice template
✅ **Flexible**: Easy to customize and extend
✅ **Well-Organized**: Clear visual hierarchy
✅ **Realistic**: Actual cruise industry terminology and structure
