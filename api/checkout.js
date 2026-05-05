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
    const { items, total, discountAmount, promoCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items array' });
    }
    
    // Use the total if provided (with discount applied), otherwise calculate from items
    let finalAmount = total;
    if (!finalAmount) {
      finalAmount = items.reduce((sum, item) => sum + parseInt(item.price.replace('$', '')), 0);
    }
    
    // Create a single line item with the final amount (includes discount)
    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: promoCode ? `ClubNests Order (${promoCode} Applied)` : 'ClubNests Order'
        },
        unit_amount: finalAmount * 100
      },
      quantity: 1
    }];
    
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
