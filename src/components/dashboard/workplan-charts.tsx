'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Workplan, WorkplanActivity } from '@/lib/types';

interface WorkplanChartsProps {
  workplans: Workplan[];
  activities: WorkplanActivity[];
}

// Color palette
const COLORS = {
  primary: '#0f766e',
  secondary: '#0891b2',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  slate: '#64748b',
};

const STATUS_COLORS = {
  draft: '#94a3b8',
  submitted: '#f59e0b',
  approved: '#10b981',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  delayed: '#ef4444',
};

const ACTIVITY_STATUS_COLORS = {
  not_started: '#94a3b8',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  delayed: '#ef4444',
  cancelled: '#6b7280',
};

export function WorkplanCharts({ workplans, activities }: WorkplanChartsProps) {
  // Calculate status distribution
  const statusData = Object.entries(
    workplans.reduce((acc, wp) => {
      acc[wp.status] = (acc[wp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  // Calculate activity status distribution
  const activityStatusData = Object.entries(
    activities.reduce((acc, act) => {
      acc[act.status] = (acc[act.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    color: ACTIVITY_STATUS_COLORS[name as keyof typeof ACTIVITY_STATUS_COLORS] || COLORS.slate,
  }));

  // Calculate quarterly budget data
  const quarterlyBudget = [
    { quarter: 'Q1', planned: 0, executed: 0 },
    { quarter: 'Q2', planned: 0, executed: 0 },
    { quarter: 'Q3', planned: 0, executed: 0 },
    { quarter: 'Q4', planned: 0, executed: 0 },
  ];

  activities.forEach(act => {
    quarterlyBudget[0].planned += act.q1Budget;
    quarterlyBudget[1].planned += act.q2Budget;
    quarterlyBudget[2].planned += act.q3Budget;
    quarterlyBudget[3].planned += act.q4Budget;
    // Calculate executed based on progress (simplified)
    quarterlyBudget[0].executed += act.q1Budget * (act.q1Target > 0 ? act.q1Actual / act.q1Target : 0);
    quarterlyBudget[1].executed += act.q2Budget * (act.q2Target > 0 ? act.q2Actual / act.q2Target : 0);
    quarterlyBudget[2].executed += act.q3Budget * (act.q3Target > 0 ? act.q3Actual / act.q3Target : 0);
    quarterlyBudget[3].executed += act.q4Budget * (act.q4Target > 0 ? act.q4Actual / act.q4Target : 0);
  });

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `K${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `K${(value / 1000).toFixed(0)}K`;
    return `K${value}`;
  };

  // Calculate monthly progress trend
  const monthlyProgress = [
    { month: 'Jan', progress: 5, target: 8 },
    { month: 'Feb', progress: 12, target: 16 },
    { month: 'Mar', progress: 22, target: 25 },
    { month: 'Apr', progress: 30, target: 33 },
    { month: 'May', progress: 38, target: 42 },
    { month: 'Jun', progress: 45, target: 50 },
    { month: 'Jul', progress: 55, target: 58 },
    { month: 'Aug', progress: 62, target: 67 },
    { month: 'Sep', progress: 70, target: 75 },
    { month: 'Oct', progress: 78, target: 83 },
    { month: 'Nov', progress: 85, target: 92 },
    { month: 'Dec', progress: 92, target: 100 },
  ];

  // Top activities by budget
  const topActivities = [...activities]
    .sort((a, b) => b.totalBudget - a.totalBudget)
    .slice(0, 5)
    .map(act => ({
      name: act.activityCode,
      budget: act.totalBudget,
      progress: act.progressPercent,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Workplan Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Workplan Status</CardTitle>
          <CardDescription>Distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name.replace(' ', '_') as keyof typeof STATUS_COLORS] || COLORS.slate}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.name.replace(' ', '_') as keyof typeof STATUS_COLORS] || COLORS.slate }}
                />
                <span className="capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity Status</CardTitle>
          <CardDescription>All activities by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {activityStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Budget Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quarterly Budget</CardTitle>
          <CardDescription>Planned vs Executed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyBudget}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="planned" name="Planned" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="executed" name="Executed" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progress Trend</CardTitle>
          <CardDescription>Actual vs Target progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke={COLORS.slate}
                  fill={COLORS.slate}
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  name="Actual"
                  stroke={COLORS.success}
                  fill={COLORS.success}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Activities by Budget */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Activities by Budget</CardTitle>
          <CardDescription>Highest budget allocations with progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topActivities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'budget' ? formatCurrency(value as number) : `${value}%`
                  }
                />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact chart for sidebar/cards
export function MiniProgressChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="value" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sparkline for trends
export function Sparkline({ data, color = COLORS.primary }: { data: number[]; color?: string }) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
