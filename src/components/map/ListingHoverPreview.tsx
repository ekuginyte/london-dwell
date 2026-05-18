import { useEffect, useState } from "react";

type Preview = {
  title?: string;
  description?: string;
  image?: string;
  publisher?: string;
};

// Lightweight, key-free preview via microlink.io's free tier.
// Returns OpenGraph data + screenshot for any public URL — works around
// Rightmove/Zoopla's X-Frame-Options DENY headers that block direct iframes.
const cache = new Map<string, Preview | null>();

export function ListingHoverPreview({ url }: { url: string }) {
  const [data, setData] = useState<Preview | null | undefined>(cache.get(url));
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (data !== undefined) return;
    let cancelled = false;
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.status !== "success") {
          setErr(true);
          cache.set(url, null);
          return;
        }
        const p: Preview = {
          title: j.data?.title,
          description: j.data?.description,
          image: j.data?.image?.url || j.data?.screenshot?.url,
          publisher: j.data?.publisher,
        };
        cache.set(url, p);
        setData(p);
      })
      .catch(() => {
        if (!cancelled) {
          setErr(true);
          cache.set(url, null);
        }
      });
    return () => { cancelled = true; };
  }, [url, data]);

  if (err) {
    return (
      <a href={url} target="_blank" rel="noopener" className="text-xs text-primary underline">
        Open listing ↗
      </a>
    );
  }

  if (!data) {
    return (
      <div className="w-[260px] h-[160px] rounded-xl bg-muted animate-pulse" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="block w-[280px] rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition"
    >
      {data.image && (
        <div className="w-full h-[140px] bg-muted overflow-hidden">
          <img src={data.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {data.publisher || new URL(url).hostname.replace("www.", "")}
        </div>
        <div className="text-sm font-semibold leading-snug mt-0.5 line-clamp-2">
          {data.title || "Listing"}
        </div>
        {data.description && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {data.description}
          </div>
        )}
      </div>
    </a>
  );
}
