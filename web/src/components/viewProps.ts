import type {
  GenoraActions,
  GenoraDerived,
  GenoraDisplayState,
} from "@/lib/genora/useGenoraController";

export interface GenoraViewProps {
  state: GenoraDisplayState;
  derived: GenoraDerived;
  actions: GenoraActions;
}
