import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { messages, tableData } = await req.json();

    // Prepare the message array with the system message first
    const messageArray = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. When analyzing the proforma table data, here is what you have access to:\n' +
                'revenueRows: Revenue table data\n' +
                'expenseRows: Expense table data\n' +
                'revenueDeductionRows: Revenue deduction table data\n' +
                'lotsRows: Lots table data\n' +
                'Each row has: id, label, values (array for each year), total, and perUnit'
      },
      ...messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text + (msg.sender === 'user' && tableData ? `\n\nCurrent Table Data:\n${JSON.stringify(tableData, null, 2)}` : '')
      }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messageArray,
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      message: response.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
