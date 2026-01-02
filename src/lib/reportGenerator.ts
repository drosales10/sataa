// ============================================================================
// GENERADOR DE REPORTES PDF
// ============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Threat, EnvironmentalVariable } from '@/types';
import { THREAT_TYPES, SEVERITY_LEVELS, ENVIRONMENTAL_VARIABLES } from '@/lib/constants';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ReportOptions {
  title: string;
  data: Threat[];
  language: 'es' | 'en';
  includeMap?: boolean;
  includeCharts?: boolean;
}

interface EnvironmentalReportOptions {
  title: string;
  variables: EnvironmentalVariable[];
  language: 'es' | 'en';
}

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
  internal: {
    getNumberOfPages(): number;
    pageSize: {
      getWidth(): number;
      getHeight(): number;
    };
  };
}

export const generateThreatsPDF = async (options: ReportOptions): Promise<void> => {
  const { title, data, language } = options;
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Encabezado
  doc.setFontSize(20);
  doc.setTextColor(46, 125, 50); // Verde bosque
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${language === 'es' ? 'Generado el' : 'Generated on'}: ${format(new Date(), 'PPP', {
      locale: language === 'es' ? es : enUS,
    })}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 15;

  // Resumen ejecutivo
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(language === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary', 14, yPosition);
  yPosition += 8;

  const stats = {
    total: data.length,
    high: data.filter(t => t.severity === 'HIGH').length,
    medium: data.filter(t => t.severity === 'MEDIUM').length,
    low: data.filter(t => t.severity === 'LOW').length,
  };

  doc.setFontSize(10);
  doc.text(`${language === 'es' ? 'Total de Amenazas' : 'Total Threats'}: ${stats.total}`, 14, yPosition);
  yPosition += 6;
  doc.text(`${language === 'es' ? 'Severidad Alta' : 'High Severity'}: ${stats.high}`, 14, yPosition);
  yPosition += 6;
  doc.text(`${language === 'es' ? 'Severidad Media' : 'Medium Severity'}: ${stats.medium}`, 14, yPosition);
  yPosition += 6;
  doc.text(`${language === 'es' ? 'Severidad Baja' : 'Low Severity'}: ${stats.low}`, 14, yPosition);
  yPosition += 12;

  // Tabla de amenazas
  const tableData = data.map(threat => [
    threat.id.substring(0, 8),
    language === 'es' ? THREAT_TYPES[threat.type].label : THREAT_TYPES[threat.type].labelEn,
    language === 'es' ? SEVERITY_LEVELS[threat.severity].label : SEVERITY_LEVELS[threat.severity].labelEn,
    threat.location.address.substring(0, 30) + '...',
    format(new Date(threat.reportedAt), 'dd/MM/yyyy'),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [[
      'ID',
      language === 'es' ? 'Tipo' : 'Type',
      language === 'es' ? 'Severidad' : 'Severity',
      language === 'es' ? 'Ubicación' : 'Location',
      language === 'es' ? 'Fecha' : 'Date',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 60 },
      4: { cellWidth: 25 },
    },
  });

  // Pie de página
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${language === 'es' ? 'Página' : 'Page'} ${i} ${language === 'es' ? 'de' : 'of'} ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text('SMyEG - Sistema de Monitoreo y Evaluación Geoespacial', pageWidth / 2, pageHeight - 5, {
      align: 'center',
    });
  }

  // Descargar
  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateEnvironmentalPDF = async (
  options: EnvironmentalReportOptions
): Promise<void> => {
  const { title, variables, language } = options;
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Encabezado
  doc.setFontSize(20);
  doc.setTextColor(21, 101, 192); // Azul profundo
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${language === 'es' ? 'Generado el' : 'Generated on'}: ${format(new Date(), 'PPP', {
      locale: language === 'es' ? es : enUS,
    })}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 15;

  // Tabla de variables
  const tableData = variables.map(variable => [
    language === 'es' ? ENVIRONMENTAL_VARIABLES[variable].label : ENVIRONMENTAL_VARIABLES[variable].labelEn,
    ENVIRONMENTAL_VARIABLES[variable].unit,
    ENVIRONMENTAL_VARIABLES[variable].color,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [[
      language === 'es' ? 'Variable' : 'Variable',
      language === 'es' ? 'Unidad' : 'Unit',
      language === 'es' ? 'Color' : 'Color',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [21, 101, 192],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
  });

  // Pie de página
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${language === 'es' ? 'Página' : 'Page'} ${i} ${language === 'es' ? 'de' : 'of'} ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text('SMyEG - Sistema de Monitoreo y Evaluación Geoespacial', pageWidth / 2, pageHeight - 5, {
      align: 'center',
    });
  }

  // Descargar
  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};