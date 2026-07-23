import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Search, ChevronDown, Download, MoreHorizontal, FileText, ArrowRight, CreditCard, Ticket, RefreshCcw, Calendar as CalendarIcon, CheckCircle2, AlertCircle, X, Wallet, Clock, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { FilterSelect } from "../../components/FilterSelect";
import { MOCK_BILLING_DATA as MOCK_DATA } from "./billingData";
import { Input } from "../../components/ui/input";

const formatCurrency = (amount: number) => `₺${amount.toLocaleString()}`;

// Compact summary KPI — a single tight row (icon chip + label / value /
// meta) rather than the old tall p-4 card, so the four figures cost far less
// vertical space and the table gets more of the iPad viewport. A semantic
// icon + tone carries "what kind of number" at a glance; an optional accent
// (green up-trend / red risk) rides on the meta line instead of a second row.
const KPI_TONE: Record<"emerald" | "amber" | "blue" | "red", string> = {
  emerald: "bg-success/10 text-success-ink",
  amber: "bg-warning/10 text-warning-ink",
  blue: "bg-info/10 text-info-ink",
  red: "bg-danger/10 text-danger-ink",
};

function BillingKpi({ icon: Icon, tone, label, value, sub, accent }: {
  icon: LucideIcon;
  tone: keyof typeof KPI_TONE;
  label: string;
  value: string;
  sub: string;
  accent?: { text: string; tone: "red" | "green" };
}) {
  return (
    <div className="bg-surface rounded-card border border-divider p-3 flex items-center gap-3 min-w-0">
      <div className={`w-9 h-9 rounded-card flex items-center justify-center shrink-0 ${KPI_TONE[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-overline text-ink-muted leading-tight truncate">{label}</div>
        <div className="text-2xl font-bold text-ink leading-tight tabular-nums">{value}</div>
        <div className="text-xs text-ink-muted leading-tight truncate flex items-center gap-1.5 mt-0.5">
          <span className="truncate">{sub}</span>
          {accent && (
            <span className={`font-bold shrink-0 ${accent.tone === "red" ? "text-danger-ink" : "text-success-ink"}`}>
              {accent.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BillingPage() {
  const { role } = useAppContext();
  const isAdmin = role === "Admin";

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [methodFilter, setMethodFilter] = useState("Method: All");

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
    <div className="flex flex-col min-h-full bg-surface-page">

      {/* Top Header Row */}
      <div className="bg-surface border-b border-divider px-6 py-3 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-ink">Billing</h1>
          <p className="text-sm text-ink-muted mt-1">
            {isAdmin ? "Payment oversight and reconciliation" : "Patient payments and transactions"}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-3">
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center px-4 py-2 border border-divider rounded-control text-sm font-bold text-ink-soft bg-surface hover:bg-surface-hover transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-2 text-ink-muted" /> Export <ChevronDown className="w-4 h-4 ml-2 text-ink-muted" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-divider shadow-xl rounded-card z-30 py-1 overflow-hidden">
                  <button onClick={() => handleExport('Excel')} className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-hover font-medium">Export as Excel (.xlsx)</button>
                  <button onClick={() => handleExport('CSV')} className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:bg-surface-hover font-medium">Export as CSV (.csv)</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar Row — all four filter controls share one language: same
          height, border, radius and shadow as FilterSelect, so the search box,
          date picker and segmented tabs read as a single control family. */}
      <div className="bg-surface border-b border-divider px-6 py-2.5 flex items-center justify-between shrink-0 gap-4">
        <div className="relative w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input type="text" placeholder="Search ID or patient..." className="pl-9 shadow-sm hover:border-border-strong" />
        </div>

        <div className="flex items-center gap-3 flex-1">
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            className="min-w-[140px]"
            options={["Status: All", "Unpaid", "Paid", "Refunded"]}
          />
          <FilterSelect
            value={methodFilter}
            onChange={setMethodFilter}
            className="min-w-[140px]"
            options={["Method: All", "Card", "Voucher"]}
          />

          <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-divider rounded-control text-sm text-ink-soft bg-surface shadow-sm transition-colors hover:border-border-strong">
            <CalendarIcon className="w-4 h-4 text-ink-muted" />
            <span className="font-bold">1 Jul – 7 Jul 2026</span>
          </button>
        </div>

        <div className="inline-flex items-center bg-surface-hover border border-divider rounded-card p-0.5 shrink-0">
          <button className="px-3 py-1.5 text-xs font-bold rounded-control text-ink-muted hover:text-ink-soft transition-colors">All</button>
          <button className="px-3 py-1.5 text-xs font-bold rounded-control bg-surface text-ink-soft shadow-sm transition-all">Today</button>
          <button className="px-3 py-1.5 text-xs font-bold rounded-control text-ink-muted hover:text-ink-soft transition-colors">This Week</button>
        </div>
      </div>

      {/* KPI Cards — compact single-row stat strip. Column count tracks the
          role so Reception's two cards fill the width instead of leaving two
          empty grid cells. */}
      <div className={`px-6 py-3 shrink-0 grid gap-3 ${isAdmin ? "grid-cols-4" : "grid-cols-2"}`}>
        <BillingKpi icon={Wallet} tone="emerald" label="Today's Collections" value="₺12,400" sub="8 payments received" />
        <BillingKpi icon={Clock} tone="amber" label="Awaiting Payment" value="3" sub="₺4,200 outstanding" accent={{ text: "2 due before check-in", tone: "red" }} />
        {isAdmin && (
          <>
            <BillingKpi icon={TrendingUp} tone="blue" label="Monthly Revenue" value="₺186,500" sub="Jul 2026" accent={{ text: "↑ 8% vs Jun", tone: "green" }} />
            <BillingKpi icon={AlertCircle} tone="red" label="Outstanding Balance" value="₺24,800" sub="across 14 patients" accent={{ text: "3 overdue > 30 days", tone: "red" }} />
          </>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex items-stretch border-t border-divider">

        {/* Left Table (Flex remaining width) */}
        <div className="flex-1 border-r border-divider bg-surface flex flex-col min-w-0">
          <div className="relative">
            <table className="w-full text-left border-collapse text-sm [&_th]:!px-3 [&_td]:!px-3">
              <thead className="bg-surface-page sticky top-0 z-20 shadow-[0_1px_0_var(--border-strong)]">
                <tr>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider sticky left-0 z-30 bg-surface-page w-[200px] shadow-[1px_0_0_var(--border-strong)] cursor-pointer hover:bg-surface-hover">Patient</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider cursor-pointer hover:bg-surface-hover w-[140px]">Appointment</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider cursor-pointer hover:bg-surface-hover w-[100px]">Clinician</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider text-right cursor-pointer hover:bg-surface-hover w-[90px]">Amount</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider text-right cursor-pointer hover:bg-surface-hover w-[90px]">Paid</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider w-[80px]">Voucher</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider w-[110px]">Payment Status</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider w-[90px]">Method</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider w-[100px]">Transaction</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider w-[70px] text-center">Invoice</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider cursor-pointer hover:bg-surface-hover w-[90px]">Date ▼</th>
                  <th className="p-4 font-bold text-ink-soft border-b border-divider w-[60px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {MOCK_DATA.map(rec => {
                  const isSelected = selectedRecordId === rec.id;

                  let statusBg = "bg-surface-hover text-ink-soft border-divider";
                  if (rec.status === 'Paid') statusBg = "bg-success/10 text-success-ink border-success/30";
                  if (rec.status === 'Unpaid') statusBg = "bg-danger/10 text-danger-ink border-danger/30";
                  if (rec.status === 'Refunded') statusBg = "bg-special/10 text-special-ink border-special/30";

                  let rowBg = "bg-surface hover:bg-surface-hover";
                  if (isSelected) rowBg = "bg-surface-hover";
                  else if (rec.isToday) rowBg = "bg-surface-page hover:bg-surface-hover";

                  return (
                    <tr key={rec.id} className={`group relative ${rowBg}`}>
                      <td className={`p-4 border-r border-divider sticky left-0 z-10 shadow-[1px_0_0_var(--border-strong)] transition-colors ${isSelected ? 'bg-surface-hover' : (rec.isToday ? 'bg-surface-page group-hover:bg-surface-hover' : 'bg-surface group-hover:bg-surface-hover')}`}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-xs font-bold text-ink-soft shrink-0 mr-3">
                            {rec.avatar}
                          </div>
                          <Link to={`/patients/P-001`} onClick={e => e.stopPropagation()} className="text-sm font-bold text-ink hover:underline hover:text-ink-soft block truncate">
                            {rec.patientName}
                          </Link>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-ink">{rec.apptType}</div>
                        <div className="text-xs text-ink-muted">{rec.apptDate}</div>
                      </td>
                      <td className="p-4 text-ink-soft">{rec.clinician}</td>
                      <td className="p-4 text-right font-bold text-ink">{formatCurrency(rec.totalAmount)}</td>
                      <td className="p-4 text-right font-bold text-success-ink">{formatCurrency(rec.paidAmount)}</td>
                      <td className="p-4">
                        {rec.voucher ? (
                          <div className="group/tooltip relative inline-block">
                            <span className="text-xs font-bold text-info-ink hover:underline cursor-help">{rec.voucher}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-sunken text-ink text-xs p-3 rounded-control shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-50">
                              Value: ₺5,000<br/>Remaining: ₺0<br/>Expires: 31 Dec 2026
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 border text-overline rounded-full ${statusBg}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-ink-soft">
                        <div className="flex items-center text-xs font-medium">
                          {rec.method === 'Card' && <CreditCard className="w-3.5 h-3.5 mr-1" />}
                          {rec.method === 'Voucher' && <Ticket className="w-3.5 h-3.5 mr-1" />}
                          {rec.method}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-surface-hover text-ink-soft border border-divider text-label rounded-control">
                          {rec.transactionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {rec.invoiceStatus === 'Issued' && <span title="Issued" className="text-success-ink">✅</span>}
                        {rec.invoiceStatus === 'Pending' && <span title="Pending" className="text-warning-ink">⏳</span>}
                        {rec.invoiceStatus === 'Not required' && <span className="text-ink-muted">—</span>}
                      </td>
                      <td className="p-4 text-ink-soft">{rec.fullDate}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedRecordId(rec.id); }}
                          className="p-2 text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-control transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-surface-page sticky bottom-0 z-20 shadow-[0_-1px_0_var(--border-strong)]">
                <tr>
                  <td className="p-4 font-bold text-ink border-t border-divider sticky left-0 z-30 bg-surface-page shadow-[1px_0_0_var(--border-strong)]">Totals</td>
                  <td className="p-4 border-t border-divider"></td>
                  <td className="p-4 border-t border-divider"></td>
                  <td className="p-4 border-t border-divider text-right font-bold text-ink">{formatCurrency(totalAmount)}</td>
                  <td className="p-4 border-t border-divider text-right font-bold text-success-ink">{formatCurrency(totalPaid)}</td>
                  <td className="p-4 border-t border-divider font-bold text-danger-ink" colSpan={7}>
                    Balance: {formatCurrency(totalBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="h-12 border-t border-divider bg-surface flex items-center justify-between px-6 shrink-0">
            <div className="text-xs text-ink-muted font-medium">Showing 1–8 of 89 records</div>
            <div className="flex items-center space-x-1">
              <button className="px-2 py-1 text-xs font-bold text-ink-muted hover:text-ink-soft border border-transparent hover:bg-surface-sunken rounded-control transition-colors" disabled>Previous</button>
              <button className="px-2 py-1 text-xs font-bold text-ink-soft border border-divider bg-surface-page rounded-control shadow-sm">1</button>
              <button className="px-2 py-1 text-xs font-bold text-ink-soft hover:text-ink border border-transparent hover:bg-surface-sunken rounded-control transition-colors">Next</button>
            </div>
          </div>
        </div>

        {/* Right Detail Panel (approx 380px) */}
        {selectedRecord && (
          <div className="w-[380px] bg-surface-page flex flex-col overflow-hidden relative shrink-0 border-l border-divider">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 bg-surface border-b border-divider">
                {/* Top Meta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center text-sm font-bold text-ink-soft shrink-0 mr-3">
                      {selectedRecord.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-ink text-sm mb-1">{selectedRecord.patientName}</div>
                      <Link to={`/patients/P-001`} className="text-overline text-ink-soft hover:underline">
                        View Patient Record →
                      </Link>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRecordId(null)} className="p-2 text-ink-muted hover:text-ink-soft hover:bg-surface-hover rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-surface-page border border-divider rounded-card p-3 text-sm">
                  <div className="font-bold text-ink mb-1">{selectedRecord.apptType}</div>
                  <div className="text-ink-soft flex items-center">
                    <CalendarIcon className="w-3.5 h-3.5 mr-2" /> {selectedRecord.fullDate}
                    <span className="mx-2 text-ink-muted">|</span>
                    {selectedRecord.clinician}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="p-4 border-b border-divider bg-surface">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Line Items</h4>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-divider text-ink-muted">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium text-center">Qty</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    <tr>
                      <td className="py-3 text-ink font-medium">{selectedRecord.apptType}</td>
                      <td className="py-3 text-center text-ink-soft">1</td>
                      <td className="py-3 text-right text-ink font-medium">{formatCurrency(selectedRecord.totalAmount)}</td>
                    </tr>
                    {selectedRecord.voucher && (
                      <tr>
                        <td className="py-3 text-ink-soft">Voucher Discount ({selectedRecord.voucher})</td>
                        <td className="py-3 text-center text-ink-soft"></td>
                        <td className="py-3 text-right text-success-ink font-medium">−₺5,000</td>
                      </tr>
                    )}
                    <tr>
                      <td className="pt-3 font-bold text-ink">Total</td>
                      <td className="pt-3"></td>
                      <td className="pt-3 text-right font-bold text-ink">{formatCurrency(selectedRecord.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment History */}
              <div className="p-4">
                <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Payment History</h4>
                <div className="space-y-4 relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-surface-sunken"></div>

                  {selectedRecord.paidAmount > 0 ? (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-success/15 border-2 border-white flex items-center justify-center shrink-0 mt-1 mr-3">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-surface border border-divider rounded-control p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-ink text-sm">{formatCurrency(selectedRecord.paidAmount)}</span>
                          <span className="text-label text-ink-muted font-medium">{selectedRecord.fullDate}, 09:15</span>
                        </div>
                        <div className="text-xs text-ink-soft flex flex-wrap items-center gap-2">
                          <span className="font-medium">{selectedRecord.method} payment</span>
                          <span className="text-ink-muted">·</span>
                          <span className="text-success-ink font-medium">{selectedRecord.transactionStatus}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-surface-hover border-2 border-white flex items-center justify-center shrink-0 mt-1 mr-3"></div>
                      <div className="text-sm text-ink-muted italic mt-1">No payments recorded yet.</div>
                    </div>
                  )}

                  {selectedRecord.transactionStatus === 'Refund Pending' && (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-special/15 border-2 border-white flex items-center justify-center shrink-0 mt-1 mr-3">
                        <RefreshCcw className="w-3 h-3 text-special-ink" />
                      </div>
                      <div className="flex-1 bg-surface border border-divider rounded-control p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-ink text-sm">Refund requested: {formatCurrency(selectedRecord.totalAmount)}</span>
                          <span className="text-label text-ink-muted font-medium">{selectedRecord.refundRequestedAt}</span>
                        </div>
                        <div className="text-xs text-special-ink font-medium">Awaiting Admin decision</div>
                      </div>
                    </div>
                  )}

                  {selectedRecord.status === 'Refunded' && (
                    <div className="flex items-start relative z-10">
                      <div className="w-5 h-5 rounded-full bg-special/15 border-2 border-white flex items-center justify-center shrink-0 mt-1 mr-3">
                        <RefreshCcw className="w-3 h-3 text-special-ink" />
                      </div>
                      <div className="flex-1 bg-surface border border-divider rounded-control p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-ink text-sm">Refund: {formatCurrency(selectedRecord.totalAmount)}</span>
                          <span className="text-label text-ink-muted font-medium">{selectedRecord.fullDate}, 14:20</span>
                        </div>
                        <div className="text-xs text-special-ink font-medium">Refund Completed</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar (Sticky Bottom) */}
            <div className="p-4 bg-surface border-t border-divider shrink-0">
              <div className="flex justify-between items-center mb-4">
                {selectedRecord.balance > 0 ? (
                  <div className="text-xl font-bold text-danger-ink">Balance: {formatCurrency(selectedRecord.balance)}</div>
                ) : (
                  <div className="text-xl font-bold text-success-ink flex items-center">Fully Paid <CheckCircle2 className="w-5 h-5 ml-1.5" /></div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {isAdmin ? (
                  <button onClick={() => handleAction('Issue Refund')} className="py-3 border border-special/30 bg-special/10 text-special-ink text-xs font-bold rounded-control hover:bg-special/15 transition-colors shadow-sm">
                    Issue Refund
                  </button>
                ) : (
                  <button
                    disabled
                    title="Only Admin can issue refunds"
                    className="py-3 border border-divider bg-surface-page text-ink-muted text-xs font-bold rounded-control cursor-not-allowed"
                  >
                    Issue Refund
                  </button>
                )}
                <button onClick={() => handleAction('Generate Invoice')} className="py-3 border border-divider bg-surface text-ink-soft text-xs font-bold rounded-control hover:bg-surface-hover transition-colors shadow-sm">
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
