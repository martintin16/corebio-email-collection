function SkeletonRow() {
  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3">
        <div className="mb-1.5 h-3 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-14 animate-pulse rounded-full bg-gray-100" />
      </td>
      <td className="px-4 py-3" />
    </tr>
  );
}

export default function AdminUsersLoading() {
  return (
    <div className="p-6">
      <div className="mb-4 h-8 w-40 animate-pulse rounded bg-gray-100" />
      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
