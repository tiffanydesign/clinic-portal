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
          <h1 className="text-2xl font-bold text-ink">Calendar - {role} View</h1>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-divider rounded-control text-sm bg-surface">Day</button>
            <button className="px-3 py-1 border border-divider rounded-control text-sm bg-surface-hover">Week</button>
          </div>
        </div>
        
        <div className="border border-divider bg-surface rounded-control flex flex-col h-[600px]">
          {/* Calendar Header */}
          <div className="flex border-b border-divider bg-surface-page h-10">
            <div className="w-20 border-r border-divider flex items-center justify-center text-xs text-ink-muted font-medium">Time</div>
            <div className="flex-1 border-r border-divider flex items-center justify-center text-sm font-medium">Dr. Adams</div>
            <div className="flex-1 border-r border-divider flex items-center justify-center text-sm font-medium">Dr. Clark</div>
            <div className="flex-1 flex items-center justify-center text-sm font-medium">Dr. Evans</div>
          </div>
          {/* Calendar Body (Mock) */}
          <div className="flex-1 flex relative overflow-y-auto">
            <div className="w-20 border-r border-divider flex flex-col">
              {['09:00', '10:00', '11:00', '12:00'].map(t => (
                <div key={t} className="h-32 border-b border-divider flex items-start justify-center pt-2 text-xs text-ink-muted">{t}</div>
              ))}
            </div>
            <div className="flex-1 flex relative">
              {/* Columns */}
              <div className="flex-1 border-r border-divider relative">
                {appointments.filter(a => a.assignedClinician === 'Dr. Adams').map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedApptId(a.id)}
                    className={`absolute left-2 right-2 p-2 border rounded-control cursor-pointer ${selectedApptId === a.id ? 'border-border-strong bg-surface-page ring-1 ring-info' : 'border-border-strong bg-surface hover:bg-surface-page'}`}
                    style={{ top: '10px', height: '60px' }}
                  >
                    <div className="text-xs font-bold text-ink">{a.time} - {a.type}</div>
                    <div className="text-xs text-ink-soft">{patients.find(p => p.id === a.patientId)?.name}</div>
                    <div className="text-label text-ink-muted mt-1 uppercase tracking-wider">{a.status}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 border-r border-divider relative">
                 {appointments.filter(a => a.assignedClinician === 'Dr. Clark').map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedApptId(a.id)}
                    className={`absolute left-2 right-2 p-2 border rounded-control cursor-pointer ${selectedApptId === a.id ? 'border-border-strong bg-surface-page ring-1 ring-info' : 'border-border-strong bg-surface hover:bg-surface-page'}`}
                    style={{ top: '75px', height: '60px' }}
                  >
                    <div className="text-xs font-bold text-ink">{a.time} - {a.type}</div>
                    <div className="text-xs text-ink-soft">{patients.find(p => p.id === a.patientId)?.name}</div>
                    <div className="text-label text-ink-muted mt-1 uppercase tracking-wider">{a.status}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 relative">
                 {appointments.filter(a => a.assignedClinician === 'Dr. Evans').map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedApptId(a.id)}
                    className={`absolute left-2 right-2 p-2 border rounded-control cursor-pointer ${selectedApptId === a.id ? 'border-border-strong bg-surface-page ring-1 ring-info' : 'border-border-strong bg-surface hover:bg-surface-page'}`}
                    style={{ top: '140px', height: '124px' }}
                  >
                    <div className="text-xs font-bold text-ink">{a.time} - {a.type}</div>
                    <div className="text-xs text-ink-soft">{patients.find(p => p.id === a.patientId)?.name}</div>
                    <div className="text-label text-ink-muted mt-1 uppercase tracking-wider">{a.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Drawer */}
      {selectedAppt && selectedPatient && (
        <div className="w-96 bg-surface border-l border-divider h-full flex flex-col shadow-xl z-10 shrink-0 animate-in slide-in-from-right">
          <div className="flex items-center justify-between p-4 border-b border-divider bg-surface-page">
            <h2 className="font-bold text-lg text-ink">Appointment Details</h2>
            <button onClick={() => setSelectedApptId(null)} className="p-1 hover:bg-surface-sunken rounded-control text-ink-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient Summary */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center text-lg font-bold text-ink-soft border border-divider">
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-ink">{selectedPatient.name}</div>
                <div className="text-sm text-ink-soft">ID: {selectedPatient.id} • {selectedPatient.age}y {selectedPatient.sex}</div>
                <Link to={`/patients/${selectedPatient.id}`} className="text-sm font-medium text-ink-soft hover:underline mt-1 inline-block">
                  Open Patient Record →
                </Link>
              </div>
            </div>

            {/* Appt Details */}
            <div className="border border-divider rounded-control p-4 space-y-3 text-sm">
              <div className="flex items-center text-ink-soft">
                <CalendarIcon className="w-4 h-4 mr-2 text-ink-muted" />
                <span className="font-medium mr-2">Type:</span> {selectedAppt.type}
              </div>
              <div className="flex items-center text-ink-soft">
                <Clock className="w-4 h-4 mr-2 text-ink-muted" />
                <span className="font-medium mr-2">Time:</span> {selectedAppt.time} ({selectedAppt.duration}m)
              </div>
              <div className="flex items-center text-ink-soft">
                <User className="w-4 h-4 mr-2 text-ink-muted" />
                <span className="font-medium mr-2">Clinician:</span> {selectedAppt.assignedClinician}
              </div>
              <div className="flex items-center text-ink-soft">
                <MapPin className="w-4 h-4 mr-2 text-ink-muted" />
                <span className="font-medium mr-2">Room:</span> {selectedAppt.room}
              </div>
              <div className="mt-2 pt-2 border-t border-divider flex items-center justify-between">
                <span className="font-medium text-ink-soft">Status:</span>
                <span className="px-2 py-0.5 bg-surface-hover border border-divider rounded-control text-xs font-bold uppercase text-ink-soft">
                  {selectedAppt.status}
                </span>
              </div>
            </div>

            {/* Reception Check-in Gate */}
            <div className="border border-divider rounded-control p-4 space-y-4">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider mb-2">Requirements</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-ink-muted" />
                  <span className="text-sm text-ink-soft">Payment</span>
                </div>
                {selectedPatient.paymentComplete ? (
                  <span className="text-sm font-bold text-ink-soft">Complete</span>
                ) : (
                  <button onClick={handleSendPayment} className="text-xs px-2 py-1 border border-border-strong rounded-control bg-surface hover:bg-surface-page text-ink-soft">
                    Start Transaction
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-ink-muted" />
                  <span className="text-sm text-ink-soft">Forms</span>
                </div>
                {selectedPatient.formsSigned ? (
                  <span className="text-sm font-bold text-ink-soft">Signed</span>
                ) : (
                  <button onClick={handleSendForm} className="text-xs px-2 py-1 border border-border-strong rounded-control bg-surface hover:bg-surface-page text-ink-soft">
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
                  className={`w-full py-2 border rounded-control font-medium text-sm transition-colors
                    ${(!selectedPatient.paymentComplete || !selectedPatient.formsSigned) 
                      ? 'border-divider bg-surface-hover text-ink-muted cursor-not-allowed' 
                      : selectedAppt.status === 'Checked In'
                      ? 'border-border-strong bg-surface-sunken text-ink-soft cursor-not-allowed'
                      : 'border-border-strong bg-ink text-white'
                    }`}
                >
                  {selectedAppt.status === 'Checked In' ? 'Checked In' : 'Check In Patient'}
                </button>
                <div className="flex space-x-2">
                  <button className="flex-1 py-2 border border-divider rounded-control text-sm font-medium bg-surface hover:bg-surface-page text-ink-soft">
                    Reschedule
                  </button>
                  {role === 'Admin' && (
                    <button className="flex-1 py-2 border border-divider rounded-control text-sm font-medium bg-surface hover:bg-surface-page text-ink-soft">
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
