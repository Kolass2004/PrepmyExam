"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, BookOpen, Clock, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserDetailsPage({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = use(params);
    const { user } = useAuth();
    const [progress, setProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setLoading(true);
            try {
                const token = await user?.getIdToken();
                const res = await fetch(`/api/admin/users/${uid}/progress`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProgress(data.progress || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user, uid]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/users" className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">User Details</h1>
                <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">{uid}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Can add more user profile edit forms here if needed */}
                <div className="p-6 rounded-3xl bg-card border border-border col-span-2">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Exam Progress & History
                    </h2>

                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground animate-pulse">Loading progress...</div>
                    ) : progress.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">No exam history found for this user.</div>
                    ) : (
                        <div className="space-y-4">
                            {progress.map((p: any) => (
                                <div key={p.id} className="p-4 rounded-xl bg-secondary/30 border border-border flex items-start justify-between">
                                    <div>
                                        <div className="font-bold text-foreground">Exam ID: {p.examId}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.updatedAt ? format(new Date(p.updatedAt), "PPp") : "Unknown Date"}</span>
                                            <span>Question index: {p.currentQuestionIndex ?? "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* Placeholder for actions like reset progress */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
