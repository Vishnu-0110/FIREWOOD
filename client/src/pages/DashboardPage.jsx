import { useEffect, useState } from 'react';
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

const COLORS = ['#e67e22', '#8b5e3c', '#f39c12', '#d35400', '#f1c27d'];

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setData(response.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <LoadingSpinner full />;
  if (!data) return null;

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

  return (
    <AppLayout>
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
            <div className="card-body" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="revenue" stroke="#e67e22" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Factory Revenue</div>
            <div className="card-body" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.customerRevenue.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8b5e3c" />
                </BarChart>
              </ResponsiveContainer>
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
                    >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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
                <table className="table table-sm mb-0">
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
                        <td>{item.invoiceNumber}</td>
                        <td>{formatDate(item.date)}</td>
                        <td>{item.customer?.factoryName || item.customer?.customerName || '-'}</td>
                        <td>{formatCurrency(item.totalAmount)}</td>
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
