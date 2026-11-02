import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { PageHeader } from "./Shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { moveItem, useDeleteRow, useReorder, useRows, useSaveRow, type Row } from "@/lib/admin";
import { cn } from "@/lib/utils";

type Props<T extends Row> = {
  table: string;
  title: string;
  text?: string;
  itemName: string;
  defaults: Omit<T, "id">;
  /** Compact summary of a row in the list. */
  render: (row: T) => ReactNode;
  /** Thumbnail or icon shown at the left of each row. */
  leading?: (row: T) => ReactNode;
  /** Form body; mutate the draft via setDraft. */
  form: (draft: Partial<T>, set: (patch: Partial<T>) => void) => ReactNode;
  /** Name of the boolean column that controls public visibility, if any. */
  visibleKey?: keyof T & string;
  validate?: (draft: Partial<T>) => string | null;
};

export function CrudList<T extends Row>({
  table,
  title,
  text,
  itemName,
  defaults,
  render,
  leading,
  form,
  visibleKey,
  validate,
}: Props<T>) {
  const rows = useRows<T>(table);
  const save = useSaveRow<T>(table);
  const del = useDeleteRow(table);
  const reorder = useReorder(table);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [confirm, setConfirm] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [editing]);

  const list = rows.data ?? [];

  function move(i: number, dir: -1 | 1) {
    const next = moveItem(list, i, i + dir);
    reorder.mutate(next.map((r) => r.id));
  }

  async function submit() {
    if (!editing) return;
    const err = validate?.(editing) ?? null;
    if (err) {
      setError(err);
      return;
    }
    const payload: Partial<T> = { ...editing };
    if (!payload.id && !("sort_order" in payload && payload.sort_order !== undefined)) {
      (payload as Row).sort_order = list.length;
    }
    await save.mutateAsync(payload);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title={title}
        text={text}
        action={
          <Button onClick={() => setEditing({ ...(defaults as Partial<T>) })}>
            <Plus /> New {itemName}
          </Button>
        }
      />

      {rows.isLoading ? (
        <p className="text-sm text-graphite">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white p-10 text-center text-sm text-graphite">
          No {itemName}s yet. Add the first one.
        </div>
      ) : (
        <ul className="divide-y divide-mist overflow-hidden rounded-xl border border-mist bg-white">
          {list.map((row, i) => {
            const visible = visibleKey ? Boolean(row[visibleKey]) : true;
            return (
              <li
                key={row.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 md:px-4",
                  !visible && "opacity-60",
                )}
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="rounded p-1 text-graphite hover:bg-muted disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={i === list.length - 1}
                    onClick={() => move(i, 1)}
                    className="rounded p-1 text-graphite hover:bg-muted disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                {leading && <div className="shrink-0">{leading(row)}</div>}
                <div className="min-w-0 flex-1 text-sm">{render(row)}</div>
                {visibleKey && (
                  <Switch
                    checked={visible}
                    onCheckedChange={(v) =>
                      save.mutate({ id: row.id, [visibleKey]: v } as Partial<T>)
                    }
                    aria-label="Visible on site"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing({ ...row })}
                  aria-label="Edit"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirm(row)}
                  aria-label="Delete"
                  className="text-destructive"
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing?.id ? `Edit ${itemName}` : `New ${itemName}`}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {form(editing, (patch) =>
                setEditing((d) => ({ ...(d ?? {}), ...patch }) as Partial<T>),
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {itemName}?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirm) del.mutate(confirm.id);
                setConfirm(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
