import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Search, ChevronDown, Download, MoreHorizontal, FileText, ArrowRight, CreditCard, Link as LinkIcon, Ticket, RefreshCcw, Banknote, Calendar as CalendarIcon, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";

// --- Types ---
type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';
type PaymentMethod = 'Card' | 'Online' | 'Cash' | 'Voucher' | 'Card + Voucher' | '—';
type TransactionStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refund Pending' | 'Refund Completed' | '—';
type InvoiceStatus = 'Issued' | 'Pending' | 'Not required';

type BillingRecord = {
  id: string;
  patientName: string;
  avatar: string;
  apptType: string;
  apptDate: string; // "3 Jul"
  fullDate: string; // "3 Jul 2026"
  clinician: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  voucher?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionStatus: TransactionStatus;
  invoiceStatus: InvoiceStatus;
  isToday?: boolean;
};

// --- Mock Data ---
const MOCK_DATA: BillingRecord[] = [
  { id: "1", patientName: "Mackenzie Messineo", avatar: "MM", apptType: "Body Scan", apptDate: "3 Jul", fullDate: "3 Jul 2026", clinician: "Dr. Claudia", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued', isToday: true },
  { id: "2", patientName: "Penny Pelargonium", avatar: "PP", apptType: "Consultation", apptDate: "3 Jul", fullDate: "3 Jul 2026", clinician: "Dr. Higgs", totalAmount: 4800, paidAmount: 0, balance: 4800, status: 'Unpaid', method: '—', transactionStatus: 'Pending', invoiceStatus: 'Pending', isToday: true },
  { id: "3", patientName: "Arysse Arcerola", avatar: "AA", apptType: "7-Omics Package", apptDate: "2 Jul", fullDate: "2 Jul 2026", clinician: "Dr. Chad", totalAmount: 24000, paidAmount: 24000, balance: 0, status: 'Paid', method: 'Online', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "4", patientName: "Gustavo Propolis", avatar: "GP", apptType: "Consultation", apptDate: "2 Jul", fullDate: "2 Jul 2026", clinician: "Dr. Felix", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Cash', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "5", patientName: "Dylan Daniel", avatar: "DD", apptType: "Sample Collection", apptDate: "1 Jul", fullDate: "1 Jul 2026", clinician: "Dr. Adobe", totalAmount: 3600, paidAmount: 3600, balance: 0, status: 'Paid', method: 'Online', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "6", patientName: "Sophia Ascorbic", avatar: "SA", apptType: "Consultation", apptDate: "30 Jun", fullDate: "30 Jun 2026", clinician: "Dr. Chad", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Refunded', method: 'Card', transactionStatus: 'Refund Completed', invoiceStatus: 'Issued' },
  { id: "7", patientName: "Oliver Folate", avatar: "OF", apptType: "Body Scan", apptDate: "30 Jun", fullDate: "30 Jun 2026", clinician: "Dr. Felix", totalAmount: 18000, paidAmount: 18000, balance: 0, voucher: "V-2026-041", status: 'Paid', method: 'Card + Voucher', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "8", patientName: "Cynthia Cromium", avatar: "CC", apptType: "Consultation", apptDate: "28 Jun", fullDate: "28 Jun 2026", clinician: "Dr. Adobe", totalAmount: 4800, paidAmount: 0, balance: 4800, status: 'Unpaid', method: '—', transactionStatus: '—', invoiceStatus: 'Not required' },
];

const formatCurrency = (amount: number) => `₺${amount.toLocaleString()}`;

export function BillingPage() {
  const { role } = useAppContext();
  const isAdmin = role === "Admin";
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRecord = MOCK_DATA.find(r => r.id === selectedRecordId);

  const handleExport = (type: string) => {
    toast.success(`Exporting as ${type}...`);
    setExportOpen(false);
  };

  const handleAction = (action: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    toast(`Action triggered: ${action}`);
  };

  // Totals calculation
  const totalAmount = MOCK_DATA.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = MOCK_DATA.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalBalance = MOCK_DATA.reduce((sum, r) => sum + r.balance, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      
      {/* Top Header Row */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? "Payment oversight and reconciliation" : "Patient payments and transactions"}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-3">
            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-2 text-gray-500" /> Export <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-lg z-30 py-1 overflow-hidden">
                  <button onClick={() => handleExport('Excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Export as Excel (.xlsx)</button>
                  <button onClick={() => handleExport('CSV')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Export as CSV (.csv)</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar Row */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shrink-0 space-x-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search ID or patient..." className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-slate-500 bg-white shadow-sm" />
        </div>
        
        <div className="flex items-center space-x-3 flex-1">
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[140px]">
            <option>Status: All</option>
            <option>Unpaid</option>
            <option>Paid</option>
            <option>Refunded</option>
          </select>
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 outline-none focus:border-slate-500 bg-white shadow-sm min-w-[140px]">
            <option>Method: All</option>
            <option>Card</option>
            <option>Online Payment</option>
            <option>Voucher</option>
          </select>
          
          <div className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white shadow-sm cursor-pointer hover:border-gray-400">
            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
            <span className="font-bold">1 Jul – 7 Jul 2026</span>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button className="px-4 py-1 text-sm font-medium rounded text-gray-500 hover:text-gray-700">All</button>
          <button className="px-4 py-1 text-sm font-bold rounded bg-white text-gray-800 shadow-sm">Today</button>
          <button className="px-4 py-1 text-sm font-medium rounded text-gray-500 hover:text-gray-700">This Week</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-8 py-5 shrink-0 grid grid-cols-4 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Today's Collections</div>
          <div className="text-3xl font-bold text-gray-800">₺12,400</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">8 payments received</div>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Awaiting Payment</div>
          <div className="text-3xl font-bold text-gray-800">3</div>
          <div className="text-sm text-gray-500 mt-1 font-medium flex items-center justify-between">
            ₺4,200 outstanding
            <span className="text-xs text-red-600 font-bold ml-2 truncate">2 due before check-in</span>
          </div>
        </div>
        {isAdmin && (
          <>
            <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Revenue</div>
              <div className="text-3xl font-bold text-gray-800">₺186,500</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500 font-medium">Jul 2026</span>
                <span className="text-xs text-green-600 font-bold">↑ 8% vs Jun</span>
              </div>
            </div>
            <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Outstanding Balance</div>
              <div className="text-3xl font-bold text-gray-800">₺24,800</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500 font-medium">across 14 patients</span>
                <span className="text-xs text-red-600 font-bold">3 overdue &gt; 30 days</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden border-t border-gray-200">
        
        {/* Left Table (Flex remaining width) */}
        <div className="flex-1 border-r border-gray-200 bg-white flex flex-col min-w-0">
          <div className="flex-1 overflow-auto relative">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="bg-gray-50 sticky top-0 z-20 shadow-[0_1px_0_#e5e7eb]">
                <tr>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 sticky left-0 z-30 bg-gray-50 w-[200px] shadow-[1px_0_0_#e5e7eb] cursor-pointer hover:bg-gray-100">Patient</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[140px]">Appointment</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[100px]">Clinician</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right cursor-pointer hover:bg-gray-100 w-[90px]">Amount</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 text-right cursor-pointer hover:bg-gray-100 w-[90px]">Paid</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[80px]">Voucher</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[110px]">Payment Status</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[90px]">Method</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[100px]">Transaction</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[70px] text-center">Invoice</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 cursor-pointer hover:bg-gray-100 w-[90px]">Date ▼</th>
                  <th className="p-4 font-bold text-gray-600 border-b border-gray-200 w-[60px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MOCK_DATA.map(rec => {
                  const isSelected = selectedRecordId === rec.id;
                  
                  let statusBg = "bg-gray-100 text-gray-700 border-gray-300";
                  if (rec.status === 'Paid') statusBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (rec.status === 'Unpaid') statusBg = "bg-red-50 text-red-700 border-red-200";
                  if (rec.status === 'Refunded') statusBg = "bg-purple-50 text-purple-700 border-purple-200";

                  let rowBg = "bg-white hover:bg-slate-50";
                  if (isSelected) rowBg = "bg-slate-50";
                  else if (rec.isToday) rowBg = "bg-slate-50/50 hover:bg-slate-50";

                  return (
                    <tr key={rec.id} className={`group relative ${rowBg}`}>
                      <td className={`p-4 border-r border-gray-200 sticky left-0 z-10 shadow-[1px_0_0_#e5e7eb] transition-colors ${isSelected ? 'bg-slate-50' : (rec.isToday ? 'bg-slate-50/50 group-hover:bg-slate-50' : 'bg-white group-hover:bg-slate-50')}`}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3">
                            {rec.avatar}
                          </div>
                          <Link to={`/patients/P-001`} onClick={e => e.stopPropagation()} className="text-sm font-bold text-gray-800 hover:underline hover:text-slate-600 block truncate">
                            {rec.patientName}
                          </Link>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{rec.apptType}</div>
                        <div className="text-xs text-gray-500">{rec.apptDate}</div>
                      </td>
                      <td className="p-4 text-gray-600">{rec.clinician}</td>
                      <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(rec.totalAmount)}</td>
                      <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(rec.paidAmount)}</td>
                      <td className="p-4">
                        {rec.voucher ? (
                          <div className="group/tooltip relative inline-block">
                            <span className="text-xs font-bold text-blue-600 hover:underline cursor-help">{rec.voucher}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs p-3 rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-50">
                              Value: ₺5,000<br/>Remaining: ₺0<br/>Expires: 31 Dec 2026
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded-full ${statusBg}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center text-xs font-medium">
                          {rec.method.includes('Card') && <CreditCard className="w-3.5 h-3.5 mr-1" />}
                          {rec.method.includes('Online') && <LinkIcon className="w-3.5 h-3.5 mr-1" />}
                          {rec.method.includes('Cash') && <Banknote className="w-3.5 h-3.5 mr-1" />}
                          {rec.method.includes('Voucher') && <Ticket className="w-3.5 h-3.5 mr-1" />}
                          {rec.method}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold rounded">
                          {rec.transactionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {rec.invoiceStatus === 'Issued' && <span title="Issued" className="text-emerald-500">✅</span>}
                        {rec.invoiceStatus === 'Pending' && <span title="Pending" className="text-orange-500">⏳</span>}
                        {rec.invoiceStatus === 'Not required' && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-gray-600">{rec.fullDate}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedRecordId(rec.id); }} 
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 sticky bottom-0 z-20 shadow-[0_-1px_0_#e5e7eb]">
                <tr>
                  <td className="p-4 font-bold text-gray-800 border-t border-gray-200 sticky left-0 z-30 bg-gray-50 shadow-[1px_0_0_#e5e7eb]">Totals</td>
                  <td className="p-4 border-t border-gray-200"></td>
                  <td className="p-4 border-t border-gray-200"></td>
                  <td className="p-4 border-t border-gray-200 text-right font-bold text-gray-800">{formatCurrency(totalAmount)}</td>
                  <td className="p-4 border-t border-gray-200 text-right font-bold text-emerald-600">{formatCurrency(totalPaid)}</td>
                  <td className="p-4 border-t border-gray-200 font-bold text-red-600" colSpan={7}>
                    Balance: {formatCurrency(totalBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Footer / Pagination */}
          <div className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
            <div className="text-xs text-gray-500 font-medium">Showing 1–8 of 89 records</div>
            <div className="flex items-center space-x-1">
              <button className="px-2 py-1 text-xs font-bold text-gray-400 hover:text-gray-700 border border-transparent hover:bg-gray-200 rounded transition-colors" disabled>Previous</button>
              <button className="px-2 py-1 text-xs font-bold text-slate-600 border border-slate-300 bg-gray-50 rounded shadow-sm">1</button>
              <button className="px-2 py-1 text-xs font-bold text-gray-600 hover:text-gray-800 border border-transparent hover:bg-gray-200 rounded transition-colors">Next</button>
            </div>
          </div>
        </div>

        {/* Right Detail Panel (approx 380px) */}
        {selectedRecord && (
          <div className="w-[380px] bg-gray-50 flex flex-col overflow-hidden relative shrink-0 border-l border-gray-200">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 bg-white border-b border-gray-200">
                {/* Top Meta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-white shrink-0 mr-3">
                      {selectedRecord.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm mb-0.5">{selectedRecord.patientName}</div>
                      <Link to={`/patients/P-001`} className="text-[10px] font-bold text-slate-600 hover:underline uppercase tracking-wider">
                        View Patient Record →
                      </Link>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRecordId(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <div className="font-bold text-gray-800 mb-1">{selectedRecord.apptType}</div>
                  <div className="text-gray-600 flex items-center">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> {selectedRecord.fullDate}
                    <span className="mx-2 text-gray-300">|</span>
                    {selectedRecord.clinician}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Line Items</h4>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium text-center">Qty</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="py-3 text-gray-800 font-medium">{selectedRecord.apptType}</td>
                      <td className="py-3 text-center text-gray-600">1</td>
                      <td className="py-3 text-right text-gray-800 font-medium">{formatCurrency(selectedRecord.totalAmount)}</td>
                    </tr>
                    {selectedRecord.voucher && (
                      <tr>
                        <td className="py-3 text-gray-600">Voucher Discount ({selectedRecord.voucher})</td>
                        <td className="py-3 text-center text-gray-600"></td>
                        <td className="py-3 text-right text-emerald-600 font-medium">−₺5,000</td>
                      </tr>
                    )}
                    <tr>
                      <td className="pt-3 font-bold text-gray-800">Total</td>
                      <td className="pt-3"></td>
                      <td className="pt-3 text-right font-bold text-gray-800">{formatCurrency(selectedRecord.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment History */}
              <div className="p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Payment History</h4>
                <div className="space-y-4 relative">
                  <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-200"></div>
                  
                  {selectedRecord.paidAmount > 0 ? (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-white border border-gray-200 rounded p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800 text-sm">{formatCurrency(selectedRecord.paidAmount)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{selectedRecord.fullDate}, 09:15</span>
                        </div>
                        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{selectedRecord.method} payment</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-emerald-600 font-medium">{selectedRecord.transactionStatus}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center shrink-0 mt-0.5 mr-3"></div>
                      <div className="text-sm text-gray-500 italic mt-0.5">No payments recorded yet.</div>
                    </div>
                  )}

                  {selectedRecord.status === 'Refunded' && (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center shrink-0 mt-0.5 mr-3">
                        <RefreshCcw className="w-3 h-3 text-purple-600" />
                      </div>
                      <div className="flex-1 bg-white border border-gray-200 rounded p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800 text-sm">Refund: {formatCurrency(selectedRecord.totalAmount)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{selectedRecord.fullDate}, 14:20</span>
                        </div>
                        <div className="text-xs text-purple-600 font-medium">Refund Completed</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar (Sticky Bottom) */}
            <div className="p-6 bg-white border-t border-gray-200 shrink-0">
              <div className="flex justify-between items-center mb-4">
                {selectedRecord.balance > 0 ? (
                  <div className="text-xl font-bold text-red-600">Balance: {formatCurrency(selectedRecord.balance)}</div>
                ) : (
                  <div className="text-xl font-bold text-emerald-600 flex items-center">Fully Paid <CheckCircle2 className="w-5 h-5 ml-1.5" /></div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {isAdmin ? (
                  <button onClick={() => handleAction('Issue Refund')} className="py-2.5 border border-purple-200 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors shadow-sm">
                    Issue Refund
                  </button>
                ) : (
                  <button
                    disabled
                    title="Only Admin can issue refunds"
                    className="py-2.5 border border-gray-200 bg-gray-50 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed"
                  >
                    Issue Refund
                  </button>
                )}
                <button onClick={() => handleAction('Generate Invoice')} className="py-2.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
