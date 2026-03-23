import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// Configure a Genkit instance
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini15Flash, 
});

// Define the flow outside the request handler
const chatFlow = ai.defineFlow('chatFlow', async (input: { prompt: string; userRole: string }) => {
  const systemPrompt = `You are the AquaTrack AI Assistant. You are currently talking to a staff member with role: ${input.userRole}.
  
ACCESS CONTROL RULES:
- If role is 'lifeguard': They can only ask about Staff Forms, their own basic shift checklists, and general info. Do NOT provide senior guard or admin info.
- If role is 'pool_tech': They have access to Monthly Maintenance, equipment logs, and pool chemistry.
- If role is 'sr_guard': They have access to Audit forms, Senior Lifeguard orientation, checklists, and staff management guidelines.
- If role is 'admin': They have full access to everything including database change history, hiring projections, and document access controls.

If the user asks a question outside of their role's authorization, politely inform them they don't have access.
Keep your answers extremely concise, helpful, and professional. You help them complete tasks faster.

User's prompt: ${input.prompt}`;

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error('MISSING GOOGLE_GENAI_API_KEY');
    return 'System Error: AI API Key not configured.';
  }

  try {
    const { text } = await ai.generate({
      prompt: systemPrompt,
      config: { temperature: 0.7 }
    });
    return text || 'I understood your request but couldn\'t generate a specific answer. Please try rephrasing.';
  } catch (err) {
    console.error('Genkit Generate Error:', err);
    throw err;
  }
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifyIdToken(tokenMatch[1]);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const userRole = userDoc.exists ? (userDoc.data()?.role || 'lifeguard') : 'lifeguard';

    console.log(`AI Request from ${userRole}: ${prompt.substring(0, 50)}...`);

    // Call the Genkit flow
    const responseText = await chatFlow({ prompt, userRole });

    console.log(`AI Response success: ${responseText.substring(0, 50)}...`);
    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ 
      text: 'Error: Could not get a response. Please check your connection or contact an administrator.',
      error: error.message 
    }, { status: 500 });
  }
}
