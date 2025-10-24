"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  Modal,
  Pagination,
  ProgressBar,
  Row,
  Spinner,
  Table,
  Alert,
} from "react-bootstrap";
import {
  FaFlag,
  FaInfoCircle,
  FaUser,
  FaClock,
  FaComment,
  FaListAlt,
} from "react-icons/fa";
import {
  Filter,
  FileText,
  Download,
  Eye,
  CheckLg,
  XLg,
  ExclamationTriangle,
  Check2Circle,
  ShieldCheck,
} from "react-bootstrap-icons";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";
import { toast } from "react-toastify";
import AuthProvider from "../../authPages/tokenData";
import {
  ArrowDownCircle,
  DollarSign,
  Tag,
  ListChecks,
  CheckCircle,
  User,
} from "lucide-react";
import TopNavbar from "../../components/Navbar";
import { BASE_API_URL } from "@/app/static/apiConfig";

/**
 * TYPES aligned to your NestJS / Prisma backend
 */
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
  budget: Budget;
  expenseSteps: ExpenseStep[];
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  regions: Region[];
  exchangeRateUsed: number;
  countBudget?: number;
};

const humanStatus = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export default function ExpenseApprovalPage() {
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ExpenseStatus>(
    "all"
  );
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  // Form input states
  const [paymentMethodId, setPaymentMethodId] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [regionId, setRegionId] = useState<number | "">("");

  // Initialize form fields when an expense is selected
  useEffect(() => {
    if (selectedExpense) {
      setCategoryId(selectedExpense.category?.id || "");
      setPaymentMethodId(selectedExpense.paymentMethod?.id || "");
      setRegionId(selectedExpense.region?.id || "");
    }
  }, [selectedExpense]);

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch "expenses to approve" */
  const fetchExpensesToApprove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_API_URL}/finance/expenses-to-review`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data: Expense[] = await res.json();

      // Extract unique categories from the expenses
      const uniqueCategories = Array.from(
        data
          .flatMap((expense) => expense.categories || [])
          .reduce((map, category) => {
            if (category?.id) {
              map.set(category.id, category);
            }
            return map;
          }, new Map<number, Category>())
          .values()
      );

      // Extract unique payment methods from the expenses
      const uniquePaymentMethods = Array.from(
        data
          .flatMap((expense) => expense.paymentMethods || [])
          .reduce((map, method) => {
            if (method?.id) {
              map.set(method.id, method);
            }
            return map;
          }, new Map<number, PaymentMethod>())
          .values()
      );

      // Extract unique regions from the expenses
      const uniqueRegions = Array.from(
        data
          .flatMap((expense) => expense.regions || [])
          .reduce((map, region) => {
            if (region?.id) {
              map.set(region.id, region);
            }
            return map;
          }, new Map<number, Region>())
          .values()
      );

      // Update the state with the extracted data
      setCategories(uniqueCategories);
      setPaymentMethods(uniquePaymentMethods);
      setRegions(uniqueRegions);

      // Sort by ID in descending order (newest first)
      data.sort((a, b) => b.id - a.id);

      setExpenses(data);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to fetch expenses";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /** Approve / Reject via single unified endpoint */
  const approveExpense = async (id: number, reason: string) => {
    const payload = {
      paymentMethodId: Number(paymentMethodId),
      categoryId: Number(categoryId),
      regionId: Number(regionId),
      comments: reason,
    };

    try {
      const res = await fetch(
        `${BASE_API_URL}/finance/expense-for-payment/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify(payload),
        }
      );

      let responseData;
      const contentType = res.headers.get("content-type");

      try {
        // Only try to parse as JSON if the response has content and is JSON
        if (contentType && contentType.includes("application/json")) {
          responseData = await res.json();
        } else {
          const text = await res.text();
          responseData = text
            ? { message: text }
            : { message: "No content in response" };
        }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        responseData = { message: "Invalid response format" };
      }

      if (res.ok) {
        toast.success("Expense approved successfully");
        await fetchExpensesToApprove();
      } else {
        const errorMessage =
          responseData?.message || `HTTP error! status: ${res.status}`;
        toast.error(errorMessage);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast.error(`Approve failed: ${errorMessage}`);
    }
  };

  const rejectExpense = async (id: number, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const payload = {
      isApproved: false,
      comments: reason,
      paymentMethodId: Number(paymentMethodId),
      categoryId: Number(categoryId),
      regionId: Number(regionId),
    };

    try {
      const res = await fetch(
        `${BASE_API_URL}/finance/reject-expense/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      toast.success("Expense rejected successfully");
      setRejectionReason("");
      setShowDetailsModal(false);
      await fetchExpensesToApprove();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error(`Reject failed: ${errorMessage}`);
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
      await approveExpense(selectedExpense.id, "Expense approved by finance");
      setShowDetailsModal(false);
    } else {
      await rejectExpense(selectedExpense.id, rejectionReason);
    }
  };

  useEffect(() => {
    fetchExpensesToApprove();
  }, []);

  /** Derived data */
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((exp) => {
      const employee = `${exp.user?.firstName ?? ""} ${
        exp.user?.lastName ?? ""
      }`.trim();
      const department =
        exp.department?.name || exp.user?.department?.name || "";
      const category = exp.category?.name || "";
      const description = exp.description || "";
      const regionName = exp.region?.name || "";
      const paymentMethodName = exp.paymentMethod?.name || "";

      const matchesSearch =
        q.length === 0 ||
        employee.toLowerCase().includes(q) ||
        department.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        regionName.toLowerCase().includes(q) ||
        paymentMethodName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || exp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchQuery, statusFilter]);

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
    await Promise.all(
      selectedExpenses.map((id) =>
        approveExpense(id, "Bulk approved by finance")
      )
    );
    setSelectedExpenses([]);
  };

  const handleBulkReject = async () => {
    if (selectedExpenses.length === 0) return;
    const reason =
      rejectionReason ||
      prompt("Reason for rejection? (applies to all selected)") ||
      "";
    if (!reason.trim()) return;
    await Promise.all(selectedExpenses.map((id) => rejectExpense(id, reason)));
    setSelectedExpenses([]);
    setRejectionReason("");
  };

  /** Per-row actions */
  const handleApprove = (id: number) =>
    approveExpense(id, "Approved via quick action");

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="py-4">
        {/* Modern Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                  <ListChecks className="text-primary" size={28} />
                </div>
                <div>
                  <h2 className="fw-bold text-dark mb-0">
                    Queued Expenses
                  </h2>
                  <p className="text-muted mb-0 small">
                    Review and validate expenses ready for payment
                  </p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-2 border-primary opacity-25 mb-4" />
        </div>

        {/* Stats and Info */}
        <Row className="mb-4">
          <Col md={6} className="mb-4 mb-md-0">
            <Card className="border-0 shadow-sm rounded-3 bg-primary bg-opacity-10 border-start border-primary border-2 h-100">
              <Card.Body className="p-4">
                <p className="small text-secondary mb-2">
                  Every submitted expense goes through this check to ensure
                  compliance and readiness for payment:
                </p>
                <br />
                <div className="d-flex flex-column gap-3 small text-secondary">
                  {/* Step 1 */}
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 p-2 me-3 shadow-sm">
                      <Check2Circle className="text-success" size={18} />
                    </div>
                    <div>
                      <span className="fw-semibold text-dark">Accuracy</span>
                      <div className="text-muted">
                        Verified by approvers and proper documentation attached
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3 shadow-sm">
                      <ShieldCheck className="text-primary" size={18} />
                    </div>
                    <div>
                      <span className="fw-semibold text-dark">Compliance</span>
                      <div className="text-muted">
                        Aligned with company policies and procedures
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm rounded-3 h-100">
              <Card.Body className="p-4">
                <Row className="g-3">
                  {/* Total Expenses */}
                  <Col xs={6}>
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 border-start border-success border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                          <DollarSign size={18} className="text-success" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Total Expenses</p>
                          <h6 className="mb-0 fw-bold">
                            {expenses.length > 0
                              ? expenses
                                  .reduce((sum, expense) => sum + expense.amount, 0)
                                  .toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                              : "0.00"}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Total in List */}
                  <Col xs={6}>
                    <div className="bg-danger bg-opacity-10 p-3 rounded-3 border-start border-danger border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-danger bg-opacity-10 p-2 rounded me-2">
                          <FileText size={18} className="text-danger" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Total in List</p>
                          <h6 className="mb-0 fw-bold">{expenses.length}</h6>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Budgets */}
                  <Col xs={6}>
                    <div className="bg-info bg-opacity-10 p-3 rounded-3 border-start border-info border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                          <FileText size={18} className="text-info" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Budgets</p>
                          <h6 className="mb-0 fw-bold">
                            {expenses.length > 0
                              ? expenses.reduce(
                                  (sum, exp) => sum + (exp.countBudget || 0),
                                  0
                                )
                              : 0}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Last User */}
                  <Col xs={6}>
                    <div className="bg-secondary bg-opacity-10 p-3 rounded-3 border-start border-secondary border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-secondary bg-opacity-10 p-2 rounded me-2">
                          <User size={18} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Last User</p>
                          <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: "120px" }}>
                            {expenses.length > 0
                              ? `${expenses[0].user.firstName} ${expenses[0].user.lastName}`
                              : "N/A"}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

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
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={handleBulkApprove}
                  >
                    <CheckLg size={16} className="me-1" />
                    Approve Selected
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleBulkReject}
                  >
                    <XLg size={16} className="me-1" />
                    Reject Selected
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Table */}
        <Card className="mb-4 border-0 shadow-sm rounded-3">
          <Card.Header className="bg-white border-0 py-3 px-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <h5 className="mb-0 me-3 fw-bold">Queued Expense Requests</h5>
              <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
                <div className="search-box d-flex">
                  <Form.Control
                    type="search"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setSearchQuery(e.target.value);
                    }}
                    className="border-0 bg-light"
                  />
                </div>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    size="sm"
                    className="border-0 bg-light rounded-pill"
                  >
                    <Filter size={16} className="me-1" />
                    Status:{" "}
                    {statusFilter === "all" ? "All" : humanStatus(statusFilter)}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={() => {
                        setStatusFilter("all");
                        setCurrentPage(1);
                      }}
                    >
                      All
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => {
                        setStatusFilter("PENDING");
                        setCurrentPage(1);
                      }}
                    >
                      Pending
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => {
                        setStatusFilter("APPROVED");
                        setCurrentPage(1);
                      }}
                    >
                      Approved
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => {
                        setStatusFilter("REJECTED");
                        setCurrentPage(1);
                      }}
                    >
                      Rejected
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => window.print()}
                  title="Quick export via browser print"
                  className="rounded-pill"
                >
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2">Loading expenses...</div>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-3">
                <ExclamationTriangle className="me-2" />
                {error}
                <div className="mt-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={fetchExpensesToApprove}
                  >
                    Try Again
                  </Button>
                </div>
              </Alert>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5>No expenses to approve</h5>
                <p className="text-muted">
                  When expenses are submitted for your approval, they will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="border-0">
                    <tr>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small" style={{ width: "40px" }}>
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
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">#ID</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Created</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Payee</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Payee Number</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Description</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Amount</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Employee</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Department</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Category</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Budget</th>
                      <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small" style={{ minWidth: 200 }}>
                        Progress
                      </th>
                      <th className="border-0 text-end py-3 px-4 fw-semibold text-muted text-uppercase small">Actions</th>
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
                          className="cursor-pointer"
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
                              <span>{exp.id}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="d-flex flex-column">
                              <div className="">
                                Created:{" "}
                                <DateTimeDisplay date={exp.createdAt} />
                              </div>
                              <div className="text-muted small">
                                Updated:{" "}
                                <DateTimeDisplay date={exp.updatedAt} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{exp.payee}</td>
                          <td className="py-3 px-4">{exp.payeeNumber}</td>
                          <td className="py-3 px-4">
                            <div className="d-flex align-items-center">
                              <div className="transaction-icon me-1 bg-light border bg-opacity-10 p-1 rounded-3">
                                <FaListAlt className="text-success" size={14} />
                              </div>
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
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4">
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center rounded-circle me-2 small">
                                {exp.user.firstName.charAt(0)}
                                {exp.user.lastName.charAt(0)}
                              </div>
                              <div>
                                <small className="fw-medium">
                                  {exp.user.firstName} {exp.user.lastName}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              bg="success bg-opacity-10 text-success"
                              className="px-2 py-1 rounded border"
                            >
                              {exp.department?.name || "-"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              bg="light"
                              text="dark"
                              className="px-2 py-1 rounded border bg-danger bg-opacity-10"
                            >
                              {exp.category?.name || "-"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`px-2 py-1 rounded ${
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
                                "N/A"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4" style={{ minWidth: 200 }}>
                            <div className="mb-1 small text-muted">
                              {approvedSteps}/{totalSteps} approved{" "}
                              {currentStep
                                ? `• Now: ${currentStep.hierarchyName || currentStep.role?.name || "—"}`
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
                                  : "success"
                              }
                              animated={exp.status === "PENDING"}
                            />
                          </td>
                          <td className="text-end py-3 px-4">
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
                  className="position-absolute h-100 bg-light bg-opacity-10 rounded-top"
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
                <div className="d-flex justify-content-between align-items-start mb-4 p-3 bg-secondary border-secondary bg-opacity-10 rounded-3">
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
                          <div className="bg-warning bg-opacity-10 p-2 rounded-3 border-start border-warning border-3 mb-4">
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
                          <div className="bg-warning bg-opacity-10 p-2 rounded-3 border-start border-warning border-3 mb-4">
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

                  <Col md={6}>
                    <div className="detail-section border rounded-4 shadow-sm p-4 bg-white">
                      <div className="d-flex align-items-center mb-3 bg-success border-start border-success border-3 bg-opacity-10 p-3 rounded-3">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                          <CheckCircle size={18} className="text-success" />
                        </div>
                        <h6 className="mb-0 fw-semibold">Approval Process</h6>
                      </div>
                      <div className="bg-secondary bg-opacity-10 p-3 rounded-3">
                        {selectedExpense.expenseSteps.length === 0 ? (
                          <div className="text-muted fst-italic d-flex align-items-center bg-light p-3 rounded-3">
                            <FaInfoCircle
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
                                        • {step.hierarchyName || step.role?.name || "Unassigned role"}
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
                                      <FaUser className="me-1 text-secondary" />
                                      {step.approver
                                        ? `${step.approver.firstName} ${step.approver.lastName}`
                                        : step.nextApprovers && step.nextApprovers.length > 0
                                        ? step.nextApprovers.map(u => `${u.firstName} ${u.lastName}`).join(", ")
                                        : "—"}
                                    </span>

                                    {step.updatedAt && (
                                      <span className="d-flex align-items-center">
                                        <FaClock className="me-1 text-secondary" />
                                        <DateTimeDisplay
                                          date={step.updatedAt}
                                          showTime={true}
                                        />
                                      </span>
                                    )}

                                    {step.comments && (
                                      <span className="d-flex align-items-center">
                                        <FaComment className="me-1 text-secondary" />
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
                      <h5 className="fw-bold mb-3 d-flex align-items-center">
                        Payment Actions
                      </h5>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          value={categoryId || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : "";
                            setCategoryId(value);
                          }}
                        >
                          <option value="">Select category...</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                          value={paymentMethodId || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : "";
                            setPaymentMethodId(value);
                          }}
                        >
                          <option value="">Select payment method...</option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Region</Form.Label>
                        <Form.Select
                          value={regionId || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : "";
                            setRegionId(value);
                          }}
                          disabled={!regions.length}
                        >
                          <option value="">
                            {regions.length
                              ? "Select region..."
                              : "Loading regions..."}
                          </option>
                          {regions.map((region) => (
                            <option
                              key={`region-${region.id}`}
                              value={region.id}
                            >
                              {region.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Rejection Reason (if rejecting)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <Form.Text>Provide reason...</Form.Text>
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
                          Reject payment
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

        {/* Styles */}
        <style jsx>{`
          .dashboard-container {
            background-color: #f8f9fa;
          }
          .transactions-table {
            border-collapse: separate;
            border-spacing: 0;
          }
          .transactions-table tr {
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .transactions-table tr:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
          .transactions-table td {
            border-top: 1px solid #f0f0f0;
            vertical-align: middle;
            padding: 1rem;
          }
          .transactions-table th {
            border: none;
            padding: 0.75rem 1rem;
            background-color: #f8f9fa;
            font-weight: 600;
            color: #6c757d;
          }
          .transaction-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
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
        `}</style>
      </Container>
    </AuthProvider>
  );
}
