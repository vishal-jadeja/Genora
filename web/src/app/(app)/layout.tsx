import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { GenoraProvider } from "@/components/GenoraProvider";

export default function AppLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <GenoraProvider>
      <AppShell modal={modal}>{children}</AppShell>
    </GenoraProvider>
  );
}
