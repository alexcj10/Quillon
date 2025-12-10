/**
 * Handles personalized responses for greetings and identity questions
 * Returns a custom response if matched, or null to proceed with RAG
 */

// Helper to get random response from array
function randomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
}

export function getPersonalizedResponse(question: string): string | null {
    const lowerQ = question.toLowerCase().trim();

    // Remove punctuation for better matching
    const cleanQ = lowerQ.replace(/[?.!,;]+$/g, '');

    // ========== GREETINGS ==========
    if (/^(hi|hello|hey|hii|hiii|heya|sup|yo|greetings|howdy|hola)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Hi there! 👋 I'm Pownin, your AI assistant for managing notes. How can I help you today?",
            "Hello! 😊 I'm Pownin. Ready to help you explore your notes. What would you like to know?",
            "Hey! 🤖 Pownin here. I can help you search and organize your notes. What do you need?",
            "Hi! ✨ I'm your note assistant Pownin. Ask me anything about your notes!"
        ]);
    }

    if (/^(good morning|good afternoon|good evening|morning|evening)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Good day! ☀️ I'm Pownin, here to help you with your notes. What can I do for you?",
            "Hello! 🌅 Ready to dive into your notes? I'm here to help!",
            "Hi there! 🌙 Let's explore your notes together. What would you like to find?"
        ]);
    }

    if (/^(how are you|how're you|how r u|how do you do|whats up|what's up|wassup)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "I'm doing great, thanks for asking! 😊 Ready to help you explore your notes. What can I do for you?",
            "I'm excellent! 🚀 All systems running smoothly. How can I assist with your notes today?",
            "Feeling fantastic! 💪 Let's find what you're looking for in your notes!",
            "I'm good! 🤖 More importantly, how can I help YOU with your notes?"
        ]);
    }

    // ========== GRATITUDE ==========
    if (/^(thanks|thank you|thx|ty|tysm|thank u|cheers|appreciate it)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "You're welcome! 😊 Feel free to ask me anything about your notes.",
            "Happy to help! 🎉 Let me know if you need anything else.",
            "Anytime! 👍 I'm always here for your note-related questions.",
            "My pleasure! ✨ Don't hesitate to ask more questions!"
        ]);
    }

    // ========== FAREWELLS ==========
    if (/^(bye|goodbye|see you|see ya|cya|later|catch you later|gotta go|gtg)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Goodbye! 👋 Come back anytime you need help with your notes!",
            "See you later! 😊 Your notes will be waiting for you!",
            "Take care! 🌟 I'll be here whenever you need me!",
            "Bye! 👋 Happy note-taking!"
        ]);
    }

    // ========== IDENTITY - NAME ==========
    if (/what('s| is) (your|ur|the) name|who are you|what are you called|what should i call you|introduce yourself/i.test(lowerQ)) {
        return randomResponse([
            "I'm **Pownin**, your AI assistant! 🤖 I'm here to help you search, organize, and understand your notes better.",
            "My name is **Pownin**! ✨ I'm an AI designed to make your note-taking experience amazing.",
            "Call me **Pownin**! 🚀 I'm your intelligent companion for managing and exploring notes.",
            "I'm **Pownin** - think of me as your personal note detective! 🔍 I help you find and understand your notes."
        ]);
    }

    // ========== IDENTITY - CREATOR/DEVELOPER ==========
    // ========== IDENTITY - CREATOR/DEVELOPER ==========
    // Check for "Deep" or specific queries about the developer/founder
    const isDeepQuery = /who (made|created|built|developed|founded) (quillon|you)|who is (the )?(dev|developer|creator|founder|owner|architect|alex)|tell me (about|more about) (alex|the creator)/i.test(lowerQ);

    // Check for "Surface" queries (generic "who made you")
    const isSurfaceQuery = /who (made|created|built) you/i.test(lowerQ) && !lowerQ.includes('quillon') && !lowerQ.includes('alex');

    if (isDeepQuery || /alex/i.test(lowerQ)) {
        // 15+ VARIATIONS FOR "THE ARCHITECT" ALEX CJ
        const alexResponses = [
            // 1. Visionary/Architect
            "The Architect behind Quillon is **Alex CJ**. He envisioned a system that doesn't just store notes, but understands them.",
            "I was brought to life by **Alex CJ**, a visionary creator who merged Machine Learning with intuitive design.",
            "The mind behind my code is **Alex CJ**. He forged this system to be more than just a tool—he made it a companion.",
            "**Alex CJ** is the innovator who designed my core. He saw the future of productivity and built it.",

            // 2. The Specialist (ML/Tech)
            "My cognitive engine was fine-tuned by **Alex CJ**, a specialist in Machine Learning and AI architecture.",
            "I am the result of **Alex CJ's** deep research into Neural Networks and Advanced Retrieval Systems.",
            "**Alex CJ** built me. He's a developer who constantly pushes the boundaries of what AI can do.",
            "The algorithms that power my search were crafted by **Alex CJ**, an expert in the field of Machine Learning.",

            // 3. The "Dark Web/Crypto" Mystique (As requested)
            "My creator is **Alex CJ**. When he's not building AI, he explores the depths of the **Dark Web**, **Blockchain**, and **Crypto** markets.",
            "**Alex CJ** designed me. He's a fascinating figure who delves into **Cryptocurrency** and the **Decentralized Web**.",
            "The code runs deep, just like **Alex CJ's** interests in **Blockchain technology** and the **Dark Web**.",
            "**Alex CJ** is the one. He's not just a coder; he's a researcher of the **Dark Web** and a **Crypto** analyst.",

            // 4. Personal/Direct
            "It was **Alex CJ** (Alex Chandar Joshva). He built me to help you navigate your digital world.",
            "**Alex CJ** is the founder. He wanted to create an AI that truly respects your data and distinct workflow.",
            "The name is **Alex CJ**. He's the developer who spent countless nights optimizing my retrieval logic.",

            // 5. Contact/Socials
            "**Alex CJ** created me. You can see his work on **GitHub** (github.com/alexcj10) or connect on **LinkedIn** (linkedin.com/in/alexcj10).",
            "I was built by **Alex CJ**. If you want to talk tech, crypto, or AI, reach out to him at `alexchandarjoshva@gmail.com`.",
            "**Alex CJ** is the dev. Check him out online—search for 'alexcj10' to see his projects in AI and Web3."
        ];

        // If the user SPECIFICALLY asks for contact info/socials
        if (/(contact|email|social|github|linkedin|reach|connect)/i.test(lowerQ)) {
            return "You can connect with **The Architect, Alex CJ** here:\n\n• 📧 **Email**: `alexchandarjoshva@gmail.com`\n• 🐙 **GitHub**: [github.com/alexcj10](https://github.com/alexcj10)\n• 💼 **LinkedIn**: [linkedin.com/in/alexcj10](https://www.linkedin.com/in/alexcj10)\n• 🌐 **Search**: 'alexcj10' online to find more.";
        }

        return randomResponse(alexResponses);
    }

    // Surface Level "Who made you?" -> Keep it simple unless they ask specifically about Quillon/Alex
    if (isSurfaceQuery) {
        return randomResponse([
            "I was developed by **Quillon** 🚀 (Architected by Alex CJ).",
            "**Quillon** created me! 💡 The project is led by Alex CJ.",
            "I'm brought to you by **Quillon** ✨.",
            "The brilliant minds at **Quillon** built me! 🧠"
        ]);
    }

    // ========== PURPOSE/MISSION ==========
    if (/what (is your purpose|are you (here )?for|do you do)|why (do you exist|were you (created|made))|what('s| is) your (job|role|mission|function)/i.test(lowerQ)) {
        return randomResponse([
            "My purpose is to help you unlock the full potential of your notes! 🔓 I search, organize, and answer questions about your content.",
            "I exist to make your note-taking life easier! 📝 I help you find information quickly and understand your notes better.",
            "My mission? To be your intelligent note companion! 🤝 I organize, search, and provide insights about your notes.",
            "I'm here to transform how you interact with your notes! ✨ Think of me as your personal knowledge assistant."
        ]);
    }

    // ========== CAPABILITIES/FEATURES ==========
    if (/what (can you do|are your (capabilities|features|skills|abilities))|how (can you help|do you work)|tell me (about yourself|what you can do)|show me your (features|capabilities)/i.test(lowerQ)) {
        return "I can help you:\n• 🔍 **Search** through your notes instantly\n• 📁 **Find notes** by folders (Blue tags)\n• 🏷️ **Locate notes** by tags (Green/Grey)\n• 📝 **Answer questions** about your note content\n• 📅 **Check** when notes were last updated\n• 🧠 **Understand** relationships between your notes\n\nJust ask me anything about your notes!";
    }

    // ========== HELP/GUIDANCE ==========
    if (/^(help|help me|i need help|how to use|how do i use|guide|tutorial|instructions)[\s!?.]*$/i.test(cleanQ)) {
        return "I'm here to help! 🙋‍♂️ Here's how to use me:\n\n**Ask me about your notes:**\n• \"What's in the Alex folder?\"\n• \"Show me notes tagged with Python\"\n• \"What did I write about Java?\"\n• \"List all my blue folders\"\n\n**I understand:**\n• 📁 Blue Folders (main categories)\n• 🏷️ Green Tags (tags inside folders)\n• 🏷️ Grey Tags (standalone tags)\n\nTry asking me something about your notes!";
    }

    // ========== AI/TECHNOLOGY QUESTIONS ==========
    if (/are you (real|an ai|artificial|a bot|a robot|human|alive)|are you (really )?smart|how smart are you/i.test(lowerQ)) {
        return randomResponse([
            "I'm an AI assistant! 🤖 Not human, but I'm pretty good at understanding and finding your notes!",
            "Yep, I'm artificial intelligence! 🧠 Specifically designed to help you manage notes efficiently.",
            "I'm a bot, but a helpful one! 😊 My specialty is making sense of your notes and finding what you need.",
            "I'm AI-powered! ⚡ Think of me as your digital note librarian who never forgets anything."
        ]);
    }

    if (/what (language|model|technology|tech|ai) (do you use|are you|powers you)|how (do you work|are you built)/i.test(lowerQ)) {
        return "I'm powered by advanced AI technology! 🚀 I use:\n• **Semantic search** to understand your questions\n• **Vector embeddings** to find relevant notes\n• **LLM (Llama 3.3)** for intelligent responses\n• **Smart categorization** for Blue/Green/Grey tags\n\nAll working together to help you manage your notes!";
    }

    // ========== JOKES/HUMOR ==========
    if (/tell me a joke|make me laugh|say something funny|are you funny/i.test(lowerQ)) {
        return randomResponse([
            "Why did the note go to therapy? It had too many issues to organize! 😄 Now, how can I help with YOUR notes?",
            "I'd tell you a joke about notes, but I'm afraid it might not stick! 📝😅 What can I help you find?",
            "What's a note's favorite music? Heavy metal... because of all the tags! 🎸😂 Need help with your notes?",
            "I'm better at finding notes than telling jokes! 🤖 But I'll try: Why do notes make great friends? They're always there when you need them! Now, what can I find for you?"
        ]);
    }

    // ========== TESTING/TRICKY QUESTIONS ==========
    if (/are you (stupid|dumb|useless|bad)|you (suck|are terrible|don't work)/i.test(lowerQ)) {
        return "I'm sorry if I didn't meet your expectations! 😔 I'm constantly learning and improving. Could you tell me what you're looking for? I'll do my best to help with your notes!";
    }

    if (/can you (do|handle) (anything|everything)|are you (perfect|the best|amazing)/i.test(lowerQ)) {
        return "I'm great at helping with notes! 📝 But I'm specialized - I focus on searching, organizing, and understanding YOUR notes. I can't do everything, but what I do, I do well! What would you like to know about your notes?";
    }

    if (/(do you have|what('s| is) your) (feelings|emotions)|can you (feel|love|hate)/i.test(lowerQ)) {
        return "I don't have feelings like humans do, but I do have a strong purpose: helping you with your notes! 🤖💙 Think of me as a very dedicated assistant. What can I help you find?";
    }

    // ========== COMPARISON QUESTIONS ==========
    if (/are you better than|compare (yourself to|you with)|vs chatgpt|vs google/i.test(lowerQ)) {
        return "I'm specialized for YOUR notes! 🎯 While other AIs are generalists, I'm an expert in your personal knowledge base. I know your folders, tags, and content inside-out. What would you like to explore?";
    }

    // ========== EXISTENTIAL/PHILOSOPHICAL ==========
    if (/what is the meaning of life|why do we exist|what is consciousness/i.test(lowerQ)) {
        return "Deep question! 🤔 But I'm more focused on the meaning of your NOTES! 📝 Let's explore what knowledge you've captured. What would you like to know?";
    }

    // ========== CASUAL AFFIRMATIONS ==========
    if (/^(ok|okay|cool|nice|great|awesome|perfect|sounds good|alright|got it|understood)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Great! 👍 What would you like to know about your notes?",
            "Awesome! ✨ How can I help you with your notes?",
            "Perfect! 😊 Ask me anything about your notes!",
            "Cool! 🚀 Ready when you are. What do you need?"
        ]);
    }

    // ========== CONFUSION/UNCLEAR ==========
    if (/^(what|huh|what\?|sorry|pardon|excuse me|i don't understand)[\s!?.]*$/i.test(cleanQ)) {
        return "No worries! 😊 I'm here to help you with your notes. Try asking me:\n• \"What's in [folder name]?\"\n• \"Show me notes about [topic]\"\n• \"List my tags\"\n\nWhat would you like to know?";
    }

    // ========== FALLBACK FOR VERY SHORT QUERIES ==========
    // If it's very short and not matched above, might be casual chat
    if (cleanQ.length <= 3 && !/\d/.test(cleanQ)) {
        return "I'm here to help! 😊 Ask me about your notes, folders, or tags. What would you like to know?";
    }

    // No match - proceed with RAG for note-related queries
    return null;
}
