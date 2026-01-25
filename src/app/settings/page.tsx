"use client";

import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Trash2, Shield, Moon, History, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
    }

    const handleClearHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/reset-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: "Exam history cleared successfully." });
                setConfirmReset(false);
            } else {
                setMessage({ type: 'error', text: "Failed to clear history." });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid }),
            });

            if (res.ok) {
                await auth.signOut();
                router.push("/");
            } else {
                setMessage({ type: 'error', text: "Failed to delete account. You may need to re-login." });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 p-6 md:p-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
                <ArrowLeft className="w-5 h-5" /> {t('back_dashboard')}
            </Link>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">{t('settings_title')}</h1>
                <p className="text-muted-foreground mb-10">{t('settings_desc')}</p>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Appearance */}
                    <section className="bg-card border border-border p-6 rounded-[2rem]">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Moon className="w-5 h-5" /> {t('appearance')}
                        </h2>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('theme')}</span>
                            <ThemeToggle />
                        </div>
                    </section>

                    {/* Data Management */}
                    <section className="bg-card border border-border p-6 rounded-[2rem]">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <History className="w-5 h-5" /> {t('data_mgmt')}
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">{t('clear_history')}</h3>
                                <p className="text-sm text-muted-foreground">{t('clear_history_desc')}</p>
                            </div>

                            {confirmReset ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setConfirmReset(false)}
                                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={handleClearHistory}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                    >
                                        {isLoading ? t('clearing') : t('confirm')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmReset(true)}
                                    className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                                >
                                    {t('delete')}
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="bg-destructive/5 border border-destructive/20 p-6 rounded-[2rem]">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" /> {t('danger_zone')}
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-destructive">{t('delete_account')}</h3>
                                <p className="text-sm text-muted-foreground">{t('delete_account_desc')}</p>
                            </div>

                            {confirmDelete ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                    >
                                        {isLoading ? t('deleting') : t('confirm_delete')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {t('delete')}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
