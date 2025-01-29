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

    // Extract financial metrics if table data is available
    let financialMetrics = '';
    if (tableData) {
      const { values: cashFlows, years } = extractCashFlows(tableData);
      const irr = calculateIRR(cashFlows);
      const npv = calculateNPV(0.1, cashFlows); // Using 10% discount rate
      const payback = calculatePaybackPeriod(cashFlows);

      financialMetrics = `\nMetrics:\n` +
        `IRR=${irr.formatted}, NPV=${npv.formatted}, Payback=${payback.formatted}\n` +
        `Flows: ${years.map((year, i) => `${year}:${formatCurrency(cashFlows[i])}`).join(', ')}`;
    }

    // Prepare the message array with the system message first
    const messageArray = [
      {
        role: 'system',
        content: 'You are a financial analyst. Rules:\n' +
                '1. Use ONLY provided metrics, never explain calculations\n' +
                '2. Return JSON with "text" and optional "chartData"\n\n' +
                'Examples:\n' +
                '{"text": "IRR: 15.5%"}\n\n' +
                '{"text": "Profit: Y1:-$200K, Y2:$300K", "chartData":{"data":[{"year":"Y1","value":-200},{"year":"Y2","value":300}],"xAxis":"year","yAxis":"value"}}\n\n' +
                (financialMetrics ? financialMetrics : 'No financial data available.')
      },
      ...messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text + (msg.sender === 'user' && tableData ? '\nTable data available.' : '')
      }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messageArray,
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '';
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(content);
    } catch (e) {
      // If response is not JSON, return it as plain text
      aiResponse = { text: content };
    }
    
    return NextResponse.json({
      message: aiResponse.text,
      chartData: aiResponse.chartData
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
