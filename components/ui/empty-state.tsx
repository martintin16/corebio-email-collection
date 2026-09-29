import type { ComponentType, ReactNode, SVGProps } from "react";

interface EmptyStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="mb-1.5 text-sm font-medium text-gray-900">{title}</p>
      <p className="mb-4 max-w-[280px] text-xs leading-relaxed text-gray-500">{description}</p>
      {action}
    </div>
  );
}
