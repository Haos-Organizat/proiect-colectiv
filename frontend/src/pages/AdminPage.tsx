import { Seo } from '@/components/Seo';

export function AdminPage() {
  return (
    <div className="mx-auto grid max-w-[1200px] justify-items-start gap-4 px-4 py-16 md:px-8">
      <Seo title="Admin" noindex />
      <p className="type-label text-primary-text">Admin</p>
      <h1 className="type-h2">Admin panel</h1>
      <p className="max-w-[50ch] text-muted-foreground">Organizer requests will show up here.</p>
    </div>
  );
}
