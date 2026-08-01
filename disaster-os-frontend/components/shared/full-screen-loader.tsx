/**
 * Full-screen loading state.
 *
 * Used wherever we need to block rendering until something app-wide
 * resolves (auth state on first load, primarily). Kept here in
 * components/shared rather than components/layout because it's generic
 * enough to be reused outside the dashboard shell too (e.g. a future
 * full-page data fetch).
 */
export function FullScreenLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
