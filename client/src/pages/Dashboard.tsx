import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import DashboardLayout from "../components/layout/DashboardLayout";
import PromptForm from "../components/prompts/PromptForm";
import PromptGrid from "../components/prompts/PromptGrid";

import {
  addPrompt,
  editPrompt,
  fetchPrompts,
  removePrompt,
  toggleFavorite,
  togglePinned,
} from "../features/prompts/promptSlice";

import {
  useAppDispatch,
  useAppSelector,
} from "../store/hooks";

import type {
  CreatePromptData,
  Prompt,
} from "../types/prompt";

export default function Dashboard() {
  const dispatch = useAppDispatch();

  const { prompts, loading, error } = useAppSelector(
    (state) => state.prompts
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] =
    useState<Prompt | null>(null);

  useEffect(() => {
    dispatch(fetchPrompts());
  }, [dispatch]);

  const handleAddPrompt = () => {
    setEditingPrompt(null);
    setFormOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (loading) return;

    setFormOpen(false);
    setEditingPrompt(null);
  };

  const handleSubmit = async (data: CreatePromptData) => {
    try {
      if (editingPrompt) {
        await dispatch(
          editPrompt({
            id: editingPrompt._id,
            data,
          })
        ).unwrap();

        toast.success("Prompt updated successfully");
      } else {
        await dispatch(addPrompt(data)).unwrap();

        toast.success("Prompt created successfully");
      }

      setFormOpen(false);
      setEditingPrompt(null);
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Something went wrong"
      );
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this prompt?"
    );

    if (!confirmed) return;

    try {
      await dispatch(removePrompt(id)).unwrap();

      toast.success("Prompt deleted successfully");
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Failed to delete prompt"
      );
    }
  };

  const handleFavorite = (id: string) => {
    dispatch(toggleFavorite(id));
  };

  const handlePin = (id: string) => {
    dispatch(togglePinned(id));
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);

      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  return (
    <>
      <DashboardLayout onAddPrompt={handleAddPrompt}>
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Welcome back 👋
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Your Prompt Library
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage, organize, and reuse your AI prompts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddPrompt}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Add Prompt
            </button>
          </div>

          {/* Content */}
          <div className="mt-8">
            {loading && prompts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-sm text-slate-500">
                  Loading prompts...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      All Prompts
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {prompts.length} prompt
                      {prompts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <PromptGrid
                  prompts={prompts}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onFavorite={handleFavorite}
                  onPin={handlePin}
                  onCopy={handleCopy}
                />
              </>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Add / Edit Modal */}
      {formOpen && (
        <PromptForm
          prompt={editingPrompt}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
}