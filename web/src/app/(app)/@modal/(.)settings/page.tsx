"use client";

import { useFacet } from "@/components/facet/FacetProvider";
import { SettingsModal } from "@/components/facet/SettingsModal";

export default function InterceptedSettingsPage() {
  const { state, derived, actions } = useFacet();
  return <SettingsModal state={state} derived={derived} actions={actions} />;
}
