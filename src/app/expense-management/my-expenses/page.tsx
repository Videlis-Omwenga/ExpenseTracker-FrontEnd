"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Table,
  Badge,
  Container,
  Row,
  Col,
  Modal,
  Form,
  Spinner,
  OverlayTrigger,
  Tooltip,
  ProgressBar,
} from "react-bootstrap";
import {
  ArrowDownCircle,
  Clock,
  FileText,
  CheckCircle,
  ClockHistory,
  ArrowRepeat,
  XCircle,
  Circle,
  CheckCircleFill,
  ChatLeftText,
  FileEarmarkX,
  Tag,
  CashStack,
  Clipboard2Data,
  PieChart,
  Wallet2,
  Search,
  XCircleFill,
  Lightbulb,
  Funnel,
  BarChart,
  Download,
  Eye,
  Person,
  PlusCircle,
  ListUl,
  GraphUp,
  GraphUpArrow,
  Calendar,
  Award,
  Star,
  Activity,
  Share,
  Printer,
  Filter,
  SortDown,
  CheckAll,
  FiletypeXlsx,
  FiletypePdf,
  Lightning,
  ChevronRight,
  Stopwatch,
  HourglassSplit,
  CheckSquareFill,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../../static/apiConfig";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "../../components/Navbar";
import PageLoader from "@/app/components/PageLoader";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";
import BudgetOverview from "../budgets/page";

/** ========= Types aligned to your Prisma schema ========= */

type ApprovalStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Role {
  id: number;
  name: string;
}

interface WorkflowStep {
  id: number;
  order: number;
  isOptional: boolean;
  role: Role | null;
}

interface ExpenseStep {
  id: number;
  order: number;
  isOptional: boolean;
  status: ApprovalStatus;
  comments?: string | null;
  role?: Role | null;
  approver?: User | null;
  workflowStep?: WorkflowStep | null;
  level?: number;
  nextApprovers?: User[];
  hierarchyName?: string | null;
}

interface Currency {
  id: number;
  currency: string;
  initials: string;
  rate: number;
}

interface Category {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: Currency | null;
  category: Category | null;
  receiptUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  isActive?: boolean | null;
  primaryAmount: number;
  exchangeRateUsed: number;
  payee: string;
  payeeId: string;
  payeeNumber?: string | null;
  department: Department | null;
  paymentMethod: PaymentMethod | null;
  region: Region | null;
  referenceNumber?: string | null;
  userId: number;
  user: User;
  workflowId?: number | null;
  expenseSteps: ExpenseStep[];
  createdAt: string;
  updatedAt: string;
}

type ExpenseRow = Omit<Expense, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

/** ========= Helpers ========= */

const parseDate = (d: unknown): string => {
  try {
    return d ? String(d) : "";
  } catch {
    return "";
  }
};

const normalizeStatus = (s: unknown): string =>
  typeof s === "string" ? s.toUpperCase() : String(s ?? "");

const statusBadge = (status: string) => {
  const s = normalizeStatus(status);
  switch (s) {
    case "APPROVED":
      return {
        bg: "success",
        icon: <CheckCircle size={14} className="me-1" />,
        label: "Approved",
      };
    case "PENDING":
      return {
        bg: "warning",
        icon: <ClockHistory size={14} className="me-1" />,
        label: "Pending",
      };
    case "REJECTED":
      return {
        bg: "danger",
        icon: <XCircle size={14} className="me-1" />,
        label: "Rejected",
      };
    case "PAID":
      return {
        bg: "primary",
        icon: <CheckCircle size={14} className="me-1" />,
        label: "Paid",
      };
    default:
      return {
        bg: "info",
        icon: <Clock size={14} className="me-1" />,
        label: s || "UNKNOWN",
      };
  }
};

const stepPillStyle = (step: ExpenseStep) => {
  const s = normalizeStatus(step.status) as ApprovalStatus;
  if (s === "APPROVED")
    return {
      className: "bg-success text-white",
      icon: <CheckCircle size={12} className="me-1" />,
    };
  if (s === "REJECTED")
    return {
      className: "bg-danger text-white",
      icon: <XCircle size={12} className="me-1" />,
    };
  if (s === "PENDING")
    return {
      className: "bg-warning text-dark",
      icon: <ClockHistory size={12} className="me-1" />,
    };
  return {
    className: "bg-secondary text-white",
    icon: <Circle size={12} className="me-1" />,
  }; // NOT_STARTED
};

const countCompletedSteps = (steps: ExpenseStep[]) =>
  steps.filter((s) =>
    ["APPROVED", "REJECTED"].includes(normalizeStatus(s.status))
  ).length;

const getProgressPercent = (steps: ExpenseStep[]) => {
  if (!steps?.length) return 0;

  // If any step is rejected, stop progress calculation at that point
  const hasRejectedStep = steps.some(step => normalizeStatus(step.status) === "REJECTED");
  if (hasRejectedStep) {
    // Find the index of the rejected step and calculate progress up to that point
    const rejectedIndex = steps.findIndex(step => normalizeStatus(step.status) === "REJECTED");
    return Math.floor(((rejectedIndex + 1) / steps.length) * 100);
  }

  const total = steps.length;
  const completed = countCompletedSteps(steps);
  return Math.floor((completed / total) * 100);
};

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalPending: number;
  totalRemaining: number;
  overallUtilization: number;
  isOverBudget: boolean;
  month: string;
  year: number;
  byCategory: Array<{
    categoryId: number;
    categoryName: string;
    departmentId: number;
    departmentName: string;
    regionId: number;
    regionName: string;
    budgetAmount: number;
    remainingBudget: number;
    totalSpent: number;
    pendingAmount: number;
    remaining: number;
    utilization: number;
    isOverBudget: boolean;
    month: string;
    year: number;
  }>;
}

export default function FinanceDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateRangeFilter, setDateRangeFilter] = useState("All Time");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("All Approval Status");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const router = useRouter();
  const handleNavigation = (path: string) => router.push(path);

  // Log budgetSummary when it changes
  useEffect(() => {}, [budgetSummary]);

  // Fetch expenses when component mounts
  useEffect(() => {
    fetchExpenses();
  }, []); // Empty dependency array means this runs once on mount

  /** ===== Fetch & transform ===== */
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/expense-submission/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      if (!response.ok) {
        toast.error(`Error: ${response.status}`);
        return;
      }

      const responseData = await response.json();

      // The actual expenses array
      const data = Array.isArray(responseData) ? responseData : [];

      // If we have expenses and the first one has a budgetSummary, use it
      if (data.length > 0 && data[0].budgetSummary) {
        setBudgetSummary(data[0].budgetSummary);
      }

      if (Array.isArray(data)) {
        const mapped = data.map((item: Record<string, unknown>): ExpenseRow => {
          // Map user
          const userObj = item.user as Record<string, unknown> | undefined;
          const mappedUser: User = {
            id: Number(userObj?.id ?? 0),
            firstName: String(userObj?.firstName ?? ""),
            lastName: String(userObj?.lastName ?? ""),
            email: String(userObj?.email ?? ""),
          };

          // Map steps
          const steps: ExpenseStep[] = Array.isArray(item.expenseSteps)
            ? (item.expenseSteps as unknown[]).map((s: unknown) => {
                const stepObj = s as Record<string, unknown>;
                const roleObj = stepObj.role as Record<string, unknown> | undefined;
                const approverObj = stepObj.approver as Record<string, unknown> | undefined;
                const nextApproversArr = stepObj.nextApprovers as unknown[] | undefined;

                return {
                id: Number(stepObj.id ?? 0),
                order: Number(stepObj.order ?? 0),
                isOptional: Boolean(stepObj.isOptional ?? false),
                status: (stepObj.status as ApprovalStatus) || "PENDING",
                comments: stepObj.comments ? String(stepObj.comments) : null,
                role: roleObj
                  ? {
                      id: Number(roleObj.id ?? 0),
                      name: String(roleObj.name ?? ""),
                    }
                  : null,
                approver: approverObj
                  ? {
                      id: Number(approverObj.id ?? 0),
                      firstName: String(approverObj.firstName ?? ""),
                      lastName: String(approverObj.lastName ?? ""),
                      email: String(approverObj.email ?? ""),
                    }
                  : undefined,
                nextApprovers: nextApproversArr
                  ? nextApproversArr.map((na: unknown) => {
                      const naObj = na as Record<string, unknown>;
                      return {
                        id: Number(naObj.id ?? 0),
                        firstName: String(naObj.firstName ?? ""),
                        lastName: String(naObj.lastName ?? ""),
                        email: String(naObj.email ?? ""),
                      };
                    })
                  : [],
                hierarchyName: stepObj.hierarchyName ? String(stepObj.hierarchyName) : null,
                level: Number(stepObj.order ?? 0),
              };
            })
            : [];

          // Map related entities
          const currencyObj = item.currency as Record<string, unknown> | undefined;
          const currency = currencyObj
            ? {
                id: Number(currencyObj.id ?? 0),
                currency: String(currencyObj.currency ?? ""),
                initials: String(currencyObj.initials ?? ""),
                rate: Number(currencyObj.rate ?? 1),
              }
            : null;

          const categoryObj = item.category as Record<string, unknown> | undefined;
          const category = categoryObj
            ? {
                id: Number(categoryObj.id ?? 0),
                name: String(categoryObj.name ?? ""),
              }
            : null;

          const departmentObj = item.department as Record<string, unknown> | undefined;
          const department = departmentObj
            ? {
                id: Number(departmentObj.id ?? 0),
                name: String(departmentObj.name ?? ""),
              }
            : null;

          const paymentMethodObj = item.paymentMethod as Record<string, unknown> | undefined;
          const paymentMethod = paymentMethodObj
            ? {
                id: Number(paymentMethodObj.id ?? 0),
                name: String(paymentMethodObj.name ?? ""),
              }
            : null;

          const regionObj = item.region as Record<string, unknown> | undefined;
          const region = regionObj
            ? {
                id: Number(regionObj.id ?? 0),
                name: String(regionObj.name ?? ""),
              }
            : null;

          return {
            id: Number(item.id ?? 0),
            description: String(item.description ?? ""),
            amount: Number(item.amount ?? 0),
            currency,
            category,
            receiptUrl: item.receiptUrl ? String(item.receiptUrl) : null,
            status:
              (normalizeStatus(item.status) as ExpenseRow["status"]) ||
              "PENDING",
            isActive: Boolean(item.isActive ?? true),
            primaryAmount: Number(item.primaryAmount ?? 0),
            exchangeRateUsed: Number(item.exchangeRate ?? 0),
            payee: String(item.payee ?? ""),
            payeeId: String(item.payeeId ?? ""),
            payeeNumber: item.payeeNumber ? String(item.payeeNumber) : null,
            department,
            paymentMethod,
            region,
            referenceNumber: item.referenceNumber ? String(item.referenceNumber) : null,
            userId: Number(item.userId ?? 0),
            user: mappedUser,
            workflowId:
              item.workflowId != null ? Number(item.workflowId) : null,

            expenseSteps: steps,

            createdAt: item.createdAt ? parseDate(item.createdAt) : "",
            updatedAt: item.updatedAt ? parseDate(item.updatedAt) : "",
          };
        });

        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(
        "Failed to load expenses: " + (err?.message || String(error))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleViewDetails = (expense: ExpenseRow) => {
    setSelectedExpense(expense);
    setShowModal(true);
  };

  /** ===== Derived/UI state ===== */

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = expenses
      .map((expense) => expense.category?.name)
      .filter((name): name is string => !!name);
    return [...new Set(categories)].sort();
  }, [expenses]);

  // Analytics calculations
  const analyticsData = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Filter expenses for different periods
    const thisMonthExpenses = expenses.filter(e => new Date(e.createdAt) >= thisMonth);
    const lastMonthExpenses = expenses.filter(e =>
      new Date(e.createdAt) >= lastMonth && new Date(e.createdAt) < thisMonth
    );
    const thisYearExpenses = expenses.filter(e => new Date(e.createdAt) >= thisYear);

    // Calculate totals
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const thisYearTotal = thisYearExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Status breakdown
    const statusBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category spending
    const categorySpending = expenses.reduce((acc, expense) => {
      const category = expense.category?.name || 'Uncategorized';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Top categories (only first 2)
    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthExpenses = expenses.filter(e =>
        new Date(e.createdAt) >= date && new Date(e.createdAt) < nextMonth
      );
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: total,
        count: monthExpenses.length
      });
    }

    // Calculate growth
    const monthlyGrowth = lastMonthTotal === 0 ? 0 :
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

    // Average expense
    const averageExpense = expenses.length > 0 ?
      expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0;

    // Pending approvals count
    const pendingCount = expenses.filter(e =>
      e.expenseSteps.some(step => normalizeStatus(step.status) === 'PENDING')
    ).length;

    return {
      thisMonthTotal,
      lastMonthTotal,
      thisYearTotal,
      monthlyGrowth,
      statusBreakdown,
      categorySpending,
      topCategories,
      monthlyTrend,
      averageExpense,
      pendingCount,
      totalExpenses: expenses.length
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Search by description, amount, reference number, or payee
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.amount?.toString().includes(searchQuery) ||
        expense.referenceNumber?.toLowerCase().includes(searchLower) ||
        expense.payee?.toLowerCase().includes(searchLower);

      // Filter by status
      const matchesStatus =
        statusFilter === "All Statuses" ||
        expense.status?.toLowerCase() === statusFilter.toLowerCase();

      // Filter by category
      const matchesCategory =
        categoryFilter === "All Categories" ||
        expense.category?.name === categoryFilter;

      // Filter by amount range
      const matchesAmount = (() => {
        const amount = expense.amount || 0;
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Number.MAX_VALUE;
        return amount >= min && amount <= max;
      })();

      // Filter by approval process
      const matchesApproval = (() => {
        if (approvalFilter === "All Approval Status") return true;

        const steps = expense.expenseSteps || [];
        if (approvalFilter === "Fully Approved") {
          return (
            steps.length > 0 &&
            steps.every((step) => normalizeStatus(step.status) === "APPROVED")
          );
        }
        if (approvalFilter === "Pending Approval") {
          return steps.some(
            (step) => normalizeStatus(step.status) === "PENDING"
          );
        }
        if (approvalFilter === "Has Rejections") {
          return steps.some(
            (step) => normalizeStatus(step.status) === "REJECTED"
          );
        }
        if (approvalFilter === "Not Started") {
          return (
            steps.length === 0 ||
            steps.every(
              (step) => normalizeStatus(step.status) === "NOT_STARTED"
            )
          );
        }
        return true;
      })();

      // Filter by date range
      const now = new Date();
      const expenseDate = new Date(expense.createdAt);
      let matchesDateRange = true;

      if (dateRangeFilter === "Today") {
        matchesDateRange = expenseDate.toDateString() === now.toDateString();
      } else if (dateRangeFilter === "This Week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        matchesDateRange = expenseDate >= startOfWeek;
      } else if (dateRangeFilter === "This Month") {
        matchesDateRange =
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear();
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesAmount &&
        matchesApproval &&
        matchesDateRange
      );
    });
  }, [
    expenses,
    searchQuery,
    statusFilter,
    dateRangeFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    approvalFilter,
  ]);

  // Pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / itemsPerPage)
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredExpenses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Bulk operations handlers
  const handleSelectExpense = (expenseId: number) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedExpenses.size === currentItems.length) {
      setSelectedExpenses(new Set());
      setShowBulkActions(false);
    } else {
      const allIds = new Set(currentItems.map(expense => expense.id));
      setSelectedExpenses(allIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkExport = () => {
    const selectedData = currentItems.filter(e => selectedExpenses.has(e.id));
    const csvContent = [
      ["ID", "Date", "Payee", "Category", "Description", "Amount", "Status"],
      ...selectedData.map(e => [
        e.id,
        new Date(e.createdAt).toLocaleDateString(),
        e.payee,
        e.category?.name || "N/A",
        e.description,
        e.amount,
        e.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedExpenses.size} selected expenses!`);
  };

  const handleBulkFilter = (filterType: string) => {
    const selectedData = currentItems.filter(e => selectedExpenses.has(e.id));
    switch (filterType) {
      case 'pending':
        setStatusFilter('PENDING');
        break;
      case 'approved':
        setStatusFilter('APPROVED');
        break;
      case 'rejected':
        setStatusFilter('REJECTED');
        break;
    }
    setSelectedExpenses(new Set());
    setShowBulkActions(false);
    toast.info(`Applied ${filterType} filter`);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    approvalFilter,
    dateRangeFilter,
  ]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="dashboard-container px-4 py-3">
        {/* Modern Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                  <Clipboard2Data className="text-primary" size={28} />
                </div>
                <div>
                  <h2 className="fw-bold text-dark mb-0">
                    My Expenses
                  </h2>
                  <p className="text-muted mb-0 small">
                    Track and manage your expense submissions
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="d-inline-flex align-items-center px-4 py-2 rounded-pill fw-semibold shadow-sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner animation="border" size="sm" className="me-2" />
              ) : (
                <ArrowRepeat size={16} className="me-2" />
              )}
              Refresh
            </Button>
          </div>
          <hr className="border-2 border-primary opacity-25 mb-4" />
        </div>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col xs={6} md={2}>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 shadow-sm border-start border-primary border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                          <CashStack size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">
                            Monthly Budget
                          </p>
                          <h6 className="mb-0 fw-bold">
                            $
                            {(budgetSummary?.totalBudget || 0).toLocaleString()}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={6} md={2}>
                    <div className="bg-success p-3 rounded-3 shadow-sm bg-opacity-10 border-start border-success border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                          <BarChart size={20} className="text-warning" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Spent</p>
                          <h6 className="mb-0 fw-bold">
                            ${(budgetSummary?.totalSpent || 0).toLocaleString()}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={6} md={2}>
                    <div className="bg-info p-3 rounded-3 shadow-sm bg-opacity-10 border-start border-info border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                          <Wallet2 size={20} className="text-success" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Remaining</p>
                          <h6 className="mb-0 fw-bold">
                            $
                            {(
                              budgetSummary?.totalRemaining || 0
                            ).toLocaleString()}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={6} md={2}>
                    <div className="bg-warning p-3 rounded-3 shadow-sm bg-opacity-10 border-start border-warning border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                          <PieChart size={20} className="text-info" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Utilization</p>
                          <h6 className="mb-0 fw-bold">
                            {budgetSummary?.overallUtilization?.toFixed(1) || 0}
                            %
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={6} md={2}>
                    <div className="bg-secondary p-3 rounded-3 shadow-sm bg-opacity-10 border-start border-secondary border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-secondary bg-opacity-10 p-2 rounded me-3">
                          <Download size={20} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-secondary small mb-1">
                            Generate report
                          </p>
                          <h6 className="mb-0 fw-bold">Export expenses</h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <BudgetOverview />
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions Bar */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                      <Lightning size={20} className="text-warning" />
                    </div>
                    <h6 className="fw-bold text-dark mb-0">Quick Actions</h6>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      className="d-flex align-items-center gap-1 rounded-pill px-3 py-2 fw-semibold"
                      onClick={() => handleNavigation("create-expense")}
                    >
                      <PlusCircle size={14} />
                      New Expense
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="d-flex align-items-center gap-1 rounded-pill px-3 py-2 fw-semibold"
                      onClick={() => {
                        const csvContent = [
                          ["ID", "Date", "Payee", "Category", "Description", "Amount", "Status"],
                          ...filteredExpenses.map(e => [
                            e.id,
                            new Date(e.createdAt).toLocaleDateString(),
                            e.payee,
                            e.category?.name || "N/A",
                            e.description,
                            e.amount,
                            e.status
                          ])
                        ].map(row => row.join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Expenses exported successfully!");
                      }}
                    >
                      <FiletypeXlsx size={14} />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="d-flex align-items-center gap-1 rounded-pill px-3 py-2 fw-semibold"
                      onClick={() => window.print()}
                    >
                      <Printer size={14} />
                      Print
                    </Button>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      className="d-flex align-items-center gap-1 rounded-pill px-3 py-2 fw-semibold"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: "My Expenses Summary",
                            text: `I have ${expenses.length} expenses totaling KES ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Page URL copied to clipboard!");
                        }
                      }}
                    >
                      <Share size={14} />
                      Share
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Analytics Dashboard */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                    <GraphUp size={24} className="text-info" />
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-1">Expense Analytics</h5>
                    <p className="text-muted mb-0 small">Insights and trends from your expense data</p>
                  </div>
                </div>

                <Row className="g-4">
                  {/* Key Metrics */}
                  <Col md={8}>
                    <Row className="g-3">
                      <Col sm={6} md={3}>
                        <div className="analytics-card bg-primary bg-opacity-10 p-3 rounded-3 border-start border-primary border-3">
                          <div className="d-flex align-items-center">
                            <GraphUpArrow size={20} className="text-primary me-2" />
                            <div>
                              <p className="text-muted small mb-1">This Month</p>
                              <h6 className="mb-0 fw-bold">
                                KES {analyticsData.thisMonthTotal.toLocaleString()}
                              </h6>
                              {analyticsData.lastMonthTotal > 0 ? (
                                <small className={`fw-medium ${analyticsData.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {analyticsData.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.monthlyGrowth.toFixed(1)}% vs last month
                                </small>
                              ) : (
                                <small className="text-muted">First month data</small>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6} md={3}>
                        <div className="analytics-card bg-success bg-opacity-10 p-3 rounded-3 border-start border-success border-3">
                          <div className="d-flex align-items-center">
                            <Calendar size={20} className="text-success me-2" />
                            <div>
                              <p className="text-muted small mb-1">This Year</p>
                              <h6 className="mb-0 fw-bold">
                                KES {analyticsData.thisYearTotal.toLocaleString()}
                              </h6>
                              <small className="text-muted">
                                {analyticsData.totalExpenses} total expenses
                              </small>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6} md={3}>
                        <div className="analytics-card bg-warning bg-opacity-10 p-3 rounded-3 border-start border-warning border-3">
                          <div className="d-flex align-items-center">
                            <Activity size={20} className="text-warning me-2" />
                            <div>
                              <p className="text-muted small mb-1">Average</p>
                              <h6 className="mb-0 fw-bold">
                                KES {Math.round(analyticsData.averageExpense).toLocaleString()}
                              </h6>
                              <small className="text-muted">
                                {analyticsData.totalExpenses > 0 ? 'per expense' : 'no expenses yet'}
                              </small>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col sm={6} md={3}>
                        <div className="analytics-card bg-danger bg-opacity-10 p-3 rounded-3 border-start border-danger border-3">
                          <div className="d-flex align-items-center">
                            <Clock size={20} className="text-danger me-2" />
                            <div>
                              <p className="text-muted small mb-1">Pending</p>
                              <h6 className="mb-0 fw-bold">{analyticsData.pendingCount}</h6>
                              <small className="text-muted">awaiting approval</small>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* Monthly Trend Chart */}
                    <div className="mt-4 p-3 bg-light bg-opacity-50 rounded-3">
                      <h6 className="fw-bold mb-3">
                        <BarChart className="me-2" size={16} />
                        6-Month Spending Trend
                      </h6>
                      <div className="chart-container">
                        <div className="d-flex align-items-end justify-content-between" style={{ height: '120px' }}>
                          {analyticsData.monthlyTrend.map((data, index) => {
                            const maxAmount = Math.max(...analyticsData.monthlyTrend.map(d => d.amount), 1);
                            const height = data.amount > 0 ? Math.max((data.amount / maxAmount) * 80, 8) : 8;

                            // Create more realistic visual variation
                            const hasData = data.amount > 0;
                            const barColor = hasData ? (data.amount > analyticsData.thisMonthTotal * 0.8 ? '#dc3545' :
                                                      data.amount > analyticsData.thisMonthTotal * 0.5 ? '#ffc107' : '#0d6efd') : '#e9ecef';

                            return (
                              <div key={index} className="d-flex flex-column align-items-center">
                                <OverlayTrigger
                                  placement="top"
                                  overlay={
                                    <Tooltip>
                                      <div className="text-start">
                                        <div className="fw-bold">{data.month}</div>
                                        <div>Amount: KES {data.amount.toLocaleString()}</div>
                                        <div>Expenses: {data.count}</div>
                                        {data.count > 0 && (
                                          <div>Avg: KES {(data.amount / data.count).toLocaleString()}</div>
                                        )}
                                      </div>
                                    </Tooltip>
                                  }
                                >
                                  <div
                                    className="rounded-top chart-bar"
                                    style={{
                                      width: '32px',
                                      height: `${height + 12}px`,
                                      minHeight: '12px',
                                      backgroundColor: barColor,
                                      opacity: hasData ? 0.9 : 0.3,
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      position: 'relative',
                                      border: hasData ? `2px solid ${barColor}` : '1px solid #dee2e6'
                                    }}
                                  >
                                    {hasData && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: '-18px',
                                          left: '50%',
                                          transform: 'translateX(-50%)',
                                          fontSize: '8px',
                                          color: '#6c757d',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {data.count}
                                      </div>
                                    )}
                                  </div>
                                </OverlayTrigger>
                                <small className="text-muted mt-1" style={{ fontSize: '0.65rem', fontWeight: '500' }}>
                                  {data.month.split(' ')[0]}
                                </small>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Category Breakdown */}
                  <Col md={4}>
                    <div className="h-100 p-3 bg-light bg-opacity-50 rounded-3">
                      <h6 className="fw-bold mb-3">
                        <PieChart className="me-2" size={16} />
                        Top Categories
                      </h6>
                      <div className="category-breakdown">
                        {analyticsData.topCategories.length > 0 ? (
                          analyticsData.topCategories.map(([category, amount], index) => {
                            const totalSpending = analyticsData.thisYearTotal || 1;
                            const percentage = (amount / totalSpending) * 100;
                            const colors = ['primary', 'success'];
                            const color = colors[index] || 'primary';

                            return (
                              <div key={category} className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div className="d-flex align-items-center">
                                    <Tag size={12} className={`text-${color} me-2`} />
                                    <span className="fw-medium">{category}</span>
                                  </div>
                                  <span className="small text-muted fw-bold">
                                    KES {amount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                  <div
                                    className={`progress-bar bg-${color}`}
                                    style={{
                                      width: `${Math.max(percentage, 5)}%`,
                                      background: `linear-gradient(135deg, var(--bs-${color}) 0%, var(--bs-${color === 'primary' ? 'info' : 'warning'}) 100%)`
                                    }}
                                  ></div>
                                </div>
                                <div className="d-flex justify-content-between mt-1">
                                  <small className="text-muted">{percentage.toFixed(1)}% of total spending</small>
                                  <small className="text-muted">
                                    {Math.round(amount / (analyticsData.averageExpense || 1))} expenses
                                  </small>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-3 text-muted">
                            <Tag size={24} className="mb-2" />
                            <div className="small">No category data available</div>
                          </div>
                        )}
                      </div>

                      {/* Status Overview */}
                      <div className="mt-4 pt-3 border-top">
                        <h6 className="fw-bold mb-3">
                          <Award className="me-2" size={16} />
                          Status Overview
                        </h6>
                        <div className="status-overview">
                          {Object.entries(analyticsData.statusBreakdown).map(([status, count]) => {
                            const badge = statusBadge(status);
                            const percentage = (count / analyticsData.totalExpenses) * 100;

                            return (
                              <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center">
                                  <Badge
                                    bg={badge.bg}
                                    className="me-2 d-inline-flex align-items-center py-1 px-2 rounded-pill"
                                  >
                                    {badge.icon}
                                    <span className="ms-1 small">{badge.label}</span>
                                  </Badge>
                                </div>
                                <div className="text-end">
                                  <span className="fw-bold">{count}</span>
                                  <small className="text-muted ms-1">({percentage.toFixed(0)}%)</small>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Expenses Table */}
        <Container fluid className="mt-2">
          <Card className="mb-4 border-0 shadow-sm rounded-3">
            <Card.Header className="bg-light border-0 rounded-top-3 p-4">
              {/* Search and Action Row */}
              <Row className="align-items-center g-3 mb-3">
                <Col xs={12} md={4}>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">
                      Showing {indexOfFirstItem + 1}-
                      {Math.min(indexOfLastItem, filteredExpenses.length)} of{" "}
                      {filteredExpenses.length} expenses
                    </small>
                    {selectedExpenses.size > 0 && (
                      <Badge bg="primary" className="ms-2">
                        {selectedExpenses.size} selected
                      </Badge>
                    )}
                  </div>
                </Col>
                <Col xs={12} md={5} className="mb-2 mb-md-0">
                  <div className="modern-search-container position-relative">
                    <div className="d-flex align-items-center gap-2">
                      <div className="search-icon-external border">
                        <Search size={18} className="text-primary" />
                      </div>
                      <div className="search-input-wrapper flex-grow-1">
                        <Form.Control
                          type="search"
                          placeholder="Search by description, amount, reference, payee..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="modern-search-input"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="clear-search-btn"
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search"
                          >
                            <XCircleFill size={16} />
                          </button>
                        )}
                        <div className="search-suggestions">
                          <span className="search-suggestion-text">
                            <Lightbulb size={12} className="me-1" />
                            Try: amount, description, reference number, or payee
                          </span>
                        </div>
                      </div>
                    </div>
                    {searchQuery && (
                      <div className="search-results-count">
                        <small className="text-primary fw-medium">
                          <Funnel size={12} className="me-1" />
                          {filteredExpenses.length} results found
                        </small>
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={12} md={3} className="text-end">
                  <Button
                    className="btn btn-primary btn-sm rounded-pill px-4 py-2 fw-semibold shadow-sm"
                    onClick={() => handleNavigation("create-expense")}
                  >
                    <PlusCircle size={16} className="me-2" />
                    Create Expense
                  </Button>
                </Col>
              </Row>

              {/* Horizontal Filters Row */}
              <div className="filters-section">
                <div className="filter-header-bar d-flex align-items-center justify-content-between mb-3 p-3 bg-primary bg-opacity-10 rounded-3 border-0">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-25 p-2 rounded-circle me-2">
                      <Funnel className="text-primary" size={14} />
                    </div>
                    <h6 className="mb-0 fw-bold text-dark">
                      Filters
                    </h6>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill px-3 py-1 fw-semibold"
                    onClick={() => {
                      setStatusFilter("All Statuses");
                      setDateRangeFilter("All Time");
                      setCategoryFilter("All Categories");
                      setMinAmount("");
                      setMaxAmount("");
                      setApprovalFilter("All Approval Status");
                      setSearchQuery("");
                    }}
                  >
                    <ArrowRepeat className="me-1" size={14} />
                    Reset All
                  </Button>
                </div>

                <Row className="g-3">
                  {/* Status Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label">
                        <Circle className="me-1" size={12} />
                        Status
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="All Statuses">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="PAID">Paid</option>
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Category Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label">
                        <Tag className="me-1" size={12} />
                        Category
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="All Categories">All</option>
                        {uniqueCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Amount Range */}
                  <Col xs={12} sm={6} md={3}>
                    <div className="filter-item">
                      <label className="filter-label">
                        <CashStack className="me-1" size={12} />
                        Amount Range (KES)
                      </label>
                      <Row className="g-1">
                        <Col xs={6}>
                          <Form.Control
                            size="sm"
                            type="number"
                            placeholder="Min"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className="form-control-modern"
                          />
                        </Col>
                        <Col xs={6}>
                          <Form.Control
                            size="sm"
                            type="number"
                            placeholder="Max"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className="form-control-modern"
                          />
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  {/* Approval Process Filter */}
                  <Col xs={12} sm={6} md={3}>
                    <div className="filter-item">
                      <label className="filter-label">
                        <CheckCircle className="me-1" size={12} />
                        Approval Process
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern"
                        value={approvalFilter}
                        onChange={(e) => setApprovalFilter(e.target.value)}
                      >
                        <option value="All Approval Status">All</option>
                        <option value="Fully Approved">Fully Approved</option>
                        <option value="Pending Approval">Pending</option>
                        <option value="Has Rejections">Has Rejections</option>
                        <option value="Not Started">Not Started</option>
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Date Range Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label">
                        <Clock className="me-1" size={12} />
                        Date Range
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern"
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value)}
                      >
                        <option value="All Time">All Time</option>
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                      </Form.Select>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Bulk Actions Bar */}
              {showBulkActions && (
                <div className="bulk-actions-bar mt-3 p-3 bg-primary bg-opacity-10 rounded-3 border-start border-primary border-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center">
                      <CheckSquareFill size={18} className="text-primary me-2" />
                      <span className="fw-bold text-primary">
                        {selectedExpenses.size} expense{selectedExpenses.size > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={handleBulkExport}
                        className="d-flex align-items-center gap-1"
                      >
                        <Download size={14} />
                        Export Selected
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleBulkFilter('pending')}
                        className="d-flex align-items-center gap-1"
                      >
                        <Clock size={14} />
                        Filter Pending
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleBulkFilter('approved')}
                        className="d-flex align-items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Filter Approved
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedExpenses(new Set());
                          setShowBulkActions(false);
                        }}
                        className="d-flex align-items-center gap-1"
                      >
                        <XCircle size={14} />
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Header>
            <br />
            <br />
            <Card.Body className="p-0">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No expenses found</p>
                  {searchQuery && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="border-0">
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0 transactions-table align-middle">
                        <thead className="bg-light border-0">
                          <tr>
                            <th className="border-0 py-3 px-4" style={{ width: "50px" }}>
                              <Form.Check
                                type="checkbox"
                                checked={selectedExpenses.size === currentItems.length && currentItems.length > 0}
                                onChange={handleSelectAll}
                                id="select-all"
                              />
                            </th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">#ID</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Created</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Payee</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Category</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Description</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Amount</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Owner</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Status</th>
                            <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small" style={{ minWidth: 120 }}>Approval Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((expense) => {
                            const badge = statusBadge(expense.status);
                            const completed = countCompletedSteps(
                              expense.expenseSteps
                            );
                            const total = expense.expenseSteps.length;
                            const progress = getProgressPercent(
                              expense.expenseSteps
                            );

                            return (
                              <tr
                                key={expense.id}
                                className={`cursor-pointer border-bottom ${selectedExpenses.has(expense.id) ? 'table-active' : ''}`}
                              >
                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedExpenses.has(expense.id)}
                                    onChange={() => handleSelectExpense(expense.id)}
                                    id={`expense-${expense.id}`}
                                  />
                                </td>
                                <td
                                  className="py-3 px-4 fw-semibold text-primary"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="d-flex align-items-center">
                                    <Tag
                                      size={14}
                                      className="me-1"
                                    />
                                    <span>{expense.id}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <div className="d-flex flex-column">
                                    <div className="">
                                      Created:{" "}
                                      <DateTimeDisplay
                                        date={expense.createdAt}
                                      />
                                    </div>
                                    <div className="text-muted small">
                                      Updated:{" "}
                                      <DateTimeDisplay
                                        date={expense.updatedAt}
                                        isHighlighted={
                                          expense.updatedAt !==
                                          expense.createdAt
                                        }
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <div className="fw-medium">
                                    {expense.payee}
                                  </div>
                                  <div className="text-muted small">
                                    {expense.payeeNumber}
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <div className="d-flex align-items-center">
                                    <Badge bg="primary" className="px-3 py-2 rounded-pill fw-semibold">
                                      <Tag className="me-1" size={12} />
                                      {expense.category?.name || "Uncategorized"}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <div className="d-flex align-items-center">
                                    <div className="transaction-icon me-2 bg-light border bg-opacity-10 p-1 rounded-3">
                                      <ListUl
                                        className="text-success"
                                        size={14}
                                      />
                                    </div>
                                    <div>
                                      <div
                                        className="fw-medium text-truncate"
                                        style={{ maxWidth: "300px" }}
                                        title={expense.description}
                                      >
                                        {expense.description}
                                      </div>
                                      <div className="text-muted small">
                                        {expense.region?.name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <div className="d-flex flex-column">
                                    <span className="text-success fw-bold">
                                      {expense?.amount?.toLocaleString() ||
                                        "0.00"}{" "}
                                      KES
                                    </span>
                                    <span className="text-muted small">
                                      {expense?.primaryAmount?.toLocaleString() ||
                                        "0.00"}{" "}
                                      {expense?.currency?.initials
                                        ? `${
                                            expense.currency.initials
                                              ? `${expense.currency.initials}`
                                              : ""
                                          }`
                                        : "N/A"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <div className="d-flex align-items-center">
                                    <div className="avatar-sm bg-primary bg-opacity-10 text-primary fw-medium d-flex align-items-center justify-content-center rounded-circle me-2" style={{width: "32px", height: "32px"}}>
                                      {expense.user.firstName.charAt(0)}
                                      {expense.user.lastName.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="fw-medium">
                                        {expense.user.firstName}{" "}
                                        {expense.user.lastName}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4" onClick={() => handleViewDetails(expense)}>
                                  <Badge
                                    bg={badge.bg}
                                    className="d-inline-flex align-items-center py-2 px-3 rounded-pill fw-semibold"
                                  >
                                    {badge.icon}
                                    {badge.label}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="approval-timeline-compact p-2 rounded-3">
                                    {expense.expenseSteps.length > 0 ? (
                                      <div className="timeline-steps d-flex flex-column gap-1">
                                        {/* Progress Header */}
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                          <span className="badge bg-secondary-subtle text-dark fw-semibold">
                                            {completed}/{total} Steps
                                          </span>
                                          <span className="text-muted small">
                                            {progress}% complete
                                          </span>
                                          {progress === 100 && (
                                            <CheckCircleFill
                                              size={16}
                                              className="text-success"
                                            />
                                          )}
                                        </div>

                                        {/* Progress Bar */}
                                        {(() => {
                                          const hasRejectedStep = expense.expenseSteps.some(
                                            step => normalizeStatus(step.status) === "REJECTED"
                                          );
                                          const allApproved = expense.expenseSteps.length > 0 &&
                                            expense.expenseSteps.every(step => normalizeStatus(step.status) === "APPROVED");

                                          let variant = "info";
                                          if (hasRejectedStep) variant = "danger";
                                          else if (allApproved) variant = "success";

                                          return (
                                            <ProgressBar
                                              now={progress}
                                              variant={variant}
                                              animated={!hasRejectedStep && !allApproved && normalizeStatus(expense.status) === "PENDING"}
                                              className="rounded-pill shadow-sm"
                                              style={{ height: "6px" }}
                                            />
                                          );
                                        })()}

                                        {/* Current Step Info */}
                                        {(() => {
                                          // Check if any step has been rejected
                                          const hasRejectedStep = expense.expenseSteps.some(
                                            step => normalizeStatus(step.status) === "REJECTED"
                                          );

                                          // If rejected, show rejection info instead of next approver
                                          if (hasRejectedStep) {
                                            const rejectedStep = expense.expenseSteps.find(
                                              step => normalizeStatus(step.status) === "REJECTED"
                                            );
                                            return (
                                              <div className="current-step-info text-center mt-1 bg-danger bg-opacity-10 border-danger">
                                                <small className="text-danger fw-medium">
                                                  <XCircle size={10} className="me-1" />
                                                  Rejected at: {rejectedStep?.hierarchyName || rejectedStep?.role?.name || "Unknown step"}
                                                </small>
                                              </div>
                                            );
                                          }

                                          // If not rejected, find current pending step
                                          const currentStep = expense.expenseSteps.find(
                                            step => normalizeStatus(step.status) === "PENDING"
                                          );

                                          if (currentStep) {
                                            // Show hierarchy name and first approver only
                                            const hierarchyName = currentStep.hierarchyName || currentStep.role?.name || "Unknown";
                                            const nextApprover = currentStep.nextApprovers && currentStep.nextApprovers.length > 0
                                              ? `${currentStep.nextApprovers[0].firstName} ${currentStep.nextApprovers[0].lastName}`
                                              : null;

                                            return (
                                              <div className="current-step-info text-center mt-1">
                                                <small className="text-muted">
                                                  <Clock size={10} className="me-1" />
                                                  {hierarchyName}
                                                  {nextApprover && (
                                                    <div className="mt-1">
                                                      <strong>{nextApprover}</strong>
                                                    </div>
                                                  )}
                                                </small>
                                              </div>
                                            );
                                          }

                                          // If all steps are completed (approved)
                                          const allApproved = expense.expenseSteps.length > 0 &&
                                            expense.expenseSteps.every(step => normalizeStatus(step.status) === "APPROVED");

                                          if (allApproved) {
                                            return (
                                              <div className="current-step-info text-center mt-1 bg-success bg-opacity-10 border-success">
                                                <small className="text-success fw-medium">
                                                  <CheckCircle size={10} className="me-1" />
                                                  Fully Approved
                                                </small>
                                              </div>
                                            );
                                          }

                                          return null;
                                        })()}
                                      </div>
                                    ) : (
                                      <div className="text-center text-muted py-2">
                                        <Circle size={16} className="mb-1" />
                                        <div className="small">No workflow steps</div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top">
                          <div className="text-muted small">
                            Showing {indexOfFirstItem + 1}-
                            {Math.min(indexOfLastItem, filteredExpenses.length)}{" "}
                            of {filteredExpenses.length} expenses
                          </div>
                          <div>
                            <nav>
                              <ul className="pagination pagination-sm mb-0">
                                <li
                                  className={`page-item ${
                                    currentPage === 1 ? "disabled" : ""
                                  }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() =>
                                      handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                  >
                                    &laquo; Previous
                                  </button>
                                </li>

                                {/* First page */}
                                {currentPage > 3 && (
                                  <li className="page-item">
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(1)}
                                    >
                                      1
                                    </button>
                                  </li>
                                )}

                                {/* Ellipsis if needed */}
                                {currentPage > 4 && (
                                  <li className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                )}

                                {/* Middle pages */}
                                {Array.from(
                                  { length: Math.min(3, totalPages) },
                                  (_, i) => {
                                    let pageNum;
                                    if (currentPage <= 2) {
                                      pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 1) {
                                      pageNum = totalPages - 2 + i;
                                    } else {
                                      pageNum = currentPage - 1 + i;
                                    }

                                    if (pageNum > 0 && pageNum <= totalPages) {
                                      return (
                                        <li
                                          key={pageNum}
                                          className={`page-item ${
                                            currentPage === pageNum
                                              ? "active"
                                              : ""
                                          }`}
                                        >
                                          <button
                                            className="page-link"
                                            onClick={() =>
                                              handlePageChange(pageNum)
                                            }
                                          >
                                            {pageNum}
                                          </button>
                                        </li>
                                      );
                                    }
                                    return null;
                                  }
                                )}

                                {/* Ellipsis if needed */}
                                {currentPage < totalPages - 2 &&
                                  totalPages > 3 && (
                                    <li className="page-item disabled">
                                      <span className="page-link">...</span>
                                    </li>
                                  )}

                                {/* Last page if not already shown */}
                                {currentPage < totalPages - 1 &&
                                  totalPages > 1 && (
                                    <li className="page-item">
                                      <button
                                        className="page-link"
                                        onClick={() =>
                                          handlePageChange(totalPages)
                                        }
                                      >
                                        {totalPages}
                                      </button>
                                    </li>
                                  )}

                                <li
                                  className={`page-item ${
                                    currentPage === totalPages ? "disabled" : ""
                                  }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() =>
                                      handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                  >
                                    Next &raquo;
                                  </button>
                                </li>
                              </ul>
                            </nav>
                          </div>
                        </div>
                      )}
                    </div>

                    {filteredExpenses.length === 0 && (
                      <div className="text-center py-5">
                        <div className="py-4">
                          <FileText size={48} className="text-muted mb-3" />
                          <h5 className="text-muted">No transactions found</h5>
                          <p className="text-muted">
                            Try adjusting your filters or add a new expense
                          </p>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Expense Details Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="xl"
          className="expense-modal"
        >
          {selectedExpense && (
            <>
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
                    <Eye size={24} className="text-white" />
                  </div>
                  <div>
                    Expense Details
                    <div className="text-muted fw-normal small">
                      Reference ID: #{selectedExpense.id}
                    </div>
                  </div>
                </h5>
              </Modal.Header>

              <Modal.Body className="px-4 py-4">
                {/* Header with description and amount */}
                <div className="d-flex justify-content-between align-items-start mb-4 p-4 bg-primary bg-opacity-10 border-0 rounded-3">
                  <div className="flex-grow-1 me-3">
                    <h6 className="mb-1 fw-bold text-dark">
                      {selectedExpense.description}
                    </h6>
                    <small className="text-muted">
                      Created on{" "}
                      <DateTimeDisplay date={selectedExpense.createdAt} />
                    </small>
                  </div>
                  <div className="text-end">
                    <h5 className="mb-0 text-success fw-bold">
                      {selectedExpense.amount.toLocaleString()} KES
                    </h5>
                    <small className="text-muted">Base currency</small>
                  </div>
                </div>

                <Row className="gy-4">
                  {/* Expense Information */}
                  <Col md={6}>
                    <Card className="border shadow-sm h-100">
                      <Card.Body>
                        {/* Section Header */}
                        <div className="d-flex align-items-center mb-3 bg-primary border-start border-primary border-3 bg-opacity-10 p-3 rounded-3">
                          <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                            <FileText size={18} className="text-primary" />
                          </div>
                          <h6 className="mb-0 fw-semibold">
                            Expense Information
                          </h6>
                        </div>

                        <div className="detail-list small">
                          {/* Submission Details */}
                          <div className="bg-warning bg-opacity-10 p-2 rounded-3 border-start border-warning border-3">
                            <h6 className="text-muted fw-semibold small mb-2">
                              Submission
                            </h6>
                            <div className="detail-item">
                              <span className="detail-label">Submitted On</span>
                              <span className="detail-value">
                                <DateTimeDisplay
                                  date={selectedExpense.createdAt}
                                />
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Last Updated</span>
                              <span className="detail-value">
                                <DateTimeDisplay
                                  date={selectedExpense.updatedAt}
                                  isHighlighted={
                                    selectedExpense.updatedAt !==
                                    selectedExpense.createdAt
                                  }
                                />
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">
                                Reference Number
                              </span>
                              <span className="detail-value">
                                {selectedExpense.referenceNumber ? (
                                  <code className="bg-light px-2 py-1 rounded">
                                    {selectedExpense.referenceNumber}
                                  </code>
                                ) : (
                                  "N/A"
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Classification */}
                          <div className="bg-warning bg-opacity-10 p-2 rounded-3 border-start border-warning border-3">
                            <h6 className="text-muted fw-semibold small mb-2">
                              Classification
                            </h6>
                            <div className="detail-item">
                              <span className="detail-label">Category</span>
                              <span className="detail-value">
                                {selectedExpense.category?.name || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Department</span>
                              <span className="detail-value">
                                {selectedExpense.department?.name || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Region</span>
                              <span className="detail-value">
                                {selectedExpense.region?.name || "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Payment */}
                          <div className="bg-warning bg-opacity-10 p-2 rounded-3 border-start border-warning border-3">
                            <h6 className="text-muted fw-semibold small mb-2">
                              Payment
                            </h6>
                            <div className="detail-item">
                              <span className="detail-label">
                                Payment Method
                              </span>
                              <span className="detail-value">
                                {selectedExpense.paymentMethod?.name || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Payee ID</span>
                              <span className="detail-value">
                                {selectedExpense.payeeId || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">
                                Exchange Rate
                              </span>
                              <span className="detail-value">
                                {selectedExpense.exchangeRateUsed
                                  ? Number(
                                      selectedExpense.exchangeRateUsed
                                    ).toFixed(2)
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Approval Details */}
                  <Col md={6}>
                    <Card className="border shadow-sm h-100">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3 bg-success border-start border-success border-3 bg-opacity-10 p-3 rounded-3">
                          <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                            <CheckCircle size={18} className="text-success" />
                          </div>
                          <h6 className="mb-0 fw-semibold">Approval Process</h6>
                        </div>

                        {selectedExpense.expenseSteps.length > 0 ? (
                          <div className="approval-timeline">
                            {selectedExpense.expenseSteps.map((s) => {
                              const statusText = normalizeStatus(s.status);

                              // Determine approver name based on status and nextApprovers
                              let name = "Pending approval";
                              if (s.approver?.firstName || s.approver?.lastName) {
                                // If already approved/rejected, show who did it
                                name = `${s.approver?.firstName ?? ""} ${s.approver?.lastName ?? ""}`.trim();
                              } else if (s.nextApprovers && s.nextApprovers.length > 0) {
                                // If pending, show who can approve
                                name = s.nextApprovers.map(u => `${u.firstName} ${u.lastName}`).join(", ");
                              }

                              // Use hierarchy name if available
                              const role = s.hierarchyName ?? s.role?.name ?? s.workflowStep?.role?.name ?? "No role";

                              return (
                                <div className="timeline-item" key={s.id}>
                                  <div className="timeline-marker">
                                    <div
                                      className={`status-indicator ${statusText.toLowerCase()}`}
                                    ></div>
                                  </div>
                                  <div className="timeline-content">
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                      <div>
                                        <strong className="d-block">
                                          Step {s.order}
                                          {s.isOptional && (
                                            <span className="text-muted">
                                              {" "}
                                              (Optional)
                                            </span>
                                          )}
                                        </strong>
                                        <small className="text-muted">
                                          {role}
                                        </small>
                                      </div>
                                      <Badge
                                        bg={
                                          statusText === "APPROVED"
                                            ? "success"
                                            : statusText === "REJECTED"
                                            ? "danger"
                                            : statusText === "PENDING"
                                            ? "warning"
                                            : "secondary"
                                        }
                                        className="text-uppercase py-2"
                                      >
                                        {statusText}
                                      </Badge>
                                    </div>

                                    <div className="approver-info">
                                      <small className="text-muted">
                                        <Person className="me-1" size={12} />
                                        {name}
                                      </small>
                                    </div>

                                    {s.comments && (
                                      <div className="comments-box mt-2 p-2 bg-light rounded">
                                        <small className="text-muted">
                                          <ChatLeftText
                                            className="me-1"
                                            size={12}
                                          />
                                          {s.comments}
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted">
                            <FileEarmarkX size={32} className="mb-2" />
                            <p className="mb-0">No approval steps found</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Modal.Body>

              <Modal.Footer
                className="border-0 pt-0 px-4 pb-4"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setShowModal(false)}
                  className="rounded-pill px-4 py-2 fw-semibold"
                >
                  Close
                </Button>

                <Button
                  href={`/data/approval-details/${selectedExpense.id}`}
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2 shadow-sm rounded-pill px-4 py-2 fw-semibold"
                >
                  <Eye size={16} className="mb-0" />
                  View Approval Details
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* Custom CSS */}
        <style jsx>{`
          .dashboard-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-attachment: fixed;
            min-height: 100vh;
            position: relative;
          }
          .dashboard-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg,
              rgba(102, 126, 234, 0.1) 0%,
              rgba(118, 75, 162, 0.1) 100%);
            backdrop-filter: blur(10px);
            z-index: -1;
          }

          /* Horizontal Filter Styles */
          .filters-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 0.75rem;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .filter-header-bar {
            background: rgba(248, 249, 250, 0.8);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(222, 226, 230, 0.3);
          }
          .filter-item {
            background: white;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
            height: 100%;
          }
          .filter-item:hover {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }
          .filter-label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            color: #6c757d;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .form-select-modern,
          .form-control-modern {
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
            transition: all 0.2s ease;
            background-color: white;
          }
          .form-select-modern:focus,
          .form-control-modern:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.1);
            background-color: white;
          }
          .btn-modern {
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s ease;
            border-width: 1.5px;
          }
          .btn-modern:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          /* Enhanced Table Styles */
          .transactions-table {
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .transactions-table tr {
            cursor: pointer;
            transition: all 0.3s ease;
            border-bottom: 1px solid #f1f3f4;
          }
          .transactions-table tr:hover {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
          }
          .transactions-table tr:last-child {
            border-bottom: none;
          }
          .transactions-table td {
            border-top: none;
            vertical-align: middle;
            padding: 1.25rem 1rem;
            position: relative;
          }
          .transactions-table th {
            border: none;
            padding: 1rem;
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            font-weight: 700;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.75rem;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .transactions-table th:first-child {
            border-top-left-radius: 0.75rem;
          }
          .transactions-table th:last-child {
            border-top-right-radius: 0.75rem;
          }

          /* Enhanced Element Styles */
          .category-badge {
            font-size: 0.75rem;
            border: 1px solid rgba(0, 123, 255, 0.2);
            transition: all 0.2s ease;
          }
          .category-badge:hover {
            background: rgba(0, 123, 255, 0.15) !important;
            transform: scale(1.05);
          }
          .transaction-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
            border: 1px solid #dee2e6;
            transition: all 0.2s ease;
          }
          .transaction-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .avatar-sm {
            width: 36px;
            height: 36px;
            font-size: 0.8rem;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          .avatar-sm:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }

          /* Progress Enhancement */
          .step-pill {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.2s ease;
          }
          .step-pill:hover {
            transform: scale(1.2);
          }

          /* Badge Enhancement */
          .badge {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          /* Modern Search Enhancement */
          .modern-search-container {
            width: 100%;
          }
          .search-input-wrapper {
            position: relative;
            background: white;
            border-radius: 0.75rem;
            border: none;
            transition: all 0.3s ease;
            overflow: hidden;
          }
          .search-input-wrapper:hover {
            transform: translateY(-1px);
          }
          .search-input-wrapper:focus-within {
            transform: translateY(-1px);
          }
          .search-icon-external {
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .search-icon-external:hover {
            background: #e9ecef;
            transform: scale(1.05);
          }
          .modern-search-input {
            border: none !important;
            padding: 0.75rem 3rem 0.75rem 1rem;
            font-size: 0.95rem;
            background: transparent;
            outline: none;
            box-shadow: none !important;
            border-radius: 0;
          }
          .modern-search-input::placeholder {
            color: #adb5bd;
            font-style: italic;
          }
          .modern-search-input:focus::placeholder {
            color: #6c757d;
          }
          .clear-search-btn {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            font-size: 1.1rem;
            cursor: pointer;
            z-index: 5;
            padding: 0.25rem;
            border-radius: 50%;
            transition: all 0.2s ease;
          }
          .clear-search-btn:hover {
            color: #dc3545;
            background: rgba(220, 53, 69, 0.1);
            transform: translateY(-50%) scale(1.1);
          }
          .search-suggestions {
            position: absolute;
            bottom: -1.75rem;
            left: 0;
            right: 0;
            z-index: 4;
          }
          .search-suggestion-text {
            font-size: 0.7rem;
            color: #6c757d;
            font-style: italic;
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          .search-input-wrapper:focus-within .search-suggestion-text {
            opacity: 1;
          }
          .search-results-count {
            margin-top: 0.5rem;
            padding: 0.25rem 0.75rem;
            background: rgba(0, 123, 255, 0.05);
            border-radius: 0.5rem;
            border-left: 3px solid #007bff;
            animation: slideInFromTop 0.3s ease;
          }
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Card Enhancement */
          .card {
            border: none;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .card:hover {
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .transaction-icon-lg {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .search-box {
            position: relative;
            width: 200px;
          }
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
          }
          .detail-section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            height: 100%;
          }
          .section-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6c757d;
            margin-bottom: 1rem;
          }

          /* Step strip in table */
          .step-strip {
            display: flex;
            gap: 6px;
            align-items: center;
          }
          .step-pill {
            display: inline-block;
            width: 16px;
            height: 10px;
            border-radius: 999px;
            opacity: 0.95;
          }

          /* Timeline */
          .activity-timeline {
            position: relative;
            padding-left: 20px;
          }
          .activity-item {
            position: relative;
            padding-bottom: 20px;
          }
          .activity-badge {
            position: absolute;
            left: -20px;
            top: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid #fff;
          }
          .activity-badge.success {
            background-color: #198754;
          }
          .activity-badge.danger {
            background-color: #dc3545;
          }
          .activity-badge.primary {
            background-color: #0d6efd;
          }
          .activity-content {
            padding-left: 10px;
          }
          .activity-item:not(:last-child):after {
            content: "";
            position: absolute;
            left: -16px;
            top: 12px;
            bottom: 0;
            width: 2px;
            background-color: #e9ecef;
          }
          .transactions-table {
            font-size: 0.9rem;
          }
          .transactions-table th {
            border-top: none;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
            color: #6c757d;
            padding: 1rem 0.75rem;
          }
          .transactions-table td {
            padding: 1rem 0.75rem;
            vertical-align: middle;
          }
          .transactions-table tr {
            transition: all 0.2s ease;
          }
          .transactions-table tr:hover {
            background-color: #f8f9fa;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
          }
          .cursor-pointer {
            cursor: pointer;
          }
          .transaction-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .avatar-sm {
            width: 32px;
            height: 32px;
            font-size: 0.8rem;
          }
          .step-strip .step-pill {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 2px;
          }
          .step-pill.approved {
            background-color: #198754;
          }
          .step-pill.pending {
            background-color: #ffc107;
          }
          .step-pill.rejected {
            background-color: #dc3545;
          }
          .step-pill.not-started {
            background-color: #6c757d;
          }
          .expense-modal :global(.modal-content) {
            border-radius: 12px;
            border: none;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .expense-modal :global(.modal-header) {
            padding: 1.5rem 1.5rem 0;
          }
          .expense-modal :global(.modal-body) {
            padding: 1rem 1.5rem;
          }
          .expense-modal :global(.modal-footer) {
            padding: 0 1.5rem 1.5rem;
          }
          .modal-icon-wrapper {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .detail-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .detail-label {
            font-weight: 500;
            color: #6c757d;
            flex: 0 0 40%;
          }
          .detail-value {
            flex: 0 0 60%;
            text-align: right;
          }
          .avatar-sm {
            width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }
          .approval-timeline {
            position: relative;
            padding-left: 1.5rem;
          }
          .approval-timeline::before {
            content: "";
            position: absolute;
            left: 11px;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #e9ecef;
          }
          .timeline-item {
            position: relative;
            margin-bottom: 1.25rem;
          }
          .timeline-marker {
            position: absolute;
            left: -1.5rem;
            top: 0.25rem;
          }
          .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 0 2px #dee2e6;
          }
          .status-indicator.approved {
            background-color: #198754;
          }
          .status-indicator.rejected {
            background-color: #dc3545;
          }
          .status-indicator.pending {
            background-color: #ffc107;
          }
          .status-indicator.not-started {
            background-color: #6c757d;
          }
          .timeline-content {
            padding: 0.5rem 0.75rem;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .comments-box {
            border-left: 3px solid #dee2e6;
          }

          /* Analytics Dashboard Styles */
          .analytics-card {
            transition: all 0.3s ease;
            height: 100%;
            position: relative;
            overflow: hidden;
          }
          .analytics-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }
          .analytics-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
          }
          .chart-container {
            position: relative;
            background: white;
            border-radius: 0.5rem;
            padding: 1rem;
            border: 1px solid rgba(0,0,0,0.05);
          }
          .chart-container .bg-primary {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .chart-container .bg-primary:hover {
            transform: scaleY(1.1);
            filter: brightness(1.1);
          }
          .chart-bar:hover {
            transform: scaleY(1.05) !important;
            filter: brightness(1.1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .category-breakdown .progress {
            background-color: rgba(0,0,0,0.05);
            border-radius: 3px;
          }
          .category-breakdown .progress-bar {
            transition: width 0.8s ease;
            border-radius: 3px;
          }
          .status-overview .badge {
            font-size: 0.7rem;
            font-weight: 500;
          }

          /* Timeline Visualization Styles */
          .approval-timeline-compact {
            background: rgba(248, 249, 250, 0.5);
            border: 1px solid rgba(222, 226, 230, 0.3);
            min-width: 200px;
          }
          .timeline-node {
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .timeline-node:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .timeline-node.approved {
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
          }
          .timeline-node.rejected {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
          }
          .timeline-node.pending {
            background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
            animation: pulse 2s infinite;
          }
          .timeline-node.not_started {
            background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%);
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
          .steps-flow {
            padding: 0.5rem;
            background: white;
            border-radius: 0.5rem;
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          .current-step-info {
            background: rgba(255, 193, 7, 0.1);
            border-radius: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-left: 3px solid #ffc107;
          }

          /* Bulk Operations Styles */
          .bulk-actions-bar {
            animation: slideInFromTop 0.3s ease;
            transition: all 0.3s ease;
          }
          .table-active {
            background-color: rgba(13, 110, 253, 0.1) !important;
            border-left: 3px solid #0d6efd;
          }
          .table-active:hover {
            background-color: rgba(13, 110, 253, 0.15) !important;
          }
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
