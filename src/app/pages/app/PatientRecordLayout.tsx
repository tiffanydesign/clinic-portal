import React from "react";
import { Link, useLocation, useParams, Outlet } from "react-router";
import { Phone, Mail, ChevronLeft, Calendar as CalendarIcon, FileText, CheckCircle2 } from "lucide-react";
import { MOCK_PATIENTS } from "./PatientsPage";

export function PatientRecordLayout({ children }: { children?: React.ReactNode }) {
  const { patientId } = useParams();
  const location = useLocation();
  
  // Find mock patient or fallback
  const patient = MOCK_PATIENTS.find(p => p.patientId === patientId) || MOCK_PATIENTS[0];

  const tabs = [
    { label: "Overview", path: `/patients/${patientId}/overview` },
    { label: "Results", path: `/patients/${patientId}/results` },
    { label: "Journeys", path: `/patients/${patientId}/journeys` },
    { label: "Signed Forms", path: `/patients/${patientId}/signed-forms` },
    { label: "Clinician Notes", path: `/patients/${patientId}/notes` },
    { label: "Appointments", path: `/patients/${patientId}/appointments` },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Top Nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center shrink-0 z-20 shadow-sm relative">
        <Link to="/patients" className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Patients
        </Link>
      </div>

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0 z-10 relative">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-100 flex items-center justify-center text-3xl font-bold text-white shadow-sm shrink-0">
            {patient.avatar}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800 mr-4">{patient.name}</h1>
                <span className={`px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wider rounded-md`}>
                  {patient.status}
                </span>
                {patient.group !== '—' && (
                  <span className={`ml-2 px-2.5 py-1 text-[10px] font-bold rounded-md
                    ${patient.group === 'VIP' ? 'bg-amber-100 text-amber-800' : 
                      patient.group === 'Corporate' ? 'bg-blue-100 text-blue-800' : 
                      patient.group === 'Insurance' ? 'bg-emerald-100 text-emerald-800' : 
                      'bg-gray-200 text-gray-700'}`}>
                    {patient.group}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                  Edit Details
                </button>
                <button className="px-4 py-2 bg-slate-600 text-white rounded text-sm font-bold hover:bg-slate-700 shadow-sm transition-colors">
                  Book Appointment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-y-3 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Patient ID</span>
                <span className="font-bold text-gray-700 font-mono">{patient.patientId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Age / Sex</span>
                <span className="font-medium text-gray-700">{patient.age} years · {patient.sex}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</span>
                <div className="flex items-center text-blue-600 hover:underline cursor-pointer font-medium mb-0.5">
                  <Phone className="w-3 h-3 mr-1.5" /> {patient.phone}
                </div>
                <div className="flex items-center text-gray-500 hover:text-gray-800 cursor-pointer text-xs">
                  <Mail className="w-3 h-3 mr-1.5" /> {patient.email}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Care Team</span>
                <span className="font-medium text-gray-700 mb-0.5">{patient.clinician || 'Unassigned Clinician'}</span>
                <span className="text-xs text-gray-500">{patient.nurse || 'Unassigned Nurse'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Vitals / Quick Stats bar could go here in future */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-6">
          <div className="flex items-center text-xs font-medium text-gray-600"><CalendarIcon className="w-4 h-4 text-gray-400 mr-2"/> Last Visit: <span className="font-bold text-gray-800 ml-1">{patient.lastVisit}</span></div>
          <div className="flex items-center text-xs font-medium text-gray-600"><CalendarIcon className="w-4 h-4 text-gray-400 mr-2"/> Next Appt: <span className="font-bold text-gray-800 ml-1">{patient.nextAppt || 'None'}</span></div>
          <div className="flex items-center text-xs font-medium text-gray-600"><FileText className="w-4 h-4 text-gray-400 mr-2"/> Clinical Notes: <span className="font-bold text-gray-800 ml-1">{patient.notesCount || 0}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8 flex space-x-8 shrink-0">
        {tabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`py-3.5 text-sm font-bold border-b-[3px] transition-colors ${isActive ? 'border-slate-600 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-auto p-8">
        {children || <Outlet />}
      </div>
    </div>
  );
}
