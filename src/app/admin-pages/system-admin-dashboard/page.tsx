"use client";

import { useEffect, useState } from "react";

import {
  Container,
  Row,
  Col,
  Nav,
  Table,
  Button,
  Badge,
  Navbar,
  Card,
  InputGroup,
  FormControl,
  Breadcrumb,
} from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  People,
  Pencil,
  Trash,
  PersonCircle,
  Search,
  Grid3x3Gap,
  ShieldLock,
  Activity,
  Globe,
  Eye,
  Wallet,
  StarFill,
} from "react-bootstrap-icons";
import AuthProvider from "../../authPages/tokenData";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../../static/apiConfig";
import TopNavbar from "../../components/Navbar";
import InstitutionCreationModal from "../../components/modals/create-institution";
import { default as PageLoader } from "@/app/components/PageLoader";
import RoleCreationModal from "@/app/components/modals/system-admin-role-creation";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";
import AdminCreateUserModal from "@/app/components/modals/system-admin-new-user";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  institution: {
    id: number;
    name: string;
    country: string | null;
  } | null;
  department: {
    id: number;
    name: string;
  };
}

interface Institution {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: string;
  status: string;
  isActive: boolean;
  industry: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  trialEndDate: string | null;
  billingEmail: string | null;
  _count: {
    users: number;
    departments: number;
  };
}

interface Statistics {
  totalUsers: number;
  totalInstitutions: number;
  activeInstitutions: number;
  totalDepartments: number;
}

interface UsersByInstitution {
  _count: {
    _all: number;
  };
  institutionId: number | null;
  institutionName?: string;
  country?: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  adminCreatedRole: boolean;
}

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [usersByInstitution, setUsersByInstitution] = useState<
    UsersByInstitution[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/system-admin/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.recentUsers || []);
        setInstitutions(data.institutions || []);
        setStatistics(data.statistics || null);
        setUsersByInstitution(data.enhancedUsersByInstitution || []);
        setRoles(data.roles || []);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      toast.error(`Failed to fetch data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInstitutions = institutions.filter(
    (institution) =>
      institution.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (institution.contactEmail &&
        institution.contactEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  // Format date for display - using DateTimeDisplay component instead

  // Get status color for charts
  const getStatusColor = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "#28a745"; // Green
      case "INACTIVE":
        return "#6c757d"; // Gray
      case "SUSPENDED":
        return "#dc3545"; // Red
      case "TRIAL":
        return "#ffc107"; // Yellow
      default:
        return "#6c757d"; // Gray
    }
  };

  // Generate user growth data for the last 30 days
  interface UserGrowthData {
    date: string;
    count: number;
  }

  const generateUserGrowthData = (users: User[]): UserGrowthData[] => {
    const days = 30;
    const result: UserGrowthData[] = [];
    const now = new Date();

    // Initialize data for each day
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      // Count users created on or before this date
      const count = users.filter((user) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt).toISOString().split("T")[0];
        return userDate <= dateString;
      }).length;

      result.push({
        date: dateString,
        count,
      });
    }

    return result;
  };

  // Get status variant
  const getStatusVariant = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "secondary";
      case "SUSPENDED":
        return "danger";
      case "TRIAL":
        return "warning";
      default:
        return "secondary";
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AuthProvider>
      <TopNavbar />

      <Container fluid className="p-0 super-admin-dashboard">
        {/* Top Navbar */}
        <Navbar
          className="px-4 border-bottom-0 shadow-sm p-3"
          style={{ backgroundColor: "#f8f9fc" }}
        >
          <div className="d-flex w-100 justify-content-between align-items-center">
            <div className="d-flex align-items-center d-row">
              <h5 className="mb-0 text-muted fw-bold">System Admin Panel</h5>
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="px-3 py-2 d-flex align-items-center gap-2 text-primary">
                <StarFill size={16} className="text-warning" />
                Super Admin
              </span>
            </div>
          </div>
        </Navbar>

        <Row className="g-0">
          {/* Sidebar */}
          <Col
            md={2}
            className="sidebar d-flex flex-column p-0 border-end-0 shadow-sm"
            style={{ minHeight: "100vh", backgroundColor: "#f8f9fc" }}
          >
            <div className="p-4">
              <Nav className="flex-column gap-2">
                <div className="small text-muted text-uppercase fw-bold mb-2 px-2">
                  Overview
                </div>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "dashboard"}
                    onClick={() => setActiveTab("dashboard")}
                    className={`rounded-3 py-3 px-3 d-flex align-items-center position-relative ${
                      activeTab === "dashboard" ? "active-nav-link" : "nav-link"
                    }`}
                  >
                    <Grid3x3Gap className="me-3" size={18} />
                    <span className="fw-medium">Dashboard</span>
                    {activeTab === "dashboard" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "4px", height: "60%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>

                <div className="small text-muted text-uppercase fw-bold mb-2 mt-3 px-2">
                  Management
                </div>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "users"}
                    onClick={() => setActiveTab("users")}
                    className={`rounded-3 py-3 px-3 d-flex align-items-center justify-content-between position-relative ${
                      activeTab === "users" ? "active-nav-link" : "nav-link"
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <People className="me-3" size={18} />
                      <span className="fw-medium">Users</span>
                    </div>
                    <Badge
                      bg={activeTab === "users" ? "primary" : "light"}
                      text={activeTab === "users" ? "white" : "muted"}
                      className="small"
                    >
                      {users.length}
                    </Badge>
                    {activeTab === "users" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "4px", height: "60%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "institutions"}
                    onClick={() => setActiveTab("institutions")}
                    className={`rounded-3 py-3 px-3 d-flex align-items-center justify-content-between position-relative ${
                      activeTab === "institutions"
                        ? "active-nav-link"
                        : "nav-link"
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <Globe className="me-3" size={18} />
                      <span className="fw-medium">Institutions</span>
                    </div>
                    <Badge
                      bg={activeTab === "institutions" ? "primary" : "light"}
                      text={activeTab === "institutions" ? "white" : "muted"}
                      className="small"
                    >
                      {institutions.length}
                    </Badge>
                    {activeTab === "institutions" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "4px", height: "60%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "roles"}
                    onClick={() => setActiveTab("roles")}
                    className={`rounded-3 py-3 px-3 d-flex align-items-center justify-content-between position-relative ${
                      activeTab === "roles" ? "active-nav-link" : "nav-link"
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <ShieldLock className="me-3" size={18} />
                      <span className="fw-medium">Roles</span>
                    </div>
                    <Badge
                      bg={activeTab === "roles" ? "primary" : "light"}
                      text={activeTab === "roles" ? "white" : "muted"}
                      className="small"
                    >
                      {roles.length}
                    </Badge>
                    {activeTab === "roles" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "4px", height: "60%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>

                <div className="small text-muted text-uppercase fw-bold mb-2 mt-3 px-2">
                  Finance
                </div>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "billing"}
                    onClick={() => setActiveTab("billing")}
                    className={`rounded-3 py-3 px-3 d-flex align-items-center position-relative ${
                      activeTab === "billing" ? "active-nav-link" : "nav-link"
                    }`}
                  >
                    <Wallet className="me-3" size={18} />
                    <span className="fw-medium">Billing</span>
                    {activeTab === "billing" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "4px", height: "60%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            <div className="mt-auto p-4 border-top">
              <div className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                    <Activity size={12} className="text-success" />
                  </div>
                  <small className="text-success fw-medium">
                    System Healthy
                  </small>
                </div>
                <Badge bg="light" text="primary" className="mb-2 px-3 py-1">
                  v3.2.1
                </Badge>
                <div className="small text-muted">Updated: Oct 24, 2023</div>
              </div>
            </div>
          </Col>

          {/* Main Content */}
          <Col
            md={10}
            className="p-0 content-area"
            style={{ backgroundColor: "#fafbfc" }}
          >
            <div className="p-4">
              {/* Dashboard Overview */}
              {activeTab === "dashboard" && (
                <>
                  <div className="border border-start border-primary border-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-4 rounded-4 shadow-sm border-0 position-relative overflow-hidden bg-primary bg-opacity-10">
                    <div className="d-flex align-items-center mb-3 mb-md-0 position-relative">
                      <div className="bg-primary bg-opacity-20 p-3 rounded-circle me-3 shadow-sm">
                        <Grid3x3Gap size={28} className="text-light" />
                      </div>
                      <div>
                        <h5 className="fw-bold text-primary mb-1">
                          System Overview Dashboard
                        </h5>
                        <p className="text-muted small mb-0 fw-medium">
                          Monitor and manage your entire system from one central
                          location
                        </p>
                        <div className="d-flex align-items-center mt-2">
                          <Badge bg="primary" className="me-2 px-2 py-1">
                            Live Data
                          </Badge>
                          <Badge bg="success" className="px-2 py-1">
                            All Systems Operational
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                      <Breadcrumb className="mb-2 rounded-pill px-3 py-2">
                        <Breadcrumb.Item
                          active
                          className="d-flex align-items-center text-primary fw-medium"
                        >
                          <Grid3x3Gap size={16} className="me-1" />
                          <span>Dashboard</span>
                        </Breadcrumb.Item>
                      </Breadcrumb>
                    </div>
                  </div>

                  <Row className="g-4 mb-4">
                    <Col md={3}>
                      <Card className="h-100 shadow-sm stat-card bg-primary bg-opacity-75 border-start border-primary border-3">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <Globe className="me-2 text-white" size={20} />
                                <span className="small text-white fw-medium">
                                  Total Institutions
                                </span>
                              </div>
                              <h2 className="mb-1 fw-bold text-white">
                                {statistics?.totalInstitutions || 0}
                              </h2>
                              <div className="d-flex align-items-center">
                                <Badge
                                  bg="light"
                                  text="primary"
                                  className="small px-2 py-1"
                                >
                                  +12% this month
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-white bg-opacity-20 p-2 rounded">
                              <Globe size={24} className="text-primary" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="h-100 shadow-sm stat-card bg-success bg-opacity-75 border-start border-success border-3">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <People className="me-2 text-white" size={20} />
                                <span className="small text-white fw-medium">
                                  Active Users
                                </span>
                              </div>
                              <h2 className="mb-1 fw-bold text-white">
                                {
                                  users.filter((u) => u.status === "ACTIVE")
                                    .length
                                }
                              </h2>
                              <div className="d-flex align-items-center">
                                <Badge
                                  bg="light"
                                  text="success"
                                  className="small px-2 py-1"
                                >
                                  +8% this week
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-white bg-opacity-20 p-2 rounded">
                              <People size={24} className="text-success" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="h-100 shadow-sm stat-card bg-warning bg-opacity-75 border-start border-warning border-3">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <ShieldLock
                                  className="me-2 text-dark"
                                  size={20}
                                />
                                <span className="small text-dark fw-medium">
                                  System Roles
                                </span>
                              </div>
                              <h2 className="mb-1 fw-bold text-dark">
                                {roles.length}
                              </h2>
                              <div className="d-flex align-items-center">
                                <Badge bg="dark" className="small px-2 py-1">
                                  {users.filter((u) => u.role).length} assigned
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-dark bg-opacity-20 p-2 rounded">
                              <ShieldLock size={24} className="text-warning" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="h-100 shadow-sm stat-card bg-info bg-opacity-75 border-start border-info border-3">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <Activity
                                  className="me-2 text-white"
                                  size={20}
                                />
                                <span className="small text-white fw-medium">
                                  System Health
                                </span>
                              </div>
                              <h5 className="mb-1 fw-bold text-white">100%</h5>
                              <div className="d-flex align-items-center">
                                <Badge
                                  bg="light"
                                  text="success"
                                  className="small px-2 py-1"
                                >
                                  All Systems Up
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-white bg-opacity-20 p-2 rounded">
                              <Activity size={24} className="text-info" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-4">
                    {/* User Growth Over Time */}
                    <Col md={6}>
                      <Card className="h-100 shadow-sm border-start border-primary border-3">
                        <Card.Header className="bg-gradient-primary border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-1 fw-bold text-white">
                                📈 User Growth Analytics
                              </h5>
                              <p className="mb-0 text-white-50 small">
                                Track user acquisition trends
                              </p>
                            </div>
                            <Badge
                              bg="white"
                              text="primary"
                              className="px-3 py-2 rounded-pill fw-semibold"
                            >
                              📅 Last 30 Days
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: "320px" }} className="p-3">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={generateUserGrowthData(users)}
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 0,
                                  bottom: 5,
                                }}
                              >
                                <defs>
                                  <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 12, fill: '#6b7280' }}
                                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 12, fill: '#6b7280' }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    fontSize: '14px'
                                  }}
                                  formatter={(value) => [
                                    `${value} users`,
                                    "👥 Total Users",
                                  ]}
                                  labelFormatter={(label) => `📅 ${new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#667eea"
                                  strokeWidth={3}
                                  fill="url(#userGrowthGradient)"
                                  dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#667eea', strokeWidth: 2, fill: '#ffffff' }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Institutions by Country */}
                    <Col md={6}>
                      <Card className="h-100 shadow-sm border-start border-info border-3">
                        <Card.Header className="bg-gradient-info border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-1 fw-bold text-white">
                                🌍 Geographic Distribution
                              </h5>
                              <p className="mb-0 text-white-50 small">
                                Institution spread across regions
                              </p>
                            </div>
                            <Badge
                              bg="white"
                              text="info"
                              className="px-3 py-2 rounded-pill fw-semibold"
                            >
                              🏁 By Country
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: "320px" }} className="p-3">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={institutions.reduce(
                                    (
                                      acc: { name: string; value: number }[],
                                      inst
                                    ) => {
                                      const country = inst.country || "🌐 Unknown";
                                      const existing = acc.find(
                                        (item) => item.name === country
                                      );
                                      if (existing) {
                                        existing.value += 1;
                                      } else {
                                        acc.push({ name: country, value: 1 });
                                      }
                                      return acc;
                                    },
                                    []
                                  )}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({
                                    name,
                                    percent = 0,
                                  }: {
                                    name: string;
                                    percent?: number;
                                  }) =>
                                    `${(percent * 100).toFixed(1)}%`
                                  }
                                  outerRadius={85}
                                  innerRadius={35}
                                  paddingAngle={2}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {[
                                    "#4f46e5",
                                    "#06b6d4",
                                    "#10b981",
                                    "#f59e0b",
                                    "#ef4444",
                                    "#8b5cf6",
                                    "#ec4899",
                                    "#f97316",
                                  ].map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} stroke="#ffffff" strokeWidth={2} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    fontSize: '14px'
                                  }}
                                  formatter={(value, name) => [
                                    `${value} institutions`,
                                    `🏢 ${name}`,
                                  ]}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  height={36}
                                  iconType="circle"
                                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-4 mt-2">
                    <Col md={6}>
                      <Card className="h-100 shadow-sm border-start border-success border-3">
                        <Card.Header className="bg-white border-0 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold text-primary">
                              User Status Analysis
                            </h5>
                            <Badge
                              bg="light"
                              text="muted"
                              className="px-2 py-1"
                            >
                              Active vs Inactive
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={users.reduce(
                                    (
                                      acc: {
                                        name: string;
                                        value: number;
                                        color: string;
                                      }[],
                                      user
                                    ) => {
                                      const status = user.status || "UNKNOWN";
                                      const existing = acc.find(
                                        (item) => item.name === status
                                      );
                                      if (existing) {
                                        existing.value += 1;
                                      } else {
                                        acc.push({
                                          name: status,
                                          value: 1,
                                          color: getStatusColor(status),
                                        });
                                      }
                                      return acc;
                                    },
                                    []
                                  )}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({
                                    name,
                                    percent = 0,
                                  }: {
                                    name: string;
                                    percent?: number;
                                  }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {users
                                    .reduce(
                                      (
                                        acc: {
                                          name: string;
                                          value: number;
                                          color: string;
                                        }[],
                                        user
                                      ) => {
                                        const status = user.status || "UNKNOWN";
                                        if (
                                          !acc.find(
                                            (item) => item.name === status
                                          )
                                        ) {
                                          acc.push({
                                            name: status,
                                            value: 1,
                                            color: getStatusColor(status),
                                          });
                                        }
                                        return acc;
                                      },
                                      []
                                    )
                                    .map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [
                                    `${value} users`,
                                    name,
                                  ]}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100 shadow-sm border-start border-warning border-3">
                        <Card.Header className="bg-white border-0 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold text-primary">
                              Institution Status
                            </h5>
                            <Badge
                              bg="light"
                              text="muted"
                              className="px-2 py-1"
                            >
                              Status Distribution
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={institutions.reduce(
                                  (
                                    acc: { status: string; count: number }[],
                                    inst
                                  ) => {
                                    const status = inst.status || "UNKNOWN";
                                    const existing = acc.find(
                                      (item) => item.status === status
                                    );
                                    if (existing) {
                                      existing.count += 1;
                                    } else {
                                      acc.push({ status, count: 1 });
                                    }
                                    return acc;
                                  },
                                  []
                                )}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="status" />
                                <YAxis />
                                <Tooltip
                                  formatter={(value) => [
                                    `${value} institutions`,
                                    "Count",
                                  ]}
                                />
                                <Legend />
                                <Bar
                                  dataKey="count"
                                  fill="#8884d8"
                                  name="Institutions"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-4 mt-2">
                    {/* Users per Institution */}
                    <Col md={6}>
                      <Card className="h-100 shadow-sm border-start border-info border-3">
                        <Card.Header className="bg-white border-0 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold text-primary">
                              User Distribution
                            </h5>
                            <Badge
                              bg="light"
                              text="muted"
                              className="px-2 py-1"
                            >
                              Top 5 Institutions
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={usersByInstitution
                                  .slice(0, 5)
                                  .map((inst) => ({
                                    name: inst.institutionName || "Unknown",
                                    users: inst._count?._all || 0,
                                    country: inst.country || "N/A",
                                  }))}
                                layout="vertical"
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                  dataKey="name"
                                  type="category"
                                  width={100}
                                />
                                <Tooltip
                                  formatter={(value, name) => [
                                    value,
                                    name === "users" ? "Number of Users" : name,
                                  ]}
                                  labelFormatter={(label) =>
                                    `Institution: ${label}`
                                  }
                                />
                                <Legend />
                                <Bar
                                  dataKey="users"
                                  fill="#8884d8"
                                  name="Users"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Institution Status Distribution */}
                    <Col md={6}>
                      <Card className="h-100 shadow-sm border-start border-secondary border-3">
                        <Card.Header className="bg-white border-0 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold text-primary">
                              Subscription Overview
                            </h5>
                            <Badge
                              bg="light"
                              text="muted"
                              className="px-2 py-1"
                            >
                              Plans & Status
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={institutions.reduce(
                                    (
                                      acc: {
                                        name: string;
                                        value: number;
                                        color: string;
                                      }[],
                                      inst
                                    ) => {
                                      const status = inst.status || "UNKNOWN";
                                      const existing = acc.find(
                                        (item) => item.name === status
                                      );
                                      if (existing) {
                                        existing.value += 1;
                                      } else {
                                        acc.push({
                                          name: status,
                                          value: 1,
                                          color: getStatusColor(status),
                                        });
                                      }
                                      return acc;
                                    },
                                    []
                                  )}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({
                                    name,
                                    percent = 0,
                                  }: {
                                    name: string;
                                    percent?: number;
                                  }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {institutions
                                    .reduce(
                                      (
                                        acc: {
                                          name: string;
                                          value: number;
                                          color: string;
                                        }[],
                                        inst
                                      ) => {
                                        const status = inst.status || "UNKNOWN";
                                        if (
                                          !acc.find(
                                            (item) => item.name === status
                                          )
                                        ) {
                                          acc.push({
                                            name: status,
                                            value: 1,
                                            color: getStatusColor(status),
                                          });
                                        }
                                        return acc;
                                      },
                                      []
                                    )
                                    .map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [
                                    `${value} institutions`,
                                    name,
                                  ]}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <>
                  <div className="border border-start border-success border-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-4 rounded-4 shadow-sm border-0 position-relative overflow-hidden bg-success bg-opacity-10">
                    <div className="d-flex align-items-center mb-3 mb-md-0 position-relative">
                      <div className="bg-success bg-opacity-20 p-3 rounded-circle me-3 shadow-sm">
                        <People size={28} className="text-light" />
                      </div>
                      <div>
                        <h5 className="fw-bold text-success mb-1">
                          User Management System
                        </h5>
                        <p className="text-muted small mb-0 fw-medium">
                          Comprehensive user administration and permission
                          control
                        </p>
                        <div className="d-flex align-items-center mt-2">
                          <Badge bg="success" className="me-2 px-2 py-1">
                            {users.length} Total Users
                          </Badge>
                          <Badge bg="warning" text="dark" className="px-2 py-1">
                            {users.filter((u) => u.status === "ACTIVE").length}{" "}
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Breadcrumb className="mb-0 rounded-pill px-3 py-2">
                      <Breadcrumb.Item
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("dashboard");
                        }}
                        className="d-flex align-items-center text-decoration-none text-muted"
                      >
                        <Grid3x3Gap size={16} className="me-1" />
                        <span>Dashboard</span>
                      </Breadcrumb.Item>
                      <Breadcrumb.Item
                        active
                        className="d-flex align-items-center text-success fw-medium"
                      >
                        <People size={16} className="me-1" />
                        <span>User Management</span>
                      </Breadcrumb.Item>
                    </Breadcrumb>
                  </div>

                  <Card className="mb-4 shadow-sm">
                    <Card.Body className="p-4">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="position-relative">
                            <InputGroup className="shadow-sm">
                              <InputGroup.Text className="bg-light border-0 ps-3">
                                <Search className="text-muted" />
                              </InputGroup.Text>
                              <FormControl
                                placeholder="Search users by name, email, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 ps-2 bg-light"
                                style={{ fontSize: "14px" }}
                              />
                            </InputGroup>
                          </div>
                        </Col>
                        <Col
                          md={6}
                          className="d-flex justify-content-end align-items-center gap-3"
                        >
                          <div className="d-flex align-items-center text-muted small">
                            <span className="me-1">Total:</span>
                            <Badge bg="primary" className="px-2 py-1">
                              {filteredUsers.length}
                            </Badge>
                          </div>
                          <AdminCreateUserModal
                            onSuccess={fetchData}
                            roles={roles}
                            institutions={institutions}
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-primary">
                          User Directory
                        </h5>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="success" className="px-2 py-1">
                            {users.filter((u) => u.status === "ACTIVE").length}{" "}
                            Active
                          </Badge>
                          <Badge bg="secondary" className="px-2 py-1">
                            {users.filter((u) => u.status !== "ACTIVE").length}{" "}
                            Inactive
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table hover responsive className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-bold text-muted small px-4 py-3">
                              #
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              User
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Email
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Department
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Institution
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Last Login
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Status
                            </th>
                            <th className="fw-bold text-muted small text-center py-3">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, idx) => (
                            <tr key={user.id} className="border-0">
                              <td className="px-4 py-3 text-muted small">
                                {idx + 1}
                              </td>
                              <td className="py-3">
                                <div className="d-flex align-items-center">
                                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                                    <PersonCircle
                                      className="text-primary"
                                      size={20}
                                    />
                                  </div>
                                  <div>
                                    <div className="fw-medium">
                                      {user.firstName + " " + user.lastName}
                                    </div>
                                    <small className="text-muted">
                                      {user.role || "No role assigned"}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="fw-medium">{user.email}</span>
                              </td>
                              <td className="py-3">
                                <span className="text-muted">
                                  {user.department?.name || "N/A"}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="bg-light rounded-circle me-2 d-flex align-items-center justify-content-center"
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      fontSize: "10px",
                                    }}
                                  >
                                    {user.institution?.name?.charAt(0) || "N"}
                                  </div>
                                  <span className="text-muted small">
                                    {user.institution?.name || "None"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3">
                                <small className="text-muted">
                                  {user.lastLogin ? (
                                    <DateTimeDisplay date={user.lastLogin} />
                                  ) : (
                                    "Never"
                                  )}
                                </small>
                              </td>
                              <td className="py-3">
                                <Badge
                                  bg={getStatusVariant(user.status)}
                                  className="px-3 py-2 fw-medium"
                                >
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="text-center py-3">
                                <div className="d-flex justify-content-center gap-1">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="action-btn border-0"
                                    title="View Details"
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="action-btn border-0"
                                    title="Edit User"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="action-btn border-0"
                                    title="Delete User"
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </>
              )}

              {/* Institutions Tab */}
              {activeTab === "institutions" && (
                <>
                  <div className="border border-start border-info border-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-4 rounded-4 shadow-sm border-0 position-relative overflow-hidden bg-info bg-opacity-10">
                    <div className="d-flex align-items-center mb-3 mb-md-0 position-relative">
                      <div className="bg-info bg-opacity-20 p-3 rounded-circle me-3 shadow-sm">
                        <Globe size={28} className="text-light" />
                      </div>
                      <div>
                        <h5 className="fw-bold text-info mb-1">
                          Institution Management
                        </h5>
                        <p className="text-muted small mb-0 fw-medium">
                          Oversee all registered organizations and their
                          configurations
                        </p>
                        <div className="d-flex align-items-center mt-2">
                          <Badge bg="info" className="me-2 px-2 py-1">
                            {institutions.length} Organizations
                          </Badge>
                          <Badge bg="success" className="px-2 py-1">
                            {
                              institutions.filter((i) => i.status === "ACTIVE")
                                .length
                            }{" "}
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Breadcrumb className="mb-0 rounded-pill px-3 py-2">
                      <Breadcrumb.Item
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("dashboard");
                        }}
                        className="d-flex align-items-center text-decoration-none text-muted"
                      >
                        <Grid3x3Gap size={16} className="me-1" />
                        <span>Dashboard</span>
                      </Breadcrumb.Item>
                      <Breadcrumb.Item
                        active
                        className="d-flex align-items-center text-info fw-medium"
                      >
                        <Globe size={16} className="me-1" />
                        <span>Institutions</span>
                      </Breadcrumb.Item>
                    </Breadcrumb>
                  </div>

                  <Card className="mb-4 shadow-sm">
                    <Card.Body className="p-4">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="position-relative">
                            <InputGroup className="shadow-sm">
                              <InputGroup.Text className="bg-light border-0 ps-3">
                                <Search className="text-muted" />
                              </InputGroup.Text>
                              <FormControl
                                placeholder="Search institutions by name, email, or country..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 ps-2 bg-light"
                                style={{ fontSize: "14px" }}
                              />
                            </InputGroup>
                          </div>
                        </Col>
                        <Col
                          md={6}
                          className="d-flex justify-content-end align-items-center gap-3"
                        >
                          <div className="d-flex align-items-center text-muted small">
                            <span className="me-1">Total:</span>
                            <Badge bg="primary" className="px-2 py-1">
                              {filteredInstitutions.length}
                            </Badge>
                          </div>
                          <InstitutionCreationModal />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-primary">
                          Institution Directory
                        </h5>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="success" className="px-2 py-1">
                            {
                              institutions.filter((i) => i.status === "ACTIVE")
                                .length
                            }{" "}
                            Active
                          </Badge>
                          <Badge bg="warning" className="px-2 py-1">
                            {
                              institutions.filter(
                                (i) => i.subscriptionPlan === "PREMIUM"
                              ).length
                            }{" "}
                            Premium
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table hover responsive className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-bold text-muted small px-4 py-3">
                              ID
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Organization
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Users
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Departments
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Subscription
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Status
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Created
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInstitutions.map((institution) => (
                            <tr key={institution.id}>
                              <td>{institution.id}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {institution.logoUrl ? (
                                    <img
                                      src={institution.logoUrl}
                                      alt={institution.name}
                                      style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "50%",
                                        marginRight: "8px",
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="d-flex align-items-center justify-content-center"
                                      style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "50%",
                                        backgroundColor: "#f0f0f0",
                                        marginRight: "8px",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        color: "#666",
                                      }}
                                    >
                                      {institution.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{institution.name}</span>
                                </div>
                              </td>
                              <td>{institution._count.users}</td>
                              <td>{institution._count.departments}</td>
                              <td>
                                <Badge
                                  bg={
                                    institution.subscriptionPlan === "PREMIUM"
                                      ? "primary"
                                      : institution.subscriptionPlan ===
                                        "ENTERPRISE"
                                      ? "dark"
                                      : "secondary"
                                  }
                                  className="text-uppercase"
                                >
                                  {institution.subscriptionPlan || "FREE"}
                                </Badge>
                              </td>
                              <td>
                                <Badge
                                  bg={getStatusVariant(institution.status)}
                                  className="text-capitalize"
                                >
                                  {institution.status?.toLowerCase() ||
                                    "inactive"}
                                </Badge>
                              </td>
                              <td>
                                <DateTimeDisplay date={institution.createdAt} />
                              </td>
                              <td>
                                <div className="d-flex">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    title="Delete"
                                    className="me-2"
                                  >
                                    <Trash size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    title="View Details"
                                  >
                                    <Eye size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </>
              )}

              {/* Roles Tab */}
              {activeTab === "roles" && (
                <>
                  <div className="border border-start border-secondary border-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-secondary bg-opacity-10 p-4 rounded-4 shadow-sm border-0 position-relative overflow-hidden">
                    <div className="d-flex align-items-center mb-3 mb-md-0 position-relative">
                      <div className="bg-secondary bg-opacity-20 p-3 rounded-circle me-3 shadow-sm">
                        <ShieldLock size={28} className="text-light" />
                      </div>
                      <div>
                        <h5 className="fw-bold text-secondary mb-1">
                          Roles & Permissions Management
                        </h5>
                        <p className="text-muted small mb-0 fw-medium">
                          Define and manage system access controls and user
                          permissions
                        </p>
                        <div className="d-flex align-items-center mt-2">
                          <Badge
                            text="dark"
                            className="me-2 px-2 py-1 bg-secondary bg-opacity-10"
                          >
                            {roles.length} Active Roles
                          </Badge>
                          <Badge
                            bg="light"
                            className="px-2 py-1 text-dark border"
                          >
                            System Level
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Breadcrumb className="mb-0 rounded-pill px-3 py-2">
                      <Breadcrumb.Item
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("dashboard");
                        }}
                        className="d-flex align-items-center text-decoration-none text-muted"
                      >
                        <Grid3x3Gap size={16} className="me-1" />
                        <span>Dashboard</span>
                      </Breadcrumb.Item>
                      <Breadcrumb.Item
                        active
                        className="d-flex align-items-center text-secondary fw-medium"
                      >
                        <ShieldLock size={16} className="me-1" />
                        <span>Roles & Permissions</span>
                      </Breadcrumb.Item>
                    </Breadcrumb>
                  </div>

                  <Card className="mb-4 shadow-sm">
                    <Card.Body className="p-4">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="position-relative">
                            <InputGroup className="shadow-sm">
                              <InputGroup.Text className="bg-light border-0 ps-3">
                                <Search className="text-muted" />
                              </InputGroup.Text>
                              <FormControl
                                placeholder="Search roles by name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 ps-2 bg-light"
                                style={{ fontSize: "14px" }}
                              />
                            </InputGroup>
                          </div>
                        </Col>
                        <Col
                          md={6}
                          className="d-flex justify-content-end align-items-center gap-3"
                        >
                          <div className="d-flex align-items-center text-muted small">
                            <span className="me-1">Total:</span>
                            <Badge bg="primary" className="px-2 py-1">
                              {roles.length}
                            </Badge>
                          </div>
                          <RoleCreationModal onSuccess={fetchData} />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-primary">
                          System Roles
                        </h5>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="primary" className="px-2 py-1">
                            {roles.filter((r) => r.adminCreatedRole).length}{" "}
                            Admin Roles
                          </Badge>
                          <Badge bg="secondary" className="px-2 py-1">
                            {roles.filter((r) => !r.adminCreatedRole).length}{" "}
                            Custom Roles
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table hover responsive className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="fw-bold text-muted small px-4 py-3">
                              ID
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Created
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Updated
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Role Name
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Description
                            </th>
                            <th className="fw-bold text-muted small py-3">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {roles.map((role) => (
                            <tr key={role.id} className="border-0">
                              <td className="px-4 py-3 text-muted small fw-medium">
                                {role.id}
                              </td>
                              <td className="py-3">
                                <small className="text-muted">
                                  <DateTimeDisplay date={role.createdAt} />
                                </small>
                              </td>
                              <td className="py-3">
                                <div className="d-flex align-items-center">
                                  <small
                                    className={
                                      role.updatedAt !== role.createdAt
                                        ? "text-warning"
                                        : "text-muted"
                                    }
                                  >
                                    <DateTimeDisplay date={role.updatedAt} />
                                  </small>
                                  {role.updatedAt !== role.createdAt && (
                                    <Badge bg="warning" className="ms-2 small">
                                      Modified
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="d-flex align-items-center">
                                  <div
                                    className={`bg-${
                                      role.adminCreatedRole
                                        ? "primary"
                                        : "success"
                                    } bg-opacity-10 p-2 rounded me-2`}
                                  >
                                    <ShieldLock
                                      className={`text-${
                                        role.adminCreatedRole
                                          ? "primary"
                                          : "success"
                                      }`}
                                      size={16}
                                    />
                                  </div>
                                  <div>
                                    <span
                                      className={`fw-bold text-${
                                        role.adminCreatedRole
                                          ? "primary"
                                          : "success"
                                      }`}
                                    >
                                      {role.name.toUpperCase()}
                                    </span>
                                    <div>
                                      <Badge
                                        bg={
                                          role.adminCreatedRole
                                            ? "primary"
                                            : "success"
                                        }
                                        className="small"
                                      >
                                        {role.adminCreatedRole
                                          ? "System Role"
                                          : "Custom Role"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="text-muted">
                                  {role.description}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="action-btn border-0"
                                    title="Edit Role"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="action-btn border-0"
                                    title="Delete Role"
                                    disabled={role.adminCreatedRole}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </>
              )}

              {activeTab === "billing" && (
                <div className="text-center py-5">
                  <Wallet size={48} className="text-primary mb-3" />
                  <h3>Billing Information</h3>
                  <p className="text-muted">
                    Billing and subscription details will be displayed here.
                  </p>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Custom CSS */}
        <style jsx global>{`
          .super-admin-dashboard {
            font-family: "Inter", "Segoe UI", Tahoma, Geneva, Verdana,
              sans-serif;
            background-color: #fafbfc;
            color: #212529;
          }

          .bg-gradient-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          }

          .bg-gradient-info {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
          }

          .bg-gradient-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          }

          .bg-gradient-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
          }

          .sidebar {
            background-color: #f8f9fc !important;
            border-right: 1px solid #e3e6f0 !important;
          }

          .nav-link {
            color: #6c757d !important;
            transition: all 0.3s ease;
            border-radius: 12px !important;
            margin-bottom: 4px;
            border: 1px solid transparent;
          }

          .nav-link:hover {
            background-color: #e3f2fd !important;
            color: #1976d2 !important;
            transform: translateX(4px);
            border-color: #e3f2fd;
          }

          .active-nav-link {
            background-color: #fff !important;
            color: #1976d2 !important;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-color: #fff;
          }

          .content-area {
            background-color: #fafbfc !important;
            min-height: 100vh;
          }

          .stat-card {
            transition: all 0.3s ease;
            border: none !important;
          }

          .stat-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .action-btn {
            border-radius: 8px;
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .action-btn:hover {
            transform: scale(1.1);
          }

          .table th {
            border: none !important;
            font-weight: 600;
            color: #6c757d;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            background-color: #f8f9fc !important;
          }

          .table td {
            border: none !important;
            vertical-align: middle;
            border-bottom: 1px solid #f1f3f4 !important;
          }

          .table-hover tbody tr:hover {
            background-color: #f8f9fc;
          }

          .card {
            border-radius: 16px !important;
            transition: all 0.3s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .btn {
            border-radius: 12px !important;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          .badge {
            border-radius: 8px !important;
            font-weight: 500;
          }

          .hover-text-white:hover {
            color: white !important;
          }

          .backdrop-blur {
            backdrop-filter: blur(10px);
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .card {
            animation: fadeInUp 0.5s ease-out;
          }

          .breadcrumb-item + .breadcrumb-item::before {
            color: rgba(255, 255, 255, 0.5) !important;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
