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
  PencilSquare,
  Tag,
  ArrowUpCircle,
} from "react-bootstrap-icons";
import Navbar from "../../components/Navbar";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../../static/apiConfig";
import AuthProvider from "../../authPages/tokenData";
import { User } from "lucide-react";
import { FaListAlt } from "react-icons/fa";
import TopNavbar from "../../components/Navbar";

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

const parseDate = (d: any): string => {
  try {
    return d ? d : "";
  } catch {
    return "";
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

const countCompletedSteps = (steps: ExpenseStep[]) =>
  steps.filter((s) =>
    ["APPROVED", "REJECTED"].includes(normalizeStatus(s.status))
  ).length;

const getProgressPercent = (steps: ExpenseStep[]) => {
  if (!steps?.length) return 0;
  const total = steps.length;
  const completed = countCompletedSteps(steps);
  return Math.floor((completed / total) * 100);
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

      console.log(data);

      if (Array.isArray(data)) {
        const mapped = data.map((item: any): ExpenseRow => {
          // Map user
          const mappedUser: User = {
            id: Number(item.user?.id ?? 0),
            firstName: item.user?.firstName ?? "",
            lastName: item.user?.lastName ?? "",
            email: item.user?.email ?? "",
          };

          // Map steps
          const steps: ExpenseStep[] = Array.isArray(item.expenseSteps)
            ? item.expenseSteps.map((s: any) => ({
                id: Number(s.id ?? 0),
                order: Number(s.order ?? 0),
                isOptional: Boolean(s.isOptional ?? false),
                status: (s.status as ApprovalStatus) || "PENDING",
                comments: s.comments ?? null,
                role: s.role
                  ? {
                      id: Number(s.role.id ?? 0),
                      name: String(s.role.name ?? ""),
                    }
                  : null,
                approver: s.approver
                  ? {
                      id: Number(s.approver.id ?? 0),
                      firstName: String(s.approver.firstName ?? ""),
                      lastName: String(s.approver.lastName ?? ""),
                      email: String(s.approver.email ?? ""),
                    }
                  : undefined,
                level: Number(s.order ?? 0),
              }))
            : [];

          // Map related entities
          const currency = item.currency
            ? {
                id: Number(item.currency.id ?? 0),
                currency: String(item.currency.currency ?? ""),
                initials: String(item.currency.initials ?? ""),
                rate: Number(item.currency.rate ?? 1),
              }
            : null;

          const category = item.category
            ? {
                id: Number(item.category.id ?? 0),
                name: String(item.category.name ?? ""),
              }
            : null;

          const department = item.department
            ? {
                id: Number(item.department.id ?? 0),
                name: String(item.department.name ?? ""),
              }
            : null;

          const paymentMethod = item.paymentMethod
            ? {
                id: Number(item.paymentMethod.id ?? 0),
                name: String(item.paymentMethod.name ?? ""),
              }
            : null;

          const region = item.region
            ? {
                id: Number(item.region.id ?? 0),
                name: String(item.region.name ?? ""),
              }
            : null;

          return {
            id: Number(item.id ?? 0),
            description: item.description ?? "",
            amount: Number(item.amount ?? 0),
            currency,
            category,
            receiptUrl: item.receiptUrl ?? null,
            status:
              (normalizeStatus(item.status) as ExpenseRow["status"]) ||
              "PENDING",
            isActive: Boolean(item.isActive ?? true),
            primaryAmount: Number(item.primaryAmount ?? 0),
            exchangeRateUsed: Number(item.exchangeRate ?? 0),
            payee: item.payee ?? "",
            payeeId: item.payeeId ?? "",
            payeeNumber: item.payeeNumber ?? null,
            department,
            paymentMethod,
            region,
            referenceNumber: item.referenceNumber ?? null,
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

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="dashboard-container px-4 py-3">
        {/* Header */}
        <Row className="align-items-center mb-4">
          <div className="d-flex justify-content-between align-items-center w-100 mb-4 bg-primary bg-opacity-10 p-4 rounded-3">
            <div>
              <h5 className="fw-bold mb-1">Dashboard</h5>
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
          </div>
        </Row>

        {/* Main Content Area */}
        <Row className="mb-4">
          <Col sm={4}>
            <Button
              onClick={() => {
                handleNavigation("create-expense");
              }}
              variant="light"
              className="w-100 text-start py-3 border"
            >
              {" "}
              <div className="d-flex align-items-center">
                {" "}
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  {" "}
                  <ArrowUpCircle size={20} className="text-primary" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <div className="fw-medium text-primary">
                    Create expenses
                  </div>{" "}
                  <small className="text-muted d-block">Add new expenses</small>{" "}
                </div>{" "}
              </div>{" "}
            </Button>
          </Col>
          <Col sm={4}>
            <Button variant="light" className="w-100 text-start py-3 border">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                  <ArrowDownCircle size={20} className="text-danger" />
                </div>
                <div>
                  <div className="fw-medium text-danger">Check budgets</div>
                  <small className="text-muted d-block">
                    Check department budgets
                  </small>
                </div>
              </div>
            </Button>
          </Col>
          <Col sm={4}>
            <Button variant="light" className="w-100 text-start py-3 border">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FileText size={20} className="text-success" />
                </div>
                <div>
                  <div className="fw-medium text-success">Generate Report</div>
                  <small className="text-muted d-block">
                    Export financial data
                  </small>
                </div>
              </div>
            </Button>
          </Col>
        </Row>

        {/* Expenses Table */}
        <Container fluid className="mt-5">
          <Card className="mb-4">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center mb-5">
              <h6 className="mb-0 fw-bold text-secondary text-uppercase">
                Your Expenses Dashboard
              </h6>
              <div className="d-flex">
                <div className="search-box me-2 d-flex d-wrap">
                  <Form.Control
                    type="search"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-4"
                  />
                </div>
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
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0 transactions-table small">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-4">#ID</th>
                            <th>Created</th>
                            <th>Payee</th>
                            <th>Payee Number</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Owner</th>
                            <th>Status</th>
                            <th style={{ minWidth: 120 }}>Approval Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.map((expense) => {
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
                                onClick={() => handleViewDetails(expense)}
                                className="cursor-pointer"
                              >
                                <td className="ps-4 fw-semibold text-muted">
                                  <div className="d-flex align-items-center">
                                    <Tag
                                      size={14}
                                      className="me-1 text-primary"
                                    />
                                    <span>{expense.id}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex flex-column">
                                    <div className="">
                                      Created: {formatDate(expense.createdAt)}
                                    </div>
                                    <div className="text-muted small">
                                      Updated: {formatDate(expense.updatedAt)}
                                    </div>
                                  </div>
                                </td>
                                <td>{expense.payee}</td>
                                <td>{expense.payeeNumber}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="transaction-icon me-2 bg-light border bg-opacity-10 p-1 rounded-3">
                                      <FaListAlt
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
                                <td className="text-success">
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
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="avatar-sm bg-primary bg-opacity-10 text-primary fw-medium d-flex align-items-center justify-content-center rounded-circle me-2">
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
                                <td>
                                  <Badge
                                    bg={badge.bg}
                                    className="d-inline-flex align-items-center py-2 px-3 rounded-pill bg-opacity-10 text-opacity-100"
                                    text={badge.bg.replace("bg-", "text-")}
                                  >
                                    {badge.icon}
                                    <span
                                      className={`ms-1 text-${badge.bg.replace(
                                        "bg-",
                                        ""
                                      )}`}
                                    >
                                      {badge.label}
                                    </span>
                                  </Badge>
                                </td>
                                <td>
                                  <div className="p-2 rounded-3 d-flex flex-column gap-2">
                                    {/* Steps Row */}
                                    <div className="d-flex align-items-center justify-content-between flex-row">
                                      <div className="d-flex align-items-center flex-wrap gap-1">
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
                                                className={`step-pill ${pill.className} rounded-circle border`}
                                                style={{
                                                  width: "18px",
                                                  height: "18px",
                                                }}
                                              ></span>
                                            </OverlayTrigger>
                                          );
                                        })}
                                      </div>
                                      <span className="badge bg-secondary-subtle text-dark fw-semibold">
                                        {completed}/{total}
                                      </span>

                                      {/* Progress Row */}
                                      <div className="d-flex align-items-center justify-content-between">
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
                                    </div>

                                    {/* Progress Bar */}
                                    <ProgressBar
                                      now={progress}
                                      variant={
                                        progress === 100 ? "success" : "info"
                                      }
                                      animated={
                                        normalizeStatus(expense.status) ===
                                        "PENDING"
                                      }
                                      className="rounded-pill shadow-sm"
                                      style={{ height: "8px" }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
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
                className="border-bottom-0 pb-0 position-relative"
              >
                <div
                  className="position-absolute w-100 h-100 bg-light bg-opacity-10 rounded-top"
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

              <Modal.Body className="pt-4">
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
                      Created on {formatDate(selectedExpense.createdAt)}
                    </small>
                  </div>
                  <div className="text-end">
                    <h5 className="mb-0 text-danger fw-bold">
                      {selectedExpense.amount.toLocaleString()} KES
                    </h5>
                    <small className="text-muted">Total amount</small>
                  </div>
                </div>

                <Row className="gy-4">
                  {/* Expense Information */}
                  <Col md={6}>
                    <Card className="border shadow-sm h-100">
                      <Card.Body>
                        {/* Section Header */}
                        <div className="d-flex align-items-center mb-3 bg-primary bg-opacity-10 p-3 rounded-3">
                          <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                            <FileText size={18} className="text-primary" />
                          </div>
                          <h6 className="mb-0 fw-semibold">
                            Expense Information
                          </h6>
                        </div>

                        <div className="detail-list small">
                          {/* Submission Details */}
                          <div className="mb-3">
                            <h6 className="text-muted fw-semibold small mb-2">
                              Submission
                            </h6>
                            <div className="detail-item">
                              <span className="detail-label">Submitted On</span>
                              <span className="detail-value">
                                {formatDate(selectedExpense.createdAt)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Last Updated</span>
                              <span className="detail-value">
                                {formatDate(selectedExpense.updatedAt)}
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
                          <div className="mb-3">
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
                          <div>
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
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                            <CheckCircle size={18} className="text-success" />
                          </div>
                          <h6 className="mb-0 fw-semibold">Approval Process</h6>
                        </div>

                        {selectedExpense.expenseSteps.length > 0 ? (
                          <div className="approval-timeline">
                            {selectedExpense.expenseSteps.map((s) => {
                              const statusText = normalizeStatus(s.status);
                              const name =
                                s.approver?.firstName || s.approver?.lastName
                                  ? `${s.approver?.firstName ?? ""} ${
                                      s.approver?.lastName ?? ""
                                    }`.trim()
                                  : "Pending approval";
                              const role =
                                s.role?.name ??
                                s.workflowStep?.role?.name ??
                                "No role";

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
                                        <User className="me-1" size={12} />
                                        {name || "Pending approval"}
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

              <Modal.Footer className="border-top-0 pt-0">
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowModal(false)}
                  className="rounded-pill px-4"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleNavigation(`/expenses/${selectedExpense.id}/edit`)
                  }
                  className="rounded-pill px-4"
                >
                  <PencilSquare className="me-2" size={16} />
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
