"use client";

import { useState, useEffect } from "react";
import RecentExpensesTable from "./RecentExpensesTable";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Table,
  ListGroup,
  Button,
  Form,
} from "react-bootstrap";
import { format } from "date-fns";
import {
  Clock,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  FileText,
} from "lucide-react";
import { BASE_API_URL } from "../static/apiConfig";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "react-toastify";
import TopNavbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import AuthProvider from "../authPages/tokenData";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { CashStack } from "react-bootstrap-icons";

type ExpenseSummary = {
  summary: {
    totalExpenses: number;
    totalAmount: number;
    averageAmount: number | null;
    minAmount: number | null;
    maxAmount: number | null;
    pendingApprovals: number;
  };
  breakdown: {
    statuses: Record<string, number>;
    paymentStatuses: Record<string, number>;
    categories: { categoryId: number; count: number; totalAmount: number }[];
    departments: { departmentId: number; count: number; totalAmount: number }[];
    approvalSteps: Record<string, number>;
  };
  recentExpenses: {
    id: number;
    description: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    category?: {
      id: number;
      name: string;
    };
    department?: {
      id: number;
      name: string;
    };
    pendingApprovalSteps?: {
      id: number;
      order: number;
      isOptional: boolean;
      status: string;
      comments: string | null;
      role: {
        name: string;
      } | null;
      approver: {
        firstName: string;
        lastName: string;
        email: string;
      } | null;
      workflowStepId: number;
    }[];
  }[];
  categoryDetails: {
    id: number;
    name: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
  }[];
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
};

// Enhanced color palette
const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];
const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#10B981",
  PENDING: "#F59E0B",
  REJECTED: "#EF4444",
  DRAFT: "#6B7280",
  PROCESSING: "#3B82F6",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: "#10B981",
  UNPAID: "#EF4444",
  PENDING: "#F59E0B",
  PROCESSING: "#3B82F6",
};

export default function Dashboard() {
  const [data, setData] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("month");

  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${BASE_API_URL}/dashboard/get-data?period=${timeFilter}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const response = await res.json();

      console.log(response);

      if (res.ok) {
        setData(response as ExpenseSummary);
      } else {
        toast.error(`${response.message}`);
      }
    } catch (err) {
      toast.error(`${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchData();
    toast.info("Refreshing data...");
  };

  const exportData = () => {
    // Implementation for exporting data
    toast.info("Exporting data...");
  };

  if (isLoading) return <PageLoader />;

  if (!data)
    return (
      <AuthProvider>
        <TopNavbar />
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
          <Container>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                  <FileText size={48} className="text-muted" />
                </div>
                <h4 className="text-dark mb-2">No data available</h4>
                <p className="text-muted mb-3">
                  There&apos;s no expense data to display yet
                </p>
                <Button variant="primary" onClick={fetchData}>
                  <RefreshCw size={16} className="me-2" />
                  Refresh page
                </Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </AuthProvider>
    );

  // Check if user has no expenses at all
  const hasNoExpenses =
    data.summary.totalExpenses === 0 || data.recentExpenses.length === 0;

  // Prepare data for charts
  const statusChartData = Object.entries(data.breakdown.statuses).map(
    ([status, count]) => ({
      name: status,
      value: count,
    })
  );

  const paymentStatusChartData = Object.entries(
    data.breakdown.paymentStatuses
  ).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const categoryChartData = data.breakdown.categories.map((cat) => ({
    name: `Category ${cat.categoryId}`,
    count: cat.count,
    totalAmount: cat.totalAmount,
  }));

  const departmentChartData = data.breakdown.departments.map((dept) => ({
    name: `Department ${dept.departmentId}`,
    count: dept.count,
    totalAmount: dept.totalAmount,
  }));

  return (
    <AuthProvider>
      <TopNavbar />
      <div className="min-vh-100 bg-light mt-3">
        <Container fluid className="px-4">
          <Container fluid className="px-0 mb-4">
            {/* Ultra Modern Dashboard Header */}
            <div
              className="position-relative overflow-hidden rounded-4"
              style={{
                backgroundColor: "#EEF2FF",
              }}
            >

              <Row className="align-items-center p-4 position-relative">
                <Col lg={6} className="mb-3 mb-lg-0">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="bg-white bg-opacity-75 backdrop-blur p-3 rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: "60px", height: "60px" }}
                    >
                      <BarChart3 size={32} className="text-primary" />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h5 className="mb-0 fw-bold text-dark">
                          Expense Dashboard
                        </h5>
                        <span className="badge bg-success text-white px-2 py-1 small">
                          logged in
                        </span>
                      </div>
                      <p className="text-muted mb-0 small">
                        Real-time overview of all expense activities and
                        insights
                      </p>
                    </div>
                  </div>
                </Col>

                <Col lg={6}>
                  <div className="d-flex gap-2 justify-content-lg-end flex-wrap">
                    <Button
                      size="sm"
                      className="d-inline-flex align-items-center gap-2 px-4 py-2 border-0 fw-semibold shadow-sm"
                      onClick={() =>
                        handleNavigation("/expense-management/create-expense")
                      }
                      style={{
                        background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                        color: "white",
                        borderRadius: "12px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 12px 24px rgba(79, 70, 229, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                      }}
                    >
                      <div className="bg-white bg-opacity-20 p-1 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }}>
                        <FaPlus size={12} className="text-primary" />
                      </div>
                      <span>New Expense</span>
                    </Button>

                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary text-decoration-none d-inline-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 rounded-3 border-0"
                      onClick={refreshData}
                      style={{
                        backdropFilter: "blur(10px)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(79, 70, 229, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(79, 70, 229, 0.1)";
                      }}
                    >
                      <RefreshCw size={16} />
                      <span>Refresh</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="link"
                      className="text-primary text-decoration-none d-inline-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 rounded-3 border-0"
                      onClick={exportData}
                      style={{
                        backdropFilter: "blur(10px)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(79, 70, 229, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(79, 70, 229, 0.1)";
                      }}
                    >
                      <Download size={16} />
                      <span>Export</span>
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          </Container>

          {/* Welcome Screen for New Users */}
          {hasNoExpenses ? (
            <Container className="py-5">
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <div className="mb-4">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                      <FileText size={64} className="text-primary" />
                    </div>
                    <h5 className="text-dark fw-bold mb-3">
                      Welcome to Your Expense Dashboard!
                    </h5>
                    <p className="text-muted mb-4">
                      You haven&apos;t created any expenses yet. Get started by
                      creating your first expense.
                    </p>
                  </div>

                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleNavigation("/expense-management/create-expense")
                      }
                      className="px-4"
                    >
                      <FaPlus size={18} className="me-2" />
                      Create Expense
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={refreshData}
                      className="px-4"
                    >
                      <RefreshCw size={18} className="me-2" />
                      Refresh
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Container>
          ) : (
            <>
              {/* Show dashboard content only when there are expenses */}
              {/* Time filter controls */}
              <Row className="mb-1">
                <Col>
                  <Card className="border-0 shadow-sm rounded-3">
                    <Card.Body className="py-3 px-4">
                      <div className="d-flex flex-wrap justify-content-between align-items-center">
                        {/* Left side: Filter */}
                        <div className="d-flex align-items-center mb-2 mb-sm-0">
                          <div className="d-flex align-items-center bg-light rounded-2 px-3 py-2 shadow-sm">
                            <Filter size={16} className="text-primary me-2" />
                            <Form.Select
                              size="sm"
                              className="border-0 bg-transparent text-dark fw-medium"
                              style={{ width: "auto", cursor: "pointer" }}
                              value={timeFilter}
                              onChange={(e) => setTimeFilter(e.target.value)}
                            >
                              <option value="week">This Week</option>
                              <option value="month">This Month</option>
                              <option value="quarter">This Quarter</option>
                              <option value="year">This Year</option>
                              <option value="all">All Time</option>
                            </Form.Select>
                          </div>
                        </div>

                        {/* Right side: Date range */}
                        <div className="text-muted fw-medium bg-light rounded-2 px-3 py-2 shadow-sm">
                          {data.dateRange.startDate &&
                            data.dateRange.endDate ? (
                            <span className="small">
                              Data from{" "}
                              <span className="fw-semibold text-dark">
                                {format(
                                  new Date(data.dateRange.startDate),
                                  "MMM d, yyyy"
                                )}
                              </span>{" "}
                              to{" "}
                              <span className="fw-semibold text-dark">
                                {format(
                                  new Date(data.dateRange.endDate),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted fw-semibold small">
                              No date range available
                            </span>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <br />
              {/* SUMMARY CARDS */}
              <Row className="mb-4 g-3">
                <Col xxl={2} lg={4} md={6}>
                  <Card
                    className="border-0 h-100 shadow-sm rounded-3 overflow-hidden bg-primary bg-opacity-10"
                    style={{
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">
                            Total Expenses
                          </h6>
                          <h6 className="fw-bold mb-0">
                            {data.summary.totalExpenses ?? 0}
                          </h6>
                        </div>
                        <div className="bg-primary bg-opacity-25 p-3 rounded-3">
                          <FileText size={24} className="text-primary" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xxl={2} lg={4} md={6}>
                  <Card
                    className="border-0 h-100 shadow-sm rounded-3 overflow-hidden bg-success bg-opacity-10"
                    style={{
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">
                            Total Amount
                          </h6>
                          <h6 className="fw-bold mb-0">
                            <CashStack size={16} className="me-1" />
                            {data.summary.totalAmount?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) ?? 0}
                          </h6>
                        </div>
                        <div className="bg-success bg-opacity-25 p-3 rounded-3">
                          <TrendingUp size={24} className="text-success" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xxl={2} lg={4} md={6}>
                  <Card
                    className="border-0 h-100 shadow-sm rounded-3 overflow-hidden bg-info bg-opacity-10"
                    style={{
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">
                            Average Amount
                          </h6>
                          <h6 className="fw-bold mb-0">
                            {data.summary.averageAmount?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) ?? 0}
                          </h6>
                        </div>
                        <div className="bg-info bg-opacity-25 p-3 rounded-3">
                          <BarChart3 size={24} className="text-info" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xxl={2} lg={4} md={6}>
                  <Card
                    className="border-0 h-100 shadow-sm rounded-3 overflow-hidden bg-warning bg-opacity-10"
                    style={{
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">
                            Pending Approvals{" "}
                            <span className="text-muted">(steps)</span>
                          </h6>
                          <h6 className="fw-bold mb-0">
                            {data.summary.pendingApprovals ?? 0}
                          </h6>
                        </div>
                        <div className="bg-warning bg-opacity-25 p-3 rounded-3">
                          <Clock size={24} className="text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xxl={2} lg={4} md={6}>
                  <Card
                    className="border-0 h-100 shadow-sm rounded-3 overflow-hidden bg-secondary bg-opacity-10"
                    style={{
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">
                            Min Amount
                          </h6>
                          <h6 className="fw-bold mb-0">
                            {data.summary.minAmount?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) ?? 0}
                          </h6>
                        </div>
                        <div className="bg-secondary bg-opacity-25 p-3 rounded-3">
                          <CashStack size={24} className="text-secondary" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xxl={2} lg={4} md={6}>
                  <Card
                    className="border-0 h-100 shadow-sm rounded-3 overflow-hidden bg-danger bg-opacity-10"
                    style={{
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">
                            Max Amount
                          </h6>
                          <h6 className="fw-bold mb-0">
                            {data.summary.maxAmount?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) ?? 0}
                          </h6>
                        </div>
                        <div className="bg-danger bg-opacity-25 p-3 rounded-3">
                          <CashStack size={24} className="text-danger" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <br />
              {/* CHARTS ROW */}
              <Row className="mb-4 g-4">
                <Col xl={6}>
                  <Card className="h-100 shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1 fw-bold text-primary">
                            📊 Expense Status Distribution
                          </h6>
                          <p className="mb-0 text-muted small">
                            Track expense approval states
                          </p>
                        </div>
                        <Badge
                          bg="primary"
                          className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm bg-opacity-100"
                        >
                          📈 Live Data
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        <Col md={4}>
                          <div className="d-flex flex-column h-100">
                            <h6 className=" text-muted mb-3">
                              Status Breakdown
                            </h6>
                            <ListGroup variant="flush" className=" flex-grow-1">
                              {Object.entries(data.breakdown.statuses).map(
                                ([status, count]) => (
                                  <ListGroup.Item
                                    key={status}
                                    className="d-flex justify-content-between align-items-center px-0 py-2"
                                  >
                                    <div className="d-flex align-items-center">
                                      <span
                                        className="d-inline-block rounded-circle me-2"
                                        style={{
                                          width: "10px",
                                          height: "10px",
                                          backgroundColor:
                                            STATUS_COLORS[status] || COLORS[0],
                                        }}
                                      ></span>
                                      <span className="small">{status}</span>
                                    </div>
                                    <Badge
                                      className="px-2 py-1 fw-semibold"
                                      style={{
                                        backgroundColor:
                                          STATUS_COLORS[status] || COLORS[0],
                                        color: "white",
                                      }}
                                    >
                                      {count}
                                    </Badge>
                                  </ListGroup.Item>
                                )
                              )}
                            </ListGroup>
                          </div>
                        </Col>
                        <Col md={4} className="d-flex flex-column">
                          <h6 className=" text-muted text-center mb-3">
                            Pie Chart
                          </h6>
                          <div
                            style={{ height: "240px" }}
                            className="flex-grow-1 p-2"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusChartData}
                                  dataKey="value"
                                  nameKey="name"
                                  outerRadius={75}
                                  innerRadius={25}
                                  paddingAngle={3}
                                  label={({ percent }) =>
                                    percent !== undefined
                                      ? `${(percent * 100).toFixed(1)}%`
                                      : ""
                                  }
                                >
                                  {statusChartData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        STATUS_COLORS[entry.name] ||
                                        COLORS[index % COLORS.length]
                                      }
                                      stroke="#ffffff"
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "none",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                    fontSize: "14px",
                                  }}
                                  formatter={(value, name) => [
                                    `${value} expenses`,
                                    `📋 ${name}`,
                                  ]}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  height={36}
                                  iconType="circle"
                                  wrapperStyle={{
                                    fontSize: "12px",
                                    paddingTop: "8px",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Col>
                        <Col md={4} className="d-flex flex-column">
                          <h6 className=" text-muted text-center mb-3">
                            Bar Chart
                          </h6>
                          <div
                            style={{ height: "240px" }}
                            className="flex-grow-1 p-2"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={statusChartData}
                                margin={{
                                  top: 20,
                                  right: 15,
                                  left: 0,
                                  bottom: 20,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="barGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#4F46E5"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#7C3AED"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f0f0f0"
                                  horizontal={true}
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="name"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 11, fill: "#6b7280" }}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 11, fill: "#6b7280" }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "none",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                    fontSize: "14px",
                                  }}
                                  formatter={(value, name) => [
                                    `${value} expenses`,
                                    "📊 Count",
                                  ]}
                                />
                                <Bar
                                  dataKey="value"
                                  fill="url(#barGradient)"
                                  radius={[6, 6, 0, 0]}
                                  stroke="#ffffff"
                                  strokeWidth={1}
                                >
                                  {statusChartData.map((entry, index) => (
                                    <Cell
                                      key={`bar-cell-${index}`}
                                      fill={
                                        STATUS_COLORS[entry.name] ||
                                        COLORS[index % COLORS.length]
                                      }
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={6}>
                  <Card className="h-100 shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1 fw-bold text-success">
                            💰 Payment Status Distribution
                          </h6>
                          <p className="mb-0 text-muted small">
                            Monitor payment processing states
                          </p>
                        </div>
                        <Badge
                          bg="success"
                          className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm bg-opacity-100"
                        >
                          💳 Payment Data
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <ListGroup variant="flush" className="">
                            {Object.entries(data.breakdown.paymentStatuses).map(
                              ([status, count]) => (
                                <ListGroup.Item
                                  key={status}
                                  className="d-flex justify-content-between align-items-center px-0 py-2"
                                >
                                  <div className="d-flex align-items-center">
                                    <span
                                      className="d-inline-block rounded-circle me-2"
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        backgroundColor:
                                          PAYMENT_STATUS_COLORS[status] ||
                                          COLORS[0],
                                      }}
                                    ></span>
                                    <span className="small">{status}</span>
                                  </div>
                                  <Badge
                                    className="px-2 py-1 fw-semibold"
                                    style={{
                                      backgroundColor:
                                        PAYMENT_STATUS_COLORS[status] ||
                                        COLORS[0],
                                      color: "white",
                                    }}
                                  >
                                    {count}
                                  </Badge>
                                </ListGroup.Item>
                              )
                            )}
                          </ListGroup>
                        </Col>
                        <Col md={6} style={{ height: "240px" }} className="p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentStatusChartData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={85}
                                innerRadius={30}
                                paddingAngle={3}
                                label={({ percent }) =>
                                  percent !== undefined
                                    ? `${(percent * 100).toFixed(1)}%`
                                    : ""
                                }
                              >
                                {paymentStatusChartData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      PAYMENT_STATUS_COLORS[entry.name] ||
                                      COLORS[index % COLORS.length]
                                    }
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "none",
                                  borderRadius: "12px",
                                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                  fontSize: "14px",
                                }}
                                formatter={(value, name) => [
                                  `${value} payments`,
                                  `💰 ${name}`,
                                ]}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={30}
                                iconType="circle"
                                wrapperStyle={{
                                  fontSize: "12px",
                                  paddingTop: "8px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* CATEGORIES AND DEPARTMENTS */}
              <Row className="mb-4 g-4">
                <Col lg={6}>
                  <Card className="h-100 shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-4 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 fw-bold text-warning">
                          📂 Expenses by Category
                        </h6>
                        <p className="mb-0 text-muted small">
                          Category-wise expense breakdown
                        </p>
                      </div>
                      <Badge
                        bg="warning"
                        className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm bg-opacity-100"
                      >
                        📊 Analysis
                      </Badge>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Category</th>
                              <th className="text-end">Count</th>
                              <th className="text-end">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.breakdown.categories.length > 0 ? (
                              data.breakdown.categories.map((c) => (
                                <tr key={c.categoryId}>
                                  <td>Category {c.categoryId}</td>
                                  <td className="text-end">{c.count}</td>
                                  <td className="text-end fw-bold">
                                    <CashStack size={16} className="me-1" />
                                    {c.totalAmount.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="text-center text-muted py-4"
                                >
                                  No category data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-white">
                      <div style={{ height: "240px" }} className="p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={categoryChartData}
                            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                          >
                            <defs>
                              <linearGradient
                                id="categoryGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#f97316"
                                  stopOpacity={0.9}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#dc2626"
                                  stopOpacity={0.7}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                fontSize: "14px",
                              }}
                              formatter={(value) => [
                                `$${Number(value).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`,
                                "💰 Amount",
                              ]}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: "12px",
                                paddingTop: "10px",
                              }}
                            />
                            <Bar
                              dataKey="totalAmount"
                              fill="url(#categoryGradient)"
                              radius={[8, 8, 0, 0]}
                              name="💰 Total Amount"
                              stroke="#ffffff"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
                <Col lg={6}>
                  <Card className="h-100 shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-4 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 fw-bold text-info">
                          🏢 Expenses by Department
                        </h6>
                        <p className="mb-0 text-muted small">
                          Department-wise spending analysis
                        </p>
                      </div>
                      <Badge
                        bg="info"
                        className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm bg-opacity-100"
                      >
                        📈 Trends
                      </Badge>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Department</th>
                              <th className="text-end">Count</th>
                              <th className="text-end">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.breakdown.departments.length > 0 ? (
                              data.breakdown.departments.map((d) => (
                                <tr key={d.departmentId}>
                                  <td>Department {d.departmentId}</td>
                                  <td className="text-end">{d.count}</td>
                                  <td className="text-end fw-bold">
                                    $
                                    {d.totalAmount.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="text-center text-muted py-4"
                                >
                                  No department data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-white">
                      <div style={{ height: "240px" }} className="p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={departmentChartData}
                            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                          >
                            <defs>
                              <linearGradient
                                id="departmentGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#8b5cf6"
                                  stopOpacity={0.9}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#ec4899"
                                  stopOpacity={0.7}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                fontSize: "14px",
                              }}
                              formatter={(value) => [
                                `$${Number(value).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`,
                                "🏢 Amount",
                              ]}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: "12px",
                                paddingTop: "10px",
                              }}
                            />
                            <Bar
                              dataKey="totalAmount"
                              fill="url(#departmentGradient)"
                              radius={[8, 8, 0, 0]}
                              name="🏢 Total Amount"
                              stroke="#ffffff"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              </Row>

              {/* APPROVAL STEPS AND CATEGORY DETAILS */}
              <Row className="mb-4 g-4">
                <Col md={6}>
                  <Card className="h-100 shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-3">
                      <h6 className="mb-0 fw-bold">Approval Steps</h6>
                    </Card.Header>
                    <Card.Body>
                      {Object.entries(data.breakdown.approvalSteps).length >
                        0 ? (
                        <ListGroup variant="flush">
                          {Object.entries(data.breakdown.approvalSteps).map(
                            ([status, count]) => (
                              <ListGroup.Item
                                key={status}
                                className="d-flex justify-content-between align-items-center px-0 py-2"
                              >
                                <span>{status}</span>
                                <Badge bg="primary" pill>
                                  {count}
                                </Badge>
                              </ListGroup.Item>
                            )
                          )}
                        </ListGroup>
                      ) : (
                        <div className="text-center text-muted py-4">
                          No approval step data available
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold">Top Categories</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Category Name</th>
                              <th className="text-end">Count</th>
                              <th className="text-end">Total Amount</th>
                              <th className="text-end">Average</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.categoryDetails.length > 0 ? (
                              data.categoryDetails.map((cat) => (
                                <tr key={cat.id}>
                                  <td>{cat.name}</td>
                                  <td className="text-end">{cat.count}</td>
                                  <td className="text-end fw-bold">
                                    {cat.totalAmount.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="text-end">
                                    {cat.averageAmount.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="text-center text-muted py-4"
                                >
                                  No category details available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* RECENT EXPENSES */}
              <Row className="mb-4">
                <Col>
                  <Card className="shadow-sm border-0 rounded-3">
                    <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold">Recent Expenses</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <RecentExpensesTable expenses={data.recentExpenses} />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>

      {/* Custom CSS for enhanced styling */}
      <style jsx global>{`
        .chart-container {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chart-container:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }

        .card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important;
        }

        .btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .table-hover tbody tr {
          transition: all 0.2s ease;
        }

        .table-hover tbody tr:hover {
          background-color: rgba(102, 126, 234, 0.05) !important;
          transform: scale(1.01);
        }

        .list-group-item {
          transition: all 0.2s ease;
        }

        .list-group-item:hover {
          background-color: rgba(102, 126, 234, 0.03);
        }

        .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .badge {
          transition: all 0.2s ease;
        }

        .badge:hover {
          transform: scale(1.05);
        }
      `}</style>
    </AuthProvider>
  );
}
