"use client";

import { useState, useEffect, useMemo } from "react";
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
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip,
  ProgressBar,
} from "react-bootstrap";
import {
  ArrowDownCircle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle,
  ClockHistory,
  ArrowRepeat,
  XCircle,
  Circle,
} from "react-bootstrap-icons";
import CreateExpenseModal from "../components/modals/create-expense-modal";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../static/apiConfig";
import AuthProvider from "../authPages/tokenData";

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

  // When included by API:
  workflowStep?: WorkflowStep | null;

  // Convenience fields (derived)
  level?: number; // alias for order
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  category?: string | null;
  receiptUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  isActive?: boolean | null;

  payee: string;
  payeeId: string;
  payeeNumber?: string | null;
  department?: string | null;
  paymentMethod?: string | null;
  region?: string | null;
  referenceNumber?: string | null;

  userId: number;
  user: User;
  workflowId?: number | null;

  // Important:
  expenseSteps: ExpenseStep[];

  createdAt: Date;
  updatedAt: Date;
}

type ExpenseRow = Expense;

/** ========= Helpers ========= */

const parseDate = (d: any): Date => {
  try {
    return d ? new Date(d) : new Date();
  } catch {
    return new Date();
  }
};

const normalizeStatus = (s: any): string =>
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

const countApproved = (steps: ExpenseStep[]) =>
  steps.filter((s) => normalizeStatus(s.status) === "APPROVED").length;

const getProgressPercent = (steps: ExpenseStep[]) => {
  if (!steps?.length) return 0;
  const total = steps.length;
  const approved = countApproved(steps);
  // If there is a REJECTED, we show 100% of "decision reached"
  const rejected = steps.some((s) => normalizeStatus(s.status) === "REJECTED");
  if (rejected) return 100;
  return Math.floor((approved / total) * 100);
};

export default function FinanceDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const handleNavigation = (path: string) => router.push(path);

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

      const data = await response.json();

      if (Array.isArray(data)) {
        const mapped: ExpenseRow[] = data.map((item: any): ExpenseRow => {
          const steps: ExpenseStep[] = Array.isArray(item.expenseSteps)
            ? item.expenseSteps
                .map((s: any) => ({
                  id: Number(s.id),
                  order: Number(s.order ?? 0),
                  level: Number(s.order ?? 0),
                  isOptional: Boolean(s.isOptional ?? false),
                  status:
                    (normalizeStatus(s.status) as ApprovalStatus) ||
                    "NOT_STARTED",
                  comments: s.comments ?? null,
                  role: s.role
                    ? {
                        id: Number(s.role.id),
                        name: s.role.name ?? "Unknown role",
                      }
                    : null,
                  approver: s.approver
                    ? {
                        id: Number(s.approver.id),
                        firstName: s.approver.firstName ?? "",
                        lastName: s.approver.lastName ?? "",
                        email: s.approver.email ?? "",
                      }
                    : null,
                  workflowStep: s.workflowStep
                    ? {
                        id: Number(s.workflowStep.id),
                        order: Number(s.workflowStep.order ?? 0),
                        isOptional: Boolean(s.workflowStep.isOptional ?? false),
                        role: s.workflowStep.role
                          ? {
                              id: Number(s.workflowStep.role.id),
                              name: s.workflowStep.role.name ?? "Unknown role",
                            }
                          : null,
                      }
                    : null,
                }))
                .sort((a: ExpenseStep, b: ExpenseStep) => a.order - b.order)
            : [];

          const mappedUser: User =
            item.user && typeof item.user === "object"
              ? {
                  id: Number(item.user.id ?? 0),
                  firstName: item.user.firstName ?? "Unknown",
                  lastName: item.user.lastName ?? "User",
                  email: item.user.email ?? "",
                }
              : { id: 0, firstName: "Unknown", lastName: "User", email: "" };

          return {
            id: Number(item.id ?? 0),
            description: item.description ?? "",
            amount: Number(item.amount ?? 0),
            currency: item.currency ?? "",
            category: item.category ?? null,
            receiptUrl: item.receiptUrl ?? null,
            status:
              (normalizeStatus(item.status) as ExpenseRow["status"]) ||
              "PENDING",
            isActive: Boolean(item.isActive ?? true),

            payee: item.payee ?? "",
            payeeId: item.payeeId ?? "",
            payeeNumber: item.payeeNumber ?? null,
            department: item.department ?? null,
            paymentMethod: item.paymentMethod ?? null,
            region: item.region ?? null,
            referenceNumber: item.referenceNumber ?? null,

            userId: Number(item.userId ?? 0),
            user: mappedUser,
            workflowId:
              item.workflowId != null ? Number(item.workflowId) : null,

            expenseSteps: steps,

            createdAt: parseDate(item.createdAt),
            updatedAt: parseDate(item.updatedAt),
          };
        });

        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (error: any) {
      toast.error(
        "Failed to load expenses: " + (error?.message || String(error))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleViewDetails = (expense: ExpenseRow) => {
    setSelectedExpense(expense);
    setShowModal(true);
  };

  /** ===== Derived/UI state ===== */

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) => {
      const who = `${e.user.firstName} ${e.user.lastName}`.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        String(e.amount).toLowerCase().includes(q) ||
        who.includes(q)
      );
    });
  }, [expenses, searchQuery]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const d = new Date(date);
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (dd.getTime() === today.getTime()) {
      return `Today, ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (dd.getTime() === yesterday.getTime()) {
      return `Yesterday, ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return d.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container fluid className="dashboard-container px-4 py-3">
          <Row
            className="align-items-center justify-content-center"
            style={{ height: "50vh" }}
          >
            <Col className="text-center">
              <Spinner animation="border" role="status" variant="primary" />
              <p className="mt-3">Loading expenses...</p>
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  return (
    <AuthProvider>
      <Navbar />
      <Container fluid className="dashboard-container px-4 py-3">
        {/* Header */}
        <Row className="align-items-center mb-4">
          <Alert
            variant="info"
            className="d-flex justify-content-between align-items-center w-100"
          >
            <div>
              <h3 className="fw-bold mb-1">Dashboard</h3>
              <p className="text-muted mb-0 small">
                Welcome back! Here's your expense management dashboard
              </p>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner animation="border" size="sm" className="me-1" />
              ) : (
                <ArrowRepeat className="me-1" />
              )}
              Refresh
            </Button>
          </Alert>
        </Row>

        {/* Main Content Area */}
        <Row className="g-4">
          <Col lg={12}>
            <Card className="mb-4">
              <Card.Header className="bg-white border-bottom-0">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  <Col sm={4}>
                    <CreateExpenseModal onSuccess={fetchExpenses} />
                  </Col>
                  <Col sm={4}>
                    <Button
                      variant="light"
                      className="w-100 text-start py-3 border"
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                          <ArrowDownCircle size={20} className="text-danger" />
                        </div>
                        <div>
                          <div className="fw-medium text-danger">
                            Check budgets
                          </div>
                          <small className="text-muted d-block">
                            Check department budgets
                          </small>
                        </div>
                      </div>
                    </Button>
                  </Col>
                  <Col sm={4}>
                    <Button
                      variant="light"
                      className="w-100 text-start py-3 border"
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                          <FileText size={20} className="text-success" />
                        </div>
                        <div>
                          <div className="fw-medium text-success">
                            Generate Report
                          </div>
                          <small className="text-muted d-block">
                            Export financial data
                          </small>
                        </div>
                      </div>
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Expenses Table */}
        <Container fluid className="mt-5">
          <Card className="mb-4">
            <Card.Header className="bg-white border-bottom-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Expenses</h5>
              <div className="d-flex">
                <div className="search-box me-2 d-flex d-wrap">
                  <Search className="search-icon" />
                  <Form.Control
                    type="search"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-4"
                  />
                </div>
                <Button variant="outline-secondary" size="sm" className="me-2">
                  <Filter size={16} className="me-1" />
                  Filter
                </Button>
              </div>
            </Card.Header>

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
                <Table hover className="mb-0 transactions-table">
                  <thead>
                    <tr>
                      <th>#ID</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Submitted By</th>
                      <th>Status</th>
                      <th style={{ minWidth: 260 }}>Approval Progress</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => {
                      const badge = statusBadge(expense.status);
                      const approved = countApproved(expense.expenseSteps);
                      const total = expense.expenseSteps.length;
                      const progress = getProgressPercent(expense.expenseSteps);

                      return (
                        <tr
                          key={expense.id}
                          onClick={() => handleViewDetails(expense)}
                        >
                          <td>{expense.id}</td>
                          <td>{expense.createdAt.toDateString()}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="transaction-icon me-3 bg-danger-subtle">
                                <ArrowDownCircle className="text-danger" />
                              </div>
                              <div>
                                <div
                                  className="fw-medium"
                                  title={expense.description}
                                >
                                  {expense.description.length > 20
                                    ? `${expense.description.substring(
                                        0,
                                        20
                                      )}...`
                                    : expense.description}
                                </div>
                                <small className="text-muted">
                                  {formatDate(expense.createdAt)}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="fw-medium text-danger">
                            {expense.currency} {expense.amount.toFixed(2)}
                          </td>
                          <td>
                            <small className="text-muted">
                              {expense.user.firstName} {expense.user.lastName}
                            </small>
                          </td>
                          <td>
                            <Badge
                              bg={badge.bg}
                              className="d-flex align-items-center text-uppercase"
                            >
                              {badge.icon}
                              {badge.label}
                            </Badge>
                          </td>
                          <td>
                            {/* Compact step strip + numeric summary */}
                            <div className="d-flex align-items-center">
                              <div className="step-strip me-3">
                                {expense.expenseSteps.map((step) => {
                                  const pill = stepPillStyle(step);
                                  const label = `${step.order}${
                                    step.isOptional ? " (opt)" : ""
                                  }`;
                                  const title = `${label} • ${normalizeStatus(
                                    step.status
                                  )}${
                                    step.role?.name
                                      ? " • " + step.role?.name
                                      : ""
                                  }`;
                                  return (
                                    <OverlayTrigger
                                      key={step.id}
                                      placement="top"
                                      overlay={
                                        <Tooltip id={`ts-${step.id}`}>
                                          {title}
                                        </Tooltip>
                                      }
                                    >
                                      <span
                                        className={`step-pill ${pill.className}`}
                                      ></span>
                                    </OverlayTrigger>
                                  );
                                })}
                              </div>
                              <small className="text-muted">
                                {approved}/{total} approved
                              </small>
                            </div>
                            <div className="mt-2">
                              <ProgressBar
                                now={progress}
                                animated={
                                  normalizeStatus(expense.status) === "PENDING"
                                }
                              />
                            </div>
                          </td>
                          <td className="text-end">
                            <ChevronRight className="text-muted" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Expense Details Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          {selectedExpense && (
            <>
              <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title>Expense Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="d-flex align-items-center mb-4">
                  <div className="transaction-icon-lg me-3 bg-danger-subtle">
                    <ArrowDownCircle size={24} className="text-danger" />
                  </div>
                  <div>
                    <h4 className="mb-0">{selectedExpense.description}</h4>
                    <small className="text-muted">
                      {formatDate(selectedExpense.createdAt)}
                    </small>
                  </div>
                  <div className="ms-auto">
                    <h3 className="mb-0 text-danger">
                      {selectedExpense.currency}{" "}
                      {selectedExpense.amount.toFixed(2)}
                    </h3>
                  </div>
                </div>

                <Row className="gy-4">
                  <Col md={6}>
                    <div className="detail-section">
                      <h6 className="section-title">Expense Information</h6>
                      <dl className="row">
                        <dt className="col-sm-5">Status</dt>
                        <dd className="col-sm-7">
                          {(() => {
                            const b = statusBadge(selectedExpense.status);
                            return (
                              <Badge
                                bg={b.bg}
                                className="d-flex align-items-center text-uppercase"
                              >
                                {b.icon}
                                {b.label}
                              </Badge>
                            );
                          })()}
                        </dd>

                        <dt className="col-sm-5">Submitted By</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.user.firstName}{" "}
                          {selectedExpense.user.lastName}
                        </dd>

                        <dt className="col-sm-5">Submitted On</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.createdAt.toLocaleDateString()}
                        </dd>

                        <dt className="col-sm-5">Last Updated</dt>
                        <dd className="col-sm-7">
                          {selectedExpense.updatedAt.toLocaleDateString()}
                        </dd>

                        {selectedExpense.referenceNumber && (
                          <>
                            <dt className="col-sm-5">Reference</dt>
                            <dd className="col-sm-7">
                              {selectedExpense.referenceNumber}
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="detail-section">
                      <h6 className="section-title">Approval Details</h6>

                      {selectedExpense.expenseSteps.length > 0 ? (
                        <div className="activity-timeline">
                          {selectedExpense.expenseSteps.map((s) => {
                            const pill = stepPillStyle(s);
                            const statusText = normalizeStatus(s.status);
                            const name =
                              s.approver?.firstName || s.approver?.lastName
                                ? `${s.approver?.firstName ?? ""} ${
                                    s.approver?.lastName ?? ""
                                  }`.trim()
                                : "Unassigned";
                            const role =
                              s.role?.name ??
                              s.workflowStep?.role?.name ??
                              "No role";
                            return (
                              <div className="activity-item" key={s.id}>
                                <span
                                  className={`activity-badge ${
                                    statusText === "APPROVED"
                                      ? "success"
                                      : statusText === "REJECTED"
                                      ? "danger"
                                      : "primary"
                                  }`}
                                />
                                <div className="activity-content">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <strong>
                                      Step {s.order}
                                      {s.isOptional ? " (Optional)" : ""} •{" "}
                                      {role}
                                    </strong>
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
                                      className="text-uppercase"
                                    >
                                      {statusText}
                                    </Badge>
                                  </div>
                                  <small className="text-muted d-block">
                                    Approver: {name || "Unassigned"}
                                  </small>
                                  {s.comments && (
                                    <small className="text-muted d-block">
                                      Comment: {s.comments}
                                    </small>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted">No approval steps found</p>
                      )}
                    </div>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer className="border-top-0">
                <Button variant="light" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleNavigation(`/expenses/${selectedExpense.id}/edit`)
                  }
                >
                  Edit Expense
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* Custom CSS */}
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
        `}</style>
      </Container>
    </AuthProvider>
  );
}
