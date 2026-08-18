import {
  FiCopy,
  FiEdit2,
  FiHeart,
  FiMoreVertical,
  FiStar,
  FiTrash2,
} from "react-icons/fi";

import type { Prompt } from "../../types/prompt";

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onPin: (id: string) => void;
  onCopy: (content: string) => void;
  onDuplicate: (prompt: Prompt) => void;
}

export default function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onFavorite,
  onPin,
  onCopy,
  onDuplicate,
}: PromptCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {prompt.category}
            </span>

            {prompt.isPinned && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Pinned
              </span>
            )}
          </div>

          <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">
            {prompt.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onDuplicate(prompt)}
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Duplicate prompt"
          title="Duplicate prompt"
        >
          <FiMoreVertical size={18} />
        </button>
      </div>

      {/* Description */}
      {prompt.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
          {prompt.description}
        </p>
      )}

      {/* Prompt preview */}
      <div className="mt-4 flex-1 rounded-xl bg-slate-50 p-4">
        <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {prompt.content}
        </p>
      </div>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onFavorite(prompt._id)}
            className={`rounded-lg p-2 transition ${
              prompt.isFavorite
                ? "bg-rose-50 text-rose-500"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
            aria-label="Toggle favorite"
          >
            <FiHeart
              size={17}
              fill={prompt.isFavorite ? "currentColor" : "none"}
            />
          </button>

          <button
            type="button"
            onClick={() => onPin(prompt._id)}
            className={`rounded-lg p-2 transition ${
              prompt.isPinned
                ? "bg-amber-50 text-amber-500"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
            aria-label="Toggle pin"
          >
            <FiStar
              size={17}
              fill={prompt.isPinned ? "currentColor" : "none"}
            />
          </button>

          <button
            type="button"
            onClick={() => onCopy(prompt.content)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Copy prompt"
          >
            <FiCopy size={17} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(prompt)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit prompt"
          >
            <FiEdit2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(prompt._id)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete prompt"
          >
            <FiTrash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}