"use client";

import { useEffect, useMemo, useState } from "react";
import { ProgressList, type ProgressItem } from "@/components/ProgressList";
import { TextField } from "@/components/TextField";
import { ThemePicker, type ThemeOption } from "@/components/ThemePicker";
import { REFERENCE_PROFILES } from "@/lib/fixtures/reference-profiles";
import type { Company, GenerationInput, ResumeModel } from "@/lib/schemas";
import { DEFAULT_THEME_ID } from "@/lib/themes/registry";

type CompanyRow = { name: string; country: string; startYear: string; endYear: string };

const STAGE_LABELS: Record<string, string> = {
  planning: "Planning domains",
  timeline: "Computing timeline",
  summary_skills: "Generating summary & skills",
  role_1: "Role 1",
  role_2: "Role 2",
  role_3: "Role 3",
  role_4: "Role 4",
  role_5: "Role 5",
  assembling: "Assembling document",
  ready: "Ready",
};

function defaultCompanies(): CompanyRow[] {
  return [
    { name: "", country: "USA", startYear: "", endYear: "" },
    { name: "", country: "USA", startYear: "", endYear: "" },
    { name: "", country: "USA", startYear: "", endYear: "" },
    { name: "", country: "India", startYear: "", endYear: "" },
  ];
}

function parseYear(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const year = Number(trimmed);
  return Number.isInteger(year) && year >= 1970 && year <= 2100 ? year : undefined;
}

function parseEndYear(value: string, isMostRecent: boolean): number | "present" | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return isMostRecent ? "present" : undefined;
  }
  if (trimmed === "present") return "present";
  const year = Number(trimmed);
  return Number.isInteger(year) && year >= 1970 && year <= 2100 ? year : undefined;
}

function buildProgressItems(companyNames: string[]): ProgressItem[] {
  const base: ProgressItem[] = [
    { id: "planning", label: STAGE_LABELS.planning, status: "pending" },
    { id: "timeline", label: STAGE_LABELS.timeline, status: "pending" },
    { id: "summary_skills", label: STAGE_LABELS.summary_skills, status: "pending" },
  ];

  companyNames.forEach((name, index) => {
    base.push({
      id: `role_${index + 1}`,
      label: name ? `Role ${index + 1} — ${name}` : STAGE_LABELS[`role_${index + 1}`],
      status: "pending",
    });
  });

  base.push(
    { id: "assembling", label: STAGE_LABELS.assembling, status: "pending" },
    { id: "ready", label: STAGE_LABELS.ready, status: "pending" },
  );

  return base;
}

function downloadBase64Docx(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function GeneratorScreen() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState("10");
  const [companies, setCompanies] = useState<CompanyRow[]>(defaultCompanies());
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedStage, setFailedStage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>(buildProgressItems([]));
  const [resume, setResume] = useState<ResumeModel | null>(null);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [lastDocxBase64, setLastDocxBase64] = useState<string | null>(null);
  const [cachedDocxThemeId, setCachedDocxThemeId] = useState<string | null>(null);
  const [assembledThemeId, setAssembledThemeId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(data.themes ?? []))
      .catch(() => undefined);
  }, []);

  const validationError = useMemo(() => {
    if (!name.trim()) return "Candidate name is required.";
    if (!role.trim()) return "Target role is required.";
    if (companies.some((c) => !c.name.trim())) return "All four companies are required.";
    const yearsNum = Number(years);
    if (!Number.isFinite(yearsNum) || yearsNum < 1) return "Years of experience must be a positive number.";

    const hasAnyYear = companies.some((c) => c.startYear.trim() || c.endYear.trim());
    if (!hasAnyYear) return null;

    for (let index = 0; index < companies.length; index++) {
      const company = companies[index];
      const isMostRecent = index === 0;
      const startYear = parseYear(company.startYear);
      const endYear = parseEndYear(company.endYear, isMostRecent);

      if (!company.startYear.trim()) {
        return `Start year is required for ${company.name.trim() || `company ${index + 1}`} when using explicit dates.`;
      }
      if (startYear == null) {
        return `Start year must be a valid year for ${company.name.trim() || `company ${index + 1}`}.`;
      }
      if (!isMostRecent && !company.endYear.trim()) {
        return `End year is required for ${company.name.trim() || `company ${index + 1}`}.`;
      }
      if (endYear == null) {
        return `End year must be a valid year or Present for ${company.name.trim() || `company ${index + 1}`}.`;
      }
      if (typeof endYear === "number" && endYear < startYear) {
        return `End year must be on or after start year for ${company.name.trim()}.`;
      }
    }

    return null;
  }, [name, role, companies, years]);

  function updateCompany(index: number, field: keyof CompanyRow, value: string) {
    setCompanies((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function loadReference(profileId: string) {
    const profile = REFERENCE_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;
    setName(profile.input.name);
    setRole(profile.input.role);
    setYears(String(profile.input.yearsExperience));
    setCompanies(
      profile.input.companies.map((c: Company) => ({
        name: c.name,
        country: c.country,
        startYear: c.startYear != null ? String(c.startYear) : "",
        endYear:
          c.endYear === "present"
            ? "Present"
            : c.endYear != null
              ? String(c.endYear)
              : "",
      })),
    );
    setThemeId(profile.input.themeId ?? DEFAULT_THEME_ID);
    setError(null);
    setFailedStage(null);
  }

  function buildInput(): GenerationInput {
    return {
      name: name.trim(),
      role: role.trim(),
      yearsExperience: Number(years),
      companies: companies.map((c, index) => {
        const row: Company = {
          name: c.name.trim(),
          country: c.country.trim() || "USA",
        };
        const startYear = parseYear(c.startYear);
        const endYear = parseEndYear(c.endYear, index === 0);
        if (startYear != null) row.startYear = startYear;
        if (endYear != null) row.endYear = endYear;
        return row;
      }),
      themeId,
    };
  }

  async function runGeneration() {
    if (validationError) {
      setError(validationError);
      return;
    }

    setGenerating(true);
    setError(null);
    setFailedStage(null);
    setResume(null);
    setLastFilename(null);
    setLastDocxBase64(null);
    setCachedDocxThemeId(null);
    setAssembledThemeId(null);
    setProgress(buildProgressItems(companies.map((c) => c.name.trim())));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildInput()),
      });

      if (!response.ok || !response.body) {
        throw new Error("Generation request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7);
            if (line.startsWith("data: ")) data = line.slice(6);
          }
          if (!data) continue;
          const payload = JSON.parse(data) as Record<string, unknown>;

          if (event === "progress") {
            const stage = String(payload.stage);
            const status = String(payload.status) as ProgressItem["status"];
            setProgress((prev) =>
              prev.map((item) =>
                item.id === stage
                  ? {
                      ...item,
                      status,
                      detail: payload.detail ? String(payload.detail) : item.detail,
                    }
                  : item,
              ),
            );
          }

          if (event === "error") {
            const stage = String(payload.stage);
            setFailedStage(stage);
            setError(String(payload.message ?? "Generation failed"));
            setProgress((prev) =>
              prev.map((item) =>
                item.id === stage ? { ...item, status: "error" } : item,
              ),
            );
          }

          if (event === "complete") {
            const model = payload.resume as ResumeModel;
            const filename = String(payload.filename);
            const docxBase64 = String(payload.docxBase64);
            const usedThemeId = String(payload.assembledThemeId ?? model.themeId);
            setResume(model);
            setLastFilename(filename);
            setLastDocxBase64(docxBase64);
            setCachedDocxThemeId(usedThemeId);
            setAssembledThemeId(usedThemeId);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadWithTheme(selectedThemeId: string) {
    if (!resume) return;

    if (lastDocxBase64 && selectedThemeId === cachedDocxThemeId) {
      downloadBase64Docx(lastDocxBase64, lastFilename ?? "resume.docx");
      return;
    }

    const response = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, themeId: selectedThemeId }),
    });

    if (!response.ok) {
      setError("Failed to render document");
      return;
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    setLastDocxBase64(base64);
    setCachedDocxThemeId(selectedThemeId);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = lastFilename ?? `${resume.name.replace(/\s+/g, "_")}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleThemeChange(nextThemeId: string) {
    setThemeId(nextThemeId);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ResumeForge</h1>
        <p className="mt-1 text-slate-600">Internal resume generator</p>
      </header>

      <section className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Load reference</span>
          {REFERENCE_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              disabled={generating}
              onClick={() => loadReference(profile.id)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:border-slate-400 disabled:opacity-50"
            >
              {profile.label}
            </button>
          ))}
        </div>

        <TextField label="Candidate name" value={name} onChange={setName} placeholder="Mamatha" />

        <TextField
          label="Target role / title"
          value={role}
          onChange={setRole}
          placeholder="Business Analyst"
        />

        <TextField label="Total years of experience" value={years} onChange={setYears} type="number" />

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Companies (most recent first; India last)
          </p>
          <p className="text-xs text-slate-500">
            Optional start/end years per role. Leave years blank to auto-compute from total experience.
          </p>
          <div className="grid grid-cols-6 gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span className="col-span-2">Company</span>
            <span>Country</span>
            <span>Start</span>
            <span>End</span>
          </div>
          {companies.map((company, index) => (
            <div key={index} className="grid grid-cols-6 gap-2">
              <input
                value={company.name}
                onChange={(e) => updateCompany(index, "name", e.target.value)}
                placeholder={`Company ${index + 1}`}
                className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={company.country}
                onChange={(e) => updateCompany(index, "country", e.target.value)}
                placeholder="Country"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={company.startYear}
                onChange={(e) => updateCompany(index, "startYear", e.target.value)}
                placeholder="2022"
                inputMode="numeric"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={company.endYear}
                onChange={(e) => updateCompany(index, "endYear", e.target.value)}
                placeholder={index === 0 ? "Present" : "2024"}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        {themes.length > 0 ? (
          <ThemePicker
            themes={themes}
            selectedId={themeId}
            onSelect={handleThemeChange}
            disabled={generating}
          />
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            disabled={generating}
            onClick={runGeneration}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate resume"}
          </button>

          {resume ? (
            <button
              type="button"
              onClick={() => downloadWithTheme(themeId)}
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Download .docx
            </button>
          ) : null}

          {error ? (
            <button
              type="button"
              disabled={generating}
              onClick={runGeneration}
              className="rounded-md border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Retry{failedStage ? ` (${STAGE_LABELS[failedStage] ?? failedStage})` : ""}
            </button>
          ) : null}
        </div>

        {validationError && !generating ? (
          <p className="text-sm text-amber-700">{validationError}</p>
        ) : null}
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </section>

      {generating || progress.some((p) => p.status !== "pending") ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{generating ? `Generating "${name || "resume"}"…` : "Generation status"}</h2>
          <ProgressList items={progress} />
        </section>
      ) : null}

      {resume && !generating ? (
        <p className="mt-4 text-sm text-emerald-700">
          Resume ready
          {assembledThemeId
            ? ` (generated with ${themes.find((t) => t.id === assembledThemeId)?.name ?? assembledThemeId})`
            : ""}
          . Switch theme and download again — no re-generation needed.
        </p>
      ) : null}
    </main>
  );
}
