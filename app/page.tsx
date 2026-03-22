import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">MicroBiz Toolbox</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        One place to manage leads, proposals, invoices, and payments.
      </p>
      <div className="flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/login">
          Log in
        </Link>
        <Link className="rounded-md border px-4 py-2" href="/register">
          Register
        </Link>
      </div>
    </main>
  );
}
