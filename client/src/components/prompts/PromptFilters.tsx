import {
  FiFilter,
  FiSearch,
  FiStar,
  FiX,
} from "react-icons/fi";

import {
  CATEGORIES,
  type Category,
} from "../../types/prompt";

export type PromptFilter = "all" | "favorites" | "pinned";

export type PromptSort =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc";

interface PromptFiltersProps {
  search: string;
  category: Category | "All";
  filter: PromptFilter;
  sort: PromptSort;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: Category | "All") => void;
  onFilterChange: (value: PromptFilter) => void;
  onSortChange: (value: PromptSort) => void;
  onClear: () => void;
}

export default function PromptFilters({
  search,
  category,
  filter,
  sort,
  onSearchChange,
  onCategoryChange,
  onFilterChange,
  onSortChange,
  onClear,
}: PromptFiltersProps) {
  const hasFilters =
    search.trim() !== "" ||
    category !== "All" ||
    filter !== "all" ||
    sort !== "newest";

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <FiSearch
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search prompts..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Category */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FiFilter
              size={16}
              className="shrink-0 text-slate-400"
            />

            <select
              value={category}
              onChange={(event) =>
                onCategoryChange(
                  event.target.value as Category | "All"
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="All">All Categories</option>

              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* View filter */}
          <div className="grid grid-cols-3 rounded-lg border border-slate-200 bg-slate-50 p-1 lg:w-auto">
            <button
              type="button"
              onClick={() => onFilterChange("all")}
              className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => onFilterChange("favorites")}
              className={`flex items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition ${
                filter === "favorites"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FiStar size={13} />
              Favorites
            </button>

            <button
              type="button"
              onClick={() => onFilterChange("pinned")}
              className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                filter === "pinned"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pinned
            </button>
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as PromptSort)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
          </select>

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}