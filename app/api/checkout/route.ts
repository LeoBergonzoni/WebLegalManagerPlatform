import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';
import {getServerSupabase, isSupabaseConfigured} from '@/lib/supabase/server';
import {ensureUserProfile} from '@/lib/users/ensureUserProfile';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const priceStarter = process.env.STRIPE_PRICE_STARTER;
const pricePro = process.env.STRIPE_PRICE_PRO;

const stripeConfigPresent = Boolean(
  stripeSecretKey && stripePublicKey && siteUrl && priceStarter && pricePro
);

export async function POST(request: NextRequest) {
  if (!stripeConfigPresent) {
    return NextResponse.json({ok: false, reason: 'STRIPE_NOT_CONFIGURED'}, {status: 503});
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({error: 'Auth is not configured'}, {status: 400});
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({error: 'Authentication not available'}, {status: 401});
  }

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  }

  const profile = await ensureUserProfile({supabase, authUser: {id: user.id, email: user.email}});

  if (!profile) {
    return NextResponse.json({error: 'Unable to load profile'}, {status: 500});
  }

  let payload: {plan?: string} = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({error: 'Invalid request payload'}, {status: 400});
  }

  const plan = payload.plan;
  if (plan !== 'starter' && plan !== 'pro') {
    return NextResponse.json({error: 'Invalid plan requested'}, {status: 400});
  }

  const priceId = plan === 'starter' ? priceStarter! : pricePro!;

  const stripe = new Stripe(stripeSecretKey!);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: profile.stripe_customer_id ?? undefined,
    customer_email: profile.stripe_customer_id ? undefined : user.email ?? undefined,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: `${siteUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
    metadata: {
      plan,
      auth_user_id: user.id,
      user_id: profile.id
    }
  });

  return NextResponse.json({url: session.url});
}
