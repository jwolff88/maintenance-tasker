import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { techniciansApi, teamAnalyticsApi } from '../services/api';
import {
  Users, Trophy, BarChart3, Clock, Wrench, AlertTriangle,
  ChevronRight, Star, TrendingUp
} from 'lucide-react';

type TabType = 'overview' | 'technicians' | 'leaderboard' | 'workload';

export default function Team() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: overview } = useQuery({
    queryKey: ['team-overview'],
    queryFn: () => teamAnalyticsApi.getOverview().then(res => res.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansApi.getAll().then(res => res.data),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => teamAnalyticsApi.getLeaderboard().then(res => res.data),
  });

  const { data: workload } = useQuery({
    queryKey: ['workload'],
    queryFn: () => teamAnalyticsApi.getWorkload().then(res => res.data),
  });

  const { data: skillsCoverage } = useQuery({
    queryKey: ['skills-coverage'],
    queryFn: () => teamAnalyticsApi.getSkillsCoverage().then(res => res.data),
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'technicians', label: 'Technicians', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'workload', label: 'Workload', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-viridian font-orbitron">Team Management</h1>
        <p className="text-viridian/60">Manage your maintenance team and track performance</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-viridian/20">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-viridian text-viridian'
                  : 'border-transparent text-viridian/50 hover:text-viridian/70'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-holo">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-viridian/60">Team Size</p>
                  <p className="text-2xl font-bold text-viridian">{overview.team?.size || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-holo">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Wrench className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-viridian/60">Jobs Completed (30d)</p>
                  <p className="text-2xl font-bold text-viridian">{overview.productivity?.totalCompleted || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-holo">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-viridian/60">Hours Worked (30d)</p>
                  <p className="text-2xl font-bold text-viridian">{overview.productivity?.hoursWorked || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-holo">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-viridian/60">Open Jobs</p>
                  <p className="text-2xl font-bold text-viridian">{overview.workload?.totalOpen || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Coverage */}
          {skillsCoverage && (
            <div className="card-holo">
              <h3 className="font-semibold mb-4 text-viridian font-orbitron">Skills Coverage</h3>
              {skillsCoverage.gapWarning && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {skillsCoverage.gapWarning}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {skillsCoverage.coverage?.map((skill: any) => (
                  <div
                    key={skill.skill}
                    className={`p-3 rounded-lg border ${
                      skill.technicianCount === 1
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-viridian/5 border-viridian/20'
                    }`}
                  >
                    <p className="font-medium text-sm text-viridian">{skill.skill}</p>
                    <p className="text-xs text-viridian/50">{skill.technicianCount} technician(s)</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Technicians Tab */}
      {activeTab === 'technicians' && (
        <div className="space-y-4">
          {technicians?.map((tech: any) => (
            <div key={tech.id} className="card-holo hover:shadow-viridian transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-viridian/20 rounded-full flex items-center justify-center">
                    <span className="text-viridian font-semibold">
                      {tech.firstName[0]}{tech.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-viridian">{tech.firstName} {tech.lastName}</h3>
                    <p className="text-sm text-viridian/50">{tech.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tech.skills?.map((skill: string) => (
                        <span key={skill} className="badge badge-blue text-xs">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-viridian/60">Active Jobs</p>
                  <p className="text-xl font-bold text-viridian">
                    {(tech._count?.assignedTasks || 0) + (tech._count?.assignedTickets || 0)}
                  </p>
                  {tech.hourlyRate && (
                    <p className="text-xs text-viridian/40">${Number(tech.hourlyRate).toFixed(2)}/hr</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {technicians?.length === 0 && (
            <div className="text-center py-12 text-viridian/50">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No technicians found. Add users with MAINTENANCE_STAFF role.</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && leaderboard && (
        <div className="card-holo">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-viridian font-orbitron">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {leaderboard.leaderboard?.map((tech: any, index: number) => (
              <div
                key={tech.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  index === 1 ? 'bg-viridian/10 border border-viridian/20' :
                  index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                  'bg-viridian/5 border border-viridian/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-forest' :
                    index === 1 ? 'bg-viridian/40 text-viridian' :
                    index === 2 ? 'bg-orange-500 text-forest' :
                    'bg-viridian/20 text-viridian/60'
                  }`}>
                    {tech.rank}
                  </div>
                  <div>
                    <p className="font-medium text-viridian">{tech.name}</p>
                    <p className="text-xs text-viridian/50">
                      {tech.tasksCompleted} tasks, {tech.ticketsCompleted} tickets
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-viridian">{tech.totalCompleted}</p>
                  <p className="text-xs text-viridian/50">{tech.hoursWorked}h logged</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workload Tab */}
      {activeTab === 'workload' && workload && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-holo bg-blue-500/10 border-blue-500/30">
              <p className="text-sm text-blue-300">Avg Utilization</p>
              <p className="text-3xl font-bold text-blue-400">{workload.avgUtilization}%</p>
            </div>
            <div className="card-holo bg-red-500/10 border-red-500/30">
              <p className="text-sm text-red-300">Overloaded</p>
              <p className="text-3xl font-bold text-red-400">{workload.overloaded}</p>
            </div>
            <div className="card-holo bg-green-500/10 border-green-500/30">
              <p className="text-sm text-green-300">Available</p>
              <p className="text-3xl font-bold text-green-400">{workload.available}</p>
            </div>
          </div>

          <div className="card-holo">
            <h3 className="font-semibold mb-4 text-viridian font-orbitron">Workload Distribution</h3>
            <div className="space-y-3">
              {workload.technicians?.map((tech: any) => (
                <div key={tech.id} className="flex items-center gap-4">
                  <div className="w-32 truncate">
                    <p className="font-medium text-sm text-viridian">{tech.name}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-viridian/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          tech.status === 'overloaded' ? 'bg-red-500' :
                          tech.status === 'busy' ? 'bg-yellow-500' :
                          tech.status === 'available' ? 'bg-green-500' :
                          'bg-viridian/40'
                        }`}
                        style={{ width: `${Math.min(tech.utilizationPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className={`text-sm font-medium ${
                      tech.status === 'overloaded' ? 'text-red-400' :
                      tech.status === 'busy' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {tech.totalActive}/{tech.capacity} jobs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
