import React from "react";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router";
import { 
  Lock, TrendingUp, AlertCircle, Clock, Video, 
  FileText, CheckCircle2, ChevronRight, Activity, 
  Calendar as CalendarIcon, MapPin, Check, X, AlertTriangle 
} from "lucide-react";

// --- Shared Components ---

function KPICard({ label, value, locked = false, vs = "last week", trend = "up" }: { label: string, value: string | number, locked?: boolean, vs?: string, trend?: "up" | "down" }) {
  return (
    <div className="border border-gray-300 rounded bg-white p-5 flex flex-col justify-between relative cursor-pointer hover:border-slate-400 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {locked && <Lock className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="flex items-center mt-3 text-xs text-gray-500 font-medium">
        <TrendingUp className={`w-3.5 h-3.5 mr-1.5 ${trend === 'down' ? 'rotate-180' : ''}`} />
        vs {vs}
      </div>
    </div>
  );
}

function Section({ title, children, className = "", action }: { title: React.ReactNode, children: React.ReactNode, className?: string, action?: React.ReactNode }) {
  return (
    <div className={`border border-gray-300 rounded bg-white flex flex-col ${className}`}>
      <div className="h-14 border-b border-gray-200 px-5 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-gray-800 flex items-center">{title}</h3>
        {action}
      </div>
      <div className="p-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function StatusPill({ status, type = "default" }: { status: string, type?: "default" | "success" | "warning" | "error" }) {
  let style = "bg-gray-100 border-gray-200 text-gray-600";
  if (type === "success") style = "bg-slate-100 border-slate-300 text-slate-700";
  if (type === "warning") style = "bg-gray-100 border-gray-400 text-gray-800";
  if (type === "error") style = "bg-red-50 border-red-200 text-red-700"; // Specific exception for SLA

  return (
    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {status}
    </span>
  );
}

// --- Role Dashboards ---

function AdminDashboard() {
  const timeline = [
    { time: "09:00 AM", type: "Consult", patient: "Alice Smith", room: "Room 1", status: "COMPLETED" },
    { time: "09:30 AM", type: "Scan", patient: "Bob Johnson", room: "MRI A", status: "IN CLINIC" },
    { time: "10:00 AM", type: "Sample", patient: "Carol Williams", room: "Lab 2", status: "CHECKED IN" },
    { time: "10:30 AM", type: "Consult", patient: "David Brown", room: "Room 3", status: "BOOKED" },
    { time: "11:00 AM", type: "Consult", patient: "Eva Davis", room: "Room 1", status: "CANCELLED" },
  ];

  const resultsQueue = [
    { patient: "Frank Miller", test: "Comprehensive Blood", days: 3, breach: false },
    { patient: "Grace Lee", test: "Genetic Panel", days: 14, breach: true },
    { patient: "Henry Wilson", test: "Hormone Screen", days: 2, breach: false },
  ];

  const waitingRoom = [
    { patient: "Bob Johnson", checkIn: "09:15 AM", wait: "15m", step: "Awaiting Scan", nurse: "Nurse Betty" },
    { patient: "Carol Williams", checkIn: "09:50 AM", wait: "10m", step: "Awaiting Sample", nurse: "Nurse Dave" },
  ];

  const activities = [
    { time: "10:05 AM", user: "Reception (Sarah)", action: "Checked in Carol Williams" },
    { time: "09:55 AM", user: "Dr. Adams", action: "Completed consultation for Alice Smith" },
    { time: "09:40 AM", user: "System", action: "Automated reminder sent to David Brown" },
    { time: "09:15 AM", user: "Reception (Sarah)", action: "Checked in Bob Johnson" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <KPICard label="Appointments Today" value={42} locked vs="last Monday" />
        <KPICard label="Results Pending Review" value={12} locked vs="yesterday" trend="down" />
        <KPICard label="Checked In Now" value={8} vs="avg" />
        <KPICard label="Utilisation" value="85%" vs="last week" />
      </div>

      <div className="flex gap-6">
        {/* Left Col - 60% */}
        <div className="w-[60%] flex flex-col space-y-6">
          <Section title="Today's Clinic" className="h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600">Time</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Patient</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Room</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeline.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 cursor-pointer group">
                    <td className="px-5 py-3 text-gray-500 font-medium">{row.time}</td>
                    <td className="px-5 py-3 text-gray-600">{row.type}</td>
                    <td className="px-5 py-3 font-medium text-slate-700 group-hover:underline">
                      <Link to="/patients/P-001" className="block">{row.patient}</Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{row.room}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={row.status} type={row.status === 'COMPLETED' ? 'success' : row.status === 'CANCELLED' ? 'warning' : 'default'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Activity Feed" className="h-[240px]">
            <div className="p-5 space-y-4">
              {activities.map((act, i) => (
                <div key={i} className="flex items-start">
                  <div className="w-20 shrink-0 text-xs text-gray-400 font-medium pt-0.5">{act.time}</div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-700 mr-2">{act.user}</span>
                    <span className="text-sm text-gray-600">{act.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right Col - 40% */}
        <div className="w-[40%] flex flex-col space-y-6">
          <Section title="Results Queue (Pending)" className="h-[250px]">
            <div className="divide-y divide-gray-100">
              {resultsQueue.map((res, i) => (
                <Link key={i} to="/patients/P-001/results" className="block p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-slate-700 text-sm">{res.patient}</div>
                    {res.breach ? (
                      <span className="text-xs font-bold text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> SLA Breach</span>
                    ) : (
                      <span className="text-xs text-gray-500">{res.days} days waiting</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{res.test}</div>
                </Link>
              ))}
            </div>
          </Section>

          <Section title="Waiting Room" className="h-[220px]">
            <div className="divide-y divide-gray-100">
              {waitingRoom.map((wait, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-0.5">{wait.patient}</div>
                    <div className="text-xs text-gray-500">In: {wait.checkIn} • {wait.step}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800">{wait.wait}</div>
                    <div className="text-xs text-gray-400">{wait.nurse}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="bg-gray-100 border border-gray-300 rounded p-5 relative overflow-hidden shrink-0">
            <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4 mr-2" /> Phenome AI · Insight
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              Clinic is running 15 mins behind schedule in Room 1. 
              Recommended action: reassign Dr. Evans' 11:00 AM consultation to Dr. Clark to prevent cascading delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceptionDashboard() {
  const arrivals = [
    { patient: "Alice Smith", time: "09:00 AM", type: "Consult", checkIn: true, consent: true, pay: true },
    { patient: "Bob Johnson", time: "09:30 AM", type: "Scan", checkIn: false, consent: true, pay: true },
    { patient: "Carol Williams", time: "10:00 AM", type: "Sample", checkIn: false, consent: false, pay: true },
  ];

  const checkinQueue = [
    { patient: "Bob Johnson", time: "09:30 AM", ready: true },
    { patient: "Carol Williams", time: "10:00 AM", ready: false, reason: "Missing Consent" },
  ];

  const payments = [
    { patient: "David Brown", amount: "$150.00", status: "Pending" },
    { patient: "Eva Davis", amount: "$45.00", status: "Pending" },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <KPICard label="Arrivals Expected" value={15} locked vs="yesterday" />
        <KPICard label="Checked In" value={27} locked vs="yesterday" />
        <KPICard label="In Clinic Now" value={12} vs="avg" />
        <KPICard label="Unpaid Balances" value={3} trend="down" vs="last week" />
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Col */}
        <div className="w-[60%] flex flex-col">
          <Section 
            title="Today's Calendar" 
            className="h-full"
            action={<button className="px-3 py-1.5 bg-slate-600 text-white text-xs font-bold rounded hover:bg-slate-700 transition-colors">Book Appointment</button>}
          >
            <div className="relative h-full flex">
              <div className="w-16 border-r border-gray-200 flex flex-col shrink-0">
                {['09:00', '10:00', '11:00', '12:00', '13:00'].map(t => (
                  <div key={t} className="h-24 border-b border-gray-100 flex items-start justify-center pt-2 text-xs text-gray-400">{t}</div>
                ))}
              </div>
              <div className="flex-1 relative overflow-y-auto">
                <Link to="/calendar/appointment/A-101" className="absolute top-4 left-4 right-4 h-[80px] bg-white border border-gray-300 rounded p-3 shadow-sm hover:border-slate-400 group">
                  <div className="text-xs font-bold text-slate-700 mb-1">09:00 - 09:30 • Consult</div>
                  <div className="text-sm font-bold text-gray-800 group-hover:underline">Alice Smith</div>
                  <div className="text-xs text-gray-500 flex justify-between mt-2">
                    <span>Dr. Adams</span>
                    <StatusPill status="COMPLETED" type="success" />
                  </div>
                </Link>
                <Link to="/calendar/appointment/A-102" className="absolute top-[106px] left-4 right-4 h-[80px] bg-white border border-slate-500 rounded p-3 shadow-sm group">
                  <div className="text-xs font-bold text-slate-700 mb-1">09:30 - 10:00 • Scan</div>
                  <div className="text-sm font-bold text-gray-800 group-hover:underline">Bob Johnson</div>
                  <div className="text-xs text-gray-500 flex justify-between mt-2">
                    <span>Dr. Clark</span>
                    <StatusPill status="ARRIVED" />
                  </div>
                </Link>
              </div>
            </div>
          </Section>
        </div>

        {/* Right Col */}
        <div className="w-[40%] flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">
          <Section title="Expected Arrivals" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {arrivals.map((arr, i) => (
                <div key={i} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-slate-700 text-sm">
                        <Link to="/patients/P-001" className="hover:underline">{arr.patient}</Link>
                      </div>
                      <div className="text-xs text-gray-500">{arr.time} • {arr.type}</div>
                    </div>
                    {arr.checkIn ? <StatusPill status="CHECKED IN" type="success" /> : <StatusPill status="BOOKED" />}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${arr.consent ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-400 text-slate-600'}`}>
                      Consent {arr.consent ? '✓' : 'Missing'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${arr.pay ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-400 text-slate-600'}`}>
                      Payment {arr.pay ? '✓' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Check-in Queue" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {checkinQueue.map((q, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{q.patient}</div>
                    <div className="text-xs text-gray-500">{q.time}</div>
                    {!q.ready && <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">{q.reason}</div>}
                  </div>
                  <button 
                    disabled={!q.ready}
                    className={`px-4 py-2 text-xs font-bold rounded transition-colors ${q.ready ? 'bg-slate-600 text-white hover:bg-slate-700' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}`}
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pending Payments" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {payments.map((p, i) => (
                <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{p.patient}</div>
                    <div className="text-xs font-medium text-gray-800">{p.amount}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold uppercase rounded hover:bg-gray-50">Send Link</button>
                    <button className="px-3 py-1.5 border border-slate-600 bg-slate-50 text-slate-700 text-[10px] font-bold uppercase rounded hover:bg-slate-100">Pay Now</button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function NurseDashboard() {
  const myPatients = [
    { patient: "Bob Johnson", time: "09:30 AM", duration: "60m", dr: "Dr. Clark", step: 3, steps: ["Pickup", "Consent", "Changing", "Waiting", "Consult", "Sample", "Out"] },
    { patient: "Carol Williams", time: "10:00 AM", duration: "30m", dr: "Dr. Adams", step: 1, steps: ["Pickup", "Consent", "Changing", "Waiting", "Consult", "Sample", "Out"] },
  ];

  const journeyQueue = [
    { patient: "Bob Johnson", step: "Changing", wait: "5m" },
    { patient: "David Brown", step: "Awaiting Consult", wait: "12m" },
  ];

  const samples = [
    { patient: "Alice Smith", type: "Blood - Full Panel", room: "Lab 1", status: "Ready" },
    { patient: "Carol Williams", type: "Saliva", room: "Lab 2", status: "Pending" },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <KPICard label="My Patients Today" value={8} locked vs="yesterday" />
        <KPICard label="Awaiting Me" value={3} locked vs="avg" />
        <KPICard label="In Journey Now" value={5} vs="last hour" />
        <KPICard label="Samples To Collect" value={12} vs="yesterday" />
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Col */}
        <div className="w-[60%] flex flex-col">
          <Section title="My Patients Today" className="h-full bg-transparent border-none">
            <div className="space-y-4">
              {myPatients.map((p, i) => (
                <div key={i} className="border border-gray-300 bg-white rounded p-5 hover:border-slate-400 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-1">
                        <Link to="/patients/P-001/journeys" className="hover:underline">{p.patient}</Link>
                      </h4>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" /> {p.time} ({p.duration}) • <MapPin className="w-4 h-4 ml-3 mr-1.5" /> {p.dr}
                      </div>
                    </div>
                    <Link to="/patients/P-001/journeys" className="p-2 text-gray-400 hover:text-slate-700 bg-gray-50 hover:bg-gray-100 rounded">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                  
                  {/* Journey Progress */}
                  <div className="relative">
                    <div className="absolute top-2.5 left-2 right-2 h-0.5 bg-gray-200 z-0"></div>
                    <div className="relative z-10 flex justify-between">
                      {p.steps.map((step, stepIdx) => {
                        const isPast = stepIdx < p.step;
                        const isCurrent = stepIdx === p.step;
                        return (
                          <div key={stepIdx} className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border-2 mb-2 flex items-center justify-center ${
                              isPast ? 'bg-slate-500 border-slate-500' : 
                              isCurrent ? 'bg-white border-slate-600 ring-4 ring-slate-100' : 
                              'bg-white border-gray-300'
                            }`}>
                              {isPast && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              isCurrent ? 'text-slate-800' : 'text-gray-400'
                            }`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right Col */}
        <div className="w-[40%] flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">
          <Section title="Active Journey Queue" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {journeyQueue.map((q, i) => (
                <div key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{q.patient}</div>
                    <div className="text-xs text-gray-500">Step: {q.step}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800">{q.wait}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Waiting</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Samples To Collect" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {samples.map((s, i) => (
                <div key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{s.patient}</div>
                    <div className="text-xs text-gray-600 mb-1">{s.type}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.room}</div>
                  </div>
                  <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold uppercase rounded hover:bg-gray-50">
                    Process
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="My Day" className="shrink-0 h-48">
            <div className="p-4 space-y-3">
              <div className="flex items-center text-sm">
                <span className="w-16 font-medium text-gray-400 text-xs">09:00</span>
                <div className="flex-1 bg-gray-100 border border-gray-200 rounded px-3 py-1.5 text-gray-600">Morning Rounds</div>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-16 font-medium text-gray-400 text-xs">10:00</span>
                <div className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-700 font-medium">Clinic Floor Duties</div>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-16 font-medium text-gray-400 text-xs">13:00</span>
                <div className="flex-1 border border-dashed border-gray-300 rounded px-3 py-1.5 text-gray-400">Lunch Break</div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function ClinicianDashboard() {
  const schedule = [
    { time: "09:00 AM", type: "In-Person", patient: "Alice Smith", details: "Initial Consult • Room 1", status: "COMPLETED" },
    { time: "10:30 AM", type: "Video", patient: "David Brown", details: "Follow-up Review", status: "NEXT" },
    { time: "11:30 AM", type: "In-Person", patient: "Eva Davis", details: "Results Review • Room 2", status: "BOOKED" },
  ];

  const resultsReview = [
    { patient: "Frank Miller", test: "Comprehensive Blood", date: "Oct 12", sla: false },
    { patient: "Grace Lee", test: "Genetic Panel", date: "Oct 01", sla: true },
  ];

  const consultations = [
    { patient: "Alice Smith", time: "09:00 AM", type: "In-Person", prep: { consent: true, sample: true, scan: false } },
    { patient: "David Brown", time: "10:30 AM", type: "Video", prep: { consent: true, sample: true, scan: true } },
  ];

  const followups = [
    { patient: "Henry Wilson", last: "Sep 15", suggested: "Nov 15" },
    { patient: "Ian Clark", last: "Aug 20", suggested: "Oct 20" },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <KPICard label="Results To Review" value={14} locked vs="yesterday" trend="down" />
        <KPICard label="Awaiting Sign Off" value={5} locked vs="avg" />
        <KPICard label="My Appointments" value={8} vs="yesterday" />
        <KPICard label="Video Calls Today" value={2} vs="last week" />
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Col */}
        <div className="w-[60%] flex flex-col">
          <Section title="Today's Schedule" className="h-full">
            <div className="p-6 space-y-6">
              {schedule.map((slot, i) => (
                <div key={i} className={`flex border rounded p-5 ${slot.status === 'NEXT' ? 'border-slate-500 bg-slate-50' : 'border-gray-200 bg-white'}`}>
                  <div className="w-24 shrink-0 font-bold text-gray-800 pt-1">{slot.time}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-lg font-bold text-slate-800">
                        <Link to="/patients/P-001/overview" className="hover:underline">{slot.patient}</Link>
                      </h4>
                      {slot.type === 'Video' ? (
                        <span className="flex items-center text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded">
                          <Video className="w-3.5 h-3.5 mr-1.5" /> Video Call
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          <MapPin className="w-3.5 h-3.5 mr-1.5" /> In-Person
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">{slot.details}</div>
                    
                    <div className="flex gap-3">
                      {slot.type === 'Video' && (
                        <button className="px-4 py-2 bg-slate-600 text-white text-sm font-bold rounded hover:bg-slate-700 flex items-center">
                          <Video className="w-4 h-4 mr-2" /> Join Call
                        </button>
                      )}
                      <Link to="/patients/P-001/notes" className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-bold rounded hover:bg-gray-50 flex items-center">
                        <FileText className="w-4 h-4 mr-2" /> Open Notes
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right Col */}
        <div className="w-[40%] flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">
          <Section title="Results Review Queue" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {resultsReview.map((res, i) => (
                <div key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{res.patient}</div>
                    <div className="text-xs text-gray-600 mb-1">{res.test}</div>
                    {res.sla ? (
                      <span className="text-xs font-bold text-red-600 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> SLA Breach</span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Submitted: {res.date}</span>
                    )}
                  </div>
                  <Link to="/patients/P-001/results" className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold uppercase rounded hover:bg-gray-50">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Today's Consultations" className="shrink-0">
            <div className="divide-y divide-gray-100">
              {consultations.map((c, i) => (
                <div key={i} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{c.patient}</div>
                      <div className="text-xs text-gray-500">{c.time} • {c.type}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-gray-600">
                    <span className="flex items-center">
                      {c.prep.consent ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mr-1" /> : <X className="w-3.5 h-3.5 text-gray-300 mr-1" />} Consent
                    </span>
                    <span className="flex items-center">
                      {c.prep.sample ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mr-1" /> : <X className="w-3.5 h-3.5 text-gray-300 mr-1" />} Sample
                    </span>
                    <span className="flex items-center">
                      {c.prep.scan ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mr-1" /> : <X className="w-3.5 h-3.5 text-gray-300 mr-1" />} Scan
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pending Follow-ups" className="shrink-0 h-48">
            <div className="divide-y divide-gray-100">
              {followups.map((f, i) => (
                <div key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700 text-sm mb-1">{f.patient}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Last: {f.last}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-800 mb-1">Due: {f.suggested}</div>
                    <Link to="/patients/P-001/appointments" className="text-[10px] font-bold text-slate-600 hover:underline uppercase tracking-wider">Schedule →</Link>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---

export function Dashboard() {
  const { role } = useAppContext();

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Role: <span className="font-semibold text-slate-700">{role}</span> Overview</p>
        </div>
        <div className="text-sm text-gray-400 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {role === 'Admin' && <AdminDashboard />}
        {role === 'Reception' && <ReceptionDashboard />}
        {role === 'Nurse' && <NurseDashboard />}
        {role === 'Clinician' && <ClinicianDashboard />}
      </div>
    </div>
  );
}

