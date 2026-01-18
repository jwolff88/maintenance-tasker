import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Building2 } from 'lucide-react';
import PricingTable from '../components/PricingTable';

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">Maintenance Tasker</span>
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
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          Start with a 14-day free trial. No credit card required.
        </p>
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
          <Check className="w-5 h-5" />
          <span>14-day free trial included</span>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <PricingTable />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white border-t">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my trial ends?
              </h3>
              <p className="text-gray-600">
                After your 14-day trial, you'll need to choose a plan to continue using the platform.
                Your data is preserved, and you can pick up right where you left off.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                with prorated billing adjustments.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer annual billing?
              </h3>
              <p className="text-gray-600">
                Yes, contact us for annual billing options with additional discounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
