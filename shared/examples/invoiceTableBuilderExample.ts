#!/usr/bin/env node

/**
 * Invoice Table Builder - Example Usage
 * 
 * This script demonstrates how to use the Invoice Table Builder module
 * to create dynamic price tables with add/remove footer functionality.
 * 
 * Run with: tsx shared/examples/invoiceTableBuilderExample.ts
 */

import {
  InvoiceTableStructureBuilder,
  InvoiceTableHTMLRenderer,
  InvoiceFooterPresets,
  buildStandardInvoiceSummary
} from '../invoiceTableBuilder';

console.log('='.repeat(60));
console.log('Invoice Table Builder - Example Demonstrations');
console.log('='.repeat(60));

// ===== Example 1: Basic Usage =====
console.log('\n📋 Example 1: Basic Footer Row Management\n');

const builder1 = new InvoiceTableStructureBuilder('USD');

console.log('Adding footer rows...');
builder1
  .addFooterRow(InvoiceFooterPresets.subtotal('totals.subtotal'))
  .addFooterRow(InvoiceFooterPresets.tax('totals.tax', 10))
  .addFooterRow(InvoiceFooterPresets.grandTotal('totals.final'));

console.log(`✓ Footer rows added: ${builder1.getFooterRowCount()}`);

const sampleData1 = {
  totals: {
    subtotal: 1250.00,
    tax: 125.00,
    final: 1375.00
  }
};

const renderer1 = new InvoiceTableHTMLRenderer(sampleData1);
const html1 = renderer1.renderHTMLTable(builder1.getStructure());

console.log('\nGenerated HTML:');
console.log(html1);

// ===== Example 2: Add and Remove Operations =====
console.log('\n\n📋 Example 2: Add and Remove Operations\n');

const builder2 = new InvoiceTableStructureBuilder('EUR');

console.log('Initial state: Adding 3 rows');
builder2
  .addFooterRow({ labelText: 'Subtotal', valueBinding: 'amounts.sub', displayFormat: 'money' })
  .addFooterRow({ labelText: 'VAT (20%)', valueBinding: 'amounts.vat', displayFormat: 'money' })
  .addFooterRow({ labelText: 'Total', valueBinding: 'amounts.total', displayFormat: 'money' });

console.log(`✓ Rows after adding: ${builder2.getFooterRowCount()}`);

console.log('\nUser clicks "Add Row" button...');
builder2.addFooterRow({ labelText: 'Shipping', valueBinding: 'amounts.shipping', displayFormat: 'money' });
console.log(`✓ Rows after add: ${builder2.getFooterRowCount()}`);

console.log('\nUser clicks "Remove Row" button...');
builder2.removeLastFooterRow();
console.log(`✓ Rows after remove: ${builder2.getFooterRowCount()}`);

// ===== Summary =====
console.log('\n' + '='.repeat(60));
console.log('✅ Examples completed successfully!');
console.log('='.repeat(60));
console.log('\nKey Features Demonstrated:');
console.log('  • Adding footer rows dynamically');
console.log('  • Removing footer rows');
console.log('  • Currency formatting (USD, EUR)');
console.log('  • HTML rendering with data binding');
console.log('  • Using preset templates');
console.log('\nSee docs/INVOICE_TABLE_BUILDER.md for full documentation.');
console.log('');
