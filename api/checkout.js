const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, total, promoCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    let finalAmount = total;
    if (!finalAmount) {
      finalAmount = items.reduce((sum, item) => sum + parseInt(item.price.replace('$', '')), 0);
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: promoCode ? `ClubNests Order (${promoCode} Applied)` : 'ClubNests Order'
          },
          unit_amount: finalAmount * 100
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://clubnests.vercel.app',
      cancel_url: 'https://clubnests.vercel.app'
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
