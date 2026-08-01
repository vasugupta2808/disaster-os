"use client";


export default function AdminPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-1">System configuration and management</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Admin dashboard features coming soon.
      </div>
    </div>
  );
}
