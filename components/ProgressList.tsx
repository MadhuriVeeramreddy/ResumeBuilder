"use client";

export type ProgressItem = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
};

type ProgressListProps = {
  items: ProgressItem[];
};

function statusIcon(status: ProgressItem["status"]) {
  switch (status) {
    case "done":
      return "✓";
    case "running":
      return "◐";
    case "error":
      return "✕";
    default:
      return "·";
  }
}

export function ProgressList({ items }: ProgressListProps) {
  return (
    <ul className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <span
            className={`mt-0.5 w-4 shrink-0 ${
              item.status === "done"
                ? "text-emerald-600"
                : item.status === "running"
                  ? "text-blue-600"
                  : item.status === "error"
                    ? "text-red-600"
                    : "text-slate-400"
            }`}
          >
            {statusIcon(item.status)}
          </span>
          <div>
            <p className="font-medium text-slate-800">{item.label}</p>
            {item.detail ? <p className="text-xs text-slate-500">{item.detail}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
