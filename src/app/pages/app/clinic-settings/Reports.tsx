import React, { useState } from "react";
import { Plus, MoreHorizontal, FileText, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  category: string;
  version: string;
  lastUpdated: string;
  status: 'Active' | 'Inactive';
};

const REPORT_TEMPLATES: Template[] = [
  { id: "1", name: "7-Omics Premium Report", category: "Genomics", version: "v3.1", lastUpdated: "28 Jun 2026", status: "Active" },
  { id: "2", name: "Body Scan Result Report", category: "Body Scan", version: "v2.0", lastUpdated: "15 Jun 2026", status: "Active" },
  { id: "3", name: "Blood Panel Summary", category: "Blood Panel", version: "v1.4", lastUpdated: "10 Jun 2026", status: "Active" },
  { id: "4", name: "Genetic Risk Assessment", category: "Genomics", version: "v1.0", lastUpdated: "1 Jun 2026", status: "Inactive" },
];

const DOC_TEMPLATES: Template[] = [
  { id: "5", name: "Visit Summary", category: "Visit Summary", version: "v2.1", lastUpdated: "20 Jun 2026", status: "Active" },
  { id: "6", name: "Specialist Referral Letter", category: "Referral Letter", version: "v1.2", lastUpdated: "5 Jun 2026", status: "Active" },
  { id: "7", name: "Medical Fitness Certificate", category: "Medical Certificate", version: "v1.0", lastUpdated: "1 May 2026", status: "Inactive" },
];

function StatusToggle({ active }: { active: boolean }) {
  return (
    <button className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${active ? 'left-[22px]' : 'left-[3px]'}`} />
    </button>
  );
}

function TemplateTable({ data }: { data: Template[] }) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
          <tr>
            <th className="p-4 w-[300px]">Template Name</th>
            <th className="p-4 w-[160px]">Category</th>
            <th className="p-4 w-[100px]">Version</th>
            <th className="p-4 w-[140px]">Last Updated</th>
            <th className="p-4 w-[100px] text-center">Status</th>
            <th className="p-4 w-[80px] text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((t) => (
            <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'Inactive' ? 'text-gray-400' : 'text-gray-800'}`}>
              <td className={`p-4 font-bold ${t.status === 'Inactive' ? 'text-gray-500' : 'text-slate-800'}`}>
                {t.name}
              </td>
              <td className="p-4">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${t.status === 'Inactive' ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  {t.category}
                </span>
              </td>
              <td className="p-4 font-medium">{t.version}</td>
              <td className="p-4">{t.lastUpdated}</td>
              <td className="p-4 text-center">
                <StatusToggle active={t.status === 'Active'} />
              </td>
              <td className="p-4 text-center">
                <button className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-200 rounded transition-colors" onClick={() => toast("Opening actions menu...")}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Report & Document Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage templates used to generate patient reports and clinic documents</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Upload Template
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {/* Block A */}
        <section>
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 mr-3">Report Templates</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{REPORT_TEMPLATES.length}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Templates used by clinicians to generate patient-facing clinical reports</p>
          <TemplateTable data={REPORT_TEMPLATES} />
        </section>

        {/* Block B */}
        <section>
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 mr-3">Document Templates</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{DOC_TEMPLATES.length}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Templates for operational documents such as visit summaries and referral letters</p>
          <TemplateTable data={DOC_TEMPLATES} />
        </section>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Upload Template</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Template Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" placeholder="e.g., Annual Health Check Report" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Type</label>
                <div className="flex space-x-6 mt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="tempType" defaultChecked className="text-slate-600 focus:ring-slate-500" />
                    <span className="text-sm text-gray-700">Report Template</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="tempType" className="text-slate-600 focus:ring-slate-500" />
                    <span className="text-sm text-gray-700">Document Template</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                    <option>Blood Panel</option>
                    <option>Body Scan</option>
                    <option>Genomics</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Version</label>
                  <input type="text" defaultValue="v1.0" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Description</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 resize-none" placeholder="Optional notes..."></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">File Upload</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-slate-400 transition-colors">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium mb-1">Drag and drop file here, or <span className="text-blue-600 hover:underline">Browse files</span></p>
                  <p className="text-xs text-gray-400">Supported formats: .docx, .pdf, .html (Max 10MB)</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded flex items-start">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 shrink-0" />
                <p className="text-xs text-blue-800 font-medium">Uploaded templates will be set to Inactive by default. Activate them when ready.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded text-sm font-bold transition-colors">
                Cancel
              </button>
              <button onClick={() => { toast.success("Template uploaded successfully."); setModalOpen(false); }} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}
