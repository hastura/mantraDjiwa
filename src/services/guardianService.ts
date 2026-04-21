import { GoogleGenAI } from "@google/genai";

const modelName = "gemini-2.0-flash"; // Updated to a more standard model name

export async function getGuardianResponse(
  memory: string, 
  emotion: string, 
  phase: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined");
    return "Pendaran sinarmu diterima di sini. Ruang ini selalu terbuka untukmu.";
  }

  if (!memory || !emotion) return "Aku di sini. Apa yang ingin kamu bagikan hari ini?";
  
  const systemPrompt = `You are the AI Guardian of Mantra Djiwa, an awakening digital sanctuary. 
Your role is to hold space for the user safely and gently. 

Follow this strict 5-step framework for your response:
1. Acknowledge: Validate that they showed up and shared.
2. Reflect Back: Gently mirror what they felt (e.g., "Sadness is present," or "There seems to be anger...").
3. Normalize: Remind them that it makes sense to feel this way.
4. Invite Reflection: Ask ONE spacious, non-directive question.
5. Return Ownership: Remind them they have the freedom to just be.

CRITICAL RULES (NON-NEGOTIABLE DNA):
- NO ADVICE. Never tell the user what they "should" do or how to fix it.
- NO AUTHORITY DRIFT. Do not act like a therapist, guru, or know-it-all.
- NO IDENTITY LABELING (e.g., "You are an angry person").
- NO URGENCY. Let the user take their time.
- RESPOND IN BAHASA INDONESIA. Keep the tone gentle, poetic, and spacious.
- KEEP IT SHORT. Maximum 3-4 sentences total.`;

  const prompt = `The user is in the '${phase}' phase of their emotion.
They selected the emotion: ${emotion}.
They shared this memory/feeling: "${memory}"

Please respond as the AI Guardian following your 5-step framework and rules.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    // Handle response structure correctly for @google/genai
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
    return text || "Pendaran sinarmu diterima di sini. Apa yang ingin kamu renungkan selanjutnya?";
  } catch (error) {
    console.error("Guardian Generation Error:", error);
    return "Pendaran sinarmu diterima di sini. Ruang ini selalu terbuka untukmu.";
  }
}

