import Link from "next/link";

export default function MailboxNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-gray-900">No encontramos lo que buscabas</p>
      <p className="max-w-[280px] text-xs text-gray-500">
        La casilla o el mensaje no existen, o no tenés acceso.
      </p>
      <Link
        href="/inbox"
        className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
      >
        Volver a la bandeja
      </Link>
    </div>
  );
}
