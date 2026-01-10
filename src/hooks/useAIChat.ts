
import { useState, useCallback, useEffect } from 'react';
import { ragQuery } from '../utils/rag';
import { Message, Session } from '../types';
import { useNotes } from '../context/NoteContext';

export function useAIChat() {
    const { notes, isPrivateSpaceUnlocked } = useNotes();
    const [history, setHistory] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: "Hi! 👋 I'm Pownin, your AI assistant. I can help you search and understand your notes. What would you like to know?",
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial Welcome Message
    const welcomeMessage: Message = {
        id: 'welcome',
        role: 'ai',
        content: "Hi! 👋 I'm Pownin, your AI assistant. I can help you search and understand your notes. What would you like to know?",
        timestamp: new Date()
    };

    // Load history from local storage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('powninChatHistory');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory, (key, value) => {
                    if (key === 'timestamp' || key === 'lastUpdated') return new Date(value);
                    return value;
                });
                setHistory(parsed);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save history to local storage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('powninChatHistory', JSON.stringify(history));
        }
    }, [history, isInitialized]);

    // When currentSessionId changes, update messages
    useEffect(() => {
        if (currentSessionId) {
            const session = history.find(s => s.id === currentSessionId);
            if (session) {
                setMessages(session.messages);
            }
        } else {
            setMessages([welcomeMessage]);
        }
    }, [currentSessionId, history]);

    const startNewChat = useCallback(() => {
        setCurrentSessionId(null);
        setMessages([welcomeMessage]);
    }, []);

    const loadSession = useCallback((sessionId: string) => {
        setCurrentSessionId(sessionId);
    }, []);

    const deleteSession = useCallback((sessionId: string) => {
        setHistory(prev => {
            const newHistory = prev.filter(s => s.id !== sessionId);
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([welcomeMessage]);
            }
            return newHistory;
        });
    }, [currentSessionId]);

    const renameSession = useCallback((sessionId: string, newTitle: string) => {
        setHistory(prev => prev.map(s =>
            s.id === sessionId ? { ...s, title: newTitle, lastUpdated: new Date() } : s
        ));
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        // Optimistic update
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Call RAG Engine
            // Note: messages needs to be stripped of IDs/timestamps for strict compliance if required, 
            // but usually extra props are fine. 
            const response = await ragQuery(text, notes, newMessages, { includePrivate: isPrivateSpaceUnlocked });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response,
                timestamp: new Date()
            };

            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            // Update History/Session
            if (currentSessionId) {
                setHistory(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        return {
                            ...s,
                            messages: finalMessages,
                            lastUpdated: new Date()
                        };
                    }
                    return s;
                }));
            } else {
                // Create new session
                const newSessionId = Date.now().toString();
                const newSession: Session = {
                    id: newSessionId,
                    title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
                    messages: finalMessages,
                    lastUpdated: new Date()
                };
                setHistory(prev => [newSession, ...prev]);
                setCurrentSessionId(newSessionId);
            }

        } catch (error: any) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: `Error: ${error.message || "Unknown error"}.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, currentSessionId, isPrivateSpaceUnlocked, notes]);

    return {
        messages,
        sendMessage,
        isLoading,
        history,
        startNewChat,
        loadSession,
        deleteSession,
        renameSession,
        currentSessionId
    };
}
