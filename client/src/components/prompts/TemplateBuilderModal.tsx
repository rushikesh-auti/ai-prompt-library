import { useMemo, useState } from "react";
import { FiCopy, FiSave, FiX } from "react-icons/fi";
import type { CreatePromptData, Prompt } from "../../types/prompt";
import {
  replaceVariables,
  validateVariableValues,
} from "../../utils/promptVariables";

interface TemplateBuilderModalProps {
  prompt: Prompt;
  onClose: () => void;
  onCopy: (content: string) => void;
  onSave: (data: CreatePromptData) => Promise<boolean>;
}

export default function TemplateBuilderModal({
  prompt,
  onClose,
  onCopy,
  onSave,
}: TemplateBuilderModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (prompt.variables || []).map((variable) => [
        variable.name,
        variable.defaultValue || "",
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const missing = validateVariableValues(prompt.variables || [], values);
  const generated = useMemo(
    () => replaceVariables(prompt.content, prompt.variables || [], values),
    [prompt.content, prompt.variables, values],
  );

  const saveGeneratedPrompt = async () => {
    if (missing.length || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await onSave({
        title: `Generated: ${prompt.title}`.slice(0, 100),
        content: generated,
        category: prompt.category,
        tags: prompt.tags,
        description: prompt.description,
        isTemplate: false,
        variables: [],
        provider: prompt.provider,
        model: prompt.model,
        temperature: prompt.temperature,
      });
      if (saved) onClose();
      else setSaveError("Could not save this generated prompt. Please try again.");
    } catch {
      setSaveError("Could not save this generated prompt. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-builder-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Template
            </p>
            <h2
              id="template-builder-title"
              className="mt-1 text-xl font-bold text-slate-900 dark:text-white"
            >
              {prompt.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close template builder"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <FiX size={19} />
          </button>
        </header>
        <div className="grid min-h-0 gap-6 overflow-y-auto p-5 md:grid-cols-2 sm:p-7">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Fill in the variables
            </h3>
            {(prompt.variables || []).length === 0 && (
              <p className="text-sm text-slate-500">
                This template has no required inputs. You can preview it as-is.
              </p>
            )}
            {(prompt.variables || []).map((variable) => (
              <label
                key={variable.name}
                htmlFor={`template-variable-${variable.name}`}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {variable.label || variable.name}
                {!variable.required && (
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                )}
                {variable.description && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {variable.description}
                  </span>
                )}
                <input
                  id={`template-variable-${variable.name}`}
                  value={values[variable.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [variable.name]: event.target.value,
                    }))
                  }
                  aria-invalid={missing.includes(variable.name)}
                  aria-describedby={
                    missing.includes(variable.name)
                      ? `template-variable-error-${variable.name}`
                      : undefined
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {missing.includes(variable.name) && (
                  <span
                    id={`template-variable-error-${variable.name}`}
                    className="mt-1 block text-xs text-red-600"
                    role="alert"
                  >
                    {variable.label || variable.name} is required.
                  </span>
                )}
              </label>
            ))}
          </div>
          <section aria-labelledby="template-preview-title">
            <h3
              id="template-preview-title"
              className="font-semibold text-slate-900 dark:text-white"
            >
              Generated prompt preview
            </h3>
            <pre className="mt-3 min-h-48 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200">
              {generated}
            </pre>
            {saveError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {saveError}
              </p>
            )}
          </section>
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
          <button
            type="button"
            onClick={() => onCopy(generated)}
            disabled={missing.length > 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
          >
            <FiCopy size={15} /> Copy
          </button>
          <button
            type="button"
            onClick={() => void saveGeneratedPrompt()}
            disabled={missing.length > 0 || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <FiSave size={15} /> {saving ? "Saving..." : "Save as new prompt"}
          </button>
        </footer>
      </section>
    </div>
  );
}
