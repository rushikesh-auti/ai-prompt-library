import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "react-hot-toast";
import { FiArchive, FiHeart, FiLayers, FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import PromptForm from "../components/prompts/PromptForm";
import PromptGrid from "../components/prompts/PromptGrid";
import PromptFilters, {
  type PromptFilter,
  type PromptSort,
} from "../components/prompts/PromptFilters";
import PromptDetailModal from "../components/prompts/PromptDetailModal";
import ExplorePage from "./ExplorePage";
import CollectionsPage from "./CollectionsPage";
import SettingsPage from "./SettingsPage";

import {
  bulkPromptAction,
  fetchPromptSummary,
  addPrompt,
  editPrompt,
  favoritePrompt,
  fetchPrompts,
  fetchTrash,
  importPrompts,
  pinPrompt,
  permanentlyDeletePrompt,
  removePrompt,
  restorePrompt,
  savePromptOrder,
} from "../features/prompts/promptSlice";
import { logoutUser } from "../features/auth/authSlice";
import {
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
} from "../services/collectionApi";
import { getPrompts } from "../services/promptApi";
import { useTheme } from "../hooks/useTheme";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { toPortablePromptData } from "../utils/promptStorage";

import type { Category, CreatePromptData, ExplorePrompt, Prompt, PromptQuery } from "../types/prompt";
import type { CollectionInput, PromptCollection } from "../types/collection";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const { prompts, loading, error, total, pages, summary, summaryError } = useAppSelector((state) => state.prompts);
  const { user } = useAppSelector((state) => state.auth);

  const [activeView, setActiveView] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewedPrompt, setViewedPrompt] = useState<Prompt | null>(null);
  const [collections, setCollections] = useState<PromptCollection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [collectionPrompts, setCollectionPrompts] = useState<Prompt[]>([]);
  const [folderId, setFolderId] = useState<string | "All">("All");
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);

  //  FILTER STATE

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [filter, setFilter] = useState<PromptFilter>("all");
  const [sort, setSort] = useState<PromptSort>("manual");

  const query = useMemo<PromptQuery>(() => ({
    page,
    limit: 12,
    sort,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(category !== "All" ? { category } : {}),
    ...(filter === "favorites" ? { favorite: true } : {}),
    ...(filter === "pinned" ? { pinned: true } : {}),
    ...(folderId !== "All" ? { folderId } : {}),
  }), [page, sort, search, category, filter, folderId]);

  useEffect(() => {
    if (["explore", "collections", "folders", "settings"].includes(activeView)) return;
    if (activeView === "trash") {
      dispatch(fetchTrash(query));
    } else {
      dispatch(fetchPrompts(query));
    }
  }, [dispatch, activeView, query, refreshKey]);

  useEffect(() => {
    let active = true;
    getCollections()
      .then((items) => {
        if (active) {
          setCollections(items);
          setCollectionsError(null);
        }
      })
      .catch((collectionError: unknown) => {
        const message =
          collectionError &&
          typeof collectionError === "object" &&
          "response" in collectionError &&
          collectionError.response &&
          typeof collectionError.response === "object" &&
          "data" in collectionError.response &&
          collectionError.response.data &&
          typeof collectionError.response.data === "object" &&
          "message" in collectionError.response.data
            ? String(collectionError.response.data.message)
            : "Unable to load your collections";
        if (active) setCollectionsError(message);
      })
      .finally(() => {
        if (active) setCollectionsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (activeView !== "collections" && activeView !== "folders") return;
    let active = true;
    getPrompts({ all: true, sort: "manual" })
      .then((result) => {
        if (active) setCollectionPrompts(result.prompts);
      })
      .catch(() => {
        if (active) setCollectionsError("Unable to load prompts for organization");
      })
      .finally(() => {
        if (active) setOrganizationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeView]);

  useEffect(() => {
    dispatch(fetchPromptSummary());
  }, [dispatch]);

  //  SIDEBAR NAVIGATION

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setOrganizationLoading(view === "collections" || view === "folders");
    setSearch("");
    setPage(1);
    setFolderId("All");
    setSelectedPromptIds([]);

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

    if (["explore", "collections", "folders", "settings", "trash"].includes(view)) {
      setCategory("All");
      setFilter("all");
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

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login", { replace: true });
    } catch (logoutError) {
      toast.error(
        typeof logoutError === "string" ? logoutError : "Unable to log out",
      );
    }
  };

  //  EDIT PROMPT

  const handleEdit = (prompt: Prompt) => {
    setViewedPrompt(null);
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
        dispatch(fetchPrompts(query));
        dispatch(fetchPromptSummary());

        toast.success("Prompt updated successfully");
      } else {
        await dispatch(addPrompt(data)).unwrap();
        setActiveView("all");
        setCategory("All");
        setFilter("all");
        setFolderId("All");
        setSearch("");
        setPage(1);
        dispatch(fetchPromptSummary());
        setRefreshKey((key) => key + 1);

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
      "Move this prompt to Trash? You can restore it later.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(removePrompt(id)).unwrap();

      setSelectedPromptIds((current) => current.filter((item) => item !== id));
      if (page > 1 && pagePrompts.length === 1) setPage(page - 1);
      dispatch(fetchPromptSummary());
      toast.success("Prompt moved to Trash");
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to delete prompt",
      );
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await dispatch(restorePrompt(id)).unwrap();
      setSelectedPromptIds((current) => current.filter((item) => item !== id));
      if (activeView === "trash" && page > 1 && pagePrompts.length === 1) {
        setPage(page - 1);
      }
      dispatch(fetchPromptSummary());
      toast.success("Prompt restored");
    } catch (restoreError) {
      toast.error(typeof restoreError === "string" ? restoreError : "Failed to restore prompt");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this prompt? This cannot be undone.")) return;
    try {
      await dispatch(permanentlyDeletePrompt(id)).unwrap();
      setSelectedPromptIds((current) => current.filter((item) => item !== id));
      if (page > 1 && pagePrompts.length === 1) setPage(page - 1);
      toast.success("Prompt permanently deleted");
    } catch (deleteError) {
      toast.error(typeof deleteError === "string" ? deleteError : "Failed to permanently delete prompt");
    }
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedPromptIds((current) =>
      selected
        ? current.includes(id) ? current : [...current, id]
        : current.filter((item) => item !== id),
    );
  };

  const handleBulkAction = async (
    action: "favorite" | "unfavorite" | "trash" | "restore" | "permanentDelete",
  ) => {
    if (selectedPromptIds.length === 0) return;
    if (
      action === "permanentDelete" &&
      !window.confirm(`Permanently delete ${selectedPromptIds.length} prompts? This cannot be undone.`)
    ) return;
    try {
      await dispatch(bulkPromptAction({ ids: selectedPromptIds, action })).unwrap();
      if (
        (action === "trash" ||
          action === "restore" ||
          action === "permanentDelete") &&
        page > 1 &&
        selectedPromptIds.length >= pagePrompts.length
      ) {
        setPage(page - 1);
      }
      setSelectedPromptIds([]);
      dispatch(fetchPromptSummary());
      if (activeView === "trash") dispatch(fetchTrash(query));
      else dispatch(fetchPrompts(query));
      toast.success(
        action === "trash" ? "Selected prompts moved to Trash"
          : action === "restore" ? "Selected prompts restored"
            : action === "permanentDelete" ? "Selected prompts permanently deleted"
              : action === "favorite" ? "Selected prompts added to Favorites"
                : "Selected prompts removed from Favorites",
      );
    } catch (bulkError) {
      toast.error(typeof bulkError === "string" ? bulkError : "Bulk action failed");
    }
  };

  const handleBulkMove = async (targetFolderId: string) => {
    if (selectedPromptIds.length === 0) return;
    try {
      await dispatch(bulkPromptAction({
        ids: selectedPromptIds,
        action: "moveToFolder",
        folderId: targetFolderId || null,
      })).unwrap();
      setSelectedPromptIds([]);
      if (
        folderId !== "All" &&
        page > 1 &&
        selectedPromptIds.length >= pagePrompts.length
      ) {
        setPage(page - 1);
      }
      dispatch(fetchPrompts(query));
      toast.success(targetFolderId ? "Prompts moved to folder" : "Prompts removed from folders");
    } catch (bulkError) {
      toast.error(typeof bulkError === "string" ? bulkError : "Could not move prompts");
    }
  };

  const handleFavorite = async (id: string) => {
    const prompt = prompts.find((item) => item._id === id);

    if (!prompt) {
      return;
    }

    try {
      const newFavoriteState = !prompt.isFavorite;

      const updatedPrompt = await dispatch(
        favoritePrompt({
          id,
          isFavorite: newFavoriteState,
        }),
      ).unwrap();
      dispatch(fetchPromptSummary());
      dispatch(fetchPrompts(query));
      setViewedPrompt((current) =>
        current?._id === id ? updatedPrompt : current,
      );

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

      const updatedPrompt = await dispatch(
        pinPrompt({
          id,
          isPinned: newPinnedState,
        }),
      ).unwrap();
      dispatch(fetchPrompts(query));
      dispatch(fetchPromptSummary());
      setViewedPrompt((current) =>
        current?._id === id ? updatedPrompt : current,
      );

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
      dispatch(fetchPromptSummary());
      setRefreshKey((key) => key + 1);

      toast.success("Prompt duplicated successfully");
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to duplicate prompt",
      );
    }
  };

  const handleSaveExplorePrompt = async (prompt: ExplorePrompt) => {
    try {
      await dispatch(
        addPrompt({
          title: prompt.title,
          content: prompt.content,
          category: prompt.category,
          tags: prompt.tags,
          description: prompt.description,
          isFavorite: false,
          isPinned: false,
        }),
      ).unwrap();
      dispatch(fetchPromptSummary());
      toast.success("Added to your private prompts");
    } catch (saveError) {
      toast.error(typeof saveError === "string" ? saveError : "Could not save this prompt");
    }
  };

  const handleCreateCollection = async (data: CollectionInput) => {
    try {
      const collection = await createCollection(data);
      setCollections((current) => [collection, ...current]);
      toast.success(data.kind === "folder" ? "Folder created" : "Collection created");
    } catch (collectionError) {
      toast.error(
        collectionError &&
          typeof collectionError === "object" &&
          "response" in collectionError &&
          collectionError.response &&
          typeof collectionError.response === "object" &&
          "data" in collectionError.response &&
          collectionError.response.data &&
          typeof collectionError.response.data === "object" &&
          "message" in collectionError.response.data
          ? String(collectionError.response.data.message)
          : "Could not create collection",
      );
    }
  };

  const handleUpdateCollection = async (
    id: string,
    data: Partial<CollectionInput>,
  ) => {
    try {
      const collection = await updateCollection(id, data);
      setCollections((current) =>
        current.map((item) => item._id === id ? collection : item),
      );
      toast.success(collection.kind === "folder" ? "Folder updated" : "Collection updated");
    } catch (collectionError) {
      toast.error(
        collectionError &&
          typeof collectionError === "object" &&
          "response" in collectionError &&
          collectionError.response &&
          typeof collectionError.response === "object" &&
          "data" in collectionError.response &&
          collectionError.response.data &&
          typeof collectionError.response.data === "object" &&
          "message" in collectionError.response.data
          ? String(collectionError.response.data.message)
          : "Could not update collection",
      );
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      setCollections((current) => current.filter((item) => item._id !== id));
      toast.success("Collection deleted");
    } catch (collectionError) {
      toast.error(
        collectionError &&
          typeof collectionError === "object" &&
          "response" in collectionError &&
          collectionError.response &&
          typeof collectionError.response === "object" &&
          "data" in collectionError.response &&
          collectionError.response.data &&
          typeof collectionError.response.data === "object" &&
          "message" in collectionError.response.data
          ? String(collectionError.response.data.message)
          : "Could not delete collection",
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

  const handleReorder = async (reorderedPrompts: Prompt[]) => {
    try {
      await dispatch(savePromptOrder(reorderedPrompts.map((prompt) => prompt._id))).unwrap();
      toast.success("Prompt order saved");
    } catch (reorderError) {
      toast.error(typeof reorderError === "string" ? reorderError : "Failed to save prompt order");
      dispatch(fetchPrompts(query));
    }
  };

  //  EXPORT JSON

  const handleExportJSON = async () => {
    try {
      const { prompts: allPrompts } = await getPrompts({ all: true, sort: "manual" });
      if (allPrompts.length === 0) {
        toast.error("No prompts available to export");

        return;
      }

      const portablePrompts = toPortablePromptData(allPrompts);
      const jsonData = JSON.stringify(portablePrompts, null, 2);

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

  const handleImportJSON = async (event: ChangeEvent<HTMLInputElement>) => {
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

    if (file.size === 0) {
      toast.error("The selected JSON file is empty");
      event.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error("JSON files must be 1 MB or smaller");
      event.target.value = "";
      return;
    }

    try {
      const fileContent = await file.text();
      const parsed: unknown = JSON.parse(fileContent);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error("The JSON file must contain a non-empty prompt array");
        return;
      }

      const result = await dispatch(importPrompts(parsed)).unwrap();
      const summary = result;

      if (summary.created > 0) {
        setSearch("");
        setCategory("All");
        setFilter("all");
        setFolderId("All");
        setSort("manual");
        setActiveView("all");
        setPage(1);
        dispatch(fetchPromptSummary());
        setRefreshKey((key) => key + 1);
      }

      if (summary.failed > 0) {
        toast.error(
          `Imported ${summary.created}; skipped ${summary.skipped}; failed ${summary.failed}.`,
        );
      } else if (summary.skipped > 0) {
        toast.success(
          `Imported ${summary.created}; skipped ${summary.skipped} duplicate${summary.skipped === 1 ? "" : "s"}.`,
        );
      } else {
        toast.success(
          `${summary.created} prompt${summary.created === 1 ? "" : "s"} imported successfully`,
        );
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error(
          "Invalid JSON file. Please select a valid prompt library file.",
        );
      } else if (typeof error === "string") {
        toast.error(error);
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        const summary =
          "summary" in error &&
          error.summary &&
          typeof error.summary === "object"
            ? error.summary
            : null;
        const counts =
          summary &&
          "created" in summary &&
          "skipped" in summary &&
          "failed" in summary &&
          typeof summary.created === "number" &&
          typeof summary.skipped === "number" &&
          typeof summary.failed === "number"
            ? ` Created ${summary.created}, skipped ${summary.skipped}, failed ${summary.failed}.`
            : "";

        toast.error(`${error.message}${counts}`);
      } else {
        toast.error("Failed to read or import JSON file");
      }
    } finally {
      event.target.value = "";
    }
  };

  const currentPage = page;
  const pageCount = pages;
  const pagePrompts = prompts;

  //  CLEAR FILTERS

  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setFilter("all");
    setSort("manual");
    setFolderId("All");
    if (activeView !== "trash") setActiveView("all");
    setSelectedPromptIds([]);
    setPage(1);
  };

  //  RENDER

  const layoutProps = {
    search,
    onSearchChange: (value: string) => {
      setPage(1);
      setSelectedPromptIds([]);
      setSearch(value);
    },
    onAddPrompt: handleAddPrompt,
    activeView,
    onViewChange: handleViewChange,
    isDark,
    onThemeToggle: toggleTheme,
  };

  if (activeView === "explore") {
    return (
      <>
        <DashboardLayout {...layoutProps}>
          <ExplorePage
            search={search}
            onSave={handleSaveExplorePrompt}
          />
        </DashboardLayout>
        {formOpen && <PromptForm prompt={editingPrompt} loading={loading} onSubmit={handleSubmit} onClose={handleCloseForm} />}
      </>
    );
  }

  if (activeView === "collections" || activeView === "folders") {
    const kind = activeView === "folders" ? "folder" : "collection";
    return (
      <>
        <DashboardLayout {...layoutProps}>
          <CollectionsPage
            kind={kind}
            collections={collections.filter((item) => item.kind === kind)}
            prompts={collectionPrompts}
            loading={!collectionsLoaded || organizationLoading}
            error={collectionsError}
            onCreate={handleCreateCollection}
            onUpdate={handleUpdateCollection}
            onDelete={handleDeleteCollection}
          />
        </DashboardLayout>
        {formOpen && <PromptForm prompt={editingPrompt} loading={loading} onSubmit={handleSubmit} onClose={handleCloseForm} />}
      </>
    );
  }

  if (activeView === "settings") {
    return (
      <DashboardLayout {...layoutProps}>
        <SettingsPage
          user={user}
          isDark={isDark}
          onThemeToggle={toggleTheme}
          onLogout={handleLogout}
        />
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout {...layoutProps}>
        <div className="mx-auto max-w-7xl">
          {/* PAGE HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {activeView === "trash" ? "Trash" : category !== "All"
                  ? category
                  : filter === "favorites"
                    ? "Favorite prompts"
                    : filter === "pinned"
                      ? "Pinned prompts"
                      : "My prompts"}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {activeView === "trash"
                  ? "Restore prompts or permanently delete them."
                  : "Your private AI workflows, organized and ready when you need them."}
              </p>
            </div>

            {/* Dashboard Actions */}

            {activeView !== "trash" && <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              {/* Import */}

              <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:py-2.5 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  disabled={loading}
                  className="hidden"
                />
              </label>

              {/* Export */}

              <button
                type="button"
                onClick={handleExportJSON}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4 sm:py-2.5 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Export JSON
              </button>

              {/* Add Prompt */}

              <button
                type="button"
                onClick={handleAddPrompt}
                className="col-span-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:col-span-1 sm:py-2.5"
              >
                + Add Prompt
              </button>
            </div>}
          </div>
          {summaryError && (
            <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Could not load prompt statistics: {summaryError}
            </p>
          )}

          {/* STATISTICS */}

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* Total */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  Total Prompts
                </p>
                <FiArchive className="text-slate-400" size={18} />
              </div>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {(loading || error) && prompts.length === 0 ? "—" : summary.total}
              </p>
            </div>

            {/* Favorites */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  Favorites
                </p>
                <FiHeart className="text-slate-400" size={18} />
              </div>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {(loading || error) && prompts.length === 0 ? "—" : summary.favorites}
              </p>
            </div>

            {/* Pinned */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  Pinned
                </p>
                <FiStar className="text-slate-400" size={18} />
              </div>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {(loading || error) && prompts.length === 0 ? "—" : summary.pinned}
              </p>
            </div>

            {/* Categories */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  Categories Used
                </p>
                <FiLayers className="text-slate-400" size={18} />
              </div>

              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {(loading || error) && prompts.length === 0 ? "—" : summary.categories}
              </p>
            </div>
          </div>

          {/* CONTENT */}

          <div className="mt-8">
            {/* Loading */}

            {loading && (
              <div role="status" className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">Loading prompts...</p>
              </div>
            )}

            {/* Error */}

            {!loading && error && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/40">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => activeView === "trash" ? dispatch(fetchTrash(query)) : dispatch(fetchPrompts(query))}
                  className="mt-3 text-sm font-semibold text-red-800 underline dark:text-red-200"
                >
                  Try again
                </button>
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
                  folderId={folderId}
                  folders={collections.filter((item) => item.kind === "folder")}
                  onSearchChange={(value) => {
                    setSearch(value);
                    setSelectedPromptIds([]);
                    setPage(1);

                    if (value.trim()) {
                      if (activeView !== "trash") {
                        setActiveView("all");
                        setCategory("All");
                        setFilter("all");
                        setFolderId("All");
                      }
                    }
                  }}
                  onCategoryChange={(value) => {
                    setCategory(value);
                    setSelectedPromptIds([]);
                    setFilter("all");
                    setSearch("");
                    setPage(1);

                    if (activeView !== "trash") {
                      setFolderId("All");
                      setActiveView(value === "All" ? "all" : value);
                    }
                  }}
                  onFilterChange={(value) => {
                    setFilter(value);
                    setSelectedPromptIds([]);
                    setCategory("All");
                    setSearch("");
                    setPage(1);

                    if (activeView !== "trash") setActiveView(value);
                  }}
                  onSortChange={(value) => {
                    setSort(value);
                    setSelectedPromptIds([]);
                    setPage(1);
                  }}
                  onFolderChange={(value) => {
                    setFolderId(value);
                    setSelectedPromptIds([]);
                    setPage(1);
                    if (activeView !== "trash") setActiveView("all");
                  }}
                  onClear={handleClearFilters}
                />

                {/* Results Header */}

                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {activeView === "trash"
                        ? "Trash"
                        : folderId !== "All"
                          ? collections.find((item) => item._id === folderId)?.name || "Folder"
                          : category !== "All"
                        ? category
                        : filter === "favorites"
                          ? "Favorite Prompts"
                          : filter === "pinned"
                            ? "Pinned Prompts"
                            : "All Prompts"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {total} prompt
                      {total !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {pagePrompts.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => {
                        const pageIds = pagePrompts.map((prompt) => prompt._id);
                        setSelectedPromptIds((current) =>
                          pageIds.every((id) => current.includes(id))
                            ? current.filter((id) => !pageIds.includes(id))
                            : [...new Set([...current, ...pageIds])],
                        );
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {pagePrompts.every((prompt) => selectedPromptIds.includes(prompt._id))
                        ? "Deselect page"
                        : "Select page"}
                    </button>
                    <span className="text-sm text-slate-500">{selectedPromptIds.length} selected</span>
                    {selectedPromptIds.length > 0 && (activeView === "trash" ? (
                      <>
                        <button type="button" onClick={() => void handleBulkAction("restore")} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white">Restore selected</button>
                        <button type="button" onClick={() => void handleBulkAction("permanentDelete")} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white">Delete permanently</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => void handleBulkAction("favorite")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">Favorite</button>
                        <button type="button" onClick={() => void handleBulkAction("unfavorite")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">Unfavorite</button>
                        <select
                          aria-label="Move selected prompts to folder"
                          value=""
                          onChange={(event) => void handleBulkMove(event.target.value === "__remove" ? "" : event.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="" disabled>Move to folder…</option>
                          {collections.filter((item) => item.kind === "folder").map((folder) => (
                            <option key={folder._id} value={folder._id}>{folder.name}</option>
                          ))}
                          {folderId !== "All" && <option value="__remove">Remove from this folder</option>}
                        </select>
                        <button type="button" onClick={() => void handleBulkAction("trash")} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white">Move to Trash</button>
                      </>
                    ))}
                  </div>
                )}

                {/* Prompt Grid */}

                <PromptGrid
                  prompts={pagePrompts}
                  onEdit={handleEdit}
                  onDelete={activeView === "trash" ? handlePermanentDelete : handleDelete}
                  onFavorite={handleFavorite}
                  onPin={handlePin}
                  onCopy={handleCopy}
                  onDuplicate={handleDuplicate}
                  onView={setViewedPrompt}
                  onReorder={handleReorder}
                  selectedIds={selectedPromptIds}
                  onSelect={handleSelectionChange}
                  canReorder={
                    activeView !== "trash" &&
                    sort === "manual" &&
                    !search.trim() &&
                    category === "All" &&
                    filter === "all" &&
                    folderId === "All"
                  }
                  trashMode={activeView === "trash"}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                />
                {pageCount > 1 && (
                  <nav aria-label="Prompt pages" className="mt-7 flex items-center justify-center gap-3">
                    <button type="button" disabled={currentPage === 1} onClick={() => { setSelectedPromptIds([]); setPage(currentPage - 1); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Previous</button>
                    <span className="text-sm text-slate-500">Page {currentPage} of {pageCount}</span>
                    <button type="button" disabled={currentPage === pageCount} onClick={() => { setSelectedPromptIds([]); setPage(currentPage + 1); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Next</button>
                  </nav>
                )}
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
      {viewedPrompt && (
        <PromptDetailModal
          prompt={prompts.find((prompt) => prompt._id === viewedPrompt._id) || viewedPrompt}
          onClose={() => setViewedPrompt(null)}
          onCopy={handleCopy}
          onDuplicate={(prompt) => { setViewedPrompt(null); void handleDuplicate(prompt); }}
          onEdit={handleEdit}
          onFavorite={(id) => void handleFavorite(id)}
          onPin={(id) => void handlePin(id)}
        />
      )}
    </>
  );
}
