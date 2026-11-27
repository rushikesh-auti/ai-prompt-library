import type { PromptVariable } from "../../types/prompt";

interface VariableConfigurationPanelProps {
  variables: PromptVariable[];
  onChange: (name: string, updates: Partial<PromptVariable>) => void;
}

export default function VariableConfigurationPanel({
  variables,
  onChange,
}: VariableConfigurationPanelProps) {
  if (variables.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Add placeholders such as {"{{topic}}"} to configure template inputs.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {variables.map((variable) => (
        <fieldset
          key={variable.name}
          className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {`{{${variable.name}}}`}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Label
              <input
                value={variable.label}
                onChange={(event) =>
                  onChange(variable.name, { label: event.target.value })
                }
                maxLength={80}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Default value
              <input
                value={variable.defaultValue}
                onChange={(event) =>
                  onChange(variable.name, { defaultValue: event.target.value })
                }
                maxLength={1000}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Description
            <textarea
              value={variable.description}
              onChange={(event) =>
                onChange(variable.name, { description: event.target.value })
              }
              maxLength={300}
              rows={2}
              className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={variable.required}
              onChange={(event) =>
                onChange(variable.name, { required: event.target.checked })
              }
              className="accent-violet-600"
            />
            Required
          </label>
        </fieldset>
      ))}
    </div>
  );
}
