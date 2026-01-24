"use client";

import { useEffect, useState } from "react";
import { GitCommit, ExternalLink, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Commit {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            date: string;
        };
    };
    author: {
        avatar_url: string;
        html_url: string;
        login: string;
    } | null;
    html_url: string;
}

export function CommitHistory() {
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchCommits() {
            try {
                const res = await fetch("https://api.github.com/repos/Kolass2004/bankexam/commits?per_page=5");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setCommits(data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchCommits();
    }, []);

    if (error) return null;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <GitCommit className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">Live Commits</h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold animate-pulse">
                        LIVE
                    </span>
                </div>
                <Link
                    href="https://github.com/Kolass2004/bankexam"
                    target="_blank"
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                    <Star className="w-4 h-4" /> Star on GitHub
                </Link>
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="text-sm">Fetching latest updates...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {commits.map((commit) => (
                            <div key={commit.sha} className="p-4 hover:bg-secondary/30 transition-colors group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {commit.author ? (
                                                <img
                                                    src={commit.author.avatar_url}
                                                    alt={commit.commit.author.name}
                                                    className="w-10 h-10 rounded-full border border-border"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                                    <span className="font-bold text-muted-foreground text-xs">
                                                        {commit.commit.author.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                {commit.commit.message}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="font-semibold">{commit.commit.author.name}</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={commit.html_url}
                                        target="_blank"
                                        title="View on GitHub"
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-3 bg-secondary/50 text-center text-xs text-muted-foreground font-medium">
                    Showing latest 5 commits from main branch
                </div>
            </div>
        </div>
    );
}
