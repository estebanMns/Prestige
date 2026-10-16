import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap grid min-h-[70vh] place-items-center text-center">
      <div>
        <div className="eyebrow">Error 404</div>
        <h1 className="my-4 text-5xl">Esta página no existe</h1>
        <Link href="/" className="btn">
          Volver a la tienda
        </Link>
      </div>
    </main>
  );
}
