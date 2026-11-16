import { FiCopy, FiEdit2, FiHeart, FiStar, FiX } from "react-icons/fi";
import type { Prompt } from "../../types/prompt";

interface PromptDetailModalProps {
  prompt: Prompt;
  onClose: () => void;
  onCopy: (content: string) => void;
  onDuplicate: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onFavorite: (id: string) => void;
  onPin: (id: string) => void;
}

export default function PromptDetailModal({
  prompt,
  onClose,
  onCopy,
  onDuplicate,
  onEdit,
  onFavorite,
  onPin,
}: PromptDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-detail-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-7">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                {prompt.category}
              </span>
              {prompt.isPinned && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Pinned
                </span>
              )}
            </div>
            <h2
              id="prompt-detail-title"
              className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl"
            >
              {prompt.title}
            </h2>
            {prompt.description && (
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {prompt.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close prompt details"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <FiX size={19} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:p-5">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">
              {prompt.content}
            </p>
          </div>
          {prompt.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <p className="mt-5 text-xs text-slate-400">
            Created{" "}
            {new Date(prompt.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCopy(prompt.content)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiCopy size={15} /> Copy
            </button>
            <button
              type="button"
              onClick={() => onFavorite(prompt._id)}
              aria-pressed={prompt.isFavorite}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiHeart size={15} />{" "}
              {prompt.isFavorite ? "Favorited" : "Favorite"}
            </button>
            <button
              type="button"
              onClick={() => onPin(prompt._id)}
              aria-pressed={prompt.isPinned}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FiStar size={15} /> {prompt.isPinned ? "Unpin" : "Pin"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDuplicate(prompt)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => onEdit(prompt)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <FiEdit2 size={15} /> Edit prompt
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
