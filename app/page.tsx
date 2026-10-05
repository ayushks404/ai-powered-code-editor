// Server Component — no 'use client' needed
import EditorClient from '@/components/EditorClient';

export default function Home() {
  return (
    <main className="h-full w-full bg-[#1e1e1e] overflow-hidden">
      <EditorClient />
    </main>
  );
}
