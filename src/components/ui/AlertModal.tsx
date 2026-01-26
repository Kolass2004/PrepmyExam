import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { X, AlertCircle } from "lucide-react";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: "error" | "info" | "warning";
}

export function AlertModal({ isOpen, onClose, title = "Alert", message, type = "error" }: AlertModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && mounted) {
            const ctx = gsap.context(() => {
                gsap.fromTo(overlayRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3 }
                );
                gsap.fromTo(modalRef.current,
                    { y: 20, opacity: 0, scale: 0.95 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
                );
            });
            return () => ctx.revert();
        }
    }, [isOpen, mounted]);

    if (!isOpen || !mounted) return null;

    const colors = {
        error: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-500", icon: <AlertCircle className="w-10 h-10" /> },
        warning: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-500", icon: <AlertCircle className="w-10 h-10" /> },
        info: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-500", icon: <AlertCircle className="w-10 h-10" /> },
    };

    const theme = colors[type];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div
                ref={modalRef}
                className="relative w-full max-w-md bg-card border border-border rounded-[2rem] p-8 shadow-2xl elevation-3 z-10"
            >
                <div className="flex flex-col items-center text-center">
                    <div className={`w-20 h-20 ${theme.bg} rounded-full flex items-center justify-center mb-6`}>
                        <div className={theme.text}>{theme.icon}</div>
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
