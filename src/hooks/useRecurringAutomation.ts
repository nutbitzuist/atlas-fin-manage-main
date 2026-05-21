import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  dedupeActiveRecurringTemplates,
  getBillByTemplateForUser,
  getBillsByUserId,
} from "@/services/bill-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { useToast } from "@/hooks/use-toast";
import { payBill, upsertBillFromTransaction } from "@/services/bill-service";
import { toLocalDateInput } from "@/utils/date";

/**
 * Hook to automatically process recurring bills that have passed their due date.
 */
export const useRecurringAutomation = () => {
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    const runAutomation = async () => {
      // Prevent multiple runs in same session/mount
      if (processedRef.current) return;
      processedRef.current = true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. One-time Migration: Find existing recurring transactions that aren't in Bills yet
      await dedupeActiveRecurringTemplates(user.id);

      const recurringTransactions = await getTransactionsByUserId(user.id, {
        isRecurring: true,
        orderBy: "transaction_date",
        ascending: false,
      });

      if (recurringTransactions && recurringTransactions.length > 0) {
        // Use a Set to track unique name+type combinations we've already checked/created
        const seenTemplates = new Set();
        
        for (const tx of recurringTransactions) {
          const name = (tx.merchant || tx.source || "").trim().toLowerCase();
          if (!name) continue;
          const key = `${name}-${tx.type}`;
          
          if (seenTemplates.has(key)) continue;
          seenTemplates.add(key);

          // Check if a bill template already exists for this transaction
          const existingBill = await getBillByTemplateForUser(user.id, name, tx.type);

          if (!existingBill) {
            // Create a bill automation template based on this historical transaction
            await upsertBillFromTransaction(
              tx,
              'monthly',
              tx.type as 'expense' | 'income',
              user.id,
            );
          }
        }
      }

      let totalProcessed = 0;
      let hasProcessed = true;

      // Outer loop to handle multiple bills
      // Inner processing handles multi-month catch-up for a single recurring rule
      while (hasProcessed) {
        hasProcessed = false;
        
        // Fetch pending auto-pay bills whose due date is in the past
        const todayStr = toLocalDateInput(new Date());
        const bills = await getBillsByUserId(user.id, {
          autoPay: true,
          isPaid: false,
          dueDateBefore: todayStr,
        });

        if (!bills || bills.length === 0) break;

        // Process the oldest one
        // We do it one by one to ensure the "next occurrence" is also checked correctly
        const bill = bills[0];
        const result = await payBill(bill.id, user.id, bill.account_id);
        
        if (result.success) {
          totalProcessed++;
          hasProcessed = true; // Loop back and check for more, or the next instance
        }
      }

      if (totalProcessed > 0) {
        toast({
          title: "Recurring Items Processed",
          description: `Automatically recorded ${totalProcessed} recurring income/expense item${totalProcessed > 1 ? 's' : ''} that were due.`,
          duration: 5000,
        });
      }
    };

    // Run after a small delay to not block initial render
    const timeout = setTimeout(runAutomation, 2000);
    return () => clearTimeout(timeout);
  }, [toast]);
};
