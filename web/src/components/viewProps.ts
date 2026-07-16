import type {
  GenoraActions,
  GenoraDerived,
  GenoraDisplayState,
  GenoraLoading,
} from "@/lib/genora/useGenoraController";

export interface GenoraViewProps {
  state: GenoraDisplayState;
  derived: GenoraDerived;
  loading: GenoraLoading;
  actions: GenoraActions;
}
