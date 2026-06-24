import { Suspense } from "react";
import { AuthForm } from "@/components/features/auth-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
