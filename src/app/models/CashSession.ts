/**
 * Cash Session Status Enum
 */
export type CashSessionStatus = 'open' | 'closed';

/**
 * Payment Totals Interface
 */
export interface PaymentTotals {
  cash: number;
  card: number;
  voucher: number;
  gift: number;
  bank: number;
  other: number;
}

/**
 * Variance Status Enum
 */
export type VarianceStatus = 'acceptable' | 'warning' | 'critical' | 'severe';

/**
 * Variance Action Enum
 */
export enum VarianceAction {
  ACCEPT = 'accept',
  INVESTIGATE = 'investigate',
  ADJUST = 'adjust'
}

/**
 * Cash Session Model
 * 
 * Represents a cash register session with opening/closing balances,
 * transaction totals, and variance tracking.
 */
export interface CashSession {
  /** Unique session identifier */
  id: string;
  /** Tenant reference */
  tenant: string;
  /** Facility information */
  facility: {
    id: string;
    name: string;
  };
  /** Employee who opened the session */
  openedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  /** Session opening timestamp */
  openedAt: Date | string;
  /** Opening cash float amount */
  openingFloat: number;
  /** Employee who closed the session (optional) */
  closedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  /** Session closing timestamp (optional) */
  closedAt?: Date | string;
  /** Actual cash count at closing (optional) */
  closingCount?: number;
  /** Transaction totals by payment method */
  totalsByMethod: PaymentTotals;
  /** Expected cash amount based on sales */
  expectedCash: number;
  /** Variance between expected and actual cash */
  variance: number;
  /** Current session status */
  status: CashSessionStatus;
  /** Optional session note */
  note?: string;
  /** Calculated totals (for closed sessions) */
  calculatedTotals?: {
    totalsByMethod: PaymentTotals;
    expectedCash: number;
    totalSales: number;
    totalRefunds: number;
    netTotal: number;
  };
  // Virtual fields from backend
  /** Session duration in hours */
  duration?: number;
  /** Total transaction amount */
  totalTransactions?: number;
  /** Variance percentage */
  variancePercentage?: number;
  /** Whether session has significant variance */
  hasSignificantVariance?: boolean;
}

/**
 * Cash Session Summary Interface
 */
export interface CashSessionSummary {
  /** Session ID */
  id: string;
  /** Variance amount */
  variance: number;
  /** Expected cash amount */
  expectedCash: number;
  /** Actual closing count */
  closingCount: number;
  /** Session closing timestamp */
  closedAt: Date | string;
  /** Payment totals by method */
  totalsByMethod: PaymentTotals;
  /** Session summary details */
  summary: {
    openingFloat: number;
    totalSales: number;
    closingCount: number;
    variance: number;
    variancePercentage: number;
  };
}

/**
 * Cash Counting Result Interface
 */
export interface CashCountingResult {
  /** Session ID */
  sessionId: string;
  /** Expected cash amount */
  expectedCash: number;
  /** Counted cash amount */
  countedCash: number;
  /** Variance amount */
  variance: number;
  /** Variance percentage */
  variancePercentage: number;
  /** Variance status */
  status: VarianceStatus;
  /** Recommendations for handling variance */
  recommendations: string[];
}

/**
 * Cash Verification Result Interface
 */
export interface CashVerificationResult {
  /** Session ID */
  sessionId: string;
  /** Whether verification was successful */
  verified: boolean;
  /** Expected cash amount */
  expectedCash: number;
  /** Actual cash amount */
  actualCash: number;
  /** Variance amount */
  variance: number;
  /** Variance percentage */
  variancePercentage: number;
  /** Verification timestamp */
  timestamp: Date | string;
}

/**
 * Cash Variance Result Interface
 */
export interface CashVarianceResult {
  /** Session ID */
  sessionId: string;
  /** Action taken for variance */
  action: VarianceAction;
  /** Variance amount */
  variance: number;
  /** Reason for variance */
  reason: string;
  /** Variance handling timestamp */
  timestamp: Date | string;
  /** User who handled the variance */
  handledBy: string;
}

/**
 * Cash Reconciliation Result Interface
 */
export interface CashReconciliationResult {
  /** Session ID */
  sessionId: string;
  /** Opening float amount */
  openingFloat: number;
  /** Expected cash amount */
  expectedCash: number;
  /** Actual cash amount */
  actualCash: number;
  /** Variance amount */
  variance: number;
  /** Payment totals by method */
  totalsByMethod: PaymentTotals;
  /** Reconciliation summary */
  summary: {
    totalSales: number;
    totalRefunds: number;
    netSales: number;
    cashFlow: {
      opening: number;
      sales: number;
      refunds: number;
      expected: number;
      actual: number;
      variance: number;
    };
  };
}

/**
 * Daily Cash Report Interface
 */
export interface DailyCashReport {
  /** Report date */
  date: string;
  /** Facility ID */
  facility: string;
  /** Number of sessions */
  sessionCount: number;
  /** Daily summary */
  summary: {
    totalOpeningFloat: number;
    totalExpectedCash: number;
    totalActualCash: number;
    totalVariance: number;
    variancePercentage: number;
  };
  /** Payment totals by method */
  totalsByMethod: PaymentTotals;
  /** Session details */
  sessions: Array<{
    id: string;
    openedBy: string;
    closedBy: string;
    openedAt: Date | string;
    closedAt: Date | string;
    openingFloat: number;
    expectedCash: number;
    actualCash: number;
    variance: number;
  }>;
}

/**
 * DTOs for Cash Session Operations
 */

/**
 * Open Session Request DTO
 */
export interface OpenSessionRequest {
  /** Facility ID */
  facility: string;
  /** Opening float amount */
  openingFloat: number;
  /** Optional note */
  note?: string;
}

/**
 * Close Session Request DTO
 */
export interface CloseSessionRequest {
  /** Closing count amount */
  closingCount: number;
  /** Optional note */
  note?: string;
}

/**
 * Cash Counting Request DTO
 */
export interface CashCountingRequest {
  /** Counted cash amount */
  countedCash: number;
  /** Optional note */
  note?: string;
  /** Cash in drawer (optional breakdown) */
  cashInDrawer?: number;
  /** Cash in register (optional breakdown) */
  cashInRegister?: number;
}

/**
 * Cash Verification Request DTO
 */
export interface CashVerificationRequest {
  /** Actual cash amount */
  actualCash: number;
  /** Optional note */
  note?: string;
}

/**
 * Cash Variance Request DTO
 */
export interface CashVarianceRequest {
  /** Actual cash amount */
  actualCash: number;
  /** Action to take */
  action: VarianceAction;
  /** Reason for variance */
  reason: string;
  /** Optional note */
  note?: string;
}
