import React, { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ChevronRight, Plus, Pencil, Trash2, CreditCard, AlertTriangle, X } from "lucide-react";
import {
  Terminal, TerminalStatus, TERMINAL_MODELS, terminalStatusRank,
} from "../paymentTerminalsData";
import {
  useTerminals, getPendingTransactions, addTerminal, updateTerminal, removeTerminal, NewTerminalInput,
} from "../paymentTerminalsStore";

function compactDuration(lastSeen: string): string {
  const hourMatch = lastSeen.match(/(\d+)\s*hour/);
  if (hourMatch) return `${hourMatch[1]}h`;
  const minMatch = lastSeen.match(/(\d+)\s*min/);
  if (minMatch) return `${minMatch[1]}m`;
  return lastSeen;
}

function StatusBadge({ status, lastSeen }: { status: TerminalStatus; lastSeen: string }) {
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
      </span>
    );
  }
  if (status === "needs-attention") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Needs attention · Offline {compactDuration(lastSeen)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 border border-gray-200 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline
    </span>
  );
}

function AddTerminalModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: NewTerminalInput) => void }) {
  const [label, setLabel] = useState("");
  const [model, setModel] = useState(TERMINAL_MODELS[0]);
  const [serialNumber, setSerialNumber] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500";
  const labelCls = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2";

  const handleSubmit = () => {
    if (!label.trim() || !serialNumber.trim() || !assignedTo.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onCreate({ label: label.trim(), model, serialNumber: serialNumber.trim(), assignedTo: assignedTo.trim() });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Add Terminal</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Label <span className="text-red-500">*</span></label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Front Desk 5" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className={`${inputCls} bg-white`}>
              {TERMINAL_MODELS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Serial Number <span className="text-red-500">*</span></label>
            <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. WPE-4471-AB" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Assigned To <span className="text-red-500">*</span></label>
            <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="e.g. Reception 5" className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors">
            Add Terminal
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTerminalModal({ terminal, onClose, onSave }: { terminal: Terminal; onClose: () => void; onSave: (label: string, assignedTo: string) => void }) {
  const [label, setLabel] = useState(terminal.label);
  const [assignedTo, setAssignedTo] = useState(terminal.assignedTo);

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-slate-500";
  const labelCls = "block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2";

  const handleSubmit = () => {
    if (!label.trim() || !assignedTo.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSave(label.trim(), assignedTo.trim());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Edit Terminal</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Serial Number</label>
            <input type="text" value={terminal.serialNumber} disabled className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelCls}>Assigned To</label>
            <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveTerminalModal({ terminal, onClose, onConfirm }: { terminal: Terminal; onClose: () => void; onConfirm: () => void }) {
  const pending = getPendingTransactions(terminal.id);
  const hasPending = pending.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        {hasPending ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-start gap-3 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <h2 className="text-base font-bold text-red-800">This terminal has unresolved transactions</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {pending.map((tx, i) => (
                  <div key={i} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-800 truncate">{tx.patient}</div>
                      <div className="text-xs text-gray-500">{tx.initiatedAt} · {tx.status}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-800 shrink-0">{tx.amount}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Removing this terminal won't cancel these payments, but you won't be able to retry them from this device.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={onConfirm} className="px-5 py-2 rounded text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Remove anyway
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <h2 className="text-base font-bold text-gray-800 mb-1.5">Are you sure you want to remove {terminal.label}?</h2>
              <p className="text-sm text-gray-500">This terminal will no longer be available for taking payments at reception.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 bg-white hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={onConfirm} className="px-5 py-2 rounded text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors">
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PaymentTerminalsPage() {
  const terminals = useTerminals();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Terminal | null>(null);
  const [removing, setRemoving] = useState<Terminal | null>(null);

  const sorted = [...terminals].sort((a, b) => terminalStatusRank(a.status) - terminalStatusRank(b.status));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="px-8 py-6 border-b border-gray-200 shrink-0 flex justify-between items-start bg-white">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
            <Link to="/clinic-settings" className="hover:text-slate-600 hover:underline">Clinic Settings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-bold">Payment Terminals</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Terminals</h1>
          <p className="text-sm text-gray-500 mt-1">Devices used to collect in-person payments at reception</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Terminal
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No terminals registered yet</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">Add your first payment terminal to start accepting in-person payments</p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-slate-600 text-white rounded-lg text-base font-bold hover:bg-slate-700 transition-colors shadow-sm"
            >
              Add Terminal
            </button>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Label</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Model</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Serial Number</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Assigned To</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Status</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Last Seen</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sorted.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-800">{t.label}</td>
                    <td className="px-4 py-3 text-gray-600">{t.model}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.serialNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{t.assignedTo}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} lastSeen={t.lastSeen} /></td>
                    <td className="px-4 py-3 text-gray-500">{t.lastSeen}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(t)} className="p-1.5 text-gray-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setRemoving(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddTerminalModal
          onClose={() => setShowAdd(false)}
          onCreate={(input) => {
            addTerminal(input);
            setShowAdd(false);
            toast.success(`${input.label} added and online.`);
          }}
        />
      )}

      {editing && (
        <EditTerminalModal
          terminal={editing}
          onClose={() => setEditing(null)}
          onSave={(label, assignedTo) => {
            updateTerminal(editing.id, { label, assignedTo });
            setEditing(null);
            toast.success("Terminal updated.");
          }}
        />
      )}

      {removing && (
        <RemoveTerminalModal
          terminal={removing}
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            removeTerminal(removing.id);
            toast.success(`${removing.label} removed.`);
            setRemoving(null);
          }}
        />
      )}
    </div>
  );
}
