import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import type { OTRecord } from '../../types';
import { formatDateLong, formatTime } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';

export const ExportPDFButton = ({ record }: { record: OTRecord }) => {
  const showToast = useUiStore((state) => state.showToast);

  const exportPdf = async () => {
    const generatedAt = format(new Date(), 'dd MMM yyyy, hh:mm a');
    const node = document.createElement('div');
    node.style.position = 'fixed';
    node.style.left = '-10000px';
    node.style.top = '0';
    node.style.width = '794px';
    node.style.padding = '40px';
    node.style.background = '#ffffff';
    node.style.color = '#0f172a';
    node.style.fontFamily = 'Inter, Arial, sans-serif';
    node.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;">
        <div><h1 style="margin:0;font-size:28px;">NIA JAIPUR</h1><p style="margin:8px 0 0;color:#64748b;font-size:16px;">Operation Theatre Record</p></div>
        <div style="text-align:right;font-size:12px;color:#64748b;"><strong>Record ID</strong><br>${escapeHtml(record.id)}<br><br><strong>Generated</strong><br>${generatedAt}</div>
      </div>
      <div style="height:4px;background:#0D9488;margin:24px 0;"></div>
      ${section('Patient Information', [
        ['Name', record.patient_name],
        ['Age', `${record.age} years`],
        ['Gender', record.gender],
        ['OPD Number', record.opd_number || '-'],
        ['IPD Number', record.ipd_number || '-']
      ])}
      ${section('Clinical Details', [
        ['Diagnosis', record.diagnosis],
        ['Surgical Procedure', record.surgical_procedure],
        ['Anesthesia', record.anesthesia_type]
      ])}
      ${section('OT Schedule', [
        ['Date', formatDateLong(record.ot_date)],
        ['OT Started', formatTime(record.ot_start_time)],
        ['Final Case', formatTime(record.final_case_time)]
      ])}
      ${section('Surgical Team', [
        ['Consultant', record.consultant_name],
        ['Anesthetist', record.anesthetist_name],
        ['1st Assistant', record.first_assistant || '-'],
        ['2nd Assistant', record.second_assistant || '-']
      ])}
      ${record.notes ? section('Notes', [['Notes', record.notes]]) : ''}
      <div style="border-top:1px solid #e2e8f0;margin-top:32px;padding-top:16px;font-size:11px;color:#64748b;text-align:center;">
        CONFIDENTIAL - NIA Jaipur OT Department<br>Generated on: ${generatedAt}
      </div>
    `;

    document.body.appendChild(node);
    try {
      const canvas = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      const safeName = record.patient_name.replace(/[^a-z0-9]+/gi, '_');
      pdf.save(`NIA_OT_${safeName}_${record.ot_date}.pdf`);
      showToast('success', 'PDF exported successfully');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'PDF export failed');
    } finally {
      document.body.removeChild(node);
    }
  };

  return (
    <button type="button" onClick={exportPdf} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
      <Download className="h-4 w-4" />
      Export PDF
    </button>
  );
};

const section = (title: string, rows: Array<[string, string]>) => `
  <section style="border-left:4px solid #0D9488;background:#f8fafc;margin:18px 0;padding:16px 18px;border-radius:10px;">
    <h2 style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;color:#0f766e;">${escapeHtml(title)}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows.map(([label, value]) => `<tr><td style="width:180px;padding:8px 0;color:#64748b;font-weight:700;">${escapeHtml(label)}</td><td style="padding:8px 0;">${escapeHtml(value)}</td></tr>`).join('')}
    </table>
  </section>
`;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char] || char);
