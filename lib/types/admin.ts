import type { AppRole } from "@/lib/auth/session";

export type UserStatus = "active" | "invited" | "inactive";

export interface MailboxAccessSummary {
  mailboxId: string;
  email: string;
  canSend: boolean;
  canRead: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: UserStatus;
  mailboxAccess: MailboxAccessSummary[];
}

export type MailboxConnectionStatus = "connected" | "needs_reconnect";

export interface AdminMailbox {
  id: string;
  email: string;
  displayName: string;
  connectedUsersCount: number;
  status: MailboxConnectionStatus;
}
