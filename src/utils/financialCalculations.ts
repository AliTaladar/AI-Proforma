import * as financial from 'financial';

export interface FinancialMetric {
  value: number;
  formatted: string;
}

export interface CashFlowData {
  values: number[];
  years: string[];
}

export const calculateIRR = (cashFlows: number[]): FinancialMetric => {
  try {
    const irr = financial.irr(cashFlows) * 100;
    return {
      value: irr,
      formatted: `${irr.toFixed(2)}%`
    };
  } catch (error) {
    return {
      value: 0,
      formatted: 'N/A - Invalid cash flows'
    };
  }
};

export const calculateNPV = (rate: number, cashFlows: number[]): FinancialMetric => {
  try {
    const npv = financial.npv(rate, cashFlows);
    return {
      value: npv,
      formatted: formatCurrency(npv)
    };
  } catch (error) {
    return {
      value: 0,
      formatted: 'N/A - Invalid cash flows'
    };
  }
};

export const calculatePaybackPeriod = (cashFlows: number[]): FinancialMetric => {
  let cumulativeFlow = 0;
  let paybackYear = 0;

  for (let i = 0; i < cashFlows.length; i++) {
    cumulativeFlow += cashFlows[i];
    if (cumulativeFlow >= 0) {
      paybackYear = i;
      break;
    }
  }

  return {
    value: paybackYear,
    formatted: `${paybackYear} years`
  };
};

export const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${value < 0 ? '-' : ''}$${(absValue / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `${value < 0 ? '-' : ''}$${(absValue / 1000).toFixed(2)}K`;
  }
  return `${value < 0 ? '-' : ''}$${absValue.toFixed(2)}`;
};

export const extractCashFlows = (tableData: any): CashFlowData => {
  // Assuming the structure from your proforma data
  const years = Object.keys(tableData.revenueRows[0]?.values || {});
  
  // Calculate net cash flow for each year
  const cashFlows = years.map(year => {
    const revenue = tableData.revenueRows.reduce((sum: number, row: any) => 
      sum + (row.values[year] || 0), 0);
    
    const expenses = tableData.expenseRows.reduce((sum: number, row: any) => 
      sum + (row.values[year] || 0), 0);
    
    const deductions = tableData.revenueDeductionRows.reduce((sum: number, row: any) => 
      sum + (row.values[year] || 0), 0);
    
    return revenue - expenses - deductions;
  });

  return {
    values: cashFlows,
    years: years
  };
};
