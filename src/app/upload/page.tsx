"use client";

import { UploadPage } from "@/components/onboarding/UploadPage";
import { useRouter } from "next/navigation";

export default function NewUploadPage() {
    const router = useRouter();

    return (
        <UploadPage
            onUploadSuccess={() => {
                // Force a refresh or just navigate to dashboard
                // Since dashboard relies on API fetch, a simple push is enough.
                router.push("/");
                router.refresh();
            }}
        />
    );
}
