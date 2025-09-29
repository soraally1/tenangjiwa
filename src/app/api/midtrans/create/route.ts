import { NextRequest, NextResponse } from 'next/server';
import { adminDb, AdminFieldValue } from '@/app/service/firebaseAdmin';

// Ensure Node.js runtime for firebase-admin compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Midtrans endpoints
const MIDTRANS_BASE_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userEmail,
      userName,
      doctorId,
      doctorName,
      selectedDate, // ISO string
      selectedTimes, // string[]
      amount, // number in IDR
    } = body || {};

    if (!process.env.MIDTRANS_SERVER_KEY) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY missing' }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY missing' }, { status: 500 });
    }

    if (!userId || !userEmail || !userName || !doctorId || !doctorName || !selectedDate || !Array.isArray(selectedTimes) || !amount) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Create pending record in Firestore
    const paymentRef = adminDb.collection('payments').doc(orderId);
    await paymentRef.set({
      orderId,
      userId,
      userEmail,
      userName,
      doctorId,
      doctorName,
      selectedDate,
      selectedTimes,
      amount,
      status: 'pending',
      createdAt: AdminFieldValue.serverTimestamp(),
      updatedAt: AdminFieldValue.serverTimestamp(),
    });

    // Build Midtrans payload
    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: userName,
        email: userEmail,
      },
      item_details: [
        {
          id: doctorId,
          price: amount / Math.max(selectedTimes.length, 1),
          quantity: Math.max(selectedTimes.length, 1),
          name: `Konsultasi ${doctorName}`,
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || ''}/konsultasi`,
      },
    } as const;

    const authHeader = 'Basic ' + Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64');

    const res = await fetch(MIDTRANS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(midtransPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Midtrans error', detail: errText }, { status: 500 });
    }

    const data = await res.json();
    // data contains token and redirect_url
    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url, orderId });
  } catch (error) {
    const message = (error instanceof Error) ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


