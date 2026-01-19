import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi, assetsApi, tasksApi } from '../services/api';
import {
  Building2,
  Wrench,
  AlertTriangle,
  Calendar,
  TrendingUp,
  DollarSign,
  Cog,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
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
  PEST_CONTROL: 'bg-teal',
  LANDSCAPING: 'bg-emerald-500',
  CLEANING: 'bg-pink-500',
  SAFETY: 'bg-orange-500',
  OTHER: 'bg-viridian/50',
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

  const { data: assetStats } = useQuery({
    queryKey: ['asset-stats'],
    queryFn: () => assetsApi.getStats().then((res) => res.data),
  });

  const { data: taskStats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => tasksApi.getStats().then((res) => res.data),
  });

  const { data: overdueTasks } = useQuery({
    queryKey: ['overdue-tasks'],
    queryFn: () => tasksApi.getAll({ overdue: 'true' }).then((res) => res.data),
  });

  const { data: assetsNeedingAttention } = useQuery({
    queryKey: ['assets-needing-attention'],
    queryFn: () => assetsApi.getNeedingAttention().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-viridian"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Assets',
      value: assetStats?.total || 0,
      icon: Cog,
      color: 'bg-viridian/20 text-viridian',
      iconColor: 'text-viridian',
      link: '/assets',
    },
    {
      name: 'Open Tasks',
      value: (taskStats?.open || 0) + (taskStats?.inProgress || 0),
      icon: ClipboardList,
      color: 'bg-teal/20 text-teal',
      iconColor: 'text-teal',
      link: '/maintenance-tasks',
    },
    {
      name: 'Overdue Tasks',
      value: taskStats?.overdue || 0,
      icon: Clock,
      color: 'bg-red-500/20 text-red-400',
      iconColor: 'text-red-400',
      link: '/maintenance-tasks?overdue=true',
    },
    {
      name: 'Critical Tasks',
      value: taskStats?.critical || 0,
      icon: AlertTriangle,
      color: 'bg-bronze/20 text-bronze',
      iconColor: 'text-bronze',
      link: '/maintenance-tasks?priority=CRITICAL',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-viridian">Dashboard</h1>
        <p className="text-viridian/60">Overview of your property operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.link} className="card-holo flex items-center gap-4 hover:shadow-viridian transition-all duration-300">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-viridian">{stat.value}</p>
              <p className="text-sm text-viridian/60">{stat.name}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Maintenance Task Status Overview */}
      <div className="card-holo">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-viridian font-orbitron">Maintenance Task Overview</h2>
          <Link to="/maintenance-tasks" className="text-sm text-viridian hover:text-viridian/80">
            View all tasks
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-bronze/10 border border-bronze/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-bronze">{taskStats?.open || 0}</p>
            <p className="text-sm text-viridian/60">Open</p>
          </div>
          <div className="p-4 bg-teal/10 border border-teal/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-teal">{taskStats?.inProgress || 0}</p>
            <p className="text-sm text-viridian/60">In Progress</p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-purple-400">{taskStats?.underReview || 0}</p>
            <p className="text-sm text-viridian/60">Under Review</p>
          </div>
          <div className="p-4 bg-viridian/10 border border-viridian/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-viridian">{taskStats?.completed || 0}</p>
            <p className="text-sm text-viridian/60">Completed</p>
          </div>
          <div className="p-4 bg-viridian/5 border border-viridian/20 rounded-lg text-center">
            <p className="text-3xl font-bold text-viridian/70">{taskStats?.total || 0}</p>
            <p className="text-sm text-viridian/60">Total</p>
          </div>
        </div>
      </div>

      {/* Asset Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-holo">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-viridian font-orbitron">Asset Status</h2>
            <Link to="/assets" className="text-sm text-viridian hover:text-viridian/80">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-viridian/10 border border-viridian/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-viridian">{assetStats?.operational || 0}</p>
              <p className="text-sm text-viridian/60">Operational</p>
            </div>
            <div className="p-4 bg-bronze/10 border border-bronze/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-bronze">{assetStats?.needsMaintenance || 0}</p>
              <p className="text-sm text-viridian/60">Needs Maintenance</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{assetStats?.outOfService || 0}</p>
              <p className="text-sm text-viridian/60">Out of Service</p>
            </div>
            <div className="p-4 bg-viridian/5 border border-viridian/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-viridian/70">{assetStats?.total || 0}</p>
              <p className="text-sm text-viridian/60">Total Assets</p>
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="card-holo">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-viridian font-orbitron">
              <Clock className="w-5 h-5 text-red-400" />
              Overdue Tasks
            </h2>
            <Link to="/maintenance-tasks?overdue=true" className="text-sm text-viridian hover:text-viridian/80">
              View all
            </Link>
          </div>
          {overdueTasks?.length > 0 ? (
            <div className="space-y-3">
              {overdueTasks.slice(0, 5).map((task: any) => (
                <Link
                  key={task.id}
                  to={`/maintenance-tasks/${task.id}`}
                  className="block p-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-viridian">{task.title}</p>
                      <p className="text-sm text-viridian/60">{task.asset?.name}</p>
                    </div>
                    <span className="text-xs text-red-400">
                      Due {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-viridian mx-auto mb-2" />
              <p className="text-viridian/50">No overdue tasks</p>
            </div>
          )}
        </div>
      </div>

      {/* Assets Needing Attention */}
      <div className="card-holo">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-viridian font-orbitron">
            <AlertOctagon className="w-5 h-5 text-bronze" />
            Assets Needing Attention
          </h2>
          <Link to="/assets?status=NEEDS_MAINTENANCE" className="text-sm text-viridian hover:text-viridian/80">
            View all
          </Link>
        </div>
        {assetsNeedingAttention?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assetsNeedingAttention.slice(0, 6).map((asset: any) => (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="block p-3 bg-bronze/10 border border-bronze/30 rounded-lg hover:bg-bronze/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    asset.status === 'OUT_OF_SERVICE' ? 'bg-red-500/20' : 'bg-bronze/20'
                  }`}>
                    <ShieldAlert className={`w-4 h-4 ${
                      asset.status === 'OUT_OF_SERVICE' ? 'text-red-400' : 'text-bronze'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-viridian truncate">{asset.name}</p>
                    <p className="text-sm text-viridian/60 truncate">{asset.property?.name || asset.location}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.attentionReasons?.map((reason: string, idx: number) => (
                        <span key={idx} className="text-xs bg-forest/50 px-1.5 py-0.5 rounded text-bronze border border-bronze/30">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-viridian mx-auto mb-2" />
            <p className="text-viridian/50">All assets are operational</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tickets */}
        <div className="card-holo">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-viridian font-orbitron">Urgent Tickets</h2>
            <Link to="/tickets?priority=URGENT" className="text-sm text-viridian hover:text-viridian/80">
              View all
            </Link>
          </div>
          {data?.urgentTickets?.length > 0 ? (
            <div className="space-y-3">
              {data.urgentTickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="block p-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-viridian">{ticket.title}</p>
                      <p className="text-sm text-viridian/60">{ticket.property.name}</p>
                    </div>
                    <span className="badge badge-red">Urgent</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-viridian/50 text-center py-8">No urgent tickets</p>
          )}
        </div>

        {/* Expiring Leases */}
        <div className="card-holo">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-viridian font-orbitron">Expiring Leases (30 days)</h2>
            <Link to="/leases" className="text-sm text-viridian hover:text-viridian/80">
              View all
            </Link>
          </div>
          {data?.expiringLeases?.length > 0 ? (
            <div className="space-y-3">
              {data.expiringLeases.map((lease: any) => (
                <div key={lease.id} className="p-3 bg-bronze/10 border border-bronze/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-viridian">
                        {lease.tenant.firstName} {lease.tenant.lastName}
                      </p>
                      <p className="text-sm text-viridian/60">{lease.property.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-bronze">
                        {format(new Date(lease.endDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-viridian/50">Expires</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-viridian/50 text-center py-8">No leases expiring soon</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="card-holo">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-viridian font-orbitron">Upcoming Events</h2>
          </div>
          {data?.upcomingEvents?.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingEvents.map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-viridian/5 border border-viridian/20 rounded-lg">
                  <div className="p-2 bg-viridian/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-viridian" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-viridian">{event.title}</p>
                    <p className="text-sm text-viridian/60">{event.property.name}</p>
                  </div>
                  <div className="text-sm text-viridian/50">
                    {format(new Date(event.date), 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-viridian/50 text-center py-8">No upcoming events</p>
          )}
        </div>

        {/* High Risk Properties */}
        <div className="card-holo">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-viridian font-orbitron">High Risk Properties</h2>
            <Link to="/properties?status=CRITICAL" className="text-sm text-viridian hover:text-viridian/80">
              View all
            </Link>
          </div>
          {data?.highRiskProperties?.length > 0 ? (
            <div className="space-y-3">
              {data.highRiskProperties.map((property: any) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="block p-3 bg-bronze/10 border border-bronze/30 rounded-lg hover:bg-bronze/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-viridian">{property.name}</p>
                      <p className="text-sm text-viridian/60">{property.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-bronze">{property.riskScore}</p>
                      <p className="text-xs text-viridian/50">Risk Score</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-viridian/50 text-center py-8">No high risk properties</p>
          )}
        </div>
      </div>

      {/* Ticket Status Overview */}
      <div className="card-holo">
        <h2 className="text-lg font-semibold mb-4 text-viridian font-orbitron">Ticket Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-teal/10 border border-teal/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-teal">{data?.tickets.new || 0}</p>
            <p className="text-sm text-viridian/60">New</p>
          </div>
          <div className="p-4 bg-bronze/10 border border-bronze/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-bronze">{data?.tickets.inProgress || 0}</p>
            <p className="text-sm text-viridian/60">In Progress</p>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-orange-400">{data?.tickets.waitingOnTenant || 0}</p>
            <p className="text-sm text-viridian/60">Waiting</p>
          </div>
          <div className="p-4 bg-viridian/10 border border-viridian/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-viridian">{data?.tickets.completed || 0}</p>
            <p className="text-sm text-viridian/60">Completed</p>
          </div>
        </div>
      </div>

      {/* Cost Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-holo">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-viridian/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-viridian" />
            </div>
            <h2 className="text-lg font-semibold text-viridian font-orbitron">Maintenance Cost Summary (YTD)</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-viridian/5 border border-viridian/20 rounded-lg">
              <p className="text-2xl font-bold text-viridian">
                ${costData?.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
              </p>
              <p className="text-sm text-viridian/60">Total Spent</p>
            </div>
            <div className="text-center p-4 bg-viridian/5 border border-viridian/20 rounded-lg">
              <p className="text-2xl font-bold text-viridian">{costData?.ticketCount || 0}</p>
              <p className="text-sm text-viridian/60">Jobs Completed</p>
            </div>
            <div className="text-center p-4 bg-viridian/5 border border-viridian/20 rounded-lg">
              <p className="text-2xl font-bold text-viridian">
                ${costData?.avgCostPerTicket?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
              </p>
              <p className="text-sm text-viridian/60">Avg Cost/Job</p>
            </div>
          </div>
        </div>

        <div className="card-holo">
          <h2 className="text-lg font-semibold mb-4 text-viridian font-orbitron">Cost by Category</h2>
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
                        <span className="text-viridian/70">{categoryLabels[category] || category}</span>
                        <span className="font-medium text-viridian">${(cost as number).toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-viridian/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${categoryColors[category] || 'bg-viridian/50'} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-viridian/50 text-center py-8">No cost data available yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
