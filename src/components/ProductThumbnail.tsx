export function ProductThumbnail({
  name,
  imageUrl,
  size = "size-10",
}: {
  name: string;
  imageUrl?: string | null;
  size?: string;
}) {
  return (
    <div
      className={`${size} shrink-0 overflow-hidden rounded-lg bg-panel/70 ring-1 ring-ink/10 grid place-items-center`}
      aria-label={`${name} image`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
      ) : (
        <span className="font-display text-sm font-semibold text-ink/35">
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}
