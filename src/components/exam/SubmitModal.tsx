"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CheckCircle2, X } from "lucide-react";

interface SubmitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

import { useLanguage } from "@/context/LanguageContext";

// ... existing code ...

export function SubmitModal({ isOpen, onClose, onConfirm }: SubmitModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        // ... existing effect ...
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-2">{t('submit_exam_question')}</h3>
                    <p className="text-muted-foreground mb-8 text-lg">
                        {t('submit_exam_confirm_desc')}
                    </p>

                    <div className="flex w-full gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-foreground font-medium hover:bg-secondary rounded-xl transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            {t('yes_submit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
