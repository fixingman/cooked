"use client";
import { useReducer, useCallback } from "react";
import type { DietaryTag } from "@/types/recipe";

export type ViewMode = "grid" | "list";
export type CategoryFilter = "all" | "breakfast" | "lunch" | "dinner" | "dessert" | "snack" | "vegetarian" | "quick";

export interface FilterState {
  query: string;
  category: CategoryFilter;
  dietary: DietaryTag[];
  viewMode: ViewMode;
}

type Action =
  | { type: "SET_QUERY"; payload: string }
  | { type: "SET_CATEGORY"; payload: CategoryFilter }
  | { type: "TOGGLE_DIETARY"; payload: DietaryTag }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "RESET" };

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case "SET_QUERY":    return { ...state, query: action.payload };
    case "SET_CATEGORY": return { ...state, category: action.payload };
    case "TOGGLE_DIETARY": {
      const has = state.dietary.includes(action.payload);
      return { ...state, dietary: has ? state.dietary.filter((d) => d !== action.payload) : [...state.dietary, action.payload] };
    }
    case "SET_VIEW_MODE": return { ...state, viewMode: action.payload };
    case "RESET": return initialState;
    default: return state;
  }
}

const initialState: FilterState = {
  query: "",
  category: "all",
  dietary: [],
  viewMode: "grid",
};

export function useRecipeFilter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const setQuery    = useCallback((q: string)            => dispatch({ type: "SET_QUERY", payload: q }), []);
  const setCategory = useCallback((c: CategoryFilter)    => dispatch({ type: "SET_CATEGORY", payload: c }), []);
  const toggleDiet  = useCallback((d: DietaryTag)        => dispatch({ type: "TOGGLE_DIETARY", payload: d }), []);
  const setViewMode = useCallback((v: ViewMode)          => dispatch({ type: "SET_VIEW_MODE", payload: v }), []);
  const reset       = useCallback(()                     => dispatch({ type: "RESET" }), []);
  return { ...state, setQuery, setCategory, toggleDiet, setViewMode, reset };
}
