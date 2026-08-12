import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-medium tracking-wide">Shelfie</h1>
      <p className="text-sm text-neutral-500">Under construction.</p>
      <div className="flex gap-4 text-sm">
        <Link href="/sign-up" className="underline">
          Sign up
        </Link>
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}
