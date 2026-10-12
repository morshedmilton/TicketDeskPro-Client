"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/lib/ui-helpers";

interface FileDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

const ALLOWED_EXTENSIONS = [".jpg", ".png", ".gif", ".pdf", ".docx", ".xlsx", ".txt"]; // BR-010
const MAX_SIZE = 5 * 1024 * 1024; // BR-009

/** Drag-and-drop upload with the backend's rules enforced client-side too. */
export function FileDropzone({ files, onChange, maxFiles = 5 }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(incoming: File[]) {
    setError(null);
    const accepted: File[] = [...files];
    for (const file of incoming) {
      if (accepted.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files per ticket.`);
        break;
      }
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setError(`"${file.name}" is not an allowed type (${ALLOWED_EXTENSIONS.join(", ")}).`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" exceeds the 5MB limit.`);
        continue;
      }
      accepted.push(file);
    }
    onChange(accepted);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload files: drag here or press Enter to browse. Max ${maxFiles} files, 5MB each.`}
      >
        <CloudUpload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Drag files here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Up to {maxFiles} files, 5MB each · {ALLOWED_EXTENSIONS.join(", ")}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={(e) => {
            accept(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
