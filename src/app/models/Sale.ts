/**
 * Sale Model Interface
 * 
 * Represents a complete sales transaction in the POS system
 */

export interface SaleItem {
  refId: string;
  type: 'service' | 'product';
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export interface SaleSummary {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  tip: number;
  grandTotal: number;
}

export interface SalePayment {
  method: 'cash' | 'card' | 'voucher' | 'gift' | 'bank' | 'other';
  amount: number;
  change?: number;
  externalRef?: string;
}

export interface FiscalInfo {
  status: 'pending' | 'success' | 'error' | 'retry';
  correlationId: string;
  fiscalNumber?: string;
  error?: string;
  processedAt?: Date;
}

export interface Sale {
  _id: string;
  id?: string;
  tenant: string;
  facility: string | { _id: string; name: string };
  session: string | { 
    _id: string; 
    number?: string;
    openedBy?: { _id: string; name: string };
    closedBy?: { _id: string; name: string };
  };
  cashier: string | { _id: string; firstName: string; lastName: string };
  appointment?: string | { _id: string; service: any; client: any };
  client?: string | { _id: string; firstName: string; lastName: string };
  number: string;
  date: Date | string;
  status: 'final' | 'refunded' | 'partial_refund';
  items: SaleItem[];
  summary: SaleSummary;
  payments: SalePayment[];
  fiscal: FiscalInfo;
  refundFor?: string;
  note?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  // Virtual fields (computed)
  itemCount?: number;
  paymentTotal?: number;
  isFullyPaid?: boolean;
  changeAmount?: number;
}

export interface CreateSaleRequest {
  facility: string;
  appointment?: string;
  client?: string;
  items: SaleItem[];
  summary?: SaleSummary;
  payments: SalePayment[];
  note?: string;
}

export interface RefundSaleRequest {
  items?: Array<{
    refId: string;
    qty: number;
    amount: number;
  }>;
  amount?: number;
  reason?: string;
  summary?: SaleSummary;
  payments?: SalePayment[];
}

export interface SaleResponse {
  id: string;
  number: string;
  date: Date;
  total: number;
}

export interface RefundResponse {
  id: string;
  number: string;
  originalSaleId: string;
  refundAmount: number;
}

export interface FiscalResponse {
  id: string;
  fiscal: {
    status: string;
    correlationId: string;
    fiscalNumber?: string;
  };
}

// API Response wrapper interface
export interface PosApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

