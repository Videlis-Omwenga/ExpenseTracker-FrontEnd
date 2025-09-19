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

type ExpenseStep = {
  id: number;
  order: number;
  status: ApprovalStatus;
  role?: RoleLite | null;
  approver?: UserLite | null;
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
    } catch (e: any) {
      toast.error(`${e?.message}`);
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
    } catch (e: any) {
      toast.error(`Rejection failed: ${e?.message || e}`);
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
      const employee = `${exp.user?.firstName ?? ""} ${
        exp.user?.lastName ?? ""
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

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="py-4">
        {/* Header */}
        <Container fluid className="mb-4 px-0">
          <Row className="g-3 bg">
            <Col>
              <div className="alert alert-info border-0 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-4 rounded-3 shadow-sm border-start border-info border-3">
                <div className="mb-3 mb-md-0">
                  <div className="d-flex align-items-center">
                    <h5 className="fw-bold text-dark mb-0 me-3">
                      Expense Approval Dashboard
                    </h5>
                  </div>
                  <p className="text-muted mb-0 small">
                    Manage and process expense requests efficiently
                  </p>
                </div>
                <div className="d-flex align-items-center small">
                  <div className="text-end">
                    <div className="text-muted mb-1">Last updated</div>
                    <div
                      className="fw-medium text-dark"
                      suppressHydrationWarning
                    >
                      {new Date().toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="ms-3 p-2 bg-primary bg-opacity-10 rounded-circle">
                    <ClockHistory size={18} className="text-primary" />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Stats */}
        <Row className="g-4">
          <Col md={3}>
            <Card className="stat-card shadow-sm border-0 overflow-hidden bg-secondary bg-opacity-10 border-start border-secondary border-3">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <div className="icon-container bg-secondary bg-opacity-10 p-3 rounded-3 me-3">
                    <ClockHistory size={24} className="text-secondary" />
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">
                      Pending Approval
                    </div>
                    <h6 className="mb-0 fw-bold">{pendingCount}</h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="stat-card shadow-sm border-0 overflow-hidden bg-success bg-opacity-10 border-start border-success border-3">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <div className="icon-container bg-success bg-opacity-10 p-3 rounded-3 me-3">
                    <CheckCircle size={24} className="text-success" />
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">
                      Total Amount
                    </div>
                    <h6 className="mb-0 fw-bold">
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
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="stat-card shadow-sm border-0 overflow-hidden bg-info bg-opacity-10 border-start border-info border-3">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <div className="icon-container bg-info bg-opacity-10 p-3 rounded-3 me-3">
                    <FileText size={24} className="text-info" />
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">
                      Total in list
                    </div>
                    <h6 className="mb-0 fw-bold">{expenses.length}</h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <BudgetOverviewHOD />
        </Row>
        <br />
        <br />
        {/* Bulk Actions Bar */}
        {selectedExpenses.length > 0 && (
          <Card className="mb-4 bg-light border-0">
            <Card.Body className="py-2">
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
            </Card.Body>
          </Card>
        )}
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

        {/* Enhanced Search and Filters */}
        <Card className="mb-4">
          <Card.Header className="bg-white p-3">
            {/* Search and Action Row */}
            <Row className="align-items-center g-3 mb-3">
              <Col xs={12} md={4}>
                <h5 className="mb-0">Expense Requests</h5>
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
                  variant="outline-primary"
                  size="sm"
                  onClick={() => window.print()}
                  title="Quick export via browser print"
                  className="me-2"
                >
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </Col>
            </Row>

            {/* Horizontal Filters Row */}
            <div className="filters-section">
              <div className="filter-header-bar d-flex align-items-center justify-content-between mb-3 p-3 bg-success bg-opacity-10 rounded border">
                <h6 className="mb-0 fw-bold text-success">
                  <Funnel className="me-2" size={16} />
                  Filters
                </h6>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="btn-modern text-success"
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
                      <CheckCircle className="me-1" size={12} />
                      Status
                    </label>
                    <Form.Select
                      size="sm"
                      className="form-select-modern"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as any);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All</option>
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
                      onChange={(e) => {
                        setCategoryFilter(
                          e.target.value === "all"
                            ? "all"
                            : Number(e.target.value)
                        );
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All</option>
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
                    <label className="filter-label">
                      <Building className="me-1" size={12} />
                      Department
                    </label>
                    <Form.Select
                      size="sm"
                      className="form-select-modern"
                      value={departmentFilter}
                      onChange={(e) => {
                        setDepartmentFilter(
                          e.target.value === "all"
                            ? "all"
                            : Number(e.target.value)
                        );
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All</option>
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

                {/* Date Range Filter */}
                <Col xs={12} sm={6} md={2}>
                  <div className="filter-item">
                    <label className="filter-label">
                      <CalendarEvent className="me-1" size={12} />
                      Created Date
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
                      <option value="Last 30 Days">Last 30 Days</option>
                    </Form.Select>
                  </div>
                </Col>

                {/* Approval Progress Filter */}
                <Col xs={12} sm={6} md={2}>
                  <div className="filter-item">
                    <label className="filter-label">
                      <ListCheck className="me-1" size={12} />
                      Approval Progress
                    </label>
                    <Form.Select
                      size="sm"
                      className="form-select-modern"
                      value={approvalFilter}
                      onChange={(e) => {
                        setApprovalFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All</option>
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
          </Card.Header>

          <Card.Body className="p-0">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5>No expenses to approve</h5>
                <p className="text-muted">
                  When expenses are submitted for your approval, they will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="table-responsive rounded-3 overflow-hidden border">
                <Table hover className="align-middle mb-0 small">
                  <thead className="bg-light text-muted small">
                    <tr>
                      <th className="ps-4 py-3" style={{ width: "40px" }}>
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
                      <th className="py-3">#ID</th>
                      <th className="py-3">Created</th>
                      <th className="py-3">Payee</th>
                      <th className="py-3">Payee Number</th>
                      <th className="py-3">Description</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Employee</th>
                      <th className="py-3">Department</th>
                      <th className="py-3">Category</th>
                      <th className="py-3">Budget</th>
                      <th className="py-3" style={{ minWidth: 200 }}>
                        Progress
                      </th>
                      <th className="text-end pe-4 py-3">Actions</th>
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
                          <td className="ps-4">
                            <Form.Check className="mb-0">
                              <Form.Check.Input
                                type="checkbox"
                                checked={selectedExpenses.includes(exp.id)}
                                onChange={() => toggleExpenseSelection(exp.id)}
                              />
                            </Form.Check>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Tag size={14} className="me-1 text-primary" />
                              <span>{exp.id}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <div className="">
                                Created: {formatDate(exp.createdAt)}
                              </div>
                              <div className="text-muted small">
                                Updated: {formatDate(exp.updatedAt)}
                              </div>
                            </div>
                          </td>
                          <td>{exp.payee}</td>
                          <td>{exp.payeeNumber}</td>
                          <td>
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
                          <td>
                            <span className="px-2 py-1 rounded bg-primary bg-opacity-10 text-primary small border">
                              {exp.department?.name || "-"}
                            </span>
                          </td>
                          <td>
                            <span className="px-2 py-1 rounded bg-secondary bg-opacity-10 text-dark border small">
                              {exp.category?.name || "-"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded fw-bold ${
                                exp.budget?.remainingBudget < exp.amount
                                  ? "bg-danger bg-opacity-10 text-danger"
                                  : "bg-success bg-opacity-10 text-success"
                              }`}
                              title={`Original Budget: ${
                                exp.budget?.originalBudget?.toLocaleString() ||
                                "N/A"
                              }`}
                            >
                              {exp.budget?.remainingBudget?.toLocaleString() ||
                                "0.00"}
                            </span>
                          </td>
                          <td style={{ minWidth: 200 }}>
                            <div className="mb-1 text-muted">
                              {approvedSteps}/{totalSteps} approved{" "}
                              {currentStep
                                ? `• Now: ${currentStep.role?.name ?? "—"}`
                                : ""}
                            </div>
                            <ProgressBar
                              now={percent}
                              className="rounded-pill"
                              style={{ height: "6px" }}
                              variant={
                                exp.status === "APPROVED"
                                  ? "success"
                                  : exp.status === "PENDING"
                                  ? "info"
                                  : "danger"
                              }
                              animated={exp.status === "PENDING"}
                            />
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex gap-2 justify-content-end">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewDetails(exp)}
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px" }}
                              >
                                <Eye size={14} />
                              </Button>

                              {exp.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleApprove(exp.id)}
                                    className="d-flex align-items-center justify-content-center"
                                    style={{ width: "32px", height: "32px" }}
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
                                    className="d-flex align-items-center justify-content-center"
                                    style={{ width: "32px", height: "32px" }}
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
          </Card.Body>
          <Card.Footer />
        </Card>

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
                                        • {step.role?.name ?? "Unassigned role"}
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
          .clear-search-btn {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
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

          /* Filter Styles */
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
        `}</style>
      </Container>
    </AuthProvider>
  );
}
