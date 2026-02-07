import { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import bannerIcon from '../assets/QP.png';

interface DocumentationPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const DocumentationPopup = ({ isOpen, onClose }: DocumentationPopupProps) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Lock body scroll when popup is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset search query when closing
            setSearchQuery('');
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    const documentationContent = `
## 🏷️ Intelligent Tagging System

Forget manual color codes. Quillon organizes tags automatically.

### 🔵 Blue Tags (Folders)
- Tags starting with \`file\` (e.g., \`fileProject\`) create a **main folder** named **Project**
- **Case-sensitive**: \`project\` and \`Project\` are treated as different folders

### 🟢 Green Tags (Context)
- Tags that live **inside a Blue Folder** automatically become **Context Tags**

### ⚪ Grey Tags
- Standard tags for loose categorization

> No commands needed. Just tag it, and Quillon sorts it.

---

## 🟠 Orange Tags (Group Tags)

Organize your grey tags into named groups to keep your workspace clean.

### ➕ Create Group
- **Command**: Type \`@orange-[name]/create\` (e.g., \`@orange-Work/create\`) in the **All Tags** search bar.

### 🚪 Enter Group
- Click the Orange Group button **OR**
- Type \`@orange-[name]/etots\` (Enter The Orange Tag Space)

### 👻 Group Behavior
- Grey tags added to an Orange Group are **hidden** from the main list, reducing clutter.

### 🛠️ Manage Group
Once inside a group, use these slash commands:
- \`/drop\`: Show available grey tags to add to the group
- \`/view\`: Show tags currently in the group
- \`/remove\`: Select tags to remove from the group (they return to the main list)
- \`/back\`: Return to the main tag view

### ✏️ Rename Group
- **Command**: Type \`@orange-[old]/edit-[new]\` (e.g., \`@orange-Work/edit-Office\`)

### ⚡ Quick Peek
- **Action**: **Right-click** (Desktop) or **Long-press** (Mobile) on any Orange Group button.
- **Result**: Instantly opens a popup showing all tags inside, allowing you to click them without entering the group.

### 🗑️ Delete Group
- **Command**: Type \`@orange-[name]/delete\`
- **Result**: Removes the group container but **releases** all tags back to the main list (safe delete).

---

## 🧞 Pownin AI Command (@pai-)

Access the power of AI directly from your workflow:

### 📝 In Note Editor
- Type \`@pai-[query]\` and press **Enter** 
- The AI inserts a concise, **plain-text** answer directly into your note (perfect for lists and quick facts).

### 🔍 In Search Bar
- Type \`@pai-[query]\` and press **Enter**
- A beautiful popup appears with a **rich markdown** response, including deep details and correct code formatting.

---

## 🏛️ Hyper-Architect Command (@new-)

The most powerful command in Quillon. Create fully-featured notes directly from the search bar.

**Syntax**: \`@new-[Title] || [Content or Command] || [Attributes]\`

### 📐 Delimiter Rules (||)
*   **For Title Separation**: \`||\` is **compulsory** if you want a custom title.
    *   \`@new-Meeting || Discussion notes\` → Title: "Meeting"
    *   \`@new-Just some text\` → Title: "Untitled Note" (no \`||\` used)
*   **For Attributes**: \`||\` is **optional** between content and attributes.
    *   \`@new-Title || Content || ##tag || is:fav\` → Works ✅
    *   \`@new-Title || Content ##tag is:fav\` → Works ✅ (spaces work too)
*   **Spacing Flexibility**: Works with or without spaces around \`||\`.
    *   \`@new-Title||Content||##tag\` → Works ✅
    *   \`@new-Title || Content || ##tag\` → Works ✅

### 🧠 Intelligence Commands (Nested)
You can nest these inside the content to fetch data before saving:
*   \`@pai-[query]\`: Ask Pownin AI for a detailed response.
*   \`@wiki-[topic]\`: Fetches a summary from Wikipedia.
*   \`@def-[word]\`: Fetches dictionary definition and phonetics.
*   \`@t-[lang]\`: Translates content (e.g., \`@t-es\`).
*   \`@c-[math]\`: Solves equations instantly.
*   \`@summary / @elaboration\`: AI rewrites of your text.

### 🛠️ Attribute Flags (Unordered)
Mix these anywhere in the content section:
*   **Color**: \`c:blue\`, \`c:pink\`, \`c:purple\`, \`c:green\`, \`c:yellow\`, \`c:orange\`
*   **Style**: \`f:Caveat\`, \`f:Inter\`, etc.
*   **Flags**: 
    *   \`is:fav\` or \`is:star\` — Mark as Favorite (⭐️)
    *   \`is:pin\` — Pin to top (📌)
    *   \`is:vault\` or \`is:private\` — Save to Private Space (🔒)
    *   \`is:hide\` — Hide from Main View (👁️‍🗨️)
*   **Tags**: \`##tag\` (Grey) or \`##fileFolder\` (Blue).

> ✨ **Tip**:
> **Full Example**: \`@new-Einstein || @wiki-Albert Einstein || ##science ##fileWork || c:purple || is:fav || is:pin\`
> 
> **Compact Style**: \`@new-Notes||Content here||##work||is:star\`
> 
> **Direct AI**: \`@new-@pai-Explain quantum computing||is:fav\` (skips title, creates "Untitled Note")

---

## ⚙️ Advanced Tag Management
Powerful tag editing, deletion and organization via the **All Tags** button or **+more** icon:
- 🔑 **Access**: Click "All Tags" button or "+X more" when you have many tags
- ✏️ **Edit Tag Names**:
  - Type \`@\` to see tag type options (blue/green/grey)
  - Select tag type, then click on any tag to auto-populate
  - Add \`/edit-[newname]\` to rename: \`@blue-oldname/edit-newname\`
  - Press Enter to confirm
- 📌 **Pin/Star Tags**:
  - Type \`@[type]-[tagname]/pin\` to pin important tags to the top
  - Type \`@[type]-[tagname]/star\` or \`@[type]-[tagname]/fav\` to favorite tags
  - Press Enter to confirm
- 🌌 **Space View**:
  - Type \`@space\` to enter your dedicated **Pinned & Favorite** space
  - Type \`@space-return\` to exit and return to the full tag list
- 🗑️ **Delete Tags**:
  - Type \`@[type]-[tagname]/delete\` (e.g., \`@grey-work/delete\`)
  - In **Main View**: Deletes tag and moves all associated notes to trash
  - In **Trash View**: Permanently deletes tag and all associated notes
  - Press Enter to confirm
- ✅ **Smart Validation**: Real-time feedback on command validity and tag availability

---

## 🌐 Nodes – Quick Task Management

**Nodes** is Quillon’s built-in task system for quick to-dos and reminders.

### 🔍 Access via Search
- Type \`@nodes\` in the search bar  
- Works in both **public** and **private** spaces

### ➕ Quick Node Creation
- \`@nodes-Meeting with Sam tomorrow\` → Creates a **public node**
- \`7@nodes-Meeting with John\` → Creates a **private node**

### 🧠 Smart Behavior
- **Public node** (\`@nodes-[task]\`)
  - Sent in **public space** → Popup opens
  - Sent in **private space** → Saved to public (no popup)

- **Private node** (\`7@nodes-[task]\`)
  - Sent in **private space** → Popup opens
  - Sent in **public space** → Saved to private (no popup)

### ✨ Features
- Pin important nodes
- Drag & drop to reorder tasks
- Mark nodes as complete
- Separate sections for:
  - Pinned
  - Active
  - Completed

---

## 🗑️ Smart Trash & Bulk Actions

Efficient note management with powerful bulk operations.

### 🔮 Energy Sphere Icon
- Animated orb that acts as the **bulk actions hub**

### 📂 Main View
- Click Energy Sphere to enter selection mode
- Select multiple notes
- Bulk delete moves notes to **Trash** (recoverable)

### 🗃️ Trash View
- Click Energy Sphere for recovery options
- Bulk restore notes
- Permanently delete notes forever

### ⏱️ Auto-Cleanup
- Notes are automatically deleted after **30 days** in trash

---

## 🧮 Smart Calculator

Perform instant calculations anywhere in Quillon.

### ⚡ Usage
- **Search Bar**: Type \`@c-expression\` to see instant result popup
- **Note Editor**: Type \`@c-expression\` and press **Enter** to replace with result

### 📝 Examples
- **Basic**: \`@c-25*4\` → \`100\`
- **Functions**: \`@c-sqrt(144)\` → \`12\`
- **Advanced**: \`@c-log(100, 10)\` → \`2\`
- **Trig**: \`@c-sin(45 deg)\` → \`0.707...\`

> Supports standard math operators (+, -, *, /) and common functions.

---

## 🌍 Instant Translation

Translate any note into 100+ languages without leaving Quillon.

### ⚡ Usage
- **Command**: Type \`@t-[lang]\` anywhere in a note and press **Enter**
- **Action**: Replaces the entire note content with the translated version

### 📚 Supported Languages

- **Spanish** (es) — \`@t-spanish\`
- **French** (fr) — \`@t-french\`
- **Hindi** (hi) — \`@t-hindi\`
- **German** (de) — \`@t-german\`
- **Japanese** (ja) — \`@t-japanese\`
- **Chinese** (zh) — \`@t-chinese\`
- **Russian** (ru) — \`@t-russian\`
- **Arabic** (ar) — \`@t-arabic\`
- **Italian** (it) — \`@t-italian\`
- **Portuguese** (pt) — \`@t-portuguese\`
- **Korean** (ko) — \`@t-korean\`
- **Greek** (el) — \`@t-greek\`
- **Thai** (th) — \`@t-thai\`
- **Vietnamese** (vi) — \`@t-vietnamese\`
- **Hebrew** (he) — \`@t-hebrew\`

> **Note**: Full names work for common languages listed above. For all other languages, use the standard **ISO shortcut code** (e.g., \`@t-fi\` for Finnish, \`@t-ta\` for Tamil) to translate into any language in the world instantly.
    
---

## 🔍 Quick Insight Lookup

Instantly fetch factual information and definitions from reliable sources.

### 🏠 Search Bar
Type \`@wiki-[topic]\` or \`@def-[word]\` and press **Enter** to see a rich **Markdown Popup** with icons and formatted headers.

### 📝 Note Editor
Type the same commands inside your note to insert the results as **Clean Plain Text** directly at your cursor.

### 🧞 Features
- **Multi-Topic**: Use "and", "&", or commas (e.g., \`@wiki-React, Vue\`).
- **Accuracy**: Direct API connection ensures no AI hallucinations.

---

## 🧠 AI Brain: Summarize & Elaborate

Quickly transform long notes into concise summaries or simple explanations.

### ⚡ Usage
- **Summarize**: Type \`@summary\` anywhere in a note and press **Enter**
- **Elaborate**: Type \`@elaboration\` anywhere in a note and press **Enter**

### ✨ Smart Features
- **Full Rewrite**: Replaces the **entire** note content with the AI's output.
- **Clean Format**: Uses plain text and bullet points (no complex markdown) for perfect editing.
- **Explicit Labels**: Prepends \`SUMMARY:\` or \`ELABORATION:\` for deep clarity.

---

## ⏱️ Pomodoro Timer

Focus on your work with a built-in Pomodoro timer.

### ⚡ Usage
- **Command**: Type \`@pomo-[time]\` anywhere in a note and press **Enter** (e.g. \`@pomo-1h 6m 28s\`)
- **Default**: Type \`@pomo\` for a standard 25-minute focus session
- **Action**: Starts a countdown with a visual progress bar at the top of the editor

---

## 🌤️ External Utilities

Fetch real-time data and perform conversions directly in your note.

### 🌍 Features & Commands
- **Weather**: Type \`@w-[city]\` (e.g., \`@w-London\`)
- **Currency**: Type \`@cc-[amount][from] to [to]\` (e.g., \`@cc-10eur to inr\`)
  - **Rules**: Use 3-letter codes (USD, INR). Rates update every **24 hours**.
- **Units**: Type \`@u-[value][unit] to [unit]\` (e.g., \`@u-5kg to lbs\`)
  - Supports: **kg/lbs**, **km/miles**, **m/ft**, **cm/inch**, **c/f** (temp)

---

## ✍️ Font Customization

Personalize your notes with custom fonts for better readability and style.

### 🎨 Available Commands
- **\`@fonts\`** — View all available fonts with live preview
  - **Note Editor**: Each font name renders in its actual typeface
  - **Search Bar**: Shows a graphical popup with font previews
- **\`@font-[index]\`** — Change font by number (e.g., \`@font-15\` for Comic Neue)
- **\`@font-[name]\`** — Change font by name (e.g., \`@font-Caveat\`, \`@font-Lora\`)
  - Case-insensitive matching
- **\`@font-d\`** — Reset to default system font

### 📝 Font Persistence
- **Per-Note**: Each note remembers its own font independently
- **One-Time Selection**: Fonts selected in the search bar apply only to the next new note, then reset to default

### 🎯 Available Fonts
Exactly **33** carefully curated fonts including:
- **System Default**, **Inter**, **Roboto**, **Open Sans**
- **Outfit**, **Lexend**, **Urbanist**, **Quicksand** (Modern Sans)
- **Lora**, **Playfair Display**, **Merriweather**, **Fraunces** (Serif)
- **Fira Code**, **JetBrains Mono**, **Space Mono** (Monospace)
- **Syne**, **Cinzel**, **Bebas Neue** (Artistic/Display)
- **Handwritten / Script Favorites**:
  - \`Pacifico\`, \`Dancing Script\`, \`Indie Flower\`
  - \`Caveat\`, \`Satisfy\`, \`Shadows Into Light\`
  - \`Gloria Hallelujah\`, \`Permanent Marker\`, \`Amatic SC\`
- **Mystery Number**: Why 33? It is the number of master organization and creative power.

---

## ⚡ Flashcard (Quiz) Mode

Turn your notes into interactive study materials.

### 📖 Rules of Recall
**1. Note Structure**
- **Question**: Any normal line of text.
- **Answer**: Must start with **\`A: \`** (e.g., \`A: Paris\`).
- **Hint**: Standalone \`A: \` lines still work as numbered items!

**2. Commands**
- **\`@quiz\`**: Default order study.
- **\`@quiz-s\`**: Randomized **Shuffle Mode**.

**3. Robust Auto-Indexing**
- **Strip**: Removes old labels like \`Q1:\`, \`5)\`, or \`Question:\`.
- **Number**: Adds fresh sequential numbers (**1, 2, 3...**) automatically.

**4. Interactive Validation**
- **Check**: Type answer + **Enter** for Green **✓** feedback.
- **Reveal**: Click to see the Gray **→** solution neutrally.
- **Zen**: Locked title and header-integrated **Exit Quiz** button.

---

## 📝 Refined Note Editor

- **Distraction-Free**: Full-screen, edge-to-edge editing
- **Responsive**: Optimized for Desktop, Tablet, and Mobile
- **Whitespace Preservation**: Formatting stays exactly as typed

---

## 👁️ Hide / Show Notes

A command-based system to keep your workspace clutter-free.

### 🙈 Hide Notes
- Add the \`@hide\` tag to hide a note

### 🎨 Visual Identity
- Hidden notes use an **Amber/Gold tag** with an **EyeOff icon**

### 🧭 Smart Navigation
- \`@show\` → Enter **Hidden Notes** view
- \`@show-return\` → Return to main workspace

###  Exclusive Privacy
- \`@hide\` is **restricted**
- All other tags must be removed before hiding a note
- Ensures a clean and intentional hidden state

---

## 🔒 Dual Workspace System

### 🌍 Public Space
- Main workspace for general notes

### 🔐 Private Space
- Password-protected for sensitive information

### 🔄 Seamless Switching
- Toggle between spaces with a single click

### 🧩 Independent Organization
- Separate tags
- Separate starred notes
- Separate trash for each space

---

## 🔊 Interactive Sound System

Quillon features a global audio feedback system for a professional, tactile experience.

### ✨ Haptic Haptics
- Every button and clickable element triggers a subtle **Digital Felt Tap**
- Instant, zero-latency response

### 🔉 Natural Volume
- Uses **Squared Scaling** to match human hearing
- 50% volume sounds correctly balanced against 100%

### ⚡ Commands
- **\`@sound-on-[PERCENT]\`** — Set exact volume (e.g., \`@sound-on-40\`)
- **\`@sound-on\`** — Enable haptic sounds
- **\`@sound-off\`** — Mute all sounds

### 📱 Performance
- **Mobile Support**: Audio wakes up on first interaction
- **Universal**: Optimized for Desktop, Tablet, and Mobile
- **Persistent**: Settings save locally across refreshes

## 💾 Data & Storage

- **Local-First**: All notes and documents are stored locally on your device using **IndexedDB** (disk-backed browser storage).
- **Capacity**: No artificial limits are imposed by Quillon. Storage capacity scales with available device space and browser-managed quotas, making it effectively unlimited for personal use.
- **Privacy**: No cloud servers. Your data never leaves your device.

---

## 📄 Documentation Command (@docs)

Quickly access this documentation popup directly from the search bar.

### ⚡ Usage
- **Command**: Type \`@docs\` in the search bar and press **Enter**
- **Action**: Opens this documentation popup instantly.
`;

    // Filter documentation content based on search query
    const filteredContent = useMemo(() => {
        if (!searchQuery.trim()) return documentationContent;

        const query = searchQuery.toLowerCase();
        const sections = documentationContent.split(/(?=^##\s)/gm);

        const matchingSections = sections.filter(section => {
            return section.toLowerCase().includes(query);
        });

        if (matchingSections.length === 0) {
            return `## No Results Found\n\nNo documentation matches your search for "${searchQuery}". Try different keywords.`;
        }

        return matchingSections.join('\n');
    }, [searchQuery]);

    // Custom renderer for ReactMarkdown with Lucide icons for headers if we wanted, 
    // but kept simple for now with strict Tailwind classes.

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-end sm:justify-center p-0">
                    {/* Backdrop - Changed to absolute to ensure correct stacking */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Popup Container */}
                    <motion.div
                        ref={popupRef}
                        initial={{ y: "100%", opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`
              relative z-10 
              w-full bg-white dark:bg-gray-900 shadow-2xl
              flex flex-col
              
              /* Mobile: Fixed at bottom, rounded top corners - Reduced Height */
              fixed bottom-0 left-0 right-0
              rounded-t-[24px] 
              h-[75vh] 

              /* Tablet & Desktop: Centered, width-constrained */
              md:relative md:w-[90%] md:max-w-4xl md:rounded-t-2xl md:rounded-b-none 
              
              /* Heights */
              md:h-[80vh]
              md:max-h-[1200px]

              border-t border-b-0 border-gray-100 dark:border-gray-800
            `}
                    >
                        {/* Close Button Overlay */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white z-20 backdrop-blur-sm"
                            aria-label="Close documentation"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0B1120] rounded-t-[24px] sm:rounded-t-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            {/* Banner Image - Edge to Edge */}
                            <div className="w-full h-auto">
                                <img src={bannerIcon} alt="Quillon" className="w-full object-cover" />
                            </div>

                            {/* Search Bar - Sticky */}
                            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 pr-12">
                                <div className="max-w-2xl mx-auto relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search documentation..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            aria-label="Clear search"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-w-2xl mx-auto px-6 py-10">
                                <article className="prose prose-slate dark:prose-invert max-w-none 
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h1:mb-6 prose-h1:text-center prose-h1:text-gray-900 dark:prose-h1:text-white
                  prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-gray-800 dark:prose-h2:text-gray-100
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:text-blue-600 dark:prose-h3:text-blue-400
                  prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-li:text-gray-600 dark:prose-li:text-gray-300
                  prose-strong:text-gray-900 dark:prose-strong:text-white
                  prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                  prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-hr:my-8 prose-hr:border-gray-200 dark:prose-hr:border-gray-800
                  [&>h2:first-of-type]:mt-0 [&>h2:first-of-type]:pt-0
                ">
                                    <ReactMarkdown
                                        components={{
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <table {...props} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800" />
                                                </div>
                                            ),
                                            th: ({ node, ...props }) => (
                                                <th {...props} className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider" />
                                            ),
                                            td: ({ node, ...props }) => (
                                                <td {...props} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 first:border-t-0" />
                                            ),
                                            // Allow html in markdown
                                            div: ({ node, ...props }) => <div {...props} />,
                                            img: ({ node, ...props }) => <img {...props} className="w-full rounded-xl mb-6 shadow-sm" />,
                                        }}
                                    >
                                        {filteredContent}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DocumentationPopup;
