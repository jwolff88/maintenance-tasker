import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { billingApi } from '../services/api';
import { useMutation } from '@tanstack/react-query';

interface Feature {
  name: string;
  basic: boolean;
  premium: boolean;
  business: boolean;
  category?: string;
}

const features: Feature[] = [
  // Core Features - All Tiers
  { name: 'Clock in/out', basic: true, premium: true, business: true, category: 'Core Features' },
  { name: 'Shifts and job scheduling', basic: true, premium: true, business: true },
  { name: 'Absence Management', basic: true, premium: true, business: true },
  { name: 'Geofencing/GPS tracking', basic: true, premium: true, business: true },
  { name: 'Payroll Integration', basic: true, premium: true, business: true },
  { name: 'Resource onboarding', basic: true, premium: true, business: true },
  { name: 'Sales/Order collecting', basic: true, premium: true, business: true },
  { name: 'PDF Report Designer', basic: true, premium: true, business: true },
  { name: 'Dashboard & Analytics', basic: true, premium: true, business: true },
  { name: 'API Access', basic: true, premium: true, business: true },

  // Premium Features
  { name: 'Task management', basic: false, premium: true, business: true, category: 'Advanced Features' },
  { name: 'Recurring tasks', basic: false, premium: true, business: true },
  { name: 'Work approval process', basic: false, premium: true, business: true },
  { name: 'Workflow generator', basic: false, premium: true, business: true },
  { name: 'Inventory management', basic: false, premium: true, business: true },
  { name: 'Document management', basic: false, premium: true, business: true },
  { name: 'Video chat with customer', basic: false, premium: true, business: true },
  { name: 'Customer surveys', basic: false, premium: true, business: true },

  // Business Features
  { name: 'Bidding Marketplace', basic: false, premium: false, business: true, category: 'Enterprise Features' },
  { name: 'Employee Ranking', basic: false, premium: false, business: true },
  { name: 'Work orders', basic: false, premium: false, business: true },
  { name: 'Appointment/Self-booking', basic: false, premium: false, business: true },
  { name: 'SLA management', basic: false, premium: false, business: true },
  { name: 'Vendor management', basic: false, premium: false, business: true },
  { name: 'Smart routing', basic: false, premium: false, business: true },
  { name: 'Project management', basic: false, premium: false, business: true },
  { name: 'End-customer Ticketing', basic: false, premium: false, business: true },

  // Limits
  { name: 'Up to 10 properties', basic: true, premium: false, business: false, category: 'Limits' },
  { name: 'Up to 50 properties', basic: false, premium: true, business: false },
  { name: 'Unlimited properties', basic: false, premium: false, business: true },
  { name: 'Up to 3 team members', basic: true, premium: false, business: false },
  { name: 'Up to 10 team members', basic: false, premium: true, business: false },
  { name: 'Unlimited team members', basic: false, premium: false, business: true },
  { name: '100 tasks/month', basic: true, premium: false, business: false },
  { name: 'Unlimited tasks', basic: false, premium: true, business: true },

  // Support
  { name: 'Email support', basic: true, premium: true, business: true, category: 'Support' },
  { name: 'Priority support', basic: false, premium: true, business: true },
  { name: 'Dedicated account manager', basic: false, premium: false, business: true },
  { name: 'Custom integrations', basic: false, premium: false, business: true },
  { name: 'SLA guarantee', basic: false, premium: false, business: true },
];

const plans = [
  {
    id: 'STARTER',
    name: 'BASIC',
    price: 49,
    headerBg: 'bg-slate-800',
    headerText: 'text-white',
    buttonBg: 'bg-slate-800 hover:bg-slate-700',
    buttonText: 'text-white',
  },
  {
    id: 'PRO',
    name: 'PREMIUM',
    price: 149,
    headerBg: 'bg-purple-200',
    headerText: 'text-purple-900',
    buttonBg: 'bg-purple-500 hover:bg-purple-600',
    buttonText: 'text-white',
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'BUSINESS',
    price: 349,
    headerBg: 'bg-amber-400',
    headerText: 'text-amber-900',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
    buttonText: 'text-white',
  },
];

export default function PricingTable() {
  const { user } = useAuth();

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => billingApi.createCheckout(plan),
    onSuccess: (data) => {
      if (data.data.url) {
        window.location.href = data.data.url;
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Checkout failed';
      alert(`Error: ${message}`);
    },
  });

  const handleApply = (planId: string) => {
    if (!user) {
      window.location.href = '/register';
      return;
    }
    checkoutMutation.mutate(planId);
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        {/* Header */}
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="bg-gray-100 p-4 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
              Features
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                className={`${plan.headerBg} ${plan.headerText} p-4 text-center font-bold text-lg border-b-2 border-gray-200 relative`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div>{plan.name}</div>
                <div className="text-2xl mt-1">
                  ${plan.price}
                  <span className="text-sm font-normal">/mo</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {features.map((feature, index) => (
            <>
              {feature.category && (
                <tr key={`category-${feature.category}`}>
                  <td
                    colSpan={4}
                    className="bg-gray-200 p-3 font-semibold text-gray-700 text-sm uppercase tracking-wide"
                  >
                    {feature.category}
                  </td>
                </tr>
              )}
              <tr
                key={feature.name}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="p-4 text-gray-700 border-b border-gray-100">
                  {feature.name}
                </td>
                <td className="p-4 text-center border-b border-gray-100">
                  {feature.basic && (
                    <Check
                      className="w-5 h-5 text-green-500 mx-auto"
                      aria-label="Included"
                    />
                  )}
                </td>
                <td className="p-4 text-center border-b border-gray-100">
                  {feature.premium && (
                    <Check
                      className="w-5 h-5 text-green-500 mx-auto"
                      aria-label="Included"
                    />
                  )}
                </td>
                <td className="p-4 text-center border-b border-gray-100">
                  {feature.business && (
                    <Check
                      className="w-5 h-5 text-green-500 mx-auto"
                      aria-label="Included"
                    />
                  )}
                </td>
              </tr>
            </>
          ))}
        </tbody>

        {/* Footer with Apply Buttons */}
        <tfoot>
          <tr>
            <td className="p-4 bg-gray-100"></td>
            {plans.map((plan) => (
              <td key={plan.id} className="p-4 bg-gray-100 text-center">
                <button
                  onClick={() => handleApply(plan.id)}
                  disabled={checkoutMutation.isPending}
                  className={`${plan.buttonBg} ${plan.buttonText} px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
                >
                  {checkoutMutation.isPending ? 'Loading...' : 'Apply!'}
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
