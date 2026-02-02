"use client";

import { useEffect, useState, use } from "react";
import { ExamContainer } from "@/components/exam/ExamContainer";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { QuestionSet } from "@/lib/types";

export default function AttemptPage(props: { params: Promise<{ examId: string; setId: string }> }) {
    const params = use(props.params);
    const { examId, setId } = params;
    const { t } = useLanguage();

    const [set, setSet] = useState<QuestionSet | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Need user for daily task fetch

    useEffect(() => {
        async function fetchSet() {
            try {
                let url = `/api/question-banks/${examId}/question-sets/${setId}`;

                if (examId === 'daily_task') {
                    if (!user) return; // Wait for user to be ready
                    url = `/api/user/daily-task/${setId}?uid=${user.uid}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    setSet(await res.json());
                } else {
                    console.error("Failed fetch", res.status);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (examId !== 'daily_task' || user) {
            fetchSet();
        }
    }, [examId, setId, user]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!set) return <div>{t('set_not_found') || "Set not found"}</div>;

    return (
        <ExamContainer
            examId={setId} // Using set ID as exam ID for consistency, though it won't fetch from "exams"
            questions={set.questions} // Pass the questions directly
            examTitle={set.title}
            examType={examId === 'daily_task' ? 'daily_task' : 'standard'}
        />
    );
}
