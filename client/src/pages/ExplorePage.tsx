import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiCopy, FiPlus, FiTrendingUp } from "react-icons/fi";
import toast from "react-hot-toast";
import { apiClient } from "../services/apiClient";
import { CATEGORIES, type Category, type ExplorePrompt } from "../types/prompt";

interface ExplorePageProps {
  search: string;
  onSave: (prompt: ExplorePrompt) => Promise<void>;
}

const PAGE_SIZE = 9;

export default function ExplorePage({ search, onSave }: ExplorePageProps) {
  const [category, setCategory] = useState<Category | "All">("All");
  const [tag, setTag] = useState("");
  const [prompts, setPrompts] = useState<ExplorePrompt[]>([]);
  const [completedRequest, setCompletedRequest] = useState("");
  const [requestError, setRequestError] = useState<{ key: string; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "title">("newest");
  const [retryKey, setRetryKey] = useState(0);
  const requestKey = JSON.stringify([search.trim(), category, tag, retryKey]);
  const loading = completedRequest !== requestKey;
  const error = requestError?.key === requestKey ? requestError.message : null;

  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/explore", {
        params: {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(category !== "All" ? { category } : {}),
          ...(tag ? { tag } : {}),
        },
        signal: controller.signal,
      })
      .then((response) => {
        setPrompts(response.data.data as ExplorePrompt[]);
        setRequestError(null);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          requestError &&
          typeof requestError === "object" &&
          "response" in requestError &&
          requestError.response &&
          typeof requestError.response === "object" &&
          "data" in requestError.response &&
          requestError.response.data &&
          typeof requestError.response.data === "object" &&
          "message" in requestError.response.data
            ? String(requestError.response.data.message)
            : "Public prompts could not be loaded. Please try again.";
        setRequestError({ key: requestKey, message });
      })
      .finally(() => {
        if (!controller.signal.aborted) setCompletedRequest(requestKey);
      });

    return () => controller.abort();
  }, [requestKey, search, category, tag]);

  const tags = useMemo(
    () => [...new Set(prompts.flatMap((prompt) => prompt.tags))].sort(),
    [prompts],
  );
  const sortedPrompts = useMemo(
    () =>
      [...prompts].sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [prompts, sort],
  );
  const pageCount = Math.max(1, Math.ceil(sortedPrompts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visiblePrompts = sortedPrompts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const copyPrompt = async (prompt: ExplorePrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Clipboard access is unavailable in this browser");
    }
  };

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300">
            <FiTrendingUp size={14} /> PUBLIC PROMPT LIBRARY
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Explore prompts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Discover useful public workflows and add the ones you like to your private library.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <FiBookOpen size={15} /> Only public prompts are shown here
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="explore-category">Filter by category</label>
          <select
            id="explore-category"
            value={category}
            onChange={(event) => { setPage(1); setCategory(event.target.value as Category | "All"); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label className="sr-only" htmlFor="explore-sort">Sort public prompts</label>
          <select
            id="explore-sort"
            value={sort}
            onChange={(event) => { setPage(1); setSort(event.target.value as "newest" | "title"); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="newest">Recently added</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Popular tags</span>
            {tags.slice(0, 12).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={tag === item}
                onClick={() => { setPage(1); setTag(tag === item ? "" : item); }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${tag === item ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-700"}`}
              >
                #{item}
              </button>
            ))}
            {tag &&             <button type="button" onClick={() => { setPage(1); setTag(""); }} className="text-xs font-medium text-slate-500 underline">Clear tag</button>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading public prompts">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />)}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-semibold">We couldn’t load Explore</p><p className="mt-1">{error}</p>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-3 font-semibold underline">Try again</button>
        </div>
      ) : sortedPrompts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <FiBookOpen className="mx-auto text-slate-400" size={26} />
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No public prompts found</h2>
          <p className="mt-2 text-sm text-slate-500">Try another search, category, or tag.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
            <p>{sortedPrompts.length} public prompt{sortedPrompts.length === 1 ? "" : "s"}</p>
            <p>Page {currentPage} of {pageCount}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePrompts.map((prompt) => (
              <article key={prompt._id} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-900">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{prompt.category}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${prompt.isSample ? "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
                    {prompt.isSample ? "Curated sample" : "Public prompt"}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold leading-6 text-slate-900 dark:text-white">{prompt.title}</h2>
                {prompt.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{prompt.description}</p>}
                <div className="mt-4 flex-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{prompt.content}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {prompt.tags.slice(0, 4).map((promptTag) => <span key={promptTag} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">#{promptTag}</span>)}
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button type="button" onClick={() => void onSave(prompt)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                    <FiPlus size={16} /> Add to my prompts
                  </button>
                  <button type="button" onClick={() => void copyPrompt(prompt)} aria-label={`Copy ${prompt.title}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <FiCopy size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {pageCount > 1 && (
            <nav aria-label="Explore pages" className="mt-7 flex items-center justify-center gap-3">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700">Previous</button>
              <span className="text-sm text-slate-500">Page {currentPage} of {pageCount}</span>
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700">Next</button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
