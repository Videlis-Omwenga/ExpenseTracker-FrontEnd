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
  FaHourglassHalf,
  FaCheck,
  FaTimes,
  FaMinus,
  FaListAlt,
} from "react-icons/fa";
import {
  Search,
  Filter,
  CheckCircle,
  ClockHistory,
  FileText,
  Download,
  Eye,
  CheckLg,
  XLg,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import Navbar from "../components/Navbar";
import { BASE_API_URL } from "../static/apiConfig";
import { toast } from "react-toastify";
import AuthProvider from "../authPages/tokenData";
import { ArrowDownCircle, Tag } from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
};

/** Utility formatters */
const formatMoney = (amount: number, currency: string | Currency) => {
  // Handle both string currency code and Currency object
  const currencyCode =
    typeof currency === "string" ? currency : currency?.initials || "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl.NumberFormat fails
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
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
  const itemsPerPage = 5;

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch "expenses to approve" */
  const fetchExpensesToApprove = async () => {
    setIsLoading(true);
    setError(null);
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

      // Oldest → newest (your service already orders, this is a defensive sort)
      data.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setExpenses(data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch expenses");
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
          body: JSON.stringify({ expenseId: id, isApproved: true }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      toast.success("Expense approved successfully");
      await fetchExpensesToApprove();
    } catch (e: any) {
      toast.error(`Approve failed: ${e?.message || e}`);
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
    await Promise.all(selectedExpenses.map((id) => approveExpense(id)));
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
  const handleApprove = (id: number) => approveExpense(id);

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  /** Stats – Pending count from actual data */
  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;

  return (
    <AuthProvider>
      <Navbar />
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="align-items-center mb-4">
          <Col>
            <h3 className="fw-bold mb-1">Expense Approval</h3>
            <p className="text-muted mb-0 small">
              Review and approve pending expense requests
            </p>
          </Col>
          <Col xs="auto" />
        </Row>

        {/* Stats */}
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-container bg-primary bg-opacity-10 me-3">
                    <ClockHistory size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-muted small">Pending Approval</div>
                    <h4 className="mb-0">{pendingCount}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-container bg-success bg-opacity-10 me-3">
                    <CheckCircle size={20} className="text-success" />
                  </div>
                  <div>
                    <div className="text-muted small">Approved (visible)</div>
                    <h4 className="mb-0">
                      {expenses.filter((e) => e.status === "APPROVED").length}
                    </h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-container bg-info bg-opacity-10 me-3">
                    <FileText size={20} className="text-info" />
                  </div>
                  <div>
                    <div className="text-muted small">Total in list</div>
                    <h4 className="mb-0">{expenses.length}</h4>
                  </div>
                </div>
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
        <Card className="mb-4">
          <Card.Header className="bg-white border-bottom-0 d-flex justify-content-between align-items-center flex-wrap">
            <h5 className="mb-0 me-3">Expense Requests</h5>
            <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
              <div className="search-box d-flex">
                <Search className="search-icon" />
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
                <Table hover className="align-middle mb-0">
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
                      <th className="py-3">Description</th>
                      <th className="py-3">Employee</th>
                      <th className="py-3">Department</th>
                      <th className="py-3">Category</th>
                      <th className="text-end py-3">Amount</th>
                      <th className="py-3">Status</th>
                      <th className="py-3" style={{ minWidth: 200 }}>
                        Progress
                      </th>
                      <th className="text-end pe-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentExpenses.map((exp) => {
                      const hasReceipt = !!exp.receiptUrl;

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
                            <div className="text-muted small">
                              {formatDate(exp.createdAt)}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center small">
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
                              className="px-2 py-1 rounded border"
                            >
                              {exp.category?.name || "-"}
                            </Badge>
                          </td>
                          <td className="small fw-bold text-end">
                            {formatMoney(
                              exp.amount,
                              exp.currencyDetails || exp.currency
                            )}
                          </td>
                          <td>
                            {exp.status === "PENDING" ? (
                              <Badge
                                bg="danger bg-opacity-10 text-danger"
                                className="px-2 py-1 d-flex align-items-center gap-1"
                              >
                                <ClockHistory size={13} />
                                Pending
                              </Badge>
                            ) : exp.status === "APPROVED" ? (
                              <Badge
                                bg="success"
                                className="px-2 py-1 d-flex align-items-center gap-1"
                              >
                                <CheckCircle size={13} />
                                Approved
                              </Badge>
                            ) : (
                              <Badge
                                bg="danger bg-opacity-10 text-danger"
                                className="px-2 py-1 d-flex align-items-center gap-1"
                              >
                                <XLg size={13} />
                                Rejected
                              </Badge>
                            )}
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
                className="border-bottom-0 pb-0 fw-bold"
              >
                <h4 className="fw-bold">
                  Expense Details #{selectedExpense.id}
                </h4>
              </Modal.Header>
              <Modal.Body>
                <Row className="gy-4">
                  <Col md={6} className="small">
                    <div className="detail-section border-bottom">
                      <h6 className="section-title">Expense Information</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-5">Employee</dt>
                        <dd className="col-sm-7">
                          {(selectedExpense.user?.firstName || "") +
                            " " +
                            (selectedExpense.user?.lastName || "")}
                        </dd>

                        <dt className="col-sm-5">Department</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.department?.name ||
                            selectedExpense.user?.department?.name ||
                            "-"}
                        </dd>

                        <dt className="col-sm-5">Category</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.category?.name || "-"}
                        </dd>

                        <dt className="col-sm-5">Description</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.description}
                        </dd>
                      </dl>
                    </div>
                  </Col>
                  <Col md={6} className="small">
                    <div className="detail-section border-bottom">
                      <h6 className="section-title">Financial Details</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-5">Amount</dt>
                        <dd className="col-sm-7 fw-bold">
                          {formatMoney(
                            selectedExpense.amount,
                            selectedExpense.currencyDetails?.initials ||
                              selectedExpense.currency ||
                              "USD"
                          )}
                        </dd>

                        <dt className="col-sm-5">Currency</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.currencyDetails?.currency ||
                            selectedExpense?.currencyDetails?.initials ||
                            "N/A"}
                          {selectedExpense.currencyDetails?.initials &&
                            ` (${selectedExpense.currencyDetails.initials})`}
                        </dd>

                        <dt className="col-sm-5">Date Submitted</dt>
                        <dd className="col-sm-7">
                          {formatDate(selectedExpense.createdAt)}
                        </dd>

                        <dt className="col-sm-5">Receipt</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.receiptUrl ? (
                            <Button
                              as="a"
                              href={selectedExpense.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="link"
                              size="sm"
                              className="p-0"
                            >
                              View Receipt
                            </Button>
                          ) : (
                            "Not provided"
                          )}
                        </dd>
                      </dl>
                    </div>
                  </Col>
                </Row>

                {/* Steps timeline */}
                <Row className="mt-4">
                  <Col>
                    <div className="detail-section border rounded-4 shadow-sm p-3 p-md-4 bg-white">
                      <h5 className="fw-bold mb-3 d-flex align-items-center">
                        <FaFlag className="me-2 text-primary" />
                        Approval Steps
                      </h5>
                      <br />
                      {selectedExpense.expenseSteps.length === 0 ? (
                        <div className="text-muted fst-italic ps-1">
                          <FaInfoCircle className="me-2" />
                          No steps configured.
                        </div>
                      ) : (
                        <div className="timeline">
                          {selectedExpense.expenseSteps
                            .sort((a, b) => a.order - b.order)
                            .map((step, index) => (
                              <div
                                key={step.id}
                                className="timeline-item d-flex align-items-start mb-4"
                              >
                                {/* Timeline marker */}
                                <div className="timeline-marker me-3 d-flex flex-column align-items-center">
                                  <span
                                    className={`rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center ${
                                      step.status === "PENDING"
                                        ? "bg-warning text-dark"
                                        : step.status === "APPROVED"
                                        ? "bg-success text-white"
                                        : step.status === "REJECTED"
                                        ? "bg-danger text-white"
                                        : "bg-secondary text-white"
                                    }`}
                                    style={{ width: "36px", height: "36px" }}
                                  >
                                    {step.status === "PENDING" ? (
                                      <FaHourglassHalf />
                                    ) : step.status === "APPROVED" ? (
                                      <FaCheck />
                                    ) : step.status === "REJECTED" ? (
                                      <FaTimes />
                                    ) : (
                                      <FaMinus />
                                    )}
                                  </span>
                                  {index <
                                    selectedExpense.expenseSteps.length - 1 && (
                                    <div className="flex-grow-1 border-start border-2 mt-2"></div>
                                  )}
                                </div>

                                {/* Step content */}
                                <div className="flex-grow-1">
                                  <div className="fw-semibold">
                                    Step {step.order}{" "}
                                    <span className="text-muted small">
                                      • {step.role?.name ?? "Unassigned role"}
                                    </span>
                                  </div>

                                  <div className="small text-muted mt-1">
                                    <FaUser className="me-1" />
                                    {step.approver
                                      ? `${step.approver.firstName} ${step.approver.lastName}`
                                      : "—"}
                                    {step.updatedAt && (
                                      <>
                                        {" "}
                                        • <FaClock className="me-1" />
                                        {formatDate(step.updatedAt)}
                                      </>
                                    )}
                                    {step.comments && (
                                      <>
                                        {" "}
                                        • <FaComment className="me-1" />
                                        {step.comments}
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Status badge */}
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
                                  className="ms-3 px-3 py-2 fw-semibold"
                                >
                                  {humanStatus(step.status)}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>

                {/* Approval actions */}
                <Modal.Footer className="mt-4">
                  <Col>
                    <div className="detail-section small">
                      <h5 className="fw-bold mb-3 d-flex align-items-center">
                        Approval Actions
                      </h5>
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
