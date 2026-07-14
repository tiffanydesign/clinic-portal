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
  { id: "1", patientName: "Ece Yıldırım", avatar: "EY", apptType: "Body Scan", apptDate: "3 Jul", fullDate: "3 Jul 2026", clinician: "Dr. Ebru Reis", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued', isToday: true },
  { id: "2", patientName: "Aslı Kutlu", avatar: "AK", apptType: "Consultation", apptDate: "3 Jul", fullDate: "3 Jul 2026", clinician: "Dr. Emre Yalçın", totalAmount: 4800, paidAmount: 0, balance: 4800, status: 'Unpaid', method: '—', transactionStatus: 'Pending', invoiceStatus: 'Pending', isToday: true },
  { id: "3", patientName: "Gül Korkmaz", avatar: "GK", apptType: "7-Omics Package", apptDate: "2 Jul", fullDate: "2 Jul 2026", clinician: "Dr. Emre Yalçın", totalAmount: 24000, paidAmount: 24000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "4", patientName: "Hakan Bulut", avatar: "HB", apptType: "Consultation", apptDate: "2 Jul", fullDate: "2 Jul 2026", clinician: "Dr. Kaan Öztürk", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Voucher', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "5", patientName: "Burak Kocaman", avatar: "BK", apptType: "Sample Collection", apptDate: "1 Jul", fullDate: "1 Jul 2026", clinician: "Dr. Onur Şimşek", totalAmount: 3600, paidAmount: 3600, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "6", patientName: "Derya Toprak", avatar: "DT", apptType: "Consultation", apptDate: "30 Jun", fullDate: "30 Jun 2026", clinician: "Dr. Emre Yalçın", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Refunded', method: 'Card', transactionStatus: 'Refund Completed', invoiceStatus: 'Issued' },
  { id: "7", patientName: "Cem Polat", avatar: "CP", apptType: "Body Scan", apptDate: "30 Jun", fullDate: "30 Jun 2026", clinician: "Dr. Kaan Öztürk", totalAmount: 18000, paidAmount: 18000, balance: 0, voucher: "V-2026-041", status: 'Paid', method: 'Voucher', transactionStatus: 'Completed', invoiceStatus: 'Issued' },
  { id: "8", patientName: "Ayla Şahin", avatar: "AS", apptType: "Consultation", apptDate: "28 Jun", fullDate: "28 Jun 2026", clinician: "Dr. Onur Şimşek", totalAmount: 4800, paidAmount: 0, balance: 4800, status: 'Unpaid', method: '—', transactionStatus: '—', invoiceStatus: 'Not required' },
  { id: "9", patientName: "Defne Korkut", avatar: "DK", apptType: "Body Scan", apptDate: "28 Jun", fullDate: "28 Jun 2026", clinician: "Dr. Ebru Reis", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "6h ago", refundWaitHours: 6 },
  { id: "10", patientName: "Ozan Bilgin", avatar: "OB", apptType: "Consultation", apptDate: "25 Jun", fullDate: "25 Jun 2026", clinician: "Dr. Kaan Öztürk", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "3d ago", refundWaitHours: 72 },
  { id: "11", patientName: "Ceyda Aksu", avatar: "CA", apptType: "Consultation", apptDate: "24 Jun", fullDate: "24 Jun 2026", clinician: "Dr. Emre Yalçın", totalAmount: 4800, paidAmount: 4800, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "1d ago", refundWaitHours: 24 },
  { id: "12", patientName: "Emir Tekin", avatar: "ET", apptType: "Body Scan", apptDate: "22 Jun", fullDate: "22 Jun 2026", clinician: "Dr. Kaan Öztürk", totalAmount: 18000, paidAmount: 18000, balance: 0, status: 'Paid', method: 'Card', transactionStatus: 'Refund Pending', invoiceStatus: 'Issued', refundRequestedAt: "5d ago", refundWaitHours: 120 },
];

export function refundPendingRecords(data: BillingRecord[] = MOCK_BILLING_DATA): BillingRecord[] {
  return data.filter((r) => r.transactionStatus === 'Refund Pending');
}
