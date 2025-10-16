"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Pagination,
} from "react-bootstrap";
import {
  People,
  Gear,
  Pencil,
  PersonCircle,
  Search,
  Grid3x3Gap,
  StarFill,
  Bell,
  Eye,
  Filter,
  X,
  ShieldLock,
  CurrencyDollar,
  ClipboardData,
  Lightning,
  Activity,
  Calendar,
  GraphUp,
  CheckCircle,
  Clock,
  ExclamationTriangle,
  Download,
  Upload,
  Speedometer2,
  Award,
  Trash,
  Envelope,
  Telephone,
  FileText,
} from "react-bootstrap-icons";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import AdminCreateUserModal from "@/app/components/modals/admin-create-user-modal";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";
import PageLoader from "@/app/components/PageLoader";
import RoleCreationModal from "@/app/components/modals/admin-role-creation";
import UserDetailsModal from "@/app/components/modals/user-details-modal";
import RoleDetailsModal from "@/app/components/modals/role-details-modal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  ChartDataLabels
);

enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
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

interface Region {
  id: number;
  name: string;
  institutionId: number;
  institution?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
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
  activeUsers: number;
  pendingApprovals: number;
  monthlyExpenses: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface ActivityItem {
  id: number;
  type: 'user' | 'role' | 'expense' | 'system';
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [editUserFormData, setEditUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "",
    roles: [] as number[],
  });
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [editRoleFormData, setEditRoleFormData] = useState({
    role: "",
    description: "",
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(100);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState("");
  const [currentRolePage, setCurrentRolePage] = useState(1);
  const [rolesPerPage] = useState(100);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showCreateRegionModal, setShowCreateRegionModal] = useState(false);
  const [showEditRegionModal, setShowEditRegionModal] = useState(false);
  const [showDeleteRegionModal, setShowDeleteRegionModal] = useState(false);
  const [createRegionFormData, setCreateRegionFormData] = useState({
    name: "",
  });
  const [editRegionFormData, setEditRegionFormData] = useState({
    name: "",
  });
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);
  const [isUpdatingRegion, setIsUpdatingRegion] = useState(false);
  const [isDeletingRegion, setIsDeletingRegion] = useState(false);
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [currentRegionPage, setCurrentRegionPage] = useState(1);
  const [regionsPerPage] = useState(100);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRoles: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    monthlyExpenses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Quick Actions Configuration
  const quickActions: QuickAction[] = [
    {
      id: 'add-user',
      title: 'Add New User',
      description: 'Create a new company user account',
      icon: <People size={24} />,
      color: 'primary',
      action: () => {
        // Trigger user creation modal
        const addButton = document.querySelector('[data-bs-target="#createUserModal"]') as HTMLElement;
        if (addButton) addButton.click();
      }
    },
    {
      id: 'create-role',
      title: 'Create Role',
      description: 'Define new user roles and permissions',
      icon: <ShieldLock size={24} />,
      color: 'success',
      action: () => {
        const addButton = document.querySelector('[data-bs-target="#createRoleModal"]') as HTMLElement;
        if (addButton) addButton.click();
      }
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure company-wide settings',
      icon: <Gear size={24} />,
      color: 'secondary',
      action: () => {
        toast.info('System settings coming soon!');
      }
    },
    {
      id: 'bulk-import',
      title: 'Bulk Import',
      description: 'Import users from CSV or Excel',
      icon: <Upload size={24} />,
      color: 'dark',
      action: () => {
        // Handle bulk import
        toast.info('Bulk import feature coming soon!');
      }
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <People size={16} className="text-primary" />;
      case 'role': return <ShieldLock size={16} className="text-success" />;
      case 'expense': return <CurrencyDollar size={16} className="text-warning" />;
      case 'system': return <Gear size={16} className="text-info" />;
      default: return <Activity size={16} className="text-secondary" />;
    }
  };
  const [loading, setLoading] = useState(false);

  // Handle tab change and update URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

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
        const fetchedUsers = data.getUsers || [];
        const fetchedRoles = data.getRoles || [];
        const fetchedRegions = data.getRegions || [];
        setUsers(fetchedUsers);
        setRoles(fetchedRoles);
        setRegions(fetchedRegions);
        const activeUsersCount = fetchedUsers.filter((u: User) => u.status === UserStatus.ACTIVE).length;
        const pendingCount = fetchedUsers.filter((u: User) => u.status === UserStatus.PENDING).length;

        setStats({
          totalUsers: Array.isArray(fetchedUsers) ? fetchedUsers.length : 0,
          totalRoles: Array.isArray(fetchedRoles) ? fetchedRoles.length : 0,
          activeUsers: activeUsersCount,
          pendingApprovals: pendingCount,
          monthlyExpenses: Math.floor(Math.random() * 50000) + 25000, // Mock data
        });

        // Mock recent activity data
        setRecentActivity([
          {
            id: 1,
            type: 'user',
            action: 'User created',
            user: 'Admin',
            timestamp: '2 minutes ago',
            details: `New user ${fetchedUsers[0]?.firstName || 'John'} ${fetchedUsers[0]?.lastName || 'Doe'} added`
          },
          {
            id: 2,
            type: 'role',
            action: 'Role updated',
            user: 'System Admin',
            timestamp: '15 minutes ago',
            details: 'Manager role permissions modified'
          },
          {
            id: 3,
            type: 'expense',
            action: 'Expense approved',
            user: 'Finance Team',
            timestamp: '1 hour ago',
            details: '$2,500 expense request approved'
          },
          {
            id: 4,
            type: 'system',
            action: 'System backup',
            user: 'System',
            timestamp: '3 hours ago',
            details: 'Daily backup completed successfully'
          },
          {
            id: 5,
            type: 'user',
            action: 'Login activity',
            user: 'Multiple users',
            timestamp: '4 hours ago',
            details: '15 users logged in today'
          }
        ]);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      toast.error(`Failed to fetch data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // User CRUD Handlers
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      status: user.status || "",
      roles: user.roles?.map((r: any) => r.roleId) || [],
    });
    setShowEditUserModal(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdatingUser(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/company-admin/edit-user/${selectedUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
          body: JSON.stringify(editUserFormData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("User updated successfully!");
        setShowEditUserModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (error) {
      toast.error(`Failed to update user: ${error}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeletingUser(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/company-admin/delete-user/${selectedUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("User deleted successfully!");
        setShowDeleteUserModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error(`Failed to delete user: ${error}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Role CRUD Handlers
  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setEditRoleFormData({
      role: role.name || "",
      description: role.description || "",
    });
    setShowEditRoleModal(true);
  };

  const handleDeleteRole = (role: any) => {
    setSelectedRole(role);
    setShowDeleteRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    setIsUpdatingRole(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/company-admin/edit-role/${selectedRole.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
          body: JSON.stringify(editRoleFormData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Role updated successfully!");
        setShowEditRoleModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update role");
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
        `${BASE_API_URL}/company-admin/delete-role/${selectedRole.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Role deleted successfully!");
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

  // Region CRUD Handlers
  const handleCreateRegion = async () => {
    if (!createRegionFormData.name.trim()) {
      toast.error("Region name is required");
      return;
    }

    setIsCreatingRegion(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/company-admin/create-region`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
          body: JSON.stringify({
            name: createRegionFormData.name,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Region created successfully!");
        setShowCreateRegionModal(false);
        setCreateRegionFormData({ name: "" }); // Reset form
        fetchData();
      } else {
        toast.error(data.message || "Failed to create region");
      }
    } catch (error) {
      toast.error(`Failed to create region: ${error}`);
    } finally {
      setIsCreatingRegion(false);
    }
  };

  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region);
    setEditRegionFormData({
      name: region.name,
    });
    setShowEditRegionModal(true);
  };

  const handleDeleteRegion = (region: Region) => {
    setSelectedRegion(region);
    setShowDeleteRegionModal(true);
  };

  const handleUpdateRegion = async () => {
    if (!selectedRegion) return;

    setIsUpdatingRegion(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/company-admin/edit-region/${selectedRegion.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
          body: JSON.stringify({
            name: editRegionFormData.name,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Region updated successfully!");
        setShowEditRegionModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to update region");
      }
    } catch (error) {
      toast.error(`Failed to update region: ${error}`);
    } finally {
      setIsUpdatingRegion(false);
    }
  };

  const confirmDeleteRegion = async () => {
    if (!selectedRegion) return;

    setIsDeletingRegion(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/company-admin/delete-region/${selectedRegion.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Region deleted successfully!");
        setShowDeleteRegionModal(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete region");
      }
    } catch (error) {
      toast.error(`Failed to delete region: ${error}`);
    } finally {
      setIsDeletingRegion(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on search term and filters
  const filteredUsers = users.filter((user) => {
    // Enhanced search term filter
    const searchMatch = searchTerm === "" ||
      (user.name || `${user.firstName} ${user.lastName}`)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.institution?.name && user.institution.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.roles && user.roles.some((roleObj: any) => {
        const roleName = roleObj.role?.name || roleObj.name || roleObj;
        return roleName.toLowerCase().includes(searchTerm.toLowerCase());
      }));

    // Status filter
    const statusMatch = statusFilter === "" || user.status === statusFilter;

    // Role filter
    const roleMatch = roleFilter === "" ||
      (user.roles && user.roles.some((roleObj: any) => {
        const roleName = roleObj.role?.name || roleObj.name || roleObj;
        return roleName === roleFilter;
      }));

    return searchMatch && statusMatch && roleMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Filter roles based on search term and filters
  const filteredRoles = roles.filter((role) => {
    // Enhanced role search filter
    const searchMatch = roleSearchTerm === "" ||
      role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(roleSearchTerm.toLowerCase())) ||
      (role.institution?.name && role.institution.name.toLowerCase().includes(roleSearchTerm.toLowerCase()));

    // Role status filter
    const statusMatch = roleStatusFilter === "" ||
      (roleStatusFilter === "active" && role.isActive) ||
      (roleStatusFilter === "inactive" && !role.isActive);

    return searchMatch && statusMatch;
  });

  // Role pagination calculations
  const totalRolePages = Math.ceil(filteredRoles.length / rolesPerPage);
  const indexOfLastRole = currentRolePage * rolesPerPage;
  const indexOfFirstRole = indexOfLastRole - rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstRole, indexOfLastRole);

  // Filter regions based on search term
  const filteredRegions = regions.filter((region) => {
    const searchMatch = regionSearchTerm === "" ||
      region.name.toLowerCase().includes(regionSearchTerm.toLowerCase()) ||
      (region.institution?.name && region.institution.name.toLowerCase().includes(regionSearchTerm.toLowerCase()));

    return searchMatch;
  });

  // Region pagination calculations
  const totalRegionPages = Math.ceil(filteredRegions.length / regionsPerPage);
  const indexOfLastRegion = currentRegionPage * regionsPerPage;
  const indexOfFirstRegion = indexOfLastRegion - regionsPerPage;
  const currentRegions = filteredRegions.slice(indexOfFirstRegion, indexOfLastRegion);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    setCurrentRolePage(1);
  }, [roleSearchTerm, roleStatusFilter]);

  useEffect(() => {
    setCurrentRegionPage(1);
  }, [regionSearchTerm]);

  // Chart data calculations
  const getUserStatusData = () => {
    const statusCounts = users.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#10B981', // Green for ACTIVE
          '#F59E0B', // Yellow for INACTIVE
          '#EF4444', // Red for SUSPENDED
          '#6B7280', // Gray for PENDING
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    };
  };

  const getUserRolesData = () => {
    const roleCounts = {} as Record<string, number>;
    users.forEach(user => {
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach((roleObj: any) => {
          const roleName = roleObj.role?.name || roleObj.name || roleObj;
          roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
        });
      }
    });

    const sortedRoles = Object.entries(roleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8); // Top 8 roles

    return {
      labels: sortedRoles.map(([name]) => name),
      datasets: [{
        label: 'Users with Role',
        data: sortedRoles.map(([,count]) => count),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
          '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    };
  };

  const getRoleStatusData = () => {
    const activeRoles = roles.filter(role => role.isActive).length;
    const inactiveRoles = roles.filter(role => !role.isActive).length;

    return {
      labels: ['Active', 'Inactive'],
      datasets: [{
        data: [activeRoles, inactiveRoles],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    };
  };

  const getUserGrowthData = () => {
    // Simulate user growth data by grouping users by creation date
    const growthData = users.reduce((acc, user) => {
      const month = new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedData = Object.entries(growthData).sort(([a], [b]) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    return {
      labels: sortedData.map(([month]) => month),
      datasets: [{
        label: 'New Users',
        data: sortedData.map(([,count]) => count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: {
          weight: 'bold' as const,
          size: 12,
        },
        formatter: (value: number, context: any) => {
          if (context.chart.config.type === 'pie') {
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value}\n(${percentage}%)`;
          }
          return value;
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      datalabels: {
        display: true,
        backgroundColor: '#3B82F6',
        borderColor: '#ffffff',
        borderRadius: 4,
        borderWidth: 1,
        color: '#ffffff',
        font: {
          weight: 'bold' as const,
          size: 10,
        },
        padding: 4,
        align: 'top' as const,
        anchor: 'end' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        anchor: 'center' as const,
        align: 'center' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) return <PageLoader />;

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
                  onClick={() => handleTabChange("dashboard")}
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
                  onClick={() => handleTabChange("users")}
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
                  onClick={() => handleTabChange("roles")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "roles" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Gear className="me-2" /> Roles
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "regions"}
                  onClick={() => handleTabChange("regions")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "regions" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <ShieldLock className="me-2" /> Regions
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10} className="p-4 bg-light content-area">
            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Grid3x3Gap className="text-primary" size={24} />
                        </div>
                        <div>
                          <h2 className="fw-bold text-dark mb-0">
                            Dashboard Overview
                          </h2>
                          <p className="text-muted mb-0 small">
                            Monitor your company's key metrics and performance
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Breadcrumb className="bg-light rounded-pill px-3 py-2 mb-0 small">
                        <Breadcrumb.Item
                          active
                          className="text-primary fw-semibold"
                        >
                          Dashboard
                        </Breadcrumb.Item>
                      </Breadcrumb>
                    </div>
                  </div>
                  <hr className="border-2 border-primary opacity-25 mb-4" />
                </div>

                {/* Quick Actions Section */}
                <Row className="mb-5">
                  <Col md={12} className="mb-4">
                    <h4 className="fw-bold text-dark mb-4 d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                        <Lightning className="text-warning" size={20} />
                      </div>
                      Quick Actions
                    </h4>
                  </Col>
                  {quickActions.map((action) => (
                    <Col md={4} lg={2} key={action.id} className="mb-3">
                      <Card
                        className="h-100 border-0 shadow-sm quick-action-card cursor-pointer"
                        onClick={action.action}
                        style={{ transition: 'all 0.3s ease' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <Card.Body className="text-center p-3">
                          <div className={`bg-${action.color} bg-opacity-10 rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center`} style={{ width: '50px', height: '50px' }}>
                            <span className={`text-${action.color}`}>{action.icon}</span>
                          </div>
                          <h6 className="fw-bold mb-2 text-dark">{action.title}</h6>
                          <small className="text-muted">{action.description}</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Enhanced KPI Cards */}
                <Row className="mb-5">
                  <Col md={12} className="mb-4">
                    <h4 className="fw-bold text-dark mb-4 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                        <Speedometer2 className="text-success" size={20} />
                      </div>
                      Key Performance Indicators
                    </h4>
                  </Col>

                  {/* Total Users Card */}
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="h-100 border-0 shadow-lg modern-kpi-card">
                      <Card.Body className="p-4 position-relative overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div className="bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                              <People className="text-primary" size={24} />
                            </div>
                            <h2 className="fw-bold text-dark mb-1">{stats.totalUsers}</h2>
                            <p className="text-muted mb-0 small">Total Users</p>
                          </div>
                          <Badge bg="primary" className="px-2 py-1 rounded-pill">
                            +{Math.floor(Math.random() * 10) + 1}%
                          </Badge>
                        </div>
                        <div className="d-flex align-items-center">
                          <GraphUp className="text-success me-2" size={16} />
                          <small className="text-success fw-semibold">Growing this month</small>
                        </div>
                        <div className="position-absolute" style={{ bottom: '-10px', right: '-10px', opacity: 0.1 }}>
                          <People size={80} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Active Users Card */}
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="h-100 border-0 shadow-lg modern-kpi-card">
                      <Card.Body className="p-4 position-relative overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div className="bg-success bg-opacity-10 rounded-circle p-3 mb-3">
                              <CheckCircle className="text-success" size={24} />
                            </div>
                            <h2 className="fw-bold text-dark mb-1">{stats.activeUsers}</h2>
                            <p className="text-muted mb-0 small">Active Users</p>
                          </div>
                          <Badge bg="success" className="px-2 py-1 rounded-pill">
                            {Math.floor((stats.activeUsers / stats.totalUsers) * 100)}%
                          </Badge>
                        </div>
                        <div className="d-flex align-items-center">
                          <CheckCircle className="text-success me-2" size={16} />
                          <small className="text-success fw-semibold">Healthy activity</small>
                        </div>
                        <div className="position-absolute" style={{ bottom: '-10px', right: '-10px', opacity: 0.1 }}>
                          <CheckCircle size={80} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Pending Approvals Card */}
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="h-100 border-0 shadow-lg modern-kpi-card">
                      <Card.Body className="p-4 position-relative overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div className="bg-warning bg-opacity-10 rounded-circle p-3 mb-3">
                              <Clock className="text-warning" size={24} />
                            </div>
                            <h2 className="fw-bold text-dark mb-1">{stats.pendingApprovals}</h2>
                            <p className="text-muted mb-0 small">Pending Actions</p>
                          </div>
                          <Badge bg="warning" className="px-2 py-1 rounded-pill">
                            Urgent
                          </Badge>
                        </div>
                        <div className="d-flex align-items-center">
                          <ExclamationTriangle className="text-warning me-2" size={16} />
                          <small className="text-warning fw-semibold">Requires attention</small>
                        </div>
                        <div className="position-absolute" style={{ bottom: '-10px', right: '-10px', opacity: 0.1 }}>
                          <Clock size={80} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                </Row>

                {/* System Overview & Activity Feed */}
                <Row className="mb-5">
                  {/* Recent Activity Feed */}
                  <Col md={6} className="mb-4">
                    <Card className="h-100 border-0 shadow-lg">
                      <Card.Header className="bg-light border-0 py-3">
                        <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <Activity className="me-2 text-primary" size={20} />
                          Recent Activity
                        </h5>
                      </Card.Header>
                      <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {recentActivity.map((activity) => (
                          <div key={activity.id} className="p-3 border-bottom d-flex align-items-start">
                            <div className="me-3 mt-1">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <h6 className="fw-semibold text-dark mb-1">{activity.action}</h6>
                                <small className="text-muted">{activity.timestamp}</small>
                              </div>
                              <p className="text-muted mb-1 small">{activity.details}</p>
                              <small className="text-primary fw-medium">by {activity.user}</small>
                            </div>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* System Notifications */}
                  <Col md={6} className="mb-4">
                    <Card className="h-100 border-0 shadow-lg">
                      <Card.Header className="bg-light border-0 py-3">
                        <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <Bell className="me-2 text-warning" size={20} />
                          System Notifications
                        </h5>
                      </Card.Header>
                      <Card.Body className="p-3">
                        <Alert variant="success" className="d-flex align-items-center mb-3">
                          <CheckCircle className="me-2" size={16} />
                          <div>
                            <strong>System Backup Complete</strong>
                            <br />
                            <small>Daily backup completed successfully at 3:00 AM</small>
                          </div>
                        </Alert>

                        <Alert variant="warning" className="d-flex align-items-center mb-3">
                          <ExclamationTriangle className="me-2" size={16} />
                          <div>
                            <strong>Pending User Approvals</strong>
                            <br />
                            <small>{stats.pendingApprovals} users waiting for approval</small>
                          </div>
                        </Alert>

                        <Alert variant="info" className="d-flex align-items-center mb-3">
                          <Calendar className="me-2" size={16} />
                          <div>
                            <strong>Monthly Reports Due</strong>
                            <br />
                            <small>Department budget reports due in 5 days</small>
                          </div>
                        </Alert>

                        <Alert variant="primary" className="d-flex align-items-center mb-0">
                          <Award className="me-2" size={16} />
                          <div>
                            <strong>System Performance</strong>
                            <br />
                            <small>All systems running smoothly</small>
                          </div>
                        </Alert>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Charts Section */}
                <Row className="mb-5">
                  <Col md={12} className="mb-4">
                    <h4 className="fw-bold text-dark mb-4 d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                        <StarFill className="text-info" size={20} />
                      </div>
                      Analytics & Insights
                    </h4>
                  </Col>

                  {/* User Analytics */}
                  <Col md={6} className="mb-4">
                    <Card className="shadow-lg border-0 h-100">
                      <Card.Header className="bg-light border-0 py-3">
                        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <People className="me-2 text-primary" size={18} />
                          User Status Distribution
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <div style={{ height: '300px' }}>
                          <Pie data={getUserStatusData()} options={chartOptions} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Card className="shadow-lg border-0 h-100">
                      <Card.Header className="bg-light border-0 py-3">
                        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <ShieldLock className="me-2 text-success" size={18} />
                          Role Status Distribution
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <div style={{ height: '300px' }}>
                          <Pie data={getRoleStatusData()} options={chartOptions} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* User Growth Chart */}
                  <Col md={12} className="mb-4">
                    <Card className="shadow-lg border-0">
                      <Card.Header className="bg-light border-0 py-3">
                        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <Grid3x3Gap className="me-2 text-info" size={18} />
                          User Growth Over Time
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <div style={{ height: '350px' }}>
                          <Line data={getUserGrowthData()} options={lineChartOptions} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Role Distribution Bar Chart */}
                  <Col md={12} className="mb-4">
                    <Card className="shadow-lg border-0">
                      <Card.Header className="bg-light border-0 py-3">
                        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <Gear className="me-2 text-warning" size={18} />
                          Top User Roles Distribution
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-4">
                        <div style={{ height: '350px' }}>
                          <Bar data={getUserRolesData()} options={barChartOptions} />
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
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                          <People className="text-success" size={24} />
                        </div>
                        <div>
                          <h2 className="fw-bold text-dark mb-0">
                            User Management
                          </h2>
                          <p className="text-muted mb-0 small">
                            Manage company users, roles and permissions
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Breadcrumb className="bg-light rounded-pill px-3 py-2 mb-0 small">
                        <Breadcrumb.Item
                          href="#"
                          onClick={() => handleTabChange("dashboard")}
                          className="text-decoration-none"
                        >
                          Dashboard
                        </Breadcrumb.Item>
                        <Breadcrumb.Item
                          active
                          className="text-success fw-semibold"
                        >
                          Users
                        </Breadcrumb.Item>
                      </Breadcrumb>
                    </div>
                  </div>
                  <hr className="border-2 border-success opacity-25 mb-4" />
                </div>

                <Card className="shadow-lg border-0 mb-4 modern-search-card">
                  <Card.Body className="p-4">
                    {/* Search and Add User Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                      <div className="search-container">
                        <InputGroup
                          style={{ width: "350px" }}
                          className="modern-search-group"
                        >
                          <InputGroup.Text className="bg-white border-end-0">
                            <Search className="text-primary" />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search users by name, email, phone, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-start-0 ps-0"
                          />
                        </InputGroup>
                      </div>
                      <AdminCreateUserModal
                        roles={roles}
                        onSuccess={() => {
                          fetchData();
                          setSearchTerm("");
                          handleTabChange("users");
                        }}
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="bg-light rounded-4 p-3 border-0">
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                            <Filter className="text-primary" size={14} />
                          </div>
                          <span className="text-dark fw-bold small text-uppercase letter-spacing">Filters</span>
                        </div>

                        {/* Status Filter */}
                        <div className="filter-group">
                          <label className="filter-label">Status</label>
                          <Form.Select
                            size="sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="modern-filter-select"
                          >
                            <option value="">All Status</option>
                            <option value="ACTIVE">🟢 Active</option>
                            <option value="INACTIVE">🟡 Inactive</option>
                            <option value="SUSPENDED">🔴 Suspended</option>
                            <option value="PENDING">⏳ Pending</option>
                          </Form.Select>
                        </div>

                        {/* Role Filter */}
                        <div className="filter-group">
                          <label className="filter-label">Role</label>
                          <Form.Select
                            size="sm"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="modern-filter-select"
                          >
                            <option value="">All Roles</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.name}>
                                🛡️ {role.name}
                              </option>
                            ))}
                          </Form.Select>
                        </div>

                        {/* Clear Filters & Results */}
                        <div className="d-flex align-items-center gap-2 ms-auto">
                          {/* Active Filter Count */}
                          {(statusFilter || roleFilter) && (
                            <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold">
                              📊 {filteredUsers.length} results
                            </Badge>
                          )}

                          {/* Clear Filters */}
                          {(statusFilter || roleFilter) && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                setStatusFilter("");
                                setRoleFilter("");
                              }}
                              className="rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
                            >
                              <X size={14} />
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
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
                            filteredUsers.filter(
                              (u) => u.status === UserStatus.ACTIVE
                            ).length
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
                              Name
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Email
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Phone
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Roles
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
                          {currentUsers.map((user, idx) => (
                            <tr key={user.id} className="border-bottom">
                              <td className="py-3 px-4">
                                <span className="fw-semibold text-primary">
                                  {indexOfFirstUser + idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="bg-primary bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                    style={{ width: "30px", height: "30px" }}
                                  >
                                    <PersonCircle
                                      className="text-primary"
                                      size={15}
                                    />
                                  </div>
                                  <div className="text-muted">
                                    {user.name ||
                                      `${user.firstName} ${user.lastName}`}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-muted fw-medium">
                                  {user.email}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <small className="text-muted fw-medium">
                                  {user.phone || "N/A"}
                                </small>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex flex-wrap gap-1">
                                  {user.roles && user.roles.length > 0 ? (
                                    user.roles.map(
                                      (roleObj: any, index: number) => {
                                        const roleName =
                                          roleObj.role?.name ||
                                          roleObj.name ||
                                          roleObj;
                                        const initials = roleName
                                          .split(" ")
                                          .map((word: string) =>
                                            word.charAt(0).toUpperCase()
                                          )
                                          .join("");
                                        return (
                                          <small
                                            key={index}
                                            className="px-2 py-0 rounded-pill small bg-success bg-opacity-10 border text-success fw-bold"
                                            title={roleName}
                                          >
                                            {initials}
                                          </small>
                                        );
                                      }
                                    )
                                  ) : (
                                    <small className="text-muted small">
                                      No roles
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  bg={
                                    user.status === UserStatus.ACTIVE
                                      ? "success"
                                      : user.status === UserStatus.INACTIVE
                                      ? "warning"
                                      : "secondary"
                                  }
                                  className="px-3 py-1 rounded-pill fw-medium"
                                >
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="rounded-pill px-3 py-1 fw-medium"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowUserModal(true);
                                    }}
                                    title="View Details"
                                  >
                                    <Eye size={14} className="me-1" />
                                    View
                                  </Button>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <Card className="shadow-sm border-0 mt-3">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Pagination Info */}
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted small">
                            Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                          </span>
                          <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                            Page {currentPage} of {totalPages}
                          </Badge>
                        </div>

                        {/* Pagination Controls */}
                        <Pagination className="mb-0">
                          <Pagination.First
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          />
                          <Pagination.Prev
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          />

                          {/* Page Numbers */}
                          {(() => {
                            const pages = [];
                            const startPage = Math.max(1, currentPage - 2);
                            const endPage = Math.min(totalPages, currentPage + 2);

                            if (startPage > 1) {
                              pages.push(
                                <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
                                  1
                                </Pagination.Item>
                              );
                              if (startPage > 2) {
                                pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
                              }
                            }

                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Pagination.Item
                                  key={i}
                                  active={i === currentPage}
                                  onClick={() => setCurrentPage(i)}
                                >
                                  {i}
                                </Pagination.Item>
                              );
                            }

                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
                              }
                              pages.push(
                                <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
                                  {totalPages}
                                </Pagination.Item>
                              );
                            }

                            return pages;
                          })()}

                          <Pagination.Next
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          />
                          <Pagination.Last
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                          />
                        </Pagination>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}

            {/* Roles Tab */}
            {activeTab === "roles" && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                          <Gear className="text-warning" size={24} />
                        </div>
                        <div>
                          <h2 className="fw-bold text-dark mb-0">
                            Role Management
                          </h2>
                          <p className="text-muted mb-0 small">
                            Configure roles and access permissions for your
                            organization
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Breadcrumb className="bg-light rounded-pill px-3 py-2 mb-0 small">
                        <Breadcrumb.Item
                          href="#"
                          onClick={() => handleTabChange("dashboard")}
                          className="text-decoration-none"
                        >
                          Dashboard
                        </Breadcrumb.Item>
                        <Breadcrumb.Item
                          active
                          className="text-warning fw-semibold"
                        >
                          Roles
                        </Breadcrumb.Item>
                      </Breadcrumb>
                    </div>
                  </div>
                  <hr className="border-2 border-warning opacity-25 mb-4" />
                </div>

                <Card className="shadow-lg border-0 mb-4 modern-search-card">
                  <Card.Body className="p-4">
                    {/* Search and Add Role Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                      <div className="search-container">
                        <InputGroup
                          style={{ width: "350px" }}
                          className="modern-search-group"
                        >
                          <InputGroup.Text className="bg-white border-end-0">
                            <Search className="text-primary" />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search roles by name, description..."
                            value={roleSearchTerm}
                            onChange={(e) => setRoleSearchTerm(e.target.value)}
                            className="border-start-0 ps-0"
                          />
                        </InputGroup>
                      </div>
                      <RoleCreationModal
                        onSuccess={() => {
                          fetchData();
                        }}
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="bg-light rounded-4 p-3 border-0">
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-warning bg-opacity-10 p-2 rounded-circle">
                            <Filter className="text-warning" size={14} />
                          </div>
                          <span className="text-dark fw-bold small text-uppercase letter-spacing">Filters</span>
                        </div>

                        {/* Status Filter */}
                        <div className="filter-group">
                          <label className="filter-label">Status</label>
                          <Form.Select
                            size="sm"
                            value={roleStatusFilter}
                            onChange={(e) => setRoleStatusFilter(e.target.value)}
                            className="modern-filter-select"
                          >
                            <option value="">All Status</option>
                            <option value="active">🟢 Active</option>
                            <option value="inactive">🔴 Inactive</option>
                          </Form.Select>
                        </div>

                        {/* Clear Filters & Results */}
                        <div className="d-flex align-items-center gap-2 ms-auto">
                          {/* Active Filter Count */}
                          {roleStatusFilter && (
                            <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold">
                              📊 {filteredRoles.length} results
                            </Badge>
                          )}

                          {/* Clear Filters */}
                          {roleStatusFilter && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                setRoleStatusFilter("");
                              }}
                              className="rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
                            >
                              <X size={14} />
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
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
                              Role Name
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Description
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Institution
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Created By
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
                          {currentRoles.map((role, idx) => (
                            <tr key={role.id} className="border-bottom">
                              <td className="py-3 px-4">
                                <span className="fw-semibold text-primary">
                                  {indexOfFirstRole + idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="bg-success bg-opacity-10 rounded-circle me-3 d-flex align-items-center justify-content-center"
                                    style={{ width: "35px", height: "35px" }}
                                  >
                                    <Gear className="text-success" size={18} />
                                  </div>
                                  <div className="fw-semibold text-dark">
                                    {role.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-muted fw-medium" title={role.description || "No description"}>
                                  {role.description
                                    ? role.description.length > 30
                                      ? `${role.description.substring(0, 30)}...`
                                      : role.description
                                    : "No description"
                                  }
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="fw-medium text-dark">
                                  {role.institution?.name || "N/A"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <small className="text-muted fw-medium">
                                  User #{role.createdBy || "System"}
                                </small>
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
                                    size="sm"
                                    variant="outline-warning"
                                    className="rounded-pill px-3 py-1 fw-medium"
                                    onClick={() => {
                                      setSelectedRole(role);
                                      setShowRoleModal(true);
                                    }}
                                    title="View Details"
                                  >
                                    <Eye size={14} className="me-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-primary bg-opacity-10 text-primary"
                                    title="Edit Role"
                                    onClick={() => handleEditRole(role)}
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-danger bg-opacity-10 text-danger"
                                    title="Delete Role"
                                    onClick={() => handleDeleteRole(role)}
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

                {/* Role Pagination */}
                {totalRolePages > 1 && (
                  <Card className="shadow-sm border-0 mt-3">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Pagination Info */}
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted small">
                            Showing {indexOfFirstRole + 1}-{Math.min(indexOfLastRole, filteredRoles.length)} of {filteredRoles.length} roles
                          </span>
                          <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                            Page {currentRolePage} of {totalRolePages}
                          </Badge>
                        </div>

                        {/* Pagination Controls */}
                        <Pagination className="mb-0">
                          <Pagination.First
                            onClick={() => setCurrentRolePage(1)}
                            disabled={currentRolePage === 1}
                          />
                          <Pagination.Prev
                            onClick={() => setCurrentRolePage(prev => Math.max(1, prev - 1))}
                            disabled={currentRolePage === 1}
                          />

                          {/* Page Numbers */}
                          {(() => {
                            const pages = [];
                            const startPage = Math.max(1, currentRolePage - 2);
                            const endPage = Math.min(totalRolePages, currentRolePage + 2);

                            if (startPage > 1) {
                              pages.push(
                                <Pagination.Item key={1} onClick={() => setCurrentRolePage(1)}>
                                  1
                                </Pagination.Item>
                              );
                              if (startPage > 2) {
                                pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
                              }
                            }

                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Pagination.Item
                                  key={i}
                                  active={i === currentRolePage}
                                  onClick={() => setCurrentRolePage(i)}
                                >
                                  {i}
                                </Pagination.Item>
                              );
                            }

                            if (endPage < totalRolePages) {
                              if (endPage < totalRolePages - 1) {
                                pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
                              }
                              pages.push(
                                <Pagination.Item key={totalRolePages} onClick={() => setCurrentRolePage(totalRolePages)}>
                                  {totalRolePages}
                                </Pagination.Item>
                              );
                            }

                            return pages;
                          })()}

                          <Pagination.Next
                            onClick={() => setCurrentRolePage(prev => Math.min(totalRolePages, prev + 1))}
                            disabled={currentRolePage === totalRolePages}
                          />
                          <Pagination.Last
                            onClick={() => setCurrentRolePage(totalRolePages)}
                            disabled={currentRolePage === totalRolePages}
                          />
                        </Pagination>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}

            {/* Regions Tab */}
            {activeTab === "regions" && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                          <ShieldLock className="text-warning" size={24} />
                        </div>
                        <div>
                          <h2 className="fw-bold text-dark mb-0">
                            Region Management
                          </h2>
                          <p className="text-muted mb-0 small">
                            Manage company regions and locations
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Breadcrumb className="bg-light rounded-pill px-3 py-2 mb-0 small">
                        <Breadcrumb.Item
                          href="#"
                          onClick={() => handleTabChange("dashboard")}
                          className="text-decoration-none"
                        >
                          Dashboard
                        </Breadcrumb.Item>
                        <Breadcrumb.Item
                          active
                          className="text-warning fw-semibold"
                        >
                          Regions
                        </Breadcrumb.Item>
                      </Breadcrumb>
                    </div>
                  </div>
                  <hr className="border-2 border-warning opacity-25 mb-4" />
                </div>

                <Card className="shadow-lg border-0 mb-4 modern-search-card">
                  <Card.Body className="p-4">
                    {/* Search and Add Region Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                      <div className="search-container">
                        <InputGroup
                          style={{ width: "350px" }}
                          className="modern-search-group"
                        >
                          <InputGroup.Text className="bg-white border-end-0">
                            <Search className="text-primary" />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search regions by name..."
                            value={regionSearchTerm}
                            onChange={(e) => setRegionSearchTerm(e.target.value)}
                            className="border-start-0 ps-0"
                          />
                        </InputGroup>
                      </div>
                      <Button
                        variant="warning"
                        className="px-4 py-2 rounded-pill fw-medium shadow-sm"
                        onClick={() => setShowCreateRegionModal(true)}
                      >
                        <ShieldLock size={16} className="me-2" />
                        Add Region
                      </Button>
                    </div>

                    {/* Filters Row */}
                    <div className="bg-light rounded-4 p-3 border-0">
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-warning bg-opacity-10 p-2 rounded-circle">
                            <Filter className="text-warning" size={14} />
                          </div>
                          <span className="text-dark fw-bold small text-uppercase letter-spacing">Filters</span>
                        </div>

                        {/* No filters for regions, but keep the structure */}
                        <div className="d-flex align-items-center gap-2 ms-auto">
                          <Badge bg="info" className="px-3 py-2 rounded-pill fw-semibold">
                            📊 {filteredRegions.length} regions
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="shadow-lg border-0 modern-table-card">
                  <Card.Header className="bg-light border-0 py-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                          <ShieldLock className="text-warning" size={20} />
                        </div>
                        <div>
                          <h5 className="mb-0 fw-bold text-dark">
                            Region Management
                          </h5>
                          <small className="text-muted">
                            Manage company regions and locations
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge
                          bg="primary"
                          className="px-3 py-2 rounded-pill fw-medium"
                        >
                          {regions.length} Regions
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
                              Region Name
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Institution
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                              Created At
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentRegions.map((region, index) => (
                            <tr key={region.id}>
                              <td className="py-3 px-4 text-muted fw-medium">
                                {indexOfFirstRegion + index + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                                    <ShieldLock className="text-warning" size={18} />
                                  </div>
                                  <div className="fw-semibold text-dark">
                                    {region.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="fw-medium text-dark">
                                  {region.institution?.name || "N/A"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <small className="text-muted fw-medium">
                                  {new Date(region.createdAt).toLocaleDateString()}
                                </small>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-primary bg-opacity-10 text-primary"
                                    title="Edit Region"
                                    onClick={() => handleEditRegion(region)}
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="modern-action-btn border-0 bg-danger bg-opacity-10 text-danger"
                                    title="Delete Region"
                                    onClick={() => handleDeleteRegion(region)}
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

                {/* Region Pagination */}
                {totalRegionPages > 1 && (
                  <Card className="shadow-sm border-0 mt-3">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Pagination Info */}
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted small">
                            Showing {indexOfFirstRegion + 1}-{Math.min(indexOfLastRegion, filteredRegions.length)} of {filteredRegions.length} regions
                          </span>
                          <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                            Page {currentRegionPage} of {totalRegionPages}
                          </Badge>
                        </div>

                        {/* Pagination Controls */}
                        <Pagination className="mb-0">
                          <Pagination.First
                            onClick={() => setCurrentRegionPage(1)}
                            disabled={currentRegionPage === 1}
                          />
                          <Pagination.Prev
                            onClick={() => setCurrentRegionPage(prev => Math.max(1, prev - 1))}
                            disabled={currentRegionPage === 1}
                          />

                          {(() => {
                            const pages = [];
                            const maxVisible = 5;
                            let startPage = Math.max(1, currentRegionPage - Math.floor(maxVisible / 2));
                            let endPage = Math.min(totalRegionPages, startPage + maxVisible - 1);

                            if (endPage - startPage < maxVisible - 1) {
                              startPage = Math.max(1, endPage - maxVisible + 1);
                            }

                            if (startPage > 1) {
                              pages.push(
                                <Pagination.Item key={1} onClick={() => setCurrentRegionPage(1)}>
                                  1
                                </Pagination.Item>
                              );
                              if (startPage > 2) {
                                pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
                              }
                            }

                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Pagination.Item
                                  key={i}
                                  active={i === currentRegionPage}
                                  onClick={() => setCurrentRegionPage(i)}
                                >
                                  {i}
                                </Pagination.Item>
                              );
                            }

                            if (endPage < totalRegionPages) {
                              if (endPage < totalRegionPages - 1) {
                                pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
                              }
                              pages.push(
                                <Pagination.Item key={totalRegionPages} onClick={() => setCurrentRegionPage(totalRegionPages)}>
                                  {totalRegionPages}
                                </Pagination.Item>
                              );
                            }

                            return pages;
                          })()}

                          <Pagination.Next
                            onClick={() => setCurrentRegionPage(prev => Math.min(totalRegionPages, prev + 1))}
                            disabled={currentRegionPage === totalRegionPages}
                          />
                          <Pagination.Last
                            onClick={() => setCurrentRegionPage(totalRegionPages)}
                            disabled={currentRegionPage === totalRegionPages}
                          />
                        </Pagination>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}


          </Col>
        </Row>

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

          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            min-width: 140px;
          }

          .filter-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }

          .modern-filter-select {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            background: white;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .modern-filter-select:focus {
            border-color: #06b6d4;
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
            transform: translateY(-1px);
          }

          .modern-filter-select:hover:not(:focus) {
            border-color: #d1d5db;
            background: #fafafa;
          }

          .letter-spacing {
            letter-spacing: 0.75px;
          }

          .quick-action-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 16px;
            overflow: hidden;
          }

          .quick-action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          .modern-kpi-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 16px;
            overflow: hidden;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          }

          .modern-kpi-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
          }

          .report-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          .quick-action-card:active {
            animation: pulse 0.3s ease;
          }

          .activity-item {
            transition: all 0.2s ease;
            border-radius: 8px;
          }

          .activity-item:hover {
            background: #f8f9fa;
            transform: translateX(5px);
          }

          .kpi-icon {
            transition: all 0.3s ease;
          }

          .modern-kpi-card:hover .kpi-icon {
            transform: scale(1.1);
          }

          .progress {
            border-radius: 10px;
            overflow: hidden;
          }

          .progress-bar {
            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
            transition: width 0.6s ease;
          }

          /* Enhanced responsive design */
          @media (max-width: 768px) {
            .sidebar {
              position: fixed;
              left: -100%;
              transition: left 0.3s ease;
              z-index: 1000;
              width: 280px;
            }

            .sidebar.show {
              left: 0;
            }

            .content-area {
              margin-left: 0;
            }

            .quick-action-card {
              margin-bottom: 1rem;
            }

            .modern-kpi-card {
              margin-bottom: 1.5rem;
            }

            .table-responsive {
              font-size: 0.875rem;
            }
          }

          @media (max-width: 576px) {
            .modern-search-group {
              width: 100% !important;
            }

            .filter-group {
              min-width: 120px;
            }

            .d-flex.gap-3 {
              flex-direction: column;
              gap: 1rem !important;
            }
          }
        `}</style>
      </Container>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        show={showUserModal}
        onHide={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      />

      {/* Role Details Modal */}
      <RoleDetailsModal
        role={selectedRole}
        show={showRoleModal}
        onHide={() => {
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
      />

      {/* Edit User Modal */}
      <Modal
        show={showEditUserModal}
        onHide={() => setShowEditUserModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-15 p-3 rounded-circle">
              <Pencil size={24} className="text-primary" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">Edit User</h5>
              <small className="text-muted">
                Update user information and permissions
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Row className="g-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    First Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter first name"
                    value={editUserFormData.firstName}
                    onChange={(e) =>
                      setEditUserFormData({
                        ...editUserFormData,
                        firstName: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Last Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter last name"
                    value={editUserFormData.lastName}
                    onChange={(e) =>
                      setEditUserFormData({
                        ...editUserFormData,
                        lastName: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Email Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="user@company.com"
                    value={editUserFormData.email}
                    onChange={(e) =>
                      setEditUserFormData({
                        ...editUserFormData,
                        email: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Phone Number
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={editUserFormData.phone}
                    onChange={(e) =>
                      setEditUserFormData({
                        ...editUserFormData,
                        phone: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Status <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={editUserFormData.status}
                    onChange={(e) =>
                      setEditUserFormData({
                        ...editUserFormData,
                        status: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <option value="">Select status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INVITED">Invited</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Roles <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    multiple
                    value={editUserFormData.roles.map(String)}
                    onChange={(e) => {
                      const selectedOptions = Array.from(
                        e.target.selectedOptions,
                        (option) => parseInt(option.value)
                      );
                      setEditUserFormData({
                        ...editUserFormData,
                        roles: selectedOptions,
                      });
                    }}
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                      minHeight: "120px",
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted small">
                    Hold Ctrl/Cmd to select multiple roles
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => setShowEditUserModal(false)}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isUpdatingUser}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateUser}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isUpdatingUser}
          >
            {isUpdatingUser ? (
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

      {/* Delete User Modal */}
      <Modal
        show={showDeleteUserModal}
        onHide={() => setShowDeleteUserModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-danger bg-opacity-10 border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-15 p-3 rounded-circle">
              <Trash size={24} className="text-danger" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold text-danger">Delete User</h5>
              <small className="text-muted">
                This action cannot be undone
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="alert alert-danger d-flex align-items-start gap-3 border-0 shadow-sm">
            <div className="bg-danger bg-opacity-15 p-2 rounded-circle flex-shrink-0">
              <ExclamationTriangle size={24} className="text-danger" />
            </div>
            <div>
              <h6 className="fw-bold mb-2">Warning: Permanent Action</h6>
              <p className="mb-0 text-muted">
                Are you sure you want to delete this user? This will permanently
                remove the user from the system and cannot be reversed.
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="mt-4 p-4 bg-light rounded-3">
              <h6 className="fw-bold mb-3 text-dark">User Details:</h6>
              <Row className="g-3">
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <People size={18} className="text-primary" />
                    <div>
                      <small className="text-muted d-block">Name</small>
                      <span className="fw-semibold">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Envelope size={18} className="text-info" />
                    <div>
                      <small className="text-muted d-block">Email</small>
                      <span className="fw-semibold">{selectedUser.email}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Telephone size={18} className="text-success" />
                    <div>
                      <small className="text-muted d-block">Phone</small>
                      <span className="fw-semibold">
                        {selectedUser.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Gear size={18} className="text-warning" />
                    <div>
                      <small className="text-muted d-block">Status</small>
                      <Badge
                        bg={
                          selectedUser.status === "ACTIVE"
                            ? "success"
                            : selectedUser.status === "INACTIVE"
                            ? "warning"
                            : "secondary"
                        }
                        className="px-2 py-1"
                      >
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteUserModal(false)}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isDeletingUser}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDeleteUser}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isDeletingUser}
          >
            {isDeletingUser ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash size={16} className="me-2" />
                Yes, Delete User
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        show={showEditRoleModal}
        onHide={() => setShowEditRoleModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-15 p-3 rounded-circle">
              <Gear size={24} className="text-success" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">Edit Role</h5>
              <small className="text-muted">
                Update role information and permissions
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Row className="g-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Role Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter role name (e.g., Manager, Finance Officer)"
                    value={editRoleFormData.role}
                    onChange={(e) =>
                      setEditRoleFormData({
                        ...editRoleFormData,
                        role: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Describe the role's responsibilities and permissions..."
                    value={editRoleFormData.description}
                    onChange={(e) =>
                      setEditRoleFormData({
                        ...editRoleFormData,
                        description: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => setShowEditRoleModal(false)}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isUpdatingRole}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleUpdateRole}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isUpdatingRole}
          >
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
              <>
                <Gear size={16} className="me-2" />
                Update Role
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Role Modal */}
      <Modal
        show={showDeleteRoleModal}
        onHide={() => setShowDeleteRoleModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-danger bg-opacity-10 border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-15 p-3 rounded-circle">
              <Trash size={24} className="text-danger" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold text-danger">Delete Role</h5>
              <small className="text-muted">
                This action cannot be undone
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="alert alert-danger d-flex align-items-start gap-3 border-0 shadow-sm">
            <div className="bg-danger bg-opacity-15 p-2 rounded-circle flex-shrink-0">
              <ExclamationTriangle size={24} className="text-danger" />
            </div>
            <div>
              <h6 className="fw-bold mb-2">Warning: Permanent Action</h6>
              <p className="mb-0 text-muted">
                Are you sure you want to delete this role? This will permanently
                remove the role from the system and may affect users assigned to
                this role.
              </p>
            </div>
          </div>

          {selectedRole && (
            <div className="mt-4 p-4 bg-light rounded-3">
              <h6 className="fw-bold mb-3 text-dark">Role Details:</h6>
              <Row className="g-3">
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Gear size={18} className="text-success" />
                    <div>
                      <small className="text-muted d-block">Role Name</small>
                      <span className="fw-semibold">{selectedRole.name}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <ShieldLock size={18} className="text-primary" />
                    <div>
                      <small className="text-muted d-block">Status</small>
                      <Badge
                        bg={selectedRole.isActive ? "success" : "secondary"}
                        className="px-2 py-1"
                      >
                        {selectedRole.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="d-flex align-items-start gap-2">
                    <FileText size={18} className="text-info mt-1" />
                    <div>
                      <small className="text-muted d-block">Description</small>
                      <span className="fw-semibold">
                        {selectedRole.description || "No description available"}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteRoleModal(false)}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isDeletingRole}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDeleteRole}
            className="px-4 py-2 rounded-pill fw-medium"
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
              <>
                <Trash size={16} className="me-2" />
                Yes, Delete Role
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Region Modal */}
      <Modal
        show={showCreateRegionModal}
        onHide={() => {
          setShowCreateRegionModal(false);
          setCreateRegionFormData({ name: "" });
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-15 p-3 rounded-circle">
              <ShieldLock size={24} className="text-warning" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">Create New Region</h5>
              <small className="text-muted">
                Add a new region to your company
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Row className="g-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Region Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter region name (e.g., North America, Europe, Asia-Pacific)"
                    value={createRegionFormData.name}
                    onChange={(e) =>
                      setCreateRegionFormData({
                        ...createRegionFormData,
                        name: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                  <Form.Text className="text-muted small">
                    Enter a descriptive name for the region (e.g., headquarters location, branch office)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowCreateRegionModal(false);
              setCreateRegionFormData({ name: "" });
            }}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isCreatingRegion}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleCreateRegion}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isCreatingRegion}
          >
            {isCreatingRegion ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Creating...
              </>
            ) : (
              <>
                <ShieldLock size={16} className="me-2" />
                Create Region
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Region Modal */}
      <Modal
        show={showEditRegionModal}
        onHide={() => setShowEditRegionModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-15 p-3 rounded-circle">
              <ShieldLock size={24} className="text-warning" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">Edit Region</h5>
              <small className="text-muted">
                Update region information
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Row className="g-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Region Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter region name (e.g., North America, Europe, Asia-Pacific)"
                    value={editRegionFormData.name}
                    onChange={(e) =>
                      setEditRegionFormData({
                        ...editRegionFormData,
                        name: e.target.value,
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => setShowEditRegionModal(false)}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isUpdatingRegion}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleUpdateRegion}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isUpdatingRegion}
          >
            {isUpdatingRegion ? (
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
                <ShieldLock size={16} className="me-2" />
                Update Region
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Region Modal */}
      <Modal
        show={showDeleteRegionModal}
        onHide={() => setShowDeleteRegionModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-danger bg-opacity-10 border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-15 p-3 rounded-circle">
              <Trash size={24} className="text-danger" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold text-danger">Delete Region</h5>
              <small className="text-muted">
                This action cannot be undone
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="alert alert-danger d-flex align-items-start gap-3 border-0 shadow-sm">
            <div className="bg-danger bg-opacity-15 p-2 rounded-circle flex-shrink-0">
              <ExclamationTriangle size={24} className="text-danger" />
            </div>
            <div>
              <h6 className="fw-bold mb-2">Warning: Permanent Action</h6>
              <p className="mb-0 text-muted">
                Are you sure you want to delete this region? This will permanently
                remove the region from the system. This action cannot be reversed.
                The region cannot be deleted if it has active users or departments.
              </p>
            </div>
          </div>

          {selectedRegion && (
            <div className="mt-4 p-4 bg-light rounded-3">
              <h6 className="fw-bold mb-3 text-dark">Region Details:</h6>
              <Row className="g-3">
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <ShieldLock size={18} className="text-warning" />
                    <div>
                      <small className="text-muted d-block">Region Name</small>
                      <span className="fw-semibold">{selectedRegion.name}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <FileText size={18} className="text-info" />
                    <div>
                      <small className="text-muted d-block">Institution</small>
                      <span className="fw-semibold">
                        {selectedRegion.institution?.name || "N/A"}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-success" />
                    <div>
                      <small className="text-muted d-block">Created At</small>
                      <span className="fw-semibold">
                        {new Date(selectedRegion.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-4">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteRegionModal(false)}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isDeletingRegion}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDeleteRegion}
            className="px-4 py-2 rounded-pill fw-medium"
            disabled={isDeletingRegion}
          >
            {isDeletingRegion ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash size={16} className="me-2" />
                Yes, Delete Region
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AuthProvider>
  );
}
