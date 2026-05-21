import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/audit-service";

type ErrorPayload = {
  kind: "error" | "unhandledrejection";
  message: string;
  source?: string;
};

const signature = (payload: ErrorPayload) => `${payload.kind}:${payload.message}:${payload.source || ""}`;

export const useProductionErrorReporting = () => {
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const report = async (payload: ErrorPayload) => {
      const key = signature(payload);
      if (seen.current.has(key)) return;
      seen.current.add(key);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await logAuditEvent({
          user_id: session.user.id,
          event_type: "client_error",
          entity_type: "app_errors",
          metadata: {
            kind: payload.kind,
            message: payload.message,
            source: payload.source || null,
            path: window.location.pathname,
            user_agent: navigator.userAgent,
          },
        });
      } catch (error) {
        console.warn("Production error report failed:", error);
      }
    };

    const onError = (event: ErrorEvent) => {
      void report({
        kind: "error",
        message: event.message || "Unknown client error",
        source: event.filename || undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error
        ? event.reason.message
        : typeof event.reason === "string"
          ? event.reason
          : "Unhandled promise rejection";

      void report({
        kind: "unhandledrejection",
        message: reason,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
};
