import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ProcurementPlan,
  ProcurementPlanItem,
} from './types';
import {
  getAgencyById,
  getFinancialYearById,
  getFundSourceById,
  getProcurementMethodById,
  getContractTypeById,
  getUnitOfMeasureById,
  getProvinceById,
  getProcurementPlanItemsByPlanId,
} from './database';
import {
  PROCUREMENT_PLAN_STATUS_LABELS,
  LOCATION_SCOPE_LABELS,
} from './types';

// ===== EXCEL EXPORT =====

export function exportProcurementPlanToExcel(plan: ProcurementPlan) {
  const wb = XLSX.utils.book_new();
  const items = getProcurementPlanItemsByPlanId(plan.id);
  const agency = getAgencyById(plan.agencyId);
  const financialYear = getFinancialYearById(plan.financialYearId);
  const fundSource = getFundSourceById(plan.fundSourceId);

  // Header Sheet
  const headerData = [
    ['ANNUAL PROCUREMENT PLAN'],
    [''],
    ['Agency:', agency?.agencyName || ''],
    ['Agency Code:', agency?.agencyCode || ''],
    ['Budget Code:', plan.agencyBudgetCode || ''],
    ['Financial Year:', `FY${financialYear?.year || ''}`],
    ['Fund Source:', fundSource?.name || ''],
    ['Period:', `${new Date(plan.periodStart).toLocaleDateString()} to ${new Date(plan.periodEnd).toLocaleDateString()}`],
    ['Status:', PROCUREMENT_PLAN_STATUS_LABELS[plan.status]],
    ['Total Estimated Value:', `K ${plan.totalEstimatedValue.toLocaleString()}`],
    ['Total Items:', plan.itemCount.toString()],
    [''],
    ['Generated:', new Date().toLocaleString()],
  ];

  const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.book_append_sheet(wb, headerSheet, 'Summary');

  // Items Sheet
  const itemsHeader = [
    'Seq #',
    'Activity/Procurement Title',
    'Description',
    'UNSPSC Code',
    'UNSPSC Description',
    'Procurement Method',
    'Contract Type',
    'Quantity',
    'Unit',
    'Unit Cost (K)',
    'Total Cost (K)',
    'Annual Budget (K)',
    'Q1 Budget (K)',
    'Q2 Budget (K)',
    'Q3 Budget (K)',
    'Q4 Budget (K)',
    'Contract Start',
    'Contract End',
    'Duration (Months)',
    'Location Scope',
    'Province',
    'Multi-Year',
    'Third Party Mgmt',
    'Comments',
    'Risk Notes',
  ];

  const itemsData = items.map(item => {
    const method = getProcurementMethodById(item.procurementMethodId);
    const contractType = getContractTypeById(item.contractTypeId);
    const uom = item.unitOfMeasureId ? getUnitOfMeasureById(item.unitOfMeasureId) : null;
    const province = item.provinceId ? getProvinceById(item.provinceId) : null;

    return [
      item.sequenceNo,
      item.activityOrProcurementTitle,
      item.descriptionOfItem,
      item.unspscCode || '',
      item.unspscDescription || '',
      method?.name || '',
      contractType?.name || '',
      item.quantity,
      uom?.abbreviation || '',
      item.estimatedUnitCost,
      item.estimatedTotalCost,
      item.annualBudgetYearValue,
      item.q1Budget,
      item.q2Budget,
      item.q3Budget,
      item.q4Budget,
      new Date(item.estimatedContractStart).toLocaleDateString(),
      new Date(item.estimatedContractEnd).toLocaleDateString(),
      item.anticipatedDurationMonths,
      LOCATION_SCOPE_LABELS[item.locationScope] || item.locationScope,
      province?.name || '',
      item.multiYearFlag ? 'Yes' : 'No',
      item.thirdPartyContractMgmtRequired ? 'Yes' : 'No',
      item.comments || '',
      item.riskNotes || '',
    ];
  });

  const itemsSheet = XLSX.utils.aoa_to_sheet([itemsHeader, ...itemsData]);

  // Set column widths
  itemsSheet['!cols'] = [
    { wch: 6 },   // Seq
    { wch: 35 },  // Title
    { wch: 40 },  // Description
    { wch: 12 },  // UNSPSC Code
    { wch: 25 },  // UNSPSC Desc
    { wch: 25 },  // Method
    { wch: 20 },  // Contract Type
    { wch: 10 },  // Qty
    { wch: 8 },   // Unit
    { wch: 15 },  // Unit Cost
    { wch: 15 },  // Total Cost
    { wch: 15 },  // Annual
    { wch: 12 },  // Q1
    { wch: 12 },  // Q2
    { wch: 12 },  // Q3
    { wch: 12 },  // Q4
    { wch: 12 },  // Start
    { wch: 12 },  // End
    { wch: 10 },  // Duration
    { wch: 15 },  // Location
    { wch: 20 },  // Province
    { wch: 10 },  // Multi-Year
    { wch: 12 },  // Third Party
    { wch: 30 },  // Comments
    { wch: 30 },  // Risk
  ];

  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Procurement Items');

  // Quarterly Summary Sheet
  const q1Total = items.reduce((sum, i) => sum + i.q1Budget, 0);
  const q2Total = items.reduce((sum, i) => sum + i.q2Budget, 0);
  const q3Total = items.reduce((sum, i) => sum + i.q3Budget, 0);
  const q4Total = items.reduce((sum, i) => sum + i.q4Budget, 0);
  const totalBudget = q1Total + q2Total + q3Total + q4Total;

  const quarterlyData = [
    ['QUARTERLY BUDGET SUMMARY'],
    [''],
    ['Quarter', 'Budget (K)', 'Percentage'],
    ['Q1 (Jan-Mar)', q1Total, totalBudget > 0 ? `${((q1Total / totalBudget) * 100).toFixed(1)}%` : '0%'],
    ['Q2 (Apr-Jun)', q2Total, totalBudget > 0 ? `${((q2Total / totalBudget) * 100).toFixed(1)}%` : '0%'],
    ['Q3 (Jul-Sep)', q3Total, totalBudget > 0 ? `${((q3Total / totalBudget) * 100).toFixed(1)}%` : '0%'],
    ['Q4 (Oct-Dec)', q4Total, totalBudget > 0 ? `${((q4Total / totalBudget) * 100).toFixed(1)}%` : '0%'],
    ['Total', totalBudget, '100%'],
  ];

  const quarterlySheet = XLSX.utils.aoa_to_sheet(quarterlyData);
  XLSX.utils.book_append_sheet(wb, quarterlySheet, 'Quarterly Summary');

  // Download
  const filename = `${agency?.agencyCode || 'Agency'}_APP_FY${financialYear?.year || ''}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ===== NATIONAL CONSOLIDATION EXCEL EXPORT =====

export function exportNationalProcurementToExcel(
  plans: ProcurementPlan[],
  items: ProcurementPlanItem[],
  financialYearId: string
) {
  const wb = XLSX.utils.book_new();
  const financialYear = getFinancialYearById(financialYearId);

  // National Summary Sheet
  const totalValue = plans.reduce((sum, p) => sum + p.totalEstimatedValue, 0);
  const totalItems = plans.reduce((sum, p) => sum + p.itemCount, 0);

  const summaryData = [
    ['NATIONAL PROCUREMENT CONSOLIDATION'],
    [''],
    ['Financial Year:', `FY${financialYear?.year || ''}`],
    ['Total Agencies:', new Set(plans.map(p => p.agencyId)).size.toString()],
    ['Total Plans:', plans.length.toString()],
    ['Total Items:', totalItems.toString()],
    ['Total Estimated Value:', `K ${totalValue.toLocaleString()}`],
    [''],
    ['Generated:', new Date().toLocaleString()],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'National Summary');

  // Agency Breakdown Sheet
  const agencyHeader = ['Agency', 'Agency Code', 'Plans', 'Items', 'Total Value (K)', '% of National'];
  const agencyData: (string | number)[][] = [];

  const agencyMap = new Map<string, { plans: number; items: number; value: number }>();
  plans.forEach(p => {
    const existing = agencyMap.get(p.agencyId) || { plans: 0, items: 0, value: 0 };
    existing.plans++;
    existing.value += p.totalEstimatedValue;
    agencyMap.set(p.agencyId, existing);
  });

  items.forEach(item => {
    const plan = plans.find(p => p.id === item.procurementPlanId);
    if (plan) {
      const existing = agencyMap.get(plan.agencyId);
      if (existing) {
        existing.items++;
      }
    }
  });

  agencyMap.forEach((data, agencyId) => {
    const agency = getAgencyById(agencyId);
    agencyData.push([
      agency?.agencyName || '',
      agency?.agencyCode || '',
      data.plans,
      data.items,
      data.value,
      totalValue > 0 ? `${((data.value / totalValue) * 100).toFixed(1)}%` : '0%',
    ]);
  });

  const agencySheet = XLSX.utils.aoa_to_sheet([agencyHeader, ...agencyData.sort((a, b) => (b[4] as number) - (a[4] as number))]);
  XLSX.utils.book_append_sheet(wb, agencySheet, 'By Agency');

  // Quarterly Pipeline Sheet
  const q1Total = items.reduce((sum, i) => sum + i.q1Budget, 0);
  const q2Total = items.reduce((sum, i) => sum + i.q2Budget, 0);
  const q3Total = items.reduce((sum, i) => sum + i.q3Budget, 0);
  const q4Total = items.reduce((sum, i) => sum + i.q4Budget, 0);

  const quarterlyData = [
    ['NATIONAL QUARTERLY PIPELINE'],
    [''],
    ['Quarter', 'Budget (K)', 'Items', 'Percentage'],
    ['Q1 (Jan-Mar)', q1Total, items.filter(i => i.q1Budget > 0).length, totalValue > 0 ? `${((q1Total / totalValue) * 100).toFixed(1)}%` : '0%'],
    ['Q2 (Apr-Jun)', q2Total, items.filter(i => i.q2Budget > 0).length, totalValue > 0 ? `${((q2Total / totalValue) * 100).toFixed(1)}%` : '0%'],
    ['Q3 (Jul-Sep)', q3Total, items.filter(i => i.q3Budget > 0).length, totalValue > 0 ? `${((q3Total / totalValue) * 100).toFixed(1)}%` : '0%'],
    ['Q4 (Oct-Dec)', q4Total, items.filter(i => i.q4Budget > 0).length, totalValue > 0 ? `${((q4Total / totalValue) * 100).toFixed(1)}%` : '0%'],
    ['Total', q1Total + q2Total + q3Total + q4Total, items.length, '100%'],
  ];

  const quarterlySheet = XLSX.utils.aoa_to_sheet(quarterlyData);
  XLSX.utils.book_append_sheet(wb, quarterlySheet, 'Quarterly Pipeline');

  // Download
  const filename = `National_APP_Consolidation_FY${financialYear?.year || ''}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ===== PDF EXPORT =====

export function exportProcurementPlanToPDF(plan: ProcurementPlan) {
  const doc = new jsPDF('landscape');
  const items = getProcurementPlanItemsByPlanId(plan.id);
  const agency = getAgencyById(plan.agencyId);
  const financialYear = getFinancialYearById(plan.financialYearId);
  const fundSource = getFundSourceById(plan.fundSourceId);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ANNUAL PROCUREMENT PLAN', 14, 20);

  // Header info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Agency: ${agency?.agencyName || ''}`, 14, 30);
  doc.text(`Financial Year: FY${financialYear?.year || ''}`, 14, 36);
  doc.text(`Fund Source: ${fundSource?.name || ''}`, 14, 42);
  doc.text(`Status: ${PROCUREMENT_PLAN_STATUS_LABELS[plan.status]}`, 150, 30);
  doc.text(`Total Value: K ${plan.totalEstimatedValue.toLocaleString()}`, 150, 36);
  doc.text(`Total Items: ${plan.itemCount}`, 150, 42);

  // Items table
  const tableData = items.map(item => {
    const method = getProcurementMethodById(item.procurementMethodId);
    const contractType = getContractTypeById(item.contractTypeId);

    return [
      item.sequenceNo.toString(),
      item.activityOrProcurementTitle.substring(0, 40),
      method?.code || '',
      contractType?.code || '',
      `K ${item.annualBudgetYearValue.toLocaleString()}`,
      `K ${item.q1Budget.toLocaleString()}`,
      `K ${item.q2Budget.toLocaleString()}`,
      `K ${item.q3Budget.toLocaleString()}`,
      `K ${item.q4Budget.toLocaleString()}`,
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Activity/Procurement', 'Method', 'Type', 'Annual', 'Q1', 'Q2', 'Q3', 'Q4']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 25, halign: 'right' },
    },
  });

  // Totals row
  const q1Total = items.reduce((sum, i) => sum + i.q1Budget, 0);
  const q2Total = items.reduce((sum, i) => sum + i.q2Budget, 0);
  const q3Total = items.reduce((sum, i) => sum + i.q3Budget, 0);
  const q4Total = items.reduce((sum, i) => sum + i.q4Budget, 0);
  const totalBudget = q1Total + q2Total + q3Total + q4Total;

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: K ${totalBudget.toLocaleString()}`, 14, finalY);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

  // Download
  const filename = `${agency?.agencyCode || 'Agency'}_APP_FY${financialYear?.year || ''}.pdf`;
  doc.save(filename);
}

// ===== IMPORT TEMPLATE =====

export function downloadProcurementImportTemplate() {
  const wb = XLSX.utils.book_new();

  const templateHeader = [
    'Activity/Procurement Title*',
    'Description*',
    'UNSPSC Code',
    'Procurement Method Code*',
    'Contract Type Code*',
    'Quantity*',
    'Unit of Measure Code',
    'Estimated Unit Cost (K)*',
    'Contract Start Date (YYYY-MM-DD)*',
    'Contract End Date (YYYY-MM-DD)*',
    'Q1 Budget (K)',
    'Q2 Budget (K)',
    'Q3 Budget (K)',
    'Q4 Budget (K)',
    'Location Scope (national/provincial/district/specific_sites)*',
    'Province Code',
    'Multi-Year (Yes/No)',
    'Multi-Year Total Budget (K)',
    'Third Party Management (Yes/No)',
    'Comments',
    'Risk Notes',
  ];

  const sampleData = [
    [
      'IT Equipment Procurement',
      'Purchase of computers and peripherals for regional offices',
      '43211507',
      'NCB',
      'SUP',
      50,
      'EA',
      25000,
      '2026-03-01',
      '2026-06-30',
      0,
      625000,
      625000,
      0,
      'national',
      '',
      'No',
      '',
      'No',
      'Priority procurement for Q2',
      '',
    ],
  ];

  const templateSheet = XLSX.utils.aoa_to_sheet([templateHeader, ...sampleData]);

  // Set column widths
  templateSheet['!cols'] = [
    { wch: 35 },  // Title
    { wch: 45 },  // Description
    { wch: 12 },  // UNSPSC
    { wch: 15 },  // Method
    { wch: 15 },  // Contract Type
    { wch: 10 },  // Qty
    { wch: 12 },  // UoM
    { wch: 18 },  // Unit Cost
    { wch: 18 },  // Start
    { wch: 18 },  // End
    { wch: 12 },  // Q1
    { wch: 12 },  // Q2
    { wch: 12 },  // Q3
    { wch: 12 },  // Q4
    { wch: 25 },  // Location
    { wch: 12 },  // Province
    { wch: 12 },  // Multi-Year
    { wch: 18 },  // MY Budget
    { wch: 18 },  // Third Party
    { wch: 30 },  // Comments
    { wch: 30 },  // Risk
  ];

  XLSX.utils.book_append_sheet(wb, templateSheet, 'Import Template');

  // Reference Sheets
  const methodsData = [
    ['Code', 'Name', 'Description'],
    ['RFQ', 'Request for Quotation', 'For low-value purchases below K50,000'],
    ['RFT', 'Request for Tender', 'Open competitive tender'],
    ['RFP', 'Request for Proposal', 'For consulting services'],
    ['ICB', 'International Competitive Bidding', 'High-value international procurement'],
    ['NCB', 'National Competitive Bidding', 'National-level competitive procurement'],
    ['RT', 'Restricted Tender', 'Limited to pre-qualified suppliers'],
    ['DP', 'Direct Procurement', 'Single source with justification'],
    ['SH', 'Shopping', 'Price comparison from multiple suppliers'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(methodsData), 'Procurement Methods');

  const contractTypesData = [
    ['Code', 'Name', 'Category'],
    ['SUP', 'Supply Contract', 'Goods'],
    ['WRK', 'Works Contract', 'Works'],
    ['SVC', 'Service Contract', 'Services'],
    ['CON', 'Consulting Contract', 'Consulting'],
    ['FWK', 'Framework Agreement', 'Services'],
    ['PNL', 'Panel Contract', 'Services'],
    ['TRK', 'Turnkey Contract', 'Works'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contractTypesData), 'Contract Types');

  const uomData = [
    ['Code', 'Name'],
    ['EA', 'Each'],
    ['SET', 'Set'],
    ['LOT', 'Lot'],
    ['PKG', 'Package'],
    ['KG', 'Kilogram'],
    ['TON', 'Metric Ton'],
    ['M', 'Meter'],
    ['KM', 'Kilometer'],
    ['SQM', 'Square Meter'],
    ['L', 'Liter'],
    ['HR', 'Hour'],
    ['DAY', 'Day'],
    ['MTH', 'Month'],
    ['LS', 'Lump Sum'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(uomData), 'Units of Measure');

  XLSX.writeFile(wb, 'Procurement_Import_Template.xlsx');
}
