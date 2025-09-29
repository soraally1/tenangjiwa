import { NextRequest, NextResponse } from 'next/server';
import { adminDb, AdminFieldValue } from '@/app/service/firebaseAdmin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import crypto from 'crypto';

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

    const paymentRef = adminDb.collection('payments').doc(order_id);

    // Update payment status based on transaction_status
    let status = 'pending';
    if (transaction_status === 'capture' || transaction_status === 'settlement') status = 'paid';
    else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') status = 'failed';

    await paymentRef.set({
      orderId: order_id,
    }, { merge: true });

    await paymentRef.update({
      status,
      updatedAt: AdminFieldValue.serverTimestamp(),
      gatewayPayload: body,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}


