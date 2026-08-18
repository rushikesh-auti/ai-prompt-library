import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiPlus, FiX } from "react-icons/fi";

import {
  CATEGORIES,
  type Category,
  type CreatePromptData,
  type Prompt,
} from "../../types/prompt";

interface PromptFormProps {
  prompt?: Prompt | null;
  loading?: boolean;
  onSubmit: (data: CreatePromptData) => void;
  onClose: () => void;
}

interface FormValues {
  title: string;
  content: string;
  category: Category;
  description: string;
  tagsInput: string;
}

export default function PromptForm({
  prompt,
  loading = false,
  onSubmit,
  onClose,
}: PromptFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      content: "",
      category: "Coding",
      description: "",
      tagsInput: "",
    },
  });

  const isEditing = Boolean(prompt);

  useEffect(() => {
    if (prompt) {
      reset({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        description: prompt.description,
        tagsInput: prompt.tags.join(", "),
      });
    } else {
      reset({
        title: "",
        content: "",
        category: "Coding",
        description: "",
        tagsInput: "",
      });
    }
  }, [prompt, reset]);

  const submitForm = (values: FormValues) => {
    const tags = values.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      description: values.description.trim(),
      tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
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

            {/* Prompt Content */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Prompt
              </label>

              <textarea
                id="content"
                rows={8}
                placeholder="Write your AI prompt here..."
                {...register("content", {
                  required: "Prompt content is required",
                  minLength: {
                    value: 10,
                    message:
                      "Prompt must be at least 10 characters",
                  },
                })}
                className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                  errors.content
                    ? "border-red-300 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700"
                }`}
              />

              {errors.content && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.content.message}
                </p>
              )}
            </div>

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
