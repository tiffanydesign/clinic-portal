import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FlaskConical, Map, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";

// Reviewer-only affordances (Site Map, Demo Role switcher) used to live in
// the global top bar. Now that the shell is sidebar-only, they float here
// instead of taking a permanent slot in the primary nav — and the whole
// component is gone from a real production build (see IS_DEMO_BUILD in
// AppShell). Collapsed by default so it doesn't compete with the actual UI.
export function DemoControlsPill() {
  const { role, setRole } = useAppContext();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as any);
    navigate("/dashboard");
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        aria-label="Open demo controls"
        title="Demo controls"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-slate-800/90 text-white shadow-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
      >
        <FlaskConical className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          <FlaskConical className="w-3.5 h-3.5" /> Demo Controls
        </span>
        <button
          onClick={() => setExpanded(false)}
          aria-label="Collapse demo controls"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <Link
          to="/site-map"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
        >
          <Map className="w-4 h-4" /> Site Map
        </Link>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Demo Role</div>
          <select
            value={role}
            onChange={handleRoleChange}
            className="w-full border border-gray-300 rounded text-sm px-2 py-1.5 outline-none focus:border-slate-500 bg-white"
          >
            <option value="Admin">Admin</option>
            <option value="Reception">Reception</option>
            <option value="Nurse">Nurse</option>
            <option value="Clinician">Clinician</option>
          </select>
        </div>
      </div>
    </div>
  );
}
