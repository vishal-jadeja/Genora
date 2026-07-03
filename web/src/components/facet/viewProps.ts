import type { FacetState } from "@/lib/facet/types";
import type {
  FacetActions,
  FacetDerived,
} from "@/lib/facet/useFacetController";

export interface FacetViewProps {
  state: FacetState;
  derived: FacetDerived;
  actions: FacetActions;
}
