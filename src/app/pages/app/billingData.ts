// Shared billing types + mock ledger. Extracted out of BillingPage.tsx so
// the Admin Dashboard's "Needs Your Action" card can read the exact same
// Refund Pending records Billing itself shows — one source of truth, no
// risk of the two ever disagreeing on a count.

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';
export type PaymentMethod = 'Card' | 'Voucher' | '—';
export type TransactionStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refund Pending' | 'Refund Completed' | '—';
export type InvoiceStatus = 'Issued' | 'Pending' | 'Not required';

export type BillingRecord = {
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
  // Only set when transactionStatus === 'Refund Pending' — how long the
  // refund has been awaiting Admin's decision, for the Dashboard's wait-time
  // sort and >48h overdue flag.
  refundRequestedAt?: string;
  refundWaitHours?: number;
};

export const MOCK_BILLING_DATA: BillingRecord[] = [
  { id: "1", patientName: "Mackenzie Messineo", avatar: "MM", apptType: "Body Scan", apptDate: "3 Jul", fullDate: "3 Jul 2026", clinician: "Dr. Claudia", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued', isToday: true },
  { id: "2", patientName: "Penny Pelargonium", avatar: "PP", apptType: "Consultation", apptDate: "3 Jul", fullDate: "3 Jul 2026", clinician: "Dr. Higgs", totalAmount: 4800, paidAmount: 0, balance: 4800, status: 'Unpaid', method: '—', transactionStatus: 'Pending', invoiceStatus: 'Pending', isToday: true },
  { id: "3", patientName: "Arysse Arcerola", avatar: "AA", apptType: "7-Omics Package", apptDate: "2 Jul", fullDate: "2 Jul 2026", clinician: "Dr. Chad", totalAmount: 24000, paidAmount: 24000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "4", patientName: "Gustavo Propolis", avatar: "GP", apptType: "Consultation", apptDate: "2 Jul", fullDate: "2 Jul 2026", clinician: "Dr. Felix", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Voucher', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "5", patientName: "Dylan Daniel", avatar: "DD", apptType: "Sample Collection", apptDate: "1 Jul", fullDate: "1 Jul 2026", clinician: "Dr. Adobe", totalAmount: 3600, paidAmount: 3600, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "6", patientName: "Sophia Ascorbic", avatar: "SA", apptType: "Consultation", apptDate: "30 Jun", fullDate: "30 Jun 2026", clinician: "Dr. Chad", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Refunded', method: 'Card', transactionStatus: 'Refund Completed', invoiceStatus: 'Issued' },
  { id: "7", patientName: "Oliver Folate", avatar: "OF", apptType: "Body Scan", apptDate: "30 Jun", fullDate: "30 Jun 2026", clinician: "Dr. Felix", totalAmount: 18000, paidAmount: 18000, balance: 0, voucher: "V-2026-041", status: 'Paid', method: 'Voucher', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "8", patientName: "Cynthia Cromium", avatar: "CC", apptType: "Consultation", apptDate: "28 Jun", fullDate: "28 Jun 2026", clinician: "Dr. Adobe", totalAmount: 4800, paidAmount: 0, balance: 4800, status: 'Unpaid', method: '—', transactionStatus: '—', invoiceStatus: 'Not required' },
  { id: "9", patientName: "Amara Chen", avatar: "AC", apptType: "Body Scan", apptDate: "28 Jun", fullDate: "28 Jun 2026", clinician: "Dr. Claudia", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "6h ago", refundWaitHours: 6 },
  { id: "10", patientName: "Noah Kimura", avatar: "NK", apptType: "Consultation", apptDate: "25 Jun", fullDate: "25 Jun 2026", clinician: "Dr. Felix", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "3d ago", refundWaitHours: 72 },
  { id: "11", patientName: "Sophia Lindqvist", avatar: "SL", apptType: "Consultation", apptDate: "24 Jun", fullDate: "24 Jun 2026", clinician: "Dr. Chad", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "1d ago", refundWaitHours: 24 },
  { id: "12", patientName: "Marco Duarte", avatar: "MD", apptType: "Body Scan", apptDate: "22 Jun", fullDate: "22 Jun 2026", clinician: "Dr. Felix", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "5d ago", refundWaitHours: 120 },
];

export function refundPendingRecords(data: BillingRecord[] = MOCK_BILLING_DATA): BillingRecord[] {
  return data.filter((r) => r.transactionStatus === 'Refund Pending');
}
