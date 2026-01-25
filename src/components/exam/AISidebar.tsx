"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    hidden?: boolean;
}

interface AISidebarProps {
    isOpen: boolean;
    onClose: () => void;
    questionContext: string;
}

export function AISidebar({ isOpen, onClose, questionContext }: AISidebarProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-analysis on open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const analysisPrompt = "Analyze this question and provide a brief, helpful hint to get started. Do not give the direct answer. Keep it short.";
            handleSend(analysisPrompt, true);
        }
    }, [isOpen]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (text?: string, isHidden: boolean = false) => {
        const contentToSend = text || input.trim();
        if (!contentToSend) return;

        if (!text) setInput("");

        const newMessage: Message = { role: 'user', content: contentToSend, hidden: isHidden };
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        try {
            // Include hidden messages in history for context
            const apiMessages = [...messages, newMessage];
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    questionContext
                })
            });
            const data = await res.json();

            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.details || data.error}` }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSurrender = () => {
        setInput("I surrender, please tell me the answer.");
        // Optional: auto-send
        // handleSend(); 
        // Let's just set it so user has to click send to confirm, or call handleSend immediately.
        // User requested "button surrender to the AI Chat bot tell the answer".
        // Better to execute immediately to feel like a command.

        setTimeout(() => {
            // We need to invoke using a slightly different pattern to avoid stale state if we just called handleSend directly with state updates
            // But actually, let's just manually trigger the fetch logic here for simplicity/reliability
            submitSurrender();
        }, 100);
        setInput("");
    };

    const submitSurrender = async () => {
        const userMsg = "I surrender! 🏳️ What is the correct answer?";
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        try {
            const apiMessages = [...messages, { role: 'user', content: userMsg }];
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    questionContext
                })
            });
            const data = await res.json();

            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={cn(
            "fixed top-0 right-0 h-[100dvh] w-full md:w-[450px] bg-card border-l border-border shadow-2xl transform transition-transform duration-500 ease-in-out z-[60] flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="h-20 shrink-0 border-b border-border flex items-center justify-between px-6 bg-secondary/30 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">AI Tutor</h3>
                        <p className="text-xs text-muted-foreground">Powered by Gemini 2.0 Flash</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                {messages.filter(m => !m.hidden).map((msg, idx) => (
                    <div key={idx} className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary border border-primary/20",
                            msg.role === 'user' && user?.photoURL && "p-0 overflow-hidden"
                        )}>
                            {msg.role === 'user' ? (
                                user?.photoURL ? (
                                    <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
                                ) : (
                                    <MessageSquare className="w-4 h-4" />
                                )
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-secondary text-foreground rounded-tl-none border border-border"
                        )}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="p-4 rounded-2xl rounded-tl-none bg-secondary border border-border">
                            {/* Standard Loading Skeleton */}
                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-muted-foreground/20 animate-pulse"></div>
                                <div className="h-4 w-48 rounded bg-muted-foreground/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card shrink-0">
                {!isLoading && (
                    <button
                        onClick={handleSurrender}
                        className="w-full mb-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" /> Surrender & Reveal Answer
                    </button>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for a hint..."
                        className="flex-1 bg-secondary text-foreground px-4 py-3 rounded-xl border border-transparent focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
