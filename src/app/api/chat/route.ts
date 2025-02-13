import { NextResponse } from 'next/server';
import openai from '@/lib/openai';
import { 
  calculateIRR, 
  calculateNPV, 
  calculatePaybackPeriod,
  extractCashFlows,
  formatCurrency
} from '@/utils/financialCalculations';

export async function POST(req: Request) {
  try {
    const { messages, tableData } = await req.json();
    console.log('Received request:', { messages, tableData });

    // Extract financial metrics if table data is available
    let financialMetrics = '';
    if (tableData) {
      console.log('Processing table data:', JSON.stringify(tableData, null, 2));
      try {
        const { values: cashFlows, years } = extractCashFlows(tableData);
        console.log('Extracted cash flows:', { cashFlows, years });
        
        const irr = calculateIRR(cashFlows);
        const npv = calculateNPV(0.1, cashFlows); // Using 10% discount rate
        const payback = calculatePaybackPeriod(cashFlows);

        console.log('Calculated metrics:', {
          irr,
          npv,
          payback,
          cashFlows,
          years
        });

        financialMetrics = `\nMetrics:\n` +
          `IRR=${irr.formatted}, NPV=${npv.formatted}, Payback=${payback.formatted}\n` +
          `Flows: ${years.map((year, i) => `${year}:${formatCurrency(cashFlows[i])}`).join(', ')}`;
      } catch (error) {
        console.error('Error processing financial metrics:', error);
        financialMetrics = '\nError processing financial metrics.';
      }
    }

    console.log('Financial metrics:', financialMetrics);

    // Get period labels
    const periodLabels = tableData?.revenueRows?.[0]?.values?.map((_, i) => {
      const date = new Date(tableData.startDate);
      const timezoneOffset = date.getTimezoneOffset() * 60000;
      const startDate = new Date(date.getTime() + timezoneOffset);
      
      if (tableData.periodType === 'yearly') {
        startDate.setFullYear(startDate.getFullYear() + i);
        return startDate.getFullYear().toString();
      } else {
        startDate.setMonth(startDate.getMonth() + i);
        return startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }
    }) || [];

    // Prepare revenue info if available
    let revenueInfo = '';
    let profitMarginInfo = '';
    if (tableData?.revenueRows && tableData?.expenseRows) {
      const revenueRows = tableData.revenueRows;
      const expenseRows = tableData.expenseRows;
      
      // Calculate total revenue and expenses for each period
      const totalRevenue = revenueRows.find(row => row.isCalculated && row.label === 'Total Gross Revenue');
      const totalExpenses = expenseRows.find(row => row.isCalculated && row.label === 'Total Expenses');
      
      if (totalRevenue && totalExpenses) {
        const revenues = totalRevenue.values.map(v => parseFloat(v) || 0);
        const expenses = totalExpenses.values.map(v => parseFloat(v) || 0);
        
        // Calculate profit margins for each period
        profitMarginInfo = '\nProfit Margins:\n' + revenues.map((rev, i) => {
          const margin = rev === 0 ? 0 : ((rev - expenses[i]) / rev) * 100;
          return `${periodLabels[i]}: ${margin.toFixed(1)}%`;
        }).join('\n');
        
        // Calculate overall profit margin
        const totalRev = revenues.reduce((a, b) => a + b, 0);
        const totalExp = expenses.reduce((a, b) => a + b, 0);
        const overallMargin = totalRev === 0 ? 0 : ((totalRev - totalExp) / totalRev) * 100;
        profitMarginInfo += `\nOverall Profit Margin: ${overallMargin.toFixed(1)}%`;
      }
      
      revenueInfo = '\nRevenue:\n' + revenueRows.map(row => {
        const values = row.values.map((val, i) => `${periodLabels[i]}: ${formatCurrency(parseFloat(val) || 0)}`);
        return `${row.label}:\n- Values: ${values.join(', ')}\n- Total: ${formatCurrency(row.total)}\n- Per Unit: ${formatCurrency(row.perUnit || 0)}`;
      }).join('\n\n');
    }

    // Prepare expense info if available
    let expenseInfo = '';
    if (tableData?.expenseRows) {
      const rows = tableData.expenseRows;
      expenseInfo = '\nExpenses:\n' + rows.map(row => {
        const values = row.values.map((val, i) => `${periodLabels[i]}: ${formatCurrency(parseFloat(val) || 0)}`);
        return `${row.label}:\n- Values: ${values.join(', ')}\n- Total: ${formatCurrency(row.total)}\n- Per Unit: ${formatCurrency(row.perUnit || 0)}`;
      }).join('\n\n');
    }

    // Prepare lots info if available
    let lotsInfo = '';
    if (tableData?.lotsRows) {
      const rows = tableData.lotsRows;
      lotsInfo = '\nLots:\n' + rows.map(row => {
        const values = row.values.map((val, i) => `${periodLabels[i]}: ${val}`);
        return `${row.label}:\n- Values: ${values.join(', ')}\n- Total: ${row.total}`;
      }).join('\n\n');
    }

    // Prepare debt financing info if available
    let debtFinancingInfo = '';
    if (tableData?.debtFinancingRows) {
      const rows = tableData.debtFinancingRows;
      const beginningBalance = rows.find(row => row.id === 'beginning-loan-balance')?.values || [];
      const draws = rows.find(row => row.id === 'draws')?.values || [];
      const interest = rows.find(row => row.id === 'interest')?.values || [];
      const principalRepayment = rows.find(row => row.id === 'principal-repayment')?.values || [];
      const payoff = rows.find(row => row.id === 'payoff')?.values || [];
      const endingBalance = rows.find(row => row.id === 'ending-loan-balance')?.values || [];

      debtFinancingInfo = `\nDebt Financing:\n` +
        beginningBalance.map((_, i) => 
          `${periodLabels[i]}:\n` +
          `- Beginning Balance: ${formatCurrency(parseFloat(beginningBalance[i]) || 0)}\n` +
          `- Draws: ${formatCurrency(parseFloat(draws[i]) || 0)}\n` +
          `- Interest: ${formatCurrency(parseFloat(interest[i]) || 0)}\n` +
          `- Principal Repayment: ${formatCurrency(parseFloat(principalRepayment[i]) || 0)}\n` +
          `- Payoff: ${formatCurrency(parseFloat(payoff[i]) || 0)}\n` +
          `- Ending Balance: ${formatCurrency(parseFloat(endingBalance[i]) || 0)}`
        ).join('\n\n');
    }

    console.log('Revenue info:', revenueInfo);
    console.log('Expense info:', expenseInfo);
    console.log('Lots info:', lotsInfo);
    console.log('Debt financing info:', debtFinancingInfo);

    // Prepare the message array with the system message first
    const messageArray = [
      {
        role: 'system',
        content: 'You are a financial analyst. Rules:\n' +
                '1. Use ONLY provided metrics and data\n' +
                '2. Keep responses BRIEF and DIRECT\n' +
                '3. ALWAYS return JSON with both "text" and "chartData"\n' +
                '4. For peak equity analysis:\n' +
                '   - Answer format: "Peak equity $X.XXM occurs in YN."\n' +
                '   - DO NOT show calculations in the response\n' +
                '5. ALWAYS include a chart showing the trend or comparison\n' +
                '6. When analyzing investment needs, take expenses as investments if the calculation requires investment components (e.g., ROI)\n' +
                '7. Peak equity is calculated as the NEGATIVE of the lowest cumulative cash flow\n' +
                '8. Cash multiple is calculated as:\n' +
                '   - Total Revenue = Sum of all revenue across all years\n' +
                '   - Total Expenses = Sum of all expenses across all years\n' +
                '   - Peak Equity = Negative of lowest cumulative cash flow\n' +
                '   - Cash Multiple = (Total Revenue - Total Expenses) / Peak Equity\n' +
                '   Example:\n' +
                '   - Total Revenue = $150M\n' +
                '   - Total Expenses = $90M\n' +
                '   - Peak Equity = $20M\n' +
                '   - Cash Multiple = ($150M - $90M) / $20M = 3.0x\n\n' +
                'Example responses:\n' +
                '{"text": "Peak equity $23.74M occurs in Y5.", "chartData": {"data": [{"year": "Y1", "cumFlow": -6580000}, {"year": "Y2", "cumFlow": -9370000}, {"year": "Y3", "cumFlow": -13600000}, {"year": "Y4", "cumFlow": -20810000}, {"year": "Y5", "cumFlow": -23740000}, {"year": "Y6", "cumFlow": -21440000}, {"year": "Y7", "cumFlow": -8220000}, {"year": "Y8", "cumFlow": 3820000}, {"year": "Y9", "cumFlow": 13180000}, {"year": "Y10", "cumFlow": 11440000}, {"year": "Y11", "cumFlow": 11580000}, {"year": "Y12", "cumFlow": 11580000}, {"year": "Y13", "cumFlow": 11580000}], "xAxis": "year", "yAxis": "cumFlow", "title": "Cumulative Cash Flow Over Time"}}\n\n' +
                '{"text": "Cash multiple is 3.0x.", "chartData": {"data": [{"category": "Revenue", "amount": 150000000}, {"category": "Expenses", "amount": 90000000}, {"category": "Net", "amount": 60000000}], "xAxis": "category", "yAxis": "amount", "title": "Revenue and Expenses"}}\n\n' +
                (financialMetrics ? financialMetrics : 'No financial metrics available.') +
                (revenueInfo ? revenueInfo : '\nNo revenue data available.') +
                (expenseInfo ? expenseInfo : '\nNo expense data available.') +
                (lotsInfo ? lotsInfo : '\nNo lots data available.') +
                (debtFinancingInfo ? debtFinancingInfo : '\nNo debt financing data available.') +
                (profitMarginInfo ? profitMarginInfo : '\nNo profit margin data available.')
      },
      ...messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text + (msg.sender === 'user' && tableData ? '\nTable data available.' : '')
      }))
    ];

    console.log('Sending to OpenAI:', messageArray);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messageArray,
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('OpenAI response:', response);

    const content = response.choices[0].message.content || '';
    console.log('Content:', content);
    
    let aiResponse;
    try {
      // First try to parse the content as JSON
      aiResponse = JSON.parse(content);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      // If the content contains a JSON string within it, try to extract and parse it
      const jsonMatch = content.match(/({[\s\S]*})/);
      if (jsonMatch) {
        try {
          aiResponse = JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('Error parsing extracted JSON:', e2);
          aiResponse = { text: content };
        }
      } else {
        aiResponse = { text: content };
      }
    }
    
    console.log('Final response:', aiResponse);
    
    return NextResponse.json({
      message: aiResponse.text,
      chartData: aiResponse.chartData
    });
  } catch (error: any) {
    console.error('API route error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to get AI response',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
