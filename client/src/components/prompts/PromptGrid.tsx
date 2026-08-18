import { useState } from "react";

import PromptCard from "./PromptCard";

import type { Prompt } from "../../types/prompt";

interface PromptGridProps {
  prompts: Prompt[];
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onPin: (id: string) => void;
  onCopy: (content: string) => void;
  onDuplicate: (prompt: Prompt) => void;
  onReorder?: (prompts: Prompt[]) => void;
}

export default function PromptGrid({
  prompts,
  onEdit,
  onDelete,
  onFavorite,
  onPin,
  onCopy,
  onDuplicate,
  onReorder,
}: PromptGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(
    null
  );

  const [dragOverId, setDragOverId] =
    useState<string | null>(null);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    id: string
  ) => {
    setDraggedId(id);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      id
    );
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    id: string
  ) => {
    event.preventDefault();

    if (id !== draggedId) {
      setDragOverId(id);
    }

    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: string
  ) => {
    event.preventDefault();

    const sourceId =
      event.dataTransfer.getData("text/plain");

    if (!sourceId || sourceId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const sourceIndex = prompts.findIndex(
      (prompt) => prompt._id === sourceId
    );

    const targetIndex = prompts.findIndex(
      (prompt) => prompt._id === targetId
    );

    if (
      sourceIndex === -1 ||
      targetIndex === -1
    ) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const reorderedPrompts = [...prompts];

    const [movedPrompt] =
      reorderedPrompts.splice(sourceIndex, 1);

    reorderedPrompts.splice(
      targetIndex,
      0,
      movedPrompt
    );

    onReorder?.(reorderedPrompts);

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  if (prompts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          No prompts found
        </h3>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Try changing your search or filters, or create a new prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {prompts.map((prompt) => {
        const isDragging =
          draggedId === prompt._id;

        const isDragOver =
          dragOverId === prompt._id;

        return (
          <div
            key={prompt._id}
            draggable
            onDragStart={(event) =>
              handleDragStart(
                event,
                prompt._id
              )
            }
            onDragOver={(event) =>
              handleDragOver(
                event,
                prompt._id
              )
            }
            onDrop={(event) =>
              handleDrop(
                event,
                prompt._id
              )
            }
            onDragEnd={handleDragEnd}
            className={`cursor-grab transition ${
              isDragging
                ? "scale-[0.98] opacity-50"
                : ""
            } ${
              isDragOver
                ? "rounded-2xl ring-2 ring-slate-400 ring-offset-2 dark:ring-slate-500 dark:ring-offset-slate-950"
                : ""
            }`}
          >
            <PromptCard
              prompt={prompt}
              onEdit={onEdit}
              onDelete={onDelete}
              onFavorite={onFavorite}
              onPin={onPin}
              onCopy={onCopy}
              onDuplicate={onDuplicate}
            />
          </div>
        );
      })}
    </div>
  );
}