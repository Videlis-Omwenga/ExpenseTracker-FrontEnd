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
  ProgressBar,
} from "react-bootstrap";
import {
  Clock,
  FileText,
  CheckCircle,
  ClockHistory,
  ArrowRepeat,
  XCircle,
  Circle,
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
  GraphUp,
  GraphUpArrow,
  Calendar,
  Award,
  Activity,
  Share,
  Printer,
  FiletypeXlsx,
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

const countCompletedSteps = (steps: ExpenseStep[]) =>
  steps.filter((s) =>
    ["APPROVED", "REJECTED"].includes(normalizeStatus(s.status))
  ).length;

const getProgressPercent = (steps: ExpenseStep[]) => {
  if (!steps?.length) return 0;

  // If any step is rejected, stop progress calculation at that point
  const hasRejectedStep = steps.some(
    (step) => normalizeStatus(step.status) === "REJECTED"
  );
  if (hasRejectedStep) {
    // Find the index of the rejected step and calculate progress up to that point
    const rejectedIndex = steps.findIndex(
      (step) => normalizeStatus(step.status) === "REJECTED"
    );
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
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(
    new Set()
  );
  const [showBulkActions, setShowBulkActions] = useState(false);

  const router = useRouter();
  const handleNavigation = (path: string) => router.push(path);

  // Log budgetSummary when it changes
  useEffect(() => { }, [budgetSummary]);

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
              const roleObj = stepObj.role as
                | Record<string, unknown>
                | undefined;
              const approverObj = stepObj.approver as
                | Record<string, unknown>
                | undefined;
              const nextApproversArr = stepObj.nextApprovers as
                | unknown[]
                | undefined;

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
                hierarchyName: stepObj.hierarchyName
                  ? String(stepObj.hierarchyName)
                  : null,
                level: Number(stepObj.order ?? 0),
              };
            })
            : [];

          // Map related entities
          const currencyObj = item.currency as
            | Record<string, unknown>
            | undefined;
          const currency = currencyObj
            ? {
              id: Number(currencyObj.id ?? 0),
              currency: String(currencyObj.currency ?? ""),
              initials: String(currencyObj.initials ?? ""),
              rate: Number(currencyObj.rate ?? 1),
            }
            : null;

          const categoryObj = item.category as
            | Record<string, unknown>
            | undefined;
          const category = categoryObj
            ? {
              id: Number(categoryObj.id ?? 0),
              name: String(categoryObj.name ?? ""),
            }
            : null;

          const departmentObj = item.department as
            | Record<string, unknown>
            | undefined;
          const department = departmentObj
            ? {
              id: Number(departmentObj.id ?? 0),
              name: String(departmentObj.name ?? ""),
            }
            : null;

          const paymentMethodObj = item.paymentMethod as
            | Record<string, unknown>
            | undefined;
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
            referenceNumber: item.referenceNumber
              ? String(item.referenceNumber)
              : null,
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
    const thisMonthExpenses = expenses.filter(
      (e) => new Date(e.createdAt) >= thisMonth
    );
    const lastMonthExpenses = expenses.filter(
      (e) =>
        new Date(e.createdAt) >= lastMonth && new Date(e.createdAt) < thisMonth
    );
    const thisYearExpenses = expenses.filter(
      (e) => new Date(e.createdAt) >= thisYear
    );

    // Calculate totals
    const thisMonthTotal = thisMonthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const lastMonthTotal = lastMonthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const thisYearTotal = thisYearExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Status breakdown
    const statusBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category spending
    const categorySpending = expenses.reduce((acc, expense) => {
      const category = expense.category?.name || "Uncategorized";
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Top categories (only first 2)
    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthExpenses = expenses.filter(
        (e) =>
          new Date(e.createdAt) >= date && new Date(e.createdAt) < nextMonth
      );
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      monthlyTrend.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: total,
        count: monthExpenses.length,
      });
    }

    // Calculate growth
    const monthlyGrowth =
      lastMonthTotal === 0
        ? 0
        : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

    // Average expense
    const averageExpense =
      expenses.length > 0
        ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length
        : 0;

    // Pending approvals count
    const pendingCount = expenses.filter((e) =>
      e.expenseSteps.some((step) => normalizeStatus(step.status) === "PENDING")
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
      totalExpenses: expenses.length,
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
      const allIds = new Set(currentItems.map((expense) => expense.id));
      setSelectedExpenses(allIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkExport = () => {
    const selectedData = currentItems.filter((e) => selectedExpenses.has(e.id));
    const csvContent = [
      ["ID", "Date", "Payee", "Category", "Description", "Amount", "Status"],
      ...selectedData.map((e) => [
        e.id,
        new Date(e.createdAt).toLocaleDateString(),
        e.payee,
        e.category?.name || "N/A",
        e.description,
        e.amount,
        e.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected_expenses_${new Date().toISOString().split("T")[0]
      }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedExpenses.size} selected expenses!`);
  };

  const handleBulkFilter = (filterType: string) => {
    const selectedData = currentItems.filter((e) => selectedExpenses.has(e.id));
    switch (filterType) {
      case "pending":
        setStatusFilter("PENDING");
        break;
      case "approved":
        setStatusFilter("APPROVED");
        break;
      case "rejected":
        setStatusFilter("REJECTED");
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
        {/* Header with enhanced buttons */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                  <Clipboard2Data className="text-primary" size={28} />
                </div>
                <div>
                  <h5 className="fw-bold text-primary mb-0">My Expenses</h5>
                  <p className="text-muted mb-0 small">
                    Track and manage your expense submissions
                  </p>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                className="header-btn btn-create"
                onClick={() => handleNavigation("create-expense")}
              >
                <div className="btn-content">
                  <PlusCircle size={14} className="btn-icon" />
                  <span>New Expense</span>
                </div>
              </Button>

              <Button
                variant="light"
                size="sm"
                className="header-btn btn-export"
                onClick={() => {
                  const csvContent = [
                    [
                      "ID",
                      "Date",
                      "Payee",
                      "Category",
                      "Description",
                      "Amount",
                      "Status",
                    ],
                    ...filteredExpenses.map((e) => [
                      e.id,
                      new Date(e.createdAt).toLocaleDateString(),
                      e.payee,
                      e.category?.name || "N/A",
                      e.description,
                      e.amount,
                      e.status,
                    ]),
                  ]
                    .map((row) => row.join(","))
                    .join("\n");
                  const blob = new Blob([csvContent], {
                    type: "text/csv",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `expenses_${new Date().toISOString().split("T")[0]
                    }.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Expenses exported successfully!");
                }}
              >
                <div className="btn-content">
                  <FiletypeXlsx size={14} className="btn-icon" />
                  <span>Export CSV</span>
                </div>
              </Button>

              <Button
                variant="light"
                size="sm"
                className="header-btn btn-budget"
                onClick={() => window.print()}
              >
                <div className="btn-content">
                  <Printer size={14} className="btn-icon" />
                  <span>Budget Overview</span>
                </div>
              </Button>

              <Button
                variant="light"
                size="sm"
                className="header-btn btn-share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "My Expenses Summary",
                      text: `I have ${expenses.length
                        } expenses totaling KES ${expenses
                          .reduce((sum, e) => sum + e.amount, 0)
                          .toLocaleString()}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Page URL copied to clipboard!");
                  }
                }}
              >
                <div className="btn-content">
                  <Share size={14} className="btn-icon" />
                  <span>Share</span>
                </div>
              </Button>

              <Button
                size="sm"
                variant="primary"
                className="header-btn btn-refresh"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <div className="btn-content">
                  {refreshing ? (
                    <Spinner animation="border" size="sm" className="btn-icon" />
                  ) : (
                    <ArrowRepeat size={16} className="btn-icon" />
                  )}
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </div>
              </Button>
            </div>
          </div>
          <hr className="border-2 border-primary opacity-25 mb-4" />
        </div>

        {/* Analytics Dashboard */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm rounded-3 analytics-card-wrap">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4 pb-3">
                  <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                    <GraphUp size={24} className="text-info" />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Expense Analytics</h6>
                    <p className="text-muted mb-0 small">
                      Insights and trends from your expense data
                    </p>
                  </div>
                </div>

                {/* New 3-column analytics grid: hero / metrics / category */}
                <div className="analytics-grid-three">
                  {/* LEFT: Hero + small sparkline */}
                  <div className="analytics-hero card-compact p-3 rounded-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div className="text-muted small">This Month</div>
                        <div className="hero-value fw-bold">
                          KES {analyticsData.thisMonthTotal.toLocaleString()}
                        </div>
                        <div
                          className={`hero-trend ${analyticsData.monthlyGrowth >= 0 ? "positive" : "negative"
                            }`}
                        >
                          {analyticsData.monthlyGrowth >= 0 ? "▲" : "▼"}{" "}
                          {Math.abs(analyticsData.monthlyGrowth).toFixed(1)}% vs
                          last month
                        </div>
                      </div>
                      <div className="hero-mini">
                        <div className="mini-icon bg-primary bg-opacity-10 rounded-circle p-2">
                          <GraphUpArrow className="text-primary" size={22} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 sparkline-wrapper">
                      {analyticsData.monthlyTrend.map((d, i) => {
                        const max = Math.max(
                          ...analyticsData.monthlyTrend.map((t) => t.amount),
                          1
                        );
                        const height = Math.max((d.amount / max) * 40, 4);
                        return (
                          <div
                            key={i}
                            className="sparkline-bar"
                            style={{ height: `${height}px` }}
                            title={`${d.month}: KES ${d.amount.toLocaleString()}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* MIDDLE: Full metrics grid (restore all original cards + BudgetOverview) */}
                  <div className="metrics-grid-expanded">
                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-primary bg-opacity-10 rounded-circle me-3 p-2">
                          <GraphUpArrow className="text-primary" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">This Month</div>
                          <div className="fw-bold">
                            KES {analyticsData.thisMonthTotal.toLocaleString()}
                          </div>
                          <div className="text-muted small">
                            {analyticsData.lastMonthTotal > 0
                              ? `${analyticsData.monthlyGrowth >= 0 ? "+" : ""}${analyticsData.monthlyGrowth.toFixed(1)}% vs last month`
                              : "First month data"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-success bg-opacity-10 rounded-circle me-3 p-2">
                          <Calendar className="text-success" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">This Year</div>
                          <div className="fw-bold">
                            KES {analyticsData.thisYearTotal.toLocaleString()}
                          </div>
                          <div className="text-muted small">
                            {analyticsData.totalExpenses} expenses
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-warning bg-opacity-10 rounded-circle me-3 p-2">
                          <Activity className="text-warning" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">Average</div>
                          <div className="fw-bold">
                            KES {Math.round(analyticsData.averageExpense).toLocaleString()}
                          </div>
                          <div className="text-muted small">per expense</div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-danger bg-opacity-10 rounded-circle me-3 p-2">
                          <Clock className="text-danger" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">Pending</div>
                          <div className="fw-bold">{analyticsData.pendingCount}</div>
                          <div className="text-muted small">awaiting approval</div>
                        </div>
                      </div>
                    </div>

                    {/* Restore original budget/spend/remaining/utilization cards */}
                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-primary bg-opacity-10 rounded-circle me-3 p-2">
                          <CashStack className="text-primary" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">Monthly Budget</div>
                          <div className="fw-bold">
                            KES {(budgetSummary?.totalBudget || 0).toLocaleString()}
                          </div>
                          <div className="text-muted small">Budget overview</div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-success bg-opacity-10 rounded-circle me-3 p-2">
                          <BarChart className="text-warning" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">Spent</div>
                          <div className="fw-bold">
                            KES {(budgetSummary?.totalSpent || 0).toLocaleString()}
                          </div>
                          <div className="text-muted small">Total spent</div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-info bg-opacity-10 rounded-circle me-3 p-2">
                          <Wallet2 className="text-success" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">Remaining</div>
                          <div className="fw-bold">
                            KES {(budgetSummary?.totalRemaining || 0).toLocaleString()}
                          </div>
                          <div className="text-muted small">Budget remaining</div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card card-compact p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="metric-icon bg-warning bg-opacity-10 rounded-circle me-3 p-2">
                          <PieChart className="text-info" size={18} />
                        </div>
                        <div>
                          <div className="text-muted small">Utilization</div>
                          <div className="fw-bold">
                            {budgetSummary?.overallUtilization?.toFixed(1) || 0}%
                          </div>
                          <div className="text-muted small">of budget used</div>
                        </div>
                      </div>
                    </div>

                    {/* Keep BudgetOverview component (original) */}
                    <div className="metric-card card-compact p-3 rounded-3">
                      <BudgetOverview />
                    </div>
                  </div>

                  {/* RIGHT: Category Breakdown & Status Overview (filled) */}
                  <div className="category-column p-3 bg-light bg-opacity-50 rounded-3">
                    <h6 className="fw-bold mb-3">
                      <PieChart className="me-2" size={16} />
                      Top Categories
                    </h6>

                    <div className="category-breakdown">
                      {analyticsData.topCategories.length > 0 ? (
                        analyticsData.topCategories.map(([category, amount], index) => {
                          const totalSpending = analyticsData.thisYearTotal || 1;
                          const percentage = (amount / totalSpending) * 100;
                          const colors = ["primary", "success"];
                          const color = colors[index] || "primary";

                          return (
                            <div key={category} className="mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center">
                                  <Tag size={12} className={`text-${color} me-2`} />
                                  <span className="fw-medium">{category}</span>
                                </div>
                                <span className="small text-muted fw-bold">KES {amount.toLocaleString()}</span>
                              </div>

                              <div className="progress mb-2" style={{ height: "8px", background: "rgba(0,0,0,0.04)" }}>
                                <div
                                  className={`progress-bar bg-${color}`}
                                  style={{
                                    width: `${Math.max(percentage, 3)}%`,
                                    background: `linear-gradient(135deg, var(--bs-${color}) 0%, var(--bs-${color === "primary" ? "info" : "warning"}) 100%)`,
                                  }}
                                />
                              </div>

                              <div className="d-flex justify-content-between">
                                <small className="text-muted">{percentage.toFixed(1)}% of total</small>
                                <small className="text-muted">
                                  {Math.max(1, Math.round(amount / (analyticsData.averageExpense || 1)))} expenses
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
                        {Object.entries(analyticsData.statusBreakdown).length > 0 ? (
                          Object.entries(analyticsData.statusBreakdown).map(([status, count]) => {
                            const badge = statusBadge(status);
                            const percentage = analyticsData.totalExpenses ? (count / analyticsData.totalExpenses) * 100 : 0;
                            return (
                              <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center">
                                  <Badge bg={badge.bg} className="me-2 d-inline-flex align-items-center py-1 px-2 rounded-pill">
                                    {badge.icon}
                                    <span className="ms-1 small">{badge.label}</span>
                                  </Badge>
                                  <div className="small text-muted ms-2">{status}</div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-bold">{count}</div>
                                  <small className="text-muted ms-1">({percentage.toFixed(0)}%)</small>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center text-muted small">No status data</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keep existing monthly trend chart block below (unchanged logic/markup) */}
                <div className="mt-4">
                  {/* ...existing monthly trend + category breakdown code (unchanged logic) ... */}
                </div>
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
                      <div className="search-icon-external">
                        <Search size={18} className="text-primary" />
                      </div>
                      <div className="flex-grow-1">
                        <Form.Control
                          type="search"
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
              <div className="filters-section mt-4">
                <div className="filter-header-bar d-flex align-items-center justify-content-between mb-4 p-3 rounded-4 shadow-sm"
                  style={{
                    background: '#e7f1ff',
                    border: '1px solid #b8d4fe'
                  }}>
                  <div className="d-flex align-items-center">
                    <div className="bg-primary p-2 rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px' }}>
                      <Funnel className="text-white" size={18} />
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">Advanced Filters</h6>
                      <small className="text-primary">Refine your search results</small>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-pill border px-4 py-2 fw-semibold shadow-sm"
                    style={{
                      background: 'white',
                      color: '#0d6efd',
                      borderColor: '#0d6efd',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0d6efd';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#0d6efd';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
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
                    <ArrowRepeat className="me-2" size={14} />
                    Reset All
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-4 shadow-sm border border-light">
                  <Row className="g-4">
                    {/* Status Filter */}
                    <Col xs={12} sm={6} md={2}>
                      <div className="filter-item">
                        <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-secondary"
                          style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                          <div className="bg-primary bg-opacity-10 p-1 rounded-circle me-2">
                            <Circle className="text-primary" size={12} />
                          </div>
                          Status
                        </label>
                        <Form.Select
                          size="sm"
                          className="form-select-modern border-2 rounded-3 shadow-sm"
                          style={{
                            borderColor: '#e0e7ff',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(102, 126, 234, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e0e7ff';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="All Statuses">All Statuses</option>
                          <option value="PENDING">⏳ Pending</option>
                          <option value="APPROVED">✓ Approved</option>
                          <option value="REJECTED">✗ Rejected</option>
                          <option value="PAID">💰 Paid</option>
                        </Form.Select>
                      </div>
                    </Col>

                    {/* Category Filter */}
                    <Col xs={12} sm={6} md={2}>
                      <div className="filter-item">
                        <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-secondary"
                          style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                          <div className="bg-success bg-opacity-10 p-1 rounded-circle me-2">
                            <Tag className="text-success" size={12} />
                          </div>
                          Category
                        </label>
                        <Form.Select
                          size="sm"
                          className="form-select-modern border-2 rounded-3 shadow-sm"
                          style={{
                            borderColor: '#dcfce7',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(16, 185, 129, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#dcfce7';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          <option value="All Categories">All Categories</option>
                          {uniqueCategories.map((category) => (
                            <option key={category} value={category}>
                              🏷️ {category}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </Col>

                    {/* Amount Range */}
                    <Col xs={12} sm={6} md={3}>
                      <div className="filter-item">
                        <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-secondary"
                          style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                          <div className="bg-warning bg-opacity-10 p-1 rounded-circle me-2">
                            <CashStack className="text-warning" size={12} />
                          </div>
                          Amount Range (KES)
                        </label>
                        <Row className="g-2">
                          <Col xs={6}>
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Min"
                              value={minAmount}
                              onChange={(e) => setMinAmount(e.target.value)}
                              className="form-control-modern border-2 rounded-3 shadow-sm"
                              style={{
                                borderColor: '#fef3c7',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                transition: 'all 0.3s ease'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#f59e0b';
                                e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(245, 158, 11, 0.25)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#fef3c7';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </Col>
                          <Col xs={6}>
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Max"
                              value={maxAmount}
                              onChange={(e) => setMaxAmount(e.target.value)}
                              className="form-control-modern border-2 rounded-3 shadow-sm"
                              style={{
                                borderColor: '#fef3c7',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                transition: 'all 0.3s ease'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#f59e0b';
                                e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(245, 158, 11, 0.25)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#fef3c7';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </Col>
                        </Row>
                      </div>
                    </Col>

                    {/* Approval Process Filter */}
                    <Col xs={12} sm={6} md={3}>
                      <div className="filter-item">
                        <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-secondary"
                          style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                          <div className="bg-info bg-opacity-10 p-1 rounded-circle me-2">
                            <CheckCircle className="text-info" size={12} />
                          </div>
                          Approval Process
                        </label>
                        <Form.Select
                          size="sm"
                          className="form-select-modern border-2 rounded-3 shadow-sm"
                          style={{
                            borderColor: '#dbeafe',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#0ea5e9';
                            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(14, 165, 233, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#dbeafe';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          value={approvalFilter}
                          onChange={(e) => setApprovalFilter(e.target.value)}
                        >
                          <option value="All Approval Status">All Status</option>
                          <option value="Fully Approved">✓ Fully Approved</option>
                          <option value="Pending Approval">⏳ Pending</option>
                          <option value="Has Rejections">✗ Has Rejections</option>
                          <option value="Not Started">○ Not Started</option>
                        </Form.Select>
                      </div>
                    </Col>

                    {/* Date Range Filter */}
                    <Col xs={12} sm={6} md={2}>
                      <div className="filter-item">
                        <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-secondary"
                          style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                          <div className="bg-danger bg-opacity-10 p-1 rounded-circle me-2">
                            <Clock className="text-danger" size={12} />
                          </div>
                          Date Range
                        </label>
                        <Form.Select
                          size="sm"
                          className="form-select-modern border-2 rounded-3 shadow-sm"
                          style={{
                            borderColor: '#fee2e2',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(239, 68, 68, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#fee2e2';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          value={dateRangeFilter}
                          onChange={(e) => setDateRangeFilter(e.target.value)}
                        >
                          <option value="All Time">📅 All Time</option>
                          <option value="Today">📆 Today</option>
                          <option value="This Week">📊 This Week</option>
                          <option value="This Month">📈 This Month</option>
                        </Form.Select>
                      </div>
                    </Col>
                  </Row>

                  {/* Active Filters Display */}
                  {(statusFilter !== "All Statuses" ||
                    categoryFilter !== "All Categories" ||
                    minAmount ||
                    maxAmount ||
                    approvalFilter !== "All Approval Status" ||
                    dateRangeFilter !== "All Time") && (
                      <div className="mt-3 pt-3 border-top">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <small className="text-muted fw-semibold me-2">Active Filters:</small>
                          {statusFilter !== "All Statuses" && (
                            <Badge bg="primary" className="rounded-pill px-3 py-2">
                              Status: {statusFilter}
                              <XCircle
                                size={12}
                                className="ms-2"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setStatusFilter("All Statuses")}
                              />
                            </Badge>
                          )}
                          {categoryFilter !== "All Categories" && (
                            <Badge bg="success" className="rounded-pill px-3 py-2">
                              Category: {categoryFilter}
                              <XCircle
                                size={12}
                                className="ms-2"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setCategoryFilter("All Categories")}
                              />
                            </Badge>
                          )}
                          {(minAmount || maxAmount) && (
                            <Badge bg="warning" className="rounded-pill px-3 py-2">
                              Amount: {minAmount || '0'} - {maxAmount || '∞'}
                              <XCircle
                                size={12}
                                className="ms-2"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setMinAmount("");
                                  setMaxAmount("");
                                }}
                              />
                            </Badge>
                          )}
                          {approvalFilter !== "All Approval Status" && (
                            <Badge bg="info" className="rounded-pill px-3 py-2">
                              Approval: {approvalFilter}
                              <XCircle
                                size={12}
                                className="ms-2"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setApprovalFilter("All Approval Status")}
                              />
                            </Badge>
                          )}
                          {dateRangeFilter !== "All Time" && (
                            <Badge bg="danger" className="rounded-pill px-3 py-2">
                              Date: {dateRangeFilter}
                              <XCircle
                                size={12}
                                className="ms-2"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setDateRangeFilter("All Time")}
                              />
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {showBulkActions && (
                <div className="bulk-actions-bar mt-3 p-3 bg-primary bg-opacity-10 rounded-3 border-start border-primary border-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center">
                      <CheckSquareFill
                        size={18}
                        className="text-primary me-2"
                      />
                      <span className="fw-bold text-primary">
                        {selectedExpenses.size} expense
                        {selectedExpenses.size > 1 ? "s" : ""} selected
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
                        onClick={() => handleBulkFilter("pending")}
                        className="d-flex align-items-center gap-1"
                      >
                        <Clock size={14} />
                        Filter Pending
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleBulkFilter("approved")}
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
                <div className="text-center py-5 px-4">
                  <div
                    className="d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: "400px" }}
                  >
                    <div className="mb-4" style={{ position: "relative" }}>
                      <div
                        className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "120px",
                          height: "120px",
                          position: "relative",
                        }}
                      >
                        <FileEarmarkX size={50} className="text-muted" />
                      </div>
                      <div
                        className="position-absolute bg-white rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "45px",
                          height: "45px",
                          bottom: "-5px",
                          right: "-5px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Search size={20} className="text-secondary" />
                      </div>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">
                      {searchQuery
                        ? "No Matching Expenses"
                        : "No Expenses Found"}
                    </h5>
                    <p
                      className="text-muted mb-5"
                      style={{ maxWidth: "300px" }}
                    >
                      {searchQuery
                        ? `We couldn't find any expenses matching "${searchQuery}". Try adjusting your search criteria.`
                        : "You haven't created any expenses yet. Start by creating your first expense to track spending."}
                    </p>
                    {searchQuery ? (
                      <div className="d-flex gap-2">
                        <Button
                          variant="primary"
                          onClick={() => setSearchQuery("")}
                          className="d-flex align-items-center gap-2"
                        >
                          <XCircleFill size={16} />
                          Clear Search
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() =>
                          (window.location.href =
                            "/expense-management/create-expense")
                          }
                          className="d-flex align-items-center gap-2"
                        >
                          <PlusCircle size={16} />
                          Create Expense
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                        (window.location.href =
                          "/expense-management/create-expense")
                        }
                        className="d-flex align-items-center gap-2"
                      >
                        <PlusCircle size={20} />
                        Create Your First Expense
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="border-0">
                  <Card.Body className="p-0">
                    <div className="table-responsive modern-table-wrapper">
                      <Table hover className="mb-0 transactions-table align-middle">
                        <thead className="table-header-modern">
                          <tr>
                            <th className="table-header-cell" style={{ width: "50px" }}>
                              <div className="header-content">
                                <Form.Check
                                  type="checkbox"
                                  checked={
                                    selectedExpenses.size ===
                                    currentItems.length &&
                                    currentItems.length > 0
                                  }
                                  onChange={handleSelectAll}
                                  id="select-all"
                                  className="modern-checkbox"
                                />
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <Tag size={12} className="me-1 text-primary" />
                                <span>ID</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <Clock size={12} className="me-1 text-primary" />
                                <span>Created</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <Person size={12} className="me-1 text-primary" />
                                <span>Payee</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <FileText size={12} className="me-1 text-primary" />
                                <span>Description</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <CashStack size={12} className="me-1 text-primary" />
                                <span>Amount</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <Person size={12} className="me-1 text-primary" />
                                <span>Requested By</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <Circle size={12} className="me-1 text-primary" />
                                <span>Status</span>
                              </div>
                            </th>
                            <th className="table-header-cell">
                              <div className="header-content">
                                <Tag size={12} className="me-1 text-primary" />
                                <span>Category</span>
                              </div>
                            </th>
                            <th className="table-header-cell" style={{ minWidth: 200 }}>
                              <div className="header-content">
                                <BarChart size={12} className="me-1 text-primary" />
                                <span>Approval Progress</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="table-body-modern">
                          {currentItems.map((expense, index) => {
                            const badge = statusBadge(expense.status);
                            const completed = countCompletedSteps(expense.expenseSteps);
                            const total = expense.expenseSteps.length;
                            const progress = getProgressPercent(expense.expenseSteps);
                            const isEven = index % 2 === 0;

                            return (
                              <tr
                                key={expense.id}
                                className={`table-row-modern ${selectedExpenses.has(expense.id) ? "row-selected" : ""
                                  } ${isEven ? "row-even" : "row-odd"}`}
                              >
                                <td
                                  className="table-cell"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedExpenses.has(expense.id)}
                                    onChange={() => handleSelectExpense(expense.id)}
                                    id={`expense-${expense.id}`}
                                    className="modern-checkbox"
                                  />
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="id-badge-modern">
                                      <div className="id-badge-icon">
                                        <Tag size={12} />
                                      </div>
                                      <span className="id-badge-text">#{expense.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="date-display">
                                      <DateTimeDisplay date={expense.createdAt} />
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="payee-info">
                                      <div className="payee-name fw-medium text-dark">
                                        {expense.payee}
                                      </div>
                                      <div className="payee-number text-muted small">
                                        {expense.payeeNumber}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="description-wrapper">
                                      <div
                                        className="description-text fw-medium"
                                        title={expense.description}
                                      >
                                        {expense.description}
                                      </div>
                                      {expense.region?.name && (
                                        <div className="region-tag">
                                          <span className="badge bg-light text-dark border">
                                            {expense.region.name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="amount-display">
                                      <div className="primary-amount text-success fw-bold">
                                        KES {expense?.amount?.toLocaleString() || "0.00"}
                                      </div>
                                      <div className="secondary-amount text-muted small">
                                        {expense?.primaryAmount?.toLocaleString() || "0.00"}{" "}
                                        {expense?.currency?.initials || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="requester-info">
                                      <div className="requester-avatar">
                                        <div className="avatar-circle">
                                          {expense.user.firstName[0]}
                                          {expense.user.lastName[0]}
                                        </div>
                                      </div>
                                      <div className="requester-name fw-medium">
                                        {expense.user.firstName} {expense.user.lastName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <Badge
                                      bg={badge.bg}
                                      className="status-badge"
                                    >
                                      {badge.icon}
                                      <span>{badge.label}</span>
                                    </Badge>
                                  </div>
                                </td>
                                <td
                                  className="table-cell cursor-pointer"
                                  onClick={() => handleViewDetails(expense)}
                                >
                                  <div className="cell-content">
                                    <div className="category-badge">
                                      <Tag className="me-1" size={11} />
                                      <span title={expense.category?.name || "Uncategorized"}>
                                        {expense.category?.name && expense.category.name.length > 10
                                          ? `${expense.category.name.substring(0, 10)}...`
                                          : expense.category?.name || "Uncategorized"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="table-cell">
                                  <div className="cell-content">
                                    <div className="approval-progress-modern">
                                      {expense.expenseSteps.length > 0 ? (
                                        <>
                                          <div className="progress-header">
                                            <span className="progress-label">
                                              {completed}/{total} Steps
                                            </span>
                                            <span className="progress-percentage">
                                              {progress}%
                                            </span>
                                          </div>
                                          <ProgressBar
                                            now={progress}
                                            variant={
                                              expense.expenseSteps.some(
                                                (step) => normalizeStatus(step.status) === "REJECTED"
                                              )
                                                ? "danger"
                                                : progress === 100
                                                  ? "success"
                                                  : "info"
                                            }
                                            className="progress-bar-modern"
                                            style={{ height: "6px" }}
                                          />
                                          {(() => {
                                            const hasRejectedStep = expense.expenseSteps.some(
                                              (step) => normalizeStatus(step.status) === "REJECTED"
                                            );
                                            const allApproved =
                                              expense.expenseSteps.length > 0 &&
                                              expense.expenseSteps.every(
                                                (step) => normalizeStatus(step.status) === "APPROVED"
                                              );

                                            if (hasRejectedStep) {
                                              const rejectedStep = expense.expenseSteps.find(
                                                (step) => normalizeStatus(step.status) === "REJECTED"
                                              );
                                              return (
                                                <div className="progress-status status-rejected">
                                                  <XCircle size={10} className="me-1" />
                                                  Rejected
                                                </div>
                                              );
                                            } else if (allApproved) {
                                              return (
                                                <div className="progress-status status-approved">
                                                  <CheckCircle size={10} className="me-1" />
                                                  Completed
                                                </div>
                                              );
                                            } else {
                                              return (
                                                <div className="progress-status status-pending">
                                                  <Clock size={10} className="me-1" />
                                                  In Progress
                                                </div>
                                              );
                                            }
                                          })()}
                                        </>
                                      ) : (
                                        <div className="no-workflow">
                                          <Circle size={14} className="mb-1 text-muted" />
                                          <div className="small text-muted">No workflow</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>

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
                                className={`page-item ${currentPage === 1 ? "disabled" : ""
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
                                        className={`page-item ${currentPage === pageNum
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
                                className={`page-item ${currentPage === totalPages ? "disabled" : ""
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
          centered
        >
          {selectedExpense && (
            <>
              <Modal.Header
                closeButton
                className="border-0 pb-2 pt-4 px-4"
                style={{
                  background: '#6b7280',
                  borderRadius: '0.5rem 0.5rem 0 0'
                }}
              >
                <div className="w-100">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="icon-wrapper bg-white bg-opacity-25 me-3 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "56px", height: "56px", boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    >
                      <Eye size={28} className="text-white" />
                    </div>
                    <div className="text-white">
                      <h5 className="fw-bold mb-1">Expense Details</h5>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                          <Tag size={12} className="me-1" />
                          ID: #{selectedExpense.id}
                        </Badge>
                        <Badge
                          bg={statusBadge(selectedExpense.status).bg}
                          className="px-3 py-2 rounded-pill d-flex align-items-center"
                        >
                          {statusBadge(selectedExpense.status).icon}
                          {statusBadge(selectedExpense.status).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Header>

              <Modal.Body className="px-4 py-4" style={{ background: '#f8f9fa' }}>
                {/* Header with description and amount */}
                <div className="mb-4 p-4 bg-white border-0 rounded-4 shadow-sm">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <div className="d-flex align-items-start">
                        <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                          <FileText size={24} className="text-primary" />
                        </div>
                        <div>
                          <h6 className="mb-2 fw-bold text-dark fs-5">
                            {selectedExpense.description}
                          </h6>
                          <div className="d-flex align-items-center gap-3 text-muted small">
                            <span className="d-flex align-items-center">
                              <Clock size={14} className="me-1" />
                              Created: <DateTimeDisplay date={selectedExpense.createdAt} />
                            </span>
                            <span className="d-flex align-items-center">
                              <Person size={14} className="me-1" />
                              {selectedExpense.user.firstName} {selectedExpense.user.lastName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <div className="bg-success bg-opacity-10 p-3 rounded-3 d-inline-block">
                        <div className="text-muted small mb-1">Total Amount</div>
                        <h4 className="mb-0 text-success fw-bold">
                          KES {selectedExpense.amount.toLocaleString()}
                        </h4>
                        <small className="text-muted">
                          {selectedExpense.primaryAmount?.toLocaleString()} {selectedExpense.currency?.initials || 'N/A'}
                        </small>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Row className="gy-4">
                  {/* Expense Information */}
                  <Col md={6}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
                      <Card.Body className="p-4">
                        {/* Section Header */}
                        <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                            <FileText size={20} className="text-primary" />
                          </div>
                          <h6 className="mb-0 fw-bold text-dark">Expense Information</h6>
                        </div>

                        <div className="detail-list">
                          {/* Submission Details */}
                          <div className="mb-4 p-3 bg-light rounded-3">
                            <h6 className="text-primary fw-semibold mb-3 small d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 p-1 rounded me-2">
                                <Calendar size={14} className="text-primary" />
                              </div>
                              Submission Details
                            </h6>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Submitted On</span>
                              <span className="detail-value fw-semibold">
                                <DateTimeDisplay date={selectedExpense.createdAt} />
                              </span>
                            </div>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Last Updated</span>
                              <span className="detail-value fw-semibold">
                                <DateTimeDisplay
                                  date={selectedExpense.updatedAt}
                                  isHighlighted={
                                    selectedExpense.updatedAt !== selectedExpense.createdAt
                                  }
                                />
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label text-muted small">Reference Number</span>
                              <span className="detail-value">
                                {selectedExpense.referenceNumber ? (
                                  <Badge bg="dark" className="px-2 py-1 rounded-pill font-monospace">
                                    {selectedExpense.referenceNumber}
                                  </Badge>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Classification */}
                          <div className="mb-4 p-3 bg-light rounded-3">
                            <h6 className="text-success fw-semibold mb-3 small d-flex align-items-center">
                              <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                                <Tag size={14} className="text-success" />
                              </div>
                              Classification
                            </h6>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Category</span>
                              <span className="detail-value">
                                <Badge bg="success" className="bg-opacity-10 text-success px-3 py-2 rounded-pill">
                                  {selectedExpense.category?.name || "N/A"}
                                </Badge>
                              </span>
                            </div>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Department</span>
                              <span className="detail-value">
                                <Badge bg="info" className="bg-opacity-10 text-info px-3 py-2 rounded-pill">
                                  {selectedExpense.department?.name || "N/A"}
                                </Badge>
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label text-muted small">Region</span>
                              <span className="detail-value">
                                <Badge bg="warning" className="bg-opacity-10 text-warning px-3 py-2 rounded-pill">
                                  {selectedExpense.region?.name || "N/A"}
                                </Badge>
                              </span>
                            </div>
                          </div>

                          {/* Payment */}
                          <div className="p-3 bg-light rounded-3">
                            <h6 className="text-warning fw-semibold mb-3 small d-flex align-items-center">
                              <div className="bg-warning bg-opacity-10 p-1 rounded me-2">
                                <CashStack size={14} className="text-warning" />
                              </div>
                              Payment Details
                            </h6>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Payment Method</span>
                              <span className="detail-value fw-semibold">
                                {selectedExpense.paymentMethod?.name || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Payee</span>
                              <span className="detail-value fw-semibold">
                                {selectedExpense.payee || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item mb-2">
                              <span className="detail-label text-muted small">Payee ID</span>
                              <span className="detail-value fw-semibold">
                                {selectedExpense.payeeId || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label text-muted small">Exchange Rate</span>
                              <span className="detail-value fw-semibold">
                                {selectedExpense.exchangeRateUsed
                                  ? Number(selectedExpense.exchangeRateUsed).toFixed(4)
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
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                          <div className="bg-success bg-opacity-10 p-2 rounded-3 me-3">
                            <CheckCircle size={20} className="text-success" />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0 fw-bold text-dark">Approval Process</h6>
                            <small className="text-muted">
                              {selectedExpense.expenseSteps.length} step{selectedExpense.expenseSteps.length !== 1 ? 's' : ''}
                            </small>
                          </div>
                          {selectedExpense.expenseSteps.length > 0 && (
                            <div className="text-end">
                              <div className="progress" style={{ width: '100px', height: '8px' }}>
                                <div
                                  className={`progress-bar ${selectedExpense.expenseSteps.some(
                                    (step) => normalizeStatus(step.status) === "REJECTED"
                                  ) ? 'bg-danger' : 'bg-success'
                                    }`}
                                  style={{ width: `${getProgressPercent(selectedExpense.expenseSteps)}%` }}
                                />
                              </div>
                              <small className="text-muted">
                                {getProgressPercent(selectedExpense.expenseSteps)}% Complete
                              </small>
                            </div>
                          )}
                        </div>

                        {selectedExpense.expenseSteps.length > 0 ? (
                          <div className="approval-timeline-modern">
                            {selectedExpense.expenseSteps.map((s, index) => {
                              const statusText = normalizeStatus(s.status);
                              const isLast = index === selectedExpense.expenseSteps.length - 1;

                              let name = "Pending approval";
                              if (s.approver?.firstName || s.approver?.lastName) {
                                name = `${s.approver?.firstName ?? ""} ${s.approver?.lastName ?? ""}`.trim();
                              } else if (s.nextApprovers && s.nextApprovers.length > 0) {
                                name = s.nextApprovers
                                  .map((u) => `${u.firstName} ${u.lastName}`)
                                  .join(", ");
                              }

                              const role =
                                s.hierarchyName ??
                                s.role?.name ??
                                s.workflowStep?.role?.name ??
                                "No role";

                              return (
                                <div className={`timeline-item-modern ${isLast ? 'last' : ''}`} key={s.id}>
                                  <div className="timeline-marker-modern">
                                    <div className={`status-dot ${statusText.toLowerCase()}`}>
                                      {statusText === "APPROVED" && <CheckCircle size={16} className="text-white" />}
                                      {statusText === "REJECTED" && <XCircle size={16} className="text-white" />}
                                      {statusText === "PENDING" && <Clock size={16} className="text-white" />}
                                      {statusText === "NOT_STARTED" && <Circle size={16} className="text-white" />}
                                    </div>
                                    {!isLast && <div className="timeline-line"></div>}
                                  </div>
                                  <div className="timeline-content-modern">
                                    <div className="p-3 bg-light rounded-3 mb-3">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                          <strong className="d-block text-dark">
                                            Step {s.order}
                                            {s.isOptional && (
                                              <Badge bg="secondary" className="ms-2 small">Optional</Badge>
                                            )}
                                          </strong>
                                          <small className="text-primary fw-semibold">{role}</small>
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
                                          className="text-uppercase px-3 py-2 rounded-pill"
                                        >
                                          {statusText === "APPROVED" && <CheckCircle size={12} className="me-1" />}
                                          {statusText === "REJECTED" && <XCircle size={12} className="me-1" />}
                                          {statusText === "PENDING" && <Clock size={12} className="me-1" />}
                                          {statusText}
                                        </Badge>
                                      </div>

                                      <div className="approver-info bg-white p-2 rounded-2">
                                        <small className="text-muted d-flex align-items-center">
                                          <Person className="me-2" size={14} />
                                          <span className="fw-semibold text-dark">{name}</span>
                                        </small>
                                      </div>

                                      {s.comments && (
                                        <div className="comments-box mt-2 p-3 bg-white rounded-3 border-start border-primary border-3">
                                          <small className="text-muted d-flex align-items-start">
                                            <ChatLeftText className="me-2 mt-1 flex-shrink-0" size={14} />
                                            <span className="text-dark">{s.comments}</span>
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-5 text-muted">
                            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                              style={{ width: '80px', height: '80px' }}>
                              <FileEarmarkX size={40} className="text-muted" />
                            </div>
                            <p className="mb-0 fw-semibold">No approval steps found</p>
                            <small>This expense doesn't have an approval workflow</small>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Modal.Body>

              <Modal.Footer
                className="border-0 pt-3 px-4 pb-4"
                style={{ background: '#f8f9fa', borderRadius: '0 0 0.5rem 0.5rem' }}
              >
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => setShowModal(false)}
                  className="rounded-pill px-4 py-2 fw-semibold border"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Close
                </Button>

                <Button
                  href={`/data/approval-details/${selectedExpense.id}`}
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2 shadow rounded-pill px-4 py-2 fw-semibold"
                  style={{
                    background: '#0d6efd',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 110, 253, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <Eye size={16} className="mb-0" />
                  View Full Details
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

          /* Enhanced Button Styles */
          :global(.header-btn) {
            position: relative;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            border: none;
            font-weight: 500;
            font-size: 0.875rem;
            letter-spacing: 0.3px;
            transition: all 0.2s ease;
            min-width: 110px;
          }

          :global(.header-btn:hover) {
            transform: translateY(-2px);
          }

          :global(.header-btn:active) {
            transform: translateY(0);
          }

          :global(.btn-content) {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          :global(.btn-icon) {
            transition: transform 0.2s ease;
          }

          :global(.header-btn:hover .btn-icon) {
            transform: scale(1.1);
          }

          /* Create Button */
          :global(.btn-create) {
            background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(13, 110, 253, 0.2);
          }

          :global(.btn-create:hover) {
            box-shadow: 0 6px 20px rgba(13, 110, 253, 0.3);
          }

          /* Export Button */
          :global(.btn-export) {
            background: linear-gradient(135deg, #20c997 0%, #0dcaf0 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(32, 201, 151, 0.2);
          }

          :global(.btn-export:hover) {
            box-shadow: 0 6px 20px rgba(32, 201, 151, 0.3);
          }

          /* Budget Button */
          :global(.btn-budget) {
            background: linear-gradient(135deg, #6610f2 0%, #6f42c1 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(102, 16, 242, 0.2);
          }

          :global(.btn-budget:hover) {
            box-shadow: 0 6px 20px rgba(102, 16, 242, 0.3);
          }

          /* Share Button */
          :global(.btn-share) {
            background: linear-gradient(135deg, #fd7e14 0%, #ffc107 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(253, 126, 20, 0.2);
          }

          :global(.btn-share:hover) {
            box-shadow: 0 6px 20px rgba(253, 126, 20, 0.3);
          }

          /* Refresh Button */
          :global(.btn-refresh) {
            background: linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(13, 202, 240, 0.2);
          }

          :global(.btn-refresh:hover) {
            box-shadow: 0 6px 20px rgba(13, 202, 240, 0.3);
          }

          :global(.btn-refresh:disabled) {
            background: #e9ecef;
            color: #6c757d;
            box-shadow: none;
            transform: none;
          }

          :global(.btn-refresh .spinner-border) {
            width: 1rem;
            height: 1rem;
            border-width: 0.15em;
          }

          /* Analytics improvements */
          .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 360px;
            gap: 1rem;
            align-items: start;
          }
          .analytics-hero {
            background: linear-gradient(180deg, #ffffff, #f8fafc);
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.06);
          }
          .hero-value { font-size: 1.25rem; font-weight: 800; color: #0d3b66; }
          .hero-trend { font-size: 0.85rem; margin-top: 6px; display: inline-block; padding: 0.2rem 0.5rem; border-radius: 999px; }
          .hero-trend.positive { background: #ecfdf5; color: #059669; }
          .hero-trend.negative { background: #fff7ed; color: #c2410c; }

          .sparkline-wrapper {
            display:flex;
            align-items:end;
            gap:6px;
            margin-top:10px;
          }
          .sparkline-bar {
            width:10px;
            background: linear-gradient(180deg,#0d6efd,#0dcaf0);
            border-radius:6px 6px 2px 2px;
            transition: transform .15s ease, opacity .15s ease;
          }
          .sparkline-bar:hover { transform: translateY(-6px); opacity: .95; }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .metric-card {
            background: #ffffff;
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow: 0 4px 12px rgba(2,6,23,0.04);
          }
          .metric-icon { width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:10px; }

          /* Analytics three-column layout + adjustments */
          .analytics-grid-three {
            display: grid;
            grid-template-columns: 1fr 520px 360px;
            gap: 1rem;
            align-items: start;
          }
          .metrics-grid-expanded {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .category-column {
            padding: 1rem;
            background: rgba(255,255,255,0.98);
            border: 1px solid rgba(0,0,0,0.04);
            min-height: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-height: 420px;
            overflow: auto;
          }
          .category-column h6 { margin-bottom: 0.75rem; }
          .category-column .progress { border-radius: 6px; overflow: hidden; }
          .category-column .progress-bar { transition: width 0.7s ease; }
          .category-column .status-overview .badge { font-size: 0.75rem; }
          @media (max-width: 1199px) {
            .analytics-grid-three { grid-template-columns: 1fr 1fr; }
            .category-column { grid-column: span 2; }
          }
          @media (max-width: 767px) {
            .analytics-grid-three { grid-template-columns: 1fr; }
            .metrics-grid-expanded { grid-template-columns: repeat(2,1fr); }
          }

          /* end analytics three-column adjustments */

          /* Modern Table Improvements */
          .modern-table-wrapper {
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          }

          .table-header-modern {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 2px solid #dee2e6;
          }

          .table-header-cell {
            padding: 1rem 1.25rem;
            border: none;
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #495057;
            white-space: nowrap;
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          .table-body-modern {
            background: white;
          }

          .table-row-modern {
            transition: all 0.2s ease;
            border-bottom: 1px solid #f1f3f5;
          }

          .table-row-modern.row-even {
            background: #ffffff;
          }

          .table-row-modern.row-odd {
            background: #fafbfc;
          }

          .table-row-modern:hover {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }

          .table-row-modern.row-selected {
            background: linear-gradient(135deg, #e7f3ff 0%, #cfe7ff 100%);
            border-left: 3px solid #0d6efd;
          }

          .table-cell {
            padding: 1rem 1.25rem;
            border: none;
            vertical-align: middle;
          }

          .cell-content {
            display: flex;
            align-items: center;
            min-height: 2rem;
          }

          /* ID Badge */
          .id-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.35rem 0.75rem;
            background: #e7f3ff;
            border-radius: 0.5rem;
            border: 1px solid #0d6efd;
            transition: all 0.2s ease;
          }

          .id-badge:hover {
            background: #0d6efd;
            color: white;
            transform: scale(1.05);
          }

          /* Modern ID Badge */
          .id-badge-modern {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.875rem;
            background: transparent;
            border-radius: 8px;
            border: 1.5px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .id-badge-modern::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: rgba(13, 110, 253, 0.05);
            transition: left 0.5s ease;
          }

          .id-badge-modern:hover::before {
            left: 100%;
          }

          .id-badge-modern:hover {
            background: rgba(13, 110, 253, 0.1);
            border-color: #b8d4fe;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
          }

          .id-badge-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: #0d6efd;
            color: white;
            border-radius: 6px;
            transition: all 0.3s ease;
          }

          .id-badge-modern:hover .id-badge-icon {
            background: white;
            color: #0d6efd;
            transform: rotate(360deg);
          }

          .id-badge-text {
            font-weight: 700;
            font-size: 0.875rem;
            color: #0d6efd;
            letter-spacing: 0.3px;
            transition: color 0.3s ease;
          }

          .id-badge-modern:hover .id-badge-text {
            color: white;
          }

          /* Date Display */
          .date-display {
            font-size: 0.875rem;
            color: #6c757d;
          }

          /* Payee Info */
          .payee-info {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
          }

          .payee-name {
            font-size: 0.9rem;
            line-height: 1.3;
          }

          .payee-number {
            font-size: 0.8rem;
            opacity: 0.8;
          }

          /* Description */
          .description-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            max-width: 300px;
          }

          .description-text {
            font-size: 0.9rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #212529;
          }

          .region-tag .badge {
            font-size: 0.7rem;
            font-weight: 500;
            padding: 0.25rem 0.5rem;
          }

          /* Amount Display */
          .amount-display {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
          }

          .primary-amount {
            font-size: 1rem;
            font-weight: 700;
          }

          .secondary-amount {
            font-size: 0.75rem;
            opacity: 0.7;
          }

          /* Requester Info */
          .requester-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .avatar-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            transition: all 0.2s ease;
          }

          .table-row-modern:hover .avatar-circle {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }

          .requester-name {
            font-size: 0.9rem;
          }

          /* Status Badge */
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
            font-weight: 600;
            border-radius: 0.75rem;
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            transition: all 0.2s ease;
          }

          .status-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          }

          /* Category Badge */
          .category-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 0.9rem;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 0.75rem;
            border-left: 3px solid #198754;
            font-size: 0.85rem;
            font-weight: 600;
            color: #212529;
            transition: all 0.2s ease;
          }

          .category-badge:hover {
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
            color: white;
            transform: scale(1.05);
          }

          /* Approval Progress Modern */
          .approval-progress-modern {
            background: #f8f9fa;
            padding: 0.75rem;
            border-radius: 0.6rem;
            border: 1px solid #e9ecef;
            min-width: 180px;
          }

          .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .progress-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6c757d;
          }

          .progress-percentage {
            font-size: 0.7rem;
            font-weight: 700;
            color: #0d6efd;
          }

          .progress-bar-modern {
            border-radius: 999px;
            background: #e9ecef;
            overflow: hidden;
            margin-bottom: 0.5rem;
          }

          .progress-status {
            display: inline-flex;
            align-items: center;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0.25rem 0.6rem;
            border-radius: 999px;
            margin-top: 0.25rem;
          }

          .status-approved {
            background: #d1e7dd;
            color: #0f5132;
          }

          .status-rejected {
            background: #f8d7da;
            color: #842029;
          }

          .status-pending {
            background: #fff3cd;
            color: #997404;
          }

          .no-workflow {
            text-align: center;
            padding: 0.5rem;
            color: #adb5bd;
          }

          /* Modern Checkbox */
          :global(.modern-checkbox input[type="checkbox"]) {
            width: 18px;
            height: 18px;
            cursor: pointer;
            border-radius: 0.35rem;
            border: 2px solid #dee2e6;
            transition: all 0.2s ease;
          }

          :global(.modern-checkbox input[type="checkbox"]:checked) {
            background-color: #0d6efd;
            border-color: #0d6efd;
          }

          :global(.modern-checkbox input[type="checkbox"]:hover) {
            border-color: #0d6efd;
            transform: scale(1.1);
          }

          /* Cursor Pointer */
          .cursor-pointer {
            cursor: pointer;
          }

          /* Modal Timeline Styles */
          .approval-timeline-modern {
            position: relative;
            padding-left: 0;
          }

          .timeline-item-modern {
            display: flex;
            gap: 1rem;
            position: relative;
            margin-bottom: 0;
          }

          .timeline-item-modern.last {
            margin-bottom: 0;
          }

          .timeline-marker-modern {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }

          .status-dot {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }

          .status-dot.approved {
            background: #22c55e;
          }

          .status-dot.rejected {
            background: #ef4444;
          }

          .status-dot.pending {
            background: #f59e0b;
          }

          .status-dot.not_started {
            background: #6c757d;
          }

          .timeline-line {
            width: 3px;
            flex-grow: 1;
            background: #dee2e6;
            margin: 0.5rem 0;
            border-radius: 2px;
          }

          .timeline-content-modern {
            flex-grow: 1;
            padding-bottom: 1rem;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
          }

          .detail-label {
            font-weight: 500;
            color: #6c757d;
          }

          .detail-value {
            font-weight: 600;
            color: #212529;
            text-align: right;
          }

          /* Modal Header Styles */
          :global(.expense-modal .modal-content) {
            border: none;
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          :global(.expense-modal .modal-header .btn-close) {
            background: white;
            opacity: 1;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            filter: brightness(1) contrast(1.2) invert(0.2);
            border: 2px solid rgba(0, 0, 0, 0.2);
          }

          :global(.expense-modal .modal-header .btn-close:hover) {
            transform: rotate(90deg);
            background: #f1f3f5;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border-color: rgba(0, 0, 0, 0.3);
          }

          /* Responsive adjustments */
          @media (max-width: 1199px) {
            .table-cell {
              padding: 0.75rem 1rem;
            }
            
            .description-wrapper {
              max-width: 200px;
            }
          }

          @media (max-width: 767px) {
            .table-header-cell,
            .table-cell {
              padding: 0.65rem 0.75rem;
              font-size: 0.85rem;
            }
            
            .approval-progress-modern {
              min-width: 150px;
            }

            .status-dot {
              width: 32px;
              height: 32px;
            }

            .timeline-item-modern {
              gap: 0.75rem;
            }
          }
        `}</style>

        {/* ...rest of existing code... */}
      </Container>
    </AuthProvider>
  );
}
