import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/admin-auth";
import { getContent, isSupabaseConfigured } from "@/lib/supabase-admin";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";

export const metadata: Metadata = {
  title: "Admin — Veyra",
  robots: { index: false, follow: false },
};

/* The gate runs on the server: an unauthenticated visitor never receives the
   dashboard's code or data, and the session cookie is httpOnly so client-side
   script can't read it either. */
export default async function AdminPage() {
  if (!(await isAuthenticated())) return <LoginForm />;

  const { content, source, error } = await getContent();

  return (
    <Dashboard
      initial={content}
      source={source}
      configured={isSupabaseConfigured}
      backendError={error ?? null}
    />
  );
}
