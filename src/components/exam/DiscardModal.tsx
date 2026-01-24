"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Trash2, X } from "lucide-react";

interface DiscardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DiscardModal({ isOpen, onClose, onConfirm }: DiscardModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                ref={modalRef}
                className="relative w-full max-w-md bg-card border-0 rounded-[2rem] p-8 shadow-2xl elevation-3"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-500/10 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <Trash2 className="w-10 h-10 text-red-600 dark:text-red-500" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-2">Discard Progress?</h3>
                    <p className="text-muted-foreground mb-8 text-lg">
                        This will permanently delete your current incomplete session. This action cannot be undone.
                    </p>

                    <div className="flex w-full gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-foreground bg-secondary font-medium hover:bg-primary rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
