"use client";
import { useReducer, useCallback } from "react";
import type { DietaryTag } from "@/types/recipe";

export type ViewMode = "grid" | "list";
export type CategoryFilter = "breakfast" | "lunch" | "dinner" | "dessert" | "snack" | "vegetarian" | "quick" | "thermomix" | "want-to-cook" | "cooked";
export type SortOption = "none" | "rating" | "time" | "difficulty";

export interface FilterState {
  query: string;
  categories: CategoryFilter[];
  dietary: DietaryTag[];
  viewMode: ViewMode;
  sort: SortOption;
}

type Action =
  | { type: "SET_QUERY"; payload: string }
  | { type: "TOGGLE_CATEGORY"; payload: CategoryFilter }
  | { type: "CLEAR_CATEGORIES" }
  | { type: "TOGGLE_DIETARY"; payload: DietaryTag }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_SORT"; payload: SortOption }
  | { type: "RESET" };

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case "SET_QUERY": return { ...state, query: action.payload };
    case "TOGGLE_CATEGORY": {
      const has = state.categories.includes(action.payload);
      return { ...state, categories: has ? state.categories.filter((c) => c !== action.payload) : [...state.categories, action.payload] };
    }
    case "CLEAR_CATEGORIES": return { ...state, categories: [] };
    case "TOGGLE_DIETARY": {
      const has = state.dietary.includes(action.payload);
      return { ...state, dietary: has ? state.dietary.filter((d) => d !== action.payload) : [...state.dietary, action.payload] };
    }
    case "SET_VIEW_MODE": return { ...state, viewMode: action.payload };
    case "SET_SORT":     return { ...state, sort: action.payload };
    case "RESET":        return defaultState;
    default: return state;
  }
}

const defaultState: FilterState = {
  query: "",
  categories: [],
  dietary: [],
  viewMode: "grid",
  sort: "none",
};

export function useRecipeFilter(initial?: Partial<FilterState>) {
  const [state, dispatch] = useReducer(reducer, { ...defaultState, ...initial });
  const setQuery        = useCallback((q: string)          => dispatch({ type: "SET_QUERY", payload: q }), []);
  const toggleCategory  = useCallback((c: CategoryFilter)  => dispatch({ type: "TOGGLE_CATEGORY", payload: c }), []);
  const clearCategories = useCallback(()                   => dispatch({ type: "CLEAR_CATEGORIES" }), []);
  const toggleDiet      = useCallback((d: DietaryTag)      => dispatch({ type: "TOGGLE_DIETARY", payload: d }), []);
  const setViewMode     = useCallback((v: ViewMode)        => dispatch({ type: "SET_VIEW_MODE", payload: v }), []);
  const setSort         = useCallback((s: SortOption)      => dispatch({ type: "SET_SORT", payload: s }), []);
  const reset           = useCallback(()                   => dispatch({ type: "RESET" }), []);
  return { ...state, setQuery, toggleCategory, clearCategories, toggleDiet, setViewMode, setSort, reset };
}
