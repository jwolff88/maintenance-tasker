import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { billingApi } from '../services/api';
import { Check, Building2, Zap, Crown } from 'lucide-react';

export default function Pricing() {
  const { user } = useAuth();

  const { data: pricing } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => billingApi.getPricing().then((res) => res.data),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((res) => res.data),
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => billingApi.createCheckout(plan),
    onSuccess: (data) => {
      if (data.data.url) {
        window.location.href = data.data.url;
      }
    },
  });

  const handleUpgrade = (planId: string) => {
    if (!user) {
      window.location.href = '/register';
      return;
    }
    checkoutMutation.mutate(planId);
  };

  const planIcons: Record<string, any> = {
    STARTER: Building2,
    PRO: Zap,
    ENTERPRISE: Crown,
  };

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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start with a 14-day free trial. No credit card required.
          Upgrade anytime as your portfolio grows.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {pricing?.plans?.map((plan: any) => {
            const Icon = planIcons[plan.id] || Building2;
            const isCurrentPlan = subscription?.plan === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                  isPopular ? 'border-primary-500' : 'border-gray-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                      isPopular ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isPopular ? 'text-primary-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 font-medium"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={checkoutMutation.isPending}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isPopular
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {checkoutMutation.isPending ? 'Loading...' : user ? 'Upgrade Now' : 'Start Free Trial'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trial Info */}
        {pricing?.trial && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
              <Check className="w-5 h-5" />
              <span>
                {pricing.trial.days}-day free trial with {pricing.trial.limits.properties} properties, {pricing.trial.limits.users} users
              </span>
            </div>
          </div>
        )}
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
