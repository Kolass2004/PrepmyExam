"use client";

import { useEffect, useState, use } from "react";
import { ExamContainer } from "@/components/exam/ExamContainer";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AttemptPage(props: { params: Promise<{ examId: string; setId: string }> }) {
    const params = use(props.params);
    const { examId, setId } = params;
    const { t } = useLanguage();

    const [set, setSet] = useState<QuestionSet | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSet() {
            try {
                const res = await fetch(`/api/question-banks/${examId}/question-sets/${setId}`);
                if (res.ok) {
                    setSet(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchSet();
    }, [examId, setId]);

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
        />
    );
}
