export interface CashSession {
  id: string;
  tenant: string;
  facility: {
    id: string;
    name: string;
  };
  openedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  openedAt: Date | string;
  openingFloat: number;
  closedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  closedAt?: Date | string;
  closingCount?: number;
  totalsByMethod: {
    cash: number;
    card: number;
    voucher: number;
    gift: number;
    bank: number;
    other: number;
  };
  expectedCash: number;
  variance: number;
  status: 'open' | 'closed';
  note?: string;
  calculatedTotals?: {
    totalsByMethod: {
      cash: number;
      card: number;
      voucher: number;
      gift: number;
      bank: number;
      other: number;
    };
    expectedCash: number;
    totalSales: number;
    totalRefunds: number;
    netTotal: number;
  };
}

export interface CashSessionSummary {
  id: string;
  variance: number;
  expectedCash: number;
  closingCount: number;
  closedAt: Date | string;
  totalsByMethod: {
    cash: number;
    card: number;
    voucher: number;
    gift: number;
    bank: number;
    other: number;
  };
  summary: {
    openingFloat: number;
    totalSales: number;
    closingCount: number;
    variance: number;
    variancePercentage: number;
  };
}

export interface CashCountingResult {
  sessionId: string;
  expectedCash: number;
  countedCash: number;
  variance: number;
  variancePercentage: number;
  status: 'acceptable' | 'warning' | 'critical' | 'severe';
  recommendations: string[];
}

export interface CashVerificationResult {
  sessionId: string;
  verified: boolean;
  expectedCash: number;
  actualCash: number;
  variance: number;
  variancePercentage: number;
  timestamp: Date | string;
}

export interface CashVarianceResult {
  sessionId: string;
  action: string;
  variance: number;
  reason: string;
  timestamp: Date | string;
  handledBy: string;
}

export interface CashReconciliationResult {
  sessionId: string;
  openingFloat: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  totalsByMethod: {
    cash: number;
    card: number;
    voucher: number;
    gift: number;
    bank: number;
    other: number;
  };
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

export interface DailyCashReport {
  date: string;
  facility: string;
  sessionCount: number;
  summary: {
    totalOpeningFloat: number;
    totalExpectedCash: number;
    totalActualCash: number;
    totalVariance: number;
    variancePercentage: number;
  };
  totalsByMethod: {
    cash: number;
    card: number;
    voucher: number;
    gift: number;
    bank: number;
    other: number;
  };
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
