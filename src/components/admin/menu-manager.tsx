"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { ErrorNote, EmptyState } from "@/components/ui/feedback";
import { cn, formatINR } from "@/lib/utils";
import type { Category, Counter, MenuItem } from "@/lib/types/database";

const field =
  "h-11 w-full rounded-xl border border-hairline bg-white px-3.5 text-[15px] " +
  "placeholder:text-ink-4 focus:border-ink/20 focus:outline-none";

const DEMO_NOTE = "This is the demo — changes aren't saved. Sign in as an admin to edit the menu.";

export function MenuManager({
  counters,
  categories,
  items,
  demo = false,
}: {
  counters: Counter[];
  categories: Category[];
  items: MenuItem[];
  /** Walkthrough mode: every screen and dialog opens, nothing is written. */
  demo?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Availability is the one thing that changes several times a day, so it gets
  // a direct switch in the list rather than living inside the edit dialog.
  const [availability, setAvailability] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.is_available])),
  );
  const [pending, setPending] = useState<string | null>(null);

  async function toggleAvailability(item: MenuItem) {
    const next = !(availability[item.id] ?? item.is_available);
    setError(null);
    setPending(item.id);
    // Optimistic — the switch should never feel laggy.
    setAvailability((prev) => ({ ...prev, [item.id]: next }));

    if (demo) {
      setPending(null);
      return;
    }

    const { error: err } = await supabaseBrowser()
      .from("menu_items")
      .update({ is_available: next })
      .eq("id", item.id);

    if (err) {
      setAvailability((prev) => ({ ...prev, [item.id]: !next }));
      setError(friendlyError(err, "Couldn't update that item. Please try again."));
    }
    setPending(null);
  }

  async function deleteItem(item: MenuItem) {
    if (demo) {
      setError(DEMO_NOTE);
      return;
    }
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;

    // Archive rather than delete: past orders reference this row, and their
    // receipts must keep resolving.
    const { error: err } = await supabaseBrowser()
      .from("menu_items")
      .update({ is_archived: true, is_available: false })
      .eq("id", item.id);

    if (err) setError(friendlyError(err));
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Menu</h1>
          <p className="mt-0.5 text-[14px] text-ink-3">
            Items are routed to a counter through their category.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAddingCategory(true)}>
            New category
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
      </header>

      {error && <ErrorNote message={error} />}

      {categories.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No categories yet"
            body="Create a category first — it decides which counter its items are served from."
            action={<Button onClick={() => setAddingCategory(true)}>New category</Button>}
          />
        </div>
      ) : (
        categories.map((category) => {
          const categoryItems = items.filter((i) => i.category_id === category.id);
          const counter = counters.find((c) => c.id === category.counter_id);

          return (
            <section key={category.id}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-[15px] font-semibold tracking-tight">{category.name}</h2>
                <span className="text-[13px] text-ink-3">{counter?.name}</span>
              </div>

              {categoryItems.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-hairline px-4 py-6 text-center text-[14px] text-ink-3">
                  No items in this category.
                </p>
              ) : (
                <ul className="card divide-y divide-[color:var(--color-hairline)] overflow-hidden">
                  {categoryItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
                        {item.image_url ? (
                          <Image src={item.image_url} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <span className="grid h-full place-items-center text-base">🍛</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{item.name}</p>
                        <p className="truncate text-[13px] text-ink-3">
                          {formatINR(item.price)}
                          {item.description ? ` · ${item.description}` : ""}
                        </p>
                      </div>

                      {(() => {
                        const available = availability[item.id] ?? item.is_available;
                        return (
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={cn(
                                "hidden text-[12px] font-medium sm:block",
                                available ? "text-mint" : "text-ink-3",
                              )}
                            >
                              {available ? "Available" : "Out of stock"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={available}
                              aria-label={`${item.name} available`}
                              disabled={pending === item.id}
                              onClick={() => toggleAvailability(item)}
                              className={cn(
                                "press relative h-7 w-12 rounded-full transition-colors disabled:opacity-60",
                                available ? "bg-mint" : "bg-black/[0.12]",
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
                                  available ? "translate-x-[22px]" : "translate-x-0.5",
                                )}
                              />
                            </button>
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => setEditing(item)}
                        aria-label={`Edit ${item.name}`}
                        className="press grid size-9 place-items-center rounded-xl text-ink-3 hover:bg-black/[0.04]"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        aria-label={`Remove ${item.name}`}
                        className="press grid size-9 place-items-center rounded-xl text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      {editing && (
        <ItemDialog
          item={editing === "new" ? null : editing}
          categories={categories}
          demo={demo}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {addingCategory && (
        <CategoryDialog
          counters={counters}
          demo={demo}
          onClose={() => setAddingCategory(false)}
          onSaved={() => {
            setAddingCategory(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Dialog({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 sm:items-center sm:p-6">
      <div className="glass-strong rise max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl">
        <h2 className="mb-4 text-[19px] font-semibold tracking-tight">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ItemDialog({
  item,
  categories,
  onClose,
  onSaved,
  demo,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) {
      setError(DEMO_NOTE);
      return;
    }
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const supabase = supabaseBrowser();
    let imageUrl = item?.image_url ?? null;

    const file = form.get("image") as File | null;
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        setError("That image is larger than 5 MB. Please pick a smaller one.");
        setBusy(false);
        return;
      }
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        setError("We couldn't upload that image. Please try again.");
        setBusy(false);
        return;
      }
      imageUrl = supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      name: String(form.get("name")).trim(),
      description: String(form.get("description") ?? "").trim(),
      price: Number(form.get("price")),
      category_id: String(form.get("category_id")),
      is_available: form.get("is_available") === "on",
      image_url: imageUrl,
    };

    // counter_id is set by the database trigger from the category.
    const { error: err } = item
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert({ ...payload, counter_id: categories[0]!.counter_id });

    if (err) {
      setError(friendlyError(err, "We couldn't save that item."));
      setBusy(false);
      return;
    }
    onSaved();
  }

  return (
    <Dialog title={item ? "Edit item" : "Add item"}>
      <form onSubmit={save} className="space-y-3">
        <input name="name" required defaultValue={item?.name} placeholder="Item name" className={field} />
        <input
          name="description"
          defaultValue={item?.description}
          placeholder="Short description"
          className={field}
        />
        <input
          name="price"
          type="number"
          min="0"
          step="1"
          required
          defaultValue={item?.price}
          placeholder="Price in ₹"
          className={field}
        />
        <select name="category_id" required defaultValue={item?.category_id} className={field}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink-3">Photo (optional, max 5 MB)</span>
          <input name="image" type="file" accept="image/*" className="text-[13px]" />
        </label>

        <label className="flex items-center gap-2.5 py-1 text-[15px]">
          <input
            name="is_available"
            type="checkbox"
            defaultChecked={item?.is_available ?? true}
            className="size-4"
          />
          Available today
        </label>

        {error && <ErrorNote message={error} />}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={busy}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function CategoryDialog({
  counters,
  onClose,
  onSaved,
  demo,
}: {
  counters: Counter[];
  onClose: () => void;
  onSaved: () => void;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) {
      setError(DEMO_NOTE);
      return;
    }
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const { error: err } = await supabaseBrowser().from("categories").insert({
      name: String(form.get("name")).trim(),
      counter_id: String(form.get("counter_id")),
    });

    if (err) {
      setError(friendlyError(err, "We couldn't create that category."));
      setBusy(false);
      return;
    }
    onSaved();
  }

  return (
    <Dialog title="New category">
      <form onSubmit={save} className="space-y-3">
        <input name="name" required placeholder="Category name" className={field} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink-3">Served from</span>
          <select name="counter_id" required className={field}>
            {counters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {error && <ErrorNote message={error} />}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={busy}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
