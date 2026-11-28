import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FiPlus, FiX } from "react-icons/fi";

import {
  CATEGORIES,
  type Category,
  type CreatePromptData,
  type Prompt,
  type PromptVariable,
  type AIProvider,
  type StructuredPrompt,
} from "../../types/prompt";
import VariableConfigurationPanel from "./VariableConfigurationPanel";
import {
  createVariableDefinition,
  detectVariables,
} from "../../utils/promptVariables";

interface PromptFormProps {
  prompt?: Prompt | null;
  loading?: boolean;
  onSubmit: (data: CreatePromptData) => void;
  onClose: () => void;
}

const structuredFields: Array<{
  key: keyof StructuredPrompt;
  label: string;
  rows: number;
}> = [
  { key: "role", label: "Role", rows: 2 },
  { key: "context", label: "Context", rows: 3 },
  { key: "task", label: "Task", rows: 3 },
  { key: "instructions", label: "Instructions", rows: 4 },
  { key: "outputFormat", label: "Output format", rows: 3 },
  { key: "constraints", label: "Constraints", rows: 3 },
];

const composeStructuredPrompt = (fields: StructuredPrompt) =>
  structuredFields
    .map(({ key, label }) => ({ label, value: fields[key].trim() }))
    .filter(({ value }) => value)
    .map(({ label, value }) => `${label}:\n${value}`)
    .join("\n\n");

interface FormValues {
  title: string;
  content: string;
  category: Category;
  description: string;
  tagsInput: string;
  isTemplate: boolean;
  provider: AIProvider | "";
  model: string;
  temperature: string;
  role: string;
  context: string;
  task: string;
  instructions: string;
  outputFormat: string;
  constraints: string;
}

export default function PromptForm({
  prompt,
  loading = false,
  onSubmit,
  onClose,
}: PromptFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      content: "",
      category: "Coding",
      description: "",
      tagsInput: "",
      isTemplate: false,
      provider: "",
      model: "",
      temperature: "",
      role: "",
      context: "",
      task: "",
      instructions: "",
      outputFormat: "",
      constraints: "",
    },
  });
  const [variableOverrides, setVariableOverrides] = useState<
    Record<string, Partial<PromptVariable>>
  >({});
  const [structuredMode, setStructuredMode] = useState(
    Boolean(prompt?.structuredPrompt),
  );
  const contentValue = useWatch({ control, name: "content" });
  const role = useWatch({ control, name: "role" });
  const context = useWatch({ control, name: "context" });
  const task = useWatch({ control, name: "task" });
  const instructions = useWatch({ control, name: "instructions" });
  const outputFormat = useWatch({ control, name: "outputFormat" });
  const constraints = useWatch({ control, name: "constraints" });
  const isTemplateValue = useWatch({ control, name: "isTemplate" });
  const structuredPrompt: StructuredPrompt = {
    role: role || "",
    context: context || "",
    task: task || "",
    instructions: instructions || "",
    outputFormat: outputFormat || "",
    constraints: constraints || "",
  };
  const livePrompt = structuredMode
    ? composeStructuredPrompt(structuredPrompt)
    : contentValue || "";
  const savedVariables = new Map(
    (prompt?.variables || []).map((variable) => [variable.name, variable]),
  );
  const variables = detectVariables(livePrompt).map((name) => ({
    ...(savedVariables.get(name) ?? createVariableDefinition(name)),
    ...variableOverrides[name],
    name,
  }));

  const isEditing = Boolean(prompt);

  useEffect(() => {
    if (prompt) {
      reset({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        description: prompt.description,
        tagsInput: prompt.tags.join(", "),
        isTemplate: prompt.isTemplate ?? false,
        provider: prompt.provider ?? "",
        model: prompt.model ?? "",
        temperature: prompt.temperature === null || prompt.temperature === undefined
          ? ""
          : String(prompt.temperature),
        role: prompt.structuredPrompt?.role ?? "",
        context: prompt.structuredPrompt?.context ?? "",
        task: prompt.structuredPrompt?.task ?? "",
        instructions: prompt.structuredPrompt?.instructions ?? "",
        outputFormat: prompt.structuredPrompt?.outputFormat ?? "",
        constraints: prompt.structuredPrompt?.constraints ?? "",
      });
    } else {
      reset({
        title: "",
        content: "",
        category: "Coding",
        description: "",
        tagsInput: "",
        isTemplate: false,
        provider: "",
        model: "",
        temperature: "",
        role: "",
        context: "",
        task: "",
        instructions: "",
        outputFormat: "",
        constraints: "",
      });
    }
  }, [prompt, reset]);

  const submitForm = (values: FormValues) => {
    const promptContent = structuredMode
      ? composeStructuredPrompt({
          role: values.role,
          context: values.context,
          task: values.task,
          instructions: values.instructions,
          outputFormat: values.outputFormat,
          constraints: values.constraints,
        })
      : values.content.trim();
    if (promptContent.trim().length < 10) {
      setError(structuredMode ? "task" : "content", {
        type: "validate",
        message: "Prompt content must be at least 10 characters",
      });
      return;
    }
    const tags = values.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      title: values.title.trim(),
      content: promptContent,
      category: values.category,
      description: values.description.trim(),
      tags,
      isTemplate: values.isTemplate,
      variables: values.isTemplate ? variables : [],
      provider: values.provider || null,
      model: values.model.trim(),
      temperature: values.temperature.trim() === ""
        ? null
        : Number(values.temperature),
      structuredPrompt: structuredMode
        ? {
            role: values.role.trim(),
            context: values.context.trim(),
            task: values.task.trim(),
            instructions: values.instructions.trim(),
            outputFormat: values.outputFormat.trim(),
            constraints: values.constraints.trim(),
          }
        : null,
    });
  };

  const toggleStructuredMode = () => {
    if (!structuredMode) {
      setValue("instructions", contentValue || "");
    } else {
      setValue("content", livePrompt);
    }
    setStructuredMode((current) => !current);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="prompt-form-title" className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2 id="prompt-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? "Edit Prompt" : "Create Prompt"}
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? "Update your prompt details."
                  : "Add a new prompt to your library."}
              </p>
            </div>

            <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(submitForm)}
          className="overflow-y-auto"
        >
          <div className="space-y-5 p-5 sm:p-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Title
              </label>

              <input
                id="title"
                type="text"
                placeholder="e.g. React code reviewer"
                {...register("title", {
                  required: "Title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be at least 3 characters",
                  },
                })}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                  errors.title
                    ? "border-red-300 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
                }`}
              />

              {errors.title && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Category
              </label>

              <select
                id="category"
                {...register("category", {
                  required: "Category is required",
                })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Description
              </label>

              <input
                id="description"
                type="text"
                placeholder="Short description of this prompt"
                {...register("description")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Prompt content
              </label>
              <button
                type="button"
                onClick={toggleStructuredMode}
                className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/40"
              >
                {structuredMode ? "Use plain prompt" : "Use structured builder"}
              </button>
            </div>
            {structuredMode ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {structuredFields.map(({ key, label, rows }) => (
                    <label
                      key={key}
                      htmlFor={`structured-${key}`}
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {label}{key === "task" ? " *" : ""}
                      <textarea
                        id={`structured-${key}`}
                        rows={rows}
                        placeholder={`Describe the prompt ${label.toLowerCase()}...`}
                        {...register(key, key === "task" ? {
                          required: "Task is required",
                          minLength: { value: 10, message: "Task must be at least 10 characters" },
                        } : {})}
                        className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      {errors[key] && (
                        <span className="mt-1 block text-xs text-red-600">
                          {errors[key]?.message}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <section aria-label="Live prompt preview">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Live prompt preview
                  </h3>
                  <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                    {livePrompt || "Your structured prompt preview will appear here."}
                  </pre>
                </section>
              </div>
            ) : (
              <div>
                <textarea
                  id="content"
                  rows={8}
                  placeholder="Write your AI prompt here..."
                  {...register("content", {
                    required: "Prompt content is required",
                    minLength: { value: 10, message: "Prompt must be at least 10 characters" },
                  })}
                  className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                    errors.content
                      ? "border-red-300 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
                  }`}
                />
                {errors.content && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.content.message}</p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  {...register("isTemplate")}
                  className="accent-violet-600"
                />
                Save as reusable template
              </label>
              {isTemplateValue && (
                <div className="mt-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Configure variables
                  </h3>
                  <VariableConfigurationPanel
                    variables={variables}
                    onChange={(name, updates) =>
                      setVariableOverrides((current) => ({
                        ...current,
                        [name]: { ...current[name], ...updates },
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                AI metadata <span className="font-normal text-slate-400">(optional)</span>
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Provider
                  <select
                    {...register("provider")}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Not specified</option>
                    <option value="openai">OpenAI</option>
                    <option value="google-gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Model
                  <input
                    {...register("model")}
                    maxLength={100}
                    placeholder="e.g. model name"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Temperature
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    {...register("temperature", {
                      validate: (value) =>
                        value === "" ||
                        (Number.isFinite(Number(value)) &&
                          Number(value) >= 0 &&
                          Number(value) <= 2) ||
                        "Temperature must be between 0 and 2",
                    })}
                    placeholder="0-2"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {errors.temperature && (
                    <span className="mt-1 block text-xs text-red-600">
                      {errors.temperature.message}
                    </span>
                  )}
                </label>
              </div>
            </fieldset>

            {/* Tags */}
            <div>
              <label
                htmlFor="tagsInput"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Tags
              </label>

              <input
                id="tagsInput"
                type="text"
                placeholder="react, javascript, coding"
                {...register("tagsInput")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-700"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Separate tags with commas.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!isEditing && <FiPlus size={17} />}

              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Prompt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
