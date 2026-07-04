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
    return <div className="p-8 text-center text-gray-500">Patient not found</div>;
  }

  const tabs = ["Overview", "Results", "Journeys", "Signed Forms", "Clinician Notes", "Appointments"];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-300 p-4 shrink-0 flex items-center">
        <Link to="/patients" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Patients
        </Link>
      </div>

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-300 p-6 shrink-0 shadow-sm z-10">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-3xl font-bold text-gray-500">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">{patient.name}</h1>
              <span className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs font-bold uppercase tracking-wider rounded text-gray-600">
                {patient.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-y-2 gap-x-8 mt-4">
              <div className="text-sm">
                <span className="text-gray-500 mr-2">ID:</span>
                <span className="font-medium text-gray-800">{patient.id}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 mr-2">DOB:</span>
                <span className="font-medium text-gray-800">{patient.dob} ({patient.age}y)</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 mr-2">Sex:</span>
                <span className="font-medium text-gray-800">{patient.sex}</span>
              </div>
              <div className="text-sm flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-800">{patient.phone}</span>
              </div>
              <div className="text-sm flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-800">{patient.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 mr-2">Clinician:</span>
                <span className="font-medium text-gray-800">{patient.assignedClinician}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-300 px-6 flex space-x-8 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-slate-600 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="border border-gray-300 bg-white rounded p-4">
                <h3 className="font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2">Recent Visits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Last Visit</span>
                    <span className="font-medium">{patient.lastVisit}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Next Appt</span>
                    <span className="font-medium">{patient.nextAppointment}</span>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300 bg-white rounded p-4">
                 <h3 className="font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2">Vitals Summary</h3>
                 <div className="h-20 border border-gray-200 border-dashed bg-gray-50 rounded flex items-center justify-center text-sm text-gray-400">
                   Chart Placeholder
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Journeys" && (
          <div className="border border-gray-300 bg-white rounded p-6">
            <h3 className="font-bold text-gray-800 mb-6">Today's Journey</h3>
            <div className="relative">
               <div className="absolute top-4 left-4 bottom-4 w-0.5 bg-gray-200"></div>
               {['Consent', 'Changing Room', 'Scan', 'Sample Collection', 'Home Kit'].map((step, idx) => (
                 <div key={step} className="flex items-start mb-6 relative">
                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-white
                    ${idx < 2 ? 'border-slate-500 text-slate-600' : idx === 2 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-400'}`}>
                     {idx + 1}
                   </div>
                   <div className="ml-4 flex-1 border border-gray-200 rounded p-4 bg-gray-50">
                     <div className="font-bold text-gray-800">{step}</div>
                     {idx === 2 && <div className="text-sm text-gray-500 mt-1">Currently in progress...</div>}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === "Results" && (
          <div className="h-64 border border-gray-300 bg-white rounded flex items-center justify-center flex-col text-gray-400">
             <div className="font-bold text-lg mb-2 text-gray-500">Digital Twin - to be designed</div>
             <p className="text-sm">Placeholder for patient results and digital twin visualization.</p>
          </div>
        )}

        {activeTab === "Signed Forms" && (
          <div className="border border-gray-300 bg-white rounded overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                   <th className="p-3 font-semibold text-gray-600">Form Name</th>
                   <th className="p-3 font-semibold text-gray-600">Type</th>
                   <th className="p-3 font-semibold text-gray-600">Signed Date</th>
                   <th className="p-3 font-semibold text-gray-600">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 <tr>
                   <td className="p-3 font-medium">General Consent</td>
                   <td className="p-3 text-gray-600">Consent</td>
                   <td className="p-3 text-gray-600">2024-05-10</td>
                   <td className="p-3"><button className="text-slate-600 hover:underline">View PDF</button></td>
                 </tr>
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
