import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
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
  favoritePrompt,
  fetchPrompts,
  importPrompts,
  pinPrompt,
  removePrompt,
  updatePromptOrder,
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
  const handleFavorite = async (id: string) => {
    const prompt = prompts.find(
      (item) => item._id === id
    );

    if (!prompt) return;

    try {
      await dispatch(
        favoritePrompt({
          id,
          isFavorite: !prompt.isFavorite,
        })
      ).unwrap();

      toast.success(
        !prompt.isFavorite
          ? "Added to favorites"
          : "Removed from favorites"
      );
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Failed to update favorite"
      );
    }
  };

  // Pin prompt
  const handlePin = async (id: string) => {
    const prompt = prompts.find(
      (item) => item._id === id
    );

    if (!prompt) return;

    try {
      await dispatch(
        pinPrompt({
          id,
          isPinned: !prompt.isPinned,
        })
      ).unwrap();

      toast.success(
        !prompt.isPinned
          ? "Prompt pinned"
          : "Prompt unpinned"
      );
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Failed to update pin"
      );
    }
  };

  // Duplicate prompt
  const handleDuplicate = async (prompt: Prompt) => {
    try {
      await dispatch(
        addPrompt({
          title: `${prompt.title} (Copy)`,
          content: prompt.content,
          category: prompt.category,
          tags: prompt.tags,
          description: prompt.description,
          isFavorite: false,
          isPinned: false,
        })
      ).unwrap();

      toast.success("Prompt duplicated successfully");
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Failed to duplicate prompt"
      );
    }
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

  // Reorder prompts
  const handleReorder = (reorderedPrompts: Prompt[]) => {
  dispatch(updatePromptOrder(reorderedPrompts));

  toast.success("Prompt order updated");
};

  // Export prompts as JSON
  const handleExportJSON = () => {
    try {
      if (prompts.length === 0) {
        toast.error("No prompts available to export");
        return;
      }

      const jsonData = JSON.stringify(
        prompts,
        null,
        2
      );

      const blob = new Blob([jsonData], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `ai-prompt-library-${
        new Date().toISOString().split("T")[0]
      }.json`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Prompts exported successfully");
    } catch {
      toast.error("Failed to export prompts");
    }
  };

  // Import prompts from JSON
  const handleImportJSON = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/json" &&
      !file.name.toLowerCase().endsWith(".json")
    ) {
      toast.error("Please select a valid JSON file");

      event.target.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(
          reader.result as string
        );

        if (!Array.isArray(parsed)) {
          throw new Error("Invalid format");
        }

        const isValid = parsed.every(
          (prompt) =>
            prompt &&
            typeof prompt === "object" &&
            "_id" in prompt &&
            "title" in prompt &&
            "content" in prompt &&
            "category" in prompt &&
            "tags" in prompt &&
            typeof prompt._id === "string" &&
            typeof prompt.title === "string" &&
            typeof prompt.content === "string" &&
            typeof prompt.category === "string" &&
            Array.isArray(prompt.tags)
        );

        if (!isValid) {
          throw new Error(
            "Invalid prompt structure"
          );
        }

        dispatch(
          importPrompts(parsed as Prompt[])
        );

        setSearch("");
        setCategory("All");
        setFilter("all");
        setSort("newest");

        toast.success(
          `${parsed.length} prompt${
            parsed.length !== 1 ? "s" : ""
          } imported successfully`
        );
      } catch {
        toast.error(
          "Invalid JSON file. Please import a valid prompt library."
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read JSON file");

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  // Filter + Search + Sort
  const filteredPrompts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

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
          tag
            .toLowerCase()
            .includes(normalizedSearch)
        );

      // Category
      const matchesCategory =
        category === "All" ||
        prompt.category === category;

      // Favorites / Pinned
      const matchesFilter =
        filter === "all" ||
        (filter === "favorites" &&
          prompt.isFavorite) ||
        (filter === "pinned" &&
          prompt.isPinned);

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

  // Dashboard statistics
  const statistics = useMemo(() => {
    const categoryCounts = prompts.reduce(
      (acc, prompt) => {
        acc[prompt.category] =
          (acc[prompt.category] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: prompts.length,

      favorites: prompts.filter(
        (prompt) => prompt.isFavorite
      ).length,

      pinned: prompts.filter(
        (prompt) => prompt.isPinned
      ).length,

      categories:
        Object.keys(categoryCounts).length,
    };
  }, [prompts]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setFilter("all");
    setSort("newest");
  };

  return (
    <>
      <DashboardLayout
        onAddPrompt={handleAddPrompt}
      >
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
                Manage, organize, and reuse your AI
                prompts.
              </p>
            </div>

            {/* Dashboard Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Import JSON */}
              <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Import JSON

                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              {/* Export JSON */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Export JSON
              </button>

              {/* Add Prompt */}
              <button
                type="button"
                onClick={handleAddPrompt}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Add Prompt
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Prompts
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {statistics.total}
              </p>
            </div>

            {/* Favorites */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Favorites
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {statistics.favorites}
              </p>
            </div>

            {/* Pinned */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Pinned
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {statistics.pinned}
              </p>
            </div>

            {/* Categories */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Categories Used
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {statistics.categories}
              </p>
            </div>
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
                  onDuplicate={handleDuplicate}
                  onReorder={handleReorder}
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