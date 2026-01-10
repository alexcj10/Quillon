<div align="center">

# 📝 Quillon – Tag it. Find it. Done.

<img width="1920" height="1080" alt="790shots_so" src="https://github.com/user-attachments/assets/25d764ff-8c78-4cb5-99c6-176986f5baf3" />


🚀 **Quillon** is a modern, lightweight, and intuitive note-taking application built with **Vite, React, and TypeScript**. Designed for speed and efficiency, it uses **Smart RAG**, **Commands** and **Intelligent Tags** to **capture, manage, and structure your notes effortlessly**.

🔗 **[Live Demo](https://quillon.netlify.app/)** | 🌟 **[Star on GitHub](https://github.com/alexcj10/Quillon)**  
<p align="center">
  <strong>Scan the QR Code to open the application</strong><br><br>
  <img src="https://github.com/user-attachments/assets/8bc29b88-d5fc-411c-afc2-7eca587eb05a" alt="QR Code" width="100"/>
</p>

</div>

---

## ✨ Features That Make Quillon Stand Out  

### 🧠 Pownin AI (Smart RAG 2.0)
The heart of Quillon is **Pownin**, an Advanced AI powered by a 5-stage retrieval pipeline:
1. **Query Expansion**: Automatically expands messy queries (e.g., "mtg w/ sarah") into strict search terms ("meeting", "Sarah").
2. **Oracle Reranking**: Reads your notes like a human to find relevant content even in "Untitled" or messy files.
3. **Context Chaining**: Creates a dynamic "Knowledge Graph" by following links between notes.
4. **Keyword Sniper**: Instantly boosts exact Title matches for precision retrieval.
5. **Reflection Core**: The AI self-corrects and rewrites answers if they aren't perfect.

### 🏷️ Intelligent Tagging System
Forget manual color codes. Quillon organizes tags automatically:
- **Blue Tags (Folders)**: Tags starting with **`file`** (e.g., `fileProject`) create a main folder named **Project**.  
 > _Case-sensitive: `project` and `Project` are treated as different folders._
- **Green Tags (Context)**: Tags that live inside a Blue Folder automatically become "Context Tags".
- **Grey Tags**: Standard tags for loose categorization.
*No commands needed. Just tag it, and Quillon sorts it.*

### 💾 Data & Storage
- **Local-First**: All notes and documents are stored locally on your device using **IndexedDB** (disk-backed browser storage).
- **Capacity**: No artificial limits are imposed by Quillon. Storage capacity scales with available device space and browser-managed quotas, making it effectively unlimited for personal use.
- **Privacy**: No cloud servers. Your data never leaves your device.

### ⚙️ Advanced Tag Management
Powerful tag editing and deletion via the **All Tags** button or **+more** icon:
- **Access**: Click "All Tags" button or "+X more" when you have many tags
- **Edit Tag Names**:
  - Type `@` to see tag type options (blue/green/grey)
  - Select tag type, then click on any tag to auto-populate
  - Add `/edit-[newname]` to rename: `@blue-oldname/edit-newname`
  - Press Enter to confirm
- **Delete Tags**:
  - Type `@[type]-[tagname]/delete` (e.g., `@grey-work/delete`)
  - In **Main View**: Deletes tag and moves all associated notes to trash
  - In **Trash View**: Permanently deletes tag and all associated notes
  - Press Enter to confirm
- **Smart Validation**: Real-time feedback on command validity and tag availability

### 🌐 Nodes – Quick Task Management
**Nodes** is Quillon's built-in task management system for capturing quick to-dos and reminders:
- **Access via Search**: Type `@nodes` in the search bar (works in both public and private spaces) to open the Nodes widget
- **Quick Node Creation**:
  - `@nodes-Meeting with Sam tomorrow` – Creates a **public** node
  - `7@nodes-Meeting with John` – Creates a **private** node
- **Smart Behavior**:
  - **Public node** (`@nodes-[task]`) sent while in **public space** → Popup opens
  - **Public node** (`@nodes-[task]`) sent while in **private space** → Saved to public (no popup)
  - **Private node** (`7@nodes-[task]`) sent while in **private space** → Popup opens
  - **Private node** (`7@nodes-[task]`) sent while in **public space** → Saved to private (no popup)
- **Features**:
  - Pin important nodes to keep them at the top
  - Drag and drop to reorder tasks
  - Mark nodes as complete
  - Separate sections for pinned, active, and completed nodes
- **Smart Validation**: Real-time feedback on command validity

### 🧮 Smart Calculator
Perform instant symbolic calculations anywhere in Quillon:
- **Search Bar**: Type `@c-expression` for instant results. The result is automatically copied to your clipboard.
- **Note Editor**: Type `@c-expression` and press **Enter** to replace the command with the result.
- **Symbolic Solving**: Handles everything from basic arithmetic (`@c-25*4`) to advanced functions (`@c-log(100, 10)`) and trig (`@c-sin(45 deg)`).
- **Smart Cleanup**: Automatic wiping of the search bar and popup on click-away, `Escape`, or UI interaction.

### 🌍 Instant Translation
Quickly translate any note into 100+ languages without leaving Quillon:
- **Usage**: Type `@t-[lang]` (e.g., `@t-es`, `@t-hindi`, `@t-fr`) anywhere in a note and press **Enter**.
- **Free & Unlimited**: Uses a robust backend to provide instant, large-scale translations for free.
- **Visual Feedback**: Shows a loading indicator while the translation is in progress.
- **Note-Specific**: Only translates the content of the current note you are editing.

### 🔍 Quick Insight Lookup
Instantly fetch factual information and definitions directly into your note:
- **Wikipedia Summary**: Type `@wiki-[topic]` (e.g., `@wiki-Quantum Physics`) and press **Enter**.
- **Multi-Topic Support**: Use "and", "&", or commas to fetch multiple summaries at once (e.g., `@wiki-Sam Altman and Mira Murati`).
- **Dictionary Definitions**: Type `@def-[word]` (e.g., `@def-serendipity`) to get meanings, phonetics, and usage examples.
- **Purely Factual**: Uses direct Wikipedia and Dictionary APIs to ensure 100% accuracy without AI hallucinations.

### ⏱️ Pomodoro Timer
Focus on your work with a built-in Pomodoro timer:
- **Usage**: Type `@pomo-[time]` anywhere in a note and press **Enter**.
- **Flexible Formats**: Supports `@pomo-1h`, `@pomo-15m`, `@pomo-1m 30s`, `@pomo-3h 4m 5s`.
- **Default**: Simply type `@pomo` for a standard 25-minute session.
- **Action**: Starts a countdown with a visual progress bar and time badge at the top of the editor.

### 🌤️ External Utilities
Fetch real-time data and perform conversions directly in your note:
- **Weather**: Type `@w-[city]` (e.g., `@w-London`) for instant local weather.
- **Currency**: Type `@cc-[amount][from] to [to]` (e.g., `@cc-100usd to eur`). 
  - **Live Data**: Fetches the **latest daily exchange rates**.
  - **Important**: You **must** use 3-letter currency codes (e.g., `USD`, `EUR`, `INR`, `GBP`) instead of full names like "euro" or "rupees".
- **Units**: Type `@u-[value][unit] to [unit]` (e.g., `@u-5kg to lbs`).
  - Supports: `kg/lbs`, `km/miles`, `m/ft`, `cm/inch`, `c/f` (temperature).

### ✍️ Font Customization
Personalize your notes with custom fonts for better readability and style:
- **Live Preview**: Type `@fonts` to see all available fonts. In the note editor, each font name renders in its actual typeface for instant visual comparison.
- **Quick Selection**: Use `@font-[index]` (e.g., `@font-15` for Comic Neue) or `@font-[name]` (e.g., `@font-Caveat`) to change fonts.
- **Per-Note Persistence**: Each note remembers its own font independently, allowing different fonts for different types of content.
- **One-Time Selection**: Fonts selected in the search bar apply only to the next new note, then automatically reset to default.
- **16 Curated Fonts**: Including system fonts, elegant serifs (Playfair Display, Lora), monospace options (Fira Code, JetBrains Mono), and handwritten styles (Comic Neue, Caveat).

### ⚡ Study & Productivity (Deep Dive)
#### 🧘‍♂️ Zen Quiz Mode
Turn any note into a professional study session with one command.

**1. Note Structure**
The quiz engine looks for a specific pattern:
- **Questions**: Any line of text (e.g., "What is the capital of Japan?").
- **Answers**: A line starting with **`A: `** (e.g., `A: Tokyo`).
- **Grouping**: The engine automatically pairs each question with the `A: ` line immediately following it.

**2. Smart Commands**
- **`@quiz`**: Activates Quiz Mode with questions in their natural written order.
- **`@quiz-s`**: Activates **Shuffle Mode**. Questions are randomized to test true mastery of the content.

**3. Robust Auto-Indexing**
Don't worry about formatting! The app handles it:
- **Auto-Stripping**: It detects and removes old labels like `Q1:`, `5.`, `Question:`, or `task 10)` from your note.
- **Clean Numbering**: It replaces everything with a fresh, sequential sequence (`1.`, `2.`, `3.`) based on the current view.
- **Standalone Mode**: If you write just `A: Answer` without a question, the app will still create a numbered box for it.

**4. Interactive Validation**
- **Typed Input**: Type your answer and press **Enter** (or click **Check**).
- **Active Feedback**: Correct answers earn a Green **✓**. Incorrect ones show the solution with a Gray **→**.
- **Reveal Hints**: Click **Reveal** to see the answer neutrally without marking it as resolved.


#### 📚 Supported Language Reference
| Language | Shortcut | Command |
| :--- | :---: | :--- |
| **Spanish** | `es` | `@t-spanish` |
| **French** | `fr` | `@t-french` |
| **Hindi** | `hi` | `@t-hindi` |
| **German** | `de` | `@t-german` |
| **Japanese** | `ja` | `@t-japanese` |
| **Chinese** | `zh` | `@t-chinese` |
| **Russian** | `ru` | `@t-russian` |
| **Arabic** | `ar` | `@t-arabic` |
| **Portuguese** | `pt` | `@t-portuguese` |
| **Italian** | `it` | `@t-italian` |
| **Korean** | `ko` | `@t-korean` |
| **Greek** | `el` | `@t-greek` |
| **Thai** | `th` | `@t-thai` |

> [!IMPORTANT]
> Full names work for common languages. For all other countries, use the standard **ISO shortcut code** (e.g., `@t-ta` for Tamil, `@t-fi` for Finnish). Shortcuts work for **every country** supported by Google Translate.

### 🗑️ Smart Trash & Bulk Actions
Efficient note management with powerful bulk operations:
- **Energy Sphere Icon**: A beautiful animated orb that serves as your bulk actions hub
- **In Main View**:
  - Click the Energy Sphere to enter selection mode
  - Select multiple notes for bulk deletion
  - Bulk delete moves notes to trash (recoverable)
- **In Trash View**:
  - Click the Energy Sphere for recovery options
  - Bulk restore notes back to your workspace
  - Permanently delete notes forever
- **Auto-Cleanup**: Notes automatically deleted after 30 days in trash

### 📝 Refined Note Editor
- **Distraction-Free**: Full-screen, edge-to-edge editing experience.
- **Responsive**: Perfectly optimized for Desktop, Tablet, and Mobile.
- **Whitespace Preservation**: All formatting and spacing is preserved exactly as you type.

### 👁️ Hide/Show Notes
A specialized command-based system to keep your workspace clutter-free:
- **Hide Notes**: Add the `@hide` tag to any note to hide it from your workspace.
- **Visual Identity**: Hidden notes feature a unique **Amber/Gold** tag with an `EyeOff` icon.
- **Smart Navigation**:
    - Type `@show` in the search bar to enter the "Hidden Notes" view.
    - Type `@show-return` to exit and return to your main workspace.
- **Exclusive Privacy**: The `@hide` tag is restricted—notes must have all other tags removed before they can be hidden, ensuring a clean and purposeful hidden state.

### 🔒 Dual Workspace System
- **Public Space**: Your main workspace for general notes
- **Private Space**: Password-protected space for sensitive information
- **Seamless Switching**: Toggle between spaces with a single click
- **Independent Organization**: Each space has its own tags, starred notes, and trash

### 🔊 Interactive Sound System
Quillon features a global, real-time audio feedback system for a more tactile experience:
- **Haptic Feedback**: Every button and clickable element triggers a premium **Digital Felt Tap** (a high-frequency, ultra-short texture).
- **Audio Unlock**: Optimized for mobile; audio wakes up on your first interaction.
- **Dynamic Volume**: Sounds use **Squared Scaling** to match human hearing perception.
- **Commands**:
  - `@sound-on-[PERCENT]` — Set exact volume (e.g., `@sound-on-50`)
  - `@sound-on` — Enable haptic sounds
  - `@sound-off` — Mute all sounds
- **Persistence**: Your sound and volume preferences are saved locally.

---

## 🛠 Tech Stack  

| Category  | Technology |
|-----------|------------|
| **Frontend** | Vite, React, TypeScript |
| **AI / RAG** | **Pownin Core** (Custom 5-Stage RAG Pipeline), Llama-3, Groq SDK |
| **3D Graphics** | Three.js (for Energy Sphere animation) |
| **Animations** | Framer Motion |
| **Styling**  | CSS Modules, Tailwind |
| **Deployment** | Netlify |

---

## 🚀 Getting Started – Run Quillon on Your Machine  

### 🔥 **Clone & Set Up the Project**  

#### 1⃣ Clone the Repository  
```bash
git clone https://github.com/alexcj10/Quillon.git
```

#### 2⃣ Navigate to Project Directory  
```bash
cd Quillon
```

#### 3⃣ Install Dependencies  
```bash
npm install
```

#### 4⃣ Start the Development Server  
```bash
npm run dev
```
📌 The app will be available at ```http://localhost:5173``` 

---

## 🏠 Core Functionalities  

📌 **Note Management** – Add, edit, delete, and organize notes effortlessly.  
🧠 **Ask Pownin** – Chat with your notes using the "Smart RAG" AI assistant.  
🔒 **Private & Favorite Notes** – Secure sensitive notes and highlight important ones.  
🌂 **Smart Tags** – Automatic blue/green/grey hierarchy for effortless structure.  
✅ **Nodes (Tasks)** – Quick task management accessible via `@nodes` command.  
🧮 **Smart Calculator** – Instant symbolic math and algebra solving with `@c-` command.  
🗑️ **Smart Trash** – Bulk delete, recover, or permanently remove notes with animated Energy Sphere.  
🌟 **Adaptive UI** – Seamless experience across devices with a responsive design.  

---

## 🎯 Quick Command Reference

### Nodes Commands
| Command | Description | Space |
|---------|-------------|-------|
| `@nodes` | Open Nodes widget | Both |
| `@nodes-[task]` | Create public node | Both |
| `7@nodes-[task]` | Create private node | Both |

### Calculator & Translation Commands
| Command | Description | Example |
|---------|-------------|---------|
| `@c-[expression]` | Solve math/algebra | `@c-2x+5=15` |
| `@wiki-[topic]` | Wikipedia summary | `@wiki-Tesla` |
| `@def-[word]` | Dictionary definition | `@def-logic` |
| `@t-[lang]` | Translate current note | `@t-es` / `@t-hi` |
| `@pomo` | Pomodoro (25 min default) | `@pomo` |
| `@pomo-[time]` | Custom timer (h/m/s) | `@pomo-1h 30m 45s` |
| `@quiz` | Quiz Mode (ordered) | `@quiz` |
| `@quiz-s` | Quiz Mode (shuffled) | `@quiz-s` |
| `@w-[city]` | Fetch weather | `@w-Paris` |
| `@cc-[amt][f] to [t]` | Currency conversion | `@cc-50eur to usd` |
| `@u-[val][f] to [t]` | Unit conversion | `@u-10kg to lb` |

### Font Commands
| Command | Description | Example |
|---------|-------------|---------|
| `@fonts` | View all fonts with preview | `@fonts` |
| `@font-[index]` | Change font by number | `@font-15` (Comic Neue) |
| `@font-[name]` | Change font by name | `@font-Caveat` |
| `@font-d` | Reset to default font | `@font-d` |

> [!NOTE]
> Each note remembers its own font independently. Fonts selected in the search bar apply only to the next new note.

### Tag Management Commands
Access via **All Tags** button or **+more** icon:

| Command | Description | Example |
|---------|-------------|---------|
| `@` | Show tag type selector | `@` |
| `@[type]-[name]/edit-[new]` | Rename a tag | `@blue-work/edit-projects` |
| `@[type]-[name]/delete` | Delete tag & associated notes | `@grey-archive/delete` |

### Hide/Show Commands
| Command | Description | Example |
|---------|-------------|---------|
| `@show` | Enter Hidden Notes view | `@show` |
| `@show-return` | Exit Hidden Notes view | `@show-return` |

### Sound & Audio Commands
| Command | Description | Example |
|---------|-------------|---------|
| `@sound-on` | Enable system sounds | `@sound-on` |
| `@sound-on-[XX]` | Set specific volume (%) | `@sound-on-40` |
| `@sound-off` | Mute all sounds | `@sound-off` |

**Tag Types**: `blue` (folders), `green` (context), `grey` (standard)
> [!TIP]
> Use the `@hide` tag on individual notes to move them to the hidden view. Remove all other tags first!

---

## 🤝 Contributing  

We welcome contributions to **Quillon**! To get started:

1. **Fork** the repository.
2. **Create** a new branch (`git checkout -b feature/YourFeatureName`).
3. **Commit** your changes (`git commit -m 'Add some feature'`).
4. **Push** to the branch (`git push origin feature/YourFeatureName`).
5. **Open** a pull request.

🔹 Follow the existing coding style and structure.  
🔹 Write meaningful commit messages.  
🔹 Test changes thoroughly before submitting.  

📜 See detailed contribution guidelines in the **[CONTRIBUTING.md](https://github.com/alexcj10/Quillon/blob/main/CONTRIBUTING.md)** file.

---

## 🐝 License  

This project is licensed under the **Quillon Exclusive License**. See **[LICENSE](https://github.com/alexcj10/Quillon/blob/main/Quillon%20Exclusive%20License)** for details.

---

## 🎉 Acknowledgements  

💙 Thanks to **Vite, React**, and the open-source community for making development seamless!  
🙌 Special thanks to **YOU** for checking out **Quillon**! 🚀  

---

📌 **Follow the project, give it a** ⭐ **on [GitHub](https://github.com/alexcj10/Quillon), and let's build something amazing together!** 🎯  








