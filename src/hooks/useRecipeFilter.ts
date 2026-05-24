"use client";
import { useReducer, useCallback } from "react";

export type ViewMode = "grid" | "list";
export type CategoryFilter =
  // Meal time
  | "breakfast" | "lunch" | "dinner" | "dessert" | "snack"
  // Type
  | "quick" | "soup" | "pasta" | "bake" | "salad" | "thermomix" | "freezable"
  // Diet
  | "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "high-protein"
  // My list
  | "want-to-cook" | "cooked";
export type SortOption = "none" | "rating" | "time" | "difficulty";

export interface FilterState {
  query: string;
  categories: CategoryFilter[];
  viewMode: ViewMode;
  sort: SortOption;
}

type Action =
  | { type: "SET_QUERY"; payload: string }
  | { type: "TOGGLE_CATEGORY"; payload: CategoryFilter }
  | { type: "CLEAR_CATEGORIES" }
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
    case "SET_VIEW_MODE": return { ...state, viewMode: action.payload };
    case "SET_SORT":     return { ...state, sort: action.payload };
    case "RESET":        return defaultState;
    default: return state;
  }
}

const defaultState: FilterState = {
  query: "",
  categories: [],
  viewMode: "grid",
  sort: "none",
};

export function useRecipeFilter(initial?: Partial<FilterState>) {
  const [state, dispatch] = useReducer(reducer, { ...defaultState, ...initial });
  const setQuery        = useCallback((q: string)         => dispatch({ type: "SET_QUERY", payload: q }), []);
  const toggleCategory  = useCallback((c: CategoryFilter) => dispatch({ type: "TOGGLE_CATEGORY", payload: c }), []);
  const clearCategories = useCallback(()                  => dispatch({ type: "CLEAR_CATEGORIES" }), []);
  const setViewMode     = useCallback((v: ViewMode)       => dispatch({ type: "SET_VIEW_MODE", payload: v }), []);
  const setSort         = useCallback((s: SortOption)     => dispatch({ type: "SET_SORT", payload: s }), []);
  const reset           = useCallback(()                  => dispatch({ type: "RESET" }), []);
  return { ...state, setQuery, toggleCategory, clearCategories, setViewMode, setSort, reset };
}
