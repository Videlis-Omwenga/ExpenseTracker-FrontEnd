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
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import {
  People,
  Gear,
  Pencil,
  Trash,
  PersonCircle,
  Search,
  Plus,
  Grid3x3Gap,
  StarFill,
  Bell,
} from "react-bootstrap-icons";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import AdminCreateUserModal from "@/app/components/modals/admin-create-user-modal";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";

enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING"
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  username: string | null;
  password: string;
  status: UserStatus;
  institution?: {
    id: number;
    name: string;
    country?: string | null;
  } | null;
  institutionId: number | null;
  department?: {
    id: number;
    name: string;
  } | null;
  departmentId: number | null;
  roles?: UserRole[];
  expenses?: Expense[];
  paidBy?: Expense[];
  ExpenseSteps?: ExpenseStep[];
  region?: {
    id: number;
    name: string;
  } | null;
  regionId: number | null;
  adminCreatedUser: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  systemLogs?: systemLogs[];
  budgets?: budgets[];
  categoryLogs?: categoryLogs[];
  DepartmentLogs?: DepartmentLogs[];
  approvalSteps?: approvalSteps[];
  Role?: Role[];
  userTracker?: userTracker[];
  // Computed fields for display
  name?: string; // firstName + lastName
  role?: string; // Primary role name
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  requestedById: number;
  paidById?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface systemLogs {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
}

interface budgets {
  id: number;
  name: string;
  amount: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface categoryLogs {
  id: number;
  userId: number;
  categoryId: number;
  action: string;
  createdAt: string;
}

interface DepartmentLogs {
  id: number;
  userId: number;
  departmentId: number;
  action: string;
  createdAt: string;
}

interface userTracker {
  id: number;
  userId: number;
  ipAddress: string;
  userAgent: string;
  location: string;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  institution?: {
    id: number;
    name: string;
  } | null;
  institutionId: number | null;
  users?: UserRole[] | number; // Can be array of UserRole or count
  permissions?: number; // Permission count for display
  WorkflowStep?: WorkflowStep[];
  ExpenseSteps?: ExpenseStep[];
  approvalSteps?: approvalSteps[];
  restrictToDepartment: boolean | null;
  departmentRestrictedTO?: departmentRestrictedTO[];
  createdAt: string | null;
  updatedAt: string | null;
  isActive: boolean | null;
  adminCreatedRole: boolean;
  createdBy: number | null;
  user?: {
    id: number;
    name: string;
  } | null;
}

interface UserRole {
  id: number;
  userId: number;
  roleId: number;
}

interface WorkflowStep {
  id: number;
  order: number;
  roleId: number;
  isOptional: boolean;
}

interface ExpenseStep {
  id: number;
  roleId: number;
  order: number;
}

interface approvalSteps {
  id: number;
  roleId: number;
  order: number;
}

interface departmentRestrictedTO {
  id: number;
  roleId: number;
  departmentId: number;
}

interface Stats {
  totalUsers: number;
  totalRoles: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRoles: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_API_URL}/company-admin/get-data`, {
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
          setUsers(data.getUsers || []);
          setRoles(data.getRoles || []);
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
      (user.name || `${user.firstName} ${user.lastName}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="p-0 admin-dashboard">
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
                Company Admin
              </span>
            </div>
          </div>
        </Navbar>

        <Row className="g-0">
          {/* Sidebar */}
          <Col
            md={2}
            className="sidebar bg-white vh-100 d-flex flex-column p-3 border-end"
            style={{ minHeight: "100vh" }}
          >
            <h5 className="text-uppercase text-secondary fw-bold mt-3 mb-4 px-2 small">
              Main Navigation
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
                  <People className="me-2" /> Users
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
                  <Gear className="me-2" /> Roles
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10} className="p-4 bg-light content-area">
            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark">Dashboard Overview</h3>
                  <Breadcrumb>
                    <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Alert variant="info" className="d-flex align-items-center">
                  <Bell className="me-2" />
                  <span>
                    Welcome back! You have 3 pending actions that need your
                    attention.
                  </span>
                </Alert>

                <Row className="mb-5 justify-content-center">
                  <Col md={4} className="mb-4">
                    <Card className="h-100 modern-stat-card border-0 overflow-hidden">
                      <Card.Body className="stat-body-gradient-blue p-4">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="d-flex align-items-center mb-3">
                              <div className="bg-primary bg-opacity-15 p-3 rounded-circle me-3">
                                <People size={28} className="text-primary" />
                              </div>
                            </div>
                            <h6 className="text-muted fw-semibold mb-2 text-uppercase letter-spacing">
                              Total Users
                            </h6>
                            <h2 className="fw-bold text-dark mb-0 display-6">
                              {stats.totalUsers}
                            </h2>
                            <small className="text-success fw-medium">
                              <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1">
                                Active system users
                              </span>
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4} className="mb-4">
                    <Card className="h-100 modern-stat-card border-0 overflow-hidden">
                      <Card.Body className="stat-body-gradient-green p-4">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="d-flex align-items-center mb-3">
                              <div className="bg-success bg-opacity-15 p-3 rounded-circle me-3">
                                <Gear size={28} className="text-success" />
                              </div>
                            </div>
                            <h6 className="text-muted fw-semibold mb-2 text-uppercase letter-spacing">
                              Total Roles
                            </h6>
                            <h2 className="fw-bold text-dark mb-0 display-6">
                              {stats.totalRoles}
                            </h2>
                            <small className="text-info fw-medium">
                              <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-2 py-1">
                                Permission levels
                              </span>
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-4">
                    <Card className="shadow-lg border-0 modern-table-card">
                      <Card.Header className="bg-light border-0 py-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                              <People className="text-primary" size={20} />
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold text-dark">
                                Recent Users
                              </h5>
                              <small className="text-muted">
                                Latest registered members
                              </small>
                            </div>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="rounded-pill px-3 fw-semibold"
                          >
                            View All
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div className="table-responsive modern-table-container">
                          <Table className="mb-0 modern-table">
                            <thead className="table-light">
                              <tr>
                                <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                                  Name
                                </th>
                                <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                                  Status
                                </th>
                                <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                                  Role
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.slice(0, 4).map((user) => (
                                <tr key={user.id} className="border-bottom">
                                  <td className="py-3 px-4">
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="bg-primary bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                        }}
                                      >
                                        <PersonCircle
                                          className="text-primary"
                                          size={16}
                                        />
                                      </div>
                                      <div>
                                        <div className="fw-semibold text-dark">
                                          {user.name || `${user.firstName} ${user.lastName}`}
                                        </div>
                                        <small className="text-muted">
                                          {user.email}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      bg={
                                        user.status === UserStatus.ACTIVE
                                          ? "success"
                                          : "secondary"
                                      }
                                      className="px-2 py-1 rounded-pill fw-medium"
                                    >
                                      {user.status}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="fw-medium text-dark">
                                      {user.role}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Card className="shadow-lg border-0 modern-table-card">
                      <Card.Header className="bg-light border-0 py-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                              <Gear className="text-success" size={20} />
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold text-dark">
                                System Roles
                              </h5>
                              <small className="text-muted">
                                User permission levels
                              </small>
                            </div>
                          </div>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="rounded-pill px-3 fw-semibold"
                            onClick={() => setActiveTab("roles")}
                          >
                            View All
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div className="table-responsive modern-table-container">
                          <Table className="mb-0 modern-table">
                            <thead className="table-light">
                              <tr>
                                <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                                  Role
                                </th>
                                <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                                  Users
                                </th>
                                <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {roles.slice(0, 3).map((role) => (
                                <tr key={role.id} className="border-bottom">
                                  <td className="py-3 px-4">
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="bg-success bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                        }}
                                      >
                                        <Gear
                                          className="text-success"
                                          size={16}
                                        />
                                      </div>
                                      <div>
                                        <div className="fw-semibold text-dark">
                                          {role.name}
                                        </div>
                                        <small className="text-muted">
                                          {role.description}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1 fw-medium">
                                      {typeof role.users === 'number' ? role.users : role.users?.length || 0} users
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge
                                      bg={
                                        role.isActive ? "success" : "secondary"
                                      }
                                      className="px-2 py-1 rounded-pill fw-medium"
                                    >
                                      {role.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
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
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark">User Management</h3>
                  <Breadcrumb>
                    <Breadcrumb.Item
                      href="#"
                      onClick={() => setActiveTab("dashboard")}
                    >
                      Dashboard
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>Users</Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="shadow-lg border-0 mb-4 modern-search-card">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div className="search-container">
                        <InputGroup
                          style={{ width: "350px" }}
                          className="modern-search-group"
                        >
                          <InputGroup.Text className="bg-white border-end-0">
                            <Search className="text-primary" />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-start-0 ps-0"
                          />
                        </InputGroup>
                      </div>
                      <AdminCreateUserModal
                        roles={roles}
                        onSuccess={() => {
                          toast.success("User added successfully!");
                          setSearchTerm("");
                          setActiveTab("users");
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>

                <Card className="shadow-lg border-0 modern-table-card">
                  <Card.Header className="bg-light border-0 py-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <People className="text-primary" size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0 fw-bold text-dark">
                            User Management
                          </h5>
                          <small className="text-muted">
                            Manage all system users and permissions
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge
                          bg="primary"
                          className="px-3 py-2 rounded-pill fw-medium"
                        >
                          {filteredUsers.length} Users
                        </Badge>
                        <Badge
                          bg="success"
                          className="px-3 py-2 rounded-pill fw-medium"
                        >
                          {
                            filteredUsers.filter((u) => u.status === UserStatus.ACTIVE)
                              .length
                          }{" "}
                          Active
                        </Badge>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive modern-table-container">
                      <Table className="mb-0 modern-table">
                        <thead className="table-light">
                          <tr>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              #
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              User Details
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Role
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Last Login
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Status
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, idx) => (
                            <tr
                              key={user.id}
                              className="border-bottom hover-row"
                            >
                              <td className="py-3 px-4">
                                <span className="fw-semibold text-primary">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="bg-primary bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                    style={{ width: "40px", height: "40px" }}
                                  >
                                    <PersonCircle
                                      className="text-primary"
                                      size={20}
                                    />
                                  </div>
                                  <div>
                                    <div className="fw-semibold text-dark">
                                      {user.name || `${user.firstName} ${user.lastName}`}
                                    </div>
                                    <small className="text-muted">
                                      {user.email}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  bg="light"
                                  text="dark"
                                  className="border rounded-pill px-3 py-1 fw-medium"
                                >
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <small className="text-muted fw-medium">
                                  {user.lastLogin}
                                </small>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  bg={
                                    user.status === UserStatus.ACTIVE
                                      ? "success"
                                      : "secondary"
                                  }
                                  className="px-3 py-1 rounded-pill fw-medium"
                                >
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-primary bg-opacity-10 text-primary"
                                    title="Edit User"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-danger bg-opacity-10 text-danger"
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
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Roles Tab */}
            {activeTab === "roles" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark">Role Management</h3>
                  <Breadcrumb>
                    <Breadcrumb.Item
                      href="#"
                      onClick={() => setActiveTab("dashboard")}
                    >
                      Dashboard
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>Roles</Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="shadow-lg border-0 mb-4 modern-search-card">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div className="search-container">
                        <InputGroup
                          style={{ width: "350px" }}
                          className="modern-search-group"
                        >
                          <InputGroup.Text className="bg-white border-end-0">
                            <Search className="text-primary" />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search roles by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-start-0 ps-0"
                          />
                        </InputGroup>
                      </div>

                      <Button
                        variant="primary"
                        className="d-flex align-items-center px-4 py-2 rounded-pill fw-semibold modern-action-btn"
                      >
                        <Plus className="me-2" size={18} /> Add Role
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="shadow-lg border-0 modern-table-card">
                  <Card.Header className="bg-light border-0 py-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                          <Gear className="text-success" size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0 fw-bold text-dark">
                            Role Management
                          </h5>
                          <small className="text-muted">
                            Manage system roles and permissions
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge
                          bg="primary"
                          className="px-3 py-2 rounded-pill fw-medium"
                        >
                          {roles.length} Roles
                        </Badge>
                        <Badge
                          bg="success"
                          className="px-3 py-2 rounded-pill fw-medium"
                        >
                          {roles.filter((r) => r.isActive).length} Active
                        </Badge>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive modern-table-container">
                      <Table className="mb-0 modern-table">
                        <thead className="table-light">
                          <tr>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              #
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Role Details
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Permissions
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Users
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Status
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {roles.map((role, idx) => (
                            <tr
                              key={role.id}
                              className="border-bottom hover-row"
                            >
                              <td className="py-3 px-4">
                                <span className="fw-semibold text-primary">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="bg-success bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                    style={{ width: "40px", height: "40px" }}
                                  >
                                    <Gear className="text-success" size={20} />
                                  </div>
                                  <div>
                                    <div className="fw-semibold text-dark">
                                      {role.name}
                                    </div>
                                    <small className="text-muted">
                                      {role.description}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  bg="info"
                                  className="bg-opacity-10 text-info rounded-pill px-3 py-1 fw-medium"
                                >
                                  {role.permissions} permissions
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="fw-medium text-dark">
                                  {typeof role.users === 'number' ? role.users : role.users?.length || 0} users
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  bg={role.isActive ? "success" : "secondary"}
                                  className="px-3 py-1 rounded-pill fw-medium"
                                >
                                  {role.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-primary bg-opacity-10 text-primary"
                                    title="Edit Role"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-danger bg-opacity-10 text-danger"
                                    title="Delete Role"
                                    disabled={(typeof role.users === 'number' ? role.users : role.users?.length || 0) > 0}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </Col>
        </Row>

        {/* Add User Modal */}
        <Modal
          show={showUserModal}
          onHide={() => setShowUserModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Add New User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control type="text" placeholder="Enter full name" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" placeholder="Enter email" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select>
                  <option>Select role</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>User</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowUserModal(false)}>
              Add User
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Custom CSS */}
        <style jsx global>{`
          .admin-dashboard {
            font-family: "Inter", "Segoe UI", Tahoma, Geneva, Verdana,
              sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
          }

          .sidebar {
            background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
          }

          .nav-link {
            color: #64748b !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            border-radius: 12px;
            margin: 2px 0;
          }

          .nav-link:hover {
            background: linear-gradient(
              135deg,
              #f1f5f9 0%,
              #e2e8f0 100%
            ) !important;
            color: #3b82f6 !important;
            transform: translateX(8px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }

          .active-nav-link {
            background: linear-gradient(
              135deg,
              #3b82f6 0%,
              #1d4ed8 100%
            ) !important;
            color: #ffffff !important;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            transform: translateX(8px);
          }

          .content-area {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            min-height: 100vh;
          }

          .modern-stat-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .modern-stat-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .stat-body-gradient-blue {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          }

          .stat-body-gradient-green {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          }

          .stat-body-gradient-orange {
            background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
          }

          .stat-body-gradient-cyan {
            background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%);
          }

          .letter-spacing {
            letter-spacing: 0.5px;
          }

          .modern-table-card {
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .modern-table-card:hover {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .modern-table-container {
            background: #ffffff;
          }

          .modern-table {
            background: #ffffff;
          }

          .modern-table tbody tr {
            transition: all 0.2s ease;
          }

          .hover-row:hover {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            transform: scale(1.01);
          }

          .modern-action-btn {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
            font-weight: 600;
            border: none;
            position: relative;
            overflow: hidden;
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .modern-action-btn::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            transition: left 0.5s;
          }

          .modern-action-btn:hover::before {
            left: 100%;
          }

          .modern-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          .modern-search-card {
            border-radius: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .modern-search-group .form-control {
            border: 2px solid #e5e7eb;
            transition: all 0.3s ease;
            font-weight: 500;
          }

          .modern-search-group .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            transform: translateY(-1px);
          }

          .modern-search-group .input-group-text {
            border: 2px solid #e5e7eb;
            border-right: none;
            background: #ffffff;
          }

          .modern-search-group:focus-within .input-group-text {
            border-color: #3b82f6;
          }

          .table th {
            border: none;
            font-weight: 600;
            color: #64748b;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }

          .table td {
            border: none;
            vertical-align: middle;
            border-bottom: 1px solid #f1f5f9;
          }

          .border-bottom {
            border-bottom: 1px solid #e5e7eb !important;
          }

          .badge {
            font-weight: 600;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .navbar {
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modern-stat-card,
          .modern-table-card,
          .modern-search-card {
            animation: fadeIn 0.6s ease-out;
          }

          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .sidebar .nav-item {
            animation: slideInLeft 0.4s ease-out;
          }

          .sidebar .nav-item:nth-child(1) {
            animation-delay: 0.1s;
          }
          .sidebar .nav-item:nth-child(2) {
            animation-delay: 0.2s;
          }
          .sidebar .nav-item:nth-child(3) {
            animation-delay: 0.3s;
          }
          .sidebar .nav-item:nth-child(4) {
            animation-delay: 0.4s;
          }
          .sidebar .nav-item:nth-child(5) {
            animation-delay: 0.5s;
          }
          .sidebar .nav-item:nth-child(6) {
            animation-delay: 0.6s;
          }
          .sidebar .nav-item:nth-child(7) {
            animation-delay: 0.7s;
          }

          .display-6 {
            font-size: 2.5rem;
            font-weight: 700;
          }

          .small {
            font-size: 0.8rem;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
