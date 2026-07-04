import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";

export function SubmitFeedbackModal() {
  const { setFeedbackModalOpen } = useAppContext();
  const [type, setType] = useState("Suggestion");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("Low");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill out both subject and description.");
      return;
    }
    toast.success("Feedback submitted. Your clinic administrator will review it.");
    setFeedbackModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Submit Feedback</h2>
          <button onClick={() => setFeedbackModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-slate-500 bg-white"
            >
              <option value="Suggestion">Suggestion</option>
              <option value="System Issue">System Issue</option>
              <option value="Incident Report">Incident Report</option>
              <option value="Compliment">Compliment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief summary..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-slate-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe in detail..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-slate-500 bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Urgency</label>
            <div className="flex space-x-6 mt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="urgency" value="Low" checked={urgency === "Low"} onChange={e => setUrgency(e.target.value)} className="text-slate-600 focus:ring-slate-500" />
                <span className="text-sm text-gray-700">Low</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="urgency" value="Medium" checked={urgency === "Medium"} onChange={e => setUrgency(e.target.value)} className="text-slate-600 focus:ring-slate-500" />
                <span className="text-sm text-gray-700">Medium</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="urgency" value="High" checked={urgency === "High"} onChange={e => setUrgency(e.target.value)} className="text-slate-600 focus:ring-slate-500" />
                <span className="text-sm text-gray-700">High</span>
              </label>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
          <button onClick={() => setFeedbackModalOpen(false)} type="button" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded text-sm font-bold transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} type="button" className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors shadow-sm">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
