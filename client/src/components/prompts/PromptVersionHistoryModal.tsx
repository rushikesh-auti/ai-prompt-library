import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPromptVersion,
  getPromptVersions,
  restorePromptVersion as restoreVersionRequest,
} from "../../services/promptApi";
import type { Prompt, PromptVersion } from "../../types/prompt";
import { comparePromptContent } from "../../utils/promptVersionDiff";

interface PromptVersionHistoryModalProps {
  prompt: Prompt;
  onClose: () => void;
  onRestore: (prompt: Prompt) => Promise<void>;
}

const describeError = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load prompt history";

export default function PromptVersionHistoryModal({
  prompt,
  onClose,
  onRestore,
}: PromptVersionHistoryModalProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPromptVersions(prompt._id);
      setVersions(data);
      setSelectedVersion(data[0] ?? null);
      setBeforeId(data[1]?._id ?? data[0]?._id ?? "");
      setAfterId(data[0]?._id ?? "");
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setLoading(false);
    }
  }, [prompt._id]);

  useEffect(() => {
    let active = true;
    getPromptVersions(prompt._id)
      .then((data) => {
        if (!active) return;
        setVersions(data);
        setSelectedVersion(data[0] ?? null);
        setBeforeId(data[1]?._id ?? data[0]?._id ?? "");
        setAfterId(data[0]?._id ?? "");
      })
      .catch((loadError: unknown) => {
        if (active) setError(describeError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [prompt._id]);

  const before = versions.find((version) => version._id === beforeId);
  const after = versions.find((version) => version._id === afterId);
  const diff = useMemo(
    () =>
      before && after
        ? comparePromptContent(before.snapshot.content, after.snapshot.content)
        : [],
    [before, after],
  );

  const openVersion = async (versionId: string) => {
    try {
      setError(null);
      setSelectedVersion(await getPromptVersion(prompt._id, versionId));
    } catch (loadError) {
      setError(describeError(loadError));
    }
  };

  const restore = async () => {
    if (!selectedVersion || restoring) return;
    if (!window.confirm(`Restore version ${selectedVersion.version}? This creates a new version.`)) {
      return;
    }
    setRestoring(true);
    setError(null);
    try {
      const restored = await restoreVersionRequest(prompt._id, selectedVersion._id);
      await onRestore(restored);
      await loadVersions();
    } catch (restoreError) {
      setError(describeError(restoreError));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-history-title"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Version history
            </p>
            <h2
              id="prompt-history-title"
              className="mt-1 text-xl font-bold text-slate-900 dark:text-white"
            >
              {prompt.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close version history"
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          {loading ? (
            <div role="status" className="py-12 text-center text-sm text-slate-500">
              Loading version history…
            </div>
          ) : versions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                No saved versions yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                A baseline version is recorded the next time this prompt is edited.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(220px,.7fr)_minmax(0,1.3fr)]">
              <section aria-label="Saved versions" className="space-y-2">
                {versions.map((version) => (
                  <article
                    key={version._id}
                    className={`rounded-xl border p-3 ${
                      selectedVersion?._id === version._id
                        ? "border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void openVersion(version._id)}
                      className="w-full text-left"
                    >
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        Version {version.version}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        By {typeof version.author === "string" ? "You" : version.author.name}
                      </span>
                    </button>
                  </article>
                ))}
              </section>
              <div className="space-y-5">
                {selectedVersion && (
                  <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Version {selectedVersion.version}
                      </h3>
                      <button
                        type="button"
                        onClick={() => void restore()}
                        disabled={restoring}
                        className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {restoring ? "Restoring…" : "Restore this version"}
                      </button>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedVersion.snapshot.title}
                    </p>
                    <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                      {selectedVersion.snapshot.content}
                    </pre>
                  </section>
                )}
                <section>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Compare versions
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Older version
                      <select
                        value={beforeId}
                        onChange={(event) => setBeforeId(event.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {versions.map((version) => (
                          <option key={version._id} value={version._id}>
                            Version {version.version}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Newer version
                      <select
                        value={afterId}
                        onChange={(event) => setAfterId(event.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {versions.map((version) => (
                          <option key={version._id} value={version._id}>
                            Version {version.version}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {before && after ? (
                    <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-slate-200 p-3 font-mono text-xs leading-6 dark:border-slate-700">
                      {diff.map((line, index) => (
                        <div key={`${line.kind}-${index}`}>
                          {line.kind === "modified" ? (
                            <>
                              <p className="bg-red-50 px-2 text-red-800 dark:bg-red-950/40 dark:text-red-200">
                                − {line.before}
                              </p>
                              <p className="bg-emerald-50 px-2 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                                + {line.after}
                              </p>
                            </>
                          ) : (
                            <p
                              className={`px-2 ${
                                line.kind === "added"
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                                  : line.kind === "removed"
                                    ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                                    : "text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {line.kind === "added" ? "+ " : line.kind === "removed" ? "− " : "  "}
                              {line.after ?? line.before}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Select two versions to compare.
                    </p>
                  )}
                  {before && after && before._id !== after._id && (
                    <dl className="mt-4 space-y-2">
                      {[
                        ["Title", before.snapshot.title, after.snapshot.title],
                        ["Category", before.snapshot.category, after.snapshot.category],
                        ["Description", before.snapshot.description, after.snapshot.description],
                        ["Tags", before.snapshot.tags.join(", "), after.snapshot.tags.join(", ")],
                        ["Template", String(before.snapshot.isTemplate), String(after.snapshot.isTemplate)],
                        ["Variables", JSON.stringify(before.snapshot.variables), JSON.stringify(after.snapshot.variables)],
                        ["Provider / model", `${before.snapshot.provider ?? "—"} / ${before.snapshot.model || "—"}`, `${after.snapshot.provider ?? "—"} / ${after.snapshot.model || "—"}`],
                        ["Temperature", String(before.snapshot.temperature ?? "—"), String(after.snapshot.temperature ?? "—")],
                      ]
                        .filter(([, oldValue, newValue]) => oldValue !== newValue)
                        .map(([label, oldValue, newValue]) => (
                          <div key={label} className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950/50 sm:grid-cols-3">
                            <dt className="font-semibold text-slate-700 dark:text-slate-200">{label}</dt>
                            <dd className="break-words text-red-700 dark:text-red-300">{oldValue || "—"}</dd>
                            <dd className="break-words text-emerald-700 dark:text-emerald-300">{newValue || "—"}</dd>
                          </div>
                        ))}
                    </dl>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
