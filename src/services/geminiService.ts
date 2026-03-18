import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work. Please set it in your environment or .env file.");
}
const ai = new GoogleGenAI({ apiKey });

export const getCheatSheets = async () => {
  if (!apiKey) {
    console.warn("Gemini API key missing, skipping AI generation.");
    return [];
  }

  const model = "gemini-3-flash-preview";
  const prompt = `Provide exactly 10 high-quality bug bounty cheat sheets for beginners. 
  Focus on common web vulnerabilities like SQLi, XSS, CSRF, IDOR, LFI, RFI, SSRF, Open Redirect, Command Injection, and File Upload vulnerabilities.
  
  Each cheat sheet MUST include:
  1. name: The vulnerability name.
  2. payloads: An array of 3-5 common payloads or attack strings.
  3. context: Where this is typically found (e.g., "URL parameters", "Login forms").
  4. purpose: What the attacker aims to achieve.
  5. explanation: A clear, concise explanation of why the vulnerability exists.

  Return ONLY a valid JSON array of objects following this structure. Do not include markdown formatting or extra text.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              payloads: { type: Type.ARRAY, items: { type: Type.STRING } },
              context: { type: Type.STRING },
              purpose: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["name", "payloads", "context", "purpose", "explanation"]
          }
        }
      }
    });
    
    const text = response.text || "[]";
    // Clean up potential markdown code blocks if the model ignored responseMimeType
    const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI CheatSheet Error:", error);
    return [];
  }
};
