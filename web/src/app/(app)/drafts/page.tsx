"use client";

import { useFacet } from "@/components/facet/FacetProvider";
import { DraftsView } from "@/components/facet/DraftsView";

export default function DraftsPage() {
  const { state, derived, actions } = useFacet();
  return <DraftsView state={state} derived={derived} actions={actions} />;
}
