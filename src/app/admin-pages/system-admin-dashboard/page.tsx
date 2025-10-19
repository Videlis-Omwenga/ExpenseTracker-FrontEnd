"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Container,
  Row,
  Col,
  Nav,
  Table,
  Badge,
  Navbar,
  Card,
  InputGroup,
  FormControl,
  Breadcrumb,
  Modal,
  Button,
  Form,
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
  Building,
  GeoAlt,
  CreditCard,
  Telephone,
  PersonPlus,
  Calendar,
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
import { FaBuilding } from "react-icons/fa";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role?: string;
  roles?: Array<{
    userId: number;
    roleId: number;
    assignedAt: string;
    role: {
      id: number;
      name: string;
      description: string;
      adminCreatedRole: boolean;
      createdAt: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  phone: string | null;
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
  phone: string | null;
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

function SuperAdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [usersByInstitution, setUsersByInstitution] = useState<
    UsersByInstitution[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "dashboard"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditInstitutionModal, setShowEditInstitutionModal] =
    useState(false);
  const [showDeleteInstitutionModal, setShowDeleteInstitutionModal] =
    useState(false);
  const [showViewInstitutionModal, setShowViewInstitutionModal] =
    useState(false);
  const [showViewRoleModal, setShowViewRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    status: "",
    phone: "",
    roles: [] as number[],
    institutionId: "",
  });
  const [editInstitutionFormData, setEditInstitutionFormData] = useState({
    name: "",
    industry: "",
    address: "",
    city: "",
    country: "",
    contactEmail: "",
    phone: "",
    websiteUrl: "",
    logoUrl: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    billingEmail: "",
    status: "",
  });
  const [editRoleFormData, setEditRoleFormData] = useState({
    name: "",
    description: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingInstitution, setIsDeletingInstitution] = useState(false);
  const [isUpdatingInstitution, setIsUpdatingInstitution] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

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

  // Handler functions for modals
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      phone: user.phone || "",
      roles: user.roles?.map((role) => role.roleId) || [],
      institutionId: user.institution?.id?.toString() || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      // Convert role and institutionId to integers for the backend
      const dataToSend = {
        ...editFormData,
        phone: editFormData.phone, // Map phone to phone for backend
        roles: editFormData.roles, // Send roles array
        institution: editFormData.institutionId
          ? parseInt(editFormData.institutionId, 10)
          : null,
      };

      const response = await fetch(
        `${BASE_API_URL}/system-admin/edit-user/${selectedUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify(dataToSend),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        fetchData();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to update user: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/system-admin/delete-user/${selectedUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("User deleted successfully");
        setShowDeleteModal(false);
        fetchData();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to delete user: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Institution modal handlers
  const handleEditInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setEditInstitutionFormData({
      name: institution.name,
      industry: institution.industry || "",
      address: institution.address || "",
      city: institution.city || "",
      country: institution.country || "",
      contactEmail: institution.contactEmail || "",
      phone: institution.phone || "",
      websiteUrl: institution.websiteUrl || "",
      logoUrl: institution.logoUrl || "",
      subscriptionStartDate: institution.subscriptionStartDate || "",
      subscriptionEndDate: institution.subscriptionEndDate || "",
      billingEmail: institution.billingEmail || "",
      status: institution.status,
    });
    setShowEditInstitutionModal(true);
  };

  const handleDeleteInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setShowDeleteInstitutionModal(true);
  };

  const handleViewInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setShowViewInstitutionModal(true);
  };

  const handleUpdateInstitution = async () => {
    if (!selectedInstitution) return;

    setIsUpdatingInstitution(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/system-admin/edit-institution/${selectedInstitution.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify(editInstitutionFormData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Institution updated successfully");
        setShowEditInstitutionModal(false);
        fetchData();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to update institution: ${error}`);
    } finally {
      setIsUpdatingInstitution(false);
    }
  };

  const confirmDeleteInstitution = async () => {
    if (!selectedInstitution) return;

    setIsDeletingInstitution(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/system-admin/delete-institution/${selectedInstitution.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Institution deleted successfully");
        setShowDeleteInstitutionModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete institution");
      }
    } catch (error) {
      toast.error(`Failed to delete institution: ${error}`);
    } finally {
      setIsDeletingInstitution(false);
    }
  };

  // Role modal handlers
  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setShowViewRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditRoleFormData({
      name: role.name,
      description: role.description,
    });
    setShowEditRoleModal(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    setIsUpdatingRole(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/system-admin/edit-role/${selectedRole.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify({
            role: editRoleFormData.name,
            description: editRoleFormData.description,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Role updated successfully");
        setShowEditRoleModal(false);
        fetchData();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to update role: ${error}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!selectedRole) return;

    setIsDeletingRole(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/system-admin/delete-role/${selectedRole.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Role deleted successfully");
        setShowDeleteRoleModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete role");
      }
    } catch (error) {
      toast.error(`Failed to delete role: ${error}`);
    } finally {
      setIsDeletingRole(false);
    }
  };

  // Handle tab change and update URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

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

  const filteredRoles = roles.filter(
    (role) =>
      role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  // Get status variant for badges
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
      case "DELETED":
        return "danger";
      case "INVITED":
        return "info";
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
                <StarFill size={16} className="text-primary" />
                Super Admin
              </span>
            </div>
          </div>
        </Navbar>

        <Row className="g-0">
          {/* Sidebar */}
          <Col
            md={2}
            className="sidebar d-flex flex-column p-0 border-end shadow-sm"
            style={{
              backgroundColor: "#f8f9fc",
              maxHeight: "calc(100vh - 80px)",
              overflowY: "auto",
            }}
          >
            <div className="p-3">
              <Nav className="flex-column gap-1">
                <div className="small text-muted text-uppercase fw-bold mb-1 px-2">
                  Overview
                </div>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "dashboard"}
                    onClick={() => handleTabChange("dashboard")}
                    className={`rounded-3 py-2 px-3 d-flex align-items-center position-relative ${
                      activeTab === "dashboard" ? "nav-link active" : "nav-link"
                    }`}
                  >
                    <Grid3x3Gap className="me-2" size={16} />
                    <span className="fw-medium">Dashboard</span>
                    {activeTab === "dashboard" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "3px", height: "70%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>

                <div className="small text-muted text-uppercase fw-bold mb-1 mt-2 px-2">
                  Management
                </div>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "users"}
                    onClick={() => handleTabChange("users")}
                    className={`rounded-3 py-2 px-3 d-flex align-items-center justify-content-between position-relative ${
                      activeTab === "users" ? "nav-link active" : "nav-link"
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <People className="me-2" size={16} />
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
                        style={{ width: "3px", height: "70%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "institutions"}
                    onClick={() => handleTabChange("institutions")}
                    className={`rounded-3 py-2 px-3 d-flex align-items-center justify-content-between position-relative ${
                      activeTab === "institutions"
                        ? "nav-link active"
                        : "nav-link"
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <Globe className="me-2" size={16} />
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
                        style={{ width: "3px", height: "70%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "roles"}
                    onClick={() => handleTabChange("roles")}
                    className={`rounded-3 py-2 px-3 d-flex align-items-center justify-content-between position-relative ${
                      activeTab === "roles" ? "nav-link active" : "nav-link"
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      <ShieldLock className="me-2" size={16} />
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
                        style={{ width: "3px", height: "70%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>

                <div className="small text-muted text-uppercase fw-bold mb-1 mt-2 px-2">
                  Finance
                </div>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "billing"}
                    onClick={() => handleTabChange("billing")}
                    className={`rounded-3 py-2 px-3 d-flex align-items-center position-relative ${
                      activeTab === "billing" ? "nav-link active" : "nav-link"
                    }`}
                  >
                    <Wallet className="me-2" size={16} />
                    <span className="fw-medium">Billing</span>
                    {activeTab === "billing" && (
                      <div
                        className="position-absolute top-50 start-0 translate-middle-y bg-primary rounded-end"
                        style={{ width: "3px", height: "70%" }}
                      ></div>
                    )}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            <div className="mt-auto p-2 border-top">
              <div className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-1">
                  <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                    <Activity size={10} className="text-success" />
                  </div>
                  <small className="text-success fw-medium">
                    System Healthy
                  </small>
                </div>
                <Badge bg="light" text="primary" className="mb-1 px-2 py-1">
                  v3.2.1
                </Badge>
                <div className="small text-muted">Updated: Oct 24</div>
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
                  <div className="border-0 bg-primary bg-opacity-10 border-start border-primary border-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-4 rounded-4 shadow-sm position-relative">
                    <div className="d-flex align-items-center mb-3 mb-md-0 position-relative">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 shadow-sm">
                        <Grid3x3Gap size={28} className="text-primary" />
                      </div>
                      <div>
                        <h5 className="fw-bold text-primary mb-1">
                          System Overview Dashboard
                        </h5>
                        <p className="text-muted small mb-0 fw-medium">
                          Monitor and manage your entire system from one central
                          location
                        </p>
                        <div className="d-flex align-items-center mt-2 gap-2">
                          <Badge bg="primary" className="px-2 py-1">
                            Live Data
                          </Badge>
                          <Badge bg="success" className="px-2 py-1">
                            All Systems Operational
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                      <Breadcrumb className="mb-2 rounded-pill px-3 py-2 bg-white">
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
                      <Card className="h-100 shadow-sm border-start border-primary border-3 bg-secondary bg-opacity-10">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <Globe
                                  className="me-2 text-secondary"
                                  size={20}
                                />
                                <span className="small text-secondary fw-medium">
                                  Total Institutions
                                </span>
                              </div>
                              <h2 className="mb-1 fw-bold text-secondary">
                                {statistics?.totalInstitutions || 0}
                              </h2>
                              <div className="d-flex align-items-center">
                                <Badge
                                  bg="secondary"
                                  className="small px-2 py-1"
                                >
                                  +12% this month
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-secondary bg-opacity-10 p-2 rounded">
                              <Globe size={24} className="text-secondary" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="h-100 shadow-sm border-start border-success border-3 bg-success bg-opacity-10">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <People
                                  className="me-2 text-success"
                                  size={20}
                                />
                                <span className="small text-success fw-medium">
                                  Active Users
                                </span>
                              </div>
                              <h2 className="mb-1 fw-bold text-success">
                                {
                                  users.filter((u) => u.status === "ACTIVE")
                                    .length
                                }
                              </h2>
                              <div className="d-flex align-items-center">
                                <Badge bg="success" className="small px-2 py-1">
                                  +8% this week
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-success bg-opacity-10 p-2 rounded">
                              <People size={24} className="text-success" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="h-100 shadow-sm border-start border-warning border-3 bg-warning bg-opacity-10">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <ShieldLock
                                  className="me-2 text-warning"
                                  size={20}
                                />
                                <span className="small text-warning fw-medium">
                                  System Roles
                                </span>
                              </div>
                              <h2 className="mb-1 fw-bold text-warning">
                                {roles.length}
                              </h2>
                              <div className="d-flex align-items-center">
                                <Badge
                                  bg="warning"
                                  className="small px-2 py-1 text-dark"
                                >
                                  {
                                    users.filter(
                                      (u) => u.roles && u.roles.length > 0
                                    ).length
                                  }{" "}
                                  assigned
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-warning bg-opacity-10 p-2 rounded">
                              <ShieldLock size={24} className="text-warning" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="h-100 shadow-sm border-start border-info border-3 bg-info bg-opacity-10">
                        <Card.Body className="p-4 position-relative">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <Activity
                                  className="me-2 text-info"
                                  size={20}
                                />
                                <span className="small text-info fw-medium">
                                  System Health
                                </span>
                              </div>
                              <h5 className="mb-1 fw-bold text-info">100%</h5>
                              <div className="d-flex align-items-center">
                                <Badge bg="info" className="small px-2 py-1">
                                  All Systems Up
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-info bg-opacity-10 p-2 rounded">
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
                      <Card className="h-100 modern-chart-card border-0 overflow-hidden">
                        <Card.Header className="bg-light border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                                <Activity className="text-primary" size={24} />
                              </div>
                              <div>
                                <h5 className="mb-1 fw-bold text-primary chart-title">
                                  User Growth Analytics
                                </h5>
                                <p className="mb-0 text-muted small">
                                  Real-time user acquisition trends
                                </p>
                              </div>
                            </div>
                            <div className="chart-badge-container">
                              <Badge
                                bg="primary"
                                className="px-3 py-2 fw-semibold"
                              >
                                <i className="fas fa-chart-line me-2"></i>
                                Last 30 Days
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="chart-body-gradient p-0">
                          <div
                            style={{ height: "350px" }}
                            className="p-4 position-relative"
                          >
                            <div className="chart-background-pattern"></div>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={generateUserGrowthData(users)}
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 10,
                                  bottom: 20,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="modernUserGrowthGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#4f46e5"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="50%"
                                      stopColor="#7c3aed"
                                      stopOpacity={0.6}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#ec4899"
                                      stopOpacity={0.1}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="modernStrokeGradient"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                  >
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="50%" stopColor="#7c3aed" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                  </linearGradient>
                                  <filter id="modernGlow">
                                    <feGaussianBlur
                                      stdDeviation="3"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="2 4"
                                  stroke="rgba(148, 163, 184, 0.3)"
                                  horizontal={true}
                                  vertical={false}
                                  strokeWidth={1}
                                />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                  }}
                                  tickFormatter={(value) =>
                                    new Date(value).toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" }
                                    )
                                  }
                                  interval="preserveStartEnd"
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                  }}
                                  width={40}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "16px",
                                    boxShadow:
                                      "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    backdropFilter: "blur(20px)",
                                  }}
                                  formatter={(value) => [
                                    <span
                                      key="value"
                                      style={{
                                        color: "#4f46e5",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {value} users
                                    </span>,
                                    <span key="label" style={{ color: "#6b7280" }}>
                                      Total Active Users
                                    </span>,
                                  ]}
                                  labelFormatter={(label) => (
                                    <span
                                      style={{
                                        color: "#1f2937",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {new Date(label).toLocaleDateString(
                                        "en-US",
                                        {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                        }
                                      )}
                                    </span>
                                  )}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  stroke="url(#modernStrokeGradient)"
                                  strokeWidth={4}
                                  fill="url(#modernUserGrowthGradient)"
                                  dot={{
                                    fill: "#ffffff",
                                    stroke: "#4f46e5",
                                    strokeWidth: 3,
                                    r: 5,
                                    filter: "url(#modernGlow)",
                                  }}
                                  activeDot={{
                                    r: 8,
                                    stroke: "#4f46e5",
                                    strokeWidth: 4,
                                    fill: "#ffffff",
                                    filter: "url(#modernGlow)",
                                    style: { cursor: "pointer" },
                                  }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Institutions by Country */}
                    <Col md={6}>
                      <Card className="h-100 modern-chart-card border-0 overflow-hidden">
                        <Card.Header className="bg-light border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                                <Globe className="text-info" size={24} />
                              </div>
                              <div>
                                <h5 className="mb-1 fw-bold text-info chart-title">
                                  Geographic Distribution
                                </h5>
                                <p className="mb-0 text-muted small">
                                  Global institution presence
                                </p>
                              </div>
                            </div>
                            <div className="chart-badge-container">
                              <Badge
                                bg="info"
                                className="px-3 py-2 fw-semibold"
                              >
                                <i className="fas fa-globe me-2"></i>
                                By Country
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="chart-body-gradient-cyan p-0">
                          <div
                            style={{ height: "350px" }}
                            className="p-4 position-relative"
                          >
                            <div className="chart-background-pattern-cyan"></div>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  <filter id="pieGlow">
                                    <feGaussianBlur
                                      stdDeviation="4"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>
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
                                  cy="45%"
                                  labelLine={false}
                                  label={({
                                    name,
                                    percent = 0,
                                  }: {
                                    name: string;
                                    percent?: number;
                                  }) => {
                                    if (percent > 0.05) {
                                      return `${(percent * 100).toFixed(1)}%`;
                                    }
                                    return "";
                                  }}
                                  outerRadius={100}
                                  innerRadius={45}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {[
                                    "#6366f1",
                                    "#06b6d4",
                                    "#10b981",
                                    "#f59e0b",
                                    "#ef4444",
                                    "#8b5cf6",
                                    "#ec4899",
                                    "#f97316",
                                    "#14b8a6",
                                    "#84cc16",
                                  ].map((color, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={color}
                                      stroke="#ffffff"
                                      strokeWidth={3}
                                      filter="url(#pieGlow)"
                                      style={{
                                        filter:
                                          "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                                      }}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "16px",
                                    boxShadow:
                                      "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    backdropFilter: "blur(20px)",
                                  }}
                                  formatter={(value, name) => [
                                    <span
                                      key="value"
                                      style={{
                                        color: "#06b6d4",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {value} institutions
                                    </span>,
                                    <span key="label" style={{ color: "#6b7280" }}>
                                      {name}
                                    </span>,
                                  ]}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  height={50}
                                  iconType="circle"
                                  wrapperStyle={{
                                    fontSize: "11px",
                                    paddingTop: "15px",
                                    fontWeight: "500",
                                    color: "#64748b",
                                  }}
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
                      <Card className="h-100 modern-chart-card border-0 overflow-hidden">
                        <Card.Header className="bg-light border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                                <People className="text-success" size={24} />
                              </div>
                              <div>
                                <h5 className="mb-1 fw-bold text-success chart-title">
                                  User Status Analysis
                                </h5>
                                <p className="mb-0 text-muted small">
                                  Active vs inactive user distribution
                                </p>
                              </div>
                            </div>
                            <div className="chart-badge-container">
                              <Badge
                                bg="success"
                                className="px-3 py-2 fw-semibold"
                              >
                                <i className="fas fa-users me-2"></i>
                                User Health
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="chart-body-gradient-green p-0">
                          <div
                            style={{ height: "350px" }}
                            className="p-4 position-relative"
                          >
                            <div className="chart-background-pattern-green"></div>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  <filter id="statusGlow">
                                    <feGaussianBlur
                                      stdDeviation="5"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                  <radialGradient
                                    id="activeGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#22c55e"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#16a34a"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                  <radialGradient
                                    id="inactiveGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#f87171"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#dc2626"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                  <radialGradient
                                    id="suspendedGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#fbbf24"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#f59e0b"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                </defs>
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
                                        const gradientMap: {
                                          [key: string]: string;
                                        } = {
                                          ACTIVE: "url(#activeGradient)",
                                          INACTIVE: "url(#inactiveGradient)",
                                          SUSPENDED: "url(#suspendedGradient)",
                                          UNKNOWN: "#94a3b8",
                                        };
                                        acc.push({
                                          name: status,
                                          value: 1,
                                          color:
                                            gradientMap[status] || "#94a3b8",
                                        });
                                      }
                                      return acc;
                                    },
                                    []
                                  )}
                                  cx="50%"
                                  cy="45%"
                                  labelLine={false}
                                  label={({
                                    name,
                                    percent = 0,
                                  }: {
                                    name: string;
                                    percent?: number;
                                  }) => {
                                    if (percent > 0.05) {
                                      return `${name}\n${(
                                        percent * 100
                                      ).toFixed(1)}%`;
                                    }
                                    return "";
                                  }}
                                  outerRadius={100}
                                  innerRadius={55}
                                  paddingAngle={4}
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
                                          const gradientMap: {
                                            [key: string]: string;
                                          } = {
                                            ACTIVE: "url(#activeGradient)",
                                            INACTIVE: "url(#inactiveGradient)",
                                            SUSPENDED:
                                              "url(#suspendedGradient)",
                                            UNKNOWN: "#94a3b8",
                                          };
                                          acc.push({
                                            name: status,
                                            value: 1,
                                            color:
                                              gradientMap[status] || "#94a3b8",
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
                                        stroke="#ffffff"
                                        strokeWidth={4}
                                        filter="url(#statusGlow)"
                                        style={{
                                          filter:
                                            "drop-shadow(0 6px 12px rgba(0,0,0,0.15))",
                                        }}
                                      />
                                    ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "16px",
                                    boxShadow:
                                      "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    backdropFilter: "blur(20px)",
                                  }}
                                  formatter={(value, name) => [
                                    <span
                                      key="value"
                                      style={{
                                        color: "#059669",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {value} users
                                    </span>,
                                    <span key="label" style={{ color: "#6b7280" }}>
                                      {name}
                                    </span>,
                                  ]}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  height={40}
                                  iconType="circle"
                                  wrapperStyle={{
                                    fontSize: "11px",
                                    paddingTop: "15px",
                                    fontWeight: "500",
                                    color: "#64748b",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100 modern-chart-card border-0 overflow-hidden">
                        <Card.Header className="bg-light border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                                <Globe className="text-primary" size={24} />
                              </div>
                              <div>
                                <h5 className="mb-1 fw-bold text-primary chart-title">
                                  Institution Status
                                </h5>
                                <p className="mb-0 text-muted small">
                                  Organization health metrics
                                </p>
                              </div>
                            </div>
                            <div className="chart-badge-container">
                              <Badge
                                bg="warning"
                                text="dark"
                                className="px-3 py-2 fw-semibold"
                              >
                                <i className="fas fa-chart-bar me-2"></i>
                                Status Overview
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="chart-body-gradient-orange p-0">
                          <div
                            style={{ height: "350px" }}
                            className="p-4 position-relative"
                          >
                            <div className="chart-background-pattern-orange"></div>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={institutions.reduce(
                                  (
                                    acc: {
                                      status: string;
                                      count: number;
                                      color: string;
                                    }[],
                                    inst
                                  ) => {
                                    const status = inst.status || "UNKNOWN";
                                    const existing = acc.find(
                                      (item) => item.status === status
                                    );
                                    if (existing) {
                                      existing.count += 1;
                                    } else {
                                      const colorMap: {
                                        [key: string]: string;
                                      } = {
                                        ACTIVE: "#22c55e",
                                        INACTIVE: "#ef4444",
                                        SUSPENDED: "#f59e0b",
                                        TRIAL: "#8b5cf6",
                                        UNKNOWN: "#94a3b8",
                                      };
                                      acc.push({
                                        status,
                                        count: 1,
                                        color: colorMap[status] || "#94a3b8",
                                      });
                                    }
                                    return acc;
                                  },
                                  []
                                )}
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 20,
                                  bottom: 20,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="barGradient1"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#22c55e"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#16a34a"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="barGradient2"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#ef4444"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#dc2626"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="barGradient3"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#f59e0b"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#d97706"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="barGradient4"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#8b5cf6"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#7c3aed"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <filter id="barGlow">
                                    <feGaussianBlur
                                      stdDeviation="3"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="2 4"
                                  stroke="rgba(148, 163, 184, 0.3)"
                                  horizontal={true}
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="status"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                  }}
                                  interval={0}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                  }}
                                  width={40}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "16px",
                                    boxShadow:
                                      "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    backdropFilter: "blur(20px)",
                                  }}
                                  formatter={(value, name) => [
                                    <span
                                      key="value"
                                      style={{
                                        color: "#f59e0b",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {value} institutions
                                    </span>,
                                    <span key="label" style={{ color: "#6b7280" }}>
                                      Total Count
                                    </span>,
                                  ]}
                                  labelFormatter={(label) => (
                                    <span
                                      style={{
                                        color: "#1f2937",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Status: {label}
                                    </span>
                                  )}
                                />
                                <Bar
                                  dataKey="count"
                                  fill="url(#barGradient1)"
                                  name="Institutions"
                                  radius={[8, 8, 0, 0]}
                                  filter="url(#barGlow)"
                                  style={{
                                    filter:
                                      "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                                  }}
                                >
                                  {institutions
                                    .reduce(
                                      (
                                        acc: {
                                          status: string;
                                          count: number;
                                        }[],
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
                                    )
                                    .map((entry, index) => {
                                      const gradientMap: {
                                        [key: string]: string;
                                      } = {
                                        ACTIVE: "url(#barGradient1)",
                                        INACTIVE: "url(#barGradient2)",
                                        SUSPENDED: "url(#barGradient3)",
                                        TRIAL: "url(#barGradient4)",
                                      };
                                      return (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={
                                            gradientMap[entry.status] ||
                                            "#94a3b8"
                                          }
                                        />
                                      );
                                    })}
                                </Bar>
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
                      <Card className="h-100 modern-chart-card border-0 overflow-hidden">
                        <Card.Header className="bg-light border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="bg-secondary bg-opacity-10 p-2 rounded-circle me-3">
                                <People className="text-secondary" size={24} />
                              </div>
                              <div>
                                <h5 className="mb-1 fw-bold text-secondary chart-title">
                                  User Distribution
                                </h5>
                                <p className="mb-0 text-muted small">
                                  Top performing institutions
                                </p>
                              </div>
                            </div>
                            <div className="chart-badge-container">
                              <Badge
                                bg="secondary"
                                className="px-3 py-2 fw-semibold"
                              >
                                <i className="fas fa-trophy me-2"></i>
                                Top 5
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="chart-body-gradient-purple p-0">
                          <div
                            style={{ height: "350px" }}
                            className="p-4 position-relative"
                          >
                            <div className="chart-background-pattern-purple"></div>
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
                                  top: 20,
                                  right: 30,
                                  left: 120,
                                  bottom: 20,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="horizontalGradient1"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#8b5cf6"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="50%"
                                      stopColor="#a855f7"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#c084fc"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="horizontalGradient2"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#06b6d4"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="50%"
                                      stopColor="#0891b2"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#0e7490"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="horizontalGradient3"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#10b981"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="50%"
                                      stopColor="#059669"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#047857"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="horizontalGradient4"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#f59e0b"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="50%"
                                      stopColor="#d97706"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#b45309"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="horizontalGradient5"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#ef4444"
                                      stopOpacity={0.9}
                                    />
                                    <stop
                                      offset="50%"
                                      stopColor="#dc2626"
                                      stopOpacity={0.8}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#b91c1c"
                                      stopOpacity={0.7}
                                    />
                                  </linearGradient>
                                  <filter id="horizontalGlow">
                                    <feGaussianBlur
                                      stdDeviation="3"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="2 4"
                                  stroke="rgba(148, 163, 184, 0.3)"
                                  horizontal={false}
                                  vertical={true}
                                />
                                <XAxis
                                  type="number"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                  }}
                                />
                                <YAxis
                                  dataKey="name"
                                  type="category"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                  }}
                                  width={120}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "16px",
                                    boxShadow:
                                      "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    backdropFilter: "blur(20px)",
                                  }}
                                  formatter={(value, name) => [
                                    <span
                                      key="value"
                                      style={{
                                        color: "#8b5cf6",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {value} users
                                    </span>,
                                    <span key="label" style={{ color: "#6b7280" }}>
                                      Active Members
                                    </span>,
                                  ]}
                                  labelFormatter={(label) => (
                                    <span
                                      style={{
                                        color: "#1f2937",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {label}
                                    </span>
                                  )}
                                />
                                <Bar
                                  dataKey="users"
                                  fill="url(#horizontalGradient1)"
                                  name="Users"
                                  radius={[0, 8, 8, 0]}
                                  filter="url(#horizontalGlow)"
                                  style={{
                                    filter:
                                      "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                                  }}
                                >
                                  {usersByInstitution
                                    .slice(0, 5)
                                    .map((entry, index) => {
                                      const gradients = [
                                        "url(#horizontalGradient1)",
                                        "url(#horizontalGradient2)",
                                        "url(#horizontalGradient3)",
                                        "url(#horizontalGradient4)",
                                        "url(#horizontalGradient5)",
                                      ];
                                      return (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={
                                            gradients[index] || gradients[0]
                                          }
                                        />
                                      );
                                    })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Institution Status Distribution */}
                    <Col md={6}>
                      <Card className="h-100 modern-chart-card border-0 overflow-hidden">
                        <Card.Header className="bg-light border-0 py-4">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="bg-danger bg-opacity-10 p-2 rounded-circle me-3">
                                <Wallet className="text-danger" size={24} />
                              </div>
                              <div>
                                <h5 className="mb-1 fw-bold text-danger chart-title">
                                  Subscription Overview
                                </h5>
                                <p className="mb-0 text-muted small">
                                  Revenue and plan distribution
                                </p>
                              </div>
                            </div>
                            <div className="chart-badge-container">
                              <Badge
                                bg="danger"
                                className="px-3 py-2 fw-semibold"
                              >
                                <i className="fas fa-credit-card me-2"></i>
                                Plans & Revenue
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="chart-body-gradient-pink p-0">
                          <div
                            style={{ height: "350px" }}
                            className="p-4 position-relative"
                          >
                            <div className="chart-background-pattern-pink"></div>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  <filter id="subscriptionGlow">
                                    <feGaussianBlur
                                      stdDeviation="5"
                                      result="coloredBlur"
                                    />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                  <radialGradient
                                    id="premiumGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#8b5cf6"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#7c3aed"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                  <radialGradient
                                    id="enterpriseGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#1f2937"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#374151"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                  <radialGradient
                                    id="freeGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#06b6d4"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#0891b2"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                  <radialGradient
                                    id="trialGradient"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.8"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#f59e0b"
                                      stopOpacity={1}
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#d97706"
                                      stopOpacity={0.8}
                                    />
                                  </radialGradient>
                                </defs>
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
                                      const plan =
                                        inst.subscriptionPlan || "FREE";
                                      const existing = acc.find(
                                        (item) => item.name === plan
                                      );
                                      if (existing) {
                                        existing.value += 1;
                                      } else {
                                        const gradientMap: {
                                          [key: string]: string;
                                        } = {
                                          PREMIUM: "url(#premiumGradient)",
                                          ENTERPRISE:
                                            "url(#enterpriseGradient)",
                                          FREE: "url(#freeGradient)",
                                          TRIAL: "url(#trialGradient)",
                                        };
                                        acc.push({
                                          name: plan,
                                          value: 1,
                                          color:
                                            gradientMap[plan] ||
                                            "url(#freeGradient)",
                                        });
                                      }
                                      return acc;
                                    },
                                    []
                                  )}
                                  cx="50%"
                                  cy="45%"
                                  labelLine={false}
                                  label={({
                                    name,
                                    percent = 0,
                                  }: {
                                    name: string;
                                    percent?: number;
                                  }) => {
                                    if (percent > 0.05) {
                                      return `${name}\n${(
                                        percent * 100
                                      ).toFixed(1)}%`;
                                    }
                                    return "";
                                  }}
                                  outerRadius={100}
                                  innerRadius={50}
                                  paddingAngle={5}
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
                                        const plan =
                                          inst.subscriptionPlan || "FREE";
                                        if (
                                          !acc.find(
                                            (item) => item.name === plan
                                          )
                                        ) {
                                          const gradientMap: {
                                            [key: string]: string;
                                          } = {
                                            PREMIUM: "url(#premiumGradient)",
                                            ENTERPRISE:
                                              "url(#enterpriseGradient)",
                                            FREE: "url(#freeGradient)",
                                            TRIAL: "url(#trialGradient)",
                                          };
                                          acc.push({
                                            name: plan,
                                            value: 1,
                                            color:
                                              gradientMap[plan] ||
                                              "url(#freeGradient)",
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
                                        stroke="#ffffff"
                                        strokeWidth={4}
                                        filter="url(#subscriptionGlow)"
                                        style={{
                                          filter:
                                            "drop-shadow(0 6px 12px rgba(0,0,0,0.15))",
                                        }}
                                      />
                                    ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor:
                                      "rgba(255, 255, 255, 0.95)",
                                    border: "none",
                                    borderRadius: "16px",
                                    boxShadow:
                                      "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    backdropFilter: "blur(20px)",
                                  }}
                                  formatter={(value, name) => [
                                    <span
                                      key="value"
                                      style={{
                                        color: "#ec4899",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {value} institutions
                                    </span>,
                                    <span key="label" style={{ color: "#6b7280" }}>
                                      {name} Plan
                                    </span>,
                                  ]}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  height={40}
                                  iconType="circle"
                                  wrapperStyle={{
                                    fontSize: "11px",
                                    paddingTop: "15px",
                                    fontWeight: "500",
                                    color: "#64748b",
                                  }}
                                />
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

                  <Card className="mb-4 shadow-sm border-0">
                    <Card.Body className="p-4 bg-gradient-light">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="position-relative search-wrapper">
                            <InputGroup className="modern-search-input">
                              <InputGroup.Text className="bg-white border-end-0 ps-4">
                                <Search className="text-primary" size={18} />
                              </InputGroup.Text>
                              <FormControl
                                placeholder="Search users by name, email, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-start-0 ps-2 bg-white fw-medium"
                                style={{
                                  fontSize: "15px",
                                  paddingTop: "12px",
                                  paddingBottom: "12px",
                                }}
                              />
                            </InputGroup>
                            <small className="text-muted d-block mt-2 ms-1">
                              {filteredUsers.length} user
                              {filteredUsers.length !== 1 ? "s" : ""} found
                            </small>
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

                  <Card className="shadow-lg border-0 modern-table-card">
                    <Card.Header className="bg-secondary bg-opacity-10 py-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                            <People className="text-success" size={20} />
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold text-success">
                              User Directory
                            </h5>
                            <small className="text-muted">
                              Manage system users and their access
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <Badge
                            bg="success"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {users.filter((u) => u.status === "ACTIVE").length}{" "}
                            Active
                          </Badge>
                          <Badge
                            bg="secondary"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {
                              users.filter((u) => u.status === "INACTIVE")
                                .length
                            }{" "}
                            Inactive
                          </Badge>
                          <Badge
                            bg="danger"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {
                              users.filter((u) => u.status === "SUSPENDED")
                                .length
                            }{" "}
                            Suspended
                          </Badge>
                          <Badge
                            bg="danger"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {users.filter((u) => u.status === "DELETED").length}{" "}
                            Deleted
                          </Badge>
                          <Badge
                            bg="info"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {users.filter((u) => u.status === "INVITED").length}{" "}
                            Invited
                          </Badge>
                          <Badge
                            bg="warning"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {users.filter((u) => u.status === "TRIAL").length}{" "}
                            Trial
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive modern-table-container">
                        <Table className="mb-0 modern-table">
                          <thead>
                            <tr>
                              <th className="table-header px-4 py-4">
                                <div className="d-flex align-items-center">
                                  <span className="fw-bold text-dark">#</span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <PersonCircle
                                    className="me-2 text-primary"
                                    size={16}
                                  />
                                  <span className="fw-bold text-dark">
                                    User Information
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <span className="fw-bold text-dark">
                                    Email
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <Globe className="me-2 text-info" size={16} />
                                  <span className="fw-bold text-dark">
                                    Organization
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <Activity
                                    className="me-2 text-primary"
                                    size={16}
                                  />
                                  <span className="fw-bold text-dark">
                                    Activity
                                  </span>
                                </div>
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((user, idx) => (
                              <tr key={user.id} className="table-row">
                                <td className="px-4 py-4">
                                  <div
                                    className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {idx + 1}
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="d-flex align-items-center">
                                    <div className="position-relative me-3">
                                      <div
                                        className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                          width: "48px",
                                          height: "48px",
                                        }}
                                      >
                                        <span
                                          className="text-white fw-bold"
                                          style={{ fontSize: "16px" }}
                                        >
                                          {user.firstName
                                            ?.charAt(0)
                                            ?.toUpperCase()}
                                          {user.lastName
                                            ?.charAt(0)
                                            ?.toUpperCase()}
                                        </span>
                                      </div>
                                      <div
                                        className={`position-absolute bottom-0 end-0 rounded-circle border-2 border-white ${
                                          user.status === "ACTIVE"
                                            ? "bg-success"
                                            : "bg-secondary"
                                        }`}
                                        style={{
                                          width: "12px",
                                          height: "12px",
                                        }}
                                      ></div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <div
                                        className="fw-bold text-dark mb-1"
                                        style={{ fontSize: "15px" }}
                                      >
                                        {user.firstName} {user.lastName}
                                      </div>
                                      <div className="d-flex align-items-center gap-2">
                                        <Badge
                                          bg={getStatusVariant(user.status)}
                                          className="small px-2 py-1"
                                        >
                                          {user.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div>
                                    <div className="fw-medium text-dark mb-1">
                                      {user.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="bg-info bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                      style={{ width: "36px", height: "36px" }}
                                    >
                                      <span
                                        className="text-info fw-bold"
                                        style={{ fontSize: "14px" }}
                                      >
                                        {user.institution?.name
                                          ?.charAt(0)
                                          ?.toUpperCase() || "N"}
                                      </span>
                                    </div>
                                    <div>
                                      <div
                                        className="fw-medium text-dark"
                                        style={{ fontSize: "14px" }}
                                      >
                                        {user.institution?.name ||
                                          "No Institution"}
                                      </div>
                                      <small className="text-muted">
                                        {user.institution?.country ||
                                          "Unknown Location"}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div>
                                    <div className="small fw-medium text-dark mb-1">
                                      Last Login
                                    </div>
                                    <div className="text-muted small">
                                      {user.lastLogin ? (
                                        <DateTimeDisplay
                                          date={user.lastLogin}
                                        />
                                      ) : (
                                        <span className="text-primary">
                                          Never logged in
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <Badge
                                      className="bg-info bg-opacity-10 text-info border-0 px-2 py-1 rounded-pill fw-medium cursor-pointer"
                                      title="View User Details"
                                      onClick={() => handleViewUser(user)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Eye className="text-info" size={16} />
                                    </Badge>
                                    <Badge
                                      className="bg-primary bg-opacity-10 text-primary border-0 px-2 py-1 rounded-pill fw-medium cursor-pointer"
                                      title="Edit User"
                                      onClick={() => handleEditUser(user)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Pencil
                                        className="text-primary"
                                        size={16}
                                      />
                                    </Badge>
                                    <Badge
                                      className="bg-danger bg-opacity-10 text-danger border-0 px-2 py-1 rounded-pill fw-medium cursor-pointer"
                                      title="Delete User"
                                      onClick={() => handleDeleteUser(user)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Trash
                                        className="text-danger"
                                        size={16}
                                      />
                                    </Badge>
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

                  <Card className="mb-4 shadow-sm border-0">
                    <Card.Body className="p-4 bg-gradient-light">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="position-relative search-wrapper">
                            <InputGroup className="modern-search-input">
                              <InputGroup.Text className="bg-white border-end-0 ps-4">
                                <Search className="text-info" size={18} />
                              </InputGroup.Text>
                              <FormControl
                                placeholder="Search institutions by name, email, or country..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-start-0 ps-2 bg-white fw-medium"
                                style={{
                                  fontSize: "15px",
                                  paddingTop: "12px",
                                  paddingBottom: "12px",
                                }}
                              />
                            </InputGroup>
                            <small className="text-muted d-block mt-2 ms-1">
                              {filteredInstitutions.length} institution
                              {filteredInstitutions.length !== 1 ? "s" : ""}{" "}
                              found
                            </small>
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
                          <InstitutionCreationModal onSuccess={fetchData} />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="shadow-lg border-0 modern-table-card">
                    <Card.Header className="bg-secondary bg-opacity-10 py-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                            <Globe className="text-info" size={20} />
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold text-info">
                              Institution Directory
                            </h5>
                            <small className="text-muted">
                              Manage organizations
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge
                            bg="success"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {
                              institutions.filter((i) => i.isActive === true)
                                .length
                            }{" "}
                            Active
                          </Badge>
                          <Badge
                            bg="danger"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {
                              institutions.filter((i) => i.isActive === false)
                                .length
                            }{" "}
                            Deleted
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive modern-table-container">
                        <Table className="mb-0 modern-table">
                          <thead>
                            <tr>
                              <th className="table-header px-4 py-4">
                                <div className="d-flex align-items-center">
                                  <span className="fw-bold text-dark">ID</span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <Globe className="me-2 text-info" size={16} />
                                  <span className="fw-bold text-dark">
                                    Organization
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <People
                                    className="me-2 text-success"
                                    size={16}
                                  />
                                  <span className="fw-bold text-dark">
                                    Members
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <Activity
                                    className="me-2 text-primary"
                                    size={16}
                                  />
                                  <span className="fw-bold text-dark">
                                    Status & Timeline
                                  </span>
                                </div>
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInstitutions.map((institution) => (
                              <tr key={institution.id} className="table-row">
                                <td className="px-4 py-4">
                                  <div
                                    className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {institution.id}
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="d-flex align-items-center">
                                    <div className="position-relative me-3">
                                      {institution.logoUrl ? (
                                        <img
                                          src={institution.logoUrl}
                                          alt={institution.name}
                                          className="rounded-circle border border-light shadow-sm"
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            objectFit: "cover",
                                          }}
                                        />
                                      ) : (
                                        <div
                                          className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                          }}
                                        >
                                          <span
                                            className="text-white fw-bold"
                                            style={{ fontSize: "16px" }}
                                          >
                                            {institution.name
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                      <div
                                        className={`position-absolute bottom-0 end-0 rounded-circle border-2 border-white ${
                                          institution.status === "ACTIVE"
                                            ? "bg-success"
                                            : "bg-secondary"
                                        }`}
                                        style={{
                                          width: "12px",
                                          height: "12px",
                                        }}
                                      ></div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <div
                                        className="fw-bold text-dark mb-1"
                                        style={{ fontSize: "15px" }}
                                      >
                                        {institution.name}
                                      </div>
                                      <div className="d-flex align-items-center gap-2">
                                        <small className="text-muted">
                                          {institution.contactEmail ||
                                            "No contact email"}
                                        </small>
                                      </div>
                                      <div className="d-flex align-items-center gap-2 mt-1">
                                        <small className="text-muted">
                                          <i className="fas fa-map-marker-alt me-1"></i>
                                          {institution.country || "Unknown"}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div>
                                    <div className="d-flex align-items-center mb-2">
                                      <div
                                        className="bg-success bg-opacity-10 rounded-circle me-2 d-flex align-items-center justify-content-center"
                                        style={{
                                          width: "24px",
                                          height: "24px",
                                        }}
                                      >
                                        <People
                                          className="text-success"
                                          size={12}
                                        />
                                      </div>
                                      <span className="fw-bold text-success">
                                        {institution._count.users}
                                      </span>
                                      <span className="text-muted small ms-1">
                                        users
                                      </span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="bg-info bg-opacity-10 rounded-circle me-2 d-flex align-items-center justify-content-center"
                                        style={{
                                          width: "24px",
                                          height: "24px",
                                        }}
                                      >
                                        <Globe
                                          className="text-info"
                                          size={12}
                                        />
                                      </div>
                                      <span className="fw-bold text-info">
                                        {institution._count.departments}
                                      </span>
                                      <span className="text-muted small ms-1">
                                        depts
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div>
                                    <div className="mb-2">
                                      <Badge
                                        bg={getStatusVariant(
                                          institution.status
                                        )}
                                        className="px-3 py-2 rounded-pill fw-medium"
                                      >
                                        {institution.status?.toLowerCase() ||
                                          "inactive"}
                                      </Badge>
                                    </div>
                                    <div className="small text-muted">
                                      <div>
                                        Created:{" "}
                                        <DateTimeDisplay
                                          date={institution.createdAt}
                                        />
                                      </div>
                                      {institution.updatedAt !==
                                        institution.createdAt && (
                                        <div className="text-primary">
                                          Updated:{" "}
                                          <DateTimeDisplay
                                            date={institution.updatedAt}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <Badge
                                      className="bg-info bg-opacity-10 text-info border-0 px-2 py-1 rounded-pill fw-medium cursor-pointer"
                                      title="View Institution Details"
                                      onClick={() =>
                                        handleViewInstitution(institution)
                                      }
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Eye className="text-info" size={16} />
                                    </Badge>
                                    <Badge
                                      className="bg-primary bg-opacity-10 text-primary border-0 px-2 py-1 rounded-pill fw-medium cursor-pointer"
                                      title="Edit Institution"
                                      onClick={() =>
                                        handleEditInstitution(institution)
                                      }
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Pencil
                                        className="text-primary"
                                        size={16}
                                      />
                                    </Badge>
                                    <Badge
                                      className="bg-danger bg-opacity-10 text-danger border-0 px-2 py-1 rounded-pill fw-medium cursor-pointer"
                                      title="Delete Institution"
                                      onClick={() =>
                                        handleDeleteInstitution(institution)
                                      }
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Trash
                                        className="text-danger"
                                        size={16}
                                      />
                                    </Badge>
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

                  <Card className="mb-4 shadow-sm border-0">
                    <Card.Body className="p-4 bg-gradient-light">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="position-relative search-wrapper">
                            <InputGroup className="modern-search-input">
                              <InputGroup.Text className="bg-white border-2 border-secondary border-end-0 ps-4">
                                <Search className="text-secondary" size={18} />
                              </InputGroup.Text>
                              <FormControl
                                placeholder="Search roles by name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-2 border-secondary border-start-0 ps-2 bg-white fw-medium"
                                style={{
                                  fontSize: "15px",
                                  paddingTop: "12px",
                                  paddingBottom: "12px",
                                }}
                              />
                            </InputGroup>
                            <small className="text-muted d-block mt-2 ms-1">
                              {filteredRoles.length} role
                              {filteredRoles.length !== 1 ? "s" : ""} found
                            </small>
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

                  <Card className="shadow-lg border-0 modern-table-card">
                    <Card.Header className="bg-light border-bottom py-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-secondary bg-opacity-10 p-2 rounded-circle me-3">
                            <ShieldLock className="text-secondary" size={20} />
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold text-secondary">
                              System Roles
                            </h5>
                            <small className="text-muted">
                              Manage access controls and permissions
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge
                            bg="primary"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {
                              filteredRoles.filter((r) => r.adminCreatedRole)
                                .length
                            }{" "}
                            Admin Roles
                          </Badge>
                          <Badge
                            bg="success"
                            className="px-3 py-2 rounded-pill fw-medium"
                          >
                            {
                              filteredRoles.filter((r) => !r.adminCreatedRole)
                                .length
                            }{" "}
                            Custom Roles
                          </Badge>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive modern-table-container">
                        <Table className="mb-0 modern-table">
                          <thead>
                            <tr>
                              <th className="table-header px-4 py-4">
                                <div className="d-flex align-items-center">
                                  <span className="fw-bold text-dark">ID</span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <ShieldLock
                                    className="me-2 text-secondary"
                                    size={16}
                                  />
                                  <span className="fw-bold text-dark">
                                    Role Information
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <span className="fw-bold text-dark">
                                    Description & Permissions
                                  </span>
                                </div>
                              </th>
                              <th className="table-header py-4">
                                <div className="d-flex align-items-center">
                                  <Activity
                                    className="me-2 text-info"
                                    size={16}
                                  />
                                  <span className="fw-bold text-dark">
                                    Timeline
                                  </span>
                                </div>
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRoles.map((role) => (
                              <tr key={role.id} className="table-row">
                                <td className="px-4 py-4">
                                  <div
                                    className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary"
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {role.id}
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="d-flex align-items-center">
                                    <div className="position-relative me-3">
                                      <div
                                        className={`bg-gradient-to-br ${
                                          role.adminCreatedRole
                                            ? "from-blue-400 to-purple-500"
                                            : "from-green-400 to-emerald-500"
                                        } rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                                        style={{
                                          width: "48px",
                                          height: "48px",
                                        }}
                                      >
                                        <ShieldLock
                                          className="text-white"
                                          size={20}
                                        />
                                      </div>
                                      <div
                                        className={`position-absolute bottom-0 end-0 rounded-circle border-2 border-white ${
                                          role.adminCreatedRole
                                            ? "bg-primary"
                                            : "bg-success"
                                        }`}
                                        style={{
                                          width: "12px",
                                          height: "12px",
                                        }}
                                      ></div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <div
                                        className="fw-bold text-dark mb-1"
                                        style={{ fontSize: "15px" }}
                                      >
                                        {role.name.toUpperCase()}
                                      </div>
                                      <div className="d-flex align-items-center gap-2">
                                        <Badge
                                          bg={
                                            role.adminCreatedRole
                                              ? "primary"
                                              : "success"
                                          }
                                          className="small px-2 py-1 rounded-pill"
                                        >
                                          {role.adminCreatedRole
                                            ? "System Role"
                                            : "Custom Role"}
                                        </Badge>
                                        {role.updatedAt !== role.createdAt && (
                                          <Badge
                                            bg="warning"
                                            className="small px-2 py-1 rounded-pill"
                                          >
                                            Modified
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div>
                                    <div
                                      className="fw-medium text-dark mb-2"
                                      style={{ fontSize: "14px" }}
                                    >
                                      {role.description}
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <Badge
                                        bg="light"
                                        text="dark"
                                        className="small px-2 py-1"
                                      >
                                        <ShieldLock
                                          size={10}
                                          className="me-1"
                                        />
                                        Access Control
                                      </Badge>
                                      <Badge
                                        bg="light"
                                        text="dark"
                                        className="small px-2 py-1"
                                      >
                                        <People size={10} className="me-1" />
                                        User Management
                                      </Badge>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div>
                                    <div className="small fw-medium text-dark mb-1">
                                      Created
                                    </div>
                                    <div className="text-muted small mb-2">
                                      <DateTimeDisplay date={role.createdAt} />
                                    </div>
                                    {role.updatedAt !== role.createdAt && (
                                      <div>
                                        <div className="small fw-medium text-primary mb-1">
                                          Updated
                                        </div>
                                        <div className="text-muted small">
                                          <DateTimeDisplay
                                            date={role.updatedAt}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <Badge
                                      className="bg-info bg-opacity-10 text-info border-0 px-2 py-1 rounded-pill fw-medium"
                                      title="View Role"
                                      onClick={() => handleViewRole(role)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Eye className="text-info" size={16} />
                                    </Badge>
                                    <Badge
                                      className="bg-primary bg-opacity-10 text-primary border-0 px-2 py-1 rounded-pill fw-medium"
                                      title="Edit Role"
                                      onClick={() => handleEditRole(role)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Pencil
                                        className="text-primary"
                                        size={16}
                                      />
                                    </Badge>
                                    <Badge
                                      className="bg-danger bg-opacity-10 text-danger border-0 px-2 py-1 rounded-pill fw-medium"
                                      title="Delete Role"
                                      onClick={() => handleDeleteRole(role)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Trash
                                        className="text-danger"
                                        size={16}
                                      />
                                    </Badge>
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
            background: linear-gradient(
              135deg,
              #667eea 0%,
              #764ba2 100%
            ) !important;
          }

          .bg-gradient-info {
            background: linear-gradient(
              135deg,
              #06b6d4 0%,
              #0891b2 100%
            ) !important;
          }

          .bg-gradient-success {
            background: linear-gradient(
              135deg,
              #10b981 0%,
              #059669 100%
            ) !important;
          }

          .bg-gradient-warning {
            background: linear-gradient(
              135deg,
              #f59e0b 0%,
              #d97706 100%
            ) !important;
          }

          .bg-gradient-to-r {
            background: linear-gradient(
              90deg,
              var(--tw-gradient-from),
              var(--tw-gradient-to)
            ) !important;
          }

          .from-blue-50 {
            --tw-gradient-from: #eff6ff;
          }

          .to-indigo-50 {
            --tw-gradient-to: #eef2ff;
          }

          .from-cyan-50 {
            --tw-gradient-from: #ecfeff;
          }

          .to-blue-50 {
            --tw-gradient-to: #eff6ff;
          }

          .from-purple-50 {
            --tw-gradient-from: #faf5ff;
          }

          .to-pink-50 {
            --tw-gradient-to: #fdf2f8;
          }

          .bg-gradient-to-br {
            background: linear-gradient(
              135deg,
              var(--tw-gradient-from),
              var(--tw-gradient-to)
            ) !important;
          }

          .from-blue-400 {
            --tw-gradient-from: #60a5fa;
          }

          .to-purple-500 {
            --tw-gradient-to: #8b5cf6;
          }

          .from-cyan-400 {
            --tw-gradient-from: #22d3ee;
          }

          .to-blue-500 {
            --tw-gradient-to: #3b82f6;
          }

          .from-green-400 {
            --tw-gradient-from: #4ade80;
          }

          .to-emerald-500 {
            --tw-gradient-to: #10b981;
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

          /* Modern Table Styling */
          .modern-table-card {
            border-radius: 20px !important;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
            transition: all 0.3s ease;
          }

          .modern-table-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12) !important;
          }

          .modern-table-container {
            border-radius: 0 0 20px 20px;
            overflow: hidden;
          }

          .modern-table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
          }

          .modern-table .table-header {
            background: linear-gradient(
              135deg,
              #f8fafc 0%,
              #f1f5f9 100%
            ) !important;
            border: none !important;
            font-weight: 700;
            color: #334155 !important;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 20px 16px !important;
            position: relative;
          }

          .modern-table .table-header::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent,
              #e2e8f0,
              transparent
            );
          }

          .modern-table .table-row {
            border: none !important;
            transition: all 0.2s ease;
            background: #ffffff;
          }

          .modern-table .table-row:hover {
            background: linear-gradient(
              135deg,
              #f8fafc 0%,
              #f1f5f9 100%
            ) !important;
            transform: scale(1.005);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .modern-table .table-row:not(:last-child) {
            border-bottom: 1px solid rgba(226, 232, 240, 0.5) !important;
          }

          .modern-table td {
            border: none !important;
            vertical-align: middle !important;
            padding: 20px 16px !important;
            position: relative;
          }

          /* Enhanced Badge Styling */
          .badge {
            border-radius: 12px !important;
            font-weight: 600;
            font-size: 0.75rem;
            padding: 6px 12px !important;
            letter-spacing: 0.5px;
          }

          .rounded-pill {
            border-radius: 50px !important;
          }

          /* Card Enhancements */
          .card {
            border-radius: 20px !important;
            transition: all 0.3s ease;
            border: none !important;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .btn {
            border-radius: 12px !important;
            font-weight: 500;
            transition: all 0.2s ease;
            padding: 10px 20px !important;
          }

          .btn:hover {
            transform: translateY(-1px);
          }

          .hover-text-white:hover {
            color: white !important;
          }

          .backdrop-blur {
            backdrop-filter: blur(10px);
          }

          /* Animation Improvements */
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

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .modern-table-card {
            animation: fadeInUp 0.6s ease-out;
          }

          .modern-table .table-row {
            animation: slideInRight 0.4s ease-out;
          }

          .modern-table .table-row:nth-child(even) {
            animation-delay: 0.1s;
          }

          .modern-table .table-row:nth-child(odd) {
            animation-delay: 0.05s;
          }

          .breadcrumb-item + .breadcrumb-item::before {
            color: rgba(255, 255, 255, 0.5) !important;
          }

          /* Scrollbar Styling */
          .modern-table-container::-webkit-scrollbar {
            height: 8px;
          }

          .modern-table-container::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }

          .modern-table-container::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #cbd5e1, #94a3b8);
            border-radius: 4px;
          }

          .modern-table-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #94a3b8, #64748b);
          }

          /* Modern Chart Styling */
          .modern-chart-card {
            border-radius: 24px !important;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }

          .modern-chart-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15) !important;
          }

          .chart-header-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            position: relative;
          }

          .chart-header-gradient-cyan {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            position: relative;
          }

          .chart-header-gradient-green {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            position: relative;
          }

          .chart-header-gradient-orange {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            position: relative;
          }

          .chart-header-gradient-purple {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            position: relative;
          }

          .chart-header-gradient-pink {
            background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
            position: relative;
          }

          .chart-header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.05) 100%
            );
            backdrop-filter: blur(10px);
          }

          .chart-icon-container {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(15px);
            border-radius: 16px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .chart-title {
            font-size: 1.3rem !important;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .text-white-75 {
            color: rgba(255, 255, 255, 0.75) !important;
          }

          .chart-badge {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #4f46e5 !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 16px !important;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .chart-badge-cyan {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #0891b2 !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 16px !important;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .chart-badge-green {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #059669 !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 16px !important;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .chart-badge-orange {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #d97706 !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 16px !important;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .chart-badge-purple {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #7c3aed !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 16px !important;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .chart-badge-pink {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #db2777 !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 16px !important;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
          }

          .chart-body-gradient {
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            position: relative;
          }

          .chart-body-gradient-cyan {
            background: linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%);
            position: relative;
          }

          .chart-body-gradient-green {
            background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
            position: relative;
          }

          .chart-body-gradient-orange {
            background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
            position: relative;
          }

          .chart-body-gradient-purple {
            background: linear-gradient(180deg, #faf5ff 0%, #ffffff 100%);
            position: relative;
          }

          .chart-body-gradient-pink {
            background: linear-gradient(180deg, #fdf2f8 0%, #ffffff 100%);
            position: relative;
          }

          .chart-background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(
                circle at 20% 80%,
                rgba(120, 119, 198, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(120, 119, 198, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(120, 119, 198, 0.05) 0%,
                transparent 50%
              );
            pointer-events: none;
          }

          .chart-background-pattern-cyan {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(
                circle at 20% 80%,
                rgba(6, 182, 212, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(6, 182, 212, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(6, 182, 212, 0.05) 0%,
                transparent 50%
              );
            pointer-events: none;
          }

          .chart-background-pattern-green {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(
                circle at 20% 80%,
                rgba(16, 185, 129, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(16, 185, 129, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(16, 185, 129, 0.05) 0%,
                transparent 50%
              );
            pointer-events: none;
          }

          .chart-background-pattern-orange {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(
                circle at 20% 80%,
                rgba(245, 158, 11, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(245, 158, 11, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(245, 158, 11, 0.05) 0%,
                transparent 50%
              );
            pointer-events: none;
          }

          .chart-background-pattern-purple {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(
                circle at 20% 80%,
                rgba(139, 92, 246, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(139, 92, 246, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(139, 92, 246, 0.05) 0%,
                transparent 50%
              );
            pointer-events: none;
          }

          .chart-background-pattern-pink {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(
                circle at 20% 80%,
                rgba(236, 72, 153, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(236, 72, 153, 0.05) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(236, 72, 153, 0.05) 0%,
                transparent 50%
              );
            pointer-events: none;
          }

          /* Chart Animation Enhancements */
          @keyframes chartFadeIn {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes chartSlideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes chartSlideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .modern-chart-card:nth-child(odd) {
            animation: chartSlideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .modern-chart-card:nth-child(even) {
            animation: chartSlideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .modern-chart-card:nth-child(1) {
            animation-delay: 0.1s;
          }
          .modern-chart-card:nth-child(2) {
            animation-delay: 0.2s;
          }
          .modern-chart-card:nth-child(3) {
            animation-delay: 0.3s;
          }
          .modern-chart-card:nth-child(4) {
            animation-delay: 0.4s;
          }
          .modern-chart-card:nth-child(5) {
            animation-delay: 0.5s;
          }
          .modern-chart-card:nth-child(6) {
            animation-delay: 0.6s;
          }

          /* Responsive Chart Enhancements */
          @media (max-width: 768px) {
            .modern-chart-card {
              margin-bottom: 2rem;
            }

            .chart-title {
              font-size: 1.1rem !important;
            }

            .chart-icon-container {
              width: 40px;
              height: 40px;
            }
          }

          /* Modern Search Input Styles */
          .bg-gradient-light {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }

          .modern-search-input {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
          }

          .modern-search-input:focus-within {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            transform: translateY(-2px);
          }

          .modern-search-input .input-group-text {
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
            transition: all 0.3s ease;
          }

          .modern-search-input .form-control {
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
            transition: all 0.3s ease;
          }

          .modern-search-input .form-control:focus {
            box-shadow: none;
            outline: none;
          }

          .modern-search-input .form-control::placeholder {
            color: #adb5bd;
            font-weight: 400;
          }

          .search-wrapper small {
            font-size: 0.825rem;
            font-weight: 500;
          }
        `}</style>

        {/* Custom Modal Styles */}
        <style jsx global>{`
          .user-details-modal .modal-header,
          .edit-user-modal .modal-header,
          .delete-user-modal .modal-header {
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.05) 100%
            ) !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .user-details-modal .modal-header {
            background: linear-gradient(
              135deg,
              #0d6efd 0%,
              #0a58ca 100%
            ) !important;
          }

          .edit-user-modal .modal-header {
            background: linear-gradient(
              135deg,
              #198754 0%,
              #146c43 100%
            ) !important;
          }

          .delete-user-modal .modal-header {
            background: linear-gradient(
              135deg,
              #dc3545 0%,
              #b02a37 100%
            ) !important;
          }

          .info-card {
            transition: all 0.3s ease;
            border: 1px solid rgba(0, 0, 0, 0.08);
          }

          .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }

          .modern-form .form-control:focus,
          .modern-form .form-select:focus {
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          }

          .nav-link.active,
          .nav-link[aria-current="page"] {
            background-color: #0d6efd !important;
            color: white !important;
            border-radius: 8px;
            font-weight: 600;
          }

          .nav-link.active .badge,
          .nav-link[aria-current="page"] .badge {
            background-color: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
          }
        `}</style>

        {/* View User Details Modal */}
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          size="xl"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-primary me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <PersonPlus size={24} className="text-white" />
              </div>
              <div>
                User Details
                <div className="text-muted fw-normal small">
                  View user information and details
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="p-0 bg-light">
            {selectedUser && (
              <div className="p-4">
                {/* Header Section */}
                <div className="text-center mb-5 position-relative">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4 position-relative"
                    style={{ width: "120px", height: "120px" }}
                  >
                    <div
                      className="bg-gradient-to-br from-primary to-info rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                      style={{ width: "80px", height: "80px" }}
                    >
                      <PersonCircle size={40} className="text-white" />
                    </div>
                  </div>
                  <h3 className="fw-bold text-primary mb-2">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-muted mb-3 fs-6">{selectedUser.email}</p>
                  <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <Badge
                      bg={getStatusVariant(selectedUser.status)}
                      className="px-3 py-2 fs-6"
                    >
                      {selectedUser.status}
                    </Badge>
                    <Badge
                      bg={
                        selectedUser.institution?.name ? "primary" : "secondary"
                      }
                      className="px-3 py-2 fs-6"
                    >
                      {selectedUser.institution?.name || "No Institution"}
                    </Badge>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Personal Details */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                            <PersonCircle size={20} className="text-primary" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Personal Details
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              First Name
                            </small>
                            <span className="fw-semibold text-dark">
                              {selectedUser.firstName}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Last Name
                            </small>
                            <span className="fw-semibold">
                              {selectedUser.lastName}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Email
                            </small>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {selectedUser.email}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Status
                            </small>
                            <Badge
                              bg={getStatusVariant(selectedUser.status)}
                              className="px-2 py-1"
                            >
                              {selectedUser.status}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-start py-2">
                            <small className="text-muted fw-medium">
                              Roles
                            </small>
                            <div className="text-end">
                              {selectedUser.roles &&
                              selectedUser.roles.length > 0 ? (
                                selectedUser.roles.map((userRole) => (
                                  <Badge
                                    key={userRole.roleId}
                                    bg="info"
                                    className="me-1 mb-1"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {userRole.role.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted small">
                                  No roles assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                            <Globe size={20} className="text-info" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Organization
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Institution
                            </small>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {selectedUser.institution?.name ||
                                "No Institution"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Country
                            </small>
                            <span className="fw-semibold">
                              {selectedUser.institution?.country || "N/A"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Department
                            </small>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {selectedUser.department?.name || "No Department"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Activity */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                            <Activity size={20} className="text-success" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Account Activity
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Created At
                            </small>
                            <small className="fw-semibold">
                              <DateTimeDisplay date={selectedUser.createdAt} />
                            </small>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Last Login
                            </small>
                            <small className="fw-semibold">
                              {selectedUser.lastLogin ? (
                                <DateTimeDisplay
                                  date={selectedUser.lastLogin}
                                />
                              ) : (
                                <span className="text-primary">
                                  Never logged in
                                </span>
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Security */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                            <ShieldLock size={20} className="text-warning" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Account Security
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              User ID
                            </small>
                            <Badge bg="secondary" className="px-2 py-1">
                              #{selectedUser.id}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Account Status
                            </small>
                            <Badge
                              bg={getStatusVariant(selectedUser.status)}
                              className="px-2 py-1"
                            >
                              {selectedUser.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light p-4">
            <Button
              variant="secondary"
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 fw-semibold"
            >
              <Eye size={16} className="me-2" />
              Close Details
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          size="xl"
          className="edit-user-modal"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-primary me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <Pencil size={24} className="text-white" />
              </div>
              <div>
                Edit User
                <div className="text-muted fw-normal small">
                  Update user information and permissions
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="p-4 bg-light">
            <div className="mb-4">
              <div
                className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "80px", height: "80px" }}
              >
                <Pencil size={32} className="text-success" />
              </div>
              <h5 className="fw-bold text-success mb-2">
                Update User Information
              </h5>
              <p className="text-muted small">
                Modify user details and account settings
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <Form className="modern-form">
                <div className="row g-4">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <PersonCircle size={16} className="text-success" />
                        First Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            firstName: e.target.value,
                          })
                        }
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                      <Form.Text className="text-muted">
                        User&apos;s legal first name
                      </Form.Text>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <PersonCircle size={16} className="text-success" />
                        Last Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            lastName: e.target.value,
                          })
                        }
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                      <Form.Text className="text-muted">
                        User&apos;s legal last name
                      </Form.Text>
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <Globe size={16} className="text-success" />
                    Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="form-control-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  />
                  <Form.Text className="text-muted">
                    Primary email address for account login
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <Telephone size={16} className="text-success" />
                    Phone Number
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    pattern="^2547[0-9]{8}$"
                    title="Phone number must be in format: 2547xxxxxxxx"
                    className="form-control-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  />
                  <Form.Text className="text-muted">
                    Format: 2547xxxxxxxx (11 digits starting with 2547)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <ShieldLock size={16} className="text-success" />
                    Roles
                  </Form.Label>
                  <div className="border rounded p-3 bg-light">
                    {roles.map((role) => (
                      <Form.Check
                        key={role.id}
                        type="checkbox"
                        id={`role-${role.id}`}
                        label={`${role.name} - ${role.description}`}
                        checked={editFormData.roles.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditFormData({
                              ...editFormData,
                              roles: [...editFormData.roles, role.id],
                            });
                          } else {
                            setEditFormData({
                              ...editFormData,
                              roles: editFormData.roles.filter(
                                (id) => id !== role.id
                              ),
                            });
                          }
                        }}
                        className="mb-2"
                      />
                    ))}
                  </div>
                  <Form.Text className="text-muted">
                    Select one or more roles for the user
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <Globe size={16} className="text-success" />
                    Institution
                  </Form.Label>
                  <Form.Select
                    value={editFormData.institutionId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        institutionId: e.target.value,
                      })
                    }
                    className="form-select-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((institution) => (
                      <option
                        key={institution.id}
                        value={institution.id.toString()}
                      >
                        {institution.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Organization or company the user belongs to
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <Activity size={16} className="text-success" />
                    Account Status
                  </Form.Label>
                  <Form.Select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                    className="form-select-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  >
                    <option value="ACTIVE">✅ Active</option>
                    <option value="INACTIVE">⏸️ Inactive</option>
                    <option value="SUSPENDED">🚫 Suspended</option>
                    <option value="DELETED">🗑️ Deleted</option>
                    <option value="INVITED">📧 Invited</option>
                    <option value="TRIAL">🆓 Trial</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Current status of the user account
                  </Form.Text>
                </Form.Group>
              </Form>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light">
            <Button
              variant="outline-secondary"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleUpdateUser}
              disabled={isUpdating}
              className="px-4 py-2 fw-semibold"
            >
              {isUpdating ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Updating...
                </>
              ) : (
                <>
                  <Pencil size={16} className="me-2" />
                  Update User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          size="xl"
          className="delete-user-modal"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-danger me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <Trash size={24} className="text-white" />
              </div>
              <div>
                Delete User
                <div className="text-muted fw-normal small">
                  This action cannot be undone
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="p-4 bg-light">
            {selectedUser && (
              <div className="text-center">
                <div className="mb-4">
                  <div
                    className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <Trash size={32} className="text-danger" />
                  </div>
                  <h5 className="fw-bold text-danger mb-3">
                    Delete User Confirmation
                  </h5>
                  <p className="text-muted mb-4">
                    Are you sure you want to delete this user? This action
                    cannot be undone and will permanently remove all associated
                    data.
                  </p>
                </div>
                <div className="bg-light border border-danger border-opacity-25 p-3 rounded mb-4">
                  <div className="fw-semibold text-dark mb-2">
                    User to be deleted:
                  </div>
                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <div
                      className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <PersonCircle size={24} className="text-primary" />
                    </div>
                    <div className="text-start">
                      <div className="fw-semibold mb-1">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                      <div className="text-muted small">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="alert alert-danger d-flex align-items-center gap-2"
                  role="alert"
                >
                  <Trash size={16} />
                  <small className="fw-semibold">
                    Warning: This action is irreversible!
                  </small>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showEditInstitutionModal}
          onHide={() => setShowEditInstitutionModal(false)}
          size="xl"
          className="edit-institution-modal"
        >
          <Modal.Header className="bg-primary text-white border-0">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-primary">
              <Pencil size={24} className="text-primary" />
              Editing {selectedInstitution?.name || "Institution"}
            </Modal.Title>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowEditInstitutionModal(false)}
            ></button>
          </Modal.Header>
          <Modal.Body className="p-4 bg-light">
            <div className="mb-4 text-center">
              <div
                className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "80px", height: "80px" }}
              >
                <Pencil size={32} className="text-primary" />
              </div>
              <h5 className="fw-bold text-primary mb-2">
                Update Institution Information
              </h5>
              <p className="text-muted small">
                Modify institution details and settings
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <Form className="modern-form">
                <div className="row g-4">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Building size={16} className="text-primary" />
                        Institution Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={editInstitutionFormData.name}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter institution name"
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Building size={16} className="text-primary" />
                        Industry
                      </Form.Label>
                      <Form.Select
                        value={editInstitutionFormData.industry}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            industry: e.target.value,
                          })
                        }
                        className="form-select-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      >
                        <option value="">Select Industry</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Technology">Technology</option>
                        <option value="Manufacturing">Manufacturing</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>

                <div className="row g-4 mt-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <GeoAlt size={16} className="text-primary" />
                        Address
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={editInstitutionFormData.address}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter address"
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <GeoAlt size={16} className="text-primary" />
                        City
                      </Form.Label>
                      <Form.Select
                        value={editInstitutionFormData.city}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            city: e.target.value,
                          })
                        }
                        className="form-select-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      >
                        <option value="">Select City</option>
                        <option value="Nairobi">Nairobi</option>
                        <option value="Mombasa">Mombasa</option>
                        <option value="Kisumu">Kisumu</option>
                        <option value="Nakuru">Nakuru</option>
                        <option value="Eldoret">Eldoret</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>

                <div className="row g-4 mt-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        Country
                      </Form.Label>
                      <Form.Select
                        value={editInstitutionFormData.country}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            country: e.target.value,
                          })
                        }
                        className="form-select-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      >
                        <option value="">Select Country</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Ethiopia">Ethiopia</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        Contact Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={editInstitutionFormData.contactEmail}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            contactEmail: e.target.value,
                          })
                        }
                        placeholder="Enter contact email"
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row g-4 mt-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        Phone Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={editInstitutionFormData.phone}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Enter phone number"
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        Website URL
                      </Form.Label>
                      <Form.Control
                        type="url"
                        value={editInstitutionFormData.websiteUrl}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            websiteUrl: e.target.value,
                          })
                        }
                        placeholder="Enter website URL"
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Logo URL
                  </Form.Label>
                  <Form.Control
                    type="url"
                    value={editInstitutionFormData.logoUrl}
                    onChange={(e) =>
                      setEditInstitutionFormData({
                        ...editInstitutionFormData,
                        logoUrl: e.target.value,
                      })
                    }
                    placeholder="Enter logo URL"
                    className="form-control-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  />
                </Form.Group>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    Billing Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={editInstitutionFormData.billingEmail}
                    onChange={(e) =>
                      setEditInstitutionFormData({
                        ...editInstitutionFormData,
                        billingEmail: e.target.value,
                      })
                    }
                    placeholder="Enter billing email"
                    className="form-control-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  />
                </Form.Group>

                <Row className="mt-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        Subscription Start Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={editInstitutionFormData.subscriptionStartDate}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            subscriptionStartDate: e.target.value,
                          })
                        }
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        Subscription End Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={editInstitutionFormData.subscriptionEndDate}
                        onChange={(e) =>
                          setEditInstitutionFormData({
                            ...editInstitutionFormData,
                            subscriptionEndDate: e.target.value,
                          })
                        }
                        className="form-control-lg"
                        style={{ padding: "12px 16px", fontSize: "16px" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    Institution Status
                  </Form.Label>
                  <Form.Select
                    value={editInstitutionFormData.status}
                    onChange={(e) =>
                      setEditInstitutionFormData({
                        ...editInstitutionFormData,
                        status: e.target.value,
                      })
                    }
                    className="form-select-lg"
                    style={{ padding: "12px 16px", fontSize: "16px" }}
                  >
                    <option value="ACTIVE">✅ Active</option>
                    <option value="INACTIVE">⏸️ Inactive</option>
                    <option value="SUSPENDED">🚫 Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light">
            <Button
              variant="outline-secondary"
              onClick={() => setShowEditInstitutionModal(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateInstitution}
              disabled={isUpdatingInstitution}
              className="px-4 py-2 fw-semibold"
            >
              {isUpdatingInstitution ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Updating...
                </>
              ) : (
                <>
                  <Pencil size={16} className="me-2" />
                  Update Institution
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Institution Confirmation Modal */}
        <Modal
          show={showDeleteInstitutionModal}
          onHide={() => setShowDeleteInstitutionModal(false)}
          size="xl"
          className="delete-institution-modal"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-danger me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <Trash size={24} className="text-white" />
              </div>
              <div>
                Delete Institution
                <div className="text-muted fw-normal small">
                  This action cannot be undone
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="p-4 bg-light">
            {selectedInstitution && (
              <div className="text-center">
                <div className="mb-4">
                  <div
                    className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <Trash size={32} className="text-danger" />
                  </div>
                  <h5 className="fw-bold text-danger mb-3">
                    Delete Institution Confirmation
                  </h5>
                  <p className="text-muted mb-4">
                    Are you sure you want to delete this institution? This
                    action cannot be undone and will permanently remove all
                    associated data including all users and departments.
                  </p>
                </div>
                <div className="bg-light border border-danger border-opacity-25 p-3 rounded mb-4">
                  <div className="fw-semibold text-dark mb-2">
                    Institution to be deleted:
                  </div>
                  <div className="d-flex align-items-center justify-content-center gap-3">
                    {selectedInstitution.logoUrl ? (
                      <img
                        src={selectedInstitution.logoUrl}
                        alt={selectedInstitution.name}
                        className="rounded-circle border border-light shadow-sm"
                        style={{
                          width: "48px",
                          height: "48px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "48px", height: "48px" }}
                      >
                        <span
                          className="text-white fw-bold"
                          style={{ fontSize: "16px" }}
                        >
                          {selectedInstitution.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-start">
                      <div className="fw-semibold mb-1">
                        {selectedInstitution.name}
                      </div>
                      <div className="text-muted small">
                        {selectedInstitution.contactEmail || "No contact email"}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="alert alert-danger d-flex align-items-center gap-2"
                  role="alert"
                >
                  <Trash size={16} />
                  <small className="fw-semibold">
                    Warning: This action will permanently delete the institution
                    and all associated data!
                  </small>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteInstitutionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteInstitution}
              disabled={isDeletingInstitution}
            >
              {isDeletingInstitution ? "Deleting..." : "Delete Institution"}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showViewInstitutionModal}
          onHide={() => setShowViewInstitutionModal(false)}
          size="xl"
          className="view-institution-modal"
        >
          <Modal.Header className="bg-light border-0 position-relative overflow-hidden shadow-sm">
            {/* Subtle background elements */}
            <div className="position-absolute top-0 start-0 w-100 h-100 opacity-5">
              <div
                className="bg-primary opacity-10 rounded-circle position-absolute"
                style={{
                  width: "120px",
                  height: "120px",
                  top: "-30px",
                  right: "-30px",
                }}
              ></div>
              <div
                className="bg-info opacity-8 rounded-circle position-absolute"
                style={{
                  width: "80px",
                  height: "80px",
                  bottom: "-20px",
                  left: "-20px",
                }}
              ></div>
            </div>

            <Modal.Title className="fw-bold d-flex align-items-center gap-3 text-dark position-relative">
              <div className="bg-primary bg-opacity-15 p-3 rounded-circle">
                <FaBuilding size={24} className="text-primary" />
              </div>
              <div>
                <h5 className="mb-1 fw-bold text-dark">Institution Details</h5>
                <small className="text-muted">
                  Complete information overview
                </small>
              </div>
            </Modal.Title>

            <button
              type="button"
              className="btn-close position-absolute"
              style={{ top: "20px", right: "20px" }}
              onClick={() => setShowViewInstitutionModal(false)}
            ></button>
          </Modal.Header>
          <Modal.Body className="p-0 bg-light">
            {selectedInstitution && (
              <div className="p-4">
                {/* Header Section */}
                <div className="text-center mb-5 position-relative">
                  <div
                    className="position-relative mb-4"
                    style={{ width: "120px", height: "120px" }}
                  >
                    {selectedInstitution.logoUrl ? (
                      <img
                        src={selectedInstitution.logoUrl}
                        alt={`${selectedInstitution.name} logo`}
                        className="rounded-circle w-100 h-100 object-cover border border-3 border-light shadow-sm"
                      />
                    ) : (
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center h-100">
                        <div
                          className="bg-gradient-to-br from-primary to-info rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                          style={{ width: "80px", height: "80px" }}
                        >
                          <Building size={40} className="text-white" />
                        </div>
                      </div>
                    )}
                    {selectedInstitution.isActive !== undefined && (
                      <span
                        className={`position-absolute bottom-0 end-0 translate-middle p-1 rounded-circle border border-2 border-white ${
                          selectedInstitution.isActive
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                        style={{ width: "20px", height: "20px" }}
                        title={
                          selectedInstitution.isActive ? "Active" : "Inactive"
                        }
                      ></span>
                    )}
                  </div>
                  <h3 className="fw-bold text-primary mb-3">
                    {selectedInstitution.name}
                  </h3>
                  <p className="text-muted mb-4 fs-6">
                    {selectedInstitution.industry || "No industry specified"}
                  </p>

                  <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
                    <Badge
                      bg={getStatusVariant(selectedInstitution.status)}
                      className="px-3 py-2 fs-6 d-flex align-items-center gap-2"
                    >
                      <i className="bi bi-circle-fill small"></i>
                      {selectedInstitution.status?.toUpperCase() || "N/A"}
                    </Badge>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Basic Information */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                            <Building size={20} className="text-primary" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Basic Information
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Institution Name
                            </small>
                            <span className="fw-semibold text-dark">
                              {selectedInstitution.name}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Industry
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.industry || "Not specified"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Status
                            </small>
                            <Badge
                              bg={getStatusVariant(selectedInstitution.status)}
                              className="px-2 py-1"
                            >
                              {selectedInstitution.status}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Created
                            </small>
                            <small className="fw-semibold">
                              <DateTimeDisplay
                                date={selectedInstitution.createdAt}
                              />
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Location */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                            <Globe size={20} className="text-info" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Contact & Location
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Contact Email
                            </small>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {selectedInstitution.contactEmail ||
                                "Not provided"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Phone Number
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.phone || "Not provided"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Website
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.websiteUrl ? (
                                <a
                                  href={selectedInstitution.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-decoration-none"
                                >
                                  Visit Website →
                                </a>
                              ) : (
                                "Not provided"
                              )}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Country
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.country || "Not specified"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">City</small>
                            <span className="fw-semibold">
                              {selectedInstitution.city || "Not specified"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Address
                            </small>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {selectedInstitution.address || "Not provided"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Postal Code
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.postalCode ||
                                "Not specified"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Active Status
                            </small>
                            <Badge
                              bg={
                                selectedInstitution.isActive
                                  ? "success"
                                  : "danger"
                              }
                              className="px-2 py-1"
                            >
                              {selectedInstitution.isActive
                                ? "Active"
                                : "Deleted"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Information */}
                  <div className="col-lg-12">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                            <CreditCard size={20} className="text-warning" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            Subscription Information
                          </h6>
                        </div>
                        <div className="space-y-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Subscription Start Date
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.subscriptionStartDate ? (
                                <DateTimeDisplay
                                  date={
                                    selectedInstitution.subscriptionStartDate
                                  }
                                />
                              ) : (
                                "Not set"
                              )}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                            <small className="text-muted fw-medium">
                              Subscription End Date
                            </small>
                            <span className="fw-semibold">
                              {selectedInstitution.subscriptionEndDate ? (
                                <DateTimeDisplay
                                  date={selectedInstitution.subscriptionEndDate}
                                />
                              ) : (
                                "Not set"
                              )}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted fw-medium">
                              Billing Email
                            </small>
                            <span
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {selectedInstitution.billingEmail ||
                                "Not provided"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="col-lg-12">
                    <div className="card border-0 shadow-sm h-100 hover-lift">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                            <People size={20} className="text-success" />
                          </div>
                          <h6 className="fw-bold text-dark mb-0">
                            User & Department Stats
                          </h6>
                        </div>
                        <div className="row g-4">
                          <div className="col-6">
                            <div className="text-center p-3 bg-success bg-opacity-5 rounded">
                              <div className="h3 fw-bold text-light mb-1">
                                {selectedInstitution._count.users}
                              </div>
                              <small className="text-light">Total Users</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-3 bg-info bg-opacity-5 rounded">
                              <div className="h3 fw-bold text-light mb-1">
                                {selectedInstitution._count.departments}
                              </div>
                              <small className="text-light">Departments</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institution Logo Section */}
                {selectedInstitution.logoUrl && (
                  <div className="row g-4 mt-4">
                    <div className="col-12">
                      <div className="card border-0 shadow-sm hover-lift">
                        <div className="card-body p-4 text-center">
                          <div className="d-flex align-items-center justify-content-center mb-4">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                              <Building size={20} className="text-primary" />
                            </div>
                            <h6 className="fw-bold text-dark mb-0">
                              Institution Logo
                            </h6>
                          </div>
                          <div className="d-flex justify-content-center">
                            <div className="position-relative">
                              <img
                                src={selectedInstitution.logoUrl}
                                alt={`${selectedInstitution.name} logo`}
                                className="rounded shadow-lg border"
                                style={{
                                  maxWidth: "250px",
                                  maxHeight: "250px",
                                  objectFit: "contain",
                                  backgroundColor: "#f8f9fa",
                                  padding: "20px",
                                }}
                              />
                              <div className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-5 rounded d-none d-lg-flex align-items-center justify-content-center opacity-0 hover-opacity-100 transition-all">
                                <div className="bg-white bg-opacity-90 px-3 py-2 rounded">
                                  <small className="fw-semibold text-primary">
                                    Click to view full size
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light p-4">
            <Button
              variant="secondary"
              onClick={() => setShowViewInstitutionModal(false)}
              className="px-4 py-2 fw-semibold"
            >
              <Eye size={16} className="me-2" />
              Close Details
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Role Modal */}
        <Modal
          show={showViewRoleModal}
          onHide={() => setShowViewRoleModal(false)}
          size="xl"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-success me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <ShieldLock size={24} className="text-white" />
              </div>
              <div>
                Role Details
                <div className="text-muted fw-normal small">
                  Complete role information
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="p-4">
            {selectedRole && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="fw-bold text-primary mb-2">
                        {selectedRole.name.toUpperCase()}
                      </h4>
                      <Badge
                        bg={
                          selectedRole.adminCreatedRole ? "primary" : "success"
                        }
                        className="px-3 py-2"
                      >
                        {selectedRole.adminCreatedRole
                          ? "System Role"
                          : "Custom Role"}
                      </Badge>
                    </div>
                    <div className="text-end">
                      <small className="text-muted">Role ID</small>
                      <div className="fw-bold">{selectedRole.id}</div>
                    </div>
                  </div>
                </div>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                      <ShieldLock size={18} className="me-2 text-primary" />
                      Description & Permissions
                    </h6>
                    <p className="text-muted mb-0">
                      {selectedRole.description || "No description provided"}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                      <Activity size={18} className="me-2 text-primary" />
                      Timeline
                    </h6>
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <small className="text-muted fw-medium">Created</small>
                      <span className="fw-semibold">
                        <DateTimeDisplay date={selectedRole.createdAt} />
                      </span>
                    </div>
                    {selectedRole.updatedAt !== selectedRole.createdAt && (
                      <div className="d-flex justify-content-between align-items-center py-2 mt-2">
                        <small className="text-muted fw-medium">
                          Last Updated
                        </small>
                        <span className="fw-semibold">
                          <DateTimeDisplay date={selectedRole.updatedAt} />
                        </span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light">
            <Button
              variant="secondary"
              onClick={() => setShowViewRoleModal(false)}
              className="px-4 py-2"
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Role Modal */}
        <Modal
          show={showEditRoleModal}
          onHide={() => setShowEditRoleModal(false)}
          size="xl"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-success me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <Pencil size={24} className="text-white" />
              </div>
              <div>
                Edit Role
                <div className="text-muted fw-normal small">
                  Update role information
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateRole();
            }}
          >
            <Modal.Body className="p-4">
              {selectedRole && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Role Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={editRoleFormData.name}
                      onChange={(e) =>
                        setEditRoleFormData({
                          ...editRoleFormData,
                          name: e.target.value,
                        })
                      }
                      required
                      placeholder="Enter role name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={editRoleFormData.description}
                      onChange={(e) =>
                        setEditRoleFormData({
                          ...editRoleFormData,
                          description: e.target.value,
                        })
                      }
                      required
                      placeholder="Enter role description and permissions"
                    />
                  </Form.Group>

                  <Badge
                    bg={selectedRole.adminCreatedRole ? "primary" : "success"}
                    className="px-3 py-2"
                  >
                    {selectedRole.adminCreatedRole
                      ? "System Role"
                      : "Custom Role"}
                  </Badge>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 bg-light">
              <Button
                variant="outline-secondary"
                onClick={() => setShowEditRoleModal(false)}
                disabled={isUpdatingRole}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isUpdatingRole}>
                {isUpdatingRole ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Updating...
                  </>
                ) : (
                  "Update Role"
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Delete Role Modal */}
        <Modal
          show={showDeleteRoleModal}
          onHide={() => setShowDeleteRoleModal(false)}
          size="xl"
        >
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-danger me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <Trash size={24} className="text-white" />
              </div>
              <div>
                Delete Role
                <div className="text-muted fw-normal small">
                  This action cannot be undone
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="p-4">
            {selectedRole && (
              <>
                <div className="alert alert-danger d-flex align-items-start">
                  <Activity size={20} className="me-2 mt-1" />
                  <div>
                    <strong>Warning!</strong>
                    <p className="mb-0 mt-1">
                      Are you sure you want to delete the role{" "}
                      <strong>{selectedRole.name}</strong>? This action cannot
                      be undone.
                    </p>
                  </div>
                </div>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <div className="mb-2">
                      <small className="text-muted">Role Name</small>
                      <div className="fw-bold">
                        {selectedRole.name.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <small className="text-muted">Description</small>
                      <div className="text-muted">
                        {selectedRole.description || "No description"}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light">
            <Button
              variant="outline-secondary"
              onClick={() => setShowDeleteRoleModal(false)}
              disabled={isDeletingRole}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteRole}
              disabled={isDeletingRole}
            >
              {isDeletingRole ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AuthProvider>
  );
}

export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SuperAdminDashboardContent />
    </Suspense>
  );
}
