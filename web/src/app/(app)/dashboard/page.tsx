"use client";

import { useGenora } from "@/components/GenoraProvider";
import { DashboardView } from "@/components/DashboardView";

export default function DashboardPage() {
  const { state, derived, loading, actions } = useGenora();
  return (
    <DashboardView
      state={state}
      derived={derived}
      loading={loading}
      actions={actions}
    />
  );
}
