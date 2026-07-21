import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { useAppContext } from "../context/AppContext";
import { User, Phone, Mail, Calendar as CalendarIcon, Clock, ChevronLeft } from "lucide-react";

export function PatientRecord() {
  const { id } = useParams();
  const { patients } = useAppContext();
  const patient = patients.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState("Overview");

  if (!patient) {
    return <div className="p-4 text-center text-ink-muted">Patient not found</div>;
  }

  const tabs = ["Overview", "Results", "Journeys", "Signed Forms", "Clinician Notes", "Appointments"];

  return (
    <div className="flex flex-col h-full bg-surface-page overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-surface border-b border-divider p-4 shrink-0 flex items-center">
        <Link to="/patients" className="flex items-center text-sm font-medium text-ink-soft hover:text-ink">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Patients
        </Link>
      </div>

      {/* Sticky Header */}
      <div className="bg-surface border-b border-divider p-6 shrink-0 shadow-sm z-10">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 rounded-full bg-surface-sunken border-2 border-divider flex items-center justify-center text-3xl font-bold text-ink-muted">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-ink">{patient.name}</h1>
              <span className="px-3 py-1 bg-surface-hover border border-divider text-xs font-bold uppercase tracking-wider rounded-control text-ink-soft">
                {patient.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-y-2 gap-x-8 mt-4">
              <div className="text-sm">
                <span className="text-ink-muted mr-2">ID:</span>
                <span className="font-medium text-ink">{patient.id}</span>
              </div>
              <div className="text-sm">
                <span className="text-ink-muted mr-2">DOB:</span>
                <span className="font-medium text-ink">{patient.dob} ({patient.age}y)</span>
              </div>
              <div className="text-sm">
                <span className="text-ink-muted mr-2">Sex:</span>
                <span className="font-medium text-ink">{patient.sex}</span>
              </div>
              <div className="text-sm flex items-center">
                <Phone className="w-4 h-4 text-ink-muted mr-2" />
                <span className="font-medium text-ink">{patient.phone}</span>
              </div>
              <div className="text-sm flex items-center">
                <Mail className="w-4 h-4 text-ink-muted mr-2" />
                <span className="font-medium text-ink">{patient.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-ink-muted mr-2">Clinician:</span>
                <span className="font-medium text-ink">{patient.assignedClinician}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-surface border-b border-divider px-6 flex space-x-8 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-border-strong text-ink' : 'border-transparent text-ink-muted hover:text-ink-soft hover:border-divider'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-divider bg-surface rounded-control p-4">
                <h3 className="font-bold text-ink-soft mb-4 border-b border-divider pb-2">Recent Visits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink-soft">Last Visit</span>
                    <span className="font-medium">{patient.lastVisit}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink-soft">Next Appt</span>
                    <span className="font-medium">{patient.nextAppointment}</span>
                  </div>
                </div>
              </div>
              <div className="border border-divider bg-surface rounded-control p-4">
                 <h3 className="font-bold text-ink-soft mb-4 border-b border-divider pb-2">Vitals Summary</h3>
                 <div className="h-20 border border-divider border-dashed bg-surface-page rounded-control flex items-center justify-center text-sm text-ink-muted">
                   Chart Placeholder
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Journeys" && (
          <div className="border border-divider bg-surface rounded-control p-6">
            <h3 className="font-bold text-ink mb-6">Today's Journey</h3>
            <div className="relative">
               <div className="absolute top-4 left-4 bottom-4 w-0.5 bg-surface-sunken"></div>
               {['Consent', 'Changing Room', 'Scan', 'Sample Collection', 'Home Kit'].map((step, idx) => (
                 <div key={step} className="flex items-start mb-6 relative">
                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-surface
                    ${idx < 2 ? 'border-border-strong text-ink-soft' : idx === 2 ? 'border-ink bg-ink text-white' : 'border-divider text-ink-muted'}`}>
                     {idx + 1}
                   </div>
                   <div className="ml-4 flex-1 border border-divider rounded-control p-4 bg-surface-page">
                     <div className="font-bold text-ink">{step}</div>
                     {idx === 2 && <div className="text-sm text-ink-muted mt-1">Currently in progress...</div>}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === "Results" && (
          <div className="h-64 border border-divider bg-surface rounded-control flex items-center justify-center flex-col text-ink-muted">
             <div className="font-bold text-lg mb-2 text-ink-muted">Digital Twin - to be designed</div>
             <p className="text-sm">Placeholder for patient results and digital twin visualization.</p>
          </div>
        )}

        {activeTab === "Signed Forms" && (
          <div className="border border-divider bg-surface rounded-control overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-surface-page border-b border-divider">
                 <tr>
                   <th className="p-3 font-semibold text-ink-soft">Form Name</th>
                   <th className="p-3 font-semibold text-ink-soft">Type</th>
                   <th className="p-3 font-semibold text-ink-soft">Signed Date</th>
                   <th className="p-3 font-semibold text-ink-soft">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-divider">
                 <tr>
                   <td className="p-3 font-medium">General Consent</td>
                   <td className="p-3 text-ink-soft">Consent</td>
                   <td className="p-3 text-ink-soft">2024-05-10</td>
                   <td className="p-3"><button className="text-ink-soft hover:underline">View PDF</button></td>
                 </tr>
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
