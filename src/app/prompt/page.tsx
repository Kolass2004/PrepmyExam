"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, Sparkles, Calendar, BookOpen, Hash, School, GraduationCap, Monitor, Globe, FileJson, Layers } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, subMonths, subYears, startOfYear } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

// Exam Definitions for Mock Tests
const examDefinitions: Record<string, { defaultCount: number; subjects: string[] }> = {
    "Bank PO": { defaultCount: 100, subjects: ["Reasoning", "Quantitative Aptitude", "English", "General Awareness", "Computer"] },
    "SBI Clerk": { defaultCount: 100, subjects: ["Reasoning", "Quantitative Aptitude", "English"] },
    "IBPS RRB": { defaultCount: 80, subjects: ["Reasoning", "Quantitative Aptitude"] },
    "SSC CGL": { defaultCount: 100, subjects: ["Reasoning", "Quantitative Aptitude", "English", "General Awareness"] },
    "UPSC CSE": { defaultCount: 100, subjects: ["General Awareness", "Current Affairs", "History", "Geography", "Polity"] },
    "Railways NTPC": { defaultCount: 100, subjects: ["Reasoning", "Quantitative Aptitude", "General Awareness"] },
    "TNPSC Group 1": { defaultCount: 200, subjects: ["General Studies", "Math Logic", "Current Affairs", "General Awareness", "History", "Geography"] },
    "TNPSC Group 2": { defaultCount: 200, subjects: ["General Studies", "Math Logic", "General English/Tamil", "Current Affairs"] },
    "TNPSC Group 4": { defaultCount: 200, subjects: ["General Studies", "Math Logic", "General English/Tamil", "Current Affairs"] },
    // Default fallback
    "default": { defaultCount: 50, subjects: ["Reasoning", "Quantitative Aptitude", "English"] }
};

export default function PromptPage() {
    const { t } = useLanguage();

    // Inputs
    const [exam, setExam] = useState("Bank PO");
    const [count, setCount] = useState(10);
    // Subjects State
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Reasoning"]);
    const isMockTest = selectedSubjects.includes("Mock Test");

    // Paste JSON Feature
    const [showPasteButton, setShowPasteButton] = useState(false);
    const router = useRouter();

    // Date State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showCustomDates, setShowCustomDates] = useState(false);
    const [activePreset, setActivePreset] = useState("");
    const [showAiLinks, setShowAiLinks] = useState(false);

    const [copied, setCopied] = useState(false);

    const tools = [
        { name: "ChatGPT", url: "https://chat.openai.com", logo: "/ailogo/openai.svg" },
        { name: "Claude", url: "https://claude.ai/new", logo: "/ailogo/claude-color.svg" },
        { name: "Gemini", url: "https://gemini.google.com", logo: "/ailogo/gemini-color.svg" },
        { name: "DeepSeek", url: "https://chat.deepseek.com", logo: "/ailogo/deepseek-color.svg" },
        { name: "Perplexity", url: "https://www.perplexity.ai", logo: "/ailogo/perplexity-color.svg" },
    ];

    const subjects = [
        { name: "Mock Test", icon: <Layers className="w-4 h-4" /> }, // Special Option
        { name: "Math Logic", icon: <Hash className="w-4 h-4" /> },
        { name: "Reasoning", icon: <Sparkles className="w-4 h-4" /> },
        { name: "Quantitative Aptitude", icon: <Hash className="w-4 h-4" /> },
        { name: "English", icon: <BookOpen className="w-4 h-4" /> },
        { name: "General English/Tamil", icon: <BookOpen className="w-4 h-4" /> },
        { name: "General Studies", icon: <School className="w-4 h-4" /> },
        { name: "History", icon: <School className="w-4 h-4" /> },
        { name: "Geography", icon: <Globe className="w-4 h-4" /> },
        { name: "Polity", icon: <School className="w-4 h-4" /> },
        { name: "Current Affairs", icon: <Globe className="w-4 h-4" /> },
        { name: "General Awareness", icon: <School className="w-4 h-4" /> },
        { name: "Computer", icon: <Monitor className="w-4 h-4" /> },
    ];

    const exams = [
        "Bank PO", "SBI Clerk", "IBPS RRB", "SSC CGL", "UPSC CSE", "Railways NTPC",
        "SSC CHSL", "SSC MTS", "RBI Grade B", "LIC AAO", "IBPS Clerk", "SBI PO",
        "TNPSC Group 1", "TNPSC Group 2", "TNPSC Group 4",
        "GATE", "CAT", "UPSC CDS", "UPSC EPFO"
    ];

    // Handle Exam Change
    const handleExamChange = (newExam: string) => {
        setExam(newExam);
        // If currently in Mock Test mode, update count to new exam default
        if (isMockTest) {
            const def = examDefinitions[newExam] || examDefinitions["default"];
            setCount(def.defaultCount);
        }
    };

    const handleSubjectToggle = (subjectName: string) => {
        if (subjectName === "Mock Test") {
            // Select Only Mock Test
            setSelectedSubjects(["Mock Test"]);
            // Auto-set count
            const def = examDefinitions[exam] || examDefinitions["default"];
            setCount(def.defaultCount);
            return;
        }

        let newSelection = [...selectedSubjects];

        // Use functional updaters or cleaner logic
        if (newSelection.includes("Mock Test")) {
            // maintain logic: if clicking a normal subject while mock is active, clear mock
            newSelection = [];
        }

        if (newSelection.includes(subjectName)) {
            newSelection = newSelection.filter(s => s !== subjectName);
        } else {
            newSelection.push(subjectName);
        }

        // Enforce at least one selection if desired, or allow empty?
        // Let's allow empty temporary, but maybe default to one if empty?
        if (newSelection.length === 0) newSelection = ["Reasoning"]; // Fallback

        setSelectedSubjects(newSelection);
    };

    const handlePreset = (preset: string) => {
        setActivePreset(preset);

        if (preset === "CUSTOM") {
            setShowCustomDates(true);
            return;
        }

        setShowCustomDates(false);
        const today = new Date();
        const end = format(today, "yyyy-MM-dd");
        let start = new Date();

        switch (preset) {
            case "3M": start = subMonths(today, 3); break;
            case "6M": start = subMonths(today, 6); break;
            case "1Y": start = subYears(today, 1); break;
            case "YTD": start = startOfYear(today); break;
        }
        setStartDate(format(start, "yyyy-MM-dd"));
        setEndDate(end);
    };

    // Prompt Generation Logic
    const generatePrompt = () => {
        let contentRequest = "";

        if (isMockTest) {
            const def = examDefinitions[exam] || examDefinitions["default"];
            // If mock test, we want to specify it covers all relevant subjects
            const subjectList = def.subjects.join(", ");
            contentRequest = `as a full Mock Test covering ${subjectList}`;
        } else {
            // Multiple subjects
            const subjString = selectedSubjects.join(" and ");

            if (selectedSubjects.includes("Current Affairs")) {
                const dateRange = startDate && endDate ? `from ${startDate} to ${endDate}` : "(specify date range)";
                contentRequest = `for subjects: ${subjString} (specifically for Current Affairs ${dateRange})`;
            } else {
                contentRequest = `for the subjects: ${subjString}`;
            }
        }

        const safeTitle = isMockTest ? `${exam} Full Mock Test` : `${exam} Practice Set (${selectedSubjects.length > 2 ? 'Mixed' : selectedSubjects.join(', ')})`;

        return `give me the ${count} questions based on ${exam} exam ${contentRequest} in this json format

[
    {
        "title": "${safeTitle}",
        "questions": [
            {
                "id": 1,
                "question": "### Question text here",
                "options": {
                    "a": "Option A",
                    "b": "Option B",
                    "c": "Option C",
                    "d": "Option D"
                },
                "correct_answer": "a"
            }
        ]
    }
]`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatePrompt());
        setCopied(true);
        setShowAiLinks(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToolClick = () => {
        setTimeout(() => {
            setShowPasteButton(true);
        }, 2000);
    };

    const handlePasteJson = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                localStorage.setItem("pendingExamUpload", text);
            }
        } catch (err) {
            console.error("Clipboard permission denied", err);
        }
        router.push("/upload");
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel: Inputs */}
                <div className="w-full lg:w-[450px] border-r border-border/40 bg-card/30 backdrop-blur-sm p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">

                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors group">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                            <h1 className="font-bold text-lg text-foreground">{t('create_exams')}</h1>
                        </div>
                    </div>

                    {/* 1. Exam Selection */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3 ml-2 block">{t('target_exam')}</label>
                        <div className="relative group">
                            <select
                                value={exam}
                                onChange={(e) => handleExamChange(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-background border border-border hover:border-primary/50 focus:border-primary outline-none transition-all appearance-none cursor-pointer text-base font-medium shadow-sm transition-colors"
                            >
                                {exams.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                        </div>
                    </div>

                    {/* 2. Question Count */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3 ml-2 block">{t('questions_count')}</label>
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm min-w-[3rem] text-center">{count}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max={isMockTest ? 200 : 100}
                            step="5"
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer hover:bg-secondary/80 transition-colors"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>5</span>
                            <span>{isMockTest ? 100 : 50}</span>
                            <span>{isMockTest ? 200 : 100}</span>
                        </div>
                    </div>

                    {/* 3. Subject Selection */}
                    <div className="space-y-4">
                        <label className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3 ml-2 block">{t('subject')}</label>
                        <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                            {subjects.map(sub => {
                                const isSelected = selectedSubjects.includes(sub.name);
                                return (
                                    <button
                                        key={sub.name}
                                        onClick={() => handleSubjectToggle(sub.name)}
                                        className={cn(
                                            "p-4 rounded-2xl text-sm font-medium transition-all text-left border flex items-center gap-3 relative overflow-hidden group active:scale-95",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-background border-transparent hover:bg-secondary/60 hover:border-border"
                                        )}
                                    >
                                        <span className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            isSelected ? "bg-primary-foreground/10 text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {sub.icon}
                                        </span>
                                        {sub.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Conditional: Duration (Only if Current Affairs is selected) */}
                    {selectedSubjects.includes("Current Affairs") && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3 ml-2 block">{t('timeframe')}</label>

                            {/* Quick Access Presets */}
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: "Last 3 Months", val: "3M" },
                                    { label: "Last 6 Months", val: "6M" },
                                    { label: "Last Year", val: "1Y" },
                                    { label: t('custom'), val: "CUSTOM" }
                                ].map((p) => (
                                    <button
                                        key={p.val}
                                        onClick={() => handlePreset(p.val)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                            activePreset === p.val
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-transparent hover:border-border"
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {showCustomDates && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-medium ml-1">{t('start_date')}</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-medium ml-1">{t('end_date')}</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Canvas */}
                <div className="flex-1 bg-secondary/10 p-4 md:p-8 flex flex-col relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] opacity-20 pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 relative z-10 min-h-[44px]">




                        {/* Header or AI Links */}
                        {showAiLinks ? (
                            <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-border animate-in fade-in slide-in-from-top-4 duration-300 w-fit">
                                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{t('open_with')}</span>
                                <div className="flex items-center gap-3">
                                    {tools.map(t => (
                                        <a
                                            key={t.name}
                                            href={t.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={handleToolClick}
                                            className="relative group transition-transform hover:scale-110"
                                            title={t.name}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shadow-sm group-hover:border-primary/50 group-hover:shadow-md transition-all">
                                                <img src={t.logo} alt={t.name} className="w-5 h-5 object-contain" />
                                            </div>
                                        </a>
                                    ))}
                                </div>

                                {showPasteButton && (
                                    <button
                                        onClick={handlePasteJson}
                                        className="ml-3 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-lg animate-in zoom-in duration-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <FileJson className="w-3 h-3" /> Paste JSON & Create
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('prompt_preview')}</label>
                            </div>
                        )}

                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ml-auto",
                                copied
                                    ? "bg-green-500 text-white shadow-green-500/20"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                            )}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? t('copied') : t('copy_prompt')}
                        </button>
                    </div>

                    <div className="flex-1 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative w-full h-full bg-card rounded-[1.8rem] border border-border shadow-sm overflow-hidden flex flex-col">
                            {/* Editor Header */}
                            <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                </div>
                            </div>
                            <textarea
                                readOnly
                                value={generatePrompt()}
                                className="flex-1 w-full p-6 resize-none bg-transparent font-mono text-sm leading-relaxed outline-none focus:bg-secondary/5 transition-colors custom-scrollbar"
                            />
                            <div className="h-8 border-t border-border bg-muted/30 flex items-center justify-end px-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                JSON Format • {generatePrompt().length} Characters
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
