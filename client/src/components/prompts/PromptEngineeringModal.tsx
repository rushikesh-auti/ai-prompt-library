import { useEffect, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import {
  createPromptEvaluation,
  deletePromptTestCase,
  getPromptEvaluations,
  getPromptTestCases,
  runPromptTestCase,
  savePromptTestCase,
  updatePrompt,
  updatePromptEvaluationCriteria,
} from "../../services/promptApi";
import type {
  EvaluationCriterion,
  Prompt,
  PromptEvaluation,
  PromptTestCase,
  PromptTestRun,
} from "../../types/prompt";
import { replaceVariables, validateVariableValues } from "../../utils/promptVariables";
import { getPromptSuggestions } from "../../utils/promptSuggestions";
import { comparePromptContent } from "../../utils/promptVersionDiff";

type EngineeringTab = "optimize" | "test" | "evaluate";

interface PromptEngineeringModalProps {
  prompt: Prompt;
  onClose: () => void;
  onPromptUpdated: (prompt: Prompt) => void;
}

const requestError = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data
  ) {
    return String(error.response.data.message);
  }
  return error instanceof Error ? error.message : fallback;
};

const panelClass =
  "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const primaryButtonClass =
  "rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50";

function OptimizationPanel({
  prompt,
  onPromptUpdated,
}: Pick<PromptEngineeringModalProps, "prompt" | "onPromptUpdated">) {
  const [improved, setImproved] = useState(prompt.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const suggestions = useMemo(() => getPromptSuggestions(prompt.content), [prompt.content]);
  const diff = useMemo(
    () => comparePromptContent(prompt.content, improved),
    [prompt.content, improved],
  );

  const saveImproved = async () => {
    if (improved.trim().length < 10 || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updatePrompt(prompt._id, {
        content: improved.trim(),
        structuredPrompt: null,
      });
      onPromptUpdated(updated);
      setSaved(true);
    } catch (saveError) {
      setError(requestError(saveError, "Unable to save the improved prompt"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Suggestions are rule-based. Edit the prompt yourself; no external AI service is used.
      </p>
      <section className={panelClass}>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Improvement suggestions
        </h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {suggestions.map(({ category, suggestion }) => (
            <li
              key={category}
              className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                {category}
              </span>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {suggestion}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className={panelClass}>
        <label
          htmlFor="improved-prompt"
          className="font-semibold text-slate-900 dark:text-white"
        >
          Improved prompt
        </label>
        <textarea
          id="improved-prompt"
          value={improved}
          onChange={(event) => {
            setImproved(event.target.value);
            setSaved(false);
          }}
          rows={9}
          maxLength={10000}
          className={`${inputClass} resize-y leading-6`}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {improved.length}/10,000 characters
          </span>
          <button
            type="button"
            onClick={() => void saveImproved()}
            disabled={saving || improved.trim().length < 10 || improved.trim() === prompt.content}
            className={primaryButtonClass}
          >
            {saving ? "Saving version…" : "Save improved version"}
          </button>
        </div>
        {saved && (
          <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
            Saved as a new prompt version.
          </p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
      <section className={panelClass}>
        <h3 className="font-semibold text-slate-900 dark:text-white">Original and improved comparison</h3>
        {improved === prompt.content ? (
          <p className="mt-2 text-sm text-slate-500">Make an edit above to compare versions.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[
              { label: "Original", content: prompt.content },
              { label: "Improved", content: improved },
            ].map(({ label, content }) => (
              <div key={label}>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h4>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {content}
                </pre>
              </div>
            ))}
          </div>
        )}
        {diff.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {diff.filter((line) => line.kind !== "unchanged").length} changed lines
          </p>
        )}
      </section>
    </div>
  );
}

function TestingPanel({ prompt }: { prompt: Prompt }) {
  const variables = useMemo(() => prompt.variables || [], [prompt.variables]);
  const [cases, setCases] = useState<PromptTestCase[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<PromptTestRun | null>(null);
  const missing = validateVariableValues(variables, values);
  const preview = useMemo(
    () => replaceVariables(prompt.content, variables, values),
    [prompt.content, variables, values],
  );

  useEffect(() => {
    let active = true;
    getPromptTestCases(prompt._id)
      .then((data) => {
        if (!active) return;
        setCases(data);
        const first = data[0];
        if (first) {
          setSelectedId(first._id);
          setName(first.name);
          setValues(first.variableValues);
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(requestError(loadError, "Unable to load test cases"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [prompt._id]);

  const selectCase = (testCase: PromptTestCase) => {
    setSelectedId(testCase._id);
    setName(testCase.name);
    setValues(testCase.variableValues);
    setLatestRun(testCase.runs[testCase.runs.length - 1] ?? null);
    setNotice(null);
    setError(null);
  };

  const newCase = () => {
    setSelectedId("");
    setName("");
    setValues(Object.fromEntries(variables.map((variable) => [
      variable.name,
      variable.defaultValue || "",
    ])));
    setLatestRun(null);
    setNotice(null);
    setError(null);
  };

  const save = async (): Promise<PromptTestCase | null> => {
    if (!name.trim() || missing.length || saving) return null;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const savedCase = await savePromptTestCase(
        prompt._id,
        { name: name.trim(), variableValues: values },
        selectedId || undefined,
      );
      setCases((current) => [
        savedCase,
        ...current.filter((item) => item._id !== savedCase._id),
      ]);
      setSelectedId(savedCase._id);
      setNotice("Test case saved.");
      return savedCase;
    } catch (saveError) {
      setError(requestError(saveError, "Unable to save test case"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const run = async () => {
    const savedCase = await save();
    if (!savedCase) return;
    setSaving(true);
    setError(null);
    try {
      const result = await runPromptTestCase(prompt._id, savedCase._id);
      setCases((current) => current.map((item) =>
        item._id === result.testCase._id ? result.testCase : item,
      ));
      setLatestRun(result.run);
      setNotice("Resolved prompt preview recorded. No model was executed.");
    } catch (runError) {
      setError(requestError(runError, "Unable to create test preview"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await deletePromptTestCase(prompt._id, selectedId);
      setCases((current) => current.filter((item) => item._id !== selectedId));
      newCase();
      setNotice("Test case deleted.");
    } catch (deleteError) {
      setError(requestError(deleteError, "Unable to delete test case"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p role="status" className="py-10 text-center text-sm text-slate-500">Loading test cases…</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(240px,.7fr)_minmax(0,1.3fr)]">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Saved test cases</h3>
          <button type="button" onClick={newCase} className="text-sm font-semibold text-violet-700 dark:text-violet-300">New</button>
        </div>
        {cases.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
            No test cases yet. Save different inputs to reuse them.
          </p>
        ) : (
          <ul className="space-y-2">
            {cases.map((testCase) => (
              <li key={testCase._id}>
                <button
                  type="button"
                  onClick={() => selectCase(testCase)}
                  aria-pressed={testCase._id === selectedId}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    testCase._id === selectedId
                      ? "border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{testCase.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{testCase.runs.length} preview runs</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedId && (
          <button type="button" onClick={() => void remove()} disabled={saving} className="text-sm text-red-600 disabled:opacity-50">
            Delete selected case
          </button>
        )}
      </section>
      <section className="space-y-4">
        <div className={panelClass}>
          <label htmlFor="test-case-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Test case name
            <input id="test-case-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} className={inputClass} />
          </label>
          {variables.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">This prompt has no configured variables.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {variables.map((variable) => (
                <label key={variable.name} htmlFor={`test-${variable.name}`} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {variable.label || variable.name}{variable.required ? " *" : ""}
                  <input
                    id={`test-${variable.name}`}
                    value={values[variable.name] ?? ""}
                    onChange={(event) => setValues((current) => ({ ...current, [variable.name]: event.target.value }))}
                    className={inputClass}
                  />
                  {missing.includes(variable.name) && (
                    <span className="mt-1 block text-xs text-red-600">{variable.label || variable.name} is required.</span>
                  )}
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} disabled={saving || !name.trim() || missing.length > 0} className={primaryButtonClass}>
              {saving ? "Saving…" : "Save test case"}
            </button>
            <button type="button" onClick={() => void run()} disabled={saving || !name.trim() || missing.length > 0} className={primaryButtonClass}>
              Generate preview
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Preview only; this does not call an AI model.</p>
        </div>
        <section>
          <h3 className="font-semibold text-slate-900 dark:text-white">Resolved prompt preview</h3>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
            {preview}
          </pre>
        </section>
        {latestRun && (
          <section className={panelClass}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Latest result · version {latestRun.version}</h3>
            <p className="mt-1 text-xs text-slate-500">{new Date(latestRun.createdAt).toLocaleString()}</p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">{latestRun.resolvedPrompt}</pre>
          </section>
        )}
        {selectedId && cases.find((item) => item._id === selectedId)?.runs.length ? (
          <section className={panelClass}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Test history</h3>
            <ul className="mt-2 space-y-2">
              {[...(cases.find((item) => item._id === selectedId)?.runs ?? [])].reverse().map((runItem) => (
                <li key={runItem._id ?? runItem.createdAt} className="text-xs text-slate-500">
                  Version {runItem.version} · {new Date(runItem.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}

const defaultCriteria: EvaluationCriterion[] = [
  { name: "Clarity", description: "Is the task and its instructions unambiguous?" },
  { name: "Specificity", description: "Does the prompt define scope and success conditions?" },
  { name: "Context", description: "Does it provide the background and audience needed?" },
  { name: "Output format", description: "Does it specify the structure of the response?" },
];

function EvaluationPanel({
  prompt,
  onPromptUpdated,
}: Pick<PromptEngineeringModalProps, "prompt" | "onPromptUpdated">) {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>(
    prompt.evaluationCriteria?.length ? prompt.evaluationCriteria : defaultCriteria,
  );
  const [history, setHistory] = useState<PromptEvaluation[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPromptEvaluations(prompt._id)
      .then((result) => {
        if (!active) return;
        setCriteria(result.criteria.length ? result.criteria : defaultCriteria);
        setHistory(result.history);
      })
      .catch((loadError: unknown) => {
        if (active) setError(requestError(loadError, "Unable to load evaluation history"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [prompt._id]);

  const summaryScore = history.length
    ? (history.reduce((sum, item) => sum + item.overallScore, 0) / history.length).toFixed(2)
    : null;

  const persistCriteria = async () => {
    if (criteria.some(({ name }) => !name.trim()) || saving) return null;
    setSaving(true);
    setError(null);
    try {
      const saved = await updatePromptEvaluationCriteria(prompt._id, criteria);
      onPromptUpdated(saved.prompt);
      setCriteria(saved.criteria);
      return saved.criteria;
    } catch (saveError) {
      setError(requestError(saveError, "Unable to save evaluation criteria"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveEvaluation = async () => {
    setError(null);
    setNotice(null);
    const persistedCriteria = await persistCriteria();
    if (!persistedCriteria?.length) return;
    setSaving(true);
    try {
      const evaluation = await createPromptEvaluation(prompt._id, {
        scores: persistedCriteria.map(({ name }) => ({
          criterion: name,
          score: scores[name] || 3,
        })),
        feedback,
        notes,
      });
      setHistory((current) => [evaluation, ...current]);
      setNotice("Evaluation saved.");
    } catch (saveError) {
      setError(requestError(saveError, "Unable to save evaluation"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p role="status" className="py-10 text-center text-sm text-slate-500">Loading evaluations…</p>;
  }

  return (
    <div className="space-y-5">
      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Evaluation criteria</h3>
            <p className="mt-1 text-xs text-slate-500">Criteria are saved with the prompt and versioned.</p>
          </div>
          <button type="button" onClick={() => setCriteria((current) => current.length >= 10 ? current : [...current, { name: "", description: "" }])} disabled={criteria.length >= 10} className="text-sm font-semibold text-violet-700 disabled:opacity-50 dark:text-violet-300">Add criterion</button>
        </div>
        <div className="mt-4 space-y-3">
          {criteria.map((criterion, index) => (
            <div key={`${criterion.name}-${index}`} className="grid gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800 sm:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto]">
              <input aria-label={`Criterion ${index + 1} name`} value={criterion.name} maxLength={100} onChange={(event) => setCriteria((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Criterion name" className={inputClass} />
              <input aria-label={`Criterion ${index + 1} description`} value={criterion.description} maxLength={300} onChange={(event) => setCriteria((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} placeholder="What are you rating?" className={inputClass} />
              <button type="button" onClick={() => setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove criterion ${index + 1}`} className="px-2 text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => void persistCriteria()} disabled={saving || criteria.some(({ name }) => !name.trim())} className={`${primaryButtonClass} mt-4`}>
          {saving ? "Saving…" : "Save criteria"}
        </button>
      </section>
      {criteria.length > 0 && (
        <section className={panelClass}>
          <h3 className="font-semibold text-slate-900 dark:text-white">Rate this prompt</h3>
          <div className="mt-3 space-y-3">
            {criteria.map(({ name, description }) => (
              <label key={name} className="grid gap-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="text-slate-700 dark:text-slate-200">
                  <span className="font-medium">{name}</span>
                  {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
                </span>
                <select aria-label={`Rating for ${name}`} value={scores[name] ?? 3} onChange={(event) => setScores((current) => ({ ...current, [name]: Number(event.target.value) }))} className={inputClass}>
                  {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5</option>)}
                </select>
              </label>
            ))}
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Feedback
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={2000} rows={3} className={`${inputClass} resize-y`} />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={3} className={`${inputClass} resize-y`} />
          </label>
          <button type="button" onClick={() => void saveEvaluation()} disabled={saving} className={`${primaryButtonClass} mt-4`}>
            {saving ? "Saving…" : "Save evaluation"}
          </button>
        </section>
      )}
      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">Evaluation history</h3>
          {summaryScore && <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Average rating: {summaryScore} / 5</span>}
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No evaluations saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((item) => (
              <li key={item._id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <strong className="text-slate-800 dark:text-slate-200">Version {item.version} · {item.overallScore} / 5</strong>
                  <time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.scores.map((score) => <span key={score.criterion} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">{score.criterion}: {score.score}/5</span>)}
                </div>
                {item.feedback && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.feedback}</p>}
                {item.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{item.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function PromptEngineeringModal({
  prompt,
  onClose,
  onPromptUpdated,
}: PromptEngineeringModalProps) {
  const [tab, setTab] = useState<EngineeringTab>("optimize");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-engineering-title"
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Prompt engineering workspace</p>
            <h2 id="prompt-engineering-title" className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{prompt.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close prompt engineering workspace" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <FiX size={20} />
          </button>
        </header>
        <nav aria-label="Prompt engineering tools" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-7">
          {([
            ["optimize", "Improve"],
            ["test", "Test cases"],
            ["evaluate", "Evaluate"],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
              {label}
            </button>
          ))}
        </nav>
        <main className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {tab === "optimize" && <OptimizationPanel prompt={prompt} onPromptUpdated={onPromptUpdated} />}
          {tab === "test" && <TestingPanel key={`${prompt._id}-test`} prompt={prompt} />}
          {tab === "evaluate" && <EvaluationPanel key={`${prompt._id}-evaluate`} prompt={prompt} onPromptUpdated={onPromptUpdated} />}
        </main>
      </section>
    </div>
  );
}
