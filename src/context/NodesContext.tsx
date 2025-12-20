import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotes } from './NoteContext';

export interface NodeItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    isPinned?: boolean;
    isPrivate: boolean; // Add isPrivate flag like Notes
}

interface NodesContextType {
    nodes: NodeItem[];
    addNode: (text: string, explicitIsPrivate?: boolean) => void;
    toggleNode: (id: string) => void;
    deleteNode: (id: string) => void;
    togglePin: (id: string) => void;
    reorderNodes: (nodes: NodeItem[]) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NodesContext = createContext<NodesContextType | undefined>(undefined);

export function NodesProvider({ children }: { children: React.ReactNode }) {
    // Use proper workspace context detection
    const { isPrivateSpaceUnlocked } = useNotes();

    // Store ALL nodes in one place (like Notes does)
    const [allNodes, setAllNodes] = useState<NodeItem[]>(() => {
        const saved = localStorage.getItem('quillon-nodes-data');
        return saved ? JSON.parse(saved) : [];
    });
    const [isOpen, setIsOpen] = useState(false);

    // Save all nodes to localStorage
    useEffect(() => {
        localStorage.setItem('quillon-nodes-data', JSON.stringify(allNodes));
    }, [allNodes]);

    // Filter nodes based on workspace (like Notes filtering)
    const nodes = allNodes.filter(node =>
        isPrivateSpaceUnlocked ? node.isPrivate : !node.isPrivate
    );

    const addNode = (text: string, explicitIsPrivate?: boolean) => {
        const newNode: NodeItem = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: Date.now(),
            isPinned: false,
            isPrivate: explicitIsPrivate !== undefined ? explicitIsPrivate : isPrivateSpaceUnlocked,
        };
        setAllNodes(prev => [newNode, ...prev]);
    };

    const toggleNode = (id: string) => {
        setAllNodes(prev => prev.map(n =>
            n.id === id ? { ...n, completed: !n.completed } : n
        ));
    };

    const deleteNode = (id: string) => {
        setAllNodes(prev => prev.filter(n => n.id !== id));
    };

    const togglePin = (id: string) => {
        setAllNodes(prev => prev.map(n =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n
        ));
    };

    const reorderNodes = (newNodes: NodeItem[]) => {
        // When reordering, we need to update the full list
        // Keep nodes from other workspace, replace nodes from current workspace
        const otherWorkspaceNodes = allNodes.filter(node =>
            isPrivateSpaceUnlocked ? !node.isPrivate : node.isPrivate
        );
        setAllNodes([...newNodes, ...otherWorkspaceNodes]);
    };

    return (
        <NodesContext.Provider value={{
            nodes, // Filtered nodes for current workspace
            addNode,
            toggleNode,
            deleteNode,
            togglePin,
            reorderNodes,
            isOpen,
            setIsOpen
        }}>
            {children}
        </NodesContext.Provider>
    );
}

export function useNodesWidget() {
    const context = useContext(NodesContext);
    if (context === undefined) {
        throw new Error('useNodesWidget must be used within a NodesProvider');
    }
    return context;
}
