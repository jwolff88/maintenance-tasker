import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Hexagon, Wrench } from 'lucide-react';
import PricingTable from '../components/PricingTable';

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-forest bg-glow-spotlight">
      {/* Circuitry background overlay */}
      <div className="fixed inset-0 bg-circuitry bg-parallax-slow pointer-events-none opacity-50" />

      {/* Header */}
      <div className="relative z-10 border-b border-bronze/30" style={{ background: 'rgba(1, 11, 10, 0.95)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <Hexagon className="w-10 h-10 text-viridian animate-pulse-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-forest" />
                </div>
              </div>
              <span className="text-xl font-bold text-viridian font-orbitron glow-viridian-text">MAINT HUB</span>
            </Link>
            {user ? (
              <Link to="/settings" className="btn-secondary">
                Back to App
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Start Free Trial
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-viridian font-orbitron mb-4 glow-viridian-text">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-viridian/60 max-w-2xl mx-auto mb-2">
          Start with a 14-day free trial. No credit card required.
        </p>
        <div className="inline-flex items-center gap-2 bg-viridian/10 text-viridian border border-viridian/30 px-4 py-2 rounded-full">
          <Check className="w-5 h-5" />
          <span>14-day free trial included</span>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="relative z-10 card-holo mx-4 lg:mx-auto max-w-6xl mb-8">
        <PricingTable />
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 border-t border-bronze/30" style={{ background: 'rgba(1, 11, 10, 0.8)' }}>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-viridian font-orbitron text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="card-holo">
              <h3 className="font-semibold text-viridian mb-2">
                What happens after my trial ends?
              </h3>
              <p className="text-viridian/60">
                After your 14-day trial, you'll need to choose a plan to continue using the platform.
                Your data is preserved, and you can pick up right where you left off.
              </p>
            </div>
            <div className="card-holo">
              <h3 className="font-semibold text-viridian mb-2">
                Can I change plans later?
              </h3>
              <p className="text-viridian/60">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                with prorated billing adjustments.
              </p>
            </div>
            <div className="card-holo">
              <h3 className="font-semibold text-viridian mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-viridian/60">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div className="card-holo">
              <h3 className="font-semibold text-viridian mb-2">
                Do you offer annual billing?
              </h3>
              <p className="text-viridian/60">
                Yes, contact us for annual billing options with additional discounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
