import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";

export type AuditEventInput = Omit<TablesInsert<"audit_events">, "metadata"> & {
  metadata?: Json;
};

export async function insertAuditEvent(event: AuditEventInput) {
  const { error } = await supabase.from("audit_events").insert({
    ...event,
    metadata: event.metadata ?? {},
  });

  if (error) throw error;
}
