'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, BudgetLine, CashflowMonthly, Agency, FinancialYear, DonorCode } from './types';
import { calculateCashflowTotals, MONTH_LABELS } from './types';

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PG', {
    style: 'currency',
    currency: 'PGK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to format date
const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

interface ExportOptions {
  includeOptions: {
    budgetLines: boolean;
    cashflow: boolean;
    donorSummary: boolean;
    quarterlyTotals: boolean;
  };
}

interface ProjectExportData {
  project: Project;
  agency: Agency;
  financialYear: FinancialYear;
  budgetLines: BudgetLine[];
  cashflows: Record<string, CashflowMonthly>;
  donorCodes: DonorCode[];
}

// Colors
const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // emerald-500
  dark: [30, 41, 59] as [number, number, number], // slate-800
  light: [241, 245, 249] as [number, number, number], // slate-100
  white: [255, 255, 255] as [number, number, number],
};

// Add header to PDF
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DNPM Budget & Cashflow System', 14, 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 14, 26);
  }

  // Date on right
  doc.setFontSize(8);
  doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 14, 12, { align: 'right' });

  return 35; // Return Y position after header
}

// Add footer to PDF
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Page ${pageNumber} - Papua New Guinea Department of National Planning & Monitoring`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
}

// Add section title
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 8, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 16, y + 5.5);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  return y + 12;
}

// Export a single project to PDF
export function exportProjectToPDF(
  data: ProjectExportData,
  options: ExportOptions
): jsPDF {
  const doc = new jsPDF();
  let pageNumber = 1;

  // Page 1: Project Details
  let y = addHeader(doc, data.project.projectTitle, `${data.agency.agencyCode} - FY ${data.financialYear.year}`);

  y = addSectionTitle(doc, 'Project Details', y);

  // Project info table
  const projectInfo = [
    ['Project Title', data.project.projectTitle],
    ['Project Code', data.project.projectCode || 'N/A'],
    ['Agency', data.agency.agencyName],
    ['Agency Code', data.agency.agencyCode || 'N/A'],
    ['Financial Year', `FY ${data.financialYear.year}`],
    ['Expenditure Vote No.', data.project.expenditureVoteNo || 'N/A'],
    ['Division', data.project.division || 'N/A'],
    ['Main Program', data.project.mainProgram || 'N/A'],
    ['Program', data.project.program || 'N/A'],
    ['Project Manager', data.project.managerName || 'N/A'],
    ['Status', data.project.status.replace(/_/g, ' ').toUpperCase()],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: projectInfo,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
    styles: { fontSize: 9, cellPadding: 2 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Objective
  if (data.project.objective) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Objective:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const lines = doc.splitTextToSize(data.project.objective, 180);
    doc.text(lines, 14, y + 5);
    y += 5 + lines.length * 4;
  }

  addFooter(doc, pageNumber);

  // Budget Lines
  if (options.includeOptions.budgetLines && data.budgetLines.length > 0) {
    doc.addPage();
    pageNumber++;
    y = addHeader(doc, 'Budget Lines', data.project.projectTitle);
    y = addSectionTitle(doc, 'Budget Lines', y);

    const budgetData = data.budgetLines.map(line => {
      const donor = data.donorCodes.find(d => d.id === line.donorCodeId);
      return [
        line.itemNo,
        line.descriptionOfItem.substring(0, 40) + (line.descriptionOfItem.length > 40 ? '...' : ''),
        `${donor?.code || ''} - ${donor?.donorName || ''}`,
        formatCurrency(line.originalBudget),
        formatCurrency(line.revisedBudget),
      ];
    });

    // Add totals
    const totalOriginal = data.budgetLines.reduce((sum, bl) => sum + bl.originalBudget, 0);
    const totalRevised = data.budgetLines.reduce((sum, bl) => sum + bl.revisedBudget, 0);
    budgetData.push(['', 'TOTAL', '', formatCurrency(totalOriginal), formatCurrency(totalRevised)]);

    autoTable(doc, {
      startY: y,
      head: [['Item No.', 'Description', 'Donor', 'Original Budget', 'Revised Budget']],
      body: budgetData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.dark, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    addFooter(doc, pageNumber);
  }

  // Cashflow
  if (options.includeOptions.cashflow && data.budgetLines.length > 0) {
    doc.addPage();
    pageNumber++;
    y = addHeader(doc, 'Monthly Cashflow', data.project.projectTitle);
    y = addSectionTitle(doc, 'Monthly Cashflow Projections (PGK)', y);

    const cashflowData = data.budgetLines.map(line => {
      const cf = data.cashflows[line.id];
      if (!cf) return null;

      const cfTotals = calculateCashflowTotals(cf);
      return [
        line.itemNo,
        (cf.jan / 1000).toFixed(0),
        (cf.feb / 1000).toFixed(0),
        (cf.mar / 1000).toFixed(0),
        (cf.apr / 1000).toFixed(0),
        (cf.may / 1000).toFixed(0),
        (cf.jun / 1000).toFixed(0),
        (cf.jul / 1000).toFixed(0),
        (cf.aug / 1000).toFixed(0),
        (cf.sep / 1000).toFixed(0),
        (cf.oct / 1000).toFixed(0),
        (cf.nov / 1000).toFixed(0),
        (cf.dec / 1000).toFixed(0),
        (cfTotals.annualTotal / 1000).toFixed(0),
      ];
    }).filter(Boolean);

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']],
      body: cashflowData as string[][],
      theme: 'striped',
      headStyles: { fillColor: COLORS.dark, fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 1, halign: 'right' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 15 },
      },
    });

    // Note about values
    y = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('* All values in thousands (K)', 14, y);

    addFooter(doc, pageNumber);
  }

  // Donor Summary
  if (options.includeOptions.donorSummary && data.budgetLines.length > 0) {
    doc.addPage();
    pageNumber++;
    y = addHeader(doc, 'Donor Summary', data.project.projectTitle);
    y = addSectionTitle(doc, 'Budget Summary by Donor/Funding Source', y);

    // Aggregate by donor
    const donorAggregates: Record<string, {
      donor: DonorCode;
      originalBudget: number;
      revisedBudget: number;
      annualTotal: number;
    }> = {};

    data.budgetLines.forEach(line => {
      const donor = data.donorCodes.find(d => d.id === line.donorCodeId);
      if (!donor) return;

      if (!donorAggregates[donor.id]) {
        donorAggregates[donor.id] = {
          donor,
          originalBudget: 0,
          revisedBudget: 0,
          annualTotal: 0,
        };
      }

      donorAggregates[donor.id].originalBudget += line.originalBudget;
      donorAggregates[donor.id].revisedBudget += line.revisedBudget;

      const cf = data.cashflows[line.id];
      if (cf) {
        const cfTotals = calculateCashflowTotals(cf);
        donorAggregates[donor.id].annualTotal += cfTotals.annualTotal;
      }
    });

    const donorData = Object.values(donorAggregates)
      .sort((a, b) => a.donor.code - b.donor.code)
      .map(agg => [
        agg.donor.code.toString(),
        agg.donor.donorName,
        formatCurrency(agg.originalBudget),
        formatCurrency(agg.revisedBudget),
        formatCurrency(agg.annualTotal),
      ]);

    // Grand totals
    const grandOriginal = Object.values(donorAggregates).reduce((sum, d) => sum + d.originalBudget, 0);
    const grandRevised = Object.values(donorAggregates).reduce((sum, d) => sum + d.revisedBudget, 0);
    const grandAnnual = Object.values(donorAggregates).reduce((sum, d) => sum + d.annualTotal, 0);
    donorData.push(['', 'GRAND TOTAL', formatCurrency(grandOriginal), formatCurrency(grandRevised), formatCurrency(grandAnnual)]);

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Donor Name', 'Original Budget', 'Revised Budget', 'Annual Cashflow']],
      body: donorData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.dark, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
    });

    addFooter(doc, pageNumber);
  }

  return doc;
}

// Export multiple projects (agency or national) to PDF
export function exportMultipleProjectsToPDF(
  projects: ProjectExportData[],
  title: string,
  options: ExportOptions
): jsPDF {
  const doc = new jsPDF();
  let pageNumber = 1;

  // Summary Page
  let y = addHeader(doc, title, `Generated: ${formatDate(new Date())}`);

  y = addSectionTitle(doc, 'Executive Summary', y);

  // Calculate totals
  let totalOriginal = 0;
  let totalRevised = 0;
  let totalCashflow = 0;

  projects.forEach(p => {
    p.budgetLines.forEach(bl => {
      totalOriginal += bl.originalBudget;
      totalRevised += bl.revisedBudget;

      const cf = p.cashflows[bl.id];
      if (cf) {
        const cfTotals = calculateCashflowTotals(cf);
        totalCashflow += cfTotals.annualTotal;
      }
    });
  });

  const summaryInfo = [
    ['Total Projects', projects.length.toString()],
    ['Total Agencies', new Set(projects.map(p => p.agency.id)).size.toString()],
    ['Total Original Budget', formatCurrency(totalOriginal)],
    ['Total Revised Budget', formatCurrency(totalRevised)],
    ['Total Annual Cashflow', formatCurrency(totalCashflow)],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: summaryInfo,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 60 },
    },
    styles: { fontSize: 11, cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Projects List
  y = addSectionTitle(doc, 'Projects Overview', y);

  const projectsData = projects.map(p => {
    const projectTotal = p.budgetLines.reduce((sum, bl) => sum + bl.revisedBudget, 0);
    return [
      p.agency.agencyCode || '',
      p.project.projectTitle.substring(0, 35) + (p.project.projectTitle.length > 35 ? '...' : ''),
      p.project.status.replace(/_/g, ' '),
      formatCurrency(projectTotal),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Agency', 'Project Title', 'Status', 'Revised Budget']],
    body: projectsData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.dark, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 80 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  addFooter(doc, pageNumber);

  // Donor Summary Page
  if (options.includeOptions.donorSummary) {
    doc.addPage();
    pageNumber++;
    y = addHeader(doc, 'Donor Summary', title);
    y = addSectionTitle(doc, 'Budget by Funding Source', y);

    const donorAggregates: Record<string, {
      donor: DonorCode;
      originalBudget: number;
      revisedBudget: number;
    }> = {};

    projects.forEach(p => {
      p.budgetLines.forEach(line => {
        const donor = p.donorCodes.find(d => d.id === line.donorCodeId);
        if (!donor) return;

        if (!donorAggregates[donor.id]) {
          donorAggregates[donor.id] = {
            donor,
            originalBudget: 0,
            revisedBudget: 0,
          };
        }

        donorAggregates[donor.id].originalBudget += line.originalBudget;
        donorAggregates[donor.id].revisedBudget += line.revisedBudget;
      });
    });

    const donorData = Object.values(donorAggregates)
      .sort((a, b) => a.donor.code - b.donor.code)
      .map(agg => {
        const percentage = totalRevised > 0 ? (agg.revisedBudget / totalRevised) * 100 : 0;
        return [
          agg.donor.code.toString(),
          agg.donor.donorName,
          formatCurrency(agg.originalBudget),
          formatCurrency(agg.revisedBudget),
          `${percentage.toFixed(1)}%`,
        ];
      });

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Donor Name', 'Original Budget', 'Revised Budget', '% of Total']],
      body: donorData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.dark, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    addFooter(doc, pageNumber);
  }

  // Agency Summary Page
  doc.addPage();
  pageNumber++;
  y = addHeader(doc, 'Agency Summary', title);
  y = addSectionTitle(doc, 'Budget by Agency', y);

  const agencyAggregates: Record<string, {
    agency: Agency;
    projectCount: number;
    originalBudget: number;
    revisedBudget: number;
  }> = {};

  projects.forEach(p => {
    if (!agencyAggregates[p.agency.id]) {
      agencyAggregates[p.agency.id] = {
        agency: p.agency,
        projectCount: 0,
        originalBudget: 0,
        revisedBudget: 0,
      };
    }

    agencyAggregates[p.agency.id].projectCount++;
    p.budgetLines.forEach(bl => {
      agencyAggregates[p.agency.id].originalBudget += bl.originalBudget;
      agencyAggregates[p.agency.id].revisedBudget += bl.revisedBudget;
    });
  });

  const agencyData = Object.values(agencyAggregates)
    .sort((a, b) => b.revisedBudget - a.revisedBudget)
    .map(agg => [
      agg.agency.agencyCode || '',
      agg.agency.agencyName.substring(0, 40) + (agg.agency.agencyName.length > 40 ? '...' : ''),
      agg.projectCount.toString(),
      formatCurrency(agg.originalBudget),
      formatCurrency(agg.revisedBudget),
    ]);

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Agency Name', 'Projects', 'Original Budget', 'Revised Budget']],
    body: agencyData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.dark, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2 },
  });

  addFooter(doc, pageNumber);

  return doc;
}

// Download the PDF
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}

// Generate filename for PDF
export function generatePDFFilename(
  scope: 'project' | 'agency' | 'national',
  year: number,
  agencyCode?: string,
  projectCode?: string
): string {
  const date = new Date().toISOString().split('T')[0];

  switch (scope) {
    case 'project':
      return `DNPM_Budget_${projectCode || 'Project'}_FY${year}_${date}`;
    case 'agency':
      return `DNPM_Budget_${agencyCode || 'Agency'}_FY${year}_${date}`;
    case 'national':
      return `DNPM_National_Budget_FY${year}_${date}`;
    default:
      return `DNPM_Budget_Export_${date}`;
  }
}
