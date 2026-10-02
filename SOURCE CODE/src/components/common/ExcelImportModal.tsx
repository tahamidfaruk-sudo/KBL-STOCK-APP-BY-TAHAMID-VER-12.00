import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { useApp } from '../../context/AppContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const {
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    kgPerBagOptions,
    addStockTransaction,
    showSuccessDialog,
    addToast,
  } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportLogs([`Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`]);
    }
  };

  // Download beautifully styled Excel template with corporate header, zebra striping, footer totals & reference codes
  const downloadSampleTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Kishan Botanix Ltd.';
      workbook.lastModifiedBy = 'KBL Inventory System';
      workbook.created = new Date();

      // ==========================================
      // SHEET 1: BULK DATA ENTRY TEMPLATE
      // ==========================================
      const worksheet = workbook.addWorksheet('Bulk_Stock_Entry', {
        views: [{ showGridLines: true }],
      });

      // Define columns
      const columns = [
        { header: 'Date (YYYY-MM-DD)', key: 'date', width: 22, isNum: false },
        { header: 'KBL Challan No', key: 'kblChallanNo', width: 20, isNum: false },
        { header: 'SR No', key: 'srNo', width: 16, isNum: false },
        { header: 'Cold Storage Code', key: 'coldStorageCode', width: 22, isNum: false },
        { header: 'Potato Variety', key: 'variety', width: 20, isNum: false },
        { header: 'Seed Class', key: 'class', width: 24, isNum: false },
        { header: 'Grade', key: 'grade', width: 24, isNum: false },
        { header: 'Sack Quantity', key: 'sackQuantity', width: 18, isNum: true },
        { header: 'KG Per Bag', key: 'kgPerBag', width: 16, isNum: true },
        { header: 'Truck No', key: 'truckNo', width: 24, isNum: false },
        { header: 'Grower / Farmer Name', key: 'growerFarmerName', width: 28, isNum: false },
      ];

      worksheet.columns = columns.map((c) => ({
        key: c.key,
        width: c.width,
      }));

      // --- ROW 1: CORPORATE BANNER (MERGED A1:K1) ---
      worksheet.mergeCells('A1:K1');
      const bannerRow = worksheet.getRow(1);
      bannerRow.height = 34;
      const bannerCell = worksheet.getCell('A1');
      bannerCell.value = 'KISHAN BOTANIX LIMITED • SEED POTATO INVENTORY SYSTEM';
      bannerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }, // Dark Navy
      };
      bannerCell.font = {
        name: 'Segoe UI',
        size: 13,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      bannerCell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      // --- ROW 2: SUBTITLE INSTRUCTIONS (MERGED A2:K2) ---
      worksheet.mergeCells('A2:K2');
      const subRow = worksheet.getRow(2);
      subRow.height = 22;
      const subCell = worksheet.getCell('A2');
      subCell.value =
        'OFFICIAL BULK STOCK INGESTION TEMPLATE • FILL REQUIRED COLUMNS (SEE REFERENCE SHEET FOR CODES) & UPLOAD';
      subCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate 800
      };
      subCell.font = {
        name: 'Segoe UI',
        size: 9.5,
        bold: true,
        italic: true,
        color: { argb: 'FF38BDF8' }, // Sky 400
      };
      subCell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      // --- ROW 3: SPACER ROW ---
      worksheet.getRow(3).height = 10;

      // --- ROW 4: TABLE HEADERS ---
      const headerRow = worksheet.getRow(4);
      headerRow.height = 28;
      columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F172A' }, // Deep Dark Navy
        };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: col.isNum ? 'right' : 'left',
          indent: 1,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF64748B' } },
          bottom: { style: 'medium', color: { argb: 'FF38BDF8' } },
          left: { style: 'thin', color: { argb: 'FF475569' } },
          right: { style: 'thin', color: { argb: 'FF475569' } },
        };
      });

      // --- ROWS 5 TO 10: REALISTIC SAMPLE DATA WITH ZEBRA STRIPING ---
      const sampleData = [
        {
          date: '2024-03-20',
          kblChallanNo: 'KBL-2024-080',
          srNo: 'SR-1001',
          coldStorageCode: coldStorages[0]?.code || 'CS-01',
          variety: varieties[0]?.name || 'ASTERIX',
          class: seedClasses[0]?.name || 'FOUNDATION (FS)',
          grade: grades[0]?.name || 'GRADE A (28-40 MM)',
          sackQuantity: 600,
          kgPerBag: 50,
          truckNo: 'DHAKA-METRO-TA-14-3841',
          growerFarmerName: 'Apex Contract Farming Zone',
        },
        {
          date: '2024-03-20',
          kblChallanNo: 'KBL-2024-080',
          srNo: 'SR-1002',
          coldStorageCode: coldStorages[0]?.code || 'CS-01',
          variety: varieties[1]?.name || 'DIAMANT',
          class: seedClasses[1]?.name || 'CERTIFIED (CS)',
          grade: grades[1]?.name || 'GRADE B (40-55 MM)',
          sackQuantity: 450,
          kgPerBag: 50,
          truckNo: 'DHAKA-METRO-TA-14-3841',
          growerFarmerName: 'Apex Contract Farming Zone',
        },
        {
          date: '2024-03-22',
          kblChallanNo: 'KBL-2024-081',
          srNo: 'SR-1003',
          coldStorageCode: coldStorages[1]?.code || 'CS-02',
          variety: varieties[2]?.name || 'GRANOLA',
          class: seedClasses[0]?.name || 'FOUNDATION (FS)',
          grade: grades[0]?.name || 'GRADE A (28-40 MM)',
          sackQuantity: 800,
          kgPerBag: 50,
          truckNo: 'DINAJPUR-TA-11-2091',
          growerFarmerName: 'Pran Agro Seed Growers',
        },
        {
          date: '2024-03-22',
          kblChallanNo: 'KBL-2024-081',
          srNo: 'SR-1004',
          coldStorageCode: coldStorages[1]?.code || 'CS-02',
          variety: varieties[3]?.name || 'SUN-SHINE',
          class: seedClasses[2]?.name || 'PRE-FOUNDATION (PF)',
          grade: grades[2]?.name || 'OVER SIZE (>55 MM)',
          sackQuantity: 300,
          kgPerBag: 50,
          truckNo: 'DINAJPUR-TA-11-2091',
          growerFarmerName: 'Pran Agro Seed Growers',
        },
        {
          date: '2024-03-24',
          kblChallanNo: 'KBL-2024-082',
          srNo: 'SR-1005',
          coldStorageCode: coldStorages[0]?.code || 'CS-01',
          variety: varieties[4]?.name || 'LADY ROSETTA',
          class: seedClasses[3]?.name || 'BREEDER SEED (BS)',
          grade: grades[0]?.name || 'GRADE A (28-40 MM)',
          sackQuantity: 500,
          kgPerBag: 50,
          truckNo: 'BOGRA-TA-12-8874',
          growerFarmerName: 'Northern Seed Farm Ltd.',
        },
        {
          date: '2024-03-25',
          kblChallanNo: 'KBL-2024-083',
          srNo: 'SR-1006',
          coldStorageCode: coldStorages[2]?.code || 'CS-03',
          variety: varieties[5]?.name || 'CARDINAL',
          class: seedClasses[4]?.name || 'TLS (TRUTH FULL LABELED)',
          grade: grades[1]?.name || 'GRADE B (40-55 MM)',
          sackQuantity: 750,
          kgPerBag: 50,
          truckNo: 'RANGPUR-TA-09-5412',
          growerFarmerName: 'Kishan Contract Growers',
        },
      ];

      sampleData.forEach((rowObj, index) => {
        const rowNum = 5 + index;
        const row = worksheet.getRow(rowNum);
        row.height = 22;
        const isZebra = index % 2 === 1;

        columns.forEach((col, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = (rowObj as any)[col.key];

          // Zebra background styling
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isZebra ? 'FFF8FAFC' : 'FFFFFFFF' }, // Soft slate zebra
          };

          cell.font = {
            name: 'Segoe UI',
            size: 9.5,
            bold: col.isNum,
            color: { argb: 'FF1E293B' },
          };

          cell.alignment = {
            vertical: 'middle',
            horizontal: col.isNum ? 'right' : 'left',
            indent: 1,
          };

          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });

      // --- ROW 11: SUMMARY FOOTER ROW WITH DOUBLE BORDER & SUM ---
      const footerRowNum = 5 + sampleData.length;
      worksheet.mergeCells(`A${footerRowNum}:G${footerRowNum}`);
      const footerRow = worksheet.getRow(footerRowNum);
      footerRow.height = 26;

      const footerLabelCell = worksheet.getCell(`A${footerRowNum}`);
      footerLabelCell.value = 'TOTAL BATCH QUANTITY SUMMARY';
      footerLabelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      footerLabelCell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      footerLabelCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        indent: 1,
      };

      // Sack Quantity Total Cell with SUM formula
      const sumCell = footerRow.getCell(8);
      sumCell.value = { formula: `SUM(H5:H${footerRowNum - 1})`, result: 3400 };
      sumCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      sumCell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      sumCell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
        indent: 1,
      };

      // KG per bag cell (blank in footer)
      const kgCell = footerRow.getCell(9);
      kgCell.value = '';
      kgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

      // Truck & Grower cells
      [10, 11].forEach((cIdx) => {
        const c = footerRow.getCell(cIdx);
        c.value = '';
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      });

      // Apply double bottom border to all footer cells
      for (let c = 1; c <= 11; c++) {
        const cell = footerRow.getCell(c);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } }, // Double accounting border
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }

      // ==========================================
      // SHEET 2: REFERENCE CODES SHEET
      // ==========================================
      const refSheet = workbook.addWorksheet('Reference_Codes', {
        views: [{ showGridLines: true }],
      });

      refSheet.columns = [
        { header: 'Category', key: 'category', width: 22 },
        { header: 'Code / Identifier', key: 'code', width: 20 },
        { header: 'System Name / Description', key: 'name', width: 36 },
      ];

      // Ref Banner
      refSheet.mergeCells('A1:C1');
      const rBanner = refSheet.getCell('A1');
      rBanner.value = 'KBL MASTER DATA REFERENCE TABLE • USE VALID CODES IN TEMPLATE';
      rBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      rBanner.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      rBanner.alignment = { vertical: 'middle', horizontal: 'center' };
      refSheet.getRow(1).height = 28;

      const rHead = refSheet.getRow(2);
      rHead.height = 24;
      ['CATEGORY', 'CODE / IDENTIFIER', 'SYSTEM NAME / DESCRIPTION'].forEach((h, i) => {
        const c = rHead.getCell(i + 1);
        c.value = h;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        c.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
        c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      });

      let rRow = 3;
      const addRefSection = (cat: string, items: { code: string; name: string }[]) => {
        items.forEach((item, idx) => {
          const row = refSheet.getRow(rRow);
          row.height = 20;
          const isZebra = idx % 2 === 1;
          const bg = isZebra ? 'FFF8FAFC' : 'FFFFFFFF';

          const c1 = row.getCell(1);
          c1.value = cat;
          c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          c1.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
          c1.alignment = { vertical: 'middle', indent: 1 };

          const c2 = row.getCell(2);
          c2.value = item.code;
          c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          c2.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0284C7' } };
          c2.alignment = { vertical: 'middle', indent: 1 };

          const c3 = row.getCell(3);
          c3.value = item.name;
          c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          c3.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF1E293B' } };
          c3.alignment = { vertical: 'middle', indent: 1 };

          [c1, c2, c3].forEach((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          });
          rRow++;
        });
      };

      addRefSection(
        'COLD STORAGE',
        coldStorages.map((c) => ({ code: c.code, name: c.name }))
      );
      addRefSection(
        'POTATO VARIETY',
        varieties.map((v) => ({ code: v.code || v.name, name: v.name }))
      );
      addRefSection(
        'SEED CLASS',
        seedClasses.map((c) => ({ code: c.code || c.name, name: c.name }))
      );
      addRefSection(
        'GRADE',
        grades.map((g) => ({ code: g.code || g.name, name: g.name }))
      );
      addRefSection(
        'KG PER BAG',
        kgPerBagOptions.map((k) => ({ code: `${k} KG`, name: `Standard ${k} KG Bag` }))
      );

      // Write and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'KBL_Bulk_Stock_Import_Template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      addToast('Corporate Bulk Excel template downloaded!', 'success');
    } catch (err: any) {
      console.error('Error generating template:', err);
      addToast('Failed to generate template', 'error');
    }
  };

  // Robust import parser that accommodates corporate header banners, standard headers, and footer rows
  const handleImport = async () => {
    if (!selectedFile) {
      addToast('Please select an Excel file to import', 'warning');
      return;
    }

    setIsProcessing(true);
    setImportLogs(['Starting spreadsheet parse...']);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to array of rows (2D array)
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rawRows || rawRows.length === 0) {
        setImportLogs((prev) => [...prev, 'Error: Excel file is empty or no valid rows found.']);
        setIsProcessing(false);
        return;
      }

      // Find the header row by searching for 'Challan' or 'SR No' or 'Variety'
      let headerRowIndex = -1;
      let headerMap: { [key: string]: number } = {};

      for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map((cell) => String(cell || '').toLowerCase().trim()).join(' ');

        if (rowStr.includes('challan') || (rowStr.includes('sr') && rowStr.includes('variety'))) {
          headerRowIndex = r;
          row.forEach((cellVal, colIdx) => {
            const clean = String(cellVal || '').toLowerCase().trim();
            if (clean.includes('date')) headerMap['date'] = colIdx;
            else if (clean.includes('challan')) headerMap['kblChallanNo'] = colIdx;
            else if (clean.includes('sr')) headerMap['srNo'] = colIdx;
            else if (clean.includes('cold') || clean.includes('storage')) headerMap['coldStorageCode'] = colIdx;
            else if (clean.includes('variety')) headerMap['variety'] = colIdx;
            else if (clean.includes('class')) headerMap['class'] = colIdx;
            else if (clean.includes('grade')) headerMap['grade'] = colIdx;
            else if (clean.includes('sack') || clean.includes('quantity') || clean.includes('bags'))
              headerMap['sackQuantity'] = colIdx;
            else if (clean.includes('kg per bag') || clean.includes('kg/bag')) headerMap['kgPerBag'] = colIdx;
            else if (clean.includes('truck')) headerMap['truckNo'] = colIdx;
            else if (clean.includes('grower') || clean.includes('farmer')) headerMap['growerFarmerName'] = colIdx;
          });
          break;
        }
      }

      if (headerRowIndex === -1) {
        // Fallback to standard object parsing if header row not identified
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
        if (jsonData.length === 0) {
          throw new Error('Could not identify table headers in the provided spreadsheet.');
        }
      }

      setImportLogs((prev) => [
        ...prev,
        `Headers identified at row ${headerRowIndex + 1}. Parsing data entries...`,
      ]);

      let importedCount = 0;
      let errorCount = 0;

      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        // Skip summary or footer rows
        const firstCell = String(row[0] || '').trim().toUpperCase();
        if (firstCell.startsWith('TOTAL') || firstCell.startsWith('SUMMARY')) {
          continue;
        }

        const dateVal = headerMap['date'] !== undefined ? row[headerMap['date']] : row[0];
        const challanVal = headerMap['kblChallanNo'] !== undefined ? row[headerMap['kblChallanNo']] : row[1];
        const srVal = headerMap['srNo'] !== undefined ? row[headerMap['srNo']] : row[2];
        const csVal = headerMap['coldStorageCode'] !== undefined ? row[headerMap['coldStorageCode']] : row[3];
        const varVal = headerMap['variety'] !== undefined ? row[headerMap['variety']] : row[4];
        const clsVal = headerMap['class'] !== undefined ? row[headerMap['class']] : row[5];
        const grdVal = headerMap['grade'] !== undefined ? row[headerMap['grade']] : row[6];
        const qtyVal = headerMap['sackQuantity'] !== undefined ? row[headerMap['sackQuantity']] : row[7];
        const kgVal = headerMap['kgPerBag'] !== undefined ? row[headerMap['kgPerBag']] : row[8];
        const truckVal = headerMap['truckNo'] !== undefined ? row[headerMap['truckNo']] : row[9];
        const growerVal = headerMap['growerFarmerName'] !== undefined ? row[headerMap['growerFarmerName']] : row[10];

        const kblChallanNo = String(challanVal || '').trim().toUpperCase();
        const srNo = String(srVal || '').trim().toUpperCase();
        const sackQty = Number(qtyVal || 0);

        if (!kblChallanNo || !srNo || sackQty <= 0) {
          errorCount++;
          continue;
        }

        const csCode = String(csVal || '').trim();
        const varName = String(varVal || '').trim();
        const className = String(clsVal || '').trim();
        const gradeName = String(grdVal || '').trim();
        const kgPerBag = Number(kgVal || 50);

        // Date normalization
        let formattedDate = new Date().toISOString().split('T')[0];
        if (dateVal) {
          if (typeof dateVal === 'number') {
            // Excel serial date number
            const d = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
          } else {
            const parsed = new Date(String(dateVal));
            if (!isNaN(parsed.getTime())) formattedDate = parsed.toISOString().split('T')[0];
          }
        }

        // Match cold storage
        const matchedCs =
          coldStorages.find(
            (c) =>
              c.code.toLowerCase() === csCode.toLowerCase() ||
              c.name.toLowerCase().includes(csCode.toLowerCase()) ||
              csCode.toLowerCase().includes(c.code.toLowerCase())
          ) || coldStorages[0];

        // Match variety
        const matchedVar =
          varieties.find(
            (v) =>
              v.name.toLowerCase() === varName.toLowerCase() ||
              (v.code && v.code.toLowerCase() === varName.toLowerCase()) ||
              varName.toLowerCase().includes(v.name.toLowerCase())
          ) || varieties[0];

        // Match class
        const matchedCls =
          seedClasses.find(
            (c) =>
              c.name.toLowerCase().includes(className.toLowerCase()) ||
              (c.code && c.code.toLowerCase() === className.toLowerCase())
          ) || seedClasses[0];

        // Match grade
        const matchedGrd =
          grades.find(
            (g) =>
              g.name.toLowerCase().includes(gradeName.toLowerCase()) ||
              (g.code && g.code.toLowerCase() === gradeName.toLowerCase())
          ) || grades[0];

        const totalKg = sackQty * kgPerBag;
        const totalMt = Number((totalKg / 1000).toFixed(3));

        const result = addStockTransaction({
          date: formattedDate,
          kblChallanNo,
          srNo,
          coldStorageId: matchedCs?.id || 'CS-01',
          varietyId: matchedVar?.id || 'var-1',
          classId: matchedCls?.id || 'cls-1',
          gradeId: matchedGrd?.id || 'grd-1',
          productionBlockId: productionBlocks[0]?.id || 'blk-1',
          sackQuantity: sackQty,
          kgPerBag,
          totalKg,
          totalMt,
          truckNo: String(truckVal || '').trim().toUpperCase(),
          growerFarmerName: String(growerVal || '').trim(),
          status: 'approved',
        });

        if (result.success) {
          importedCount++;
        } else {
          errorCount++;
        }
      }

      setImportLogs([
        '✓ Processing Complete!',
        `✓ Successfully imported: ${importedCount} stock transactions.`,
        errorCount > 0 ? `⚠ Skipped invalid/empty rows: ${errorCount}.` : '✓ All rows parsed cleanly.',
      ]);

      showSuccessDialog(
        'BULK DATA IMPORT COMPLETED',
        `Successfully imported ${importedCount.toLocaleString()} stock transactions into the live database.`
      );
      addToast(`Imported ${importedCount} stock transactions successfully!`, 'success');
      setSelectedFile(null);
    } catch (err: any) {
      setImportLogs((prev) => [...prev, `Import failed: ${err.message || String(err)}`]);
      addToast('Failed to parse Excel file', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                BULK DATA INGESTION & EXCEL IMPORT
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                Import Hundreds of Multi-SR Stock In Transactions in One Click
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Download Corporate Excel Template Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/80 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-sky-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>OFFICIAL BULK IMPORT TEMPLATE (.XLSX)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Pre-formatted with corporate title banner, dark navy headers, zebra striping, formula footer totals, and Master Reference Sheet.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-300 dark:border-emerald-700 shadow-xs transition-all cursor-pointer shrink-0 uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD TEMPLATE</span>
              </button>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl inline-block shadow-xs border border-slate-200 dark:border-slate-700 mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">
              {selectedFile ? selectedFile.name : 'CLICK TO SELECT OR DRAG EXCEL FILE HERE'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              Supports .xlsx, .xls and .csv formats
            </p>
          </div>

          {/* Import Processing Logs */}
          {importLogs.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              {importLogs.map((log, i) => (
                <div key={i} className="text-slate-700 dark:text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer uppercase"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'IMPORTING...' : 'START BULK INGESTION'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
