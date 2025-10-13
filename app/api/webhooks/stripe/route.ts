import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';
import {createServiceSupabaseClient, isSupabaseServiceConfigured} from '@/lib/supabase/service';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const priceStarter = process.env.STRIPE_PRICE_STARTER;
const pricePro = process.env.STRIPE_PRICE_PRO;

const stripeConfigured = Boolean(stripeSecretKey && webhookSecret);

export async function POST(request: NextRequest) {
  if (!stripeConfigured) {
    // Skip processing if Stripe is not configured; acknowledge to avoid retries.
    return NextResponse.json({received: true});
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({error: 'Missing signature'}, {status: 400});
  }

  const stripe = new Stripe(stripeSecretKey!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (error) {
    return NextResponse.json({error: `Webhook signature verification failed: ${(error as Error).message}`}, {status: 400});
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({received: true});
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata ?? {};
        const authUserId = metadata.auth_user_id;
        const plan = metadata.plan;
        const userId = metadata.user_id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

        if (authUserId && plan && userId) {
          await supabase
            .from('users')
            .update({
              plan,
              billing_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId
            })
            .eq('auth_user_id', authUserId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price?.id;

        let plan: string | null = null;
        if (priceId) {
          if (priceId === priceStarter) {
            plan = 'starter';
          } else if (priceId === pricePro) {
            plan = 'pro';
          }
        }

        const updatePayload: Record<string, string | null> = {
          billing_status: status,
          stripe_subscription_id: subscription.id
        };

        if (plan) {
          updatePayload.plan = plan;
        }

        await supabase
          .from('users')
          .update(updatePayload)
          .eq('stripe_customer_id', customerId);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 500});
  }

  return NextResponse.json({received: true});
}
