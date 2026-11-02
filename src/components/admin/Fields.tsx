import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/admin";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium tracking-wide text-graphite uppercase">{label}</Label>
      {children}
      {hint && <p className="text-xs text-graphite">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  type = "text",
  placeholder,
  className,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white"
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
  placeholder,
  className,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white"
      />
    </Field>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-mist bg-white px-3 py-2.5">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-graphite">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Comma-or-newline separated list edited as text; stored as string[]. */
export function ListField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  rows?: number;
}) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <Field label={label} hint={hint ?? "One per line"}>
      <Textarea
        rows={rows}
        value={text}
        className="bg-white"
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split(/\n/)
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
      />
    </Field>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  folder = "uploads",
  hint,
  aspect = "aspect-[4/3]",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: string;
  hint?: string;
  aspect?: string;
}) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function handle(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-mist bg-white",
          aspect,
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files);
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex flex-col items-center gap-2 p-6 text-sm text-graphite hover:text-ink"
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            {busy ? "Uploading…" : "Click or drop an image"}
          </button>
        )}
        {value && busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="text-xs text-radic-red hover:underline"
        >
          Replace image
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </Field>
  );
}

/** Multi-file picker that uploads each file and reports URLs as they finish. */
export function MultiImageUpload({
  folder,
  onUploaded,
}: {
  folder: string;
  onUploaded: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        urls.push(await uploadImage(f, folder));
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (urls.length) onUploaded(urls);
  }
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-mist bg-white p-6 text-sm text-graphite"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handle(e.dataTransfer.files);
      }}
    >
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex items-center gap-2 hover:text-ink"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        {busy ? `Uploading ${busy}…` : "Add gallery images (click or drop, several at once)"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
