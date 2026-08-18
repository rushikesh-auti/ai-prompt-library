import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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

import { useAppDispatch, useAppSelector } from "../store/hooks";

import type { Category, CreatePromptData, Prompt } from "../types/prompt";

export default function Dashboard() {
  const dispatch = useAppDispatch();

  const { prompts, loading, error } = useAppSelector((state) => state.prompts);

  const [activeView, setActiveView] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  //  FILTER STATE

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [filter, setFilter] = useState<PromptFilter>("all");
  const [sort, setSort] = useState<PromptSort>("newest");

  useEffect(() => {
    dispatch(fetchPrompts());
  }, [dispatch]);

  //  SIDEBAR NAVIGATION

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSearch("");

    if (view === "all") {
      setCategory("All");
      setFilter("all");
      return;
    }

    if (view === "favorites") {
      setCategory("All");
      setFilter("favorites");
      return;
    }

    if (view === "pinned") {
      setCategory("All");
      setFilter("pinned");
      return;
    }

    // Category selected from sidebar
    setCategory(view as Category);
    setFilter("all");
  };

  //  ADD PROMPT

  const handleAddPrompt = () => {
    setEditingPrompt(null);
    setFormOpen(true);
  };

  //  EDIT PROMPT

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormOpen(true);
  };

  //  CLOSE FORM

  const handleCloseForm = () => {
    if (loading) {
      return;
    }

    setFormOpen(false);
    setEditingPrompt(null);
  };

  //  CREATE / UPDATE PROMPT

  const handleSubmit = async (data: CreatePromptData) => {
    try {
      if (editingPrompt) {
        await dispatch(
          editPrompt({
            id: editingPrompt._id,
            data,
          }),
        ).unwrap();

        toast.success("Prompt updated successfully");
      } else {
        await dispatch(addPrompt(data)).unwrap();

        toast.success("Prompt created successfully");
      }

      setFormOpen(false);
      setEditingPrompt(null);
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Something went wrong");
    }
  };

  //  DELETE PROMPT

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this prompt?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(removePrompt(id)).unwrap();

      toast.success("Prompt deleted successfully");
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to delete prompt",
      );
    }
  };

  const handleFavorite = async (id: string) => {
    const prompt = prompts.find((item) => item._id === id);

    if (!prompt) {
      return;
    }

    try {
      const newFavoriteState = !prompt.isFavorite;

      await dispatch(
        favoritePrompt({
          id,
          isFavorite: newFavoriteState,
        }),
      ).unwrap();

      toast.success(
        newFavoriteState ? "Added to favorites" : "Removed from favorites",
      );
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to update favorite",
      );
    }
  };

  //  PIN PROMPT

  const handlePin = async (id: string) => {
    const prompt = prompts.find((item) => item._id === id);

    if (!prompt) {
      return;
    }

    try {
      const newPinnedState = !prompt.isPinned;

      await dispatch(
        pinPrompt({
          id,
          isPinned: newPinnedState,
        }),
      ).unwrap();

      toast.success(newPinnedState ? "Prompt pinned" : "Prompt unpinned");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to update pin");
    }
  };

  //  DUPLICATE PROMPT

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
        }),
      ).unwrap();

      toast.success("Prompt duplicated successfully");
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to duplicate prompt",
      );
    }
  };

    //  COPY PROMPT

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);

      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

    //  REORDER PROMPTS

  const handleReorder = (reorderedPrompts: Prompt[]) => {
    dispatch(updatePromptOrder(reorderedPrompts));

    toast.success("Prompt order updated");
  };

    //  EXPORT JSON

  const handleExportJSON = () => {
    try {
      if (prompts.length === 0) {
        toast.error("No prompts available to export");

        return;
      }

      const jsonData = JSON.stringify(prompts, null, 2);

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

    //  IMPORT JSON

  const handleImportJSON = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isJson =
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json");

    if (!isJson) {
      toast.error("Please select a valid JSON file");

      event.target.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);

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
            Array.isArray(prompt.tags),
        );

        if (!isValid) {
          throw new Error("Invalid prompt structure");
        }

        dispatch(importPrompts(parsed as Prompt[]));

        // Reset filters
        setSearch("");
        setCategory("All");
        setFilter("all");
        setSort("newest");
        setActiveView("all");

        toast.success(
          `${parsed.length} prompt${
            parsed.length !== 1 ? "s" : ""
          } imported successfully`,
        );
      } catch {
        toast.error("Invalid JSON file. Please import a valid prompt library.");
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

    //  FILTER + SEARCH + SORT

  const filteredPrompts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = prompts.filter((prompt) => {
      const title = prompt.title?.toLowerCase() ?? "";

      const content = prompt.content?.toLowerCase() ?? "";

      const description = prompt.description?.toLowerCase() ?? "";

      const tags = prompt.tags ?? [];

      /* Search */

      const matchesSearch =
        normalizedSearch === "" ||
        title.includes(normalizedSearch) ||
        content.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      /* Category */

      const matchesCategory =
        category === "All" || prompt.category === category;

      /* Favorite / Pinned */

      const matchesFilter =
        filter === "all" ||
        (filter === "favorites" && prompt.isFavorite) ||
        (filter === "pinned" && prompt.isPinned);

      return matchesSearch && matchesCategory && matchesFilter;
    });

    /* Sorting */

    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "title-asc":
          return a.title.localeCompare(b.title);

        case "title-desc":
          return b.title.localeCompare(a.title);

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [prompts, search, category, filter, sort]);

    //  STATISTICS

  const statistics = useMemo(() => {
    const categoryCounts = prompts.reduce(
      (acc, prompt) => {
        acc[prompt.category] = (acc[prompt.category] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: prompts.length,

      favorites: prompts.filter((prompt) => prompt.isFavorite).length,

      pinned: prompts.filter((prompt) => prompt.isPinned).length,

      categories: Object.keys(categoryCounts).length,
    };
  }, [prompts]);

    //  CLEAR FILTERS

  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setFilter("all");
    setSort("newest");
    setActiveView("all");
  };

    //  RENDER

  return (
    <>
      <DashboardLayout
        search={search}
        onSearchChange={(value) => {
          setSearch(value);

          if (value.trim()) {
            setActiveView("all");
            setCategory("All");
            setFilter("all");
          }
        }}
        onAddPrompt={handleAddPrompt}
        activeView={activeView}
        onViewChange={handleViewChange}
      >
        <div className="mx-auto max-w-7xl">
              {/* PAGE HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Welcome back 👋
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Your Prompt Library
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage, organize, and reuse your AI prompts.
              </p>
            </div>

            {/* Dashboard Actions */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Import */}

              <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              {/* Export */}

              <button
                type="button"
                onClick={handleExportJSON}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

          {/* STATISTICS */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">
                Total Prompts
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {statistics.total}
              </p>
            </div>

            {/* Favorites */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">Favorites</p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {statistics.favorites}
              </p>
            </div>

            {/* Pinned */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">Pinned</p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {statistics.pinned}
              </p>
            </div>

            {/* Categories */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">
                Categories Used
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {statistics.categories}
              </p>
            </div>
          </div>

          {/* CONTENT */}

          <div className="mt-8">
            {/* Loading */}

            {loading && prompts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Loading prompts...</p>
              </div>
            )}

            {/* Error */}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/40">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Main Content */}

            {!loading && !error && (
              <>
                {/* Filters */}

                <PromptFilters
                  search={search}
                  category={category}
                  filter={filter}
                  sort={sort}
                  onSearchChange={(value) => {
                    setSearch(value);

                    if (value.trim()) {
                      setActiveView("all");
                      setCategory("All");
                      setFilter("all");
                    }
                  }}
                  onCategoryChange={(value) => {
                    setCategory(value);
                    setFilter("all");
                    setSearch("");

                    setActiveView(value === "All" ? "all" : value);
                  }}
                  onFilterChange={(value) => {
                    setFilter(value);
                    setCategory("All");
                    setSearch("");

                    setActiveView(value);
                  }}
                  onSortChange={setSort}
                  onClear={handleClearFilters}
                />

                {/* Results Header */}

                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {category !== "All"
                        ? category
                        : filter === "favorites"
                          ? "Favorite Prompts"
                          : filter === "pinned"
                            ? "Pinned Prompts"
                            : "All Prompts"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {filteredPrompts.length} prompt
                      {filteredPrompts.length !== 1 ? "s" : ""}
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

      {/* ADD / EDIT PROMPT MODAL */}

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
