import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from '../types';
import { formatDisplayDateTime } from './dateUtils';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  isNumeric?: boolean;
}

export function validateAndTriggerPrint(options?: any) {
  try {
    window.focus();
    window.print();
  } catch (err) {
    console.error('Print trigger error:', err);
  }
}

/**
 * Publication-Grade Executive Excel Export via ExcelJS
 * Produces ready-to-print .xlsx workbook with corporate branding header,
 * Banani registered legal address from settings, dark navy headers,
 * subtle zebra alternating rows, crisp cell borders, right-aligned tabular
 * numbers with comma separators, bold accounting total rows, and A4 print setup.
 */
export async function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  fileName: string,
  sheetTitle: string = 'Export',
  companySettings?: CompanySettings,
  subtitle?: string,
  options?: any
) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kishan Botanix Ltd.';
    workbook.lastModifiedBy = 'Seed Potato Management ERP';
    workbook.created = new Date();
    workbook.modified = new Date();

    const cleanSheetName = sheetTitle.replace(/[\\/?*[\]]/g, '').slice(0, 31) || 'Report';
    const worksheet = workbook.addWorksheet(cleanSheetName, {
      views: [{ showGridLines: true }],
      pageSetup: {
        paperSize: 9, // A4
        orientation: columns.length > 6 ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    const companyName = (companySettings?.companyName || 'KISHAN BOTANIX LTD.').toUpperCase();
    const legalAddress =
      companySettings?.legalAddress ||
      companySettings?.address ||
      'Corporate Head Office: House-12, Road-04, Block-F, Banani, Dhaka-1213, Bangladesh';
    const contactInfo = `Phone: ${companySettings?.phone || '+880 1711-234567'} | Email: ${
      companySettings?.email || 'info@kisanbotanix.com'
    }`;
    const fiscalYear = `Fiscal Year: ${companySettings?.fiscalYear || '2024-2025'}`;
    const reportTitle = `${sheetTitle.toUpperCase()}${subtitle ? ` - ${subtitle}` : ''} (${fiscalYear})`;
    const generatedDate = `Report Generated: ${formatDisplayDateTime(new Date().toISOString())}`;

    const numCols = Math.max(columns.length, 6);

    // Row 1: Company Legal Name
    const r1 = worksheet.addRow([companyName]);
    r1.height = 24;
    r1.getCell(1).font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF0F172A' } };
    r1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(1, 1, 1, numCols);

    // Row 2: Legal Registered Office Address
    const r2 = worksheet.addRow([legalAddress]);
    r2.height = 18;
    r2.getCell(1).font = { name: 'Segoe UI', size: 9.5, bold: false, color: { argb: 'FF334155' } };
    r2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(2, 1, 2, numCols);

    // Row 3: Official Contact
    const r3 = worksheet.addRow([contactInfo]);
    r3.height = 16;
    r3.getCell(1).font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF64748B' } };
    r3.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(3, 1, 3, numCols);

    // Row 4: Report Title & Fiscal Year
    const r4 = worksheet.addRow([reportTitle]);
    r4.height = 18;
    r4.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0284C7' } };
    r4.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(4, 1, 4, numCols);

    // Row 5: Generation Timestamp
    const r5 = worksheet.addRow([generatedDate]);
    r5.height = 15;
    r5.getCell(1).font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
    r5.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(5, 1, 5, numCols);

    // Row 6: Spacer
    const r6 = worksheet.addRow([]);
    r6.height = 10;

    // Row 7: Table Headers
    const headerValues = columns.map((col) => col.header.toUpperCase());
    const headerRow = worksheet.addRow(headerValues);
    headerRow.height = 26;

    headerRow.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }, // Deep Slate Navy
      };
      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // White bold
      };
      const isNumericCol = colDef?.isNumeric;
      cell.alignment = {
        vertical: 'middle',
        horizontal: isNumericCol ? 'right' : 'left',
        indent: 1,
        wrapText: false,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // Row 8+: Data Rows with Zebra striping & numeric formatting
    data.forEach((item, rowIndex) => {
      const rowValues = columns.map((col) => {
        const val = item[col.key];
        return val !== undefined && val !== null ? val : '';
      });

      const row = worksheet.addRow(rowValues);
      row.height = 21;

      const isTotalRow =
        item.isTotal ||
        rowValues.some((v) => String(v).toUpperCase() === 'TOTAL' || String(v).toUpperCase().includes('TOTAL'));

      const isOdd = rowIndex % 2 === 1;

      row.eachCell((cell, colNumber) => {
        const colDef = columns[colNumber - 1];
        const valStr = String(cell.value ?? '');
        const isTotalCell = isTotalRow && valStr.toUpperCase().includes('TOTAL');
        const isNumeric = colDef?.isNumeric || typeof cell.value === 'number';

        if (isTotalRow) {
          // Total Row Highlight: Slate-200 background, bold black text, accounting borders
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2E8F0' },
          };
          cell.font = {
            name: 'Segoe UI',
            size: 9.5,
            bold: true,
            color: { argb: 'FF0F172A' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF64748B' } },
            bottom: { style: 'double', color: { argb: 'FF0F172A' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: isNumeric ? 'right' : 'left',
            indent: 1,
          };

          if (colDef?.isNumeric && typeof cell.value === 'number') {
            cell.numFmt = Number.isInteger(cell.value) ? '#,##0' : '#,##0.000';
          }
        } else {
          // Normal Data Row with Zebra striping & clean borders
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isOdd ? 'FFF8FAFC' : 'FFFFFFFF' },
          };
          cell.font = {
            name: 'Segoe UI',
            size: 9,
            color: { argb: 'FF1E293B' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          // Column Alignments & Number formatting: all text left indent 1, all numeric right indent 1
          if (isNumeric) {
            cell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
            if (typeof cell.value === 'number') {
              cell.numFmt = Number.isInteger(cell.value) ? '#,##0' : '#,##0.000';
            }
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          }
        }
      });
    });

    // Auto-calculate column widths with generous padding
    worksheet.columns.forEach((column, index) => {
      const colDef = columns[index];
      let maxLen = colDef ? colDef.header.length : 10;
      data.forEach((item) => {
        if (colDef) {
          const val = item[colDef.key];
          if (val !== undefined && val !== null) {
            const str = String(val);
            if (str.length > maxLen) {
              maxLen = str.length;
            }
          }
        }
      });
      column.width = Math.min(Math.max(maxLen + 4, colDef?.width || 12), 48);
    });

    // Write to buffer and trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const safeName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export to Excel via ExcelJS:', error);
  }
}

/**
 * High-End Publication-Grade PDF Export
 * Configures executive layout, corporate branding, legal address from settings,
 * dark headers, zebra striping, centered/bold totals, pagination, and signatures.
 */
export function exportToPdf(
  data: any[],
  columns: ExportColumn[],
  fileName: string,
  title: string,
  companySettings?: CompanySettings,
  orientation: any = 'auto',
  subtitle?: string,
  extra?: any
) {
  try {
    // Smart orientation detection: default to landscape if > 6 columns
    let pageOrientation: 'portrait' | 'landscape' = 'portrait';
    if (orientation === 'l' || orientation === 'landscape') {
      pageOrientation = 'landscape';
    } else if (orientation === 'p' || orientation === 'portrait') {
      pageOrientation = 'portrait';
    } else {
      pageOrientation = columns.length > 6 ? 'landscape' : 'portrait';
    }

    const doc = new jsPDF({
      orientation: pageOrientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    const companyName = (companySettings?.companyName || 'KISHAN BOTANIX LTD.').toUpperCase();
    const legalAddress =
      companySettings?.legalAddress ||
      companySettings?.address ||
      'Corporate Head Office: House-12, Road-04, Block-F, Banani, Dhaka-1213, Bangladesh';
    const contactPhone = companySettings?.phone || '+880 1711-234567';
    const contactEmail = companySettings?.email || 'info@kisanbotanix.com';
    const fiscalYear = companySettings?.fiscalYear || '2024-2025';

    // 1. Company Name (Deep Navy/Slate, Bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(companyName, margin, 14);

    // 2. Legal Address from Settings
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(legalAddress, margin, 19);

    // 3. Official Contact line
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Phone: ${contactPhone} | Email: ${contactEmail}`, margin, 23);

    // 4. Right side: Report Title & Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text(title.toUpperCase(), pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fiscal Year: ${fiscalYear}`, pageWidth - margin, 19, { align: 'right' });

    const printTimestamp = formatDisplayDateTime(new Date().toISOString());
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Printed: ${printTimestamp}`, pageWidth - margin, 23, { align: 'right' });

    // 5. Elegant thin accent separator line
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.5);
    doc.line(margin, 26, pageWidth - margin, 26);

    let startY = 30;

    // Optional Subtitle
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(subtitle, margin, startY);
      startY += 5;
    }

    // Optional KPI summary cards if provided
    const summaryItems = extra?.summaryItems;
    if (summaryItems && Array.isArray(summaryItems) && summaryItems.length > 0) {
      const cardWidth = Math.min((pageWidth - margin * 2 - (summaryItems.length - 1) * 3) / summaryItems.length, 50);
      const cardHeight = 12;

      summaryItems.slice(0, 5).forEach((item: any, idx: number) => {
        const x = margin + idx * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        // Blue left accent bar
        doc.setFillColor(2, 132, 199);
        doc.rect(x, startY, 1.5, cardHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(String(item.label || '').toUpperCase(), x + 3.5, startY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(String(item.value || ''), x + 3.5, startY + 9.5);
      });

      startY += cardHeight + 4;
    }

    const tableHeaders = columns.map((c) => c.header.toUpperCase());
    const tableData = data.map((item) =>
      columns.map((c) => (item[c.key] !== undefined && item[c.key] !== null ? String(item[c.key]) : ''))
    );

    // Column styles for alignments: all text left with indent 1, all numeric right with indent 1
    const columnStyles: Record<number, any> = {};
    columns.forEach((c, idx) => {
      if (c.isNumeric) {
        columnStyles[idx] = { halign: 'right', cellPadding: { right: 4, left: 2, top: 2, bottom: 2 } };
      } else {
        columnStyles[idx] = { halign: 'left', cellPadding: { left: 4, right: 2, top: 2, bottom: 2 } };
      }
    });

    const isCompact = columns.length > 9;

    autoTable(doc, {
      startY,
      margin: { left: margin, right: margin, bottom: 22 },
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      columnStyles,
      styles: {
        font: 'helvetica',
        fontSize: isCompact ? 7 : 7.5,
        cellPadding: isCompact ? 1.8 : 2.2,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [15, 23, 42], // deep slate-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: isCompact ? 7 : 7.8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // clean alternating zebra
      },
      didParseCell: (hookData) => {
        const colDef = columns[hookData.column.index];
        if (hookData.section === 'head') {
          hookData.cell.styles.halign = colDef?.isNumeric ? 'right' : 'left';
        }
        // Highlight TOTAL row with distinct background, bold text, and accounting alignment
        const rowRaw = hookData.row.raw as string[];
        if (rowRaw && Array.isArray(rowRaw)) {
          const isTotalRow =
            rowRaw.some((cellText) => String(cellText).toUpperCase().includes('TOTAL')) ||
            (hookData.row.index === hookData.table.body.length - 1 &&
              rowRaw.some((cellText) => String(cellText).toUpperCase() === 'TOTAL'));

          if (isTotalRow) {
            hookData.cell.styles.fillColor = [241, 245, 249]; // slate-100
            hookData.cell.styles.fontStyle = 'bold';
            hookData.cell.styles.textColor = [15, 23, 42]; // deep slate-900
            hookData.cell.styles.lineWidth = 0.3;
            hookData.cell.styles.lineColor = [148, 163, 184]; // slate-400
            hookData.cell.styles.halign = colDef?.isNumeric ? 'right' : 'left';
          }
        }
      },
    });

    // Post-table: Official Signatures & Page numbering
    const totalPages = (doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // On final page, render official 3-signature block if space permits
      if (i === totalPages) {
        const lastAutoTableY = (doc as any).lastAutoTable?.finalY || 0;
        if (lastAutoTableY + 22 < pageHeight - 14) {
          const sigY = pageHeight - 18;
          const colWidth = (pageWidth - margin * 2) / 3;

          // Prepared By
          doc.setDrawColor(148, 163, 184);
          doc.line(margin + 5, sigY, margin + colWidth - 10, sigY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);
          doc.text('PREPARED BY', margin + colWidth / 2 - 2.5, sigY + 3.5, { align: 'center' });

          // Store In-Charge
          doc.line(margin + colWidth + 5, sigY, margin + colWidth * 2 - 10, sigY);
          doc.text('STORE IN-CHARGE', margin + colWidth * 1.5 - 2.5, sigY + 3.5, { align: 'center' });

          // Authorized Signatory
          doc.line(margin + colWidth * 2 + 5, sigY, pageWidth - margin - 5, sigY);
          doc.text('AUTHORIZED SIGNATORY', margin + colWidth * 2.5, sigY + 3.5, { align: 'center' });
        }
      }

      // Page Footer (every page)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `System Generated Official Record • ${companyName}`,
        margin,
        pageHeight - 6
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: 'right' }
      );
    }

    const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    doc.save(safeName);
  } catch (error) {
    console.error('Failed to export to PDF:', error);
  }
}
