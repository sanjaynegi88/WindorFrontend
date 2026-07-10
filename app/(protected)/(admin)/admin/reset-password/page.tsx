"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Suspense } from "react";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    return (
        <div className="max-w-md mx-auto py-10">
            <ResetPasswordForm token={token} />
        </div>
    );
}

export default function AdminResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
