/**
 * @file src/components/analysis/ExportPanel.tsx
 * @description UI component for downloading analysis data as CSV or GeoJSON.
 */

'use client';

import React, { useState } from 'react';


interface ExportPanelProps {
  feature: any; // The Turf.js feature or GeoJSON geometry to export from
  results?: any; // The analysis results to summarize in the PDF
  colors: any;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ feature, results, colors }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'geojson' | 'csv') => {
    if (!feature) return;
    setLoading(true);
    try {
      const response = await fetch('/api/analysis/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: feature.geometry,
          format,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spatial_export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to construct export. ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);

      // Dynamic imports to prevent Turbopack/fflate build errors during SSR
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("CapeTown GIS Hub", 14, 22);

      doc.setFontSize(14);
      doc.text("Spatial Analysis Report", 14, 30);

      // Summary
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

      if (results) {
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.text("Analysis Summary:", 14, 52);

        doc.setFontSize(10);
        doc.text(`Total Properties: ${results.property_count || results.summary?.totalErfs || 0}`, 14, 60);

        const valuation = results.total_valuation || results.summary?.medianValue || 0;
        doc.text(`Aggregate Valuation: R ${(valuation / 1000000).toFixed(2)}M`, 14, 66);

        if (results.zoning_breakdown || results.zoningMix) {
          doc.text("Zoning Breakdown:", 14, 76);

          let yPos = 82;
          const mix = results.zoning_breakdown
            ? Object.entries(results.zoning_breakdown).map(([k,v]) => ({ code: k, count: v}))
            : (results.zoningMix || []).map((z: any) => ({ code: z.name, count: z.value }));

          const tableData = mix.map((z: any) => [z.code, z.count]);

          autoTable(doc, {
            startY: yPos,
            head: [['Zoning Code', 'Property Count']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] }
          });
        }
      }

      doc.save("spatial_report.pdf");

    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!feature) return null;

  return (
    <div style={{ marginTop: '12px', borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '8px' }}>
        Export Selection
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleExport('geojson')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          GeoJSON
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          CSV
        </button>
        <button
          onClick={handleExportPDF}
          disabled={loading}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            background: colors.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontWeight: 600
          }}
        >
          PDF Report
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
