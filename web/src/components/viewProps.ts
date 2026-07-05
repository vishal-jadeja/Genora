import type { GenoraState } from "@/lib/genora/types";
import type {
  GenoraActions,
  GenoraDerived,
} from "@/lib/genora/useGenoraController";

export interface GenoraViewProps {
  state: GenoraState;
  derived: GenoraDerived;
  actions: GenoraActions;
}
