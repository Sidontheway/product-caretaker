import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProductThumbnail({
  name,
  imageUrl,
  size = "size-10",
}: {
  name: string;
  imageUrl?: string | null;
  size?: string;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!imageUrl) {
    return (
      <div
        className={`${size} shrink-0 overflow-hidden rounded-lg bg-panel/70 ring-1 ring-ink/10 grid place-items-center`}
        aria-label={`${name} image`}
      >
        <span className="font-display text-sm font-semibold text-ink/35">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPreviewOpen(true)}
        className={`${size} shrink-0 overflow-hidden rounded-lg bg-panel/70 ring-1 ring-ink/10 grid place-items-center cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ink`}
        aria-label={`View larger image of ${name}`}
      >
        <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
      </button>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl bg-panel/95 p-4 sm:p-6">
          <DialogTitle className="sr-only">{name} image</DialogTitle>
          <img src={imageUrl} alt={name} className="max-h-[75vh] w-full rounded-lg object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
