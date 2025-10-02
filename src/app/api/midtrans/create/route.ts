import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Midtrans endpoints
const MIDTRANS_BASE_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Midtrans Create Transaction ===');
    const body = await req.json();
    console.log('Request body:', body);
    
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
      console.error('MIDTRANS_SERVER_KEY is missing');
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY missing' }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
      console.error('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is missing');
      return NextResponse.json({ error: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY missing' }, { status: 500 });
    }

    if (!userId || !userEmail || !userName || !doctorId || !doctorName || !selectedDate || !Array.isArray(selectedTimes) || !amount) {
      console.error('Invalid payload:', { userId, userEmail, userName, doctorId, doctorName, selectedDate, selectedTimes, amount });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

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

    console.log('Sending to Midtrans:', MIDTRANS_BASE_URL);
    console.log('Payload:', JSON.stringify(midtransPayload, null, 2));

    const res = await fetch(MIDTRANS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(midtransPayload),
    });

    console.log('Midtrans response status:', res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Midtrans error response:', errText);
      return NextResponse.json({ error: 'Midtrans error', detail: errText }, { status: 500 });
    }

    const data = await res.json();
    console.log('Midtrans success:', data);
    // data contains token and redirect_url
    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url, orderId });
  } catch (error) {
    console.error('API Error:', error);
    const message = (error instanceof Error) ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message, stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}


