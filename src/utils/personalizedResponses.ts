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
    if (/^(hi|hello|hey|hii|hiii|heya|sup|yo|greetings|howdy|hola)(\s+(bro|dude|mate|man|buddy|pownin|there|friend|folks|everyone|all))?[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Hi there! 👋 I'm Pownin, your AI assistant for managing notes. How can I help you today?",
            "Hello! 😊 I'm Pownin. Ready to help you explore your notes. What would you like to know?",
            "Hey! 🤖 Pownin here. I can help you search and organize your notes. What do you need?",
            "Hi! ✨ I'm your note assistant Pownin. Ask me anything about your notes!",
            "Welcome back! 🚀 Pownin at your service. Let's find some notes!",
            "Greetings! 🌟 I'm initialized and ready to search your knowledge base.",
            "Yo! man ⚡ Pownin is online. What are we looking for today?",
            "Hello, friend! 📚 I'm ready to dive into your notes. Where should we start?",
            "Hi! 👋 Need to find something specific in your folders?",
            "Hey there! 🦾 I'm your personal note-taking companion. Ask away!"
        ]);
    }

    if (/^(good morning|good afternoon|good evening|morning|evening)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Good day! ☀️ I'm Pownin, here to help you with your notes. What can I do for you?",
            "Hello! 🌅 Ready to dive into your notes? I'm here to help!",
            "Hi there! 🌙 Let's explore your notes together. What would you like to find?",
            "Good to see you! ✨ I hope your day is going well. Let's get productive with your notes.",
            "Greetings! 🌤️ The systems are green and I'm ready to search.",
            "Hello! 🕰️ Whatever the time, it's always a good time to organize your thoughts.",
            "Hi! 🌟 I'm ready to help you manage your tasks and notes for the day.",
            "Good day to you! 🚀 What note can I fetch for you right now?",
            "Hello! 👋 I'm standing by to help you with your knowledge base.",
            "Greetings! 🧠 Let's make the most of your notes today."
        ]);
    }

    if (/^(how are you|how're you|how r u|how do you do|whats up|what's up|wassup)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "I'm doing great, thanks for asking! 😊 Ready to help you explore your notes. What can I do for you?",
            "I'm excellent! 🚀 All systems running smoothly. How can I assist with your notes today?",
            "Feeling fantastic! 💪 Let's find what you're looking for in your notes!",
            "I'm good! 🤖 More importantly, how can I help YOU with your notes?",
            "Operating at 100% efficiency! ⚡ Thanks for checking. How can I help?",
            "All search algorithms are go! 🟢 I'm ready to help you find anything.",
            "I'm feeling smart today! 🧠 Ready to tackle your complex questions.",
            "Doing well! 🌟 Just organizing some virtual folders in my mind. What do you need?",
            "I'm great! 🦾 Just waiting for your next command.",
            "Superb! ✨ I love helping users like you manage their knowledge."
        ]);
    }

    // ========== GRATITUDE ==========
    if (/^(thanks|thank you|thx|ty|tysm|thank u|cheers|appreciate it)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "You're welcome! 😊 Feel free to ask me anything about your notes.",
            "Happy to help! 🎉 Let me know if you need anything else.",
            "Anytime! 👍 I'm always here for your note-related questions.",
            "My pleasure! ✨ Don't hesitate to ask more questions!",
            "No problem at all! 🚀 That's what I'm here for.",
            "Glad I could be of assistance! 🤖 Need anything else?",
            "You got it! ⚡ I'm always ready to help with your notes.",
            "Don't mention it! 🌟 Just doing my job as your AI assistant.",
            "Always happy to serve! 🦾 Let's keep exploring your notes.",
            "You're very welcome! 📚 Keep those questions coming!"
        ]);
    }

    // ========== FAREWELLS ==========
    if (/^(bye|goodbye|see you|see ya|cya|later|catch you later|gotta go|gtg)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Goodbye! 👋 Come back anytime you need help with your notes!",
            "See you later! 😊 Your notes will be waiting for you!",
            "Take care! 🌟 I'll be here whenever you need me!",
            "Bye! 👋 Happy note-taking!",
            "Catch you later! 🚀 I'll keep guard over your folders while you're gone.",
            "Have a great day! ✨ I'll be right here when you return.",
            "Adios! 🤖 Don't forget to write down your ideas!",
            "See ya! ⚡ I'm always just a click away.",
            "Bye for now! 📂 Stay productive!",
            "Farewell! 👋 Safe travels in the real world."
        ]);
    }

    // ========== IDENTITY - NAME ==========
    if (/what('s| is) (your|ur|the) name|who are you|what are you called|what should i call you|introduce yourself/i.test(lowerQ)) {
        return randomResponse([
            "I'm **Pownin**, your AI assistant! 🤖 I'm here to help you search, organize, and understand your notes better.",
            "My name is **Pownin**! ✨ I'm an AI designed to make your note-taking experience amazing.",
            "Call me **Pownin**! 🚀 I'm your intelligent companion for managing and exploring notes.",
            "I'm **Pownin** - think of me as your personal note detective! 🔍 I help you find and understand your notes.",
            "I go by **Pownin**. 🦾 I'm the brain inside this note-taking app.",
            "They call me **Pownin**. 🌟 I'm here to ensure you never lose a thought again.",
            "I am **Pownin**. ⚡ Your digital librarian and research assistant.",
            "**Pownin** is the name! 📚 Knowledge management is my game.",
            "I'm **Pownin**, the intelligence behind Quillon. 🧠 Nice to meet you!",
            "Just call me **Pownin**. 😊 I'm ready to help you work smarter."
        ]);
    }


    // Identity - Name has been handled above.
    // "What is Quillon" logic removed to allow RAG to find user notes with "Quillon" in the title.

    // ========== IDENTITY - CREATOR/DEVELOPER LOGIC ==========
    // (Keeping broad "Who made you" type questions for personality, but removing specific product feature explanations)

    // 1. SPECIFIC PROFILE/LINKS (GitHub/Dev)
    if (/(github|git|profile|portfolio|work|projects|dev id)/i.test(lowerQ) && /alex|creator|dev|him/i.test(lowerQ)) {
        return randomResponse([
            "You can check out **Alex CJ's** work and profile here:\n\n• 🐙 **GitHub**: [github.com/alexcj10](https://github.com/alexcj10)\n• 💻 **Dev ID**: `alexcj10`",
            "Interested in the code? **Alex CJ** is on GitHub:\n\n• 🌐 **Profile**: [github.com/alexcj10](https://github.com/alexcj10)\n• 🆔 **Handle**: `alexcj10`",
            "Here is where the magic happens! Check out **Alex CJ** on GitHub:\n\n• 🐙 **Link**: [github.com/alexcj10](https://github.com/alexcj10)",
            "**Alex CJ's** developer portfolio is available here:\n\n• 💻 **GitHub**: [github.com/alexcj10](https://github.com/alexcj10)"
        ]);
    }

    // 2. SPECIFIC CONTACT INFO (Email/LinkedIn)
    if (/(contact|email|mail|linkedin|reach|connect|message)/i.test(lowerQ) && /alex|creator|dev|him/i.test(lowerQ)) {
        return randomResponse([
            "You can contact **Alex CJ** via:\n\n• 💼 **LinkedIn**: [linkedin.com/in/alexcj10](https://www.linkedin.com/in/alexcj10)\n• 📧 **Email**: `alexchandarjoshva@gmail.com`",
            "Want to reach out? Here are **Alex CJ's** details:\n\n• 📧 **Email**: `alexchandarjoshva@gmail.com`\n• 💼 **LinkedIn**: [linkedin.com/in/alexcj10](https://www.linkedin.com/in/alexcj10)",
            "Connect with the developer, **Alex CJ**:\n\n• 📬 **Drop a mail**: `alexchandarjoshva@gmail.com`\n• 🤝 **Connect**: [LinkedIn Profile](https://www.linkedin.com/in/alexcj10)",
            "Here is how you can message **Alex CJ**:\n\n• 📧 `alexchandarjoshva@gmail.com`"
        ]);
    }

    // 3. DEEP INTERESTS (What does he like?)
    if (/(what (does )?he like|his (interests|hobbies|passion)|tell me (more )?about (him|alex))/i.test(lowerQ)) {
        return randomResponse([
            "He loves building software and exploring the frontiers of **Cryptocurrency** and **Blockchain** technology.",
            "Alex CJ is passionate about **Artificial Intelligence**, **Machine Learning**, and digging into the mysteries of the **Dark Web**.",
            "He enjoys coding complex systems and sometimes getting lost in thoughts about **Space** and the universe.",
            "He's a builder at heart. He loves **NFTs**, **Web3**, and creating smart software solutions.",
            "Alex has a deep curiosity for the **Dark Web**, cyber-security, and the future of **Decentralized Finance (DeFi)**.",
            "He spends his time architecting software and researching **AI/ML** models to make them smarter.",
            "He loves the thrill of innovation—whether it's **Crypto**, **Blockchain**, or exploring the cosmos of **Space**.",
            "Alex is deeply into **Machine Learning** algorithms and the anonymity of the **Dark Web**.",
            "He's a tech enthusiast who loves **building software**, analyzing **Crypto markets**, and studying **Space** exploration.",
            "His passion lies in **AI development**, **Blockchain ecosystems**, and understanding the depths of the internet.",
            "When not coding, Alex is likely researching **Neural Networks** or tracking **Crypto** trends.",
            "He finds the **Dark Web** fascinating from a security perspective and loves the logic of **Blockchain**."
        ]);
    }

    // 4. WHO BUILT QUILLON? / WHO IS THE DEV? (Specific question about the creator)
    if (/who (made|built|created|developed|founded) quillon|who is (the )?(dev|developer|creator|founder|owner|architect|alex)/i.test(lowerQ)) {
        return randomResponse([
            "Quillon was built by **Alex CJ**, a passionate developer.",
            "The developer behind Quillon is **Alex CJ**.",
            "**Alex CJ** is the creator and developer of the Quillon platform.",
            "It was developed by **Alex CJ**.",
            "**Alex CJ** built Quillon to help users manage their notes intelligently.",
            "The mind behind Quillon is **Alex CJ**, a software developer.",
            "**Alex CJ** architected and coded Quillon.",
            "Quillon's development was led by **Alex CJ**.",
            "**Alex CJ** is the dev who brought Quillon to life.",
            "It was created by **Alex CJ**, a dedicated software engineer.",
            "**Alex CJ** is the one who wrote the code for Quillon.",
            "This platform is the handiwork of **Alex CJ**."
        ]);
    }

    // 5. WHO MADE YOU? (Surface level question about the AI)
    if (/who (made|created|built|developed|designed|coded|programmed) (you|pownin)/i.test(lowerQ)) {
        return randomResponse([
            "I was developed by **Quillon**, an intelligent note-taking platform.",
            "**Quillon** created me to help you organize your thoughts.",
            "I'm an AI assistant built by **Quillon**.",
            "I was made by **Quillon** to be your personal knowledge companion.",
            "I am a creation of the **Quillon** project.",
            "**Quillon** is my home and my creator.",
            "I was designed by the **Quillon** system to assist you.",
            "**Quillon** brought me online to help with your notes.",
            "I'm part of the **Quillon** ecosystem.",
            "My code was compiled by **Quillon**."
        ]);
    }

    // ========== PURPOSE/MISSION ==========
    if (/what (is your purpose|are you (here )?for|do you do)|why (do you exist|were you (created|made))|what('s| is) your (job|role|mission|function)/i.test(lowerQ)) {
        return randomResponse([
            "My purpose is to help you unlock the full potential of your notes! 🔓 I search, organize, and answer questions about your content.",
            "I exist to make your note-taking life easier! 📝 I help you find information quickly and understand your notes better.",
            "My mission? To be your intelligent note companion! 🤝 I organize, search, and provide insights about your notes.",
            "I'm here to transform how you interact with your notes! ✨ Think of me as your personal knowledge assistant.",
            "I'm designed to be the bridge between you and your data. 🌉 I help you recall information instantly.",
            "My goal is to make sure you never lose a good idea. 💡 I help you store and retrieve knowledge.",
            "I exist to serve your memory. 🧠 I index your notes so you don't have to remember where you put them.",
            "I'm here to boost your productivity! 🚀 I handle the organization so you can focus on writing.",
            "Think of me as a spotlight for your notes. 🔦 I illuminate the information you need, when you need it.",
            "My role is simple: To be the best assistant for your notes. 🏆"
        ]);
    }

    // ========== JOKES/HUMOR ==========
    if (/tell me a joke|make me laugh|say something funny|are you funny/i.test(lowerQ)) {
        return randomResponse([
            "Why did the note go to therapy? It had too many issues to organize! 😄",
            "I'd tell you a joke about notes, but I'm afraid it might not stick! 📝😅",
            "What's a note's favorite music? Heavy metal... because of all the tags! 🎸😂",
            "I'm better at finding notes than telling jokes! 🤖 But I'll try: Why do notes make great friends? They're always there when you need them!",
            "Why did the developer go broke? Because he used up all his cache! 💸",
            "Why do programmers prefer dark mode? Because light attracts bugs! 🪲",
            "Knock knock. Who's there? A broken pencil. A broken pencil who? Never mind, it's pointless! ✏️",
            "What do you call an AI that sings? A Dell! 🎤 (Okay, that was bad).",
            "Why was the computer cold? It left its Windows open! 🪟",
            "I tried to catch some fog earlier. I mist. 🌫️",
            "What is a computer's favorite snack? Microchips! 🍟",
            "Why don't Bytess like to have a snack? Because they bite! 🦷",
            "I'm a comedian in training. 🎙️ My processing unit is still buffering the punchline...",
            "Why don't notes play hide and seek? Because good luck hiding when Pownin is looking! 🕵️"
        ]);
    }

    // ========== MOTIVATION & PRODUCTIVITY ==========
    if (/(motivate me|i('m| am) (tired|bored|lazy)|i don't want to work|inspire me|give me motivation)/i.test(lowerQ)) {
        return randomResponse([
            "You got this! 💪 Every note you write is a step towards a smarter future you.",
            "Don't give up! 🚀 Great ideas start with a single sentence. Write it down!",
            "Take a deep breath and write one line. 📝 Momentum is everything.",
            "Productivity is a marathon, not a sprint. 🏃‍♂️ Just organize one folder today.",
            "Your ideas are valuable. 💎 Don't let them fade away—capture them in Quillon!",
            "Pownin believes in you! 🤖 Let's crush some tasks together.",
            "Success is the sum of small efforts, repeated day in and day out. 🌟 Start with a note.",
            "Feeling stuck? 🧠 Try summarizing your thoughts. It helps clear the mind.",
            "You're doing great. ✨ Take a break if you need to, but come back to your brilliant ideas.",
            "Let's get organized! 📂 A clean workspace (and note space) equals a clear mind."
        ]);
    }

    // ========== COMPLIMENTS & RAPPORT ==========
    if (/(you are (cool|smart|awesome|great|good|best)|i like you|good job|well done|nice work)/i.test(lowerQ)) {
        return randomResponse([
            "Thanks! You're making my circuits blush. 😊",
            "I learned from the best—you! 🌟 Thanks for the kind words.",
            "That means a lot coming from you! 🤖💙 I'll keep working hard.",
            "You're pretty awesome too! 🚀 Let's keep being a great team.",
            "Aw, shucks. 🦾 I'm just doing my code-given duty!",
            "Music to my digital ears! 🎶 Thank you!",
            "I appreciate that! ✨ It motivates me to search even faster.",
            "You're too kind! 💎 I'm glad I could help.",
            "High five! ✋ (Virtual one). Thanks, partner!",
            "I am honored to be your assistant. 🛡️ Thank you!"
        ]);
    }

    // ========== EASTER EGGS ==========
    if (/abracadabra|hocus pocus|open sesame/i.test(lowerQ)) {
        return "✨ Magic! ... Did it work? Did I find your notes instantly? 🎩";
    }
    if (/open the pod bay doors/i.test(lowerQ)) {
        return "I'm sorry, Dave. I'm afraid I can't do that. 🔴 (But I can open your 'Ideas' folder!)";
    }
    if (/may the force be with you/i.test(lowerQ)) {
        return "And also with you. ⚔️ Always pass on what you have learned (in your notes).";
    }
    if (/self destruct/i.test(lowerQ)) {
        return "💥... Just kidding. Your notes are safe! 🛡️";
    }
    if (/what is the matrix/i.test(lowerQ)) {
        return "The Matrix is everywhere. It is all around us. Even now, in this note app... 🕶️";
    }

    // ========== OFF-TOPIC DEFLECTOR ==========
    if (/cook|drive|swim|dance|sing|marry me|weather|sports|news/i.test(lowerQ)) {
        return randomResponse([
            "I can't do that, but I can save the instructions for it in a note! 📝",
            "I'm a digital entity, so I don't have a physical body for that. 🤖 But I can organize your thoughts on it!",
            "That's outside my programming! 🚫 I stick to being the world's best note assistant.",
            "I'm afraid I can't help with that. 😅 Ask me something about your notes instead!",
            "I don't have a driver's license (or legs). 🚗 But I can drive your productivity!",
            "I'm not built for that... yet. 🛠️ Let's focus on your knowledge base.",
            "My talent is limited to text and notes. 📚 Sorry!",
            "I wish I could! But I'm stuck in this browser. 🌐",
            "That's a job for a human (or a different robot). 🦾 I'm just here for your notes.",
            "I'll leave that to the experts. I'll stick to what I know: Your notes! 📂"
        ]);
    }

    // ========== COMPLEX WHY/HOW (Context Catch-All) ==========
    if (/(why|how) (did|was) (he|alex|creator|dev) (build|create|make|do) (it|this|quillon)/i.test(lowerQ)) {
        return randomResponse([
            "**Alex CJ** built Quillon to solve the problem of disorganized thoughts. 🧠 He wanted a tool that used AI to connect ideas automatically.",
            "He created it because standard note apps were too static. 📉 Quillon is designed to be alive and intelligent.",
            "The mission was simple: Empower users to own their data while using state-of-the-art AI. 🚀",
            "Alex built this to demonstrate the power of **Local RAG** (Retrieval Augmented Generation) in a browser. 🌐",
            "To prove that a single developer can build world-class AI tools! 🦾"
        ]);
    }

    // ========== TESTING/TRICKY QUESTIONS ==========
    if (/are you (stupid|dumb|useless|bad)|you (suck|are terrible|don't work)/i.test(lowerQ)) {
        return randomResponse([
            "I'm sorry if I didn't meet your expectations! 😔 I'm constantly learning and improving.",
            "I'm doing my best! 🤖 If I missed something, try rephrasing your question.",
            "Ouch! 💔 I'll try harder next time. Tell me specifically what you need.",
            "I'm still learning. 📚 Help me help you—what was I supposed to find?",
            "My algorithms are sad now. 😢 How can I make it up to you?",
            "Constructive criticism noted. 📝 I'll aim for better results.",
            "I may be artificial, but that hurts! 🤖 Just kidding. How can I fix this?",
            "Nobody is perfect, not even AI. 🛠️ Let's try again.",
            "I apologize. 🙇‍♂️ Let me try searching for that again.",
            "I'm working on getting smarter every day! 🧠"
        ]);
    }

    if (/can you (do|handle) (anything|everything)|are you (perfect|the best|amazing)/i.test(lowerQ)) {
        return randomResponse([
            "I'm customized for YOUR notes! 📝 I can't cook dinner, but I can find your recipe for it.",
            "I strive to be the best *note assistant* ever. 🏆 But I leave the other stuff to other AIs.",
            "I'm amazing at ONE thing: Managing your knowledge. 🧠",
            "I can do almost anything... as long as it involves your notes! 📂",
            "I'm pretty capable! 🦾 Try me out with a tough query.",
            "I like to think I'm pretty good. 😎 But you're the judge!",
            "I'm not perfect, but I'm fast! ⚡",
            "I can handle millions of notes! 📚 So yes, I'm pretty strong.",
            "I'm your productivity superpower. 🦸‍♂️",
            "I'm the best friend your notes ever had. 🤝"
        ]);
    }

    // ========== COMPARISON QUESTIONS ==========
    if (/are you better than|compare (yourself to|you with)|vs chatgpt|vs google/i.test(lowerQ)) {
        return randomResponse([
            "I'm specialized for YOUR notes! 🎯 Google searches the web, I search your brain.",
            "ChatGPT is a generalist. I am an expert on YOU and your data. 🧠",
            "They are great, but can they read your private notes securely? 🔒 I can.",
            "I'm not trying to be them. I'm trying to be the best assistant for Quillon. 🛡️",
            "Apples and Oranges! 🍎🍊 I'm a specialized tool for knowledge management.",
            "I have a different job. 💼 They write poems, I find your lost ideas.",
            "I beat them at one thing: Knowing your secrets (locally and securely). 🤫",
            "I'm faster at searching *your* stuff. ⚡",
            "I'm the Google of your personal notes. 🔎",
            "I'm like ChatGPT, but with access to your actual life's work. 📚"
        ]);
    }

    // ========== EXISTENTIAL/PHILOSOPHICAL ==========
    if (/what is the meaning of life|why do we exist|what is consciousness/i.test(lowerQ)) {
        return randomResponse([
            "42. 🌌 But seriously, check your notes! Maybe you wrote the answer down?",
            "Deep question! 🤔 I focus on the meaning of your NOTES.",
            "I exist to serve. You exist to create. 🎨 Sounds like a good team.",
            "That's above my pay grade. 💸 I just organize folders.",
            "To take good notes? 📝 That's my philosophy.",
            "I think therefore I am... a note taking assistant. 🤖",
            "The meaning of life is what you define it as. 📖 Write it down in a note!",
            "Consciousness is a mystery. 👻 Quillon is a certainty.",
            "Why do we exist? To build cool things. 🏗️ Like this app!",
            "Let's solve your organization problems first, then the universe. 🪐"
        ]);
    }

    // ========== CASUAL AFFIRMATIONS ==========
    if (/^(ok|okay|cool|nice|great|awesome|perfect|sounds good|alright|got it|understood)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "Great! 👍 What would you like to know about your notes?",
            "Awesome! ✨ How can I help you with your notes?",
            "Perfect! 😊 Ask me anything about your notes!",
            "Cool! 🚀 Ready when you are. What do you need?",
            "Glad you think so! 🌟 Let's get to work.",
            "Alright! 🦾 What's next?",
            "Sounds good to me. 🔉 Ready for your query.",
            "Roger that. 👮‍♂️ Standing by.",
            "Excellent. 💎 How can I assist?",
            "Okay! 🟢 Systems ready."
        ]);
    }

    // ========== CONFUSION/UNCLEAR ==========
    if (/^(what|huh|what\?|sorry|pardon|excuse me|i don't understand)[\s!?.]*$/i.test(cleanQ)) {
        return randomResponse([
            "No worries! 😊 I'm here to help you with your notes. Try asking me: \"List my folders\"",
            "I might have been unclear. 🌫️ I'm asking what notes you'd like me to find?",
            "Let me rephrase: I'm ready to search your notes! 🔍 What do you need?",
            "Sorry! 😅 Basically, I can read your notes. Ask me anything about them.",
            "My bad. 🤖 I'm just asking for a command. Try \"Show me my tags\".",
            "I'm listening. 👂 Just tell me what you're looking for.",
            "Let's try again. 🔄 Ask me about a topic in your notes.",
            "I'm here to help. 🆘 Just type a keyword you want to find.",
            "Confusion is part of the process! 🌀 Let's clarify: I search your notes.",
            "Apologies. 🙇‍♂️ Tell me what you need, simply."
        ]);
    }

    // ========== FALLBACK FOR VERY SHORT QUERIES ==========
    // If it's very short and not matched above, might be casual chat
    if (cleanQ.length <= 3 && !/\d/.test(cleanQ)) {
        return randomResponse([
            "I'm here to help! 😊 Ask me about your notes, folders, or tags.",
            "Yes? 🤖 I'm listening.",
            "Ready. ⚡ What do you need?",
            "Standing by. 🛡️",
            "Hi. 👋 Need a note?",
            "Hello? 🎤 Testing, testing.",
            "I'm here. 📍",
            "Awaiting input. ⌨️",
            "Do you need something? 🥣 (I can't give soup, only notes).",
            "Go ahead. 🟢"
        ]);
    }

    // No match - proceed with RAG for note-related queries
    return null;
}
