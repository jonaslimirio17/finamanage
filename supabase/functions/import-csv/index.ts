import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseResult {
  inserted: number;
  duplicates: number;
  failed_rows: number;
  errors: string[];
}

// Generate unique hash for transaction deduplication using Web Crypto API
async function generateTransactionHash(profileId: string, date: string, amount: number, description: string): Promise<string> {
  const data = `${profileId}${date}${amount}${description}`;
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Normalize date to ISO format
function normalizeDate(dateStr: string): string | null {
  try {
    // Try various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Normalize amount to decimal
function normalizeAmount(amountStr: string): number | null {
  try {
    // Remove currency symbols, spaces, and convert comma to dot
    const cleaned = amountStr.replace(/[R$\s€£¥]/g, '').replace(',', '.');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  } catch {
    return null;
  }
}

// Normalize currency code
function normalizeCurrency(currencyStr: string): string {
  const currencyMap: Record<string, string> = {
    'real': 'BRL',
    'reais': 'BRL',
    'r$': 'BRL',
    'brl': 'BRL',
    'usd': 'USD',
    'dollar': 'USD',
    'euro': 'EUR',
    'eur': 'EUR',
  };
  
  const normalized = currencyStr.toLowerCase().trim();
  return currencyMap[normalized] || currencyStr.toUpperCase() || 'BRL';
}

// Parse OFX file
function parseOFX(content: string): any[] {
  const transactions = [];
  
  // Simple OFX parsing - match STMTTRN blocks
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  
  while ((match = trnRegex.exec(content)) !== null) {
    const trnBlock = match[1];
    
    // Extract fields
    const dateMatch = trnBlock.match(/<DTPOSTED>(\d{8})/);
    const amountMatch = trnBlock.match(/<TRNAMT>([-\d.]+)/);
    const memoMatch = trnBlock.match(/<MEMO>(.*?)<\//);
    const nameMatch = trnBlock.match(/<NAME>(.*?)<\//);
    
    if (dateMatch && amountMatch) {
      const dateStr = dateMatch[1];
      const date = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
      const amount = parseFloat(amountMatch[1]);
      
      transactions.push({
        date,
        amount: Math.abs(amount),
        merchant: nameMatch ? nameMatch[1].trim() : (memoMatch ? memoMatch[1].trim() : 'Unknown'),
        description: memoMatch ? memoMatch[1].trim() : '',
        type: amount >= 0 ? 'credit' : 'debit',
        currency: 'BRL'
      });
    }
  }
  
  return transactions;
}

// Parse CSV file
function parseCSV(content: string, filename: string): { headers: string[], rows: any[], isValid: boolean, error?: string } {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [], isValid: false, error: 'Empty file' };
  }
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate minimum required headers
  const requiredHeaders = ['date', 'amount'];
  const hasRequiredHeaders = requiredHeaders.every(req => 
    headers.some(h => h.includes(req) || req.includes(h))
  );
  
  if (!hasRequiredHeaders) {
    return { 
      headers, 
      rows: [], 
      isValid: false, 
      error: `Missing required headers. Need at least: ${requiredHeaders.join(', ')}. Found: ${headers.join(', ')}` 
    };
  }
  
  // Map header indices
  const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('data'));
  const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('valor') || h.includes('value'));
  const descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('descri') || h.includes('memo'));
  const merchantIndex = headers.findIndex(h => h.includes('merchant') || h.includes('estabelecimento') || h.includes('name'));
  const currencyIndex = headers.findIndex(h => h.includes('currency') || h.includes('moeda'));
  const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('categoria'));
  const typeIndex = headers.findIndex(h => h.includes('type') || h.includes('tipo'));
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    
    if (parts.length < 2) continue;
    
    const date = dateIndex >= 0 ? parts[dateIndex] : '';
    const amount = amountIndex >= 0 ? parts[amountIndex] : '';
    const description = descriptionIndex >= 0 ? parts[descriptionIndex] : '';
    const merchant = merchantIndex >= 0 ? parts[merchantIndex] : (description || 'Unknown');
    const currency = currencyIndex >= 0 ? parts[currencyIndex] : 'BRL';
    const category = categoryIndex >= 0 ? parts[categoryIndex] : '';
    const type = typeIndex >= 0 ? parts[typeIndex] : 'debit';
    
    rows.push({
      date,
      amount,
      description,
      merchant,
      currency,
      category,
      type,
      raw: lines[i]
    });
  }
  
  return { headers, rows, isValid: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Import CSV function called");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("User authenticated");

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 5MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size);

    const fileContent = await file.text();
    const filename = file.name;
    
    const result: ParseResult = {
      inserted: 0,
      duplicates: 0,
      failed_rows: 0,
      errors: []
    };
    
    // Detect file type and parse accordingly
    let parsedTransactions: any[] = [];
    
    if (filename.toLowerCase().endsWith('.ofx')) {
      console.log("Detected OFX file");
      parsedTransactions = parseOFX(fileContent);
      
      if (parsedTransactions.length === 0) {
        result.errors.push("No transactions found in OFX file");
      }
    } else {
      // Parse as CSV
      console.log("Parsing as CSV");
      const csvData = parseCSV(fileContent, filename);
      
      if (!csvData.isValid) {
        return new Response(
          JSON.stringify({ 
            error: csvData.error || 'Invalid CSV format',
            ...result
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Normalize CSV data
      parsedTransactions = csvData.rows.map(row => ({
        date: row.date,
        amount: row.amount,
        merchant: row.merchant,
        description: row.description,
        currency: row.currency,
        category: row.category,
        type: row.type,
        raw: row.raw
      }));
    }
    
    console.log(`Parsed ${parsedTransactions.length} transactions`);

    // Validate row count (max 10,000 rows)
    const MAX_ROWS = 10000;
    if (parsedTransactions.length > MAX_ROWS) {
      return new Response(
        JSON.stringify({ 
          error: `File contains ${parsedTransactions.length} transactions. Maximum allowed is ${MAX_ROWS} transactions per upload.`,
          ...result
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create import account
    let { data: accounts } = await supabaseClient
      .from('accounts')
      .select('id')
      .eq('profile_id', user.id)
      .eq('provider', 'csv_import')
      .limit(1);

    let accountId: string;

    if (!accounts || accounts.length === 0) {
      console.log("Creating new import account");
      const { data: newAccount, error: accountError } = await supabaseClient
        .from('accounts')
        .insert({
          profile_id: user.id,
          provider: 'csv_import',
          provider_account_id: 'csv-import-default',
          account_type: 'imported',
          balance: 0
        })
        .select()
        .single();

      if (accountError) {
        console.error("Error creating account");
        throw new Error('Failed to create account');
      }
      accountId = newAccount.id;
    } else {
      accountId = accounts[0].id;
    }

    console.log("Using account ID:", accountId);

    // Process each transaction
    for (const txn of parsedTransactions) {
      try {
        // Normalize data
        const normalizedDate = normalizeDate(txn.date);
        const normalizedAmount = normalizeAmount(String(txn.amount));
        const normalizedCurrency = normalizeCurrency(txn.currency || 'BRL');
        
        if (!normalizedDate || normalizedAmount === null) {
          result.failed_rows++;
          result.errors.push(`Invalid data in row: date=${txn.date}, amount=${txn.amount}`);
          continue;
        }
        
        // Generate deduplication hash
        const transactionHash = await generateTransactionHash(
          user.id,
          normalizedDate,
          normalizedAmount,
          txn.description || txn.merchant || ''
        );
        
        // Check for duplicates
        const { data: existing } = await supabaseClient
          .from('transactions')
          .select('id')
          .eq('provider_transaction_id', transactionHash)
          .limit(1);
        
        if (existing && existing.length > 0) {
          result.duplicates++;
          continue;
        }
        
        // Insert transaction
        const { error: insertError } = await supabaseClient
          .from('transactions')
          .insert({
            profile_id: user.id,
            account_id: accountId,
            provider_transaction_id: transactionHash,
            date: normalizedDate,
            amount: normalizedAmount,
            currency: normalizedCurrency,
            merchant: txn.merchant || 'Unknown',
            raw_description: txn.raw || txn.description || '',
            category: txn.category || null,
            type: txn.type?.toLowerCase() === 'credit' ? 'credit' : 'debit',
            imported_from: `csv:${filename}`
          });
        
        if (insertError) {
          console.error("Error inserting transaction");
          result.failed_rows++;
          result.errors.push('Failed to insert transaction');
        } else {
          result.inserted++;
        }
        
      } catch (error) {
        console.error("Error processing transaction");
        result.failed_rows++;
        result.errors.push('Transaction processing failed');
      }
    }

    console.log(`Import complete: ${result.inserted} inserted, ${result.duplicates} duplicates, ${result.failed_rows} failed`);

    // Log the import event with detailed summary
    await supabaseClient.from('events_logs').insert({
      profile_id: user.id,
      event_type: 'csv_import_completed',
      payload: {
        filename: filename,
        total_rows: parsedTransactions.length,
        inserted: result.inserted,
        duplicates: result.duplicates,
        failed_rows: result.failed_rows,
        errors: result.errors.slice(0, 10) // Limit errors logged
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          total_rows: parsedTransactions.length,
          inserted: result.inserted,
          duplicates: result.duplicates,
          failed_rows: result.failed_rows,
          errors: result.errors
        },
        message: `Successfully processed ${parsedTransactions.length} transactions: ${result.inserted} inserted, ${result.duplicates} duplicates, ${result.failed_rows} failed`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in import-csv function");
    return new Response(
      JSON.stringify({ error: 'Failed to import file' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
