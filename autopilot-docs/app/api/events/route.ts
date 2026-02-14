import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.type) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
    }
    const supabase = getServerClient();
    const enriched = {
      ...body,
      receivedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('events').insert(enriched);
    if (error) {
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to store event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
