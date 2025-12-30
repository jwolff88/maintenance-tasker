import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import {
  Building2,
  Wrench,
  AlertTriangle,
  Calendar,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PEST_CONTROL: 'Pest Control',
  LANDSCAPING: 'Landscaping',
  CLEANING: 'Cleaning',
  SAFETY: 'Safety',
  OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  PLUMBING: 'bg-blue-500',
  ELECTRICAL: 'bg-yellow-500',
  HVAC: 'bg-cyan-500',
  APPLIANCE: 'bg-purple-500',
  STRUCTURAL: 'bg-red-500',
  PEST_CONTROL: 'bg-green-500',
  LANDSCAPING: 'bg-emerald-500',
  CLEANING: 'bg-pink-500',
  SAFETY: 'bg-orange-500',
  OTHER: 'bg-gray-500',
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getOverview().then((res) => res.data),
  });

  const { data: costData } = useQuery({
    queryKey: ['dashboard-costs'],
    queryFn: () => dashboardApi.getCostAnalytics().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Properties',
      value: data?.propertyStats.total || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Open Tickets',
      value: (data?.tickets.new || 0) + (data?.tickets.inProgress || 0),
      icon: Wrench,
      color: 'bg-orange-500',
    },
    {
      name: 'Critical Properties',
      value: data?.propertyStats.critical || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      name: 'Avg Risk Score',
      value: data?.propertyStats.avgRiskScore || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your property operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Urgent Tickets</h2>
            <Link to="/tickets?priority=URGENT" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {data?.urgentTickets?.length > 0 ? (
            <div className="space-y-3">
              {data.urgentTickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ticket.title}</p>
                      <p className="text-sm text-gray-600">{ticket.property.name}</p>
                    </div>
                    <span className="badge badge-red">Urgent</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No urgent tickets</p>
          )}
        </div>

        {/* Expiring Leases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Expiring Leases (30 days)</h2>
            <Link to="/leases" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {data?.expiringLeases?.length > 0 ? (
            <div className="space-y-3">
              {data.expiringLeases.map((lease: any) => (
                <div key={lease.id} className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {lease.tenant.firstName} {lease.tenant.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{lease.property.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-700">
                        {format(new Date(lease.endDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">Expires</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No leases expiring soon</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
          </div>
          {data?.upcomingEvents?.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingEvents.map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.property.name}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(event.date), 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming events</p>
          )}
        </div>

        {/* High Risk Properties */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">High Risk Properties</h2>
            <Link to="/properties?status=CRITICAL" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {data?.highRiskProperties?.length > 0 ? (
            <div className="space-y-3">
              {data.highRiskProperties.map((property: any) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{property.name}</p>
                      <p className="text-sm text-gray-600">{property.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{property.riskScore}</p>
                      <p className="text-xs text-gray-500">Risk Score</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No high risk properties</p>
          )}
        </div>
      </div>

      {/* Ticket Status Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Ticket Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-600">{data?.tickets.new || 0}</p>
            <p className="text-sm text-gray-600">New</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-yellow-600">{data?.tickets.inProgress || 0}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-orange-600">{data?.tickets.waitingOnTenant || 0}</p>
            <p className="text-sm text-gray-600">Waiting</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-600">{data?.tickets.completed || 0}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      </div>

      {/* Cost Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Maintenance Cost Summary (YTD)</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                ${costData?.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
              </p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{costData?.ticketCount || 0}</p>
              <p className="text-sm text-gray-600">Jobs Completed</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                ${costData?.avgCostPerTicket?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
              </p>
              <p className="text-sm text-gray-600">Avg Cost/Job</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Cost by Category</h2>
          {costData?.costByCategory && Object.keys(costData.costByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(costData.costByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, cost]) => {
                  const maxCost = Math.max(...Object.values(costData.costByCategory) as number[]);
                  const percentage = maxCost > 0 ? ((cost as number) / maxCost) * 100 : 0;

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{categoryLabels[category] || category}</span>
                        <span className="font-medium">${(cost as number).toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${categoryColors[category] || 'bg-gray-500'} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No cost data available yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
