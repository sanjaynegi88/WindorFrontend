"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Suspense } from "react";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    return (
        <ResetPasswordForm token={token} />
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
