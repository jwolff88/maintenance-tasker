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
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600">Manage your maintenance team and track performance</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team Size</p>
                  <p className="text-2xl font-bold">{overview.team?.size || 0}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jobs Completed (30d)</p>
                  <p className="text-2xl font-bold">{overview.productivity?.totalCompleted || 0}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hours Worked (30d)</p>
                  <p className="text-2xl font-bold">{overview.productivity?.hoursWorked || 0}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Open Jobs</p>
                  <p className="text-2xl font-bold">{overview.workload?.totalOpen || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Coverage */}
          {skillsCoverage && (
            <div className="card">
              <h3 className="font-semibold mb-4">Skills Coverage</h3>
              {skillsCoverage.gapWarning && (
                <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
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
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className="font-medium text-sm">{skill.skill}</p>
                    <p className="text-xs text-gray-500">{skill.technicianCount} technician(s)</p>
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
            <div key={tech.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold">
                      {tech.firstName[0]}{tech.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{tech.firstName} {tech.lastName}</h3>
                    <p className="text-sm text-gray-500">{tech.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tech.skills?.map((skill: string) => (
                        <span key={skill} className="badge badge-blue text-xs">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Active Jobs</p>
                  <p className="text-xl font-bold">
                    {(tech._count?.assignedTasks || 0) + (tech._count?.assignedTickets || 0)}
                  </p>
                  {tech.hourlyRate && (
                    <p className="text-xs text-gray-400">${Number(tech.hourlyRate).toFixed(2)}/hr</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {technicians?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No technicians found. Add users with MAINTENANCE_STAFF role.</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && leaderboard && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Performers (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {leaderboard.leaderboard?.map((tech: any, index: number) => (
              <div
                key={tech.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : 'bg-white border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {tech.rank}
                  </div>
                  <div>
                    <p className="font-medium">{tech.name}</p>
                    <p className="text-xs text-gray-500">
                      {tech.tasksCompleted} tasks, {tech.ticketsCompleted} tickets
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{tech.totalCompleted}</p>
                  <p className="text-xs text-gray-500">{tech.hoursWorked}h logged</p>
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
            <div className="card bg-blue-50">
              <p className="text-sm text-blue-700">Avg Utilization</p>
              <p className="text-3xl font-bold text-blue-900">{workload.avgUtilization}%</p>
            </div>
            <div className="card bg-red-50">
              <p className="text-sm text-red-700">Overloaded</p>
              <p className="text-3xl font-bold text-red-900">{workload.overloaded}</p>
            </div>
            <div className="card bg-green-50">
              <p className="text-sm text-green-700">Available</p>
              <p className="text-3xl font-bold text-green-900">{workload.available}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Workload Distribution</h3>
            <div className="space-y-3">
              {workload.technicians?.map((tech: any) => (
                <div key={tech.id} className="flex items-center gap-4">
                  <div className="w-32 truncate">
                    <p className="font-medium text-sm">{tech.name}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          tech.status === 'overloaded' ? 'bg-red-500' :
                          tech.status === 'busy' ? 'bg-yellow-500' :
                          tech.status === 'available' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(tech.utilizationPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className={`text-sm font-medium ${
                      tech.status === 'overloaded' ? 'text-red-600' :
                      tech.status === 'busy' ? 'text-yellow-600' :
                      'text-green-600'
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
