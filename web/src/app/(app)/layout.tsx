import type { ReactNode } from "react";
import { AppShell } from "@/components/facet/AppShell";
import { FacetProvider } from "@/components/facet/FacetProvider";

export default function AppLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <FacetProvider>
      <AppShell modal={modal}>{children}</AppShell>
    </FacetProvider>
  );
}
