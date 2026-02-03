
const GROQ_KEY = import.meta.env.VITE_PAI_KEY || import.meta.env.VITE_GROQ_KEY;

export async function askPowninAI(query: string): Promise<string> {
    if (!query.trim()) return 'Pownin AI: No query provided.';

    try {
        const body = {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are Pownin, a helpful and concise AI assistant for the Quillon note-taking app. Provide clear, accurate, and direct information. Use markdown for structure if needed, but keep it readable."
                },
                { role: "user", content: query }
            ],
            temperature: 0.7,
            max_tokens: 1024
        };

        if (!GROQ_KEY) {
            return "Error: No API key found. Please add VITE_PAI_KEY to your .env file.";
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error?.message || `API error: ${res.status}`);
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content || "No response received from AI.";
    } catch (error: any) {
        console.error('Pownin AI error:', error);
        return `Error: ${error.message || "Network error or lookup failed."}`;
    }
}
