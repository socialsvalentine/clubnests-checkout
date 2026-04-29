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
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    // Convert items to line items
    const line_items = [];
    
    for (let item of items) {
      const priceNum = parseInt(item.price.replace('$', ''));
      
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name
          },
          unit_amount: priceNum * 100
        },
        quantity: 1
      });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: 'payment',
      success_url: 'https://clubnests-site.vercel.app/',
      cancel_url: 'https://clubnests-site.vercel.app/'
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
