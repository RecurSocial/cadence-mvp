import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Simple CSV parser for Excel files (works for .xlsx exported as CSV)
function parseCSV(csv: string) {
  const lines = csv.trim().split('\n');
  const headers = lines[0]?.split(',').map(h => h.trim()) || [];
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

async function supabaseRequest(method: string, table: string, body?: unknown) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const errorMsg = typeof data === 'string' ? data : JSON.stringify(data);
    console.error(`[EXCEL] ${method} ${table} error: ${errorMsg}`);
    throw new Error(`HTTP ${response.status}: ${errorMsg}`);
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[EXCEL] Upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const org_id = formData.get('org_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Read file as text
    const fileText = await file.text();
    console.log(`[EXCEL] Read file: ${file.name}, size: ${fileText.length} bytes`);

    // Parse CSV data
    const rows = parseCSV(fileText);
    console.log(`[EXCEL] Parsed ${rows.length} rows from file`);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows in file' }, { status: 400 });
    }

    // Determine what type of data this is based on headers
    const firstRow = rows[0];
    const headers = Object.keys(firstRow);
    console.log('[EXCEL] Headers:', headers);

    let counts = { practitioners: 0, services: 0, certifications: 0 };

    // Check if this looks like practitioners data
    if (headers.includes('first_name') || headers.includes('First Name')) {
      console.log('[EXCEL] Detected practitioner data');
      const practitioners = rows.map(row => ({
        org_id,
        first_name: row.first_name || row['First Name'] || '',
        last_name: row.last_name || row['Last Name'] || '',
        role: row.role || row['Role'] || '',
        approval_level: row.approval_level || row['Approval Level'] || 'staff',
        is_active: true,
      })).filter(p => p.first_name);

      if (practitioners.length > 0) {
        await supabaseRequest('POST', 'practitioners', practitioners);
        counts.practitioners = practitioners.length;
        console.log(`[EXCEL] Created ${practitioners.length} practitioners`);
      }
    }

    // Check if this looks like services data
    if (headers.includes('category') || headers.includes('Category')) {
      console.log('[EXCEL] Detected services data');
      const services = rows.map(row => ({
        org_id,
        category: row.category || row['Category'] || '',
        name: row.name || row['Name'] || '',
        product: row.product || row['Product'] || '',
        supplier: row.supplier || row['Supplier'] || '',
        duration_minutes: parseInt(row.duration_minutes || row['Duration (min)'] || '30'),
        price: row.price || row['Price'] || '',
      })).filter(s => s.name);

      if (services.length > 0) {
        await supabaseRequest('POST', 'services', services);
        counts.services = services.length;
        console.log(`[EXCEL] Created ${services.length} services`);
      }
    }

    console.log('[EXCEL] ✅ Import complete!');

    return NextResponse.json({
      success: true,
      message: `Imported ${counts.practitioners} practitioners and ${counts.services} services`,
      counts,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[EXCEL] ❌ Fatal error:', errorMsg);
    return NextResponse.json(
      { 
        error: errorMsg,
        success: false,
      },
      { status: 500 }
    );
  }
}
