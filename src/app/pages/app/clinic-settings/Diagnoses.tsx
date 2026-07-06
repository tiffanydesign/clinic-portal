import React, { useState } from "react";
import { Plus, MoreHorizontal, Search, Download, X, Pin } from "lucide-react";
import { toast } from "sonner";

export type Diagnosis = {
  id: string;
  name: string;
  code: string;
  category: string;
  frequency: number;
  status: 'Active' | 'Inactive';
  pinned?: boolean;
};

export const DIAGNOSIS_LIBRARY: Diagnosis[] = [
  { id: "1", name: "Essential Hypertension", code: "I10", category: "Cardiovascular", frequency: 23, status: "Active", pinned: true },
  { id: "2", name: "Type 2 Diabetes Mellitus", code: "E11", category: "Metabolic", frequency: 18, status: "Active", pinned: true },
  { id: "3", name: "Hyperlipidemia", code: "E78.5", category: "Metabolic", frequency: 15, status: "Active" },
  { id: "4", name: "BRCA1 Gene Mutation", code: "Z15.01", category: "Genetic", frequency: 8, status: "Active" },
  { id: "5", name: "Vitamin D Deficiency", code: "E55.9", category: "Metabolic", frequency: 12, status: "Active" },
  { id: "6", name: "Osteoporosis, unspecified", code: "M81.0", category: "Musculoskeletal", frequency: 6, status: "Active" },
  { id: "7", name: "Anxiety Disorder", code: "F41.9", category: "Neurological", frequency: 4, status: "Active" },
  { id: "8", name: "Iron Deficiency Anemia", code: "D50.9", category: "Metabolic", frequency: 2, status: "Inactive" },
];

function StatusToggle({ active }: { active: boolean }) {
  return (
    <button className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${active ? 'left-[22px]' : 'left-[3px]'}`} />
    </button>
  );
}

export function DiagnosesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Diagnosis Library</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the diagnosis codes and categories available to clinicians</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => toast("Opening import dialog...")}
            className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Import
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Diagnosis
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-gray-100 flex items-center space-x-4 bg-gray-50/50 shrink-0">
        <div className="relative w-[300px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or ICD code..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[160px]">
          <option>All Categories</option>
          <option>Cardiovascular</option>
          <option>Metabolic</option>
          <option>Genetic</option>
          <option>Oncology</option>
          <option>Musculoskeletal</option>
          <option>Neurological</option>
          <option>Other</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[120px]">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0 z-10 shadow-[0_1px_0_#e5e7eb]">
              <tr>
                <th className="p-4 w-[280px]">Diagnosis Name</th>
                <th className="p-4 w-[120px]">ICD-10 Code</th>
                <th className="p-4 w-[140px]">Category</th>
                <th className="p-4 w-[120px]">Frequency</th>
                <th className="p-4 w-[100px] text-center">Status</th>
                <th className="p-4 w-[80px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DIAGNOSIS_LIBRARY.map((t) => (
                <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${t.status === 'Inactive' ? 'text-gray-400' : 'text-gray-800'}`}>
                  <td className={`p-4 font-bold ${t.status === 'Inactive' ? 'text-gray-500' : 'text-slate-800'} flex items-center`}>
                    {t.pinned && <Pin className="w-4 h-4 mr-2 text-blue-500 fill-current" />}
                    {t.name}
                  </td>
                  <td className="p-4 font-medium font-mono text-gray-500">{t.code}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${t.status === 'Inactive' ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-500">{t.frequency} uses</td>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Add Diagnosis</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Diagnosis Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" placeholder="e.g., Essential Hypertension" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">ICD-10 Code</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 font-mono" placeholder="e.g., I10" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Category <span className="text-red-500">*</span></label>
                  <select defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                    <option value="" disabled>Select category...</option>
                    <option>Cardiovascular</option>
                    <option>Metabolic</option>
                    <option>Genetic</option>
                    <option>Oncology</option>
                    <option>Musculoskeletal</option>
                    <option>Neurological</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Description</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 resize-none" placeholder="Optional notes..."></textarea>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <div>
                  <div className="text-sm font-bold text-gray-800">Status</div>
                  <div className="text-xs text-gray-500">Active diagnoses are available for clinicians to select.</div>
                </div>
                <StatusToggle active={true} />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded text-sm font-bold transition-colors">
                Cancel
              </button>
              <button onClick={() => { toast.success("Diagnosis added successfully."); setModalOpen(false); }} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
