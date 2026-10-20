export default function TemplatesLoading() {
  return (
    <div className="p-6">
      <div className="mb-4 h-8 w-40 animate-pulse rounded bg-gray-100" />
      <div className="overflow-hidden rounded-md border border-gray-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-t border-gray-200 px-4 py-3 first:border-t-0">
            <div className="mb-1.5 h-3 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-2.5 w-64 max-w-full animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
