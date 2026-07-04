import React, { useState } from "react";
import { Plus, Search, FileText, FileImage, File, Info, X, UploadCloud, Eye, Download, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ConsentFile = {
  id: string;
  name: string;
  category: string;
  size: string;
  date: string;
  linkedForm: string | null;
  type: 'pdf' | 'docx' | 'image';
};

const MOCK_DATA: ConsentFile[] = [
  { id: "1", name: "Privacy Policy — Full Text.pdf", category: "Privacy Policy", size: "2.4 MB", date: "1 Jun 2026", linkedForm: "Privacy & Data Processing Agreement", type: "pdf" },
  { id: "2", name: "Genetic Testing Information Guide.pdf", category: "Procedure Guide", size: "1.8 MB", date: "15 May 2026", linkedForm: "Informed Consent — Genetic Testing", type: "pdf" },
  { id: "3", name: "Body Scan Procedure Overview.pdf", category: "Procedure Guide", size: "3.1 MB", date: "10 May 2026", linkedForm: "Informed Consent — Body Scan", type: "pdf" },
  { id: "4", name: "Terms of Service — 2026.pdf", category: "Terms of Service", size: "1.2 MB", date: "1 Apr 2026", linkedForm: null, type: "pdf" },
  { id: "5", name: "Patient Rights & Responsibilities.pdf", category: "Patient Information", size: "0.8 MB", date: "1 Mar 2026", linkedForm: null, type: "pdf" },
  { id: "6", name: "Physical Assessment Risk Disclosure.docx", category: "Procedure Guide", size: "0.5 MB", date: "1 Feb 2026", linkedForm: "Liability Waiver — Physical Assessment", type: "docx" },
];

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf') return <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></div>;
  if (type === 'docx') return <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></div>;
  return <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0"><FileImage className="w-6 h-6" /></div>;
}

export function ConsentFilesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-center bg-white z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consent & Supporting Files</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage informational documents that patients may review before signing forms</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Upload File
        </button>
      </div>

      <div className="bg-blue-50 border-b border-blue-100 px-8 py-3 flex items-start shrink-0">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-3 shrink-0" />
        <p className="text-sm text-blue-800 font-medium leading-relaxed">
          These files are not signed by patients. They are supporting documents (e.g. full privacy policy text, procedure descriptions) that can be linked to Signed Form Templates for patient review.
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-gray-200 flex items-center space-x-4 bg-white shrink-0">
        <div className="relative w-[300px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search files..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 shadow-sm" />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[160px]">
          <option>All Categories</option>
          <option>Privacy Policy</option>
          <option>Procedure Guide</option>
          <option>Terms of Service</option>
          <option>Patient Information</option>
          <option>Other</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[140px]">
          <option>Newest First</option>
          <option>Oldest First</option>
          <option>Name A–Z</option>
          <option>Name Z–A</option>
        </select>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-3 gap-6">
          {MOCK_DATA.map(file => (
            <div key={file.id} className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
              <div className="p-5 flex-1">
                <div className="flex items-start mb-4">
                  <FileIcon type={file.type} />
                  <div className="ml-4 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 leading-tight mb-2 truncate" title={file.name}>{file.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wider rounded">
                      {file.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-4">
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                </div>

                <div className="pt-4 border-t border-gray-100 text-xs">
                  {file.linkedForm ? (
                    <div className="text-blue-600 truncate" title={`Linked to: ${file.linkedForm}`}>
                      <span className="text-gray-500 mr-1">Linked to:</span> 
                      <span className="font-medium hover:underline cursor-pointer">{file.linkedForm}</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">Not linked to any form</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 border-t border-gray-200 bg-gray-50 divide-x divide-gray-200">
                <button onClick={() => toast("Opening preview...")} className="py-2.5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" title="Preview">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => toast("Downloading file...")} className="py-2.5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => toast("Opening edit modal...")} className="py-2.5 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => toast("Prompting delete confirmation...")} className="py-2.5 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Upload File</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">File Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500" placeholder="Automatically filled on upload..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Category <span className="text-red-500">*</span></label>
                <select defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white">
                  <option value="" disabled>Select category...</option>
                  <option>Privacy Policy</option>
                  <option>Procedure Guide</option>
                  <option>Terms of Service</option>
                  <option>Patient Information</option>
                  <option>Other</option>
                </select>
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
                  <p className="text-xs text-gray-400">Supported formats: .pdf, .docx, .png, .jpg (Max 20MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Link to Form Template</label>
                <select multiple className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white h-24">
                  <option>Informed Consent — Body Scan</option>
                  <option>Informed Consent — Genetic Testing</option>
                  <option>Privacy & Data Processing Agreement</option>
                  <option>Health History Questionnaire</option>
                  <option>Liability Waiver — Physical Assessment</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">Hold Cmd/Ctrl to select multiple forms to link this file to.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded text-sm font-bold transition-colors">
                Cancel
              </button>
              <button onClick={() => { toast.success("File uploaded successfully."); setModalOpen(false); }} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
