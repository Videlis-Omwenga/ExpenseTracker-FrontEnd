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
import { ArrowDownCircle, DollarSign, Tag, ListChecks } from "lucide-react";
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
    } catch (e: any) {
      setError(e?.message || "Failed to fetch expenses");
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
    } catch (e: any) {
      toast.error(`Approve failed: ${e?.message || "Unknown error occurred"}`);
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
    };

    try {
      const res = await fetch(
        `${BASE_API_URL}/expense-approvals//expense-for-payment/${id}`,
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
    } catch (e: any) {
      toast.error(`Reject failed: ${e?.message || e}`);
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
        {/* Header */}
        <Row className="align-items-center mb-4">
          <Col>
            {/* Title and Subtitle */}
            <div className="d-flex align-items-center mb-3 bg-info bg-opacity-10 p-3 rounded-4 border-start border-info border-3">
              <div className="p-3 rounded-3 bg-success-primary bg-opacity-10 me-3 shadow-sm">
                <ListChecks className="text-info" size={24} />
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-dark">
                  Queued Expenses for checks
                </h6>
                <p className="text-muted mb-0 small">
                  Review, validate, and approve expenses prior to payment.
                </p>
              </div>
            </div>

            <Row>
              <Col md={6} className="mb-4">
                <div className="p-4 rounded-4 shadow-sm border bg-primary bg-opacity-10 border-0 border-start border-primary border-3">
                  <p className="small text-secondary mb-2">
                    Every submitted expense goes through this check to ensure
                    compliance and readiness for payment:
                  </p>

                  <div className="d-flex flex-column gap-3 small text-secondary">
                    {/* Step 1 */}
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-success bg-opacity-10 p-2 me-3 shadow-sm">
                        <Check2Circle className="text-success" size={18} />
                      </div>
                      <div>
                        <span className="fw-semibold text-dark">Accuracy</span>
                        <div className="text-muted">
                          Verified by approvers and proper documentation
                          attached
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3 shadow-sm">
                        <ShieldCheck className="text-primary" size={18} />
                      </div>
                      <div>
                        <span className="fw-semibold text-dark">
                          Compliance
                        </span>
                        <div className="text-muted">
                          Aligned with company policies and procedures
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <Row>
                  <Col md={6}>
                    <Card className="stat-card border-0 bg-success bg-opacity-10 border-start border-success border-3">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="icon-container bg-success bg-opacity-10 me-3">
                            <DollarSign size={20} className="text-success" />
                          </div>
                          <div>
                            <div className="text-muted small">
                              Total Expenses
                            </div>
                            <h6 className="mb-0 mt-2">
                              {expenses.length > 0
                                ? expenses
                                    .reduce(
                                      (sum, expense) => sum + expense.amount,
                                      0
                                    )
                                    .toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                : "0.00"}
                            </h6>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="stat-card border-0 bg-danger bg-opacity-10 border-start border-danger border-3">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="icon-container bg-danger bg-opacity-10 me-3">
                            <FileText size={20} className="text-danger" />
                          </div>
                          <div>
                            <div className="text-muted small">
                              Total in list
                            </div>
                            <h6 className="mb-0 mt-2">{expenses.length}</h6>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="stat-card border-0 bg-info bg-opacity-10 border-start border-info border-3">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="icon-container bg-info bg-opacity-10 me-3">
                            <FileText size={20} className="text-info" />
                          </div>
                          <div>
                            <div className="text-muted small">
                              Total in list
                            </div>
                            <h6 className="mb-0 mt-2">{expenses.length}</h6>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="stat-card border-0 bg-secondary bg-opacity-10 border-start border-secondary border-3">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="icon-container bg-secondary bg-opacity-10 me-3">
                            <FileText size={20} className="text-secondary" />
                          </div>
                          <div>
                            <div className="text-muted small">
                              Total in list
                            </div>
                            <h6 className="mb-0 mt-2">{expenses.length}</h6>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
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
        <Card className="mb-4">
          <Card.Header className="bg-white border-bottom-0 d-flex justify-content-between align-items-center flex-wrap">
            <h5 className="mb-0 me-3">Expense Requests</h5>
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
                  className="ps-4"
                />
              </div>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
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
              >
                <Download size={16} className="me-1" />
                Export
              </Button>
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
                                Created:{" "}
                                <DateTimeDisplay date={exp.createdAt} />
                              </div>
                              <div className="text-muted small">
                                Updated:{" "}
                                <DateTimeDisplay date={exp.updatedAt} />
                              </div>
                            </div>
                          </td>
                          <td>{exp.payee}</td>
                          <td>{exp.payeeNumber}</td>
                          <td>
                            <div className="d-flex align-items-center ">
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
                          <td>
                            <Badge
                              bg="success bg-opacity-10 text-success"
                              className="px-2 py-1 rounded border"
                            >
                              {exp.department?.name || "-"}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              bg="light"
                              text="dark"
                              className="px-2 py-1 rounded border bg-danger bg-opacity-10"
                            >
                              {exp.category?.name || "-"}
                            </Badge>
                          </td>
                          <td>
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
                          <td style={{ minWidth: 200 }}>
                            <div className="mb-1 small text-muted">
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
                                  : "success"
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
                <div
                  className="d-flex justify-content-between align-items-start mb-4 p-3 bg-light bg-opacity-50 rounded-3"
                  style={{ borderBottom: "1px solid #dee2e6" }}
                >
                  <div className="flex-grow-1 me-3">
                    <h6 className="mb-1 fw-semibold">
                      {selectedExpense.description}
                    </h6>
                    <small className="text-muted">
                      Created on{" "}
                      <DateTimeDisplay
                        date={selectedExpense.createdAt}
                        showTime={false}
                      />
                    </small>
                  </div>
                  <div className="text-end">
                    <h5 className="mb-0 text-danger fw-bold">
                      {selectedExpense.amount.toLocaleString()} KES
                    </h5>
                    <small className="text-muted">Total amount</small>
                  </div>
                </div>
                {/* Steps timeline */}
                <Row className="gy-4">
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-4">
                      <Card.Body className="p-4">
                        {/* Section Header */}
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                            <FileText size={22} className="text-primary" />
                          </div>
                          <h5 className="mb-0 fw-bold text-dark">
                            Expense Information
                          </h5>
                        </div>

                        {/* Info Rows */}
                        <div className="d-flex flex-column gap-3 small">
                          {/* Submission */}
                          <div className="bg-light bg-opacity-50 p-3 rounded-3">
                            <div className="fw-semibold text-uppercase text-muted mb-2 small">
                              Submission
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Submitted On</span>
                              <span className="fw-semibold">
                                <DateTimeDisplay
                                  date={selectedExpense.createdAt}
                                  showTime={true}
                                />
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span className="text-muted">Last Updated</span>
                              <span className="fw-semibold">
                                <DateTimeDisplay
                                  date={selectedExpense.updatedAt}
                                  showTime={true}
                                />
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
                          <div className="bg-light bg-opacity-50 p-3 rounded-3">
                            <div className="fw-semibold text-uppercase text-muted mb-2 small">
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
                          <div className="bg-light bg-opacity-50 p-3 rounded-3">
                            <div className="fw-semibold text-uppercase text-muted mb-2 small">
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
                    <div className="detail-section border rounded-4 shadow-sm p-4 bg-white">
                      <h5 className="fw-bold mb-4 d-flex align-items-center text-dark mb-4">
                        <FaFlag size={16} className="me-2 text-primary fs-4" />
                        Approval Steps
                      </h5>
                      <br />
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
                                    <FaUser className="me-1 text-secondary" />
                                    {step.approver
                                      ? `${step.approver.firstName} ${step.approver.lastName}`
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
          .stat-card {
            border-radius: 10px;
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          .icon-container {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .search-box {
            position: relative;
            width: 220px;
          }
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
            z-index: 10;
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
          table :global(thead th) {
            border-top: none;
            background-color: #f8f9fa;
            font-weight: 600;
            color: #6c757d;
            vertical-align: middle;
          }
          table :global(tbody td) {
            vertical-align: middle;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
