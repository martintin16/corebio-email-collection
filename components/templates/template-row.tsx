"use client";

import { ActionsMenu, ActionsMenuItem } from "@/components/ui/actions-menu";
import { EditIcon, CopyIcon, TrashIcon } from "@/components/icons";
import type { MessageTemplate } from "@/lib/types/template";

const DAY = 24 * 60 * 60 * 1000;
const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Día del calendario en Argentina, como número (para restar días). */
function dayNumber(date: Date): number {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: AR_TIME_ZONE }).format(date); // 2026-10-28
  return Math.round(Date.parse(`${ymd}T00:00:00Z`) / DAY);
}

// "hoy", "ayer", "hace 2 días" hasta una semana; después, la fecha corta ("12 oct").
// Por día del calendario, no por horas: algo de anoche a las 23 es "ayer"
// aunque hayan pasado menos de 24 horas.
function formatEdited(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const days = dayNumber(new Date()) - dayNumber(date);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date)
    .replace(".", "");
}

interface TemplateRowProps {
  template: MessageTemplate;
  disabled?: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function TemplateRow({ template, disabled, onEdit, onDuplicate, onDelete }: TemplateRowProps) {
  const when = template.updatedAt ? formatEdited(template.updatedAt) : null;
  const meta = [template.updatedByName ? `Editada por ${template.updatedByName}` : null, when]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-2 border-t border-gray-200 first:border-t-0">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="min-w-0 flex-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
      >
        <span className="block truncate text-sm font-medium text-gray-900">{template.name}</span>
        <span className="mt-0.5 block truncate text-xs text-gray-500">{template.preview}</span>
        {meta && <span className="mt-1 block truncate text-[11px] text-gray-400">{meta}</span>}
      </button>
      <div className="shrink-0 pr-3">
        <ActionsMenu label={`Acciones para ${template.name}`}>
          <ActionsMenuItem icon={EditIcon} onClick={onEdit} disabled={disabled}>
            Editar
          </ActionsMenuItem>
          <ActionsMenuItem icon={CopyIcon} onClick={onDuplicate} disabled={disabled}>
            Duplicar
          </ActionsMenuItem>
          <ActionsMenuItem icon={TrashIcon} danger onClick={onDelete} disabled={disabled}>
            Eliminar
          </ActionsMenuItem>
        </ActionsMenu>
      </div>
    </li>
  );
}
