"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { UploadPage } from "@/components/onboarding/UploadPage";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [hasExams, setHasExams] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    async function checkUserExams() {
      if (!user) return;
      setDataLoading(true);
      try {
        // TODO: Replace with actual API call to check if user has exams
        // For now, simulate no exams (or check local storage for dev)
        // In real app: fetch(`/api/user/${user.uid}/status`)
        const res = await fetch(`/api/user/status?uid=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setHasExams(data.hasExams);
        } else {
          setHasExams(false);
        }
      } catch (err) {
        setHasExams(false);
      } finally {
        setDataLoading(false);
      }
    }

    if (user) {
      checkUserExams();
    }
  }, [user]);

  if (authLoading || (user && hasExams === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!hasExams) {
    return <UploadPage onUploadSuccess={() => setHasExams(true)} />;
  }

  return <Dashboard user={user} />;
}
