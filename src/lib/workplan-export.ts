import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Workplan, WorkplanActivity } from './types';
import { getAgencyById, getFinancialYearById, getActivitiesByWorkplanId } from './database';
import { WORKPLAN_STATUS_LABELS, ACTIVITY_STATUS_LABELS } from './types';

// Format currency for display
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PG', {
    style: 'currency',
    currency: 'PGK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date for display
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-PG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Export a single workplan to Excel
 */
export function exportWorkplanToExcel(workplan: Workplan): void {
  const agency = getAgencyById(workplan.agencyId);
  const financialYear = getFinancialYearById(workplan.financialYearId);
  const activities = getActivitiesByWorkplanId(workplan.id);

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Workplan Summary
  const summaryData = [
    ['WORKPLAN SUMMARY'],
    [''],
    ['Title', workplan.title],
    ['Agency', agency?.agencyName || 'Unknown'],
    ['Agency Code', agency?.agencyCode || 'N/A'],
    ['Financial Year', `FY${financialYear?.year || 'N/A'}`],
    ['Status', WORKPLAN_STATUS_LABELS[workplan.status]],
    ['Total Budget', formatCurrency(workplan.totalBudget)],
    ['Total Activities', activities.length.toString()],
    [''],
    ['Description', workplan.description || 'N/A'],
    [''],
    ['Created At', formatDate(workplan.createdAt)],
    ['Updated At', formatDate(workplan.updatedAt)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Activities
  const activitiesHeader = [
    'Code',
    'Activity Name',
    'Responsible Unit',
    'Officer',
    'Start Date',
    'End Date',
    'Status',
    'Progress %',
    'Q1 Target',
    'Q1 Actual',
    'Q2 Target',
    'Q2 Actual',
    'Q3 Target',
    'Q3 Actual',
    'Q4 Target',
    'Q4 Actual',
    'Total Budget',
    'KPI',
    'Expected Output',
  ];

  const activitiesData = activities.map(act => [
    act.activityCode,
    act.activityName,
    act.responsibleUnit,
    act.responsibleOfficer || '',
    formatDate(act.startDate),
    formatDate(act.endDate),
    ACTIVITY_STATUS_LABELS[act.status],
    act.progressPercent,
    act.q1Target,
    act.q1Actual,
    act.q2Target,
    act.q2Actual,
    act.q3Target,
    act.q3Actual,
    act.q4Target,
    act.q4Actual,
    act.totalBudget,
    act.keyPerformanceIndicator,
    act.expectedOutput,
  ]);

  const activitiesSheet = XLSX.utils.aoa_to_sheet([activitiesHeader, ...activitiesData]);
  activitiesSheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 30 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Activities');

  // Sheet 3: Budget by Quarter
  const budgetHeader = ['Activity Code', 'Activity Name', 'Q1 Budget', 'Q2 Budget', 'Q3 Budget', 'Q4 Budget', 'Total Budget'];
  const budgetData = activities.map(act => [
    act.activityCode,
    act.activityName,
    act.q1Budget,
    act.q2Budget,
    act.q3Budget,
    act.q4Budget,
    act.totalBudget,
  ]);

  // Add totals row
  const q1Total = activities.reduce((sum, a) => sum + a.q1Budget, 0);
  const q2Total = activities.reduce((sum, a) => sum + a.q2Budget, 0);
  const q3Total = activities.reduce((sum, a) => sum + a.q3Budget, 0);
  const q4Total = activities.reduce((sum, a) => sum + a.q4Budget, 0);
  const grandTotal = activities.reduce((sum, a) => sum + a.totalBudget, 0);

  budgetData.push(['', 'TOTAL', q1Total, q2Total, q3Total, q4Total, grandTotal]);

  const budgetSheet = XLSX.utils.aoa_to_sheet([budgetHeader, ...budgetData]);
  budgetSheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');

  // Generate filename and download
  const filename = `Workplan_${agency?.agencyCode || 'Unknown'}_FY${financialYear?.year || 'NA'}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export a single workplan to PDF
 */
export function exportWorkplanToPDF(workplan: Workplan): void {
  const agency = getAgencyById(workplan.agencyId);
  const financialYear = getFinancialYearById(workplan.financialYearId);
  const activities = getActivitiesByWorkplanId(workplan.id);

  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 42, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT OF NATIONAL PLANNING & MONITORING', 15, 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual Workplan Report', 15, 20);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 50, 12);

  // Workplan Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(workplan.title, 15, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoY = 50;
  doc.text(`Agency: ${agency?.agencyName || 'Unknown'} (${agency?.agencyCode || 'N/A'})`, 15, infoY);
  doc.text(`Financial Year: FY${financialYear?.year || 'N/A'}`, 15, infoY + 6);
  doc.text(`Status: ${WORKPLAN_STATUS_LABELS[workplan.status]}`, 15, infoY + 12);
  doc.text(`Total Budget: ${formatCurrency(workplan.totalBudget)}`, pageWidth / 2, infoY);
  doc.text(`Total Activities: ${activities.length}`, pageWidth / 2, infoY + 6);

  // Progress summary
  const completed = activities.filter(a => a.status === 'completed').length;
  const inProgress = activities.filter(a => a.status === 'in_progress').length;
  const overallProgress = activities.length > 0
    ? Math.round(activities.reduce((sum, a) => sum + a.progressPercent, 0) / activities.length)
    : 0;

  doc.text(`Overall Progress: ${overallProgress}%`, pageWidth / 2, infoY + 12);
  doc.text(`Completed: ${completed} | In Progress: ${inProgress}`, pageWidth / 2, infoY + 18);

  // Activities Table
  const tableData = activities.map(act => [
    act.activityCode,
    act.activityName.substring(0, 35) + (act.activityName.length > 35 ? '...' : ''),
    act.responsibleUnit,
    ACTIVITY_STATUS_LABELS[act.status],
    `${act.progressPercent}%`,
    `${act.q1Actual}/${act.q1Target}`,
    `${act.q2Actual}/${act.q2Target}`,
    `${act.q3Actual}/${act.q3Target}`,
    `${act.q4Actual}/${act.q4Target}`,
    formatCurrency(act.totalBudget),
  ]);

  autoTable(doc, {
    startY: 75,
    head: [[
      'Code',
      'Activity Name',
      'Unit',
      'Status',
      'Progress',
      'Q1',
      'Q2',
      'Q3',
      'Q4',
      'Budget',
    ]],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [15, 42, 42],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 18 },
      9: { cellWidth: 28 },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | DNPM Budget & Cashflow System | Papua New Guinea`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const filename = `Workplan_${agency?.agencyCode || 'Unknown'}_FY${financialYear?.year || 'NA'}.pdf`;
  doc.save(filename);
}

/**
 * Export national consolidated workplan report to Excel
 */
export function exportNationalWorkplanToExcel(workplans: Workplan[]): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: National Summary
  const summaryData: (string | number)[][] = [
    ['NATIONAL WORKPLAN CONSOLIDATED REPORT'],
    [''],
    ['Total Workplans', workplans.length],
    [''],
    ['Agency', 'Workplan Title', 'Status', 'Activities', 'Budget', 'Progress %'],
  ];

  let totalBudget = 0;
  let totalActivities = 0;

  workplans.forEach(wp => {
    const agency = getAgencyById(wp.agencyId);
    const activities = getActivitiesByWorkplanId(wp.id);
    const progress = activities.length > 0
      ? Math.round(activities.reduce((sum, a) => sum + a.progressPercent, 0) / activities.length)
      : 0;

    totalBudget += wp.totalBudget;
    totalActivities += activities.length;

    summaryData.push([
      agency?.agencyCode || 'Unknown',
      wp.title,
      WORKPLAN_STATUS_LABELS[wp.status],
      activities.length,
      wp.totalBudget,
      progress,
    ]);
  });

  summaryData.push(['']);
  summaryData.push(['TOTAL', '', '', totalActivities, totalBudget, '']);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 15 }, { wch: 50 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'National Summary');

  // Sheet 2: All Activities
  const activitiesHeader = [
    'Agency',
    'Activity Code',
    'Activity Name',
    'Status',
    'Progress %',
    'Q1 Target',
    'Q1 Actual',
    'Q2 Target',
    'Q2 Actual',
    'Q3 Target',
    'Q3 Actual',
    'Q4 Target',
    'Q4 Actual',
    'Total Budget',
  ];

  const allActivitiesData: (string | number)[][] = [];
  workplans.forEach(wp => {
    const agency = getAgencyById(wp.agencyId);
    const activities = getActivitiesByWorkplanId(wp.id);

    activities.forEach(act => {
      allActivitiesData.push([
        agency?.agencyCode || 'Unknown',
        act.activityCode,
        act.activityName,
        ACTIVITY_STATUS_LABELS[act.status],
        act.progressPercent,
        act.q1Target,
        act.q1Actual,
        act.q2Target,
        act.q2Actual,
        act.q3Target,
        act.q3Actual,
        act.q4Target,
        act.q4Actual,
        act.totalBudget,
      ]);
    });
  });

  const activitiesSheet = XLSX.utils.aoa_to_sheet([activitiesHeader, ...allActivitiesData]);
  activitiesSheet['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'All Activities');

  const filename = `National_Workplan_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export national consolidated workplan report to PDF
 */
export function exportNationalWorkplanToPDF(workplans: Workplan[]): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 42, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT OF NATIONAL PLANNING & MONITORING', 15, 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('National Consolidated Workplan Report', 15, 20);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 50, 12);

  // Summary Stats
  doc.setTextColor(0, 0, 0);

  let totalBudget = 0;
  let totalActivities = 0;
  let totalCompleted = 0;
  let totalInProgress = 0;

  workplans.forEach(wp => {
    const activities = getActivitiesByWorkplanId(wp.id);
    totalBudget += wp.totalBudget;
    totalActivities += activities.length;
    totalCompleted += activities.filter(a => a.status === 'completed').length;
    totalInProgress += activities.filter(a => a.status === 'in_progress').length;
  });

  doc.setFontSize(10);
  doc.text(`Total Agencies: ${workplans.length}`, 15, 42);
  doc.text(`Total Activities: ${totalActivities}`, 15, 48);
  doc.text(`Total Budget: ${formatCurrency(totalBudget)}`, pageWidth / 2, 42);
  doc.text(`Completed: ${totalCompleted} | In Progress: ${totalInProgress}`, pageWidth / 2, 48);

  // Workplans Table
  const tableData = workplans.map(wp => {
    const agency = getAgencyById(wp.agencyId);
    const activities = getActivitiesByWorkplanId(wp.id);
    const progress = activities.length > 0
      ? Math.round(activities.reduce((sum, a) => sum + a.progressPercent, 0) / activities.length)
      : 0;
    const completed = activities.filter(a => a.status === 'completed').length;

    return [
      agency?.agencyCode || 'Unknown',
      wp.title.substring(0, 40) + (wp.title.length > 40 ? '...' : ''),
      WORKPLAN_STATUS_LABELS[wp.status],
      activities.length.toString(),
      `${completed}/${activities.length}`,
      `${progress}%`,
      formatCurrency(wp.totalBudget),
    ];
  });

  autoTable(doc, {
    startY: 58,
    head: [['Agency', 'Workplan Title', 'Status', 'Activities', 'Completed', 'Progress', 'Budget']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [15, 42, 42],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 80 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 35 },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | DNPM Budget & Cashflow System | Papua New Guinea`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `National_Workplan_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
