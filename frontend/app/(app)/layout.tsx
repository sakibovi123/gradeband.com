import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/features/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already gates these routes; this is a second line of defense.
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <AppNav email={user.email ?? null} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
