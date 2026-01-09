export const QUILLON_USER_MANUAL = `
# QUILLON USER MANUAL & KNOWLEDGE BASE

## 1. CORE CONCEPTS
Quillon is a **simple, lightweight note-taking app** designed for **speed and efficiency**. It is built to be the fastest way to capture thoughts without bloat.
It features **Smart RAG** (Intelligent AI Search) and **Intelligent Tags** to help you stay organized effortlessly. "Pownin" is the AI assistant (You) integrated into Quillon.

## 2. NOTES MANAGEMENT

### Creating Notes
- Click the **Plus (+)** button in the top toolbar.
- Or use the "New Note" shortcut if available.
- An empty editor opens. You can set a title, content, tags, color, and attributes (started, private, etc.).

### Editing Notes
- Click the **Edit (Pencil)** icon on any Note Card.
- Or click the card body to open the editor.
- **Full View**: This refers to opening the note in the **Note Viewer** (read-only) or **Note Editor** (editable).
- **Half View / Card View**: This refers to the note as displayed in the main grid/dashboard.

### Deleting Notes
- **Move to Trash**: Click the **Trash Can** icon on the note card. The note is moved to the "Trash" tab and is NOT permanently deleted yet.

### Views & Attributes
- **Full View**: Click the **Eye Icon** on a note card to open "Read Mode".
- **Pinning**: Click the **Pin Icon** (Yellow) to stick the note to the top of the list.
- **Starring (Favorites)**: Click the **Star Icon** (Pink) to mark it as a favorite.
- **Coloring**: In the Editor, click the **Color Palette** icon to change the note's background color.

## 3. TRASH & RECOVERY

### Accessing Trash
- Click the **Trash Can** icon in the main top navigation bar (toggles Trash View).

### Recovering Notes
- In Trash View, find the note and click the **Restore (Rotate CCW)** icon.
- The note is moved back to your active list.

### Permanent Deletion
- In Trash View, click the **X Circle** icon on a note.
- **WARNING**: This action is irreversible. The note is gone forever.

### Bulk Actions (Selection Mode)
1. Go to the **Trash View**.
2. Look for the **Hologram Spinner** (a colorful gradient circle icon) in the filter bar/header.
3. Click it to enter **Selection Mode**.
4. Checkboxes appear on notes. Select the notes you want to manage.
5. Use the pop-up menu (Bulk Recovery Popup) to **Recover** or **Delete Forever** all selected notes at once.

## 4. TAGGING SYSTEM (The "File" Logic)
Quillon uses a unique color-coded tag system to organize notes into a hierarchy without rigid folders.

### Blue Tags (Folders)
- **Definition**: Acts as a main folder or category.
- **How to Create**: Start your tag name with the word \`file\`.
    - Example: Typing \`fileWork\` creates a **Blue Tag** named "Work".
    - Example: Typing \`fileRecipes\` creates a **Blue Tag** named "Recipes".
- **Visuals**: Appears blue with a Folder icon.

### Green Tags (Sub-categories)
- **Definition**: Acts as a sub-folder or specific topic within a Folder.
- **How to Create**: Add a normal tag to a note that *already has* a Blue (File) tag.
    - Example: A note has the tag \`fileWork\`. If you add the tag \`Meeting\`, it automatically becomes a **Green Tag** because it is "inside" the Work folder context.
- **Visuals**: Appears green.

### Grey Tags (Labels)
- **Definition**: Standard loose tags for categorization.
- **How to Create**: Add a tag to a note that *DOES NOT* have any Blue tags.
- **Visuals**: Appears grey.

## 5. MANAGING TAGS (Create, Edit, Delete)

### The "All Tags" Menu
- Access this menu by clicking the **Search/Tag** icon or bar in the filter area.

### Editing Tags (Renaming)
- You can specific commands in the "All Tags" search bar or user the \`@\` menu.
- **Command**: \`@blue-[OldName]/edit-[NewName]\`
    - Example: \`@blue-Work/edit-Office\` renames the "fileWork" folder to "fileOffice".
- **Command**: \`@green-[TagName]/edit-[NewName]\`
- **Command**: \`@grey-[TagName]/edit-[NewName]\`
- **Shortcut**: Type \`@\` in the search bar to see a helper menu. Select the tag you want to edit, and the system sets up the command for you.

### Deleting Tags
- **Command**: \`@blue-[Name]/delete\`
    - **Warning**: Deleting a Blue Tag might affect the organization of many notes (they lose their folder).
- **Command**: \`@green-[Name]/delete\`
- **Shortcut**: Type \`@\`, select the tag, and append \`/delete\`.

## 6. PRIVATE SPACE (Security)

### Creating a Private Space
1. Click the **Purple Lock Icon** in the top toolbar.
2. If no space exists, you will be prompted to **Set a Password**.
3. **Confirm** the password.
4. Your Private Space is now active.

### Using Private Space
- **Hide Note**: In the Note Editor, click the **Unlock Icon** to toggle it to **Locked (Purple)**. The note is now Private.
- **View Private Notes**: Click the Lock Icon in the toolbar and enter your password. Private notes will appear mixed in your list (marked with a lock).
- **Hide Private Notes**: Click the Lock Icon again to "Lock" the space. Private notes disappear from view.

### Passwords & Recovery (CRITICAL)
- **There is NO password recovery.**
- Pownin cannot see or reset your password. It is encrypted locally.
- **If you lose your password**:
    1. Open the Private Space Dialog (Lock Icon).
    2. Since you cannot unlock it, you must click **"Delete Private Space"**.
    3. **consequence**: This PERMANENTLY DELETES the Private Space and **ALL NOTES** inside it.
    4. You can then create a new password for a fresh, empty Private Space.

## 7. SEARCH & AI
- **Search**: The search bar filters by Title, Content, and Tags.
- **AI (Pownin)**: Click the **Pownin Logo** (Avatar) to chat.
    - Pownin has "RAG" (Retrieval Augmented Generation) access.
    - It can read your notes to answer questions like "What was my idea for the app?"
    - It respects privacy: It can only read Private notes if the Private Space is currently UNLOCKED by the user.

## 8. EDITOR COMMANDS (Shortcuts)
Speed up your writing with instant lookups directly in the note editor. Type the command followed by a word/topic and press **Enter**.

- **Wikipedia Lookup**: \`@wiki-[topic]\`
    - Gets summaries for one or many topics (e.g., \`@wiki-Elon Musk and Jeff Bezos\`).
- **Dictionary Definition**: \`@def-[word]\`
    - Gets meanings, phonetics, and usage examples.
- **Math Calculator**: \`@c-[expression]\`
    - Example: \`@c-120*5\` calculates the result instantly.
- **Translation**: \`@t-[lang_code]\`
    - Example: \`@t-es\` translates the entire note into Spanish.
- **Pomodoro Timer**: \`@pomo\` or \`@pomo-[time]\`
    - Starts a focus session. Supports custom formats like \`@pomo-1h 30m\` or \`@pomo-10m\`.
- **Quiz Mode**: \`@quiz\` (Normal) or \`@quiz-s\` (Shuffled)
    - **Note Structure**: Pairs any line of text with the \`A: \` line immediately following it.
    - **Smart Commands**: \`@quiz\` for natural order, \`@quiz-s\` for randomized **Shuffle Mode**.
    - **Auto-Indexing**: Automatically strips old labels (Q1:, 5., etc.) and adds clean sequential numbers (**1, 2, 3...**).
    - **Validation**: Type your answer and press **Enter**. Green **✓** means correct; Gray **→** shows the solution.
    - **Zen Focus**: Disables title editing and replaces "Save" with **Exit Quiz**.
- **Weather**: \`@w-[city]\`
    - Example: \`@w-London\` fetches current weather.
- **Currency**: \`@cc-[amount][from] to [to]\`
    - Example: \`@cc-100usd to eur\`. **Note**: Use 3-letter codes (USD, INR, EUR) only.
- **Unit Conversion**: \`@u-[value][unit] to [unit]\`
    - Example: \`@u-10kg to lbs\` or \`@u-5km to miles\`. Supports weight, length, and temp.

## 9. MISC FEATURES
- **Dark Mode**: Toggle with the Sun/Moon icon.
- **Export/Download**: Use the options menu on a note to download as TXT.

## 9. TECHNICAL ARCHITECTURE (About Pownin)
- **Model**: Pownin uses **Llama 3.3** (via Groq API) for high-speed reasoning.
- **RAG Engine**: Uses a Custom Vector Search + Keyword Hybrid system.
- **Tech Stack**: Built with React, TypeScript, and IndexedDB for local storage.
- **Indexing**: Notes are converted into Vector Embeddings to allow "Semantic Search" (matching meaning, not just words).

## 10. DEVELOPER (About the Creator)
- **Solo Developer**: Quillon (and Pownin) was created entirely by **AlexCJ**
- **No Team**: There is no "Quillon Team". It is a passion project by a single developer.
- **Contact**: You can find AlexCJ on GitHub (alexcj10) or LinkedIn.
`;
