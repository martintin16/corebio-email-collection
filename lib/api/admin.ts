import type { AdminUser, AdminMailbox } from "@/lib/types/admin";

/**
 * TODO: igual que lib/api/mail.ts — reemplazar por fetch real al backend
 * de NestJS (endpoints /users y /mailboxes) cuando exista. Las vistas que
 * consumen estas funciones no deberían necesitar cambios.
 */

const MOCK_USERS: AdminUser[] = [
  {
    id: "usr_1",
    name: "María Gómez",
    email: "maria@gmail.com",
    role: "admin",
    status: "active",
    mailboxAccess: [
      { mailboxId: "mbx_1", email: "secretaria@corebio.org", canSend: true, canRead: true },
      { mailboxId: "mbx_2", email: "tesoreria@corebio.org", canSend: true, canRead: true },
    ],
  },
  {
    id: "usr_2",
    name: "Juan Pérez",
    email: "juanp@gmail.com",
    role: "user",
    status: "active",
    mailboxAccess: [
      { mailboxId: "mbx_1", email: "secretaria@corebio.org", canSend: true, canRead: true },
    ],
  },
  {
    id: "usr_3",
    name: "Lucía Fernández",
    email: "lucia.fer@gmail.com",
    role: "user",
    status: "invited",
    mailboxAccess: [
      { mailboxId: "mbx_2", email: "tesoreria@corebio.org", canSend: false, canRead: true },
    ],
  },
  {
    id: "usr_4",
    name: "Marcos Díaz",
    email: "marcos.d@gmail.com",
    role: "user",
    status: "inactive",
    mailboxAccess: [
      { mailboxId: "mbx_1", email: "secretaria@corebio.org", canSend: false, canRead: true },
    ],
  },
];

const MOCK_MAILBOXES: AdminMailbox[] = [
  {
    id: "mbx_1",
    email: "secretaria@corebio.org",
    displayName: "Secretaría Corebio",
    connectedUsersCount: 3,
    status: "connected",
  },
  {
    id: "mbx_2",
    email: "tesoreria@corebio.org",
    displayName: "Tesorería Corebio",
    connectedUsersCount: 2,
    status: "needs_reconnect",
  },
];

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getUsers(): Promise<AdminUser[]> {
  return delay(MOCK_USERS);
}

export async function getMailboxConnections(): Promise<AdminMailbox[]> {
  return delay(MOCK_MAILBOXES);
}
