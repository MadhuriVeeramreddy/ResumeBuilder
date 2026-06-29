"use client";

export type ThemeOption = {
  id: string;
  name: string;
  description: string;
  accent: string;
  fonts: { heading: string; body: string };
};

type ThemePickerProps = {
  themes: ThemeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function ThemePicker({ themes, selectedId, onSelect, disabled }: ThemePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">Theme</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {themes.map((theme) => {
          const selected = theme.id === selectedId;
          return (
            <button
              key={theme.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(theme.id)}
              className={`rounded-lg border p-3 text-left transition ${
                selected
                  ? "border-slate-900 ring-2 ring-slate-900 ring-offset-1"
                  : "border-slate-200 hover:border-slate-400"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <div className="mb-2 h-6 rounded" style={{ backgroundColor: theme.accent }} />
              <p className="text-sm font-semibold">{theme.name}</p>
              <p className="text-xs text-slate-500">
                {theme.fonts.heading} / {theme.fonts.body}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
