/**
 * Invoice Table Builder
 * Specialized utility for building dynamic invoice table structures
 * for the Invoice Designer Engine
 */

export interface TableRowSpec {
  labelText: string;
  valueBinding: string;
  displayFormat?: 'money' | 'plain' | 'percentage';
  customStyle?: RowStyleConfig;
}

export interface RowStyleConfig {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
}

export interface PriceTableStructure {
  mainRows: TableRowSpec[];
  footerRows: TableRowSpec[];
  currencyCode: 'USD' | 'EUR' | 'none';
}

/**
 * Builds a price table structure for invoice summaries
 */
export class InvoiceTableStructureBuilder {
  private structure: PriceTableStructure;

  constructor(currencyCode: 'USD' | 'EUR' | 'none' = 'USD') {
    this.structure = {
      mainRows: [],
      footerRows: [],
      currencyCode
    };
  }

  /**
   * Adds a main data row
   */
  addMainRow(spec: TableRowSpec): this {
    this.structure.mainRows.push(spec);
    return this;
  }

  /**
   * Adds a footer/summary row
   */
  addFooterRow(spec: TableRowSpec): this {
    this.structure.footerRows.push(spec);
    return this;
  }

  /**
   * Removes the last footer row
   */
  removeLastFooterRow(): this {
    if (this.structure.footerRows.length > 0) {
      this.structure.footerRows.pop();
    }
    return this;
  }

  /**
   * Removes a specific footer row by index
   */
  removeFooterRowAt(index: number): this {
    if (index >= 0 && index < this.structure.footerRows.length) {
      this.structure.footerRows.splice(index, 1);
    }
    return this;
  }

  /**
   * Inserts a footer row at a specific position
   */
  insertFooterRowAt(index: number, spec: TableRowSpec): this {
    if (index >= 0 && index <= this.structure.footerRows.length) {
      this.structure.footerRows.splice(index, 0, spec);
    }
    return this;
  }

  /**
   * Reorders footer rows
   */
  moveFooterRow(fromIndex: number, toIndex: number): this {
    if (
      fromIndex >= 0 && 
      fromIndex < this.structure.footerRows.length &&
      toIndex >= 0 && 
      toIndex < this.structure.footerRows.length
    ) {
      const [movedRow] = this.structure.footerRows.splice(fromIndex, 1);
      this.structure.footerRows.splice(toIndex, 0, movedRow);
    }
    return this;
  }

  /**
   * Gets the current structure
   */
  getStructure(): PriceTableStructure {
    return { ...this.structure };
  }

  /**
   * Counts total rows including footer
   */
  getTotalRowCount(): number {
    return this.structure.mainRows.length + this.structure.footerRows.length;
  }

  /**
   * Gets footer row count
   */
  getFooterRowCount(): number {
    return this.structure.footerRows.length;
  }

  /**
   * Clears all footer rows
   */
  clearFooterRows(): this {
    this.structure.footerRows = [];
    return this;
  }

  /**
   * Updates an existing footer row
   */
  updateFooterRow(index: number, updates: Partial<TableRowSpec>): this {
    if (index >= 0 && index < this.structure.footerRows.length) {
      this.structure.footerRows[index] = {
        ...this.structure.footerRows[index],
        ...updates
      };
    }
    return this;
  }

  /**
   * Duplicates a footer row
   */
  duplicateFooterRow(index: number): this {
    if (index >= 0 && index < this.structure.footerRows.length) {
      const rowCopy = { ...this.structure.footerRows[index] };
      this.structure.footerRows.splice(index + 1, 0, rowCopy);
    }
    return this;
  }
}

/**
 * Converts table structure to HTML representation
 */
export class InvoiceTableHTMLRenderer {
  private dataObject: Record<string, any>;
  private currencySymbols = { USD: '$', EUR: '€', none: '' };

  constructor(dataObject: Record<string, any>) {
    this.dataObject = dataObject;
  }

  /**
   * Extracts nested values from data object
   */
  private extractValue(path: string): any {
    const segments = path.split('.');
    let current = this.dataObject;
    
    for (const segment of segments) {
      if (current && typeof current === 'object') {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Formats a value based on display format
   */
  private formatDisplayValue(value: any, format: string, currency: string): string {
    if (value === null || value === undefined) return '';

    if (format === 'money') {
      const numValue = Number(value) || 0;
      const symbol = this.currencySymbols[currency as keyof typeof this.currencySymbols] || '';
      return currency === 'none' ? numValue.toFixed(2) : `${symbol}${numValue.toFixed(2)}`;
    }

    if (format === 'percentage') {
      const numValue = Number(value) || 0;
      return `${(numValue * 100).toFixed(2)}%`;
    }

    return String(value);
  }

  /**
   * Renders a complete HTML table from structure
   */
  renderHTMLTable(structure: PriceTableStructure): string {
    const { mainRows, footerRows, currencyCode } = structure;
    
    let htmlParts: string[] = [];
    htmlParts.push('<table class="invoice-price-table" style="width:100%;border-collapse:collapse;">');
    
    // Render main rows
    if (mainRows.length > 0) {
      htmlParts.push('<tbody>');
      for (const row of mainRows) {
        htmlParts.push(this.renderRow(row, currencyCode));
      }
      htmlParts.push('</tbody>');
    }
    
    // Render footer rows if present
    if (footerRows.length > 0) {
      htmlParts.push('<tfoot>');
      for (const row of footerRows) {
        htmlParts.push(this.renderRow(row, currencyCode, true));
      }
      htmlParts.push('</tfoot>');
    }
    
    htmlParts.push('</table>');
    return htmlParts.join('\n');
  }

  /**
   * Renders a single table row
   */
  private renderRow(spec: TableRowSpec, currency: string, isFooter = false): string {
    const value = this.extractValue(spec.valueBinding);
    const formattedValue = this.formatDisplayValue(value, spec.displayFormat || 'plain', currency);
    
    const styleAttrs = this.buildStyleAttributes(spec.customStyle || {});
    const rowClass = isFooter ? 'footer-row' : 'main-row';
    
    return `<tr class="${rowClass}">` +
           `<th style="text-align:left;padding:8px;border:1px solid #ddd;${styleAttrs}">${spec.labelText}</th>` +
           `<td style="text-align:right;padding:8px;border:1px solid #ddd;${styleAttrs}">${formattedValue}</td>` +
           `</tr>`;
  }

  /**
   * Builds CSS style string from style config
   */
  private buildStyleAttributes(style: RowStyleConfig): string {
    const parts: string[] = [];
    
    if (style.textAlign) parts.push(`text-align:${style.textAlign}`);
    if (style.fontWeight) parts.push(`font-weight:${style.fontWeight}`);
    if (style.fontStyle) parts.push(`font-style:${style.fontStyle}`);
    if (style.textDecoration) parts.push(`text-decoration:${style.textDecoration}`);
    
    return parts.join(';');
  }

  /**
   * Renders only the tbody portion (for dynamic updates)
   */
  renderBodyRows(rows: TableRowSpec[], currency: string): string {
    return rows.map(row => this.renderRow(row, currency, false)).join('\n');
  }

  /**
   * Renders only the tfoot portion (for dynamic updates)
   */
  renderFooterRows(rows: TableRowSpec[], currency: string): string {
    return rows.map(row => this.renderRow(row, currency, true)).join('\n');
  }
}

/**
 * Helper to create common invoice footer rows
 */
export const InvoiceFooterPresets = {
  subtotal: (binding = 'subtotal'): TableRowSpec => ({
    labelText: 'Subtotal',
    valueBinding: binding,
    displayFormat: 'money'
  }),
  
  tax: (binding = 'tax', percentage?: number): TableRowSpec => ({
    labelText: percentage ? `Tax (${percentage}%)` : 'Tax',
    valueBinding: binding,
    displayFormat: 'money'
  }),
  
  shipping: (binding = 'shipping'): TableRowSpec => ({
    labelText: 'Shipping',
    valueBinding: binding,
    displayFormat: 'money'
  }),
  
  discount: (binding = 'discount'): TableRowSpec => ({
    labelText: 'Discount',
    valueBinding: binding,
    displayFormat: 'money'
  }),
  
  grandTotal: (binding = 'total'): TableRowSpec => ({
    labelText: 'Grand Total',
    valueBinding: binding,
    displayFormat: 'money',
    customStyle: { fontWeight: 'bold' }
  }),

  custom: (label: string, binding: string, format: 'money' | 'plain' | 'percentage' = 'plain'): TableRowSpec => ({
    labelText: label,
    valueBinding: binding,
    displayFormat: format
  })
};

/**
 * Quick builder for standard invoice summary tables
 */
export function buildStandardInvoiceSummary(
  dataBindings: {
    subtotal?: string;
    tax?: string;
    shipping?: string;
    discount?: string;
    total?: string;
  },
  currencyCode: 'USD' | 'EUR' | 'none' = 'USD'
): PriceTableStructure {
  const builder = new InvoiceTableStructureBuilder(currencyCode);
  
  if (dataBindings.subtotal) {
    builder.addFooterRow(InvoiceFooterPresets.subtotal(dataBindings.subtotal));
  }
  
  if (dataBindings.tax) {
    builder.addFooterRow(InvoiceFooterPresets.tax(dataBindings.tax));
  }
  
  if (dataBindings.shipping) {
    builder.addFooterRow(InvoiceFooterPresets.shipping(dataBindings.shipping));
  }
  
  if (dataBindings.discount) {
    builder.addFooterRow(InvoiceFooterPresets.discount(dataBindings.discount));
  }
  
  if (dataBindings.total) {
    builder.addFooterRow(InvoiceFooterPresets.grandTotal(dataBindings.total));
  }
  
  return builder.getStructure();
}
