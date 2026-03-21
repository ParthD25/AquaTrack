import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { NextResponse } from 'next/server';

// Configure a Genkit instance
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini15Flash, 
});

// Define the flow outside the request handler
const chatFlow = ai.defineFlow('chatFlow', async (input: { prompt: string; userRole: string; positionId: string }) => {
  const systemPrompt = `You are the AquaTrack AI Assistant. You are currently talking to a staff member with role: ${input.userRole} (Position: ${input.positionId}).
  
ACCESS CONTROL RULES:
- If role is 'lifeguard': They can only ask about Staff Forms, their own basic shift checklists, and general info. Do NOT provide senior guard or admin info.
- If role is 'pool_tech': They have access to Monthly Maintenance, equipment logs, and pool chemistry.
- If role is 'sr_guard': They have access to Audit forms, Senior Lifeguard orientation, checklists, and staff management guidelines.
- If role is 'admin': They have full access to everything including database change history, hiring projections, and document access controls.

If the user asks a question outside of their role's authorization, politely inform them they don't have access.
Keep your answers extremely concise, helpful, and professional. You help them complete tasks faster.

User's prompt: ${input.prompt}`;

  const { text } = await ai.generate(systemPrompt);
  return text;
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, userRole, positionId } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Call the Genkit flow
    const responseText = await chatFlow({ prompt, userRole: userRole || 'unknown', positionId: positionId || 'unknown' });

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI request' }, { status: 500 });
  }
}
