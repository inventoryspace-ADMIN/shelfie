import Link from "next/link";
import { CreateSpaceForm } from "@/components/dashboard/CreateSpaceForm";

export default function NewSpacePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 underline">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-medium tracking-wide">
          Create a space
        </h1>
      </div>
      <CreateSpaceForm />
    </main>
  );
}
