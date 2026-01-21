import { type Accessor, createSignal, onCleanup } from "solid-js";
import { searchKdb } from "~/lib/db/kdb";
import type { Course } from "~/lib/types";

interface UseSuggestionSearchReturn {
  suggestions: Accessor<Course[]>;
  isLoading: Accessor<boolean>;
  query: Accessor<string>;
  search: (value: string) => void;
  resetQuery: () => void;
  clear: () => void;
}

export const useSuggestionSearch = (isFocused: Accessor<boolean>): UseSuggestionSearchReturn => {
  const [courseSuggestions, setCourseSuggestions] = createSignal<Course[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = createSignal(false);
  const [suggestionQuery, setSuggestionQuery] = createSignal("");
  let suggestionTimeout: number | null = null;
  let suggestionRequestId = 0;

  const resetSuggestionQuery = () => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    suggestionRequestId += 1;
    setIsSuggestionLoading(false);
    setSuggestionQuery("");
  };

  const clearSuggestions = () => {
    resetSuggestionQuery();
    setCourseSuggestions([]);
  };

  const requestSuggestions = (value: string) => {
    const normalizedValue = value.trim();
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    setSuggestionQuery(normalizedValue);
    if (normalizedValue.length < 2) {
      setCourseSuggestions([]);
      setIsSuggestionLoading(false);
      return;
    }
    const requestId = ++suggestionRequestId;
    suggestionTimeout = window.setTimeout(async () => {
      setIsSuggestionLoading(true);
      try {
        const found = await searchKdb(normalizedValue);
        if (requestId !== suggestionRequestId) return;
        if (!isFocused()) return;
        setCourseSuggestions(found);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (requestId === suggestionRequestId) {
          setIsSuggestionLoading(false);
        }
      }
    }, 250);
  };

  onCleanup(() => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }
    suggestionRequestId += 1;
  });

  return {
    suggestions: courseSuggestions,
    isLoading: isSuggestionLoading,
    query: suggestionQuery,
    search: requestSuggestions,
    resetQuery: resetSuggestionQuery,
    clear: clearSuggestions,
  };
};
