import React, { useState } from "react";
import { Download, Settings, Search, Star, Flag, MessageSquare, AlertCircle } from "lucide-react";
import { Status, SOURCE_COLORS, TYPE_COLORS, STATUS_PILLS, URGENCY_COLORS, submitterDisplayName } from "./feedbackData";
import { useFeedbackList, updateFeedback } from "./feedbackStore";

export function FeedbackAdminPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const feedbacks = useFeedbackList();
  const [newNote, setNewNote] = useState("");

  const selectedItem = feedbacks.find(f => f.id === selectedId);

  const handleUpdateStatus = (id: string, newStatus: Status) => {
    updateFeedback(id, { status: newStatus });
  };

  const handleToggleFlag = (id: string) => {
    const item = feedbacks.find(f => f.id === id);
    if (!item) return;
    updateFeedback(id, { flagged: !item.flagged });
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedId) return;
    const item = feedbacks.find(f => f.id === selectedId);
    if (!item) return;
    const notes = item.internalNotes || [];
    updateFeedback(selectedId, { internalNotes: [{ author: "Current Admin", time: "Just now", text: newNote }, ...notes] });
    setNewNote("");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      
      {/* Header & Toolbar */}
      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Feedback</h1>
            <p className="text-sm text-gray-500 mt-1">Patient and staff feedback records</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2 text-gray-500" /> Export
            </button>
            <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-8 py-3 flex items-center space-x-4 bg-gray-50/50">
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[140px]">
            <option>All Sources</option>
            <option>Patient (App)</option>
            <option>Clinician</option>
            <option>Nurse</option>
            <option>Receptionist</option>
          </select>
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[140px]">
            <option>All Types</option>
            <option>Visit Feedback</option>
            <option>Complaint</option>
            <option>Suggestion</option>
            <option>System Issue</option>
            <option>Incident Report</option>
            <option>Compliment</option>
          </select>
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[120px]">
            <option>All Status</option>
            <option>New</option>
            <option>In Review</option>
            <option>Resolved</option>
            <option>Archived</option>
          </select>
          <div className="px-3 py-1.5 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white shadow-sm cursor-pointer hover:border-gray-400">
            This Month
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by patient name, staff name, or keyword..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
          </div>
          <div className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-gray-300" />)}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-8 py-5 shrink-0 grid grid-cols-4 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Feedback</div>
          <div className="text-3xl font-bold text-gray-800">47</div>
          <div className="flex items-center text-sm text-gray-500 mt-1 font-medium">
            <span className="text-green-600 font-bold mr-1">↑ 12</span> vs last month
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avg. Rating</div>
          <div className="text-3xl font-bold text-gray-800 flex items-center">4.3 <Star className="w-6 h-6 text-amber-400 fill-current ml-2" /></div>
          <div className="flex items-center text-sm text-gray-500 mt-1 font-medium">
            <span className="text-green-600 font-bold mr-1">↑ 0.2</span> vs last month
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-bl-lg">1 OVERDUE</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Open Issues</div>
          <div className="text-3xl font-bold text-gray-800">5</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">3 new · 2 in review</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Staff Feedback</div>
          <div className="text-3xl font-bold text-gray-800">9</div>
          <div className="text-[11px] text-gray-500 mt-1.5 font-medium leading-tight">4 suggestions · 3 system issues · 2 incidents</div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden border-t border-gray-200">
        
        {/* Left List (55%) */}
        <div className="w-[55%] border-r border-gray-200 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {feedbacks.map(f => {
              const isSelected = selectedId === f.id;
              const sourceColor = SOURCE_COLORS[f.source];
              const typeStyle = TYPE_COLORS[f.type];
              const statusStyle = STATUS_PILLS[f.status];

              return (
                <div 
                  key={f.id} 
                  onClick={() => setSelectedId(f.id)}
                  className={`bg-white border rounded-lg p-4 relative cursor-pointer shadow-sm transition-all
                    ${isSelected ? 'border-slate-500 ring-1 ring-slate-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${sourceColor}`} />
                  {f.status === 'New' && <div className="absolute top-5 left-3 w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_0_2px_white]" />}
                  
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider text-gray-600`}>{f.source}</span>
                        <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${typeStyle}`}>{f.type}</span>
                        {f.urgency === "High" && (
                          <span title="High urgency" className="flex items-center text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium ml-1">{f.timeAgo}</span>
                        {f.flagged && <Flag className="w-3.5 h-3.5 text-orange-500 ml-1 fill-current" />}
                      </div>
                      <span className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded-full ${statusStyle}`}>
                        {f.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-800 mb-1.5 truncate pr-8">{f.title}</h3>
                    
                    {f.rating && (
                      <div className="flex text-amber-400 mb-1.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating! ? 'fill-current' : 'text-gray-200'}`} />)}
                      </div>
                    )}

                    <div className="text-[11px] text-gray-500 truncate font-medium">
                      {f.source === 'Patient' ? (
                        <>Patient: {f.patientName} · Visit: {f.visitDate} {f.clinician && `· Clinician: ${f.clinician}`}</>
                      ) : (
                        <>Submitted by: {submitterDisplayName(f)} · {f.authorRole}</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-10 bg-white border-t border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
            Showing 1–10 of 47 records
          </div>
        </div>

        {/* Right Detail Panel (45%) */}
        <div className="w-[45%] bg-white flex flex-col overflow-hidden relative">
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-12 h-12 mb-4 text-gray-200" />
              <div className="text-lg font-bold text-gray-600 mb-1">No feedback selected</div>
              <div className="text-sm">Select a feedback to view details</div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Top Meta */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{selectedItem.source}</span>
                      <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${TYPE_COLORS[selectedItem.type]}`}>{selectedItem.type}</span>
                      {selectedItem.urgency && (
                        <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded ${URGENCY_COLORS[selectedItem.urgency]}`}>
                          {selectedItem.urgency} Urgency
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-medium text-gray-400">{selectedItem.timeAgo}</span>
                      <select 
                        value={selectedItem.status}
                        onChange={e => handleUpdateStatus(selectedItem.id, e.target.value as Status)}
                        className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider rounded-lg outline-none cursor-pointer
                          ${selectedItem.status === 'New' ? 'bg-blue-600 text-white border-blue-600' : 
                            selectedItem.status === 'In Review' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                            selectedItem.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            'bg-gray-100 text-gray-600 border-gray-300'}`}
                      >
                        <option value="New">New</option>
                        <option value="In Review">In Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 mb-6">{selectedItem.title}</h2>

                  {/* Submitter Card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {selectedItem.isAnonymous ? (
                          <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-500 mr-3 shrink-0">
                            ?
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 mr-3 shrink-0">
                            {selectedItem.authorName.split(' ').map(n=>n[0]).join('')}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-800 text-sm flex items-center">
                            {submitterDisplayName(selectedItem)}
                            {selectedItem.source !== 'Patient' && (
                              <span className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded
                                ${selectedItem.source === 'Clinician' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  selectedItem.source === 'Nurse' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                {selectedItem.authorRole}
                              </span>
                            )}
                          </div>
                          {selectedItem.source === 'Patient' && <div className="text-xs text-gray-500 mt-0.5">Patient Account</div>}
                          {selectedItem.isAnonymous && <div className="text-xs text-gray-500 mt-0.5">Submitted anonymously</div>}
                        </div>
                      </div>
                      {!selectedItem.isAnonymous && (
                        <button className="text-xs font-bold text-slate-600 hover:underline">
                          {selectedItem.source === 'Patient' ? 'View Patient Record' : 'View Staff Profile'}
                        </button>
                      )}
                    </div>
                    {selectedItem.source === 'Patient' && (
                      <div className="pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1.5 font-medium">
                        <div>Visit: <span className="font-bold text-gray-800">{selectedItem.visitDate}</span></div>
                        {selectedItem.clinician && <div>Clinician: <span className="text-gray-800">{selectedItem.clinician}</span></div>}
                        {selectedItem.nurse && <div>Nurse: <span className="text-gray-800">{selectedItem.nurse}</span></div>}
                      </div>
                    )}
                  </div>

                  {/* Ratings */}
                  {selectedItem.rating && (
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <div className="text-sm font-bold text-gray-700 mr-3">Overall Rating</div>
                        <div className="flex text-amber-400">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= selectedItem.rating! ? 'fill-current' : 'text-gray-200'}`} />)}
                        </div>
                        <span className="text-sm font-bold text-gray-800 ml-2">{selectedItem.rating}/5</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 font-medium">Facility Cleanliness</span>
                          <div className="flex text-amber-400">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= 5 ? 'fill-current' : 'text-gray-200'}`} />)}</div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 font-medium">Wait Time</span>
                          <div className="flex text-amber-400">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= 3 ? 'fill-current' : 'text-gray-200'}`} />)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
                    {selectedItem.body}
                  </div>
                </div>

                {/* Internal Notes Section */}
                <div className="bg-slate-50 border-t border-b border-gray-200 p-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Internal Notes</h3>
                  
                  {selectedItem.internalNotes && selectedItem.internalNotes.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {selectedItem.internalNotes.map((note, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded p-3 text-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-800 text-xs">{note.author}</span>
                            <span className="text-[10px] font-medium text-gray-400">{note.time}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic mb-4">No internal notes yet.</div>
                  )}

                  <div className="relative">
                    <textarea 
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Add an internal note... (not visible to submitter)"
                      className="w-full px-3 py-2 pb-10 border border-gray-300 rounded-lg text-sm outline-none focus:border-slate-400 bg-white resize-none"
                      rows={2}
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="absolute right-2 bottom-2 px-3 py-1 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => handleToggleFlag(selectedItem.id)}
                  className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors border
                    ${selectedItem.flagged ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  <Flag className={`w-4 h-4 mr-2 ${selectedItem.flagged ? 'fill-current' : ''}`} />
                  {selectedItem.flagged ? 'Flagged' : 'Flag for Follow-up'}
                </button>
                <div className="flex space-x-3">
                  <button onClick={() => handleUpdateStatus(selectedItem.id, 'Archived')} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                    Archive
                  </button>
                  {['New', 'In Review'].includes(selectedItem.status) && (
                    <button onClick={() => handleUpdateStatus(selectedItem.id, 'Resolved')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
