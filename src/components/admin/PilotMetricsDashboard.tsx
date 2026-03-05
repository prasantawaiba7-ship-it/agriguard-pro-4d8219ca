import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, MessageSquare, Clock, Star, TrendingUp,
  AlertTriangle, CheckCircle, Loader2, Shield
} from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface KPIData {
  registeredFarmers: number;
  activeFarmers30d: number;
  totalQuestions: number;
  questionsPerFarmer: number;
  avgFirstResponseHours: number;
  ticketResolutionRate: number;
  avgSatisfaction: number;
  positiveFeedbackPct: number;
  ticketsPerExpert: number;
  avgHandlingHours: number;
  highRiskTickets: number;
  openTickets: number;
}

export function PilotMetricsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [ticketsByRisk, setTicketsByRisk] = useState<any[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<any[]>([]);
  const [expertWorkload, setExpertWorkload] = useState<any[]>([]);

  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d.toISOString();
  }, [daysBack]);

  useEffect(() => {
    fetchAllMetrics();
  }, [cutoffDate]);

  const fetchAllMetrics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchWeeklyTrend(),
        fetchTicketBreakdowns(),
        fetchExpertWorkload(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    // Registered farmers
    const { count: totalFarmers } = await supabase
      .from('farmer_profiles')
      .select('*', { count: 'exact', head: true });

    // Active farmers (had AI chat or ticket in period)
    const { data: activeChatFarmers } = await supabase
      .from('ai_chat_history')
      .select('farmer_id')
      .gte('created_at', cutoffDate);
    const uniqueActiveFarmers = new Set(activeChatFarmers?.map(r => r.farmer_id) || []);

    // Total questions (AI chats by farmers)
    const { count: totalQuestions } = await supabase
      .from('ai_chat_history')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', cutoffDate);

    // Expert tickets metrics
    const { data: tickets } = await (supabase as any)
      .from('expert_tickets')
      .select('id, status, risk_level, technician_id, satisfaction_score, first_response_at, created_at, closed_at, resolution_status')
      .gte('created_at', cutoffDate);

    const ticketList = tickets || [];
    const closedTickets = ticketList.filter((t: any) => t.status === 'closed');
    const answeredOrClosed = ticketList.filter((t: any) => ['answered', 'closed'].includes(t.status));
    const withFeedback = ticketList.filter((t: any) => t.satisfaction_score != null);
    const highRisk = ticketList.filter((t: any) => t.risk_level === 'high' || t.risk_level === 'critical');
    const openTickets = ticketList.filter((t: any) => ['open', 'in_progress'].includes(t.status));

    // Avg first response time (hours)
    const responseTimes = ticketList
      .filter((t: any) => t.first_response_at && t.created_at)
      .map((t: any) => (new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60));
    const avgFirstResponse = responseTimes.length > 0
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length
      : 0;

    // Avg handling time (created -> closed, hours)
    const handlingTimes = closedTickets
      .filter((t: any) => t.closed_at)
      .map((t: any) => (new Date(t.closed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60));
    const avgHandling = handlingTimes.length > 0
      ? handlingTimes.reduce((a: number, b: number) => a + b, 0) / handlingTimes.length
      : 0;

    // Avg satisfaction
    const avgSat = withFeedback.length > 0
      ? withFeedback.reduce((sum: number, t: any) => sum + (t.satisfaction_score || 0), 0) / withFeedback.length
      : 0;
    const positivePct = withFeedback.length > 0
      ? (withFeedback.filter((t: any) => t.satisfaction_score >= 4).length / withFeedback.length) * 100
      : 0;

    // Tickets per expert
    const expertIds = new Set(ticketList.map((t: any) => t.technician_id).filter(Boolean));
    const ticketsPerExpert = expertIds.size > 0 ? ticketList.length / expertIds.size : 0;

    // Resolution rate
    const resolutionRate = ticketList.length > 0
      ? (answeredOrClosed.length / ticketList.length) * 100
      : 0;

    setKpis({
      registeredFarmers: totalFarmers || 0,
      activeFarmers30d: uniqueActiveFarmers.size,
      totalQuestions: totalQuestions || 0,
      questionsPerFarmer: uniqueActiveFarmers.size > 0 ? (totalQuestions || 0) / uniqueActiveFarmers.size : 0,
      avgFirstResponseHours: avgFirstResponse,
      ticketResolutionRate: resolutionRate,
      avgSatisfaction: avgSat,
      positiveFeedbackPct: positivePct,
      ticketsPerExpert: ticketsPerExpert,
      avgHandlingHours: avgHandling,
      highRiskTickets: highRisk.length,
      openTickets: openTickets.length,
    });
  };

  const fetchWeeklyTrend = async () => {
    const { data: chats } = await supabase
      .from('ai_chat_history')
      .select('farmer_id, created_at')
      .eq('role', 'user')
      .gte('created_at', cutoffDate);

    if (!chats || chats.length === 0) {
      setWeeklyTrend([]);
      return;
    }

    // Group by week
    const weeks: Record<string, { farmers: Set<string>; questions: number }> = {};
    for (const chat of chats) {
      const d = new Date(chat.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { farmers: new Set(), questions: 0 };
      weeks[key].farmers.add(chat.farmer_id);
      weeks[key].questions++;
    }

    setWeeklyTrend(
      Object.entries(weeks)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, data]) => ({
          week: week.slice(5), // MM-DD
          activeFarmers: data.farmers.size,
          questions: data.questions,
        }))
    );
  };

  const fetchTicketBreakdowns = async () => {
    const { data: tickets } = await (supabase as any)
      .from('expert_tickets')
      .select('status, risk_level')
      .gte('created_at', cutoffDate);

    if (!tickets) return;

    // By risk level
    const riskCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    for (const t of tickets) {
      const risk = t.risk_level || 'low';
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;
      const status = t.status || 'open';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    setTicketsByRisk(Object.entries(riskCounts).map(([name, value]) => ({ name, value })));
    setTicketsByStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
  };

  const fetchExpertWorkload = async () => {
    const { data: tickets } = await (supabase as any)
      .from('expert_tickets')
      .select('technician_id, status')
      .not('technician_id', 'is', null)
      .gte('created_at', cutoffDate);

    if (!tickets) return;

    const { data: technicians } = await (supabase as any)
      .from('technicians')
      .select('id, name')
      .eq('is_active', true);

    const techMap: Record<string, string> = {};
    for (const t of technicians || []) techMap[t.id] = t.name;

    const workload: Record<string, { total: number; open: number; closed: number }> = {};
    for (const t of tickets) {
      const id = t.technician_id;
      if (!workload[id]) workload[id] = { total: 0, open: 0, closed: 0 };
      workload[id].total++;
      if (['open', 'in_progress'].includes(t.status)) workload[id].open++;
      if (['answered', 'closed'].includes(t.status)) workload[id].closed++;
    }

    setExpertWorkload(
      Object.entries(workload)
        .map(([id, data]) => ({ name: techMap[id] || id.slice(0, 8), ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">📊 Pilot Metrics Dashboard</h2>
          <p className="text-sm text-muted-foreground">Kishan Sathi pilot performance tracking</p>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards - 4 buckets */}
      {kpis && (
        <Tabs defaultValue="adoption" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="adoption" className="text-xs">📈 Adoption</TabsTrigger>
            <TabsTrigger value="quality" className="text-xs">⚡ Quality</TabsTrigger>
            <TabsTrigger value="satisfaction" className="text-xs">⭐ Satisfaction</TabsTrigger>
            <TabsTrigger value="workload" className="text-xs">👷 Workload</TabsTrigger>
          </TabsList>

          <TabsContent value="adoption">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={Users} label="Registered Farmers" value={kpis.registeredFarmers} color="text-primary" />
              <KPICard icon={TrendingUp} label={`Active (${timeRange})`} value={kpis.activeFarmers30d} color="text-green-600" />
              <KPICard icon={MessageSquare} label="Total Questions" value={kpis.totalQuestions} color="text-blue-600" />
              <KPICard icon={MessageSquare} label="Questions/Farmer" value={kpis.questionsPerFarmer.toFixed(1)} color="text-purple-600" />
            </div>
          </TabsContent>

          <TabsContent value="quality">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={Clock} label="Avg First Response" value={`${kpis.avgFirstResponseHours.toFixed(1)}h`} color="text-orange-600" />
              <KPICard icon={CheckCircle} label="Resolution Rate" value={`${kpis.ticketResolutionRate.toFixed(0)}%`} color="text-green-600" />
              <KPICard icon={AlertTriangle} label="High-Risk Tickets" value={kpis.highRiskTickets} color="text-destructive" />
              <KPICard icon={Shield} label="Open Tickets" value={kpis.openTickets} color="text-yellow-600" />
            </div>
          </TabsContent>

          <TabsContent value="satisfaction">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={Star} label="Avg Rating" value={kpis.avgSatisfaction > 0 ? `${kpis.avgSatisfaction.toFixed(1)}/5` : 'N/A'} color="text-yellow-500" />
              <KPICard icon={CheckCircle} label="Positive (4-5⭐)" value={kpis.positiveFeedbackPct > 0 ? `${kpis.positiveFeedbackPct.toFixed(0)}%` : 'N/A'} color="text-green-600" />
              <KPICard icon={Users} label="Farmers with Feedback" value={kpis.avgSatisfaction > 0 ? '✓' : '—'} color="text-muted-foreground" />
              <KPICard icon={TrendingUp} label="Net Quality" value={kpis.ticketResolutionRate > 70 ? 'Good' : 'Needs Improvement'} color={kpis.ticketResolutionRate > 70 ? 'text-green-600' : 'text-orange-600'} />
            </div>
          </TabsContent>

          <TabsContent value="workload">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={Users} label="Tickets/Expert" value={kpis.ticketsPerExpert.toFixed(1)} color="text-blue-600" />
              <KPICard icon={Clock} label="Avg Handling Time" value={`${kpis.avgHandlingHours.toFixed(1)}h`} color="text-orange-600" />
              <KPICard icon={MessageSquare} label="Total Tickets" value={kpis.openTickets + kpis.highRiskTickets} color="text-primary" />
              <KPICard icon={AlertTriangle} label="High Priority" value={kpis.highRiskTickets} color="text-destructive" />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Active Farmers + Questions Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Active Farmers & Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="activeFarmers" stroke={CHART_COLORS[0]} name="Active Farmers" strokeWidth={2} />
                  <Line type="monotone" dataKey="questions" stroke={CHART_COLORS[1]} name="Questions" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12">No data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Expert Workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expert Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {expertWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expertWorkload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="open" stackId="a" fill={CHART_COLORS[2]} name="Open" />
                  <Bar dataKey="closed" stackId="a" fill={CHART_COLORS[0]} name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12">No ticket data</p>
            )}
          </CardContent>
        </Card>

        {/* Tickets by Risk Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tickets by Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsByRisk.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ticketsByRisk} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {ticketsByRisk.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12">No ticket data</p>
            )}
          </CardContent>
        </Card>

        {/* Tickets by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ticketsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-12">No ticket data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Privacy Note */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" /> Data Privacy & Ethics Note
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Farmer PII (name, phone, location) is minimized in analytics — only aggregate counts are shown.</p>
          <p>• Individual farmer data is only accessible to assigned experts and admins with RLS enforcement.</p>
          <p>• Chat history and disease photos are stored with farmer consent at registration.</p>
          <p>• For partner/government reports, export only anonymized aggregate data.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
