"use client";

import { useEffect, useState, use } from "react";
import { User } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

import { Loader2, Share2, Calendar, Trophy, ArrowLeft, Copy, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface UserProfile {
    uid: string;
    displayName: string;
    photoURL: string;
    email: string;
    createdAt: string;
}

interface UserStats {
    overallScore: number;
    totalAttempts: number;
}

interface ActivityDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export default function UserProfilePage({ params }: { params: Promise<{ uid: string }> }) {
    // Unwrap params using React.use()
    const { uid } = use(params);
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [activity, setActivity] = useState<ActivityDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [uidCopied, setUidCopied] = useState(false);

    // Year Selection
    const currentYear = new Date().getFullYear();
    const startYear = 2026;
    const years = Array.from(
        { length: Math.max(1, currentYear - startYear + 1) },
        (_, i) => startYear + i
    );

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);


    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Profile & Stats
                const profileRes = await fetch(`/api/user/profile?uid=${uid}`);
                if (!profileRes.ok) throw new Error("User not found");
                const profileData = await profileRes.json();
                setProfile(profileData.user);
                setStats(profileData.stats);

                // Fetch Activity
                const activityRes = await fetch(`/api/user/activity?uid=${uid}`);
                const activityData = await activityRes.json();
                setActivity(activityData.activity || []);

            } catch (err) {
                console.error(err);
                setError("Could not load profile");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [uid]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyUid = () => {
        if (profile) {
            navigator.clipboard.writeText(profile.uid);
            setUidCopied(true);
            setTimeout(() => setUidCopied(false), 2000);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{error || "User not found"}</p>
                <Link href="/" className="text-primary hover:underline">Go Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                        <div className="p-2 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {!currentUser && (
                            <Link
                                href="/"
                                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Join Now
                            </Link>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-[1400px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar Profile Info */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="relative group w-fit mx-auto lg:mx-0">
                            <div className="w-64 h-64 rounded-full border-4 border-card shadow-2xl overflow-hidden bg-secondary relative">
                                <img
                                    src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`}
                                    alt={profile.displayName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="text-center lg:text-left space-y-2">
                            <h1 className="text-4xl font-bold">{profile.displayName}</h1>
                            <div className="flex items-center justify-center lg:justify-start gap-2">
                                <p className="text-muted-foreground font-mono text-xs bg-secondary/50 py-1.5 px-3 rounded-lg w-fit">
                                    <span className="opacity-50 mr-1">UID:</span>
                                    {profile.uid.slice(0, 8)}...
                                </p>
                                <button onClick={handleCopyUid} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Copy UID">
                                    {uidCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-2 pt-1">
                                <Calendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <button
                            onClick={handleShare}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors font-medium shadow-sm active:scale-95"
                        >
                            <Share2 className="w-4 h-4" />
                            {copied ? "Link Copied!" : "Share Profile"}
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col justify-center">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Score</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold">{stats?.overallScore.toFixed(1)}</span>
                                    <span className="text-3xl text-muted-foreground">%</span>
                                </div>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col justify-center">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Exams Taken</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold">{stats?.totalAttempts}</span>
                                    <Trophy className="w-8 h-8 text-yellow-500" />
                                </div>
                            </div>
                        </div>

                        {/* Activity Graph */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    Study Consistency
                                </h2>

                                {/* Year Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors"
                                    >
                                        {selectedYear}
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>

                                    {isYearDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-32 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden p-1">
                                            {years.map(year => (
                                                <button
                                                    key={year}
                                                    onClick={() => {
                                                        setSelectedYear(year);
                                                        setIsYearDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                                        selectedYear === year ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"
                                                    )}
                                                >
                                                    {year}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm overflow-hidden">
                                <div className="overflow-x-auto pb-2 custom-scrollbar">
                                    <div className="min-w-[800px]">
                                        <ActivityMap activity={activity} year={selectedYear} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ActivityMap({ activity, year }: { activity: ActivityDay[], year: number }) {
    // Generate all days for the selected year
    const days: Date[] = [];
    const startDate = new Date(year, 0, 1); // Jan 1st
    const endDate = new Date(year, 11, 31); // Dec 31st

    // Loop through year
    const curr = new Date(startDate);
    while (curr <= endDate) {
        days.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
    }

    // Map activity data
    const activityMap = new Map(activity.map(a => [a.date, a.level]));

    // Render Items Preparation
    // We will render days, but insert 7 empty cells (a full column gap)
    // when we encounter the start of a new month (except Jan).

    interface GridItem {
        type: 'day' | 'gap' | 'padding';
        date?: Date;
    }

    const items: GridItem[] = [];
    const months: { label: string, columnStart: number }[] = [];

    // Initial padding for start of year weekday
    const startDayOffset = startDate.getDay(); // 0(Sun)..6(Sat)
    for (let i = 0; i < startDayOffset; i++) {
        items.push({ type: 'padding' });
    }

    let currentLayoutMonth = -1;
    let currentColumnIndex = 0; // Tracks which vertical column we are in (approx)
    // Actually, in grid-flow-col, items fill column first.
    // So 7 items = 1 column.
    // To calculate column index: floor(items.length / 7)

    days.forEach((date) => {
        const m = date.getMonth();

        // Check for month change
        if (m !== currentLayoutMonth) {
            if (currentLayoutMonth !== -1) {
                // If not Jan (already started), insert gap column (7 items)
                // BUT: We need to make sure we are aligned to the start of a column before inserting a gap column?
                // Visual consistency: If we just dump 7 items, they might wrap across two columns if the previous column wasn't full.
                // grid-flow-col fills the current column until 7 items, then moves to next.
                // If we want a CLEAN vertical gap, we must ensure the previous month visually "ends".
                // However, continuous graphs usually don't break columns mid-week for month gaps.
                // The user just wants a "gap between months".
                // Inserting 7 blank items acts as a "spacer week".
                // It works best if the graph is conceptually just a stream of weeks.
                // If we perform a "gap", it pushes everything to the right.

                // Let's just push 7 blank items.
                for (let i = 0; i < 7; i++) items.push({ type: 'gap' });
            }

            // Record label position
            // Column start index = floor(items.length / 7)
            months.push({
                label: date.toLocaleString('default', { month: 'short' }),
                columnStart: Math.floor(items.length / 7)
            });

            currentLayoutMonth = m;
        }

        items.push({ type: 'day', date });
    });

    return (
        <div className="flex flex-col gap-2">
            {/* Month Labels */}
            <div className="flex text-xs text-muted-foreground h-5 relative w-full mb-1">
                {months.map((m, i) => (
                    <span
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `${m.columnStart * 16}px` // 12px box + 4px gap
                        }}
                        className="transform translate-x-1"
                    >
                        {m.label}
                    </span>
                ))}
            </div>

            <div className="grid grid-rows-7 grid-flow-col gap-1 h-[112px]">
                {items.map((item, i) => {
                    if (item.type === 'padding' || item.type === 'gap') {
                        return <div key={`empty-${i}`} className="w-3 h-3 bg-transparent" />;
                    }

                    if (item.date) {
                        const dateStr = item.date.toISOString().split('T')[0];
                        const level = activityMap.get(dateStr) || 0;
                        return (
                            <div
                                key={dateStr}
                                title={`${item.date.toDateString()}: ${level} exams`}
                                className={`w-3 h-3 rounded-sm transition-colors ${level === 0 ? "bg-secondary/80 hover:bg-secondary" :
                                        level === 1 ? "bg-primary/30" :
                                            level === 2 ? "bg-primary/50" :
                                                level === 3 ? "bg-primary/70" :
                                                    "bg-primary"
                                    }`}
                            />
                        );
                    }
                    return null;
                })}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-secondary/80" />
                    <div className="w-3 h-3 rounded-sm bg-primary/30" />
                    <div className="w-3 h-3 rounded-sm bg-primary/50" />
                    <div className="w-3 h-3 rounded-sm bg-primary/70" />
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
