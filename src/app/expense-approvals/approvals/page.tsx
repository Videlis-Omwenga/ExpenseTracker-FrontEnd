"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Pagination,
  ProgressBar,
  Row,
  Table,
} from "react-bootstrap";
import {
  ListCheck,
  CheckCircle,
  ClockHistory,
  FileText,
  Download,
  Eye,
  CheckLg,
  XLg,
  ExclamationTriangle,
  InfoCircle,
  XCircle,
  ArrowDownCircle,
  Tag,
  Person,
  Clock,
  ChatText,
  Search,
  CashStack,
  CalendarEvent,
  ArrowRepeat,
  Funnel,
  Building,
  GraphUp,
  GraphUpArrow,
  Award,
  Activity,
  Share,
  Printer,
  Lightning,
  FiletypeXlsx,
  BarChart,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import TopNavbar from "@/app/components/Navbar";
import AuthProvider from "@/app/authPages/tokenData";
import { BASE_API_URL } from "@/app/static/apiConfig";
import PageLoader from "@/app/components/PageLoader";
import BudgetOverviewHOD from "../budgets/page";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";

type ApprovalStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

type UserLite = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  department?: { name: string } | null;
};

type RoleLite = { id: number; name: string | null };

type HierarchyLevel = {
  id: number;
  order: number;
  role: RoleLite;
  approverCount: number;
};

type ApprovalHierarchy = {
  id: number;
  name: string;
  description?: string | null;
  levels: HierarchyLevel[];
};

type ExpenseStep = {
  id: number;
  order: number;
  status: ApprovalStatus;
  role?: RoleLite | null;
  hierarchyLevel?: HierarchyLevel | null;
  approvalHierarchy?: ApprovalHierarchy | null;
  approver?: UserLite | null;
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;
  hierarchyName?: string | null;
  nextApprovers?: UserLite[];
};

type Currency = {
  id: number;
  currency: string;
  initials: string;
  rate: number;
};

type Region = {
  id: number;
  name: string;
};

type PaymentMethod = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

type Department = {
  id: number;
  name: string;
};

type Budget = {
  id: number;
  originalBudget: number;
  remainingBudget: number;
};

type ApprovalHistoryStep = {
  id: number;
  status: ApprovalStatus;
  comments?: string | null;
  actionedBy: UserLite;
  role?: RoleLite | null;
  createdAt: string;
};

type Expense = {
  id: number;
  workflowId: number;
  description: string;
  primaryAmount: number;
  exchangeRate: number;
  amount: number;
  currency: string;
  category: Category;
  receiptUrl?: string | null;
  department: Department;
  referenceNumber?: string | null;
  payee: string;
  payeeId: string;
  payeeNumber?: string | null;
  paymentMethod: PaymentMethod;
  region: Region;
  currencyDetails: Currency;
  status: ExpenseStatus;
  user: UserLite;
  expenseSteps: ExpenseStep[];
  approvalHistory?: ApprovalHistoryStep[];
  budget: Budget;
  createdAt: string;
  updatedAt: string;
};

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
};
const humanStatus = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export default function ExpenseApprovalPage() {
  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ExpenseStatus>(
    "all"
  );
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);

  // Enhanced filter state
  const [departmentFilter, setDepartmentFilter] = useState<number | "all">(
    "all"
  );
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("All Time");
  const [submissionPeriodFilter, setSubmissionPeriodFilter] =
    useState("All Periods");

  // Helper function to get approval progress string (e.g. "1/2")
  const getApprovalProgress = (expense: Expense): string => {
    const totalSteps = expense.expenseSteps?.length || 0;
    if (totalSteps === 0) return "0/0";

    const completedSteps =
      expense.expenseSteps?.filter(
        (step) => step.status === "APPROVED" || step.status === "REJECTED"
      ).length || 0;

    return `${completedSteps}/${totalSteps}`;
  };

  // Extract unique approval statuses
  const approvalStatuses = useMemo(() => {
    const statuses = new Set<string>();
    statuses.add("all");
    expenses.forEach((expense) => {
      const progress = getApprovalProgress(expense);
      if (progress !== "0/0") {
        statuses.add(progress);
      }
    });
    return Array.from(statuses).sort();
  }, [expenses]);

  // Extract unique categories from expenses
  const categories = useMemo(() => {
    const categoryMap = new Map<number, Category>();
    expenses.forEach((expense) => {
      if (expense.category) {
        categoryMap.set(expense.category.id, expense.category);
      }
    });
    return Array.from(categoryMap.values());
  }, [expenses]);

  // Extract unique departments from expenses
  const departments = useMemo(() => {
    const departmentMap = new Map<number, Department>();
    expenses.forEach((expense) => {
      if (expense.department) {
        departmentMap.set(expense.department.id, expense.department);
      }
    });
    return Array.from(departmentMap.values());
  }, [expenses]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Check if all selected expenses have the same category and if total amount is within budget
  const { hasSameCategory, exceedsBudget, budgetRemaining, totalAmount } =
    useMemo(() => {
      if (selectedExpenses.length === 0)
        return {
          hasSameCategory: true,
          exceedsBudget: false,
          budgetRemaining: 0,
          totalAmount: 0,
        };

      const selectedExpensesData = expenses.filter((expense) =>
        selectedExpenses.includes(expense.id)
      );

      if (selectedExpensesData.length === 0)
        return {
          hasSameCategory: true,
          exceedsBudget: false,
          budgetRemaining: 0,
          totalAmount: 0,
        };

      // First check if all expenses have the same category
      const firstCategory = selectedExpensesData[0]?.category?.id;
      const sameCategory = selectedExpensesData.every(
        (expense) => expense.category?.id === firstCategory
      );

      // Only check budget if categories are the same
      if (!sameCategory) {
        return {
          hasSameCategory: false,
          exceedsBudget: false, // Don't care about budget if categories don't match
          budgetRemaining: 0,
          totalAmount: 0,
        };
      }

      // Check if all selected expenses have already started approval (have at least one approval step)
      const allHaveStartedApproval = selectedExpensesData.every((expense) => {
        const progress = getApprovalProgress(expense);
        const [completed] = progress.split("/").map(Number);
        return completed > 0; // At least one approval step completed
      });

      // If all selected expenses have already started approval, skip budget check
      if (allHaveStartedApproval) {
        return {
          hasSameCategory: true,
          exceedsBudget: false, // Skip budget check
          budgetRemaining:
            selectedExpensesData[0]?.budget?.remainingBudget || 0,
          totalAmount: 0, // Not needed when all have started approval
        };
      }

      // Calculate total amount of selected expenses
      const totalAmount = selectedExpensesData.reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );

      // Get remaining budget from the first expense (all should have the same budget if same category)
      const budgetRemaining =
        selectedExpensesData[0]?.budget?.remainingBudget || 0;

      const budgetExceeded = totalAmount > budgetRemaining;
      return {
        hasSameCategory: true,
        exceedsBudget: budgetExceeded,
        budgetRemaining,
        totalAmount: budgetExceeded ? totalAmount : 0, // Only include totalAmount if budget is exceeded
      };
    }, [selectedExpenses, expenses]);

  // Determine if buttons should be disabled
  const buttonsDisabled = !hasSameCategory || exceedsBudget;
  const [isLoading, setIsLoading] = useState(true);

  /** Fetch "expenses to approve" */
  const fetchExpensesToApprove = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_API_URL}/expense-approvals/expenses-to-approve`,
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

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data: Expense[] = await res.json();

      // Sort by ID in descending order (newest first)
      data.sort((a, b) => b.id - a.id);

      setExpenses(data);
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(`${error?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /** Approve / Reject via single unified endpoint */
  const approveExpense = async (id: number) => {
    try {
      const res = await fetch(
        `${BASE_API_URL}/expense-approvals/process-approval`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify({
            expenseId: id,
            isApproved: true,
            comments: rejectionReason,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Expense approved successfully");
        await fetchExpensesToApprove();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const rejectExpense = async (id: number, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      const res = await fetch(
        `${BASE_API_URL}/expense-approvals/process-approval`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify({
            expenseId: id,
            isApproved: false,
            comments: reason,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Expense rejected successfully");
        setRejectionReason("");
        setShowDetailsModal(false);
        await fetchExpensesToApprove();
      } else {
        toast.error(data.message);
      }
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(`Rejection failed: ${error?.message || e}`);
    }
  };

  /** Approve / Reject from inside the details modal (uses selectedExpense) */
  const handleApproveExpenseFromModal = async (isApproved: boolean) => {
    if (!selectedExpense) return;
    if (!isApproved && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    if (isApproved) {
      await approveExpense(selectedExpense.id);
      setShowDetailsModal(false);
    } else {
      await rejectExpense(selectedExpense.id, rejectionReason);
    }
  };

  useEffect(() => {
    fetchExpensesToApprove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return expenses.filter((exp) => {
      // Enhanced search functionality
      const employee = `${exp.user?.firstName ?? ""} ${exp.user?.lastName ?? ""
        }`.trim();
      const department =
        exp.department?.name || exp.user?.department?.name || "";
      const category = exp.category?.name || "";
      const description = exp.description || "";
      const payee = exp.payee || "";
      const payeeNumber = exp.payeeNumber || "";

      const matchesSearch =
        q.length === 0 ||
        employee.toLowerCase().includes(q) ||
        department.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        payee.toLowerCase().includes(q) ||
        payeeNumber.toLowerCase().includes(q);

      // Existing filters
      const matchesStatus =
        statusFilter === "all" || exp.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || exp.category?.id === categoryFilter;
      const matchesApprovalProgress =
        approvalFilter === "all" || getApprovalProgress(exp) === approvalFilter;

      // New filters
      const matchesDepartment =
        departmentFilter === "all" || exp.department?.id === departmentFilter;

      // Amount range filter
      const matchesAmount = (() => {
        const amount = exp.amount || 0;
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Number.MAX_VALUE;
        return amount >= min && amount <= max;
      })();

      // Date range filter
      const matchesDateRange = (() => {
        if (dateRangeFilter === "All Time") return true;

        const now = new Date();
        const expenseDate = new Date(exp.createdAt);

        if (dateRangeFilter === "Today") {
          return expenseDate.toDateString() === now.toDateString();
        } else if (dateRangeFilter === "This Week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          return expenseDate >= startOfWeek;
        } else if (dateRangeFilter === "This Month") {
          return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        } else if (dateRangeFilter === "Last 30 Days") {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return expenseDate >= thirtyDaysAgo;
        }
        return true;
      })();

      // Submission period filter (based on updatedAt)
      const matchesSubmissionPeriod = (() => {
        if (submissionPeriodFilter === "All Periods") return true;

        const now = new Date();
        const submissionDate = new Date(exp.updatedAt);

        if (submissionPeriodFilter === "Recently Updated") {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return submissionDate >= sevenDaysAgo;
        } else if (submissionPeriodFilter === "This Month") {
          return (
            submissionDate.getMonth() === now.getMonth() &&
            submissionDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesApprovalProgress &&
        matchesDepartment &&
        matchesAmount &&
        matchesDateRange &&
        matchesSubmissionPeriod
      );
    });
  }, [
    expenses,
    searchQuery,
    statusFilter,
    categoryFilter,
    approvalFilter,
    departmentFilter,
    minAmount,
    maxAmount,
    dateRangeFilter,
    submissionPeriodFilter,
  ]);

  /** Pagination */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / itemsPerPage)
  );
  const currentExpenses = useMemo(
    () =>
      filteredExpenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredExpenses, currentPage]
  );

  /** Selection helpers */
  const allSelected =
    currentExpenses.length > 0 &&
    currentExpenses.every((e) => selectedExpenses.includes(e.id));
  const someSelected =
    currentExpenses.some((e) => selectedExpenses.includes(e.id)) &&
    !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedExpenses((prev) =>
        prev.filter((id) => !currentExpenses.find((e) => e.id === id))
      );
    } else {
      setSelectedExpenses((prev) => [
        ...prev,
        ...currentExpenses.map((e) => e.id).filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const toggleExpenseSelection = (id: number) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /** Bulk actions */
  const handleBulkApprove = async () => {
    if (selectedExpenses.length === 0) return;
    await Promise.all(selectedExpenses.map((id) => approveExpense(id)));
    setSelectedExpenses([]);
  };

  const handleBulkReject = async () => {
    if (selectedExpenses.length === 0) return;
    setShowRejectModal(true);
  };

  const confirmBulkReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    await Promise.all(
      selectedExpenses.map((id) => rejectExpense(id, rejectionReason))
    );
    setSelectedExpenses([]);
    setRejectionReason("");
    setShowRejectModal(false);
  };

  /** Per-row actions */
  const handleApprove = (id: number) => approveExpense(id);

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  /** Stats – Pending count from actual data */
  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;

  // Analytics calculations for approvers
  const analyticsData = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Filter expenses for different periods
    const thisMonthExpenses = expenses.filter(
      (e) => new Date(e.createdAt) >= thisMonth
    );
    const lastMonthExpenses = expenses.filter(
      (e) =>
        new Date(e.createdAt) >= lastMonth && new Date(e.createdAt) < thisMonth
    );

    // Calculate totals for approval workflow
    const thisMonthTotal = thisMonthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const lastMonthTotal = lastMonthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Approval status breakdown
    const statusBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Department approval breakdown
    const departmentBreakdown = expenses.reduce((acc, expense) => {
      const dept = expense.department?.name || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top departments (only first 2)
    const topDepartments = Object.entries(departmentBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    // Monthly approval trend (last 6 months)
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

    // Average expense amount for approval
    const averageExpense =
      expenses.length > 0
        ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length
        : 0;

    // Pending approvals by current user (approver-specific)
    const myPendingCount = expenses.filter((e) =>
      e.expenseSteps.some((step) => step.status === "PENDING")
    ).length;

    // Approval efficiency - percentage of expenses fully processed
    const fullyProcessedCount = expenses.filter(
      (e) => e.status === "APPROVED" || e.status === "REJECTED"
    ).length;
    const approvalEfficiency =
      expenses.length > 0 ? (fullyProcessedCount / expenses.length) * 100 : 0;

    return {
      thisMonthTotal,
      lastMonthTotal,
      monthlyGrowth,
      statusBreakdown,
      departmentBreakdown,
      topDepartments,
      monthlyTrend,
      averageExpense,
      myPendingCount,
      totalExpenses: expenses.length,
      approvalEfficiency,
      fullyProcessedCount,
    };
  }, [expenses]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="py-4">
        {/* Modern Header */}
        <div
          className="mb-4 p-4 rounded-3 border shadow-sm"
          style={{
            background: '#f0f4ff',
            position: 'relative',
            overflow: 'hidden',
            borderColor: '#e5eaff !important'
          }}
        >
          {/* Decorative Pattern Elements */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '20px',
              width: '120px',
              height: '120px',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              borderRadius: '50%'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '50px',
              width: '60px',
              height: '60px',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              borderRadius: '50%'
            }}
          />

          <div className="position-relative">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
              {/* Left Side - Title and Info */}
              <div className="d-flex align-items-center">
                <div
                  className="p-3 rounded-3 me-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <ListCheck style={{ color: '#1e293b' }} size={32} />
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
                    Expense Approvals
                  </h5>
                  <div className="d-flex align-items-center gap-3">
                    <p className="mb-0" style={{ color: '#334155' }}>
                      Review and approve pending expense requests
                    </p>
                    <span
                      className="badge px-3 py-2 rounded-pill"
                      style={{
                        background: 'rgba(255, 255, 255, 0.35)',
                        backdropFilter: 'blur(10px)',
                        color: '#1e293b',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      <ClockHistory size={12} className="me-1" />
                      {pendingCount} Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="d-inline-flex align-items-center px-4 py-2 rounded-pill fw-semibold shadow"
                  onClick={fetchExpensesToApprove}
                  disabled={isLoading}
                  style={{
                    background: 'white',
                    border: '1px solid #667eea',
                    color: '#667eea',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#667eea';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <ArrowRepeat size={16} className="me-2" />
                      Refresh
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 fw-semibold shadow"
                  onClick={() => {
                    const csvContent = [
                      [
                        "ID",
                        "Date",
                        "Payee",
                        "Department",
                        "Category",
                        "Description",
                        "Amount",
                        "Status",
                        "Progress",
                      ],
                      ...filteredExpenses.map((e) => [
                        e.id,
                        new Date(e.createdAt).toLocaleDateString(),
                        e.payee,
                        e.department?.name || "N/A",
                        e.category?.name || "N/A",
                        e.description,
                        e.amount,
                        e.status,
                        getApprovalProgress(e),
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
                    a.download = `approvals_${new Date().toISOString().split("T")[0]
                      }.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Approvals exported successfully!");
                  }}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FiletypeXlsx size={14} />
                  Export
                </Button>
                <Button
                  size="sm"
                  className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 fw-semibold shadow"
                  onClick={() => window.print()}
                  style={{
                    background: 'white',
                    border: '1px solid #475569',
                    color: '#475569',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#475569';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Printer size={14} />
                  Print
                </Button>
                <Button
                  size="sm"
                  className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 fw-semibold shadow"
                  onClick={() => {
                    setStatusFilter("PENDING");
                    toast.info("Filtered to show pending approvals");
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #f59e0b',
                    color: '#f59e0b',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f59e0b';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#f59e0b';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <ClockHistory size={14} />
                  Pending
                </Button>
                <Button
                  size="sm"
                  className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 fw-semibold shadow"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Expense Approvals Summary",
                        text: `I have ${expenses.length
                          } expenses to review totaling KES ${expenses
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Page URL copied to clipboard!");
                    }
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #6366f1',
                    color: '#6366f1',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#6366f1';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Share size={14} />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        {/* Main Container Card - All Content Grouped */}
        <Card className="border-0 shadow-sm rounded-3 mb-4">
          <Card.Body className="p-4">
            {/* Analytics Dashboard Section */}
            <div className="mb-5">
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center">
                  <div
                    className="p-2 rounded-3 me-3"
                    style={{
                      background: '#667eea',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    <GraphUp size={22} className="text-white" />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">
                      Approval Analytics
                    </h6>
                    <p className="text-muted mb-0 small">
                      Performance insights and approval trends
                    </p>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                    <span className="text-success fw-semibold">
                      ● Updated Now
                    </span>
                  </span>
                </div>
              </div>

              <Row className="g-4">
                {/* Key Metrics */}
                <Col md={12}>
                  <Row className="g-3">
                    <Col sm={6} md={3}>
                      <div
                        className="analytics-card p-3 rounded-3 h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#667eea !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#667eea' }}
                          >
                            <GraphUpArrow size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">
                              This Month
                            </p>
                            <h6 className="mb-0 fw-bold text-dark">
                              KES {analyticsData.thisMonthTotal.toLocaleString()}
                            </h6>
                            {analyticsData.lastMonthTotal > 0 ? (
                              <small
                                className={`fw-semibold ${analyticsData.monthlyGrowth >= 0
                                  ? 'text-success'
                                  : 'text-danger'
                                  }`}
                              >
                                {analyticsData.monthlyGrowth >= 0 ? '↑' : '↓'}
                                {Math.abs(analyticsData.monthlyGrowth).toFixed(1)}% vs last month
                              </small>
                            ) : (
                              <small className="text-muted">
                                First month data
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6} md={3}>
                      <div
                        className="analytics-card p-3 rounded-3 h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#10b981 !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#10b981' }}
                          >
                            <Award size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">
                              Efficiency Rate
                            </p>
                            <h6 className="mb-0 fw-bold text-dark">
                              {analyticsData.approvalEfficiency.toFixed(1)}%
                            </h6>
                            <small className="text-muted">
                              {analyticsData.fullyProcessedCount} of{" "}
                              {analyticsData.totalExpenses} processed
                            </small>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6} md={3}>
                      <div
                        className="analytics-card p-3 rounded-3 h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#f59e0b !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#f59e0b' }}
                          >
                            <Activity size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">
                              Average Amount
                            </p>
                            <h6 className="mb-0 fw-bold text-dark">
                              KES{" "}
                              {Math.round(
                                analyticsData.averageExpense
                              ).toLocaleString()}
                            </h6>
                            <small className="text-muted">
                              {analyticsData.totalExpenses > 0
                                ? 'per expense transaction'
                                : 'no expenses yet'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6} md={3}>
                      <div
                        className="analytics-card p-3 rounded-3 h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#ef4444 !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#ef4444' }}
                          >
                            <ClockHistory size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">
                              My Queue
                            </p>
                            <h6 className="mb-0 fw-bold text-dark">
                              {analyticsData.myPendingCount}
                            </h6>
                            <small className="text-muted">
                              awaiting my approval
                            </small>
                          </div>
                        </div>
                      </div>
                    </Col>

                    {/* Additional Summary Cards */}
                    <Col sm={6} md={3}>
                      <div
                        className="p-3 rounded-3 shadow-sm h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#f59e0b !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 15px rgba(245, 158, 11, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#f59e0b' }}
                          >
                            <ClockHistory size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">
                              Pending Approval
                            </p>
                            <h6 className="mb-0 fw-bold text-dark">{pendingCount}</h6>
                            <small className="text-warning">Active requests</small>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6} md={3}>
                      <div
                        className="p-3 rounded-3 shadow-sm h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#10b981 !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 15px rgba(16, 185, 129, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#10b981' }}
                          >
                            <CashStack size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">Total Amount</p>
                            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                              KES{" "}
                              {expenses
                                .reduce(
                                  (sum, expense) => sum + (expense.amount || 0),
                                  0
                                )
                                .toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                            </h6>
                            <small className="text-success">All expenses</small>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col sm={6} md={3}>
                      <div
                        className="p-3 rounded-3 shadow-sm h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#667eea !important',
                          borderWidth: '2px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 15px rgba(102, 126, 234, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#667eea' }}
                          >
                            <FileText size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-muted small mb-1 fw-medium">Total in List</p>
                            <h6 className="mb-0 fw-bold text-dark">{expenses.length}</h6>
                            <small className="text-primary">Items</small>
                          </div>
                        </div>
                      </div>
                    </Col>

                    <BudgetOverviewHOD />
                  </Row>
                </Col>

                {/* Charts and Insights Section */}
                <Col md={12} className="mt-4">
                  <Row className="g-4">
                    {/* Monthly Trend Chart */}
                    <Col md={8}>
                      <div
                        className="p-4 rounded-3 h-100 border"
                        style={{
                          background: '#fff',
                          borderColor: '#e7eaff',
                          borderWidth: '2px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-4">
                          <div className="d-flex align-items-center">
                            <div
                              className="p-2 rounded-3 me-3"
                              style={{ background: '#667eea' }}
                            >
                              <BarChart className="text-white" size={18} />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-0 text-dark">6-Month Approval Trend</h6>
                              <small className="text-muted">Expense volume and amount tracking</small>
                            </div>
                          </div>
                          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                            <GraphUpArrow size={12} className="me-1" />
                            Trending
                          </span>
                        </div>
                        <div className="chart-container">
                          <div
                            className="d-flex align-items-end justify-content-between px-3"
                            style={{ height: "140px" }}
                          >
                            {analyticsData.monthlyTrend.map((data, index) => {
                              const maxAmount = Math.max(
                                ...analyticsData.monthlyTrend.map(
                                  (d) => d.amount
                                ),
                                1
                              );
                              const height =
                                data.amount > 0
                                  ? Math.max((data.amount / maxAmount) * 80, 8)
                                  : 8;

                              const hasData = data.amount > 0;
                              const barColor = hasData
                                ? data.amount > analyticsData.thisMonthTotal * 0.8
                                  ? "#dc3545"
                                  : data.amount >
                                    analyticsData.thisMonthTotal * 0.5
                                    ? "#ffc107"
                                    : "#0d6efd"
                                : "#e9ecef";

                              return (
                                <div
                                  key={index}
                                  className="d-flex flex-column align-items-center"
                                >
                                  <div
                                    className="rounded-top chart-bar"
                                    style={{
                                      width: "32px",
                                      height: `${height + 12}px`,
                                      minHeight: "12px",
                                      backgroundColor: barColor,
                                      opacity: hasData ? 0.9 : 0.3,
                                      cursor: "pointer",
                                      transition: "all 0.3s ease",
                                      position: "relative",
                                      border: hasData
                                        ? `2px solid ${barColor}`
                                        : "1px solid #dee2e6",
                                    }}
                                    title={`${data.month
                                      }: KES ${data.amount.toLocaleString()} (${data.count
                                      } expenses)`}
                                  >
                                    {hasData && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: "-18px",
                                          left: "50%",
                                          transform: "translateX(-50%)",
                                          fontSize: "8px",
                                          color: "#6c757d",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {data.count}
                                      </div>
                                    )}
                                  </div>
                                  <small
                                    className="text-muted mt-1"
                                  >
                                    {data.month.split(" ")[0]}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Col>

                    {/* Department Breakdown */}
                    <Col md={4}>
                      <div
                        className="h-100 p-4 rounded-3 border"
                        style={{
                          background: '#fff',
                          borderColor: '#ffe7e7',
                          borderWidth: '2px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div className="d-flex align-items-center mb-4">
                          <div
                            className="p-2 rounded-3 me-3"
                            style={{ background: '#ef4444' }}
                          >
                            <Building className="text-white" size={18} />
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">Top Departments</h6>
                            <small className="text-muted">Activity breakdown</small>
                          </div>
                        </div>
                        <div className="category-breakdown">
                          {analyticsData.topDepartments.length > 0 ? (
                            analyticsData.topDepartments.map(
                              ([department, count], index) => {
                                const percentage =
                                  (count / analyticsData.totalExpenses) * 100;
                                const colors = ["primary", "success"];
                                const color = colors[index] || "primary";

                                return (
                                  <div key={department} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <div className="d-flex align-items-center">
                                        <Building
                                          size={12}
                                          className={`text-${color} me-2`}
                                        />
                                        <span className="fw-medium">
                                          {department}
                                        </span>
                                      </div>
                                      <span className="small text-muted fw-bold">
                                        {count} expenses
                                      </span>
                                    </div>
                                    <div
                                      className="progress"
                                      style={{ height: "8px" }}
                                    >
                                      <div
                                        className={`progress-bar bg-${color}`}
                                        style={{
                                          width: `${Math.max(percentage, 5)}%`,
                                          background: `linear-gradient(135deg, var(--bs-${color}) 0%, var(--bs-${color === "primary"
                                            ? "info"
                                            : "warning"
                                            }) 100%)`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1">
                                      <small className="text-muted">
                                        {percentage.toFixed(1)}% of total
                                      </small>
                                      <small className="text-muted">
                                        Avg: KES{" "}
                                        {count > 0
                                          ? Math.round(
                                            analyticsData.averageExpense
                                          ).toLocaleString()
                                          : "0"}
                                      </small>
                                    </div>
                                  </div>
                                );
                              }
                            )
                          ) : (
                            <div className="text-center py-3 text-muted">
                              <Building size={24} className="mb-2" />
                              <div className="small">
                                No department data available
                              </div>
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
                            {Object.entries(analyticsData.statusBreakdown).map(
                              ([status, count]) => {
                                const percentage =
                                  (count / analyticsData.totalExpenses) * 100;
                                const statusColors = {
                                  PENDING: {
                                    bg: "warning",
                                    icon: <ClockHistory size={12} />,
                                  },
                                  APPROVED: {
                                    bg: "success",
                                    icon: <CheckCircle size={12} />,
                                  },
                                  REJECTED: {
                                    bg: "danger",
                                    icon: <XCircle size={12} />,
                                  },
                                  PAID: {
                                    bg: "primary",
                                    icon: <CheckCircle size={12} />,
                                  },
                                };
                                const statusInfo = statusColors[
                                  status as keyof typeof statusColors
                                ] || {
                                  bg: "secondary",
                                  icon: <InfoCircle size={12} />,
                                };

                                return (
                                  <div
                                    key={status}
                                    className="d-flex justify-content-between align-items-center mb-2"
                                  >
                                    <div className="d-flex align-items-center">
                                      <span
                                        className={`badge bg-${statusInfo.bg} me-2 d-inline-flex align-items-center py-1 px-2 rounded-pill`}
                                      >
                                        {statusInfo.icon}
                                        <span className="ms-1 small">
                                          {status}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="text-end">
                                      <span className="fw-bold">{count}</span>
                                      <small className="text-muted ms-1">
                                        ({percentage.toFixed(0)}%)
                                      </small>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
            {/* End Analytics Dashboard Section */}

            <hr className="my-5" />

            {/* Bulk Actions Section */}
            {selectedExpenses.length > 0 && (
              <div className="mb-5 bg-light bg-opacity-50 p-4 rounded-3 border">
                <Row className="align-items-center">
                  <Col md={6}>
                    <span className="fw-medium">
                      {selectedExpenses.length} expense(s) selected
                    </span>
                  </Col>
                  <Col md={6} className="text-end">
                    <div className="position-relative d-inline-block me-2">
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        disabled={buttonsDisabled}
                        title={
                          exceedsBudget
                            ? `Selected amount exceeds remaining budget of ${budgetRemaining.toLocaleString()} KES`
                            : !hasSameCategory
                              ? "All selected expenses must be from the same category"
                              : ""
                        }
                        onClick={handleBulkApprove}
                      >
                        <CheckLg size={16} className="me-1" />
                        Approve Selected
                      </Button>
                      {(exceedsBudget || !hasSameCategory) &&
                        selectedExpenses.length > 0 && (
                          <div
                            className="position-absolute top-100 start-0 mt-1 w-100 text-center"
                            style={{
                              fontSize: "0.7rem",
                              color: "#dc3545",
                              whiteSpace: "nowrap",
                              left: 0,
                            }}
                            title={
                              exceedsBudget
                                ? `Selected amount (${totalAmount.toLocaleString()} KES) exceeds remaining budget (${budgetRemaining.toLocaleString()} KES) by ${(
                                  totalAmount - budgetRemaining
                                ).toLocaleString()} KES`
                                : "Please select expenses from the same category"
                            }
                          >
                            {exceedsBudget
                              ? `Budget exceeded by ${(
                                totalAmount - budgetRemaining
                              ).toLocaleString()} KES`
                              : "Same category required"}
                          </div>
                        )}
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleBulkReject}
                      title="Reject selected expenses without budget or category restrictions"
                    >
                      <XLg size={16} className="me-1" />
                      Reject Selected
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
            {/* End Bulk Actions Section */}

            {/* Search and Filters Section */}
            <div className="mb-0">
              <div 
                className="d-flex align-items-center mb-4 p-4 rounded-3"
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #e0f2fe'
                }}
              >
                <div 
                  className="p-3 rounded-3 me-3"
                  style={{
                    background: '#667eea',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }}
                >
                  <ListCheck size={24} className="text-white" />
                </div>
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Expense Requests</h6>
                  <span className="small" style={{ color: '#64748b' }}>Search, filter, and manage expense approvals</span>
                </div>
              </div>

              {/* Search and Action Row */}
              <Row className="align-items-center g-3 mb-4">
                <Col xs={12} md={4}>
                  <h5 className="mb-0 fw-bold text-dark">Expense Requests</h5>
                  <small className="text-muted">
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      filteredExpenses.length
                    )}
                    -
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredExpenses.length
                    )}{" "}
                    of {filteredExpenses.length} expenses
                  </small>
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
                          placeholder="Search by payee, payee number, description, employee, category..."
                          value={searchQuery}
                          onChange={(e) => {
                            setCurrentPage(1);
                            setSearchQuery(e.target.value);
                          }}
                          className="modern-search-input"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            className="clear-search-btn"
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
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
                    variant="primary"
                    size="sm"
                    onClick={() => window.print()}
                    title="Quick export via browser print"
                    className="rounded-pill px-4 py-2 fw-semibold shadow-sm"
                  >
                    <Download size={16} className="me-1" />
                    Export
                  </Button>
                </Col>
              </Row>

              {/* Horizontal Filters Row */}
              <div className="filters-section">
                <div 
                  className="filter-header-bar d-flex align-items-center justify-content-between mb-4 p-4"
                  style={{
                    background: 'transparent'
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="p-3 rounded-3"
                      style={{
                        background: '#667eea',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }}
                    >
                      <Funnel className="text-white" size={20} />
                    </div>
                    <div>
                      <h5 className="mb-1 fw-bold text-dark">Advanced Filters</h5>
                      <p className="mb-0 small text-muted">Refine your search with multiple criteria</p>
                    </div>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill px-4 py-2 fw-semibold shadow-sm"
                    style={{
                      borderWidth: '2px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#667eea';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => {
                      // setStatusFilter("All Statuses");
                      // setDateRangeFilter("All Time");
                      // setCategoryFilter("All Categories");
                      // setMinAmount("");
                      // setMaxAmount("");
                      // setApprovalFilter("All Approval Status");
                      // setSearchQuery("");
                    }}
                  >
                    <ArrowRepeat className="me-2" size={16} />
                    Reset All Filters
                  </Button>
                </div>

                <Row className="g-4">
                  {/* Status Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-dark">
                        <div 
                          className="p-1 rounded me-2"
                          style={{ background: '#dbeafe' }}
                        >
                          <CheckCircle className="text-primary" size={14} />
                        </div>
                        Status
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern shadow-sm"
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(
                            e.target.value as "all" | ExpenseStatus
                          );
                          setCurrentPage(1);
                        }}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          padding: '10px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="PENDING">⏳ Pending</option>
                        <option value="APPROVED">✅ Approved</option>
                        <option value="REJECTED">❌ Rejected</option>
                        <option value="PAID">💰 Paid</option>
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Category Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-dark">
                        <div 
                          className="p-1 rounded me-2"
                          style={{ background: '#fef3c7' }}
                        >
                          <Tag className="text-warning" size={14} />
                        </div>
                        Category
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern shadow-sm"
                        value={categoryFilter}
                        onChange={(e) => {
                          setCategoryFilter(
                            e.target.value === "all"
                              ? "all"
                              : Number(e.target.value)
                          );
                          setCurrentPage(1);
                        }}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          padding: '10px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Department Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-dark">
                        <div 
                          className="p-1 rounded me-2"
                          style={{ background: '#ddd6fe' }}
                        >
                          <Building className="text-primary" size={14} />
                        </div>
                        Department
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern shadow-sm"
                        value={departmentFilter}
                        onChange={(e) => {
                          setDepartmentFilter(
                            e.target.value === "all"
                              ? "all"
                              : Number(e.target.value)
                          );
                          setCurrentPage(1);
                        }}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          padding: '10px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#8b5cf6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="all">All Departments</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Amount Range */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-dark">
                        <div 
                          className="p-1 rounded me-2"
                          style={{ background: '#d1fae5' }}
                        >
                          <CashStack className="text-success" size={14} />
                        </div>
                        Amount (KES)
                      </label>
                      <Row className="g-2">
                        <Col xs={6}>
                          <Form.Control
                            size="sm"
                            type="number"
                            placeholder="Min"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className="form-control-modern shadow-sm"
                            style={{
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb',
                              padding: '10px 12px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#10b981';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
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
                            className="form-control-modern shadow-sm"
                            style={{
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb',
                              padding: '10px 12px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#10b981';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  {/* Date Range Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-dark">
                        <div 
                          className="p-1 rounded me-2"
                          style={{ background: '#fee2e2' }}
                        >
                          <CalendarEvent className="text-danger" size={14} />
                        </div>
                        Date Range
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern shadow-sm"
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          padding: '10px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="All Time">All Time</option>
                        <option value="Today">📅 Today</option>
                        <option value="This Week">📆 This Week</option>
                        <option value="This Month">🗓️ This Month</option>
                        <option value="Last 30 Days">⏰ Last 30 Days</option>
                      </Form.Select>
                    </div>
                  </Col>

                  {/* Approval Progress Filter */}
                  <Col xs={12} sm={6} md={2}>
                    <div className="filter-item">
                      <label className="filter-label d-flex align-items-center mb-2 fw-semibold text-dark">
                        <div 
                          className="p-1 rounded me-2"
                          style={{ background: '#e0f2fe' }}
                        >
                          <ListCheck className="text-info" size={14} />
                        </div>
                        Progress
                      </label>
                      <Form.Select
                        size="sm"
                        className="form-select-modern shadow-sm"
                        value={approvalFilter}
                        onChange={(e) => {
                          setApprovalFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          padding: '10px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#06b6d4';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="all">All Progress</option>
                        {approvalStatuses
                          .filter((status) => status !== "all")
                          .map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                      </Form.Select>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Table Section */}
              <div className="mt-4">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                      <FileText size={48} className="text-primary" />
                    </div>
                    <h5 className="fw-bold text-dark">No expenses to approve</h5>
                    <p className="text-muted">
                      When expenses are submitted for your approval, they will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="bg-light border-0">
                        <tr>
                          <th
                            className="border-0 py-3 px-4"
                            style={{ width: "40px" }}
                          >
                            <Form.Check
                              type="checkbox"
                              checked={allSelected}
                              ref={(input) => {
                                if (input) input.indeterminate = someSelected;
                              }}
                              onChange={toggleSelectAll}
                              className="mb-0"
                            />
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            #ID
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Created
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Payee
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Payee Number
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Description
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Amount
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Employee
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Department
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Category
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                            Budget
                          </th>
                          <th
                            className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small"
                            style={{ minWidth: 200 }}
                          >
                            Progress
                          </th>
                          <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-end">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentExpenses.map((exp) => {
                          const totalSteps = exp.expenseSteps.length || 0;
                          const approvedSteps = exp.expenseSteps.filter(
                            (s) => s.status === "APPROVED"
                          ).length;
                          const percent =
                            totalSteps === 0
                              ? 0
                              : Math.round((approvedSteps / totalSteps) * 100);
                          const currentStep = exp.expenseSteps.find(
                            (s) => s.status === "PENDING"
                          );

                          return (
                            <tr
                              key={exp.id}
                              className="cursor-pointer border-bottom"
                            >
                              <td className="py-3 px-4">
                                <Form.Check className="mb-0">
                                  <Form.Check.Input
                                    type="checkbox"
                                    checked={selectedExpenses.includes(exp.id)}
                                    onChange={() => toggleExpenseSelection(exp.id)}
                                  />
                                </Form.Check>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center">
                                  <Tag size={14} className="me-1 text-primary" />
                                  <span className="fw-semibold text-primary">
                                    {exp.id}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="d-flex flex-column">
                                  <div className="fw-medium">
                                    {formatDate(exp.createdAt)}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 fw-medium">{exp.payee}</td>
                              <td className="py-3 px-4">{exp.payeeNumber}</td>
                              <td className="py-3 px-4">
                                <div className="d-flex align-items-center ">
                                  <div className="transaction-icon me-1 bg-danger border bg-opacity-50 p-1 rounded-3"></div>
                                  <div>
                                    <div
                                      className="fw-medium text-truncate"
                                      style={{ maxWidth: "200px" }}
                                      title={exp.description}
                                    >
                                      {exp.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="">
                                <div className="d-flex flex-column">
                                  <span className="text-success fw-bold">
                                    {exp?.amount?.toLocaleString() || "0.00"} KES
                                  </span>
                                  <span className="text-muted small">
                                    {exp?.primaryAmount?.toLocaleString() || "0.00"}{" "}
                                    {(() => {
                                      if (!exp) return "N/A";

                                      // If currency is a string (direct currency code)
                                      if (
                                        exp.currency &&
                                        typeof exp.currency === "string"
                                      ) {
                                        return exp.currency;
                                      }

                                      // If currency is an object with initials (type-safe check)
                                      if (
                                        exp.currency &&
                                        typeof exp.currency === "object" &&
                                        exp.currency !== null &&
                                        "initials" in exp.currency
                                      ) {
                                        return (
                                          exp.currency as { initials: string }
                                        ).initials;
                                      }

                                      // If currencyDetails exists and has initials (type-safe check)
                                      if (
                                        exp.currencyDetails &&
                                        "initials" in exp.currencyDetails
                                      ) {
                                        return exp.currencyDetails.initials;
                                      }

                                      return "N/A";
                                    })()}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div>
                                    <span className="fw-medium">
                                      {exp.user.firstName} {exp.user.lastName}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className="px-3 py-2 rounded-pill fw-semibold bg-light bg-opacity-50 text-dark border-0 border-success border-start border-3"
                                >
                                  {exp.department?.name || "-"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className="px-3 py-2 rounded-pill fw-semibold bg-light bg-opacity-50 text-dark border-0 border-warning border-start border-3"
                                >
                                  {exp.category?.name || "-"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded fw-bold ${exp.budget?.remainingBudget < exp.amount
                                    ? "bg-danger bg-opacity-10 text-danger"
                                    : "bg-success bg-opacity-10 text-success"
                                    }`}
                                  title={`Original Budget: ${exp.budget?.originalBudget?.toLocaleString() ||
                                    "N/A"
                                    }`}
                                >
                                  {exp.budget?.remainingBudget?.toLocaleString() ||
                                    "0.00"}
                                </span>
                              </td>
                              <td className="py-3 px-4" style={{ minWidth: 200 }}>
                                <div className="approval-timeline-compact p-2 rounded-3">
                                  {exp.expenseSteps.length > 0 ? (
                                    <div className="timeline-steps d-flex flex-column gap-1">
                                      {/* Progress Header */}
                                      <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="badge bg-secondary-subtle text-dark fw-semibold">
                                          {approvedSteps}/{totalSteps} Steps
                                        </span>
                                        <span className="text-muted small">
                                          {percent}% complete
                                        </span>
                                        {percent === 100 && (
                                          <CheckCircle
                                            size={16}
                                            className="text-success"
                                          />
                                        )}
                                      </div>

                                      {/* Progress Bar */}
                                      {(() => {
                                        const hasRejectedStep =
                                          exp.expenseSteps.some(
                                            (step) => step.status === "REJECTED"
                                          );
                                        const allApproved =
                                          exp.expenseSteps.length > 0 &&
                                          exp.expenseSteps.every(
                                            (step) => step.status === "APPROVED"
                                          );

                                        let variant = "info";
                                        if (hasRejectedStep) variant = "danger";
                                        else if (allApproved) variant = "success";

                                        return (
                                          <ProgressBar
                                            now={percent}
                                            variant={variant}
                                            animated={
                                              !hasRejectedStep &&
                                              !allApproved &&
                                              exp.status === "PENDING"
                                            }
                                            className="rounded-pill shadow-sm"
                                            style={{ height: "6px" }}
                                          />
                                        );
                                      })()}

                                      {/* Current Step Info */}
                                      {(() => {
                                        const hasRejectedStep =
                                          exp.expenseSteps.some(
                                            (step) => step.status === "REJECTED"
                                          );

                                        if (hasRejectedStep) {
                                          const rejectedStep =
                                            exp.expenseSteps.find(
                                              (step) => step.status === "REJECTED"
                                            );
                                          return (
                                            <div className="current-step-info text-center mt-1 bg-danger bg-opacity-10 border-danger">
                                              <small className="text-danger fw-medium">
                                                <XCircle
                                                  size={10}
                                                  className="me-1"
                                                />
                                                Rejected at:{" "}
                                                {rejectedStep?.hierarchyLevel?.role
                                                  ?.name ||
                                                  rejectedStep?.role?.name ||
                                                  "Unknown step"}
                                              </small>
                                            </div>
                                          );
                                        }

                                        const allApproved =
                                          exp.expenseSteps.length > 0 &&
                                          exp.expenseSteps.every(
                                            (step) => step.status === "APPROVED"
                                          );

                                        if (allApproved) {
                                          return (
                                            <div className="current-step-info text-center mt-1 bg-success bg-opacity-10 border-success">
                                              <small className="text-success fw-medium">
                                                <CheckCircle
                                                  size={10}
                                                  className="me-1"
                                                />
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
                                      <InfoCircle size={16} className="mb-1" />
                                      <div className="small">No workflow steps</div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-end">
                                <div className="d-flex gap-2 justify-content-end">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleViewDetails(exp)}
                                    className="d-flex align-items-center justify-content-center rounded-pill"
                                    style={{ width: "32px", height: "32px" }}
                                    title="View Details"
                                  >
                                    <Eye size={14} />
                                  </Button>

                                  {exp.status === "PENDING" && (
                                    <>
                                      <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => handleApprove(exp.id)}
                                        className="d-flex align-items-center justify-content-center rounded-pill"
                                        style={{ width: "32px", height: "32px" }}
                                        title="Approve"
                                      >
                                        <CheckLg size={14} />
                                      </Button>

                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedExpense(exp);
                                          setShowDetailsModal(true);
                                        }}
                                        className="d-flex align-items-center justify-content-center rounded-pill"
                                        style={{ width: "32px", height: "32px" }}
                                        title="Reject"
                                      >
                                        <XLg size={14} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Pagination Footer */}
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted small">
                    Showing{" "}
                    {filteredExpenses.length === 0
                      ? 0
                      : Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        filteredExpenses.length
                      )}{" "}
                    to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredExpenses.length)}{" "}
                    of {filteredExpenses.length} entries
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.Prev
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    />
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2)
                        pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              </div>
            </div>
            {/* End Search and Filters Section */}
          </Card.Body>
        </Card>
        {/* End Main Container Card */}

        {/* Rejection Modal */}
        <Modal
          show={showRejectModal}
          onHide={() => setShowRejectModal(false)}
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <XCircle size={24} className="text-danger" />
              <h6 className="mb-0 fw-bold">
                Reject {selectedExpenses.length} Selected Expense
                {selectedExpenses.length !== 1 ? "s" : ""}
              </h6>
            </div>
          </Modal.Header>
          <div className="bg-light">
            <Modal.Body>
              <div className="d-flex align-items-start gap-3 mb-4">
                <div className="text-warning">
                  <ExclamationTriangle size={20} />
                </div>
                <div>
                  <p className="mb-0 fw-medium">
                    This action cannot be undone. The following expenses will be
                    rejected:
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-white rounded border">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <InfoCircle size={16} className="text-primary" />
                  <span className="small fw-medium">Expense IDs</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedExpenses.map((id) => (
                    <Badge
                      key={id}
                      bg="light"
                      text="dark"
                      className="border d-flex align-items-center gap-1"
                    >
                      <XCircle size={12} className="text-danger" />
                      <span>#{id}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <Form.Group className="mb-0">
                <Form.Label className="small">
                  Reason for rejection <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter the reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </Form.Group>
            </Modal.Body>
          </div>
          <Modal.Footer>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel rejection
            </Button>
            <Button size="sm" variant="danger" onClick={confirmBulkReject}>
              <XLg size={16} className="me-1" />
              Reject expenses
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Expense Details Modal */}
        <Modal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          size="xl"
        >
          {selectedExpense && (
            <>
              <Modal.Header
                closeButton
                className="border-bottom-0 pb-0 position-relative"
              >
                <div
                  className="position-absolute bg-light bg-opacity-10 rounded-top"
                  style={{ borderBottom: "1px solid #dee2e6" }}
                ></div>
                <h6 className="position-relative">
                  <div className="d-flex align-items-center">
                    <div className="modal-icon-wrapper bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                      <ArrowDownCircle size={24} className="text-danger" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">Expense Details</h5>
                      <small className="text-muted">
                        ID: #{selectedExpense.id}
                      </small>
                    </div>
                  </div>
                </h6>
              </Modal.Header>
              <Modal.Body>
                {/* Header with description and amount */}
                <div className="d-flex justify-content-between align-items-start mb-4 p-3 bg-secondary border-secondary bg-opacity-10 rounded-3 shadow-sm">
                  <div className="flex-grow-1 me-3">
                    <h6 className="mb-1 fw-semibold">
                      {selectedExpense.description}
                    </h6>
                    <small className="text-muted">
                      Created on{" "}
                      <DateTimeDisplay date={selectedExpense.createdAt} />
                    </small>
                  </div>
                  <div className="text-end">
                    <h5 className="mb-0 text-danger fw-bold">
                      {selectedExpense.amount.toLocaleString()} KES
                    </h5>
                    <small className="text-muted">Base currency</small>
                  </div>
                </div>
                {/* Steps timeline */}
                <Row className="gy-4">
                  <Col md={6}>
                    <Card className="rounded-4 border-0">
                      <Card.Body className="p-1 border-top border-end rounded">
                        {/* Section Header */}
                        <div className="d-flex align-items-center mb-3 bg-primary border-start border-primary border-3 bg-opacity-10 p-3 rounded-3">
                          <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                            <FileText size={18} className="text-primary" />
                          </div>
                          <h6 className="mb-0 fw-semibold">
                            Expense Information
                          </h6>
                        </div>

                        {/* Info Rows */}
                        <div className="d-flex flex-column gap-3 small">
                          {/* Submission */}
                          <div className="bg-warning bg-opacity-10 p-2 rounded-3 border-start border-warning border-3">
                            <div className="fw-semibold text-muted mb-2 small">
                              Submission
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Submitted On</span>
                              <span className="fw-semibold">
                                {formatDate(selectedExpense.createdAt)}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">Last Updated</span>
                              <span className="fw-semibold">
                                {formatDate(selectedExpense.updatedAt)}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">
                                Reference Number
                              </span>
                              <span className="fw-semibold">
                                {selectedExpense.referenceNumber ? (
                                  <code className="bg-white border px-2 py-1 rounded small">
                                    {selectedExpense.referenceNumber}
                                  </code>
                                ) : (
                                  "N/A"
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Classification */}
                          <div className="bg-warning bg-opacity-10 p-3 rounded-3 border-start border-warning border-3">
                            <div className="fw-semibold text-muted mb-2 small">
                              Classification
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Category</span>
                              <span className="fw-semibold">
                                {selectedExpense.category?.name || "N/A"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">Department</span>
                              <span className="fw-semibold">
                                {selectedExpense.department?.name || "N/A"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">Region</span>
                              <span className="fw-semibold">
                                {selectedExpense.region?.name || "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Payment */}
                          <div className="bg-warning bg-opacity-10 p-3 rounded-3 border-start border-warning border-3">
                            <div className="fw-semibold text-muted mb-2 small">
                              Payment
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Payment Method</span>
                              <span className="fw-semibold">
                                {selectedExpense.paymentMethod?.name || "N/A"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">Payee ID</span>
                              <span className="fw-semibold">
                                {selectedExpense.payeeId || "N/A"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">Exchange Rate</span>
                              <span className="fw-semibold">N/A</span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <div className="detail-section rounded-4 p-1 bg-white border-top border-end">
                      <div className="d-flex align-items-center mb-3 bg-success border-start border-success border-3 bg-opacity-10 p-3 rounded-3">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                          <CheckCircle size={18} className="text-success" />
                        </div>
                        <h6 className="mb-0 fw-semibold">Approval Process</h6>
                      </div>
                      <div className="bg-secondary bg-opacity-10 p-3 rounded-3">
                        {selectedExpense.expenseSteps.length === 0 ? (
                          <div className="text-muted fst-italic d-flex align-items-center bg-light p-3 rounded-3">
                            <InfoCircle
                              size={16}
                              className="me-2 text-secondary"
                            />
                            No steps configured.
                          </div>
                        ) : (
                          <ul className="timeline list-unstyled position-relative ps-4">
                            {selectedExpense.expenseSteps
                              .sort((a, b) => a.order - b.order)
                              .map((step) => (
                                <li
                                  key={step.id}
                                  className="mb-4 position-relative ps-3"
                                  style={{
                                    borderLeft: "2px solid #dee2e6",
                                  }}
                                >
                                  {/* Timeline dot */}
                                  <span
                                    className="position-absolute top-0 start-0 translate-middle p-2 rounded-circle"
                                    style={{
                                      backgroundColor:
                                        step.status === "PENDING"
                                          ? "#f0ad4e"
                                          : step.status === "APPROVED"
                                            ? "#198754"
                                            : step.status === "REJECTED"
                                              ? "#dc3545"
                                              : "#6c757d",
                                      boxShadow: "0 0 0 4px #fff",
                                    }}
                                  ></span>

                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <div className="fw-semibold text-dark">
                                      Step {step.order}{" "}
                                      <span className="text-muted small">
                                        •{" "}
                                        {step.hierarchyName ||
                                          step.hierarchyLevel?.role?.name ||
                                          step.role?.name ||
                                          "Unassigned role"}
                                      </span>
                                    </div>
                                    <Badge
                                      pill
                                      bg={
                                        step.status === "PENDING"
                                          ? "warning"
                                          : step.status === "APPROVED"
                                            ? "success"
                                            : step.status === "REJECTED"
                                              ? "danger"
                                              : "secondary"
                                      }
                                      className="px-3 py-2 fw-semibold"
                                    >
                                      {humanStatus(step.status)}
                                    </Badge>
                                  </div>

                                  <div className="small text-muted d-flex flex-wrap gap-3">
                                    <span className="d-flex align-items-center">
                                      <Person className="me-1 text-secondary" />
                                      {step.approver
                                        ? `${step.approver.firstName} ${step.approver.lastName}`
                                        : step.nextApprovers &&
                                          step.nextApprovers.length > 0
                                          ? step.nextApprovers
                                            .map(
                                              (u) =>
                                                `${u.firstName} ${u.lastName}`
                                            )
                                            .join(", ")
                                          : "—"}
                                    </span>

                                    {step.updatedAt && (
                                      <span className="d-flex align-items-center">
                                        <Clock className="me-1 text-secondary" />
                                        {formatDate(step.updatedAt)}
                                      </span>
                                    )}

                                    {step.comments && (
                                      <span className="d-flex align-items-center">
                                        <ChatText className="me-1 text-secondary" />
                                        {step.comments}
                                      </span>
                                    )}
                                  </div>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Approval actions */}
                <Modal.Footer className="mt-4">
                  <Col>
                    <div className="detail-section small">
                      <h6 className="fw-bold mb-3 d-flex align-items-center">
                        Approval Actions
                      </h6>
                      <Form.Group className="mb-3">
                        <Form.Label>Rejection Reason (if rejecting)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <Form.Text> Provide reason...</Form.Text>
                      </Form.Group>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApproveExpenseFromModal(true)}
                        >
                          <CheckLg size={16} className="me-1" />
                          Approve Expense
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleApproveExpenseFromModal(false)}
                        >
                          <XLg size={16} className="me-1" />
                          Reject Expense
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Modal.Footer>
              </Modal.Body>
              <Modal.Footer className="border-top-0">
                <Button
                  variant="light"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* Enhanced CSS Styles */}
        <style jsx>{`
          /* Modern Search Styles */
          .modern-search-container {
            width: 100%;
          }
          
          .search-icon-external {
            padding: 0.65rem;
            background: linear-gradient(135deg, #f0f4ff 0%, #e7f1ff 100%);
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid #667eea;
          }
          
          .search-icon-external:hover {
            background: linear-gradient(135deg, #e7f1ff 0%, #d9e7ff 100%);
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
          }
          
          .search-input-wrapper {
            position: relative;
            background: white;
            border-radius: 0.75rem;
            border: 2px solid #e9ecef;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          
          .search-input-wrapper:hover {
            transform: translateY(-2px);
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
          
          .search-input-wrapper:focus-within {
            transform: translateY(-2px);
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
          }
          
          .modern-search-input {
            border: none !important;
            padding: 0.85rem 3.5rem 0.85rem 1.25rem;
            font-size: 0.95rem;
            background: transparent;
            outline: none;
            box-shadow: none !important;
            border-radius: 0;
            font-weight: 500;
          }
          
          .modern-search-input::placeholder {
            color: #94a3b8;
            font-style: normal;
            font-weight: 400;
          }
          
          .clear-search-btn {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(239, 68, 68, 0.1);
            border: none;
            color: #ef4444;
            cursor: pointer;
            z-index: 5;
            padding: 0.4rem;
            border-radius: 50%;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .clear-search-btn:hover {
            color: white;
            background: #ef4444;
            transform: translateY(-50%) scale(1.15);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
          }
          
          .search-results-count {
            margin-top: 0.75rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
            border-radius: 0.5rem;
            border-left: 4px solid #667eea;
            animation: slideInFromTop 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
          }
          
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateY(-15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Enhanced Filter Styles */
          .filters-section {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 1.5rem;
            border: 2px solid rgba(102, 126, 234, 0.1);
            margin-bottom: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          }
          
          .filter-header-bar {
            background: linear-gradient(135deg, #f0f4ff 0%, #e7f1ff 100%);
            backdrop-filter: blur(5px);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
          }
          
          .filter-item {
            background: white;
            padding: 1rem;
            border-radius: 0.75rem;
            border: 2px solid #e9ecef;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
          }
          
          .filter-item:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            transform: translateY(-3px);
            border-color: #cbd5e1;
          }
          
          .filter-label {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            display: flex;
            align-items: center;
          }
          
          .form-select-modern,
          .form-control-modern {
            border: 2px solid #e9ecef;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            background-color: white;
            padding: 0.6rem 0.85rem;
            font-weight: 500;
            font-size: 0.9rem;
          }
          
          .form-select-modern:hover,
          .form-control-modern:hover {
            border-color: #cbd5e1;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          }
          
          .form-select-modern:focus,
          .form-control-modern:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
            background-color: white;
          }

          /* Enhanced Analytics Dashboard Styles */
          .analytics-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
            position: relative;
            overflow: hidden;
            border-radius: 0.75rem !important;
          }
          
          .analytics-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
          }
          
          .analytics-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
            pointer-events: none;
          }
          
          .chart-container {
            position: relative;
            background: white;
            border-radius: 0.75rem;
            padding: 1.25rem;
            border: 2px solid rgba(102, 126, 234, 0.1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          
          .chart-bar {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          .chart-bar:hover {
            transform: scaleY(1.08) translateY(-2px) !important;
            filter: brightness(1.15);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25) !important;
          }
          
          .category-breakdown .progress {
            background-color: rgba(102, 126, 234, 0.08);
            border-radius: 999px;
            height: 10px;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .category-breakdown .progress-bar {
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }
          
          .status-overview .badge {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.5rem 0.85rem;
            border-radius: 0.5rem;
            letter-spacing: 0.3px;
          }

          /* Enhanced Timeline Visualization Styles */
          .approval-timeline-compact {
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
            border: 2px solid rgba(102, 126, 234, 0.15);
            min-width: 200px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .timeline-node {
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .timeline-node:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
          }
          
          .timeline-node.approved {
            background: #10b981;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          .timeline-node.rejected {
            background: #ef4444;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          
          .timeline-node.pending {
            background: #f59e0b;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          .timeline-node.not_started {
            background: #94a3b8;
            box-shadow: 0 2px 6px rgba(148, 163, 184, 0.2);
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.75;
              transform: scale(1.05);
            }
          }
          
          .steps-flow {
            padding: 0.75rem;
            background: white;
            border-radius: 0.75rem;
            border: 2px solid rgba(102, 126, 234, 0.1);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          }
          
          .current-step-info {
            background: rgba(102, 126, 234, 0.08);
            border-radius: 0.5rem;
            padding: 0.5rem 0.85rem;
            border-left: 4px solid #667eea;
            font-weight: 600;
          }

          /* Enhanced Table Styles */
          .table thead th {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%) !important;
            border-bottom: 2px solid #667eea !important;
            color: #1f2937 !important;
            font-weight: 700 !important;
            letter-spacing: 0.5px !important;
          }
          
          .table tbody tr {
            transition: all 0.2s ease;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          
          .table tbody tr:hover {
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%) !important;
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
          }

          /* Enhanced Card Styles */
          .card {
            border-radius: 1rem !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          .card:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
          }

          /* Enhanced Button Styles */
          .btn {
            border-radius: 0.75rem !important;
            font-weight: 600 !important;
            letter-spacing: 0.3px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            padding: 0.6rem 1.25rem !important;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15) !important;
          }
          
          .btn-sm {
            padding: 0.45rem 1rem !important;
            font-size: 0.85rem !important;
          }
          
          .btn-primary {
            background: #667eea !important;
            border-color: #667eea !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
          }
          
          .btn-primary:hover {
            background: #5568d3 !important;
            border-color: #5568d3 !important;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
          }
          
          .rounded-pill {
            border-radius: 999px !important;
          }

          /* Enhanced Badge Styles */
          .badge {
            font-weight: 600 !important;
            letter-spacing: 0.3px !important;
            padding: 0.5rem 0.9rem !important;
            border-radius: 0.5rem !important;
            font-size: 0.8rem !important;
          }

          /* Progress Bar Enhancement */
          .progress {
            border-radius: 999px !important;
            background-color: rgba(102, 126, 234, 0.1) !important;
            height: 8px !important;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .progress-bar {
            border-radius: 999px !important;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }

          /* Pagination Enhancement */
          .pagination .page-item .page-link {
            border-radius: 0.5rem !important;
            margin: 0 0.25rem;
            border: 2px solid #e9ecef;
            color: #64748b;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          
          .pagination .page-item .page-link:hover {
            background: #f0f4ff;
            border-color: #667eea;
            color: #667eea;
            transform: translateY(-2px);
          }
          
          .pagination .page-item.active .page-link {
            background: #667eea !important;
            border-color: #667eea !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          /* Responsive Enhancements */
          @media (max-width: 768px) {
            .search-icon-external {
              padding: 0.5rem;
            }
            
            .filter-item {
              padding: 0.75rem;
            }
            
            .filters-section {
              padding: 1rem;
            }
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
