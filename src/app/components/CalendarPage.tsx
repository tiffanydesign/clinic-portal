import React, { useState } from "react";
import { useAppContext, Appointment } from "../context/AppContext";
import { X, User, Calendar as CalendarIcon, Clock, MapPin, FileText, CreditCard } from "lucide-react";
import { Link } from "react-router";

export function CalendarPage() {
  const { role, appointments, patients, updatePatient, updateAppointment } = useAppContext();
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  const selectedAppt = appointments.find(a => a.id === selectedApptId);
  const selectedPatient = selectedAppt ? patients.find(p => p.id === selectedAppt.patientId) : null;

  const handleCheckIn = () => {
    if (selectedAppt) {
      updateAppointment({ ...selectedAppt, status: "Checked In" });
    }
  };

  const handleSendPayment = () => {
    if (selectedPatient) {
      updatePatient({ ...selectedPatient, paymentComplete: true });
    }
  };

  const handleSendForm = () => {
    if (selectedPatient) {
      updatePatient({ ...selectedPatient, formsSigned: true });
    }
  };

  return (
    <div className="flex h-full w-full relative">
      {/* Calendar View */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Calendar - {role} View</h1>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-white">Day</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-100">Week</button>
          </div>
        </div>
        
        <div className="border border-gray-300 bg-white rounded flex flex-col h-[600px]">
          {/* Calendar Header */}
          <div className="flex border-b border-gray-300 bg-gray-50 h-10">
            <div className="w-20 border-r border-gray-300 flex items-center justify-center text-xs text-gray-500 font-medium">Time</div>
            <div className="flex-1 border-r border-gray-300 flex items-center justify-center text-sm font-medium">Dr. Adams</div>
            <div className="flex-1 border-r border-gray-300 flex items-center justify-center text-sm font-medium">Dr. Clark</div>
            <div className="flex-1 flex items-center justify-center text-sm font-medium">Dr. Evans</div>
          </div>
          {/* Calendar Body (Mock) */}
          <div className="flex-1 flex relative overflow-y-auto">
            <div className="w-20 border-r border-gray-300 flex flex-col">
              {['09:00', '10:00', '11:00', '12:00'].map(t => (
                <div key={t} className="h-32 border-b border-gray-200 flex items-start justify-center pt-2 text-xs text-gray-500">{t}</div>
              ))}
            </div>
            <div className="flex-1 flex relative">
              {/* Columns */}
              <div className="flex-1 border-r border-gray-200 relative">
                {appointments.filter(a => a.assignedClinician === 'Dr. Adams').map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedApptId(a.id)}
                    className={`absolute left-2 right-2 p-2 border rounded cursor-pointer ${selectedApptId === a.id ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500' : 'border-gray-400 bg-white hover:bg-gray-50'}`}
                    style={{ top: '10px', height: '60px' }}
                  >
                    <div className="text-xs font-bold text-gray-800">{a.time} - {a.type}</div>
                    <div className="text-xs text-gray-600">{patients.find(p => p.id === a.patientId)?.name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{a.status}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 border-r border-gray-200 relative">
                 {appointments.filter(a => a.assignedClinician === 'Dr. Clark').map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedApptId(a.id)}
                    className={`absolute left-2 right-2 p-2 border rounded cursor-pointer ${selectedApptId === a.id ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500' : 'border-gray-400 bg-white hover:bg-gray-50'}`}
                    style={{ top: '75px', height: '60px' }}
                  >
                    <div className="text-xs font-bold text-gray-800">{a.time} - {a.type}</div>
                    <div className="text-xs text-gray-600">{patients.find(p => p.id === a.patientId)?.name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{a.status}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 relative">
                 {appointments.filter(a => a.assignedClinician === 'Dr. Evans').map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedApptId(a.id)}
                    className={`absolute left-2 right-2 p-2 border rounded cursor-pointer ${selectedApptId === a.id ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500' : 'border-gray-400 bg-white hover:bg-gray-50'}`}
                    style={{ top: '140px', height: '124px' }}
                  >
                    <div className="text-xs font-bold text-gray-800">{a.time} - {a.type}</div>
                    <div className="text-xs text-gray-600">{patients.find(p => p.id === a.patientId)?.name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{a.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Drawer */}
      {selectedAppt && selectedPatient && (
        <div className="w-96 bg-white border-l border-gray-300 h-full flex flex-col shadow-xl z-10 shrink-0 animate-in slide-in-from-right">
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
            <h2 className="font-bold text-lg text-gray-800">Appointment Details</h2>
            <button onClick={() => setSelectedApptId(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient Summary */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border border-gray-300">
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-800">{selectedPatient.name}</div>
                <div className="text-sm text-gray-600">ID: {selectedPatient.id} • {selectedPatient.age}y {selectedPatient.sex}</div>
                <Link to={`/patients/${selectedPatient.id}`} className="text-sm font-medium text-slate-600 hover:underline mt-1 inline-block">
                  Open Patient Record →
                </Link>
              </div>
            </div>

            {/* Appt Details */}
            <div className="border border-gray-300 rounded p-4 space-y-3 text-sm">
              <div className="flex items-center text-gray-700">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Type:</span> {selectedAppt.type}
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Time:</span> {selectedAppt.time} ({selectedAppt.duration}m)
              </div>
              <div className="flex items-center text-gray-700">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Clinician:</span> {selectedAppt.assignedClinician}
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Room:</span> {selectedAppt.room}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-bold uppercase text-gray-700">
                  {selectedAppt.status}
                </span>
              </div>
            </div>

            {/* Reception Check-in Gate */}
            <div className="border border-gray-300 rounded p-4 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Requirements</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Payment</span>
                </div>
                {selectedPatient.paymentComplete ? (
                  <span className="text-sm font-bold text-slate-600">Complete</span>
                ) : (
                  <button onClick={handleSendPayment} className="text-xs px-2 py-1 border border-gray-400 rounded bg-white hover:bg-gray-50 text-gray-700">
                    Start Transaction
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Forms</span>
                </div>
                {selectedPatient.formsSigned ? (
                  <span className="text-sm font-bold text-slate-600">Signed</span>
                ) : (
                  <button onClick={handleSendForm} className="text-xs px-2 py-1 border border-gray-400 rounded bg-white hover:bg-gray-50 text-gray-700">
                    Send Form
                  </button>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
               <button 
                  onClick={handleCheckIn}
                  disabled={!selectedPatient.paymentComplete || !selectedPatient.formsSigned || selectedAppt.status === 'Checked In'}
                  className={`w-full py-2 border rounded font-medium text-sm transition-colors
                    ${(!selectedPatient.paymentComplete || !selectedPatient.formsSigned) 
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : selectedAppt.status === 'Checked In'
                      ? 'border-slate-500 bg-slate-500 text-white cursor-not-allowed'
                      : 'border-slate-600 bg-slate-600 text-white hover:bg-slate-700'
                    }`}
                >
                  {selectedAppt.status === 'Checked In' ? 'Checked In' : 'Check In Patient'}
                </button>
                <div className="flex space-x-2">
                  <button className="flex-1 py-2 border border-gray-300 rounded text-sm font-medium bg-white hover:bg-gray-50 text-gray-700">
                    Reschedule
                  </button>
                  {role === 'Admin' && (
                    <button className="flex-1 py-2 border border-gray-300 rounded text-sm font-medium bg-white hover:bg-gray-50 text-gray-700">
                      Cancel
                    </button>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
