import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
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
