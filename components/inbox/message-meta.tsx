import { formatFullDate } from "@/lib/format";
import { AddressSummary } from "@/components/inbox/address-summary";

/**
 * Debajo del asunto: quién lo mandó, a quiénes (resumidos si son muchos) y
 * la fecha completa. Lo usan el detalle de un recibido, el de un enviado y
 * cada mensaje desplegado de la conversación.
 */
export function MessageMeta({
  from,
  to,
  cc,
  bcc,
  date,
}: {
  /** Sin `from` (un enviado) arranca directo con "Para". */
  from?: { name: string; email: string };
  to: string;
  cc?: string;
  bcc?: string;
  date: string;
}) {
  return (
    <>
      <p className="text-xs text-gray-500">
        {from && (
          <>
            {from.name} &lt;{from.email}&gt; ·{" "}
          </>
        )}
        {to ? (
          <AddressSummary prefix={from ? "para" : "Para"} value={to} />
        ) : (
          `${from ? "para" : "Para"} (sin destinatarios visibles)`
        )}
        {cc && (
          <>
            {" "}
            · <AddressSummary prefix="cc" value={cc} />
          </>
        )}
        {bcc && (
          <>
            {" "}
            · <AddressSummary prefix="cco" value={bcc} />
          </>
        )}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">
        <time dateTime={date}>{formatFullDate(date)}</time>
      </p>
    </>
  );
}
