import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import bannerIcon from '../assets/QP.png';

interface DocumentationPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const DocumentationPopup = ({ isOpen, onClose }: DocumentationPopupProps) => {
    const popupRef = useRef<HTMLDivElement>(null);

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

## ⚙️ Advanced Tag Management

Powerful tag editing and deletion via the **All Tags** button or **+more** icon.

### 🔑 Access
- Click **All Tags** button  
- Or click **+X more** when many tags are present

### ✏️ Edit Tag Names
1. Type \`@\` to see tag type options (\`blue / green / grey\`)
2. Select tag type, then click on any tag to auto-populate
3. Add \`/edit-[newname]\` to rename  
   - Example: \`@blue-oldname/edit-newname\`
4. Press **Enter** to confirm

### 🗑️ Delete Tags
- Type \`@[type]-[tagname]/delete\`  
  - Example: \`@grey-work/delete\`

**Behavior:**
- **Main View** → Deletes tag and moves all associated notes to **Trash**
- **Trash View** → Permanently deletes tag and all associated notes

- Press **Enter** to confirm

### ✅ Smart Validation
- Real-time feedback on command validity and tag availability

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

Instantly fetch factual information and definitions directly into your note.

### 📖 Wikipedia Summary
- **Usage**: Type \`@wiki-[topic]\` and press **Enter**
- **Multi-Topic**: Supports multiple topics (e.g., \`@wiki-Sam Altman and Mira Murati\`)
- **Action**: Appends a concise summary for each detected entity

### 🔤 Dictionary Definitions
- **Usage**: Type \`@def-[word]\` and press **Enter**
- **Action**: Provides meanings, phonetics, and usage examples

> **Accuracy**: Uses direct Wikipedia and professional Dictionary APIs for 100% factual accuracy without AI hallucinations.

---

## ⏱️ Pomodoro Timer

Focus on your work with a built-in Pomodoro timer.

### ⚡ Usage
- **Command**: Type \`@pomo-[time]\` anywhere in a note and press **Enter** (e.g. \`@pomo-1h 30m\`)
- **Default**: Type \`@pomo\` for a standard 25-minute focus session
- **Action**: Starts a countdown with a visual progress bar at the top of the editor

---

## 🌤️ External Utilities

Fetch real-time data and perform conversions directly in your note.

### 🌍 Features & Commands
- **Weather**: Type \`@w-[city]\` (e.g., \`@w-London\`)
- **Currency**: Type \`@cc-[amount][from] to [to]\` (e.g., \`@cc-100usd to eur\`)
- **Units**: Type \`@u-[value][unit] to [unit]\` (e.g., \`@u-5km to miles\`)

---

## ⚡ Flashcard (Quiz) Mode

Turn your notes into interactive study materials.

### 📖 Rules of Recall
1. **The 'A:' Prefix**: Your answer lines **MUST** start with \`A: \` (e.g., \`A: Paris\`).
2. **Commands**: Type \`@quiz\` for normal order or \`@quiz-s\` to **Shuffle** everything randomly.
3. **Auto-Clean**: The app automatically strips your written numbers (like \`Q1:\`) and adds fresh, professional sequential indexing (\`1, 2, 3...\`).
4. **Validation**: Type your answer and press **Enter** to check. Green **✓** means you got it! Gray **→** shows the solution for next time.
5. **Zen Focus**: Everything else is hidden. Exit anytime via the header button.

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
`;

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
                                        {documentationContent}
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
