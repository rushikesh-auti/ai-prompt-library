import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import DashboardLayout from "../components/layout/DashboardLayout";
import PromptForm from "../components/prompts/PromptForm";
import PromptGrid from "../components/prompts/PromptGrid";
import PromptFilters, {
  type PromptFilter,
  type PromptSort,
} from "../components/prompts/PromptFilters";

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
  Category,
  CreatePromptData,
  Prompt,
} from "../types/prompt";

export default function Dashboard() {
  const dispatch = useAppDispatch();

  const { prompts, loading, error } = useAppSelector(
    (state) => state.prompts
  );

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] =
    useState<Prompt | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">(
    "All"
  );
  const [filter, setFilter] =
    useState<PromptFilter>("all");
  const [sort, setSort] =
    useState<PromptSort>("newest");

  // Fetch prompts when dashboard loads
  useEffect(() => {
    dispatch(fetchPrompts());
  }, [dispatch]);

  // Open Add Prompt form
  const handleAddPrompt = () => {
    setEditingPrompt(null);
    setFormOpen(true);
  };

  // Open Edit Prompt form
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormOpen(true);
  };

  // Close Add/Edit form
  const handleCloseForm = () => {
    if (loading) return;

    setFormOpen(false);
    setEditingPrompt(null);
  };

  // Create / Update prompt
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

  // Delete prompt
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

  // Favorite prompt
  const handleFavorite = (id: string) => {
    dispatch(toggleFavorite(id));
  };

  // Pin prompt
  const handlePin = (id: string) => {
    dispatch(togglePinned(id));
  };

  // Copy prompt
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);

      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  // Filter + Search + Sort
  const filteredPrompts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = prompts.filter((prompt) => {
      // Search
      const matchesSearch =
        normalizedSearch === "" ||
        prompt.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        prompt.content
          .toLowerCase()
          .includes(normalizedSearch) ||
        prompt.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        prompt.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedSearch)
        );

      // Category
      const matchesCategory =
        category === "All" ||
        prompt.category === category;

      // Favorites / Pinned
      const matchesFilter =
        filter === "all" ||
        (filter === "favorites" && prompt.isFavorite) ||
        (filter === "pinned" && prompt.isPinned);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesFilter
      );
    });

    // Sorting
    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );

        case "title-asc":
          return a.title.localeCompare(b.title);

        case "title-desc":
          return b.title.localeCompare(a.title);

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });
  }, [
    prompts,
    search,
    category,
    filter,
    sort,
  ]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setFilter("all");
    setSort("newest");
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
            {/* Loading */}
            {loading && prompts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-sm text-slate-500">
                  Loading prompts...
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Main content */}
            {!loading && !error && (
              <>
                {/* Search + Filters */}
                <PromptFilters
                  search={search}
                  category={category}
                  filter={filter}
                  sort={sort}
                  onSearchChange={setSearch}
                  onCategoryChange={setCategory}
                  onFilterChange={setFilter}
                  onSortChange={setSort}
                  onClear={handleClearFilters}
                />

                {/* Results Header */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {filter === "favorites"
                        ? "Favorite Prompts"
                        : filter === "pinned"
                          ? "Pinned Prompts"
                          : "All Prompts"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {filteredPrompts.length} prompt
                      {filteredPrompts.length !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Prompt Grid */}
                <PromptGrid
                  prompts={filteredPrompts}
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