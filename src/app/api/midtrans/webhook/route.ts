import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key,
    } = body || {};

    if (!process.env.MIDTRANS_SERVER_KEY) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY missing' }, { status: 500 });
    }

    // Verify signature
    const toSign = `${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
    const expected = crypto.createHash('sha512').update(toSign).digest('hex');
    if (expected !== signature_key) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Webhook verified - you can process the payment status here
    // For now, we'll just log it
    console.log('Payment webhook received:', {
      order_id,
      transaction_status,
      status_code,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


