import PromptCard from "./PromptCard";

import type { Prompt } from "../../types/prompt";

interface PromptGridProps {
  prompts: Prompt[];
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onPin: (id: string) => void;
  onCopy: (content: string) => void;
}

export default function PromptGrid({
  prompts,
  onEdit,
  onDelete,
  onFavorite,
  onPin,
  onCopy,
}: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          No prompts found
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Try changing your search or filters, or create a new prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt._id}
          prompt={prompt}
          onEdit={onEdit}
          onDelete={onDelete}
          onFavorite={onFavorite}
          onPin={onPin}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}