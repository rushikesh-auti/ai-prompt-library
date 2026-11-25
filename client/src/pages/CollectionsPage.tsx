import { useState, type FormEvent } from "react";
import { FiArrowLeft, FiFolder, FiPlus, FiTrash2 } from "react-icons/fi";
import type { PromptCollection, CollectionInput } from "../types/collection";
import type { Prompt } from "../types/prompt";

interface CollectionsPageProps {
  kind: "collection" | "folder";
  collections: PromptCollection[];
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  onCreate: (data: CollectionInput) => Promise<void>;
  onUpdate: (id: string, data: Partial<CollectionInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CollectionsPage({
  kind,
  collections,
  prompts,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: CollectionsPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const selected = collections.find((collection) => collection._id === selectedId);

  const startCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const startEdit = (collection: PromptCollection) => {
    setEditingId(collection._id);
    setName(collection.name);
    setDescription(collection.description);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const data = {
      name: name.trim(),
      description: description.trim(),
      prompts: [],
      kind,
    };
    if (editingId) {
      await onUpdate(editingId, { name: data.name, description: data.description });
      setEditingId(null);
    } else {
      await onCreate(data);
      setName("");
      setDescription("");
    }
  };

  const togglePrompt = (id: string) =>
    setSelectedPromptIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">Organize your work</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{kind === "folder" ? "Folders" : "Collections"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {kind === "folder"
            ? "Place each prompt in a single folder; deleting a folder never deletes its prompts."
            : "Group your private prompts into focused workflows."}
        </p>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</div>}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
          <div>
            {selected ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <button type="button" onClick={() => setSelectedId(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"><FiArrowLeft size={16} /> All {kind === "folder" ? "folders" : "collections"}</button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.description || "Prompts saved to this collection."}</p></div>
                  <button type="button" onClick={() => startEdit(selected)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Edit details</button>
                </div>
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Choose prompts</h3>
                  {prompts.length === 0 ? <p className="mt-3 text-sm text-slate-500">Create a prompt before adding it to a collection.</p> : (
                    <div className="mt-3 max-h-[440px] space-y-2 overflow-y-auto">
                      {prompts.map((prompt) => (
                        <label key={prompt._id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-violet-300 dark:border-slate-700 dark:hover:border-violet-800">
                          <input type="checkbox" checked={selectedPromptIds.includes(prompt._id)} onChange={() => togglePrompt(prompt._id)} className="mt-1 accent-violet-600" />
                          <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{prompt.title}</span><span className="mt-1 block text-xs text-slate-500">{prompt.category}</span></span>
                        </label>
                      ))}
                    </div>
                  )}
                  <button type="button" disabled={selectedPromptIds.length > 500} onClick={() => void onUpdate(selected._id, { prompts: selectedPromptIds })} className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">Save prompts</button>
                </div>
              </div>
            ) : collections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {collections.map((collection) => (
                  <article key={collection._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"><FiFolder size={19} /></div>
                      <button type="button" onClick={() => { if (window.confirm(`Delete “${collection.name}”? Prompts will remain in your library.`)) void onDelete(collection._id); }} aria-label={`Delete ${collection.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><FiTrash2 size={16} /></button>
                    </div>
                    <h2 className="mt-4 truncate text-base font-semibold text-slate-900 dark:text-white">{collection.name}</h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{collection.description || "A collection of your prompts."}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{collection.prompts.length} prompt{collection.prompts.length === 1 ? "" : "s"}</span>
                      <button type="button" onClick={() => { setSelectedPromptIds(collection.prompts.filter((id) => prompts.some((prompt) => prompt._id === id))); setSelectedId(collection._id); setEditingId(null); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/50">Open {kind}</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                <FiFolder className="mx-auto text-slate-400" size={26} /><h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Your {kind === "folder" ? "folders" : "collections"} start here</h2><p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Create a {kind} to keep related prompts organized. Your prompts stay private to your account.</p>
              </div>
            )}
          </div>

          <form onSubmit={(event) => void submit(event)} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center gap-2">{!editingId && <FiPlus className="text-violet-600" size={17} />}<h2 className="font-semibold text-slate-900 dark:text-white">{editingId ? `Edit ${kind}` : `New ${kind}`}</h2></div>
            <label htmlFor="collection-name" className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input id="collection-name" required minLength={2} maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Product launch" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <label htmlFor="collection-description" className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea id="collection-description" maxLength={200} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs in this collection?" className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <div className="mt-4 flex gap-2">
              <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">{editingId ? "Save changes" : `Create ${kind}`}</button>
              {editingId && <button type="button" onClick={startCreate} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
