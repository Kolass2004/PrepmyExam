export interface TargetExam {
    id: string;
    title: string;
    description: string;
    latestNews: string;
    createdAt: number | string; // Timestamp or ISO string
}

export interface RoadmapWeek {
    week: number;
    title: string;
    topics: string[];
    description?: string;
    status: 'pending' | 'completed' | 'skipped';
}

export interface UserGoal {
    exam: string;
    examDate: string; // ISO Date String (YYYY-MM-DD)
    createdAt: string;
    roadmap?: RoadmapWeek[];
    status?: 'generating' | 'completed' | 'error';
    dailyTaskProfile?: DailyTaskProfile;
}

export interface DailyTaskProfile {
    status: 'active' | 'deprecated';
    consecutiveMissed: number;
    appealsUsed: number; // Max 2
    lastGeneratedAt: string | null; // ISO Date
    lastAttemptedAt: string | null; // ISO Date
    timezone?: string; // Optional: default to system or user pref
}

export interface QuestionSet {
    id: string;
    targetExamId: string;
    title: string;
    questions: Question[];
    createdAt: number | string;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string | number; // Index or value
    explanation?: string;
    // Add other fields as necessary from existing question usage
}
