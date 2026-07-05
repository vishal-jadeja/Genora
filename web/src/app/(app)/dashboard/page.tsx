"use client";

import { useFacet } from "@/components/facet/FacetProvider";
import { DashboardView } from "@/components/facet/DashboardView";

export default function DashboardPage() {
  const { state, derived, actions } = useFacet();
  return <DashboardView state={state} derived={derived} actions={actions} />;
}
