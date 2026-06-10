import type { Suggestion } from "../../models";

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ suggestions, onSelect, disabled }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
      <span className="w-full text-xs font-medium text-slate-500">Sugerencias:</span>
      {suggestions.map((chip) => (
        <button
          key={chip.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip.query)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-bank-navy hover:bg-slate-50 disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
