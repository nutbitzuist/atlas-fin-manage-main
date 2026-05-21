import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log("Starting duplicate transaction cleanup...");

  // Fetch all transactions (might need to batch if huge, but let's assume it's manageable for now)
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching transactions:", error);
    return;
  }

  console.log(`Analyzing ${transactions.length} transactions...`);

  const seen = new Set();
  const duplicates = [];

  for (const t of transactions) {
    // Composite key: userId | type | amount | date | (merchant or source)
    const identifier = t.merchant || t.source || 'unnamed';
    const key = `${t.user_id}|${t.type}|${t.amount}|${t.transaction_date}|${identifier.toLowerCase().trim()}`;

    if (seen.has(key)) {
      duplicates.push(t.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicates.length === 0) {
    console.log("No duplicates found.");
    return;
  }

  console.log(`Found ${duplicates.length} duplicate transactions. Deleting...`);

  // Delete in batches of 100
  for (let i = 0; i < duplicates.length; i += 100) {
    const batch = duplicates.slice(i, i + 100);
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`Error deleting batch ${i/100}:`, deleteError);
    } else {
      console.log(`Deleted batch ${i/100 + 1}/${Math.ceil(duplicates.length / 100)}`);
    }
  }

  console.log("Cleanup complete!");
}

cleanupDuplicates();
