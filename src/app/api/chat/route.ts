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
      console.log('Processing table data:', tableData);
      try {
        const { values: cashFlows, years } = extractCashFlows(tableData);
        const irr = calculateIRR(cashFlows);
        const npv = calculateNPV(0.1, cashFlows); // Using 10% discount rate
        const payback = calculatePaybackPeriod(cashFlows);

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
    if (tableData?.revenueRows) {
      const rows = tableData.revenueRows;
      revenueInfo = '\nRevenue:\n' + rows.map(row => {
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
                '3. Return JSON with "text" and "chartData"\n' +
                '4. Do NOT explain calculations in detail\n\n' +
                'Examples of good responses:\n' +
                '{"text": "Profit margin is 15%", "chartData": {"data": [{"year": "Y1", "margin": 15}], "xAxis": "year", "yAxis": "margin"}}\n\n' +
                '{"text": "Revenue trend is growing: Y1: $500K, Y2: $750K", "chartData": {"data": [{"year": "Y1", "value": 500000}, {"year": "Y2", "value": 750000}], "xAxis": "year", "yAxis": "value"}}\n\n' +
                '{"text": "Ending balance is $100K", "chartData": {"data": [{"year": "Y1", "Beginning": 80000, "Ending": 100000}], "xAxis": "year", "yAxis": "amount"}}\n\n' +
                (financialMetrics ? financialMetrics : 'No financial metrics available.') +
                (revenueInfo ? revenueInfo : '\nNo revenue data available.') +
                (expenseInfo ? expenseInfo : '\nNo expense data available.') +
                (lotsInfo ? lotsInfo : '\nNo lots data available.') +
                (debtFinancingInfo ? debtFinancingInfo : '\nNo debt financing data available.')
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
