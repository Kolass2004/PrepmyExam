"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface RenameModalProps {
    isOpen: boolean;
    currentTitle: string;
    onClose: () => void;
    onSave: (newTitle: string) => Promise<void>;
}

export function RenameModal({ isOpen, currentTitle, onClose, onSave }: RenameModalProps) {
    const [title, setTitle] = useState(currentTitle);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(title);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-card border-0 rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl elevation-3">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold text-white mb-6">{t('rename_exam')}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            {t('exam_title')}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            placeholder={t('enter_exam_title')}
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {t('save_changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
