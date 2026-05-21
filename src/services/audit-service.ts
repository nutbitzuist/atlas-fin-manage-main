import type { Json, TablesInsert } from "@/integrations/supabase/types";
import { insertAuditEvent } from "@/data/audit-queries";

export type AuditEventInput = Omit<TablesInsert<"audit_events">, "metadata"> & {
  metadata?: Json;
};

export async function logAuditEvent(event: AuditEventInput) {
  try {
    await insertAuditEvent(event);
  } catch (error) {
    console.warn("Audit event was not recorded:", error);
  }
}
