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
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="mb-3" style={{ fontSize: "3rem" }}>
            📊
          </div>
          <h4>No data available</h4>
          <p className="text-muted mb-3">
            There's no expense data to display yet
          </p>
          <Button size="sm" variant="primary" onClick={fetchData}>
            Refresh page
          </Button>
        </div>
      </div>
    );

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
      <div className="min-vh-100  mt-3">
        <Container fluid className="">
          <Container fluid className="">
            <Row className="mb-4 align-items-center shadow-sm border-start border-3 border-primary rounded bg-info bg-opacity-10 p-3">
              <Col>
                <h5 className="mb-1 fw-bold mb-0">Expense Dashboard</h5>
                <p className="text-muted mb-0">
                  Overview of all expense activities
                </p>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="me-2"
                  onClick={() =>
                    handleNavigation("/expense-management/create-expense")
                  }
                >
                  <FaPlus size={16} className="me-1" />
                  Create Expense
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={refreshData}
                  className="me-2"
                >
                  <RefreshCw size={16} className="me-1" /> Refresh
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={exportData}
                >
                  <Download size={16} className="me-1" /> Export
                </Button>
              </Col>
            </Row>
          </Container>
          {/* Time filter controls */}
          <Row className="mb-1">
            <Col>
              <Card className="border-0 ">
                <Card.Body className="py-3 px-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center">
                    {/* Left side: Filter */}
                    <div className="d-flex align-items-center mb-2 mb-sm-0">
                      <div className="d-flex align-items-center bg-light bg-opacity-10 rounded px-1 py-1">
                        <Filter size={16} className="text-primary" />
                        <Form.Select
                          size="sm"
                          className="border-0 bg-transparent text-dark"
                          style={{ width: "auto" }}
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
                    <div className="text-muted  fw-medium bg-light bg-opacity-10 rounded px-1 py-1 border-0">
                      {data.dateRange.startDate && data.dateRange.endDate ? (
                        <span>
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
                        <span className="text-muted fw-semibold">
                          No date range available
                        </span>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* SUMMARY CARDS */}
          <Row className="mb-4">
            <Col xxl={2} lg={4} md={6} className="mb-3">
              <Card
                className="h-100 shadow-sm bg-primary bg-opacity-10"
                style={{ borderLeft: "4px solid var(--bs-primary)" }}
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
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <FileText size={24} className="text-primary" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xxl={2} lg={4} md={6} className="mb-3">
              <Card
                className="h-100 shadow-sm bg-success bg-opacity-10"
                style={{ borderLeft: "4px solid var(--bs-success)" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-1">
                        Total Amount
                      </h6>
                      <h6 className="fw-bold mb-0">
                        <CashStack size={16} className="me-1" />
                        {data.summary.totalAmount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? 0}
                      </h6>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <TrendingUp size={24} className="text-success" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xxl={2} lg={4} md={6} className="mb-3">
              <Card
                className="h-100 shadow-sm bg-info bg-opacity-10"
                style={{ borderLeft: "4px solid var(--bs-info)" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-1">
                        Average Amount
                      </h6>
                      <h6 className="fw-bold mb-0">
                        {data.summary.averageAmount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? 0}
                      </h6>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded">
                      <BarChart3 size={24} className="text-info" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xxl={2} lg={4} md={6} className="mb-3">
              <Card
                className="h-100 shadow-sm bg-warning bg-opacity-10"
                style={{ borderLeft: "4px solid var(--bs-warning)" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-1">
                        Pending Approvals{" "}
                        <span className="text-muted ">(steps)</span>
                      </h6>
                      <h6 className="fw-bold mb-0">
                        {data.summary.pendingApprovals ?? 0}
                      </h6>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                      <Clock size={24} className="text-warning" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xxl={2} lg={4} md={6} className="mb-3">
              <Card
                className="h-100 shadow-sm bg-secondary bg-opacity-10"
                style={{ borderLeft: "4px solid var(--bs-secondary)" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-1">Min Amount</h6>
                      <h6 className="fw-bold mb-0">
                        {data.summary.minAmount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? 0}
                      </h6>
                    </div>
                    <div className="bg-secondary bg-opacity-10 p-3 rounded">
                      <CashStack size={24} className="text-secondary" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xxl={2} lg={4} md={6} className="mb-3">
              <Card
                className="h-100 shadow-sm bg-danger bg-opacity-10"
                style={{ borderLeft: "4px solid var(--bs-danger)" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-1">Max Amount</h6>
                      <h6 className="fw-bold mb-0">
                        {data.summary.maxAmount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? 0}
                      </h6>
                    </div>
                    <div className="bg-danger bg-opacity-10 p-3 rounded">
                      <CashStack size={24} className="text-danger" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* CHARTS ROW */}
          <Row className="mb-4">
            <Col xl={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white py-3">
                  <h6 className="mb-0 fw-bold">Expense Status Distribution</h6>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <div className="d-flex flex-column h-100">
                        <h6 className=" text-muted mb-3">Status Breakdown</h6>
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
                                  <span>{status}</span>
                                </div>
                                <span className="bg-danger bg-opacity-50 text-light p-1 rounded">
                                  {count}
                                </span>
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
                      <div style={{ height: "220px" }} className="flex-grow-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusChartData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={70}
                              label={({ percent }) =>
                                percent !== undefined
                                  ? `${(percent * 100).toFixed(0)}%`
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
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [`${value}`, name]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>
                    <Col md={4} className="d-flex flex-column">
                      <h6 className=" text-muted text-center mb-3">
                        Bar Chart
                      </h6>
                      <div style={{ height: "220px" }} className="flex-grow-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={statusChartData}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#eee"
                            />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#4F46E5"
                              radius={[4, 4, 0, 0]}
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
            <Col xl={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white py-3">
                  <h6 className="mb-0 fw-bold">Payment Status Distribution</h6>
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
                                <span>{status}</span>
                              </div>
                              <span className="bg-danger bg-opacity-50 text-light p-1 rounded">
                                {count}
                              </span>
                            </ListGroup.Item>
                          )
                        )}
                      </ListGroup>
                    </Col>
                    <Col md={6} style={{ height: "200px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStatusChartData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={80}
                            label
                          >
                            {paymentStatusChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  PAYMENT_STATUS_COLORS[entry.name] ||
                                  COLORS[index % COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* CATEGORIES AND DEPARTMENTS */}
          <Row className="mb-4">
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Expenses by Category</h6>
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
                  <div style={{ height: "200px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                            "Amount",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalAmount"
                          fill="#4F46E5"
                          radius={[4, 4, 0, 0]}
                          name="Total Amount"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Expenses by Department</h6>
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
                  <div style={{ height: "200px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                            "Amount",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalAmount"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                          name="Total Amount"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          </Row>

          {/* APPROVAL STEPS AND CATEGORY DETAILS */}
          <Row className="mb-4">
            <Col md={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white py-3">
                  <h6 className="mb-0">Approval Steps</h6>
                </Card.Header>
                <Card.Body>
                  {Object.entries(data.breakdown.approvalSteps).length > 0 ? (
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
            <Col md={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Top Categories</h6>
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
                                {cat.averageAmount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Recent Expenses</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <RecentExpensesTable expenses={data.recentExpenses} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </AuthProvider>
  );
}
