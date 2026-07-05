"use client";

import { useFacet } from "@/components/facet/FacetProvider";
import { ComposeView } from "@/components/facet/ComposeView";

export default function ComposePage() {
  const { state, derived, actions } = useFacet();
  return <ComposeView state={state} derived={derived} actions={actions} />;
}
