"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ThreadMessage } from "@/lib/types/mail";
import { threadSegments } from "@/lib/conversation";
import { ThreadMessageItem } from "@/components/inbox/thread-message-item";

/**
 * La conversación completa en el detalle de un mail: los otros mensajes del
 * hilo colapsados y el abierto completo (`children`, lo arma la página), en
 * orden de fecha. Con más de 5, los del medio se juntan en "N mensajes más".
 * Con un solo mensaje (o si no se pudo traer el hilo) muestra solo
 * `children`, igual que antes.
 */
export function Conversation({
  mailboxId,
  thread,
  currentId,
  children,
}: {
  mailboxId: string;
  thread: ThreadMessage[];
  currentId: string;
  children: ReactNode;
}) {
  const currentIndex = thread.findIndex((m) => m.id === currentId);
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<number>>(new Set());
  const currentRef = useRef<HTMLLIElement>(null);
  const isConversation = thread.length > 1 && currentIndex >= 0;

  // Si el abierto no es el primero, que quede a la vista (hilos largos).
  useEffect(() => {
    if (isConversation && currentIndex > 0) currentRef.current?.scrollIntoView({ block: "start" });
  }, [isConversation, currentIndex, currentId]);

  if (!isConversation) return <>{children}</>;

  return (
    <>
      <p className="mb-3 text-xs text-gray-400">{thread.length} mensajes</p>
      <ol className="space-y-2" aria-label="Conversación">
        {threadSegments(thread.length, currentIndex).map((segment) => {
          if (segment.kind === "hidden") {
            const groupKey = segment.indexes[0]!;
            if (!expandedGroups.has(groupKey)) {
              return (
                <li key={`group-${groupKey}`}>
                  <button
                    type="button"
                    onClick={() => setExpandedGroups((prev) => new Set(prev).add(groupKey))}
                    className="w-full rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-center text-xs text-gray-500 hover:bg-gray-50"
                  >
                    {segment.indexes.length} mensajes más
                  </button>
                </li>
              );
            }
            return segment.indexes.map((index) => (
              <ThreadMessageItem key={thread[index]!.id} mailboxId={mailboxId} message={thread[index]!} />
            ));
          }
          const message = thread[segment.index]!;
          if (segment.index === currentIndex) {
            return (
              <li key={message.id} ref={currentRef} className="scroll-mt-4 rounded-md border border-gray-300 p-4">
                {children}
              </li>
            );
          }
          return <ThreadMessageItem key={message.id} mailboxId={mailboxId} message={message} />;
        })}
      </ol>
    </>
  );
}
