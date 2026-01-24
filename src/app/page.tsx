"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { UploadPage } from "@/components/onboarding/UploadPage";
import { Loader2 } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [hasExams, setHasExams] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    async function checkUserExams() {
      if (!user) return;
      setDataLoading(true);
      try {
        // Direct Client-Side Firestore Query to avoid Serverless Cold Start
        const q = query(
          collection(db, "exams"),
          where("userId", "==", user.uid),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        setHasExams(!querySnapshot.empty);
      } catch (err) {
        console.error("Error checking exams:", err);
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
