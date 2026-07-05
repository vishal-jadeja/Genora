"use client";

import { useGenora } from "@/components/GenoraProvider";
import { ComposeView } from "@/components/ComposeView";

export default function ComposePage() {
  const { state, derived, actions } = useGenora();
  return <ComposeView state={state} derived={derived} actions={actions} />;
}
