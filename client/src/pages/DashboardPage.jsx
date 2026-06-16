import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';

const COLORS = ['#6366F1', '#818CF8', '#4F46E5', '#A5B4FC', '#C7D2FE'];
const GRID_COLOR = 'rgba(148, 163, 184, 0.16)';
const AXIS_COLOR = '#94A3B8';

const getTooltipStyles = (isDark) => ({
  contentStyle: isDark
    ? {
        background: 'rgba(17, 24, 39, 0.96)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        boxShadow: '0 20px 45px rgba(2, 6, 23, 0.32)',
        color: '#F8FAFC'
      }
    : {
        background: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.14)',
        color: '#0F172A'
      },
  itemStyle: {
    color: isDark ? '#F8FAFC' : '#0F172A'
  },
  labelStyle: {
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontWeight: 700
  },
  wrapperStyle: {
    outline: 'none'
  }
});

const truncateLabel = (value = '', max = 10) => {
  const label = String(value);
  return label.length > max ? `${label.slice(0, max)}...` : label;
};

const compactCurrency = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value) || 0);

const DashboardPage = () => {
  const { theme } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setData(response.data);
      } catch (error) {
        if (isSilentAuthError(error)) return;
        toast.error(error?.response?.data?.message || 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <LoadingSpinner full />;
  if (!data) {
    return (
      <AppLayout>
        <div className="alert alert-warning mb-0" role="alert">
          Dashboard data could not be loaded. Please sign in again.
        </div>
      </AppLayout>
    );
  }

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue) },
    { label: 'Total Loads', value: data.summary.totalLoadsSent },
    { label: 'Total Factories', value: data.summary.totalCustomers },
    { label: 'Yearly Growth', value: `${data.summary.yearlyGrowth}%` }
  ];

  const pieData = data.charts.topCustomers.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));
  const factoryRevenueData = data.charts.customerRevenue.slice(0, 8);

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">Overview</span>
          <h1 className="page-title mb-1">Business Dashboard</h1>
          <p className="page-subtitle mb-0">Track revenue, factory activity and recent invoices in one modern workspace.</p>
        </div>
      </section>

      <div className="row g-3 mb-3">
        {cards.map((card) => (
          <div className="col-12 col-md-6 col-xl-3" key={card.label}>
            <div className="card kpi-card border-0 shadow-sm">
              <div className="card-body">
                <small className="text-muted">{card.label}</small>
                <h4 className="mb-0 mt-1">{card.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Monthly Revenue</div>
            <div className="card-body dashboard-chart-card" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.charts.monthlyRevenue}
                  margin={{ top: 8, right: 18, left: 50, bottom: 8 }}
                >
                  <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: GRID_COLOR }}
                  />
                  <YAxis
                    width={86}
                    tickFormatter={compactCurrency}
                    tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyles.contentStyle}
                    itemStyle={tooltipStyles.itemStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    wrapperStyle={tooltipStyles.wrapperStyle}
                    cursor={{ stroke: 'rgba(99, 102, 241, 0.28)', strokeWidth: 1 }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#818CF8' }}
                    animationDuration={900}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Factory Revenue</div>
            <div className="card-body dashboard-chart-card" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={factoryRevenueData}
                  margin={{ top: 8, right: 18, left: 18, bottom: 72 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={76}
                    tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                    tickFormatter={(value) => truncateLabel(value, 12)}
                    tickLine={false}
                    axisLine={{ stroke: GRID_COLOR }}
                  />
                  <YAxis
                    width={72}
                    tickFormatter={compactCurrency}
                    tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyles.contentStyle}
                    itemStyle={tooltipStyles.itemStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    wrapperStyle={tooltipStyles.wrapperStyle}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(value) => String(value)}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#6366F1"
                    radius={[10, 10, 4, 4]}
                    maxBarSize={40}
                    animationDuration={850}
                    activeBar={{ fill: '#818CF8' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="px-3 pb-3">
              <div className="custom-chart-legend">
                {factoryRevenueData.map((item) => (
                  <div key={item.name} className="custom-chart-legend-item" title={item.name}>
                    <span className="custom-chart-legend-color" style={{ backgroundColor: '#6366F1' }} />
                    <span className="custom-chart-legend-text">{truncateLabel(item.name, 22)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Top 5 Factory Share</div>
            <div className="card-body d-flex flex-column" style={{ minHeight: 320 }}>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="revenue"
                      nameKey="name"
                      outerRadius={88}
                      innerRadius={20}
                      label={false}
                      animationDuration={850}
                    >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyles.contentStyle}
                    itemStyle={tooltipStyles.itemStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    wrapperStyle={tooltipStyles.wrapperStyle}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="custom-chart-legend mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="custom-chart-legend-item" title={item.name}>
                    <span className="custom-chart-legend-color" style={{ backgroundColor: item.fill }} />
                    <span className="custom-chart-legend-text">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Recent 10 Invoices</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-mobile-stack mb-0">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Date</th>
                      <th>Factory</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentInvoices.map((item) => (
                    <tr key={item._id}>
                        <td data-label="No">{item.invoiceNumber}</td>
                        <td data-label="Date">{formatDate(item.date)}</td>
                        <td data-label="Factory">{item.customer?.factoryName || item.customer?.customerName || '-'}</td>
                        <td data-label="Total">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
