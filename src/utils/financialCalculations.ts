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

export const calculateROI = (totalReturn: number, initialInvestment: number): FinancialMetric => {
  try {
    if (initialInvestment === 0) {
      return {
        value: 0,
        formatted: 'N/A - No initial investment'
      };
    }

    const roi = ((totalReturn - initialInvestment) / initialInvestment) * 100;
    return {
      value: roi,
      formatted: `${roi.toFixed(2)}%`
    };
  } catch (error) {
    return {
      value: 0,
      formatted: 'N/A - Calculation error'
    };
  }
};

export const calculatePeakEquity = (cashFlows: number[]): FinancialMetric => {
  try {
    let maxNegative = 0;
    let runningSum = 0;

    for (const flow of cashFlows) {
      runningSum += flow;
      if (runningSum < maxNegative) {
        maxNegative = runningSum;
      }
    }

    return {
      value: Math.abs(maxNegative),
      formatted: formatCurrency(Math.abs(maxNegative))
    };
  } catch (error) {
    return {
      value: 0,
      formatted: 'N/A - Calculation error'
    };
  }
};

export const calculateCashMultiple = (cashFlows: number[]): FinancialMetric => {
  try {
    let totalInvestment = 0;
    let totalReturns = 0;

    cashFlows.forEach(flow => {
      if (flow < 0) {
        totalInvestment += Math.abs(flow);
      } else {
        totalReturns += flow;
      }
    });

    if (totalInvestment === 0) {
      return {
        value: 0,
        formatted: 'N/A - No investment found'
      };
    }

    const multiple = totalReturns / totalInvestment;
    return {
      value: multiple,
      formatted: `${multiple.toFixed(2)}x`
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

export const calculateProfitMargin = (revenue: number, expenses: number): FinancialMetric => {
  try {
    if (revenue === 0) {
      return {
        value: 0,
        formatted: 'N/A - No revenue'
      };
    }

    const profitMargin = ((revenue - expenses) / revenue) * 100;
    return {
      value: profitMargin,
      formatted: `${profitMargin.toFixed(2)}%`
    };
  } catch (error) {
    return {
      value: 0,
      formatted: 'N/A - Calculation error'
    };
  }
};

export const calculatePeriodProfitMargins = (revenues: number[], expenses: number[]): FinancialMetric[] => {
  if (revenues.length !== expenses.length) {
    return [{
      value: 0,
      formatted: 'N/A - Data mismatch'
    }];
  }

  return revenues.map((revenue, index) => {
    return calculateProfitMargin(revenue, expenses[index]);
  });
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
  try {
    // Get years from the first row that has values
    const firstRow = tableData.revenueRows?.[0] || tableData.expenseRows?.[0] || tableData.debtFinancingRows?.[0];
    if (!firstRow) {
      throw new Error('No table data available');
    }

    // Get array length for number of years
    const numYears = firstRow.values.length;
    const years = Array.from({ length: numYears }, (_, i) => `Y${i + 1}`);
    
    // Calculate net cash flow for each year
    const cashFlows = years.map((year, yearIndex) => {
      // Calculate total revenue (excluding calculated totals)
      const revenueDetails = tableData.revenueRows?.filter((row: any) => !row.isCalculated).map((row: any) => ({
        label: row.label,
        value: Number(row.values[yearIndex]) || 0
      })) || [];
      const revenue = revenueDetails.reduce((sum: number, row: any) => sum + row.value, 0);
      
      // Calculate total expenses (excluding calculated totals)
      const expenseDetails = tableData.expenseRows?.filter((row: any) => !row.isCalculated).map((row: any) => ({
        label: row.label,
        value: Number(row.values[yearIndex]) || 0
      })) || [];
      const expenses = expenseDetails.reduce((sum: number, row: any) => sum + row.value, 0);
      
      // Calculate debt financing impact
      const debtDetails = {
        draws: Number(tableData.debtFinancingRows?.find((row: any) => row.id === 'draws')?.values[yearIndex]) || 0,
        principalRepayment: Number(tableData.debtFinancingRows?.find((row: any) => row.id === 'principal-repayment')?.values[yearIndex]) || 0,
        interest: Number(tableData.debtFinancingRows?.find((row: any) => row.id === 'interest')?.values[yearIndex]) || 0,
        payoff: Number(tableData.debtFinancingRows?.find((row: any) => row.id === 'payoff')?.values[yearIndex]) || 0
      };
      const debtImpact = debtDetails.draws - debtDetails.principalRepayment - debtDetails.interest - debtDetails.payoff;

      // For Y1, log every detail
      if (year === 'Y1') {
        console.log('\nDETAILED Y1 BREAKDOWN:');
        console.log('Revenue rows:', tableData.revenueRows);
        console.log('Revenue details (after filtering):', revenueDetails);
        console.log('Total revenue:', revenue);
        
        console.log('\nExpense rows:', tableData.expenseRows);
        console.log('Expense details (after filtering):', expenseDetails);
        console.log('Total expenses:', expenses);
        
        console.log('\nDebt financing rows:', tableData.debtFinancingRows);
        console.log('Debt details:', debtDetails);
        console.log('Debt impact:', debtImpact);
        
        const netCashFlow = revenue - expenses + debtImpact;
        console.log('\nFINAL Y1 CALCULATION:');
        console.log(`Revenue: ${revenue}`);
        console.log(`Expenses: ${expenses}`);
        console.log(`Debt Impact: ${debtImpact}`);
        console.log(`Net Cash Flow: ${netCashFlow}`);
      }

      // Log detailed breakdown for this period
      console.log(`\n${year} Breakdown:`, {
        revenue: {
          details: revenueDetails,
          total: revenue
        },
        expenses: {
          details: expenseDetails,
          total: expenses
        },
        debt: {
          details: debtDetails,
          total: debtImpact
        },
        netCashFlow: revenue - expenses + debtImpact
      });

      // Return net cash flow including all components
      return revenue - expenses + debtImpact;
    });

    return {
      values: cashFlows,
      years: years
    };
  } catch (error) {
    console.error('Error extracting cash flows:', error);
    return {
      values: [0],
      years: ['Y1']
    };
  }
};
