import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { ROLE_DATA } from "../pages/app/ProfilePage";
import { addFeedback } from "../pages/app/feedbackStore";
import { FeedbackType, Source } from "../pages/app/feedbackData";

export function SubmitFeedbackModal() {
  const { role, setFeedbackModalOpen } = useAppContext();
  const [type, setType] = useState<FeedbackType>("Suggestion");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const profile = ROLE_DATA[role];
  const authorName = `${profile.first} ${profile.last}`;
  // roleLabel matches the Feedback module's Source type exactly for every
  // non-Admin role (Reception -> "Receptionist", etc.) — this modal is never
  // rendered for Admin, so the cast is safe.
  const source = profile.roleLabel as Source;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill out both subject and description.");
      return;
    }
    addFeedback({
      source,
      type,
      subject: subject.trim(),
      description: description.trim(),
      isAnonymous,
      authorName,
      authorRole: profile.roleLabel,
    });
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as FeedbackType)}
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

          <div className="pt-1 border-t border-gray-100">
            <label className="flex items-center space-x-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="rounded text-slate-600 focus:ring-slate-500"
              />
              <span className="text-sm font-semibold text-gray-700">Submit anonymously</span>
            </label>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Your name and role will not be shown to the reviewer. Your clinic administrator will still be able to follow up on serious issues.
            </p>

            <div className="mt-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-gray-500">
              Submitting as: <span className="text-gray-800 font-bold">{isAnonymous ? "Anonymous" : authorName}</span> · {profile.roleLabel}
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
