import React, { useState } from "react";
import { Plus, MoreHorizontal, Search, Download, X, Clock, UploadCloud, Info } from "lucide-react";
import { toast } from "sonner";

type FormTemplate = {
  id: string;
  name: string;
  type: string;
  version: string;
  requiredAt: string;
  lastUpdated: string;
  signedCount: number;
  status: 'Active' | 'Inactive';
};

const MOCK_DATA: FormTemplate[] = [
  { id: "1", name: "Informed Consent — Body Scan", type: "Consent Form", version: "v3.0", requiredAt: "Before Check-in", lastUpdated: "20 Jun 2026", signedCount: 142, status: "Active" },
  { id: "2", name: "Informed Consent — Genetic Testing", type: "Consent Form", version: "v2.1", requiredAt: "Before Scan", lastUpdated: "15 Jun 2026", signedCount: 89, status: "Active" },
  { id: "3", name: "Privacy & Data Processing Agreement", type: "Privacy Agreement", version: "v4.0", requiredAt: "Before Check-in", lastUpdated: "1 Jun 2026", signedCount: 156, status: "Active" },
  { id: "4", name: "Health History Questionnaire", type: "Questionnaire", version: "v1.3", requiredAt: "Before Consultation", lastUpdated: "10 Jun 2026", signedCount: 134, status: "Active" },
  { id: "5", name: "Liability Waiver — Physical Assessment", type: "Waiver", version: "v1.0", requiredAt: "Before Scan", lastUpdated: "1 May 2026", signedCount: 45, status: "Inactive" },
];

function StatusToggle({ active }: { active: boolean }) {
  return (
    <button className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${active ? 'left-[22px]' : 'left-[3px]'}`} />
    </button>
  );
}

export function FormTemplatesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Signed Form Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage templates that patients must sign before or during their visit</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Upload Template
        </button>
      </div>

      <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-start shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-3 shrink-0" />
        <p className="text-sm text-amber-800 font-medium leading-relaxed">
          Deactivating or deleting a form template does not affect already signed records. Active forms are automatically included in the check-in flow based on their "Required At" setting.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0 z-10 shadow-[0_1px_0_#e5e7eb]">
              <tr>
                <th className="p-4 w-[240px]">Form Name</th>
                <th className="p-4 w-[140px]">Form Type</th>
                <th className="p-4 w-[100px]">Version</th>
                <th className="p-4 w-[150px]">Required At</th>
                <th className="p-4 w-[120px]">Last Updated</th>
                <th className="p-4 w-[100px]">Signed Count</th>
                <th className="p-4 w-[100px] text-center">Status</th>
                <th className="p-4 w-[80px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_DATA.map((t) => (
                <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'Inactive' ? 'text-gray-400' : 'text-gray-800'}`}>
                  <td className={`p-4 font-bold ${t.status === 'Inactive' ? 'text-gray-500' : 'text-slate-800'} truncate max-w-[240px]`} title={t.name}>
                    {t.name}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border 
                      ${t.status === 'Inactive' ? 'bg-gray-50 border-gray-200 text-gray-400' : 
                        t.type.includes('Consent') ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        t.type.includes('Privacy') ? 'bg-purple-50 border-purple-200 text-purple-700' :
                        'bg-orange-50 border-orange-200 text-orange-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">{t.version}</span>
                      <button onClick={() => toast("Opening version history...")} className="text-gray-400 hover:text-slate-600 transition-colors">
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 font-medium">{t.requiredAt}</td>
                  <td className="p-4">{t.lastUpdated}</td>
                  <td className="p-4 font-medium text-gray-500">{t.signedCount} signed</td>
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
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Upload Form Template</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Form Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" placeholder="e.g., Informed Consent — Procedure X" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Form Type <span className="text-red-500">*</span></label>
                  <select defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                    <option value="" disabled>Select type...</option>
                    <option>Consent Form</option>
                    <option>Privacy Agreement</option>
                    <option>Waiver</option>
                    <option>Questionnaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Version</label>
                  <input type="text" defaultValue="v1.0" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Required At <span className="text-red-500">*</span></label>
                <select defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                  <option value="" disabled>Select when patient must sign...</option>
                  <option>Before Check-in</option>
                  <option>Before Scan</option>
                  <option>Before Consultation</option>
                  <option>Optional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Linked Consent Files</label>
                <select multiple className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white h-24">
                  <option>Privacy Policy — Full Text.pdf</option>
                  <option>Genetic Testing Information Guide.pdf</option>
                  <option>Body Scan Procedure Overview.pdf</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">Hold Cmd/Ctrl to select multiple. These files will be shown to the patient before signing.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">File Upload</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-slate-400 transition-colors">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium mb-1">Drag and drop file here, or <span className="text-blue-600 hover:underline">Browse files</span></p>
                  <p className="text-xs text-gray-400">Supported formats: .pdf (Max 10MB)</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded text-sm font-bold transition-colors">
                Cancel
              </button>
              <button onClick={() => { toast.success("Form template uploaded successfully."); setModalOpen(false); }} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertTriangle(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
}
