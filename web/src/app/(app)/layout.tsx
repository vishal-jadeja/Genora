import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { GenoraProvider } from "@/components/GenoraProvider";

export default async function AppLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <GenoraProvider>
      <AppShell modal={modal} user={session?.user ?? null}>
        {children}
      </AppShell>
    </GenoraProvider>
  );
}
