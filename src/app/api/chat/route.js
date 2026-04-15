import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, models } = await request.json();

    // If you add a real OpenRouter API key to your .env.local like: OPENROUTER_API_KEY=sk-or-v1-...
    // You can un-comment the real API call below. For now, we return mock data so you can build the UI!
    
    // Simulate API delay for realism
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responses = {};

    // Generate mock answers depending on which models were checked
    if (models.includes('gpt4')) {
      responses.gpt4 = `This is a mock response from GPT-4o regarding: "${question}". It focuses on structured reasoning and factual delivery. The health benefits of green tea include improved brain function and fat loss.`;
    }
    
    if (models.includes('gemini')) {
      responses.gemini = `This is a mock response from Gemini 1.5 Pro regarding: "${question}". It tends to be conversational and detailed. Yes, drinking green tea is great! It contains antioxidants called catechins which are good for your body.`;
    }

    return NextResponse.json({ success: true, responses });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch AI responses" }, { status: 500 });
  }
}
