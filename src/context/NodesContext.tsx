import React, { createContext, useContext, useState, useEffect } from 'react';

export interface NodeItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

interface NodesContextType {
    nodes: NodeItem[];
    addNode: (text: string) => void;
    toggleNode: (id: string) => void;
    deleteNode: (id: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NodesContext = createContext<NodesContextType | undefined>(undefined);

export function NodesProvider({ children }: { children: React.ReactNode }) {
    const [nodes, setNodes] = useState<NodeItem[]>(() => {
        const saved = localStorage.getItem('quillon-nodes-data');
        return saved ? JSON.parse(saved) : [];
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('quillon-nodes-data', JSON.stringify(nodes));
    }, [nodes]);

    const addNode = (text: string) => {
        const newNode: NodeItem = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: Date.now(),
        };
        setNodes(prev => [newNode, ...prev]);
    };

    const toggleNode = (id: string) => {
        setNodes(prev => prev.map(n =>
            n.id === id ? { ...n, completed: !n.completed } : n
        ));
    };

    const deleteNode = (id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NodesContext.Provider value={{ nodes, addNode, toggleNode, deleteNode, isOpen, setIsOpen }}>
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
