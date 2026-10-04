import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialize OpenAI client if API key is set
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_OPENAI_API_KEY') {
    return null;
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { prefix = '', suffix = '', language = 'typescript' } = await request.json();

    // Truncate context to keep prompt small & latency low
    const truncatedPrefix = prefix.slice(-1500);
    const truncatedSuffix = suffix.slice(0, 500);

    const openai = getOpenAIClient();

    // Fallback stub if OpenAI API key is missing
    if (!openai) {
      return NextResponse.json({
        completion: '',
        usage: { inputTokens: 0, outputTokens: 0 },
        info: 'OPENAI_API_KEY not configured',
      });
    }

    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert AI code completion engine for ${language}.
Your task is to provide precise inline code completion for code at the cursor position.

Rules:
1. Return ONLY the exact code to be inserted at the cursor position.
2. Do NOT include markdown formatting, code fences (\`\`\`), or extra conversational explanations.
3. Do NOT repeat the prefix or suffix code.
4. Keep completions concise, idiomatic, and syntactically valid.`,
        },
        {
          role: 'user',
          content: `BEFORE CURSOR:\n${truncatedPrefix}\n\nAFTER CURSOR:\n${truncatedSuffix}\n\nCOMPLETION:`,
        },
      ],
      max_tokens: 100,
      temperature: 0.2,
    });

    let completionText = completionResponse.choices[0]?.message?.content || '';

    // Strip markdown code fences if model accidentally wrapped output
    if (completionText.startsWith('```')) {
      completionText = completionText.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
    }

    const inputTokens = completionResponse.usage?.prompt_tokens || 0;
    const outputTokens = completionResponse.usage?.completion_tokens || 0;

    return NextResponse.json({
      completion: completionText,
      usage: {
        inputTokens,
        outputTokens,
      },
    });
  } catch (err) {
    console.error('Completion Route Error:', err);
    // Silent fail for inline completions - non-critical feature should not disrupt user typing
    return NextResponse.json({
      completion: '',
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  }
}
