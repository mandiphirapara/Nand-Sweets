import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const token = parts[parts.length - 1];
  
  const fileName = `receipt-${token}.pdf`;
  
  // Construct the Supabase public URL
  const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
  
  // Redirect the user's browser directly to the PDF, bypassing browser cache
  return NextResponse.redirect(`${data.publicUrl}?t=${Date.now()}`);
}
