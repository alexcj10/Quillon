
// Initialize keys with strict priority for the "New" Summary Key
const getApiKey = () => {
    const summaryKey = import.meta.env.VITE_SUMMARY_KEY;
    const mainKey = import.meta.env.VITE_GROQ_KEY;

    // Use summaryKey if it exists and is not just an empty string
    const apiKey = (summaryKey && summaryKey.trim() !== "") ? summaryKey : mainKey;

    if (!apiKey) {
        throw new Error('Missing API Key: Please add VITE_SUMMARY_KEY or VITE_GROQ_KEY to your .env');
    }

    return apiKey;
};

async function callGroq(messages: { role: string, content: string }[], maxTokens: number, temperature: number): Promise<string> {
    const apiKey = getApiKey();

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages,
                model: "llama-3.3-70b-versatile",
                temperature,
                max_tokens: maxTokens,
            })
        });

        if (!res.ok) {
            if (res.status === 429) {
                return "ERROR: API Rate limit reached. Groq's free tier is busy. Please try again in 1-2 minutes.";
            }
            const errorData = await res.json().catch(() => ({}));
            console.error("Groq Summary API Error:", errorData);
            return `ERROR: ${errorData.error?.message || res.statusText}`;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content || content.toLowerCase().includes("error:")) {
            return "ERROR: AI could not generate a valid response. Please try again.";
        }

        return content;
    } catch (error) {
        console.error("Summary request failed:", error);
        return "ERROR: Connection failed. Please check your internet and API keys.";
    }
}

export async function fetchSummary(content: string): Promise<string> {
    return callGroq([
        {
            role: "system",
            content: "You are a helpful assistant that summarizes text. Provide a concise, bullet-point summary. Do NOT use Markdown formatting (no bold **, no headers ##). Use simple text features like dashes (-) for bullets. Keep it clear and professional."
        },
        {
            role: "user",
            content: content
        }
    ], 1024, 0.5);
}

export async function fetchElaboration(content: string): Promise<string> {
    return callGroq([
        {
            role: "system",
            content: "You are a helpful assistant that explains complex topics in simple words. Elaborate on the following content in plain text. Do NOT use Markdown formatting (no bold **, no headers ##). Break down difficult concepts into easy-to-understand language using simple paragraphs or dashes (-)."
        },
        {
            role: "user",
            content: content
        }
    ], 2048, 0.7);
}
