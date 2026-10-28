import Link from "next/link";

/** 404 general, en castellano (las casillas inexistentes tienen el suyo en inbox/[mailboxId]). */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-gray-900">No encontramos esta página</p>
      <p className="max-w-[300px] text-xs text-gray-500">
        Puede que el link esté mal escrito o que la página ya no exista.
      </p>
      <Link href="/inbox" className="text-sm font-medium text-primary-700 hover:underline">
        Ir a la bandeja
      </Link>
    </div>
  );
}
