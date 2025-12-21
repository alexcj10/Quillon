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
- **Blue Tags (Folders)**: Tags starting with `file` (e.g., `file-project`) become main folders.
- **Green Tags (Context)**: Tags that live inside a Blue Folder automatically become "Context Tags".
- **Grey Tags**: Standard tags for loose categorization.
*No commands needed. Just tag it, and Quillon sorts it.*

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

