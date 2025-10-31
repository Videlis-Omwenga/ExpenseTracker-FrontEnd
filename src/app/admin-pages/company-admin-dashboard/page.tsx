"use client";

import { useEffect, useState, Suspense } from "react";
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
  Eye,
  Filter,
  X,
  ShieldLock,
  Lightning,
  Activity,
  Calendar,
  ExclamationTriangle,
  Upload,
  Trash,
  Envelope,
  Telephone,
  FileText,
  InfoCircle as Info,
} from "react-bootstrap-icons";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import AdminCreateUserModal from "@/app/components/modals/admin-create-user-modal";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { hasRole } from "@/app/utils/roleGuard";
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

interface ApprovalHierarchy {
  id: number;
  name: string;
  hierarchyId?: number;
  createdAt?: string;
  updatedAt?: string;
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
  hierarchies?: ApprovalHierarchy[];
  hierarchyRoles?: {
    hierarchy: {
      id: number;
      name: string;
    };
  }[];
  hierarchyAssignments?: {
    hierarchy: {
      id: number;
      name: string;
    };
    hierarchyLevel: {
      id: number;
      order: number;
    };
    order: number;
  }[];
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
  regionId?: number | null;
  region?: {
    id: number;
    name: string;
  } | null;
  pageId?: number | null;
  page?: {
    id: number;
    name: string;
    description?: string;
  } | null;
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
  id?: number;
  userId?: number;
  roleId?: number;
  role?: {
    id: number;
    name: string;
  };
  name?: string;
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

interface Page {
  id: number;
  name: string;
  description?: string;
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role-based access control
  useEffect(() => {
    const checkAccess = () => {
      if (!hasRole("Company admin")) {
        toast.error("You don't have permission to access this page");
        router.push("/unauthorized");
      }
    };

    checkAccess();
  }, [router]);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [editUserFormData, setEditUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "",
    regionId: 0,
    roles: [] as number[],
    hierarchies: [] as number[],
    departmentRestrictions: {} as Record<number, number[]>, // hierarchyId -> departmentIds[]
  });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [editRoleFormData, setEditRoleFormData] = useState({
    role: "",
    description: "",
    regionId: 0,
    pageId: 0,
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
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showCreateRegionModal, setShowCreateRegionModal] = useState(false);
  const [showEditRegionModal, setShowEditRegionModal] = useState(false);

  // Approval Hierarchy States (Simplified - just names)
  const [approvalHierarchies, setApprovalHierarchies] = useState<ApprovalHierarchy[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showCreateHierarchyModal, setShowCreateHierarchyModal] = useState(false);
  const [showEditHierarchyModal, setShowEditHierarchyModal] = useState(false);
  const [showDeleteHierarchyModal, setShowDeleteHierarchyModal] = useState(false);
  const [selectedHierarchy, setSelectedHierarchy] = useState<ApprovalHierarchy | null>(null);
  const [hierarchyFormData, setHierarchyFormData] = useState({
    name: "",
  });
  const [isCreatingHierarchy, setIsCreatingHierarchy] = useState(false);
  const [isUpdatingHierarchy, setIsUpdatingHierarchy] = useState(false);
  const [isDeletingHierarchy, setIsDeletingHierarchy] = useState(false);
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
        toast.info('System settings coming soon');
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

        setDepartments(data.getDepartments || []);

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

  // Fetch Approval Hierarchies (Simple names only)
  const fetchApprovalHierarchies = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/approval-hierarchy/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setApprovalHierarchies(data);
      } else {
        toast.error(`Failed to fetch hierarchies: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to fetch hierarchies:", error);
    }
  };

  // User CRUD Handlers
  const handleEditUser = (user: User) => {
    // Extract role IDs - try roleId first (from backend), then fall back to role.id
    const roleIds = user.roles?.map((r: UserRole) =>
      r.roleId || r.role?.id
    ).filter((id): id is number => id !== undefined) || [];

    // Extract hierarchy IDs from HierarchyRoles
    const hierarchyIds = (user as any).HierarchyRoles?.map((hr: any) => hr.hierarchy.id) || [];

    // Extract department restrictions grouped by hierarchyId
    const departmentRestrictions: Record<number, number[]> = {};
    const deptRestrictions = (user as any).departmentsRestrictedTo || [];

    for (const restriction of deptRestrictions) {
      const hierarchyId = restriction.hierarchyAssignment?.hierarchy?.id;
      const departmentId = restriction.department?.id;

      if (hierarchyId && departmentId) {
        if (!departmentRestrictions[hierarchyId]) {
          departmentRestrictions[hierarchyId] = [];
        }
        if (!departmentRestrictions[hierarchyId].includes(departmentId)) {
          departmentRestrictions[hierarchyId].push(departmentId);
        }
      }
    }

    setSelectedUser(user);
    setEditUserFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      status: user.status || "",
      regionId: user.regionId || 0,
      roles: roleIds,
      hierarchies: hierarchyIds,
      departmentRestrictions: departmentRestrictions,
    });
    setShowEditUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdatingUser(true);
    try {
      // Ensure roles and hierarchies are arrays of numbers
      const payload = {
        ...editUserFormData,
        roles: editUserFormData.roles.length > 0
          ? editUserFormData.roles.filter((r): r is number => typeof r === 'number')
          : undefined,
        // Always send hierarchies array, even if empty, to ensure proper deletion
        hierarchies: editUserFormData.hierarchies.filter((h): h is number => typeof h === 'number'),
        departmentRestrictions: editUserFormData.departmentRestrictions,
      };

      const response = await fetch(
        `${BASE_API_URL}/company-admin/edit-user/${selectedUser.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const hierarchiesCount = data.HierarchyRoles?.length || 0;
        const rolesCount = data.roles?.length || 0;
        toast.success(`User updated successfully! ${rolesCount} role(s) and ${hierarchiesCount} hierarchy/hierarchies assigned.`);
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
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditRoleFormData({
      role: role.name || "",
      description: role.description || "",
      regionId: role.regionId || 0,
      pageId: role.pageId || 0,
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

  const fetchPages = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/company-admin/get-pages`, {
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
        setPages(data);
      } else {
        toast.error(data.message || "Failed to fetch pages");
      }
    } catch (error) {
      toast.error(`Failed to fetch pages: ${error}`);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPages();
    fetchApprovalHierarchies();
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
      (user.roles && user.roles.some((roleObj: UserRole) => {
        const roleName = roleObj.role?.name || roleObj.name || '';
        return roleName.toLowerCase().includes(searchTerm.toLowerCase());
      }));

    // Status filter
    const statusMatch = statusFilter === "" || user.status === statusFilter;

    // Role filter
    const roleMatch = roleFilter === "" ||
      (user.roles && user.roles.some((roleObj: UserRole) => {
        const roleName = roleObj.role?.name || roleObj.name || '';
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
        user.roles.forEach((roleObj: UserRole) => {
          const roleName = roleObj.role?.name || roleObj.name || '';
          if (roleName) {
            roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
          }
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "approval-hierarchy"}
                  onClick={() => handleTabChange("approval-hierarchy")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "approval-hierarchy" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Activity className="me-2" /> Approval Hierarchy
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10} className="p-4 content-area" style={{ backgroundColor: '#f8f9fa' }}>
            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="position-relative">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 shadow-sm" 
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: '#0d6efd'
                          }}
                        >
                          <Grid3x3Gap className="text-white" size={28} />
                        </div>
                        <div 
                          className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" 
                          style={{ width: '16px', height: '16px' }}
                        />
                      </div>
                      <div className="ms-3">
                        <h5 className="fw-bold text-dark mb-1" >
                          Dashboard Overview
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                          <i className="bi bi-graph-up me-1"></i>
                          Monitor your company&apos;s key metrics and performance
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white rounded-pill px-4 py-2 shadow-sm border">
                        <small className="text-primary fw-semibold">
                          <i className="bi bi-house-fill me-1"></i>
                          Dashboard
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Section */}
                <div className="mb-5">
                  <div className="d-flex align-items-center mb-5 mt-5">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-3 me-3 bg-warning" 
                      style={{ 
                        width: '42px', 
                        height: '42px'
                      }}
                    >
                      <Lightning className="text-white" size={20} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Quick Actions</h6>
                      <small className="text-muted">Perform common tasks quickly</small>
                    </div>
                  </div>
                  <Row className="g-3">
                    {quickActions.map((action) => (
                      <Col md={4} lg={2} key={action.id}>
                        <Card
                          className="h-100 border-0 shadow-sm quick-action-card cursor-pointer overflow-hidden"
                          onClick={action.action}
                          style={{ 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                          }}
                        >
                          <div 
                            className={`w-100 py-1 bg-${action.color}`} 
                            style={{ height: '4px' }}
                          />
                          <Card.Body className="text-center p-4">
                            <div 
                              className={`bg-${action.color} bg-opacity-10 rounded-3 mx-auto mb-3 d-flex align-items-center justify-content-center`} 
                              style={{ 
                                width: '60px', 
                                height: '60px',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <span className={`text-${action.color}`} style={{ fontSize: '24px' }}>{action.icon}</span>
                            </div>
                            <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '0.9rem' }}>{action.title}</h6>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                              {action.description}
                            </small>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* Charts Section */}
                <div className="mb-5">
                  <div className="d-flex align-items-center mb-4">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-3 me-3 bg-info" 
                      style={{ 
                        width: '42px', 
                        height: '42px'
                      }}
                    >
                      <StarFill className="text-white" size={20} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Analytics & Insights</h6>
                      <small className="text-muted">Visualize your data trends and patterns</small>
                    </div>
                  </div>

                  <Row className="g-4">
                    {/* User Analytics */}
                    <Col md={6}>
                      <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Card.Header className="bg-white border-0 py-3 px-4">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div 
                                className="bg-primary bg-opacity-10 rounded-3 p-2 me-2"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <People className="text-primary" size={20} />
                              </div>
                              <div>
                                <h6 className="fw-bold text-dark mb-0">User Status Distribution</h6>
                                <small className="text-muted">Active vs Inactive users</small>
                              </div>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div style={{ height: '300px' }}>
                            <Pie data={getUserStatusData()} options={chartOptions} />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Card.Header className="bg-white border-0 py-3 px-4">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div 
                                className="bg-success bg-opacity-10 rounded-3 p-2 me-2"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <ShieldLock className="text-success" size={20} />
                              </div>
                              <div>
                                <h6 className="fw-bold text-dark mb-0">Role Status Distribution</h6>
                                <small className="text-muted">Active vs Inactive roles</small>
                              </div>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div style={{ height: '300px' }}>
                            <Pie data={getRoleStatusData()} options={chartOptions} />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* User Growth Chart */}
                    <Col md={12}>
                      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Card.Header className="bg-white border-0 py-3 px-4">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div 
                                className="bg-info bg-opacity-10 rounded-3 p-2 me-2"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <Grid3x3Gap className="text-info" size={20} />
                              </div>
                              <div>
                                <h6 className="fw-bold text-dark mb-0">User Growth Over Time</h6>
                                <small className="text-muted">Track user registration trends</small>
                              </div>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div style={{ height: '350px' }}>
                            <Line data={getUserGrowthData()} options={lineChartOptions} />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Role Distribution Bar Chart */}
                    <Col md={12}>
                      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <Card.Header className="bg-white border-0 py-3 px-4">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div 
                                className="bg-warning bg-opacity-10 rounded-3 p-2 me-2"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <Gear className="text-warning" size={20} />
                              </div>
                              <div>
                                <h6 className="fw-bold text-dark mb-0">Top User Roles Distribution</h6>
                                <small className="text-muted">Most assigned roles in the system</small>
                              </div>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <div style={{ height: '350px' }}>
                            <Bar data={getUserRolesData()} options={barChartOptions} />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="position-relative">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 shadow-sm bg-success" 
                          style={{ 
                            width: '60px', 
                            height: '60px'
                          }}
                        >
                          <People className="text-white" size={28} />
                        </div>
                        <div 
                          className="position-absolute bottom-0 end-0 bg-primary rounded-circle border border-2 border-white" 
                          style={{ width: '16px', height: '16px' }}
                        />
                      </div>
                      <div className="ms-3">
                        <h5 className="fw-bold text-dark mb-1" >
                          User Management
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                          <i className="bi bi-people me-1"></i>
                          Manage company users, roles and permissions
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white rounded-pill px-3 py-2 shadow-sm border">
                        <small 
                          className="text-muted text-decoration-none" 
                          onClick={() => handleTabChange("dashboard")}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-house me-1"></i>
                          Dashboard
                        </small>
                        <span className="mx-2 text-muted">/</span>
                        <small className="text-success fw-semibold">Users</small>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    {/* Search and Add User Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                      <div className="position-relative" style={{ width: "400px" }}>
                        <InputGroup className="border rounded-pill overflow-hidden shadow-sm">
                          <InputGroup.Text className="bg-white border-0 ps-4">
                            <Search className="text-primary" size={18} />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search users by name, email, phone, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-0 shadow-none"
                            style={{ fontSize: '0.95rem' }}
                          />
                        </InputGroup>
                      </div>
                      <AdminCreateUserModal
                        roles={roles}
                        regions={regions}
                        hierarchies={approvalHierarchies}
                        onSuccess={() => {
                          fetchData();
                          setSearchTerm("");
                          handleTabChange("users");
                        }}
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="bg-light rounded-4 p-4 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-3 bg-primary" 
                            style={{ 
                              width: '32px', 
                              height: '32px'
                            }}
                          >
                            <Filter className="text-white" size={16} />
                          </div>
                          <span className="text-dark fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Filters</span>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="text-muted mb-1 d-block" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Status</label>
                          <Form.Select
                            size="sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border-0 shadow-sm rounded-pill px-3"
                            style={{ minWidth: '150px', fontSize: '0.85rem' }}
                          >
                            <option value="">All Status</option>
                            <option value="ACTIVE">🟢 Active</option>
                            <option value="INACTIVE">🟡 Inactive</option>
                            <option value="SUSPENDED">🔴 Suspended</option>
                            <option value="PENDING">⏳ Pending</option>
                          </Form.Select>
                        </div>

                        {/* Role Filter */}
                        <div>
                          <label className="text-muted mb-1 d-block" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Role</label>
                          <Form.Select
                            size="sm"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="border-0 shadow-sm rounded-pill px-3"
                            style={{ minWidth: '150px', fontSize: '0.85rem' }}
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
                            <Badge 
                              bg="success" 
                              className="px-4 py-2 rounded-pill fw-semibold shadow-sm"
                              style={{ fontSize: '0.85rem' }}
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              {filteredUsers.length} results
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
                              className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold border-2"
                              style={{ fontSize: '0.85rem' }}
                            >
                              <X size={16} />
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <Card.Header className="bg-white border-0 py-4 px-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 me-3 bg-primary" 
                          style={{ 
                            width: '48px', 
                            height: '48px'
                          }}
                        >
                          <People className="text-white" size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">
                            User Directory
                          </h6>
                          <small className="text-muted">
                            Manage all system users and permissions
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="px-4 py-2 rounded-pill fw-semibold text-white shadow-sm bg-primary"
                        >
                          <i className="bi bi-people-fill me-2"></i>
                          {filteredUsers.length} Users
                        </div>
                        <div 
                          className="px-4 py-2 rounded-pill fw-semibold text-white shadow-sm bg-success"
                        >
                          <i className="bi bi-check-circle-fill me-2"></i>
                          {filteredUsers.filter((u) => u.status === UserStatus.ACTIVE).length} Active
                        </div>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table className="mb-0 align-middle" hover>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              #
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Name
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Email
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Phone
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Roles
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Status
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase text-center" style={{ fontSize: '0.75rem' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentUsers.map((user, idx) => (
                            <tr key={user.id} className="border-bottom" style={{ transition: 'background-color 0.2s' }}>
                              <td className="py-3 px-4">
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10"
                                  style={{ width: '32px', height: '32px' }}
                                >
                                  <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                    {indexOfFirstUser + idx + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="d-flex align-items-center justify-content-center rounded-circle me-3 bg-primary"
                                    style={{ 
                                      width: "40px", 
                                      height: "40px"
                                    }}
                                  >
                                    <PersonCircle className="text-white" size={20} />
                                  </div>
                                  <div>
                                    <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                                      {user.name || `${user.firstName} ${user.lastName}`}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                  <i className="bi bi-envelope me-1"></i>
                                  {user.email}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                  <i className="bi bi-telephone me-1"></i>
                                  {user.phone || "N/A"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex flex-wrap gap-1">
                                  {user.roles && user.roles.length > 0 ? (
                                    user.roles.map(
                                      (roleObj: UserRole, index: number) => {
                                        const roleName =
                                          roleObj.role?.name ||
                                          roleObj.name ||
                                          '';
                                        const initials = roleName
                                          .split(" ")
                                          .map((word: string) =>
                                            word.charAt(0).toUpperCase()
                                          )
                                          .join("");
                                        return (
                                          <div
                                            key={index}
                                            className="px-3 py-1 rounded-pill bg-success bg-opacity-10 border border-success border-opacity-25"
                                            title={roleName}
                                            style={{ fontSize: '0.8rem' }}
                                          >
                                            <span className="text-success fw-bold">{initials}</span>
                                          </div>
                                        );
                                      }
                                    )
                                  ) : (
                                    <small className="text-muted">
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
                                  className="px-3 py-2 rounded-pill fw-semibold shadow-sm"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {user.status === UserStatus.ACTIVE && "🟢 "}
                                  {user.status === UserStatus.INACTIVE && "🟡 "}
                                  {user.status}
                                </Badge>
                              </td>
                              <td className="text-center py-3 px-4">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="rounded-pill px-3 py-2 fw-semibold border-2"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowUserModal(true);
                                    }}
                                    title="View Details"
                                    style={{ fontSize: '0.8rem' }}
                                  >
                                    <Eye size={14} className="me-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-circle border-0 p-2 bg-primary"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px'
                                    }}
                                    title="Edit User"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Pencil className="text-white" size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-circle border-0 p-2 bg-danger"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px'
                                    }}
                                    title="Delete User"
                                    onClick={() => handleDeleteUser(user)}
                                  >
                                    <Trash className="text-white" size={14} />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '16px' }}>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Pagination Info */}
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-info-circle text-primary"></i>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                              Showing <span className="fw-bold text-dark">{indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="fw-bold text-dark">{filteredUsers.length}</span> users
                            </span>
                          </div>
                          <div 
                            className="px-3 py-2 rounded-pill text-white fw-semibold shadow-sm bg-primary"
                            style={{ fontSize: '0.85rem' }}
                          >
                            Page {currentPage} of {totalPages}
                          </div>
                        </div>

                        {/* Pagination Controls */}
                        <Pagination className="mb-0">
                          <Pagination.First
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="rounded-circle"
                          />
                          <Pagination.Prev
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="rounded-circle"
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
                            className="rounded-circle"
                          />
                          <Pagination.Last
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="rounded-circle"
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
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="position-relative">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 shadow-sm bg-warning" 
                          style={{ 
                            width: '60px', 
                            height: '60px'
                          }}
                        >
                          <Gear className="text-white" size={28} />
                        </div>
                        <div 
                          className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white" 
                          style={{ width: '16px', height: '16px' }}
                        />
                      </div>
                      <div className="ms-3">
                        <h5 className="fw-bold text-dark mb-1" >
                          Role Management
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                          <i className="bi bi-shield-lock me-1"></i>
                          Configure roles and access permissions for your organization
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white rounded-pill px-3 py-2 shadow-sm border">
                        <small 
                          className="text-muted text-decoration-none" 
                          onClick={() => handleTabChange("dashboard")}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-house me-1"></i>
                          Dashboard
                        </small>
                        <span className="mx-2 text-muted">/</span>
                        <small className="text-warning fw-semibold">Roles</small>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    {/* Search and Add Role Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                      <div className="position-relative" style={{ width: "400px" }}>
                        <InputGroup className="border rounded-pill overflow-hidden shadow-sm">
                          <InputGroup.Text className="bg-white border-0 ps-4">
                            <Search className="text-primary" size={18} />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search roles by name, description..."
                            value={roleSearchTerm}
                            onChange={(e) => setRoleSearchTerm(e.target.value)}
                            className="border-0 shadow-none"
                            style={{ fontSize: '0.95rem' }}
                          />
                        </InputGroup>
                      </div>
                      <RoleCreationModal
                        regions={regions}
                        pages={pages}
                        onSuccess={() => {
                          fetchData();
                        }}
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="bg-light rounded-4 p-4 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-3 bg-warning" 
                            style={{ 
                              width: '32px', 
                              height: '32px'
                            }}
                          >
                            <Filter className="text-white" size={16} />
                          </div>
                          <span className="text-dark fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Filters</span>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="text-muted mb-1 d-block" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Status</label>
                          <Form.Select
                            size="sm"
                            value={roleStatusFilter}
                            onChange={(e) => setRoleStatusFilter(e.target.value)}
                            className="border-0 shadow-sm rounded-pill px-3"
                            style={{ minWidth: '150px', fontSize: '0.85rem' }}
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
                            <Badge 
                              bg="success" 
                              className="px-4 py-2 rounded-pill fw-semibold shadow-sm"
                              style={{ fontSize: '0.85rem' }}
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              {filteredRoles.length} results
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
                              className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold border-2"
                              style={{ fontSize: '0.85rem' }}
                            >
                              <X size={16} />
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <Card.Header className="bg-white border-0 py-4 px-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 me-3 bg-warning" 
                          style={{ 
                            width: '48px', 
                            height: '48px'
                          }}
                        >
                          <Gear className="text-white" size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">
                            Role Directory
                          </h6>
                          <small className="text-muted">
                            Manage system roles and permissions
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="px-4 py-2 rounded-pill fw-semibold text-white shadow-sm bg-primary"
                        >
                          <i className="bi bi-shield-fill me-2"></i>
                          {roles.length} Roles
                        </div>
                        <div 
                          className="px-4 py-2 rounded-pill fw-semibold text-white shadow-sm bg-success"
                        >
                          <i className="bi bi-check-circle-fill me-2"></i>
                          {roles.filter((r) => r.isActive).length} Active
                        </div>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table className="mb-0 align-middle" hover>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              #
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Role Name
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Description
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Region
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Page
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Institution
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Created By
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Status
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase text-center" style={{ fontSize: '0.75rem' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentRoles.map((role, idx) => (
                            <tr key={role.id} className="border-bottom" style={{ transition: 'background-color 0.2s' }}>
                              <td className="py-3 px-4">
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded-circle bg-warning"
                                  style={{ 
                                    width: '32px', 
                                    height: '32px',
                                    opacity: '0.15'
                                  }}
                                >
                                  <span className="fw-bold text-dark" style={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                                    {indexOfFirstRole + idx + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div
                                    className="d-flex align-items-center justify-content-center rounded-circle me-3 bg-warning"
                                    style={{ 
                                      width: "42px", 
                                      height: "42px"
                                    }}
                                  >
                                    <Gear className="text-white" size={20} />
                                  </div>
                                  <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                                    {role.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-muted" style={{ fontSize: '0.9rem' }} title={role.description || "No description"}>
                                  {role.description
                                    ? role.description.length > 30
                                      ? `${role.description.substring(0, 30)}...`
                                      : role.description
                                    : <em className="text-muted">No description</em>
                                  }
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div 
                                  className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm d-inline-block bg-warning"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  <i className="bi bi-geo-alt-fill me-1"></i>
                                  {role.region?.name || regions.find(r => r.id === role.regionId)?.name || "No Region"}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div 
                                  className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm d-inline-block bg-info"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  <i className="bi bi-file-text-fill me-1"></i>
                                  {role.page?.name || pages.find(p => p.id === role.pageId)?.name || "No Page"}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-dark" style={{ fontSize: '0.9rem' }}>
                                  <i className="bi bi-building me-1 text-muted"></i>
                                  {role.institution?.name || <em className="text-muted">N/A</em>}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                                  <i className="bi bi-person-circle me-1"></i>
                                  User #{role.createdBy || "System"}
                                </small>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  bg={role.isActive ? "success" : "secondary"}
                                  className="px-3 py-2 rounded-pill fw-semibold shadow-sm"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {role.isActive ? "🟢 Active" : "🔴 Inactive"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    size="sm"
                                    className="rounded-pill px-3 py-2 fw-semibold border-2 bg-white text-dark border"
                                    onClick={() => {
                                      setSelectedRole(role);
                                      setShowRoleModal(true);
                                    }}
                                    title="View Details"
                                    style={{ fontSize: '0.8rem' }}
                                  >
                                    <Eye size={14} className="me-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-circle border-0 p-2 bg-primary"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px'
                                    }}
                                    title="Edit Role"
                                    onClick={() => handleEditRole(role)}
                                  >
                                    <Pencil className="text-white" size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-circle border-0 p-2 bg-danger"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px'
                                    }}
                                    title="Delete Role"
                                    onClick={() => handleDeleteRole(role)}
                                  >
                                    <Trash className="text-white" size={14} />
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
                  <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '16px' }}>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Pagination Info */}
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-info-circle text-primary"></i>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                              Showing <span className="fw-bold text-dark">{indexOfFirstRole + 1}-{Math.min(indexOfLastRole, filteredRoles.length)}</span> of <span className="fw-bold text-dark">{filteredRoles.length}</span> roles
                            </span>
                          </div>
                          <div 
                            className="px-3 py-2 rounded-pill text-white fw-semibold shadow-sm bg-warning"
                            style={{ fontSize: '0.85rem' }}
                          >
                            Page {currentRolePage} of {totalRolePages}
                          </div>
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
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="position-relative">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 shadow-sm bg-danger" 
                          style={{ 
                            width: '60px', 
                            height: '60px'
                          }}
                        >
                          <ShieldLock className="text-white" size={28} />
                        </div>
                        <div 
                          className="position-absolute bottom-0 end-0 bg-info rounded-circle border border-2 border-white" 
                          style={{ width: '16px', height: '16px' }}
                        />
                      </div>
                      <div className="ms-3">
                        <h5 className="fw-bold text-dark mb-1" >
                          Region Management
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                          <i className="bi bi-geo-alt me-1"></i>
                          Manage company regions and locations
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white rounded-pill px-3 py-2 shadow-sm border">
                        <small 
                          className="text-muted text-decoration-none" 
                          onClick={() => handleTabChange("dashboard")}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-house me-1"></i>
                          Dashboard
                        </small>
                        <span className="mx-2 text-muted">/</span>
                        <small className="text-danger fw-semibold">Regions</small>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    {/* Search and Add Region Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                      <div className="position-relative" style={{ width: "400px" }}>
                        <InputGroup className="border rounded-pill overflow-hidden shadow-sm">
                          <InputGroup.Text className="bg-white border-0 ps-4">
                            <Search className="text-primary" size={18} />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search regions by name..."
                            value={regionSearchTerm}
                            onChange={(e) => setRegionSearchTerm(e.target.value)}
                            className="border-0 shadow-none"
                            style={{ fontSize: '0.95rem' }}
                          />
                        </InputGroup>
                      </div>
                      <Button
                        className="px-4 py-2 rounded-pill fw-semibold shadow-sm border-0 bg-danger text-white"
                        onClick={() => setShowCreateRegionModal(true)}
                      >
                        <ShieldLock size={16} className="me-2" />
                        Add Region
                      </Button>
                    </div>

                    {/* Info Row */}
                    <div className="bg-light rounded-4 p-4 border-0" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-3 bg-danger" 
                            style={{ 
                              width: '32px', 
                              height: '32px'
                            }}
                          >
                            <i className="bi bi-info-circle text-white" style={{ fontSize: '16px' }}></i>
                          </div>
                          <span className="text-dark fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Region Overview</span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <Badge 
                            className="px-4 py-2 rounded-pill fw-semibold shadow-sm text-white bg-info"
                            style={{ fontSize: '0.85rem' }}
                          >
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            {filteredRegions.length} regions
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <Card.Header className="bg-white border-0 py-4 px-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 me-3 bg-danger" 
                          style={{ 
                            width: '48px', 
                            height: '48px'
                          }}
                        >
                          <ShieldLock className="text-white" size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">
                            Regional Directory
                          </h6>
                          <small className="text-muted">
                            Manage company regions and locations
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="px-4 py-2 rounded-pill fw-semibold text-white shadow-sm bg-primary"
                        >
                          <i className="bi bi-pin-map-fill me-2"></i>
                          {regions.length} Regions
                        </div>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table className="mb-0 align-middle" hover>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              #
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Region Name
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Institution
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                              Created At
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase text-center" style={{ fontSize: '0.75rem' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentRegions.map((region, index) => (
                            <tr key={region.id} className="border-bottom" style={{ transition: 'background-color 0.2s' }}>
                              <td className="py-3 px-4">
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded-circle bg-danger"
                                  style={{ 
                                    width: '32px', 
                                    height: '32px',
                                    opacity: '0.15'
                                  }}
                                >
                                  <span className="fw-bold text-dark" style={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                                    {indexOfFirstRegion + index + 1}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="d-flex align-items-center justify-content-center rounded-circle me-3 bg-danger"
                                    style={{ 
                                      width: "42px", 
                                      height: "42px"
                                    }}
                                  >
                                    <ShieldLock className="text-white" size={20} />
                                  </div>
                                  <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                                    <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                                    {region.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-dark" style={{ fontSize: '0.9rem' }}>
                                  <i className="bi bi-building me-1 text-muted"></i>
                                  {region.institution?.name || <em className="text-muted">N/A</em>}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                  <i className="bi bi-calendar-event me-1"></i>
                                  {new Date(region.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Button
                                    size="sm"
                                    className="rounded-circle border-0 p-2 bg-primary"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px'
                                    }}
                                    title="Edit Region"
                                    onClick={() => handleEditRegion(region)}
                                  >
                                    <Pencil className="text-white" size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-circle border-0 p-2 bg-danger"
                                    style={{ 
                                      width: '32px', 
                                      height: '32px'
                                    }}
                                    title="Delete Region"
                                    onClick={() => handleDeleteRegion(region)}
                                  >
                                    <Trash className="text-white" size={14} />
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
                  <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '16px' }}>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        {/* Pagination Info */}
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-info-circle text-primary"></i>
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                              Showing <span className="fw-bold text-dark">{indexOfFirstRegion + 1}-{Math.min(indexOfLastRegion, filteredRegions.length)}</span> of <span className="fw-bold text-dark">{filteredRegions.length}</span> regions
                            </span>
                          </div>
                          <div 
                            className="px-3 py-2 rounded-pill text-white fw-semibold shadow-sm bg-danger"
                            style={{ fontSize: '0.85rem' }}
                          >
                            Page {currentRegionPage} of {totalRegionPages}
                          </div>
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
                            const endPage = Math.min(totalRegionPages, startPage + maxVisible - 1);

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

            {/* Approval Hierarchy Section */}
            {activeTab === "approval-hierarchy" && (
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="position-relative">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 shadow-sm bg-success" 
                          style={{ 
                            width: '60px', 
                            height: '60px'
                          }}
                        >
                          <Activity className="text-white" size={28} />
                        </div>
                        <div 
                          className="position-absolute bottom-0 end-0 bg-warning rounded-circle border border-2 border-white" 
                          style={{ width: '16px', height: '16px' }}
                        />
                      </div>
                      <div className="ms-3">
                        <h5 className="fw-bold text-dark mb-1" >
                          Approval Hierarchy Management
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                          <i className="bi bi-diagram-3 me-1"></i>
                          Configure expense approval workflows and hierarchies
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white rounded-pill px-3 py-2 shadow-sm border">
                        <small 
                          className="text-muted text-decoration-none" 
                          onClick={() => handleTabChange("dashboard")}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-house me-1"></i>
                          Dashboard
                        </small>
                        <span className="mx-2 text-muted">/</span>
                        <small className="text-success fw-semibold">Approval Hierarchy</small>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-2 fw-bold text-dark">
                          <i className="bi bi-diagram-3-fill me-2 text-success"></i>
                          Approval Workflows
                        </h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                          Create and manage approval hierarchies for expense submissions
                        </p>
                      </div>
                      <Button
                        className="px-4 py-2 rounded-pill fw-semibold shadow-sm border-0 bg-success text-white"
                        onClick={() => setShowCreateHierarchyModal(true)}
                      >
                        <Activity size={16} className="me-2" />
                        Create Hierarchy
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <Card.Header className="bg-white border-0 py-4 px-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-3 me-3 bg-success" 
                          style={{ 
                            width: '48px', 
                            height: '48px'
                          }}
                        >
                          <Activity className="text-white" size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">
                            Configured Hierarchies
                          </h6>
                          <p className="text-muted mb-0 small">
                            <i className="bi bi-stack me-1"></i>
                            {approvalHierarchies.length} approval workflow{approvalHierarchies.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {approvalHierarchies.length === 0 ? (
                      <div className="text-center py-5 px-4">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4 bg-success"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            opacity: '0.1'
                          }}
                        >
                          <Activity size={48} className="text-success" style={{ position: 'relative', zIndex: 1, opacity: 1 }} />
                        </div>
                        <h5 className="text-dark fw-bold mb-2">No approval hierarchies created</h5>
                        <p className="text-muted mb-4">
                          Create your first approval hierarchy to start managing expense approvals
                        </p>
                        <Button
                          className="px-4 py-2 rounded-pill fw-semibold shadow-sm border-0 bg-success text-white"
                          onClick={() => setShowCreateHierarchyModal(true)}
                        >
                          <Activity size={16} className="me-2" />
                          Create First Hierarchy
                        </Button>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="mb-0 align-middle" hover>
                          <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                                Hierarchy Name
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                                Created Date
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                                Type
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                                Status
                              </th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase text-end" style={{ fontSize: '0.75rem' }}>
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {approvalHierarchies.map((hierarchy) => (
                              <tr key={hierarchy.id} className="border-bottom" style={{ transition: 'background-color 0.2s' }}>
                                <td className="py-3 px-4">
                                  <div className="d-flex align-items-center">
                                    <div 
                                      className="d-flex align-items-center justify-content-center rounded-circle me-3 bg-success"
                                      style={{ 
                                        width: "40px", 
                                        height: "40px"
                                      }}
                                    >
                                      <Activity className="text-white" size={18} />
                                    </div>
                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                                      {hierarchy.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    <i className="bi bi-calendar-event me-1"></i>
                                    {hierarchy.createdAt ? new Date(hierarchy.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    }) : <em>N/A</em>}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div 
                                    className="px-3 py-2 rounded-pill fw-semibold text-white shadow-sm d-inline-block bg-info"
                                    style={{ fontSize: '0.8rem' }}
                                  >
                                    <i className="bi bi-diagram-2 me-1"></i>
                                    Hierarchy Level
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    className="px-3 py-2 rounded-pill fw-semibold shadow-sm text-white bg-success"
                                    style={{ fontSize: '0.8rem' }}
                                  >
                                    🟢 Active
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-end">
                                  <div className="d-flex justify-content-end gap-2">
                                    <Button
                                      size="sm"
                                      className="rounded-circle border-0 p-2 bg-warning"
                                      style={{ 
                                        width: '32px', 
                                        height: '32px'
                                      }}
                                      onClick={() => {
                                        setSelectedHierarchy(hierarchy);
                                        setHierarchyFormData({ name: hierarchy.name });
                                        setShowEditHierarchyModal(true);
                                      }}
                                      title="Edit Hierarchy"
                                    >
                                      <Pencil className="text-white" size={14} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="rounded-circle border-0 p-2 bg-danger"
                                      style={{ 
                                        width: '32px', 
                                        height: '32px'
                                      }}
                                      onClick={() => {
                                        setSelectedHierarchy(hierarchy);
                                        setShowDeleteHierarchyModal(true);
                                      }}
                                      title="Delete Hierarchy"
                                    >
                                      <Trash className="text-white" size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

          </Col>
        </Row>

        {/* Create Hierarchy Modal (Simplified - Name Only) */}
        <Modal
          show={showCreateHierarchyModal}
          onHide={() => {
            setShowCreateHierarchyModal(false);
            setHierarchyFormData({ name: "" });
          }}
        >
          <Modal.Header closeButton className="bg-success bg-opacity-10">
            <Modal.Title>
              <Activity className="me-2" />
              Create Hierarchy Name
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <Info size={16} className="me-2" />
              Create a hierarchy name here. You will assign approval levels in the Workflows section.
            </Alert>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Hierarchy Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Department Head Approval, Manager Review, Regional Director"
                  value={hierarchyFormData.name}
                  onChange={(e) =>
                    setHierarchyFormData({ ...hierarchyFormData, name: e.target.value })
                  }
                  required
                />
                <Form.Text className="text-muted">
                  Enter a descriptive name for this hierarchy level
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateHierarchyModal(false);
                setHierarchyFormData({ name: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={async () => {
                if (!hierarchyFormData.name.trim()) {
                  toast.error("Please provide a hierarchy name");
                  return;
                }

                setIsCreatingHierarchy(true);
                try {
                  const response = await fetch(`${BASE_API_URL}/approval-hierarchy/create`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
                    },
                    body: JSON.stringify({ name: hierarchyFormData.name }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    toast.success("Hierarchy created successfully!");
                    setShowCreateHierarchyModal(false);
                    setHierarchyFormData({ name: "" });
                    fetchApprovalHierarchies();
                  } else {
                    toast.error(data.message || "Failed to create hierarchy");
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to create hierarchy");
                } finally {
                  setIsCreatingHierarchy(false);
                }
              }}
              disabled={isCreatingHierarchy}
            >
              {isCreatingHierarchy ? "Creating..." : "Create Hierarchy"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Hierarchy Modal */}
        <Modal
          show={showEditHierarchyModal}
          onHide={() => {
            setShowEditHierarchyModal(false);
            setSelectedHierarchy(null);
            setHierarchyFormData({ name: "" });
          }}
        >
          <Modal.Header closeButton className="bg-primary bg-opacity-10">
            <Modal.Title>
              <Pencil className="me-2" />
              Edit Hierarchy Name
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Hierarchy Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Department Head Approval"
                  value={hierarchyFormData.name}
                  onChange={(e) =>
                    setHierarchyFormData({ ...hierarchyFormData, name: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditHierarchyModal(false);
                setSelectedHierarchy(null);
                setHierarchyFormData({ name: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!hierarchyFormData.name.trim() || !selectedHierarchy) {
                  toast.error("Please provide a hierarchy name");
                  return;
                }

                setIsUpdatingHierarchy(true);
                try {
                  const response = await fetch(
                    `${BASE_API_URL}/approval-hierarchy/update/${selectedHierarchy.id}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
                      },
                      body: JSON.stringify({ name: hierarchyFormData.name }),
                    }
                  );

                  const data = await response.json();

                  if (response.ok) {
                    toast.success("Hierarchy updated successfully!");
                    setShowEditHierarchyModal(false);
                    setSelectedHierarchy(null);
                    setHierarchyFormData({ name: "" });
                    fetchApprovalHierarchies();
                  } else {
                    toast.error(data.message || "Failed to update hierarchy");
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to update hierarchy");
                } finally {
                  setIsUpdatingHierarchy(false);
                }
              }}
              disabled={isUpdatingHierarchy}
            >
              {isUpdatingHierarchy ? "Updating..." : "Update Hierarchy"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Hierarchy Modal */}
        <Modal
          show={showDeleteHierarchyModal}
          onHide={() => {
            setShowDeleteHierarchyModal(false);
            setSelectedHierarchy(null);
          }}
        >
          <Modal.Header closeButton className="bg-danger bg-opacity-10">
            <Modal.Title>
              <Trash className="me-2" />
              Delete Hierarchy
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="danger" className="mb-3">
              <ExclamationTriangle className="me-2" />
              Are you sure you want to delete this hierarchy? This action cannot be undone.
            </Alert>
            {selectedHierarchy && (
              <p className="mb-0">
                <strong>Hierarchy:</strong> {selectedHierarchy.name}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteHierarchyModal(false);
                setSelectedHierarchy(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!selectedHierarchy) return;

                setIsDeletingHierarchy(true);
                try {
                  const response = await fetch(
                    `${BASE_API_URL}/approval-hierarchy/${selectedHierarchy.id}`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
                      },
                    }
                  );

                  const data = await response.json();

                  if (response.ok) {
                    toast.success("Hierarchy deleted successfully!");
                    setShowDeleteHierarchyModal(false);
                    setSelectedHierarchy(null);
                    fetchApprovalHierarchies();
                  } else {
                    toast.error(data.message || "Failed to delete hierarchy");
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to delete hierarchy");
                } finally {
                  setIsDeletingHierarchy(false);
                }
              }}
              disabled={isDeletingHierarchy}
            >
              {isDeletingHierarchy ? "Deleting..." : "Delete Hierarchy"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Custom CSS */}
        <style jsx global>{`
          .admin-dashboard {
            font-family: "Inter", "Segoe UI", Tahoma, Geneva, Verdana,
              sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
          }

          .sidebar {
            background: #ffffff;
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
            background: #e9ecef !important;
            color: #3b82f6 !important;
            transform: translateX(8px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }

          .active-nav-link {
            background: #0d6efd !important;
            color: #ffffff !important;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            transform: translateX(8px);
          }

          .content-area {
            background: #f8f9fa;
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
            background: #cfe2ff;
          }

          .stat-body-gradient-green {
            background: #d1e7dd;
          }

          .stat-body-gradient-orange {
            background: #ffe5d0;
          }

          .stat-body-gradient-cyan {
            background: #cff4fc;
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
            background: rgba(255, 255, 255, 0.2);
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
            background: #f8f9fa;
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
            background: #ffffff;
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
            background: #ffc107;
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
        centered
      >
        <Modal.Header
          closeButton
          className="border-0 pb-3 pt-4 px-4"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '0'
          }}
        >
          <div className="d-flex align-items-center w-100">
            <div
              className="icon-wrapper bg-white bg-opacity-20 me-3 rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "56px", height: "56px" }}
            >
              <Pencil size={26} className="text-white" />
            </div>
            <div>
              <h5 className="fw-bold text-white mb-1">Edit User</h5>
              <p className="text-white text-opacity-90 mb-0 small">
                Update user information and permissions
              </p>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Form>
            <Row className="g-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-person-fill text-primary"></i>
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
                    className="rounded-3 border-0 shadow-sm"
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.95rem",
                      backgroundColor: '#ffffff'
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-person-fill text-primary"></i>
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
                    className="rounded-3 border-0 shadow-sm"
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.95rem",
                      backgroundColor: '#ffffff'
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-envelope-fill text-primary"></i>
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
                    className="rounded-3 border-0 shadow-sm"
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.95rem",
                      backgroundColor: '#ffffff'
                    }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-telephone-fill text-primary"></i>
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
                    className="rounded-3 border-0 shadow-sm"
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.95rem",
                      backgroundColor: '#ffffff'
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
                    Region <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={editUserFormData.regionId || ""}
                    onChange={(e) =>
                      setEditUserFormData({
                        ...editUserFormData,
                        regionId: Number(e.target.value),
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-3">
                    Roles
                  </Form.Label>
                  <div
                    className="border rounded-3 p-3"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      backgroundColor: "#f8f9fa"
                    }}
                  >
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <Form.Check
                          key={role.id}
                          type="checkbox"
                          id={`edit-role-${role.id}`}
                          label={role.name}
                          checked={editUserFormData.roles.includes(role.id)}
                          onChange={(e) => {
                            const updatedRoles = e.target.checked
                              ? [...editUserFormData.roles, role.id]
                              : editUserFormData.roles.filter((r) => r !== role.id);
                            setEditUserFormData({
                              ...editUserFormData,
                              roles: updatedRoles,
                            });
                          }}
                          className="mb-2"
                        />
                      ))
                    ) : (
                      <p className="text-muted small mb-0">No roles available</p>
                    )}
                  </div>
                  <Form.Text className="text-muted small">
                    Select one or more roles for this user
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-3">
                    Hierarchies
                  </Form.Label>
                  <div
                    className="border rounded-3 p-3"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      backgroundColor: "#f8f9fa"
                    }}
                  >
                    {approvalHierarchies.length > 0 ? (
                      approvalHierarchies.map((hierarchy) => (
                        <Form.Check
                          key={hierarchy.id}
                          type="checkbox"
                          id={`edit-hierarchy-${hierarchy.id}`}
                          label={hierarchy.name}
                          checked={editUserFormData.hierarchies.includes(hierarchy.id)}
                          onChange={(e) => {
                            const updatedHierarchies = e.target.checked
                              ? [...editUserFormData.hierarchies, hierarchy.id]
                              : editUserFormData.hierarchies.filter((h) => h !== hierarchy.id);
                            setEditUserFormData({
                              ...editUserFormData,
                              hierarchies: updatedHierarchies,
                            });
                          }}
                          className="mb-2"
                        />
                      ))
                    ) : (
                      <p className="text-muted small mb-0">No hierarchies available</p>
                    )}
                  </div>
                  <Form.Text className="text-muted small">
                    Select one or more hierarchies for this user
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Department Restrictions for Each Hierarchy */}
            {editUserFormData.hierarchies.length > 0 && (
              <Row className="mt-4">
                <Col>
                  <Form.Group>
                    <Form.Label className="d-flex align-items-center gap-2 fw-semibold text-dark mb-3">
                      <Info size={18} className="text-primary" />
                      Department Restrictions (Optional)
                    </Form.Label>
                    <div className="border rounded p-3 bg-light">
                      <p className="small text-muted mb-3">
                        Select which departments this user can approve expenses for in each hierarchy. Leave empty for all departments.
                      </p>
                      {editUserFormData.hierarchies.map((hierarchyId) => {
                        const hierarchy = approvalHierarchies.find(h => h.id === hierarchyId);
                        if (!hierarchy) return null;

                        return (
                          <div key={hierarchyId} className="mb-3 pb-3 border-bottom">
                            <h6 className="text-primary mb-2">{hierarchy.name}</h6>
                            <div
                              className="ps-3"
                              style={{
                                maxHeight: "150px",
                                overflowY: "auto"
                              }}
                            >
                              {departments.length > 0 ? (
                                departments.map((dept: any) => (
                                  <Form.Check
                                    key={dept.id}
                                    type="checkbox"
                                    id={`dept-${hierarchyId}-${dept.id}`}
                                    label={
                                      <span>
                                        {dept.name}
                                        {dept.region ? (
                                          <Badge bg="secondary" className="ms-2 small">
                                            {dept.region.name}
                                          </Badge>
                                        ) : (
                                          <span className="ms-2 small text-muted fst-italic">
                                            (No Region)
                                          </span>
                                        )}
                                      </span>
                                    }
                                    checked={editUserFormData.departmentRestrictions[hierarchyId]?.includes(dept.id) || false}
                                    onChange={(e) => {
                                      const currentDepts = editUserFormData.departmentRestrictions[hierarchyId] || [];
                                      const updatedDepts = e.target.checked
                                        ? [...currentDepts, dept.id]
                                        : currentDepts.filter((d) => d !== dept.id);

                                      setEditUserFormData({
                                        ...editUserFormData,
                                        departmentRestrictions: {
                                          ...editUserFormData.departmentRestrictions,
                                          [hierarchyId]: updatedDepts,
                                        },
                                      });
                                    }}
                                    className="mb-1"
                                  />
                                ))
                              ) : (
                                <p className="text-muted small mb-0">No departments available</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4" style={{ backgroundColor: '#ffffff' }}>
          <Button
            variant="light"
            onClick={() => setShowEditUserModal(false)}
            className="px-5 py-3 rounded-pill fw-semibold border-2 shadow-sm"
            disabled={isUpdatingUser}
            style={{ fontSize: '0.95rem' }}
          >
            <X size={18} className="me-2" />
            Cancel
          </Button>
          <Button
            onClick={handleUpdateUser}
            className="px-5 py-3 rounded-pill fw-semibold shadow border-0"
            disabled={isUpdatingUser}
            style={{
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
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
                <Pencil size={18} className="me-2" />
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
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          className="border-0 pb-3 pt-4 px-4"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '0'
          }}
        >
          <div className="d-flex align-items-center w-100">
            <div
              className="icon-wrapper bg-white bg-opacity-20 me-3 rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "56px", height: "56px" }}
            >
              <Trash size={26} className="text-white" />
            </div>
            <div>
              <h5 className="fw-bold text-white mb-1">Delete User</h5>
              <p className="text-white text-opacity-90 mb-0 small">
                This action cannot be undone
              </p>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="alert border-0 d-flex align-items-start gap-3 shadow-sm mb-4" style={{
            backgroundColor: '#fee2e2',
            borderLeft: '4px solid #dc3545'
          }}>
            <div className="bg-danger bg-opacity-15 p-3 rounded-3 flex-shrink-0">
              <ExclamationTriangle size={28} className="text-danger" />
            </div>
            <div>
              <h6 className="fw-bold mb-2 text-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Warning: Permanent Action
              </h6>
              <p className="mb-0 text-dark">
                Are you sure you want to delete this user? This will permanently
                remove the user from the system and cannot be reversed.
              </p>
            </div>
          </div>

          {selectedUser && (
            <div className="mt-4 p-4 bg-white rounded-4 shadow-sm border-0">
              <h6 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-primary"></i>
                User Details
              </h6>
              <Row className="g-4">
                <Col md={6}>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                      <People size={20} className="text-primary" />
                    </div>
                    <div>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Full Name</small>
                      <span className="fw-bold text-dark">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-info bg-opacity-10 p-2 rounded-circle">
                      <Envelope size={20} className="text-info" />
                    </div>
                    <div>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Email Address</small>
                      <span className="fw-bold text-dark">{selectedUser.email}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                      <Telephone size={20} className="text-success" />
                    </div>
                    <div>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Phone Number</small>
                      <span className="fw-bold text-dark">
                        {selectedUser.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle">
                      <Gear size={20} className="text-warning" />
                    </div>
                    <div>
                      <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Account Status</small>
                      <Badge
                        bg={
                          selectedUser.status === "ACTIVE"
                            ? "success"
                            : selectedUser.status === "INACTIVE"
                            ? "warning"
                            : "secondary"
                        }
                        className="px-3 py-2 rounded-pill"
                      >
                        {selectedUser.status === "ACTIVE" && "🟢 "}
                        {selectedUser.status === "INACTIVE" && "🟡 "}
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-4" style={{ backgroundColor: '#ffffff' }}>
          <Button
            variant="light"
            onClick={() => setShowDeleteUserModal(false)}
            className="px-5 py-3 rounded-pill fw-semibold border-2 shadow-sm"
            disabled={isDeletingUser}
            style={{ fontSize: '0.95rem' }}
          >
            <X size={18} className="me-2" />
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteUser}
            className="px-5 py-3 rounded-pill fw-semibold shadow border-0"
            disabled={isDeletingUser}
            style={{
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
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
                <Trash size={18} className="me-2" />
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
        centered
      >
        <Modal.Header
          closeButton
          className="border-0 pb-3 pt-4 px-4"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #fee140 100%)',
            borderRadius: '0'
          }}
        >
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
            <div
              className="icon-wrapper bg-success me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              <Gear size={24} className="text-white" />
            </div>
            <div>
              Edit Role
              <div className="text-muted fw-normal small">
                Update role information and permissions
              </div>
            </div>
          </h5>
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
                    Region <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={editRoleFormData.regionId}
                    onChange={(e) =>
                      setEditRoleFormData({
                        ...editRoleFormData,
                        regionId: Number(e.target.value),
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small mb-2">
                    Page <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={editRoleFormData.pageId}
                    onChange={(e) =>
                      setEditRoleFormData({
                        ...editRoleFormData,
                        pageId: Number(e.target.value),
                      })
                    }
                    className="rounded-3 border-2"
                    style={{
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <option value="">Select Page</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                  </Form.Select>
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
        <Modal.Header
          closeButton
          className="border-0 pb-0 pt-4 px-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
            <div
              className="icon-wrapper bg-warning me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              <ShieldLock size={24} className="text-white" />
            </div>
            <div>
              Create New Region
              <div className="text-muted fw-normal small">
                Add a new region to your company
              </div>
            </div>
          </h5>
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
        <Modal.Header
          closeButton
          className="border-0 pb-0 pt-4 px-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
            <div
              className="icon-wrapper bg-warning me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              <ShieldLock size={24} className="text-white" />
            </div>
            <div>
              Edit Region
              <div className="text-muted fw-normal small">
                Update region information
              </div>
            </div>
          </h5>
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
              Delete Region
              <div className="text-muted fw-normal small">
                This action cannot be undone
              </div>
            </div>
          </h5>
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

export default function AdminDashboard() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
