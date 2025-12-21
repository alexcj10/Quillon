import { motion, DragControls } from 'framer-motion';
import { CheckSquare, Square, Trash2, Pin, PinOff, GripVertical, Calendar } from 'lucide-react';
import { NodeItem } from '../context/NodesContext';

const getSmartDate = (text: string) => {
    const lower = text.toLowerCase();

    // 🔴 Urgency (Highest Priority)
    if (lower.match(/\b(urgent|asap|now|important|critical|deadline)\b/) || text.endsWith('!')) {
        return { label: 'Urgent', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' };
    }

    // 🔄 Recurring
    if (lower.match(/\b(daily|weekly|monthly|yearly|every\s(day|week|month|year))\b/)) {
        return { label: 'Recurring', color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30' };
    }

    // 🟢 Today synonyms (Expanded)
    if (lower.match(/\b(today|tonight|morning|noon|afternoon|evening|night)\b/) || lower.includes('this ')) {
        return { label: 'Today', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' };
    }

    // 🟣 Tomorrow
    if (lower.includes('tomorrow')) {
        return { label: 'Tomorrow', color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' };
    }

    // 🔵 Upcoming (Days, Weekend, Next Week, Months)
    if (lower.match(/\b(mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/) ||
        lower.match(/\b(weekend|next\s(week|month|year))\b/) ||
        lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/)) {
        return { label: 'Upcoming', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' };
    }

    // 🟠 Time / Relative Time / Later
    if (lower.match(/\b(at|by)\s\d{1,2}(?::\d{2})?(?:am|pm)?\b/) ||
        lower.match(/\bin\s\d+\s(min|hour|hr|sec)s?\b/) ||
        lower.includes('later')) {
        return { label: 'Time', color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30' };
    }

    return null;
};

export function NodeItemCard({
    node,
    toggleNode,
    deleteNode,
    togglePin,
    isPinned = false,
    dragControls,
    layout = false
}: {
    node: NodeItem;
    toggleNode: (id: string) => void;
    deleteNode: (id: string) => void;
    togglePin: (id: string) => void;
    isPinned?: boolean;
    dragControls?: DragControls;
    layout?: boolean;
}) {
    const dateData = getSmartDate(node.text);
    const hasDragHandle = !!dragControls && !node.completed && !isPinned;

    return (
        <motion.div
            layout={layout}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative flex items-start gap-2 py-3 pr-3 rounded-xl transition-all duration-200 border
                ${hasDragHandle ? 'pl-8' : 'pl-3'} 
                ${node.completed
                    ? 'bg-gray-50/50 dark:bg-white/5 opacity-60 border-transparent'
                    : isPinned
                        ? 'bg-blue-50/20 dark:bg-gray-800 shadow-sm border-blue-200 dark:border-blue-900/50 ring-1 ring-blue-50/50 dark:ring-blue-900/20'
                        : 'bg-white dark:bg-gray-800 shadow-sm border-gray-200/60 dark:border-gray-800 hover:border-blue-300/30 dark:hover:border-gray-700'
                }`}
        >
            {/* Explicit Drag Handle */}
            {hasDragHandle && (
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="absolute left-1 top-3 p-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors touch-none select-none z-20"
                    style={{ touchAction: 'none' }}
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            <button
                onClick={() => toggleNode(node.id)}
                className={`mt-0.5 flex-shrink-0 transition-colors z-10 
                    ${node.completed ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
            >
                {node.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>

            <div className={`flex-1 min-w-0 ${hasDragHandle ? '' : ''}`}>
                <span className={`text-sm leading-relaxed break-words block
                    ${node.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                    {node.text}
                </span>

                {dateData && !node.completed && (
                    <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${dateData.color}`}>
                        <Calendar className="w-3 h-3" />
                        {dateData.label}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-100 xl:opacity-0 group-hover:xl:opacity-100 transition-opacity">
                {!node.completed && (
                    <button
                        onClick={() => togglePin(node.id)}
                        className={`p-1.5 rounded-lg transition-all ${isPinned
                            ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title={isPinned ? "Unpin" : "Pin to top"}
                    >
                        {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                )}

                <button
                    onClick={() => deleteNode(node.id)}
                    className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
