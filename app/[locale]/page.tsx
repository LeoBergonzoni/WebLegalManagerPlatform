import LandingPageContent from './LandingPageContent';

export default function LandingPage() {
  const stripeEnabled = Boolean(
    process.env.STRIPE_PUBLIC_KEY &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_STARTER &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.NEXT_PUBLIC_SITE_URL
  );

  return <LandingPageContent stripeEnabled={stripeEnabled} />;
}
