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
  Gear,
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
} from "react-bootstrap-icons";
import AuthProvider from "../../authPages/tokenData";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../../static/apiConfig";
import TopNavbar from "../../components/Navbar";
import InstitutionCreationModal from "../../components/modals/create-institution";
import { default as PageLoader } from "@/app/components/PageLoader";
import { FaPlus } from "react-icons/fa";
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

      <Container fluid className="p-0 super-admin-dashboard small">
        {/* Top Navbar */}
        <Navbar
          bg="light"
          variant="light"
          expand="lg"
          className="px-4 border-bottom"
        >
          <div className="d-flex ms-auto align-items-center">
            <div className="system-status me-4 d-flex align-items-center">
              <div className="me-2 text-success">
                <Activity />
              </div>
              <div>
                <div className="fw-bold">Super Admin</div>
              </div>
            </div>
          </div>
        </Navbar>

        <Row className="g-0">
          {/* Sidebar */}
          <Col
            md={2}
            className="sidebar bg-light vh-100 d-flex flex-column p-3 border-end"
            style={{ minHeight: "100vh" }}
          >
            <h5 className="text-uppercase text-secondary fw-bold mt-3 mb-4 px-2 small">
              System Administration
            </h5>
            <Nav className="flex-column gap-1">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "dashboard"}
                  onClick={() => setActiveTab("dashboard")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "dashboard" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Grid3x3Gap className="me-2" /> Dashboard
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "users" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <People className="me-2" /> User Management
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "institutions"}
                  onClick={() => setActiveTab("institutions")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "institutions"
                      ? "active-nav-link"
                      : "nav-link"
                  }`}
                >
                  <Globe className="me-2" /> Institutions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "roles"}
                  onClick={() => setActiveTab("roles")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "roles" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <ShieldLock className="me-2" /> Roles & Permissions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "billing"}
                  onClick={() => setActiveTab("billing")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "billing" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Wallet className="me-2" /> Billing
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <div className="mt-auto p-2 text-center">
              <Badge bg="light" text="dark" className="mb-2 border">
                v3.2.1
              </Badge>
              <div className="small text-muted">Last updated: Oct 24, 2023</div>
            </div>
          </Col>

          {/* Main Content */}
          <Col md={10} className="p-4 bg-white content-area">
            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 rounded-3 shadow-sm bg-info p-4 bg-opacity-10">
                  <div className="d-flex align-items-center mb-3 mb-md-0">
                    <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                      <Grid3x3Gap size={24} className="text-success" />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">
                        System Overview
                      </h5>
                      <p className="text-muted small mb-0">
                        Welcome to your admin dashboard
                      </p>
                    </div>
                  </div>
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item
                      active
                      className="d-flex align-items-center"
                    >
                      <Grid3x3Gap size={16} className="me-1" />
                      <span>Dashboard</span>
                    </Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Row className="g-4 mb-4">
                  <Col md={12}>
                    <Card className="border-0">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">System Metrics</h5>
                      </Card.Header>
                      <Card.Body>
                        <Row className="g-3">
                          <Col xs={3}>
                            <div className="p-3 border-0 bg-primary bg-opacity-10 border-start border-primary border-3 rounded text-center">
                              <div className="text-muted small mb-1">
                                Total Institutions
                              </div>
                              <h3 className="mb-0">
                                {statistics?.totalInstitutions || 0}
                              </h3>
                            </div>
                          </Col>
                          <Col xs={3}>
                            <div className="p-3 border-0 bg-success bg-opacity-10 border-start border-success border-3 rounded text-center">
                              <div className="text-muted small mb-1">
                                Active Users
                              </div>
                              <h3 className="mb-0">
                                {
                                  users.filter((u) => u.status === "ACTIVE")
                                    .length
                                }
                              </h3>
                            </div>
                          </Col>
                          <Col xs={3}>
                            <div className="p-3 border-0 bg-warning bg-opacity-10 border-start border-warning border-3 rounded text-center">
                              <div className="text-muted small mb-1">
                                User Roles
                              </div>
                              <h3 className="mb-0">
                                {users.filter((u) => u.role).length}
                              </h3>
                            </div>
                          </Col>
                          <Col xs={3}>
                            <div className="p-3 border-0 bg-info bg-opacity-10 border-start border-info border-3 rounded text-center">
                              <div className="text-muted small mb-1">
                                System Status
                              </div>
                              <Badge bg="success" className="px-3 py-2">
                                All Systems Operational
                              </Badge>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="g-4">
                  {/* User Growth Over Time */}
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">User Growth (Last 30 Days)</h5>
                      </Card.Header>
                      <Card.Body>
                        <div style={{ height: "300px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={generateUserGrowthData(users)}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip
                                formatter={(value) => [
                                  `${value} users`,
                                  "Total Users",
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                fill="#8884d8"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Institutions by Country */}
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Institutions by Country</h5>
                      </Card.Header>
                      <Card.Body>
                        <div style={{ height: "300px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={institutions.reduce(
                                  (
                                    acc: { name: string; value: number }[],
                                    inst
                                  ) => {
                                    const country = inst.country || "Unknown";
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
                                }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {[
                                  "#0088FE",
                                  "#00C49F",
                                  "#FFBB28",
                                  "#FF8042",
                                  "#8884D8",
                                  "#82CA9D",
                                ].map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
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

                <Row className="g-4 mt-2">
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Users by Status</h5>
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
                                }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Institutions by Status</h5>
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
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Users per Institution</h5>
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
                    <Card className="h-100">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">
                          Institution Status Distribution
                        </h5>
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
                                }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-info p-4 bg-opacity-10 rounded-3 shadow-sm">
                  <div className="d-flex align-items-center mb-3 mb-md-0">
                    <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                      <People size={24} className="text-success" />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">
                        User Management
                      </h5>
                      <p className="text-muted small mb-0">
                        Manage system users and their permissions
                      </p>
                    </div>
                  </div>
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("dashboard");
                      }}
                      className="d-flex align-items-center text-decoration-none"
                    >
                      <Grid3x3Gap size={16} className="me-1" />
                      <span>Dashboard</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item
                      active
                      className="d-flex align-items-center"
                    >
                      <People size={16} className="me-1" />
                      <span>Users</span>
                    </Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="mb-4">
                  <Card.Body className="p-3">
                    <Row>
                      <Col md={6}>
                        <InputGroup>
                          <InputGroup.Text>
                            <Search />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6} className="d-flex justify-content-end">
                        <AdminCreateUserModal roles={roles} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>User</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Institution</th>
                          <th>Last Login</th>
                          <th>Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user, idx) => (
                          <tr key={user.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <PersonCircle
                                  className="me-2 text-primary"
                                  size={24}
                                />
                                {user.firstName + " " + user.lastName}
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>{user.department?.name || "N/A"}</td>
                            <td>{user.institution?.name || "None"}</td>
                            <td>
                              <small className="text-muted">
                                {user.lastLogin ? (
                                  <DateTimeDisplay date={user.lastLogin} />
                                ) : (
                                  "Never"
                                )}
                              </small>
                            </td>
                            <td>
                              <Badge
                                bg={getStatusVariant(user.status)}
                                className="px-2 py-1"
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-info"
                                size="sm"
                                className="me-2 action-btn"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="me-2 action-btn"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-btn"
                              >
                                <Trash size={14} />
                              </Button>
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
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-info p-4 bg-opacity-10 rounded-3 shadow-sm">
                  <div className="d-flex align-items-center mb-3 mb-md-0">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                      <Globe size={24} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">Institutions</h5>
                      <p className="text-muted small mb-0">
                        Manage all registered institutions
                      </p>
                    </div>
                  </div>
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("dashboard");
                      }}
                      className="d-flex align-items-center text-decoration-none"
                    >
                      <Grid3x3Gap size={16} className="me-1" />
                      <span>Dashboard</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item
                      active
                      className="d-flex align-items-center"
                    >
                      <Globe size={16} className="me-1" />
                      <span>Institutions</span>
                    </Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="mb-4">
                  <Card.Body className="p-3">
                    <Row>
                      <Col md={6}>
                        <InputGroup>
                          <InputGroup.Text>
                            <Search />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search institutions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6} className="d-flex justify-content-end">
                        <InstitutionCreationModal />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Users</th>
                          <th>Departments</th>
                          <th>Subscription</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
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
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 bg-info p-4 bg-opacity-10 rounded-3 shadow-sm">
                  <div className="d-flex align-items-center mb-3 mb-md-0">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                      <Gear size={24} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0">
                        Roles & Permissions
                      </h5>
                      <p className="text-muted small mb-0">
                        Manage roles and permissions
                      </p>
                    </div>
                  </div>
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("dashboard");
                      }}
                      className="d-flex align-items-center text-decoration-none"
                    >
                      <Grid3x3Gap size={16} className="me-1" />
                      <span>Dashboard</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item
                      active
                      className="d-flex align-items-center"
                    >
                      <Gear size={16} className="me-1" />
                      <span>Settings</span>
                    </Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="mb-4">
                  <Card.Body className="p-3">
                    <Row>
                      <Col md={6}>
                        <InputGroup>
                          <InputGroup.Text>
                            <Search />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6} className="d-flex justify-content-end">
                        <RoleCreationModal onSuccess={fetchData} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Created At</th>
                          <th>Updated At</th>
                          <th>Role Name</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td>{role.id}</td>
                            <td>
                              <DateTimeDisplay date={role.createdAt} />
                            </td>
                            <td
                              style={{
                                color:
                                  role.updatedAt !== role.createdAt
                                    ? "red"
                                    : "inherit",
                              }}
                            >
                              <DateTimeDisplay date={role.updatedAt} />
                            </td>
                            <td>
                              <span className="text-uppercase bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded small">
                                {role.name}
                              </span>
                            </td>
                            <td>{role.description}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button variant="outline-danger" size="sm">
                                <Trash size={14} />
                              </Button>
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
          </Col>
        </Row>

        {/* Custom CSS */}
        <style jsx global>{`
          .super-admin-dashboard {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #212529;
          }

          .sidebar {
            background-color: #f8f9fa !important;
          }

          .nav-link {
            color: #495057 !important;
            transition: all 0.2s ease;
          }

          .nav-link:hover,
          .active-nav-link {
            background-color: #e9ecef !important;
            color: #0d6efd !important;
            border-left: 3px solid #0d6efd;
          }

          .active-nav-link {
            font-weight: 500;
          }

          .content-area {
            background-color: #ffffff !important;
            min-height: 100vh;
          }

          .stat-card {
            transition: transform 0.2s ease;
            border: 1px solid #dee2e6 !important;
          }

          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 0 15px rgba(13, 110, 253, 0.15);
          }

          .action-btn {
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .table th {
            border-top: none;
            font-weight: 600;
            color: #495057;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background-color: #f8f9fa !important;
          }

          .table td {
            border-color: #dee2e6 !important;
            vertical-align: middle;
          }

          .table-hover tbody tr:hover {
            background-color: #f8f9fa;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
