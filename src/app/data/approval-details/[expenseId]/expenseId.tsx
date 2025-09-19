"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Table,
  ProgressBar,
  Alert,
  Button,
  ListGroup,
} from "react-bootstrap";
import {
  ArrowLeft,
  FileText,
  Lock,
  Wallet as WalletIcon,
  ListCheck,
  PersonFill,
  Person,
  InfoCircle,
  CheckCircle,
  XCircle,
  Clock,
  XCircleFill,
  Clock as ClockIcon,
  CheckCircleFill,
  FileEarmarkText,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";
import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import PageLoader from "@/app/components/PageLoader";
import { ShieldCheck, Unlock } from "lucide-react";
import { FaUser } from "react-icons/fa";

interface ExpenseSteps {
  id: number;
  createdAt: string;
  updatedAt: string;
  expenseId: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  comments: string | null;
  actionedBy: number;
  roleId: number;
  role?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface UserLite {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

interface Currency {
  id: number;
  currency: string;
  code: string;
  initials: string;
  rate: number;
}

interface Workflow {
  id: number;
  name: string;
  description?: string;
  institutionId: number;
  regionId: number;
  isActive: boolean;
  steps: Array<{
    id: number;
    order: number;
    roleId: number;
    isOptional: boolean;
  }>;
}

interface Advance {
  id: number;
  primaryAmount: number;
  exchangeRate: number;
  amount: number;
  category: {
    id: number;
    name: string;
  };
  currency: {
    id: number;
    currency: string;
    initials: string;
    rate: number;
  };
  description?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseData {
  id: number;
  description: string;
  primaryAmount: number;
  exchangeRate: number | null;
  amount: number;
  currencyId: number;
  exchangeRateUsed: number;
  categoryId: number;
  receiptUrl: string | null;
  isActive: boolean;
  payee: string;
  payeeId: string;
  payeeNumber: string | null;
  departmentId: number;
  paymentMethodId: number;
  regionId: number;
  referenceNumber: string;
  status: string;
  paymentStatus: string;
  paymentDate: string | null;
  paidById: number | null;
  userId: number;
  workflowId: number;
  allowEditing: boolean;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    exemptedFromBudgetChecks: boolean;
    canBeUsedForAdvance: boolean;
    canBeUsedForAccounting: boolean;
    canBeUsedByAnyUser: boolean;
  };
  department: {
    id: number;
    name: string;
    isActive: boolean;
  };
  paymentMethod: {
    id: number;
    name: string;
  };
  region: {
    id: number;
    name: string;
  };
  user: UserLite;
  currency: Currency;
  paidBy: UserLite | null;
  advances: Advance[];
  workflow: Workflow;
  approvalSteps: ExpenseSteps[];
  expenseSteps: Array<{
    id: number;
    order: number;
    isOptional: boolean;
    status: string;
    comments: string | null;
    roleId: number;
    workflowStepId: number;
    approverId: number | null;
    role?: {
      id: number;
      name: string;
    };
    approver?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
}

interface ExpenseApprovalDetailsProps {
  params: {
    expenseId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const ExpenseApprovalDetails = ({ params }: ExpenseApprovalDetailsProps) => {
  const router = useRouter();
  const [expenseId, setExpenseId] = useState<string>("");
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  // Helper function to transform approval steps data
  const transformApprovalSteps = (
    steps: any[] = [],
    expenseId: number
  ): ExpenseSteps[] => {
    return steps.map((step) => ({
      id: step.id,
      createdAt: step.createdAt || new Date().toISOString(),
      updatedAt: step.updatedAt || step.createdAt || new Date().toISOString(),
      expenseId: step.expenseId || expenseId,
      approvalStatus: step.approvalStatus || step.status || "PENDING",
      comments: step.comments || null,
      actionedBy: step.actionedBy || 0, // Default to 0 if not provided
      roleId: step.roleId || 0, // Default to 0 if not provided
      role: step.role
        ? {
            id: step.role.id,
            name: step.role.name,
          }
        : undefined,
      // Use user if available, otherwise use approver
      user: step.user
        ? {
            id: step.user.id,
            firstName: step.user.firstName,
            lastName: step.user.lastName,
            email: step.user.email || "",
          }
        : step.approver
        ? {
            id: step.approver.id,
            firstName: step.approver.firstName,
            lastName: step.approver.lastName,
            email: step.approver.email || "",
          }
        : undefined,
      // Also keep the approver for backward compatibility
      approver: step.approver
        ? {
            id: step.approver.id,
            firstName: step.approver.firstName,
            lastName: step.approver.lastName,
            email: step.approver.email || "",
          }
        : step.user
        ? {
            id: step.user.id,
            firstName: step.user.firstName,
            lastName: step.user.lastName,
            email: step.user.email || "",
          }
        : undefined,
    }));
  };

  // Handle params initialization
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const unwrapped = await Promise.resolve(params);
        const id = unwrapped?.expenseId;
        if (id) {
          setExpenseId(id);
        } else if (!initialLoad) {
          toast.error("Expense ID is missing");
        }
      } catch (error) {
        toast.error("Failed to load expense details");
      } finally {
        setInitialLoad(false);
      }
    };

    unwrapParams();
  }, [params, initialLoad]);

  // Fetch expense data when expenseId changes
  useEffect(() => {
    const fetchExpenseData = async () => {
      if (!expenseId) return;

      try {
        // Ensure expenseId is a valid number
        const numericExpenseId = Number(expenseId);
        if (isNaN(numericExpenseId)) {
          toast.error("Invalid Expense ID format");
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(
          `${BASE_API_URL}/expense-approval-steps/expense/${numericExpenseId}`,
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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "Failed to fetch expense data");
          return;
        }

        const data: ExpenseData = await response.json();
        console.log(data);

        // Transform the data to match our ExpenseData interface
        // Transform the data with proper typing
        const expenseData: ExpenseData = {
          ...data,
          // Transform expense steps
          expenseSteps: Array.isArray(data.expenseSteps)
            ? data.expenseSteps.map((step: any) => ({
                id: step.id,
                order: step.order || 0,
                isOptional: Boolean(step.isOptional),
                status: step.status || "PENDING",
                comments: step.comments || null,
                roleId: step.roleId,
                workflowStepId: step.workflowStepId || 0,
                approverId: step.approverId || null,
                role: step.role
                  ? {
                      id: step.role.id,
                      name: step.role.name,
                    }
                  : undefined,
                approver: step.approver
                  ? {
                      id: step.approver.id,
                      firstName: step.approver.firstName,
                      lastName: step.approver.lastName,
                      email: step.approver.email || "",
                    }
                  : null,
              }))
            : [],
          // Transform approval steps using the helper function
          approvalSteps: transformApprovalSteps(
            data.approvalSteps,
            numericExpenseId
          ),
        };

        setExpense(expenseData);
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "An error occurred while fetching expense data";
        if (!initialLoad) {
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchExpenseData();
  }, [expenseId, initialLoad]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusVariant = (status: string) => {
    const statusVariants: Record<string, string> = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
      PROCESSING: "info",
      PAID: "primary",
    };
    return statusVariants[status] || "secondary";
  };

  const calculateApprovalProgress = (): number => {
    if (!expense?.approvalSteps?.length) {
      return 0;
    }

    const totalSteps = expense.approvalSteps.length;
    const approvedSteps = expense.approvalSteps.filter(
      (step) => step.approvalStatus === "APPROVED"
    ).length;

    // If no steps are approved yet, show 0% progress
    if (approvedSteps === 0) return 0;

    // Calculate progress based on approved steps
    // We add 1 to the denominator to account for the current step in progress
    const progress = (approvedSteps / totalSteps) * 100;

    // Ensure we don't exceed 100%
    return Math.min(Math.round(progress), 100);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!expense) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Expense Not Found</Alert.Heading>
          <p>The requested expense could not be found.</p>
          <Button
            onClick={() => router.back()}
            variant="outline-warning"
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  // Get approval steps with proper typing
  const approvalSteps: ExpenseSteps[] = expense?.approvalSteps || [];

  const approvalProgress = calculateApprovalProgress();

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="mt-5">
        <Card className="border-0 bg-light shadow border-start rounded-3 border-3 border-success mb-5">
          <Row className="mb-4">
            <Col className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <FileText size={24} className="text-success" />
                    <h6 className="mb-0 fw-bold text-success">
                      Expense Approval Details
                    </h6>
                  </div>
                  <p className="text-muted d-flex align-items-center gap-2">
                    <ListCheck size={16} />
                    Tracking approval process for expense #{expense.id}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => router.back()}>
                  &larr; Back
                </Button>
              </div>

              <p className="text-muted d-flex align-items-center gap-2">
                <span className="text-muted fw-bold">Expense details</span>
                <span>
                  {expense.description || (
                    <span className="text-muted fst-italic">
                      No description
                    </span>
                  )}
                </span>
              </p>
            </Col>
          </Row>
        </Card>

        {/* Approval Progress */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0">
              <Card.Body className="bg-success bg-opacity-10 shadow">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <ListCheck size={18} className="text-success" />
                    <h6 className="card-title mb-0 fw-bold">
                      Approval Progress
                    </h6>
                  </div>
                  <Badge
                    bg={getStatusVariant(expense.status)}
                    className="d-flex align-items-center gap-1"
                  >
                    {expense.status === "APPROVED" && (
                      <CheckCircleFill size={12} />
                    )}
                    {expense.status === "REJECTED" && <XCircleFill size={12} />}
                    {expense.status === "PENDING" && <ClockIcon size={12} />}
                    {expense.status}
                  </Badge>
                </div>
                <ProgressBar
                  now={approvalProgress}
                  variant={
                    approvalProgress === 100
                      ? "success"
                      : approvalProgress > 0
                      ? "primary"
                      : "secondary"
                  }
                  className="mb-2"
                  style={{ height: "10px" }}
                />
                <div className="d-flex justify-content-between">
                  <small className="text-muted">
                    {
                      approvalSteps.filter((s: any) => s.status === "APPROVED")
                        .length
                    }{" "}
                    of {approvalSteps.length} steps completed
                  </small>
                  <small>{Math.round(approvalProgress)}%</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Left Column - Expense Details */}
          <Col lg={8} className="mb-4">
            <Card className="mb-4 border shadow-sm rounded-4 overflow-hidden">
              {/* Header with gradient and subtle shadow */}
              <div className="bg-gradient bg-dark bg-opacity-10 border-bottom">
                <div className="container-fluid px-4 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white bg-opacity-80 p-2 rounded-3 shadow-sm">
                      <FileEarmarkText className="text-primary" size={20} />
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">
                        Expense Summary
                      </h6>
                      <p className="mb-0 small text-muted">
                        Detailed overview of expense #{expense.id}
                      </p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between ms-auto flex-column">
                      <div className="fw-bold text-dark">
                        Amount: {expense.amount.toLocaleString()}
                      </div>
                      <div className="small">
                        <span className="d-flex align-items-center gap-1">
                          {expense.allowEditing ? (
                            <>
                              <Unlock size={14} className="text-muted" />
                              <span className="text-muted">
                                Open for editing:{" "}
                                <span className="fw-semibold">Yes</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <Lock size={14} className="text-danger" />
                              <span className="text-danger">
                                Open for editing:{" "}
                                <span className="fw-semibold">No</span>
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card.Body className="p-4">
                <Row className="gy-4">
                  {/* Basic Info */}
                  <Col md={6}>
                    <Card className="h-100 border-0 border-top border-success border-3 shadow-sm rounded-3 bg-light-subtle">
                      <Card.Body>
                        <h6 className="text-secondary fw-semibold small text-uppercase border-bottom pb-2 mb-3">
                          Basic Information
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Expense ID</span>
                            <span className="fw-semibold">{expense.id}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Status</span>
                            <div
                              className="px-3 py-2 d-inline-flex align-items-center gap-1 small"
                              style={{
                                backgroundColor: getStatusVariant(
                                  expense.status
                                ),
                              }}
                            >
                              {expense.status}
                            </div>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Payment Status</span>
                            <div
                              className="px-3 py-2 d-inline-flex align-items-center gap-1 small"
                              style={{
                                backgroundColor: getStatusVariant(
                                  expense.paymentStatus
                                ),
                              }}
                            >
                              {expense.paymentStatus}
                            </div>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Active</span>
                            {expense.isActive ? (
                              <div
                                className="px-3 py-2 d-inline-flex align-items-center gap-1 small"
                                style={{
                                  backgroundColor: getStatusVariant(
                                    expense.status
                                  ),
                                }}
                              >
                                Yes
                              </div>
                            ) : (
                              <div
                                className="px-3 py-2 d-inline-flex align-items-center gap-1 small"
                                style={{
                                  backgroundColor: getStatusVariant(
                                    expense.status
                                  ),
                                }}
                              >
                                No
                              </div>
                            )}
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Financial Info */}
                  <Col md={6}>
                    <Card className="h-100 border-0 border-top border-success border-3 shadow-sm rounded-3 bg-light-subtle">
                      <Card.Body>
                        <h6 className="text-secondary fw-semibold small text-uppercase border-bottom pb-2 mb-3">
                          Financial Information
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Amount</span>
                            <span className="fw-bold text-muted">
                              {expense.amount.toLocaleString()}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Primary Amount</span>
                            <span>
                              {expense.primaryAmount.toLocaleString()}{" "}
                              <small className="text-muted">
                                {expense.currency?.initials}
                              </small>
                            </span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Exchange Rate</span>
                            <span>
                              {expense.exchangeRate}
                              {expense.exchangeRateUsed && (
                                <small className="text-muted ms-1">
                                  {expense.exchangeRateUsed}
                                </small>
                              )}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Currency</span>
                            <span>{expense.currency?.initials}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Payment Method</span>
                            <span>{expense.paymentMethod?.name}</span>
                          </li>
                          <li className="d-flex justify-content-between">
                            <span className="text-muted">Reference No.</span>
                            <span>{expense.referenceNumber}</span>
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Payee Info */}
                  <Col md={6}>
                    <Card className="h-100 border-0 border-top border-success border-3 shadow-sm rounded-3 bg-light-subtle">
                      <Card.Body>
                        <h6 className="text-secondary fw-semibold small text-uppercase border-bottom pb-2 mb-3">
                          Payee Details
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Payee Name</span>
                            <span>{expense.payee}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Payee ID</span>
                            <span>{expense.payeeId}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Payee Number</span>
                            <span>{expense.payeeNumber}</span>
                          </li>
                          {expense.receiptUrl && (
                            <li className="d-flex justify-content-between">
                              <span className="text-muted">Receipt</span>
                              <a
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-decoration-none fw-semibold text-primary"
                              >
                                View Receipt
                              </a>
                            </li>
                          )}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Organizational Info */}
                  <Col md={6}>
                    <Card className="h-100 border-0 border-top border-success border-3 shadow-sm rounded-3 bg-light-subtle">
                      <Card.Body>
                        <h6 className="text-secondary fw-semibold small text-uppercase border-bottom pb-2 mb-3">
                          Organizational Information
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Category</span>
                            <span>{expense.category?.name || "N/A"}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Department</span>
                            <span>{expense.department?.name || "N/A"}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Region</span>
                            <span>{expense.region?.name || "N/A"}</span>
                          </li>
                          <li className="d-flex justify-content-between">
                            <span className="text-muted">Workflow</span>
                            <span>{expense.workflow?.name || "N/A"}</span>
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Timestamps */}
                  <Col md={6}>
                    <Card className="h-100 border-0 border-top border-success border-3 shadow-sm rounded-3 bg-light-subtle">
                      <Card.Body>
                        <h6 className="text-secondary fw-semibold small text-uppercase border-bottom pb-2 mb-3">
                          Timestamps
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Created At</span>
                            <span>{formatDate(expense.createdAt)}</span>
                          </li>
                          <li className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Updated At</span>
                            <span>{formatDate(expense.updatedAt)}</span>
                          </li>
                          {expense.paymentDate && (
                            <li className="d-flex justify-content-between">
                              <span className="text-muted">Payment Date</span>
                              <span>{formatDate(expense.paymentDate)}</span>
                            </li>
                          )}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* People */}
                  <Col md={6}>
                    <Card className="h-100 border-0 border-top border-success border-3 shadow-sm rounded-3 bg-light-subtle">
                      <Card.Body>
                        <h6 className="text-secondary fw-semibold small text-uppercase border-bottom pb-2 mb-3">
                          Payment
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li>
                            {expense.paidBy ? (
                              <div className="bg-success bg-opacity-10 p-2 rounded-3 text-dark">
                                <span className="fw-semibold">
                                  {expense.paidBy.firstName}{" "}
                                  {expense.paidBy.lastName}
                                </span>
                                {expense.paidBy.email && (
                                  <small className="d-block text-muted">
                                    {expense.paidBy.email}
                                  </small>
                                )}
                              </div>
                            ) : (
                              <div className="bg-danger bg-opacity-10 p-2 rounded-3 text-dark">
                                Pending payment
                              </div>
                            )}
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Advances */}
            {expense.advances?.length > 0 && (
              <Card className="shadow-sm border rounded-4 mt-4 overflow-hidden">
                <Card.Header className="bg-dark bg-opacity-10 border-bottom py-2">
                  <div className="d-flex align-items-center gap-2 p-3">
                    <WalletIcon size={18} className="text-primary" />
                    <h6 className="mb-0 fw-semibold text-dark">
                      Advance Breakdown
                    </h6>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table
                    responsive
                    striped
                    hover
                    borderless
                    className="mb-0 align-middle small"
                  >
                    <thead className="table-light text-muted">
                      <tr>
                        <th>ID</th>
                        <th>Primary Amount</th>
                        <th>Exchange Rate</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.advances.map((advance: any) => (
                        <tr key={advance.id}>
                          <td>{advance.id}</td>
                          <td className="fw-semibold">
                            {advance.primaryAmount?.toLocaleString() || "N/A"}
                          </td>
                          <td>{advance.exchangeRate || "1.0"}</td>
                          <td className="fw-semibold text-success">
                            {advance.amount?.toLocaleString() || "N/A"}
                          </td>
                          <td>{advance.category?.name || "N/A"}</td>
                          <td>{advance.currency?.initials || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Right Column - Approval Steps */}
          <Col lg={4}>
            {/* Expense Steps */}
            <Card className="mb-4 border shadow-sm rounded-4 overflow-hidden">
              <div className="bg-gradient bg-dark bg-opacity-10 border-bottom">
                <div className="container-fluid px-4 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-white bg-opacity-80 p-2 rounded-3 shadow-sm">
                      <ListCheck className="text-primary" size={20} />
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">
                        Expense approval steps
                      </h6>
                      <p className="mb-0 small text-muted">
                        Approvals for #{expense.id}
                      </p>
                    </div>
                    <div className="ms-auto">
                      <Badge
                        bg="light"
                        text="danger"
                        className="border px-3 py-2"
                      >
                        {expense.expenseSteps?.length || 0} Steps
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <Card.Body>
                {!expense.expenseSteps || expense.expenseSteps.length === 0 ? (
                  <Alert variant="info" className="mb-0">
                    No expense process steps available.
                  </Alert>
                ) : (
                  <ListGroup variant="flush">
                    {expense.expenseSteps.map((step: any, index: number) => (
                      <ListGroup.Item
                        key={`expense-${step.id || index}`}
                        className="px-0"
                      >
                        <div className="d-flex align-items-start">
                          <div className="me-3 text-center">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center ${
                                step.status === "APPROVED"
                                  ? "bg-success"
                                  : step.status === "REJECTED"
                                  ? "bg-danger"
                                  : "bg-warning"
                              }`}
                              style={{ width: "25px", height: "25px" }}
                            >
                              {step.status === "APPROVED" ? (
                                <i className="text-white">✓</i>
                              ) : step.status === "REJECTED" ? (
                                <i className="text-white">✕</i>
                              ) : (
                                <i className="text-white">?</i>
                              )}
                            </div>
                            {index < expense.expenseSteps.length - 1 && (
                              <div
                                style={{
                                  width: "2px",
                                  height: "20px",
                                  backgroundColor: "#dee2e6",
                                  margin: "4px auto 0",
                                }}
                              ></div>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="mb-1 fw-s">
                                {step.role?.name || `Step ${step.order}`}
                                {step.approver && (
                                  <div className="text-muted small d-flex align-items-center">
                                    <FaUser
                                      className="text-success me-2"
                                      size={10}
                                    />{" "}
                                    {step.approver.firstName}{" "}
                                    {step.approver.lastName}
                                  </div>
                                )}
                              </h6>
                              <Badge bg={getStatusVariant(step.status)}>
                                {step.status}
                              </Badge>
                            </div>
                            {step.comments && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small className="text-muted">
                                  <i>"{step.comments}"</i>
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Container>
        {/* Approval Steps */}
        <Card className="mb-4 shadow-sm border rounded-4">
          <div className="d-flex align-items-center gap-2 p-3 bg-dark bg-opacity-10 rounded-top-4">
            <div className="bg-white bg-opacity-80 p-2 rounded-3 shadow-sm">
              <ListCheck className="text-primary" size={20} />
            </div>
            <h6 className="mb-0 fw-bold text-dark">Expense Approval Logs</h6>
            <div className="ms-auto">
              <Badge bg="light" text="danger" className="border px-3 py-2">
                {expense.approvalSteps?.length || 0} actions found
              </Badge>
            </div>
          </div>
          <Card.Body>
            {expense.approvalSteps?.length === 0 ? (
              <Alert variant="info" className="mb-0 rounded-3">
                <div className="d-flex align-items-center">
                  <InfoCircle className="me-2" />
                  <span>No approval logs available for this expense.</span>
                </div>
              </Alert>
            ) : (
              <div className="table-responsive rounded-">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 py-3 text-uppercase small fw-semibold text-muted">
                        Status
                      </th>
                      <th className="py-3 text-uppercase small fw-semibold text-muted">
                        Role
                      </th>
                      <th className="py-3 text-uppercase small fw-semibold text-muted">
                        Approver
                      </th>
                      <th className="pe-4 py-3 text-uppercase small fw-semibold text-muted">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expense.approvalSteps?.map((step: any, index: number) => {
                      return (
                        <tr
                          key={`approval-${step.id || index}`}
                          className="border-top"
                        >
                          {/* Status */}
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center">
                              <div
                                className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                                  step.approvalStatus === "APPROVED"
                                    ? "bg-success bg-opacity-10"
                                    : step.approvalStatus === "REJECTED"
                                    ? "bg-danger bg-opacity-10"
                                    : "bg-warning bg-opacity-10"
                                }`}
                                style={{ width: "25px", height: "25px" }}
                              >
                                {step.approvalStatus === "APPROVED" ? (
                                  <CheckCircle
                                    className="text-success"
                                    size={16}
                                  />
                                ) : step.approvalStatus === "REJECTED" ? (
                                  <XCircle className="text-danger" size={16} />
                                ) : (
                                  <Clock className="text-warning" size={16} />
                                )}
                              </div>
                              <div>
                                <Badge
                                  bg={`${
                                    step.approvalStatus === "APPROVED"
                                      ? "success"
                                      : step.approvalStatus === "REJECTED"
                                      ? "danger"
                                      : "warning"
                                  }-subtle`}
                                  className="text-uppercase"
                                  text={
                                    step.approvalStatus === "APPROVED"
                                      ? "success"
                                      : step.approvalStatus === "REJECTED"
                                      ? "danger"
                                      : "warning"
                                  }
                                >
                                  {step.approvalStatus}
                                </Badge>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{ width: "32px", height: "32px" }}
                              >
                                <ShieldCheck
                                  className="text-primary"
                                  size={16}
                                />
                              </div>
                              <span className="fw-medium">
                                {step.role?.name || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Approver */}
                          <td className="py-3">
                            {step.user || step.approver ? (
                              <div className="d-flex align-items-center">
                                <div
                                  className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  <PersonFill
                                    className="text-primary"
                                    size={16}
                                  />
                                </div>
                                <div>
                                  <div className="fw-medium text-dark">
                                    {(step.user || step.approver)?.firstName}{" "}
                                    {(step.user || step.approver)?.lastName}
                                  </div>
                                  <small className="text-muted">
                                    {(step.user || step.approver)?.email}
                                  </small>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center">
                                <div
                                  className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  <Person className="text-muted" size={16} />
                                </div>
                                <span className="text-muted fst-italic">
                                  Pending
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Comments */}
                          <td
                            className="pe-4 py-3"
                            style={{ maxWidth: "20rem" }}
                          >
                            {step.comments ? (
                              <div className="bg-danger bg-opacity-10 p-3 rounded-2">
                                <p className="mb-0 text-dark fst-italic">
                                  "{step.comments}" -{" "}
                                  {formatDate(step.createdAt)}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted fst-italic">
                                No comments
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </AuthProvider>
  );
};

export default ExpenseApprovalDetails;
