import * as XLSX from 'xlsx';
import type { Project, BudgetLine, CashflowMonthly, Agency, FinancialYear, DonorCode } from './types';
import { calculateCashflowTotals, MONTH_LABELS } from './types';

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// Column widths for better readability
const COL_WIDTHS = {
  narrow: 10,
  medium: 15,
  wide: 25,
  extraWide: 40,
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

// Create header style for the workbook
function createHeaderRow(ws: XLSX.WorkSheet, row: number, headers: string[], startCol = 0) {
  headers.forEach((header, idx) => {
    const cell = XLSX.utils.encode_cell({ r: row, c: startCol + idx });
    ws[cell] = { v: header, t: 's' };
  });
}

// Export a single project to Excel
export function exportProjectToExcel(
  data: ProjectExportData,
  options: ExportOptions
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Project Details Sheet
  const detailsData = [
    ['DNPM Budget & Cashflow Submission'],
    [],
    ['Project Details'],
    [],
    ['Project Title:', data.project.projectTitle],
    ['Project Code:', data.project.projectCode || 'N/A'],
    ['Agency:', data.agency.agencyName],
    ['Agency Code:', data.agency.agencyCode || 'N/A'],
    ['Financial Year:', `FY ${data.financialYear.year}`],
    ['Expenditure Vote No.:', data.project.expenditureVoteNo || 'N/A'],
    ['Division:', data.project.division || 'N/A'],
    ['Main Program:', data.project.mainProgram || 'N/A'],
    ['Program:', data.project.program || 'N/A'],
    ['Project Manager:', data.project.managerName || 'N/A'],
    [],
    ['Objective:'],
    [data.project.objective || 'N/A'],
    [],
    ['Status:', data.project.status.replace(/_/g, ' ').toUpperCase()],
    ['Created:', formatDate(data.project.createdAt)],
    ['Last Updated:', formatDate(data.project.updatedAt)],
  ];

  const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
  wsDetails['!cols'] = [{ wch: COL_WIDTHS.medium }, { wch: COL_WIDTHS.extraWide }];
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Project Details');

  // Budget Lines Sheet
  if (options.includeOptions.budgetLines) {
    const budgetData: (string | number)[][] = [
      ['Budget Lines'],
      [],
      ['Item No.', 'Description', 'Donor Code', 'Donor Name', 'Original Budget (PGK)', 'Revised Budget (PGK)', 'Notes'],
    ];

    let totalOriginal = 0;
    let totalRevised = 0;

    data.budgetLines.forEach(line => {
      const donor = data.donorCodes.find(d => d.id === line.donorCodeId);
      totalOriginal += line.originalBudget;
      totalRevised += line.revisedBudget;

      budgetData.push([
        line.itemNo,
        line.descriptionOfItem,
        donor?.code ?? '',
        donor?.donorName ?? '',
        line.originalBudget,
        line.revisedBudget,
        line.notes || '',
      ]);
    });

    budgetData.push([]);
    budgetData.push(['', '', '', 'TOTAL:', totalOriginal, totalRevised, '']);

    const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
    wsBudget['!cols'] = [
      { wch: COL_WIDTHS.narrow },
      { wch: COL_WIDTHS.extraWide },
      { wch: COL_WIDTHS.narrow },
      { wch: COL_WIDTHS.wide },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.wide },
    ];
    XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget Lines');
  }

  // Cashflow Sheet
  if (options.includeOptions.cashflow) {
    const cashflowHeaders = [
      'Item No.',
      'Description',
      ...MONTH_LABELS,
      ...(options.includeOptions.quarterlyTotals ? ['Q1', 'Q2', 'Q3', 'Q4'] : []),
      'Annual Total',
      'Revised Budget',
      'Variance',
    ];

    const cashflowData: (string | number)[][] = [
      ['Monthly Cashflow Projections'],
      [],
      cashflowHeaders,
    ];

    const monthlyTotals = {
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
    };
    let grandAnnualTotal = 0;
    let grandRevisedBudget = 0;

    data.budgetLines.forEach(line => {
      const cf = data.cashflows[line.id];
      if (!cf) return;

      const cfTotals = calculateCashflowTotals(cf);
      const variance = cfTotals.annualTotal - line.revisedBudget;

      // Update monthly totals
      Object.keys(monthlyTotals).forEach(month => {
        monthlyTotals[month as keyof typeof monthlyTotals] += cf[month as keyof typeof cf] as number;
      });
      grandAnnualTotal += cfTotals.annualTotal;
      grandRevisedBudget += line.revisedBudget;

      const row: (string | number)[] = [
        line.itemNo,
        line.descriptionOfItem,
        cf.jan, cf.feb, cf.mar, cf.apr, cf.may, cf.jun,
        cf.jul, cf.aug, cf.sep, cf.oct, cf.nov, cf.dec,
      ];

      if (options.includeOptions.quarterlyTotals) {
        row.push(cfTotals.q1, cfTotals.q2, cfTotals.q3, cfTotals.q4);
      }

      row.push(cfTotals.annualTotal, line.revisedBudget, variance);
      cashflowData.push(row);
    });

    // Add totals row
    cashflowData.push([]);
    const totalsRow: (string | number)[] = [
      '', 'TOTAL',
      monthlyTotals.jan, monthlyTotals.feb, monthlyTotals.mar,
      monthlyTotals.apr, monthlyTotals.may, monthlyTotals.jun,
      monthlyTotals.jul, monthlyTotals.aug, monthlyTotals.sep,
      monthlyTotals.oct, monthlyTotals.nov, monthlyTotals.dec,
    ];

    if (options.includeOptions.quarterlyTotals) {
      const q1 = monthlyTotals.jan + monthlyTotals.feb + monthlyTotals.mar;
      const q2 = monthlyTotals.apr + monthlyTotals.may + monthlyTotals.jun;
      const q3 = monthlyTotals.jul + monthlyTotals.aug + monthlyTotals.sep;
      const q4 = monthlyTotals.oct + monthlyTotals.nov + monthlyTotals.dec;
      totalsRow.push(q1, q2, q3, q4);
    }

    totalsRow.push(grandAnnualTotal, grandRevisedBudget, grandAnnualTotal - grandRevisedBudget);
    cashflowData.push(totalsRow);

    const wsCashflow = XLSX.utils.aoa_to_sheet(cashflowData);
    wsCashflow['!cols'] = [
      { wch: COL_WIDTHS.narrow },
      { wch: COL_WIDTHS.wide },
      ...Array(12).fill({ wch: COL_WIDTHS.narrow }),
      ...(options.includeOptions.quarterlyTotals ? Array(4).fill({ wch: COL_WIDTHS.narrow }) : []),
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
    ];
    XLSX.utils.book_append_sheet(wb, wsCashflow, 'Cashflow');
  }

  // Donor Summary Sheet
  if (options.includeOptions.donorSummary) {
    const donorHeaders = [
      'Donor Code',
      'Donor Name',
      'Original Budget (PGK)',
      'Revised Budget (PGK)',
      ...(options.includeOptions.quarterlyTotals ? ['Q1', 'Q2', 'Q3', 'Q4'] : []),
      'Annual Cashflow (PGK)',
    ];

    const donorData: (string | number)[][] = [
      ['Donor Summary'],
      [],
      donorHeaders,
    ];

    // Aggregate by donor
    const donorAggregates: Record<string, {
      donor: DonorCode;
      originalBudget: number;
      revisedBudget: number;
      q1: number; q2: number; q3: number; q4: number;
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
          q1: 0, q2: 0, q3: 0, q4: 0,
          annualTotal: 0,
        };
      }

      donorAggregates[donor.id].originalBudget += line.originalBudget;
      donorAggregates[donor.id].revisedBudget += line.revisedBudget;

      const cf = data.cashflows[line.id];
      if (cf) {
        const cfTotals = calculateCashflowTotals(cf);
        donorAggregates[donor.id].q1 += cfTotals.q1;
        donorAggregates[donor.id].q2 += cfTotals.q2;
        donorAggregates[donor.id].q3 += cfTotals.q3;
        donorAggregates[donor.id].q4 += cfTotals.q4;
        donorAggregates[donor.id].annualTotal += cfTotals.annualTotal;
      }
    });

    let grandOriginal = 0;
    let grandRevised = 0;
    let grandQ1 = 0, grandQ2 = 0, grandQ3 = 0, grandQ4 = 0;
    let grandAnnual = 0;

    Object.values(donorAggregates)
      .sort((a, b) => a.donor.code - b.donor.code)
      .forEach(agg => {
        grandOriginal += agg.originalBudget;
        grandRevised += agg.revisedBudget;
        grandQ1 += agg.q1;
        grandQ2 += agg.q2;
        grandQ3 += agg.q3;
        grandQ4 += agg.q4;
        grandAnnual += agg.annualTotal;

        const row: (string | number)[] = [
          agg.donor.code,
          agg.donor.donorName,
          agg.originalBudget,
          agg.revisedBudget,
        ];

        if (options.includeOptions.quarterlyTotals) {
          row.push(agg.q1, agg.q2, agg.q3, agg.q4);
        }

        row.push(agg.annualTotal);
        donorData.push(row);
      });

    // Grand total row
    donorData.push([]);
    const grandRow: (string | number)[] = ['', 'GRAND TOTAL', grandOriginal, grandRevised];
    if (options.includeOptions.quarterlyTotals) {
      grandRow.push(grandQ1, grandQ2, grandQ3, grandQ4);
    }
    grandRow.push(grandAnnual);
    donorData.push(grandRow);

    const wsDonor = XLSX.utils.aoa_to_sheet(donorData);
    wsDonor['!cols'] = [
      { wch: COL_WIDTHS.narrow },
      { wch: COL_WIDTHS.wide },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
      ...(options.includeOptions.quarterlyTotals ? Array(4).fill({ wch: COL_WIDTHS.medium }) : []),
      { wch: COL_WIDTHS.medium },
    ];
    XLSX.utils.book_append_sheet(wb, wsDonor, 'Donor Summary');
  }

  return wb;
}

// Export multiple projects (agency or national)
export function exportMultipleProjectsToExcel(
  projects: ProjectExportData[],
  title: string,
  options: ExportOptions
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData: (string | number)[][] = [
    ['DNPM Budget & Cashflow Report'],
    [title],
    [`Generated: ${formatDate(new Date())}`],
    [],
    ['Summary'],
    [],
    ['Total Projects:', projects.length],
  ];

  // Calculate totals
  let totalOriginalBudget = 0;
  let totalRevisedBudget = 0;
  let totalAnnualCashflow = 0;

  projects.forEach(p => {
    p.budgetLines.forEach(bl => {
      totalOriginalBudget += bl.originalBudget;
      totalRevisedBudget += bl.revisedBudget;

      const cf = p.cashflows[bl.id];
      if (cf) {
        const cfTotals = calculateCashflowTotals(cf);
        totalAnnualCashflow += cfTotals.annualTotal;
      }
    });
  });

  summaryData.push(['Total Original Budget (PGK):', totalOriginalBudget]);
  summaryData.push(['Total Revised Budget (PGK):', totalRevisedBudget]);
  summaryData.push(['Total Annual Cashflow (PGK):', totalAnnualCashflow]);
  summaryData.push([]);
  summaryData.push(['Projects List']);
  summaryData.push([]);
  summaryData.push(['Project Title', 'Agency', 'Status', 'Original Budget', 'Revised Budget']);

  projects.forEach(p => {
    const projectTotal = p.budgetLines.reduce((sum, bl) => sum + bl.revisedBudget, 0);
    const originalTotal = p.budgetLines.reduce((sum, bl) => sum + bl.originalBudget, 0);
    summaryData.push([
      p.project.projectTitle,
      p.agency.agencyCode || p.agency.agencyName,
      p.project.status.replace(/_/g, ' '),
      originalTotal,
      projectTotal,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: COL_WIDTHS.extraWide },
    { wch: COL_WIDTHS.medium },
    { wch: COL_WIDTHS.medium },
    { wch: COL_WIDTHS.medium },
    { wch: COL_WIDTHS.medium },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Consolidated Budget Lines
  if (options.includeOptions.budgetLines) {
    const budgetData: (string | number)[][] = [
      ['Consolidated Budget Lines'],
      [],
      ['Agency', 'Project', 'Item No.', 'Description', 'Donor', 'Original Budget', 'Revised Budget'],
    ];

    projects.forEach(p => {
      p.budgetLines.forEach(line => {
        const donor = p.donorCodes.find(d => d.id === line.donorCodeId);
        budgetData.push([
          p.agency.agencyCode || '',
          p.project.projectTitle,
          line.itemNo,
          line.descriptionOfItem,
          donor?.donorName || '',
          line.originalBudget,
          line.revisedBudget,
        ]);
      });
    });

    const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
    wsBudget['!cols'] = [
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.wide },
      { wch: COL_WIDTHS.narrow },
      { wch: COL_WIDTHS.wide },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
    ];
    XLSX.utils.book_append_sheet(wb, wsBudget, 'All Budget Lines');
  }

  // Consolidated Cashflow
  if (options.includeOptions.cashflow) {
    const cashflowHeaders = [
      'Agency', 'Project', 'Item',
      ...MONTH_LABELS,
      'Annual Total',
    ];

    const cashflowData: (string | number)[][] = [
      ['Consolidated Monthly Cashflow'],
      [],
      cashflowHeaders,
    ];

    projects.forEach(p => {
      p.budgetLines.forEach(line => {
        const cf = p.cashflows[line.id];
        if (!cf) return;

        const cfTotals = calculateCashflowTotals(cf);
        cashflowData.push([
          p.agency.agencyCode || '',
          p.project.projectTitle,
          line.itemNo,
          cf.jan, cf.feb, cf.mar, cf.apr, cf.may, cf.jun,
          cf.jul, cf.aug, cf.sep, cf.oct, cf.nov, cf.dec,
          cfTotals.annualTotal,
        ]);
      });
    });

    const wsCashflow = XLSX.utils.aoa_to_sheet(cashflowData);
    wsCashflow['!cols'] = [
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.wide },
      { wch: COL_WIDTHS.narrow },
      ...Array(12).fill({ wch: COL_WIDTHS.narrow }),
      { wch: COL_WIDTHS.medium },
    ];
    XLSX.utils.book_append_sheet(wb, wsCashflow, 'All Cashflows');
  }

  // National Donor Summary
  if (options.includeOptions.donorSummary) {
    const donorAggregates: Record<string, {
      donor: DonorCode;
      originalBudget: number;
      revisedBudget: number;
      annualTotal: number;
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
            annualTotal: 0,
          };
        }

        donorAggregates[donor.id].originalBudget += line.originalBudget;
        donorAggregates[donor.id].revisedBudget += line.revisedBudget;

        const cf = p.cashflows[line.id];
        if (cf) {
          const cfTotals = calculateCashflowTotals(cf);
          donorAggregates[donor.id].annualTotal += cfTotals.annualTotal;
        }
      });
    });

    const donorData: (string | number)[][] = [
      ['National Donor Summary'],
      [],
      ['Code', 'Donor Name', 'Original Budget (PGK)', 'Revised Budget (PGK)', 'Annual Cashflow (PGK)', '% of Total'],
    ];

    const grandTotal = Object.values(donorAggregates).reduce((sum, d) => sum + d.revisedBudget, 0);

    Object.values(donorAggregates)
      .sort((a, b) => a.donor.code - b.donor.code)
      .forEach(agg => {
        const percentage = grandTotal > 0 ? (agg.revisedBudget / grandTotal) * 100 : 0;
        donorData.push([
          agg.donor.code,
          agg.donor.donorName,
          agg.originalBudget,
          agg.revisedBudget,
          agg.annualTotal,
          `${percentage.toFixed(1)}%`,
        ]);
      });

    const wsDonor = XLSX.utils.aoa_to_sheet(donorData);
    wsDonor['!cols'] = [
      { wch: COL_WIDTHS.narrow },
      { wch: COL_WIDTHS.wide },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.medium },
      { wch: COL_WIDTHS.narrow },
    ];
    XLSX.utils.book_append_sheet(wb, wsDonor, 'Donor Summary');
  }

  // Agency Summary (for national reports)
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

  const agencyData: (string | number)[][] = [
    ['Agency Summary'],
    [],
    ['Agency Code', 'Agency Name', 'Projects', 'Original Budget (PGK)', 'Revised Budget (PGK)'],
  ];

  Object.values(agencyAggregates)
    .sort((a, b) => (a.agency.agencyCode || '').localeCompare(b.agency.agencyCode || ''))
    .forEach(agg => {
      agencyData.push([
        agg.agency.agencyCode || '',
        agg.agency.agencyName,
        agg.projectCount,
        agg.originalBudget,
        agg.revisedBudget,
      ]);
    });

  const wsAgency = XLSX.utils.aoa_to_sheet(agencyData);
  wsAgency['!cols'] = [
    { wch: COL_WIDTHS.medium },
    { wch: COL_WIDTHS.extraWide },
    { wch: COL_WIDTHS.narrow },
    { wch: COL_WIDTHS.medium },
    { wch: COL_WIDTHS.medium },
  ];
  XLSX.utils.book_append_sheet(wb, wsAgency, 'By Agency');

  return wb;
}

// Download the workbook as an Excel file
export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate filename based on export parameters
export function generateFilename(
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
