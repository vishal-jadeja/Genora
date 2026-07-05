"use client";

import { useGenora } from "@/components/GenoraProvider";
import { DashboardView } from "@/components/DashboardView";

export default function DashboardPage() {
  const { state, derived, actions } = useGenora();
  return <DashboardView state={state} derived={derived} actions={actions} />;
}
