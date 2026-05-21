import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log("Starting duplicate transaction cleanup...");

  // Fetch all transactions
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
    // Composite key: userId | type | amount | date | identifier (merchant/source)
    const identifier = (t.merchant || t.source || 'unnamed').toLowerCase().trim();
    const key = `${t.user_id}|${t.type}|${t.amount}|${t.transaction_date}|${identifier}`;

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

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .in('id', duplicates);

  if (deleteError) {
    console.error(`Error deleting duplicates:`, deleteError);
  } else {
    console.log(`Successfully deleted ${duplicates.length} duplicates.`);
  }

  console.log("Cleanup complete!");
}

cleanupDuplicates();
