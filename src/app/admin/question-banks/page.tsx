"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, ArrowRight, Trash2, Edit, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { TargetExam } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function QuestionBanksPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState<TargetExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // New Exam State
    const [newExamTitle, setNewExamTitle] = useState("");
    const [newExamDesc, setNewExamDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchExams = async () => {
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/question-banks", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExams(data.exams || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchExams();
    }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/question-banks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newExamTitle,
                    description: newExamDesc,
                    latestNews: ""
                })
            });

            if (res.ok) {
                const newExam = await res.json();
                setExams([newExam, ...exams]);
                setNewExamTitle("");
                setNewExamDesc("");
                setIsCreating(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete all question sets associated with this exam.")) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/question-banks/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setExams(exams.filter(e => e.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        Question Banks
                        <span className="text-lg font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                            {exams.length}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage target exams and question sets</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-2xl hover:brightness-110 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Exam</span>
                </button>
            </div>

            {/* Create Modal/Inline Form */}
            {isCreating && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleCreate} className="bg-card w-full max-w-lg p-8 rounded-[2rem] shadow-2xl border border-border/50 space-y-6 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black">Create Target Exam</h2>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="p-2 rounded-full hover:bg-secondary transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Exam Title</label>
                                <input
                                    required
                                    value={newExamTitle}
                                    onChange={e => setNewExamTitle(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-transparent focus:border-primary/50 focus:bg-secondary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium placeholder:text-muted-foreground/50"
                                    placeholder="e.g. UPSC CSE 2024"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Description</label>
                                <textarea
                                    required
                                    value={newExamDesc}
                                    onChange={e => setNewExamDesc(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-transparent focus:border-primary/50 focus:bg-secondary/50 focus:ring-4 focus:ring-primary/10 outline-none min-h-[120px] transition-all text-lg font-medium placeholder:text-muted-foreground/50 resize-none"
                                    placeholder="Brief description of the exam..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-3 rounded-xl hover:bg-secondary transition-colors font-bold text-muted-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Exam
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="py-32 flex justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : exams.length === 0 ? (
                <div className="py-32 text-center text-muted-foreground bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border/50">
                    <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No exams found</h3>
                    <p className="max-w-xs mx-auto text-balance">Create your first exam question bank to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam, idx) => (
                        <div
                            key={exam.id}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="group relative bg-card hover:bg-secondary/40 border border-border/50 rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards flex flex-col"
                        >
                            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete(exam.id);
                                    }}
                                    className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                                    title="Delete Exam"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <Link href={`/admin/question-banks/${exam.id}`} className="block flex-1 flex flex-col h-full">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-black tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{exam.title}</h3>
                                    <p className="text-base text-muted-foreground line-clamp-2 mt-3 leading-relaxed">
                                        {exam.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between font-bold text-primary">
                                    <span className="text-sm uppercase tracking-wider">Manage Questions</span>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
