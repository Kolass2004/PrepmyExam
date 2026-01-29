"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, Upload, Trash2, FileJson, Save, Plus, Edit, X, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TargetExam, QuestionSet } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ExamDetailPage(props: { params: Promise<{ examId: string }> }) {
    const params = use(props.params);
    const { examId } = params;

    const { user } = useAuth();
    const router = useRouter();

    const [exam, setExam] = useState<TargetExam | null>(null);
    const [sets, setSets] = useState<QuestionSet[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Exam State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", latestNews: "" });
    const [saving, setSaving] = useState(false);

    // Upload Set State
    const [isUploading, setIsUploading] = useState(false);
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();

            // Fetch Exam
            const examRes = await fetch(`/api/admin/question-banks/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (examRes.ok) {
                const examData = await examRes.json();
                setExam(examData);
                setEditForm({
                    title: examData.title,
                    description: examData.description,
                    latestNews: examData.latestNews || ""
                });
            } else {
                router.push("/admin/question-banks"); // Redirect if not found
                return;
            }

            // Fetch Sets
            const setsRes = await fetch(`/api/admin/question-banks/${examId}/question-sets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (setsRes.ok) {
                const setsData = await setsRes.json();
                setSets(setsData.sets || []);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, examId]);

    const handleUpdateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/question-banks/${examId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setExam(prev => prev ? { ...prev, ...editForm } : null);
                setIsEditing(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadSet = async (e: React.FormEvent) => {
        e.preventDefault();
        const pasteArea = document.getElementById('paste-area') as HTMLTextAreaElement;
        const pastedContent = pasteArea?.value;

        if (!jsonFile && !pastedContent) return;

        setUploading(true);
        try {
            let text = "";
            if (jsonFile) {
                text = await jsonFile.text();
            } else if (pastedContent) {
                text = pastedContent;
            }

            let questions = [];
            let extractedTitle = "";

            try {
                const json = JSON.parse(text);

                if (Array.isArray(json)) {
                    // Check if it's an array of Questions or an array of Sets
                    if (json.length > 0 && json[0].questions && Array.isArray(json[0].questions)) {
                        // Case: [{ title: "...", questions: [...] }]
                        // Use the title from the first set
                        if (json[0].title) extractedTitle = json[0].title;

                        // Flatten all questions
                        questions = json.flatMap((item: any) => item.questions || []);
                    } else {
                        // Assume it's an array of Questions directly
                        questions = json;
                    }
                } else if (typeof json === 'object' && json !== null) {
                    // It's a single object
                    if (json.questions && Array.isArray(json.questions)) {
                        questions = json.questions;
                        if (json.title) extractedTitle = json.title;
                    } else {
                        questions = [];
                    }
                }

                if (questions.length === 0) {
                    alert("Could not find any questions in the file.");
                    setUploading(false);
                    return;
                }

                if (!extractedTitle) {
                    // Fallback to filename if available, or default
                    extractedTitle = jsonFile?.name.replace(/\.[^/.]+$/, "") || "Untitled Set";
                }

            } catch (err) {
                alert("Invalid JSON format");
                setUploading(false);
                return;
            }

            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/question-banks/${examId}/question-sets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: extractedTitle,
                    questions
                })
            });

            if (res.ok) {
                const newSet = await res.json();
                setSets([newSet, ...sets]);
                setIsUploading(false);
                setJsonFile(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteSet = async (setId: string) => {
        if (!confirm("Delete this question set?")) return;
        try {
            const token = await user?.getIdToken();
            await fetch(`/api/admin/question-banks/${examId}/question-sets/${setId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setSets(sets.filter(s => s.id !== setId));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    if (!exam) return null;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Header / Nav */}
            <div className="flex flex-col gap-6">
                <Link
                    href="/admin/question-banks"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group self-start py-2 pr-4 rounded-xl"
                >
                    <div className="p-2 bg-secondary/50 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm tracking-wide">BACK TO BANKS</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{exam.title}</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {exam.description}
                        </p>
                        {exam.latestNews && (
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <span className="font-bold text-sm">{exam.latestNews}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm active:scale-95",
                            isEditing
                                ? "bg-secondary text-foreground hover:bg-secondary/80"
                                : "bg-card border border-border/50 text-foreground hover:border-primary/50 hover:text-primary"
                        )}
                    >
                        {isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                        <span>{isEditing ? "Cancel Editing" : "Edit Exam Details"}</span>
                    </button>
                </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleUpdateExam} className="space-y-8 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Exam Title</label>
                                <input
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-transparent focus:border-primary/50 focus:bg-secondary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Latest News / Alert</label>
                                <input
                                    value={editForm.latestNews}
                                    onChange={e => setEditForm({ ...editForm, latestNews: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-transparent focus:border-primary/50 focus:bg-secondary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium placeholder:text-muted-foreground/50"
                                    placeholder="e.g. Admit card released"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Description</label>
                            <textarea
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-transparent focus:border-primary/50 focus:bg-secondary/50 focus:ring-4 focus:ring-primary/10 outline-none min-h-[150px] transition-all text-lg font-medium resize-none leading-relaxed"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl hover:brightness-110 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="h-px bg-border/50 my-8"></div>

            {/* Question Sets */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Question Sets</h2>
                        <p className="text-muted-foreground mt-1 font-medium">Manage imported questions for this exam</p>
                    </div>
                    <button
                        onClick={() => setIsUploading(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-2xl hover:brightness-110 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Upload JSON</span>
                    </button>
                </div>

                {sets.length === 0 ? (
                    <div className="py-32 text-center text-muted-foreground bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6">
                        <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center">
                            <FileJson className="w-10 h-10 opacity-50" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">No question sets uploaded</h3>
                            <p className="max-w-xs mx-auto text-balance">Upload a JSON file containing the questions to get started.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sets.map((set, idx) => (
                            <div
                                key={set.id}
                                style={{ animationDelay: `${idx * 50}ms` }}
                                className="flex flex-col p-8 bg-card border border-border/50 rounded-[2.5rem] group hover:border-primary/30 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        <FileJson className="w-8 h-8" />
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSet(set.id)}
                                        className="p-3 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        title="Delete Set"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6 flex-1">
                                    <h3 className="text-xl font-black leading-tight line-clamp-2" title={set.title}>{set.title}</h3>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {set.questions?.length || 0} Questions
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Published
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploading && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleUploadSet} className="bg-card w-full max-w-xl p-8 rounded-[2.5rem] shadow-2xl border border-border/50 space-y-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black">Upload Question Set</h2>
                            <button
                                type="button"
                                onClick={() => setIsUploading(false)}
                                className="p-2 rounded-full hover:bg-secondary transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>


                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">File Upload</label>
                                <div className="group relative border-2 border-dashed border-border rounded-3xl p-10 text-center hover:bg-secondary/20 hover:border-primary/30 transition-all cursor-pointer overflow-hidden">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={e => {
                                            setJsonFile(e.target.files?.[0] || null);
                                            // clear paste
                                            const el = document.getElementById('paste-area') as HTMLTextAreaElement;
                                            if (el) el.value = "";
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="relative z-0 pointer-events-none transition-transform group-hover:scale-105 duration-300">
                                        {jsonFile ? (
                                            <div className="text-primary font-bold flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                                                    <FileJson className="w-8 h-8" />
                                                </div>
                                                <div className="text-xl">{jsonFile.name}</div>
                                                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{(jsonFile.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <Download className="w-8 h-8" />
                                                </div>
                                                <span className="text-lg font-bold text-foreground">Click to browse JSON</span>
                                                <span className="text-sm font-medium opacity-60">or drag and drop file here</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-border/50"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase font-black tracking-widest opacity-50">OR Paste Content</span>
                                <div className="flex-grow border-t border-border/50"></div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Paste JSON</label>
                                <textarea
                                    id="paste-area"
                                    className="w-full h-40 px-6 py-4 rounded-2xl bg-secondary/30 border border-transparent font-mono text-xs focus:ring-4 focus:ring-primary/10 focus:bg-secondary/50 outline-none transition-all resize-none"
                                    placeholder='Paste JSON here: { "questions": [...] }'
                                    onChange={(e) => {
                                        if (e.target.value) setJsonFile(null);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setIsUploading(false)}
                                className="px-6 py-3 rounded-xl hover:bg-secondary transition-colors font-bold text-muted-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Upload Set
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
