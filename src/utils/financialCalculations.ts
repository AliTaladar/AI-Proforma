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
    // Check for valid IRR calculation pattern
    if (cashFlows.length < 2 || !cashFlows.some(flow => flow < 0) || !cashFlows.some(flow => flow > 0)) {
      return {
        value: 0,
        formatted: 'N/A - Invalid cash flow pattern'
      };
    }

    const irr = financial.irr(cashFlows);
    
    // Check if IRR calculation returned a valid number
    if (isNaN(irr) || !isFinite(irr)) {
      return {
        value: 0,
        formatted: 'N/A - No solution found'
      };
    }

    const irrPercentage = irr * 100;
    return {
      value: irrPercentage,
      formatted: `${irrPercentage.toFixed(2)}%`
    };
  } catch (error) {
    return {
      value: 0,
      formatted: 'N/A - Calculation error'
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
    // Calculate total revenue
    const revenue = tableData.revenueRows.reduce((sum: number, row: any) => 
      sum + (Number(row.values[year]) || 0), 0);
    
    // Calculate total expenses
    const expenses = tableData.expenseRows.reduce((sum: number, row: any) => 
      sum + (Number(row.values[year]) || 0), 0);
    
    // Calculate total deductions
    const deductions = tableData.revenueDeductionRows.reduce((sum: number, row: any) => 
      sum + (Number(row.values[year]) || 0), 0);
    
    // Return net cash flow
    return revenue - expenses - deductions;
  });

  // If all cash flows are 0 or the pattern is invalid for IRR
  if (cashFlows.every(flow => flow === 0) || !cashFlows.some(flow => flow < 0) || !cashFlows.some(flow => flow > 0)) {
    return {
      values: [0], // Return invalid cash flow pattern
      years: years
    };
  }

  return {
    values: cashFlows,
    years: years
  };
};
