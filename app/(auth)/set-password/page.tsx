"use client";

import { Suspense } from "react";
import { SetSubUserPasswordForm } from "@/components/forms/set-subuser-password-form";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetSubUserPasswordForm />
    </Suspense>
  );
}
