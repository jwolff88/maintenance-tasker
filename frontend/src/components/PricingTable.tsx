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
  { name: 'Property management', basic: true, premium: true, business: true, category: 'Core Features' },
  { name: 'Dashboard & Analytics', basic: true, premium: true, business: true },
  { name: 'Maintenance tickets', basic: true, premium: true, business: true },
  { name: 'Lease tracking', basic: true, premium: true, business: true },
  { name: 'Property notes (4 categories)', basic: true, premium: true, business: true },
  { name: 'Inspections scheduling', basic: true, premium: true, business: true },
  { name: 'Equipment tracking', basic: true, premium: true, business: true },
  { name: 'AI ticket triage', basic: true, premium: true, business: true },

  // Professional Features
  { name: 'Asset management', basic: false, premium: true, business: true, category: 'Professional Features' },
  { name: 'Task management', basic: false, premium: true, business: true },
  { name: 'Recurring tasks', basic: false, premium: true, business: true },
  { name: 'Task lifecycle workflow', basic: false, premium: true, business: true },
  { name: 'Photo evidence uploads', basic: false, premium: true, business: true },
  { name: 'Time tracking with GPS', basic: false, premium: true, business: true },
  { name: 'Inventory management', basic: false, premium: true, business: true },
  { name: 'Unit turnover tracking', basic: false, premium: true, business: true },

  // Enterprise Features
  { name: 'Team analytics & leaderboards', basic: false, premium: false, business: true, category: 'Enterprise Features' },
  { name: 'Vendor management', basic: false, premium: false, business: true },
  { name: 'Capital expenditure planning', basic: false, premium: false, business: true },
  { name: 'Tenant portal', basic: false, premium: false, business: true },
  { name: 'Technician assignments', basic: false, premium: false, business: true },
  { name: 'Advanced reporting', basic: false, premium: false, business: true },

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
];

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 49,
    headerBg: 'bg-viridian/20',
    headerText: 'text-viridian',
    buttonBg: 'bg-viridian/80 hover:bg-viridian',
    buttonText: 'text-forest',
  },
  {
    id: 'PRO',
    name: 'Professional',
    price: 149,
    headerBg: 'bg-purple-500/30',
    headerText: 'text-purple-300',
    buttonBg: 'bg-purple-500 hover:bg-purple-600',
    buttonText: 'text-white',
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 349,
    headerBg: 'bg-bronze/30',
    headerText: 'text-bronze',
    buttonBg: 'bg-bronze hover:bg-bronze/80',
    buttonText: 'text-forest',
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
            <th className="bg-viridian/10 p-4 text-left font-semibold text-viridian border-b-2 border-viridian/20 font-orbitron">
              Features
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                className={`${plan.headerBg} ${plan.headerText} p-4 text-center font-bold text-lg border-b-2 border-viridian/20 relative`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="font-orbitron">{plan.name}</div>
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
                    className="bg-bronze/20 p-3 font-semibold text-bronze text-sm uppercase tracking-wide font-orbitron"
                  >
                    {feature.category}
                  </td>
                </tr>
              )}
              <tr
                key={feature.name}
                className={index % 2 === 0 ? 'bg-viridian/5' : 'bg-forest'}
              >
                <td className="p-4 text-viridian/80 border-b border-viridian/10">
                  {feature.name}
                </td>
                <td className="p-4 text-center border-b border-viridian/10">
                  {feature.basic && (
                    <Check
                      className="w-5 h-5 text-green-500 mx-auto"
                      aria-label="Included"
                    />
                  )}
                </td>
                <td className="p-4 text-center border-b border-viridian/10">
                  {feature.premium && (
                    <Check
                      className="w-5 h-5 text-green-500 mx-auto"
                      aria-label="Included"
                    />
                  )}
                </td>
                <td className="p-4 text-center border-b border-viridian/10">
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
            <td className="p-4 bg-viridian/10"></td>
            {plans.map((plan) => (
              <td key={plan.id} className="p-4 bg-viridian/10 text-center">
                <button
                  onClick={() => handleApply(plan.id)}
                  disabled={checkoutMutation.isPending}
                  className={`${plan.buttonBg} ${plan.buttonText} px-8 py-3 rounded-lg font-semibold font-orbitron transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
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
