"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
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
  ListCheck,
  CheckCircleFill,
  XCircleFill,
  Clock as ClockIcon,
  FileEarmarkText as FileEarmarkTextIcon,
} from "react-bootstrap-icons";
import { BASE_API_URL } from "@/app/static/apiConfig";
import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import PageLoader from "@/app/components/PageLoader";
import { WalletIcon } from "lucide-react";

interface ApprovalStep {
  id: number;
  createdAt: string;
  updatedAt: string;

  approvalStatus: "NOT_STARTED" | "APPROVED" | "REJECTED"; // match enum
  comments: string | null;
  actionedBy: number;

  roleId: number | null;
  role?: {
    id: number;
    name: string;
  };

  user?: {
    id: number;
    name: string;
  };
}

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
  amount: number;
  description: string;
  status: string;
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
  const [expenseId, setExpenseId] = useState<string>('');
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  
  // Helper function to transform approval steps data
  const transformApprovalSteps = (steps: any[] = [], expenseId: number): ExpenseSteps[] => {
    return steps.map(step => ({
      id: step.id,
      createdAt: step.createdAt || new Date().toISOString(),
      updatedAt: step.updatedAt || step.createdAt || new Date().toISOString(),
      expenseId: step.expenseId || expenseId,
      approvalStatus: step.approvalStatus || step.status || 'PENDING',
      comments: step.comments || null,
      actionedBy: step.actionedBy || 0, // Default to 0 if not provided
      roleId: step.roleId || 0, // Default to 0 if not provided
      role: step.role ? {
        id: step.role.id,
        name: step.role.name
      } : undefined,
      approver: step.approver ? {
        id: step.approver.id,
        firstName: step.approver.firstName,
        lastName: step.approver.lastName,
        email: step.approver.email || ''
      } : undefined
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
                status: step.status || 'PENDING',
                comments: step.comments || null,
                roleId: step.roleId,
                workflowStepId: step.workflowStepId || 0,
                approverId: step.approverId || null,
                role: step.role ? {
                  id: step.role.id,
                  name: step.role.name
                } : undefined,
                approver: step.approver ? {
                  id: step.approver.id,
                  firstName: step.approver.firstName,
                  lastName: step.approver.lastName,
                  email: step.approver.email || ''
                } : null
              }))
            : [],
          // Transform approval steps using the helper function
          approvalSteps: transformApprovalSteps(data.approvalSteps, numericExpenseId)
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

  const formatCurrency = (amount: number, currencyCode?: string) => {
    if (amount == null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <Container className="py-5">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <FileText size={24} className="text-primary" />
                  <h6 className="mb-0">Expense Approval Details</h6>
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
          </Col>
        </Row>

        {/* Approval Progress */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <ListCheck size={18} className="text-primary" />
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
            <Card className="mb-4 shadow-sm border">
              <div className="card-header d-flex d-wrap">
                <FileEarmarkTextIcon className="text-primary fs-5 me-2" />
                <h5 className="mb-0 fw-bold">Expense Summary</h5>
              </div>
              <Card.Body>
                <Row className="gy-4">
                  {/* General Info */}
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted small">
                      General Info
                    </h6>
                    <p>
                      <strong>Description:</strong>{" "}
                      {expense.description || "No description provided"}
                    </p>
                    <p>
                      <strong>Category:</strong>{" "}
                      {expense.category?.name || "N/A"}
                    </p>
                    <p>
                      <strong>Department:</strong>{" "}
                      {expense.department?.name || "N/A"}
                    </p>
                  </Col>

                  {/* Financial Info */}
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted small">
                      Financial Info
                    </h6>
                    <p>
                      <strong>Amount:</strong>{" "}
                      <span className="fw-bold fs-5 text-success">
                        {formatCurrency(expense.amount, expense.currency?.code)}
                      </span>
                    </p>
                    <p>
                      <strong>Payment Method:</strong>{" "}
                      {expense.paymentMethod?.name || "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <Badge
                        bg={getStatusVariant(expense.status)}
                        className="px-3 py-2"
                      >
                        {expense.status}
                      </Badge>
                    </p>
                  </Col>

                  {/* Organizational Info */}
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted small">
                      Organizational Info
                    </h6>
                    <p>
                      <strong>Region:</strong> {expense.region?.name || "N/A"}
                    </p>
                    <p>
                      <strong>Date Submitted:</strong>{" "}
                      {formatDate(expense.createdAt)}
                    </p>
                  </Col>

                  {/* People */}
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted small">People</h6>
                    <p>
                      <strong>Submitted By:</strong>
                      <br />
                      {expense.user?.firstName} {expense.user?.lastName}
                      {expense.user?.email && (
                        <small className="d-block text-muted">
                          {expense.user.email}
                        </small>
                      )}
                    </p>
                    <p>
                      <strong>Paid By:</strong>
                      <br />
                      {expense.paidBy
                        ? `${expense.paidBy.firstName} ${expense.paidBy.lastName}`
                        : "N/A"}
                      {expense.paidBy?.email && (
                        <small className="d-block text-muted">
                          {expense.paidBy.email}
                        </small>
                      )}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Advances */}
            {expense.advances?.length > 0 && (
              <Card>
                <Card.Header>
                  <div className="d-flex align-items-center gap-2">
                    <WalletIcon size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold">Advance breakdown</h6>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.advances.map((advance: any) => (
                        <tr key={advance.id}>
                          <td>{advance.amount.toLocaleString()}</td>
                          <td>{advance.category?.name || "N/A"}</td>
                          <td>{formatDate(advance.createdAt)}</td>
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
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex align-items-center gap-2">
                  <ListCheck size={18} className="text-primary" />
                  <h6 className="mb-0 fw-bold">Expense approval steps</h6>
                </div>
              </Card.Header>
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
                              style={{ width: "32px", height: "32px" }}
                            >
                              {step.status === "APPROVED" ? (
                                <i className="text-white">✓</i>
                              ) : step.status === "REJECTED" ? (
                                <i className="text-white">✕</i>
                              ) : (
                                <i className="text-white">…</i>
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
                              <h6 className="mb-1">
                                {step.role?.name || `Step ${step.order}`}
                                {step.approver && (
                                  <div className="text-muted small">
                                    {step.approver.firstName}{" "}
                                    {step.approver.lastName}
                                  </div>
                                )}
                              </h6>
                              <Badge bg={getStatusVariant(step.status)}>
                                {step.status}
                              </Badge>
                            </div>
                            <div className="text-muted small">
                              {step.updatedAt
                                ? formatDate(step.updatedAt)
                                : "Pending"}
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

            {/* Approval Steps */}
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex align-items-center gap-2">
                  <ListCheck size={18} className="text-primary" />
                  <h6 className="mb-0 fw-bold">Expense approval logs</h6>
                </div>
              </Card.Header>
              <Card.Body>
                {expense.approvalSteps?.length === 0 ? (
                  <Alert variant="info" className="mb-0">
                    No approval logs available.
                  </Alert>
                ) : (
                  <ListGroup variant="flush">
                    {expense.approvalSteps?.map(
                      (step: ExpenseSteps, index: number) => (
                        <ListGroup.Item
                          key={`approval-${step.id || index}`}
                          className="px-0"
                        >
                          <div className="d-flex align-items-start">
                            <div className="me-3 text-center">
                              <div
                                className={`rounded-circle d-flex align-items-center justify-content-center ${
                                  step.approvalStatus === "APPROVED"
                                    ? "bg-success"
                                    : step.approvalStatus === "REJECTED"
                                    ? "bg-danger"
                                    : "bg-warning"
                                }`}
                                style={{ width: "32px", height: "32px" }}
                              >
                                {step.approvalStatus === "APPROVED" ? (
                                  <i className="text-white">✓</i>
                                ) : step.approvalStatus === "REJECTED" ? (
                                  <i className="text-white">✕</i>
                                ) : (
                                  <i className="text-white">…</i>
                                )}
                              </div>
                              {index < expense.approvalSteps.length - 1 && (
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
                                <h6 className="mb-1">
                                  {step.role?.name || "Approval Step"}
                                </h6>
                                <Badge
                                  bg={getStatusVariant(step.approvalStatus)}
                                >
                                  {step.approvalStatus}
                                </Badge>
                              </div>
                              <div className="text-muted small">
                                {formatDate(step.updatedAt || step.createdAt)}
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
                      )
                    )}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>

            {/* Workflow */}
            {expense.workflow && (
              <Card>
                <Card.Header>
                  <div className="d-flex align-items-center gap-2">
                    <ListCheck size={18} className="text-primary" />
                    <h6 className="mb-0 fw-bold">Workflow Details</h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <i className="bi bi-diagram-3 fs-3 text-primary"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">{expense.workflow.name}</h6>
                      <small className="text-muted">
                        {expense.workflow.description ||
                          "No description available"}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </AuthProvider>
  );
};

export default ExpenseApprovalDetails;
