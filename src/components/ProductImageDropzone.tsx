import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function ProductImageDropzone({
  name,
  imageUrl,
  onFileChange,
}: {
  name: string;
  imageUrl: string;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file: File | null) => {
    if (!file) {
      onFileChange(null);
      return;
    }
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) return;
    onFileChange(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0] ?? null);
  };

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
        Product image
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg px-3 py-4 text-center cursor-pointer ring-1 transition-colors ${
          isDragging ? "bg-mint/10 ring-mint" : "bg-panel/70 ring-ink/10 hover:bg-panel"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || "Selected product"}
            className="mx-auto size-16 rounded-lg object-cover ring-1 ring-ink/10"
          />
        ) : (
          <Upload className="mx-auto size-5 text-ink/45" aria-hidden="true" />
        )}
        <p className="mt-2 text-xs font-medium">Drop an image here or browse</p>
        <p className="mt-1 text-[11px] text-ink/45">PNG, JPG, WEBP or GIF up to 5 MB.</p>
      </div>
    </div>
  );
}
