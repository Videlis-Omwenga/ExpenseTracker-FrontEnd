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
    steps: Array<Record<string, unknown>> = [],
    expenseId: number
  ): ExpenseSteps[] => {
    return steps.map((step): ExpenseSteps => {
      const roleData = step.role as Record<string, unknown> | undefined;
      const userData = step.user as Record<string, unknown> | undefined;
      const approverData = step.approver as Record<string, unknown> | undefined;

      return {
        id: typeof step.id === 'number' ? step.id : 0,
        createdAt: typeof step.createdAt === 'string' ? step.createdAt : new Date().toISOString(),
        updatedAt: typeof step.updatedAt === 'string' ? step.updatedAt : (typeof step.createdAt === 'string' ? step.createdAt : new Date().toISOString()),
        expenseId: typeof step.expenseId === 'number' ? step.expenseId : expenseId,
        approvalStatus: (step.approvalStatus === 'PENDING' || step.approvalStatus === 'APPROVED' || step.approvalStatus === 'REJECTED' ? step.approvalStatus : 'PENDING') as "PENDING" | "APPROVED" | "REJECTED",
        comments: typeof step.comments === 'string' ? step.comments : null,
        actionedBy: typeof step.actionedBy === 'number' ? step.actionedBy : 0,
        roleId: typeof step.roleId === 'number' ? step.roleId : 0,
        role: roleData
          ? {
              id: typeof roleData.id === 'number' ? roleData.id : 0,
              name: typeof roleData.name === 'string' ? roleData.name : '',
            }
          : undefined,
        // Use user if available, otherwise use approver
        user: userData
          ? {
              id: typeof userData.id === 'number' ? userData.id : 0,
              firstName: typeof userData.firstName === 'string' ? userData.firstName : '',
              lastName: typeof userData.lastName === 'string' ? userData.lastName : '',
              email: typeof userData.email === 'string' ? userData.email : '',
            }
          : approverData
          ? {
              id: typeof approverData.id === 'number' ? approverData.id : 0,
              firstName: typeof approverData.firstName === 'string' ? approverData.firstName : '',
              lastName: typeof approverData.lastName === 'string' ? approverData.lastName : '',
              email: typeof approverData.email === 'string' ? approverData.email : '',
            }
          : undefined,
        // Also keep the approver for backward compatibility
        approver: approverData
          ? {
              id: typeof approverData.id === 'number' ? approverData.id : 0,
              firstName: typeof approverData.firstName === 'string' ? approverData.firstName : '',
              lastName: typeof approverData.lastName === 'string' ? approverData.lastName : '',
              email: typeof approverData.email === 'string' ? approverData.email : '',
            }
          : userData
          ? {
              id: typeof userData.id === 'number' ? userData.id : 0,
              firstName: typeof userData.firstName === 'string' ? userData.firstName : '',
              lastName: typeof userData.lastName === 'string' ? userData.lastName : '',
              email: typeof userData.email === 'string' ? userData.email : '',
            }
          : undefined,
      };
    });
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
            ? data.expenseSteps.map((step: Record<string, unknown>) => {
                const roleData = step.role as Record<string, unknown> | undefined;
                const approverData = step.approver as Record<string, unknown> | undefined;
                return {
                  id: typeof step.id === 'number' ? step.id : 0,
                  order: typeof step.order === 'number' ? step.order : 0,
                  isOptional: Boolean(step.isOptional),
                  status: typeof step.status === 'string' ? step.status : "PENDING",
                  comments: typeof step.comments === 'string' ? step.comments : null,
                  roleId: typeof step.roleId === 'number' ? step.roleId : 0,
                  workflowStepId: typeof step.workflowStepId === 'number' ? step.workflowStepId : 0,
                  approverId: typeof step.approverId === 'number' ? step.approverId : null,
                  role: roleData
                    ? {
                        id: typeof roleData.id === 'number' ? roleData.id : 0,
                        name: typeof roleData.name === 'string' ? roleData.name : '',
                      }
                    : undefined,
                  approver: approverData
                    ? {
                        id: typeof approverData.id === 'number' ? approverData.id : 0,
                        firstName: typeof approverData.firstName === 'string' ? approverData.firstName : '',
                        lastName: typeof approverData.lastName === 'string' ? approverData.lastName : '',
                        email: typeof approverData.email === 'string' ? approverData.email : '',
                      }
                    : null,
                };
              })
            : [],
          // Transform approval steps using the helper function
          approvalSteps: transformApprovalSteps(
            (data.approvalSteps as unknown) as Array<Record<string, unknown>>,
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
        <Card className="border-0 bg-white shadow-sm rounded-3 mb-4">
          <Row className="mb-0">
            <Col className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-success bg-opacity-10 p-2 rounded-2">
                      <FileText size={24} className="text-success" />
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bold text-dark">
                        Expense Approval Details
                      </h4>
                      <p className="text-muted mb-0 small d-flex align-items-center gap-2 mt-1">
                        <ListCheck size={14} />
                        Tracking approval process for expense #{expense.id}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline-secondary"
                  onClick={() => router.back()}
                  className="d-flex align-items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
              </div>

              {expense.description && (
                <div className="bg-light p-3 rounded-2 mt-3">
                  <span className="text-muted small fw-semibold d-block mb-1">Description:</span>
                  <span className="text-dark">{expense.description}</span>
                </div>
              )}
            </Col>
          </Row>
        </Card>

        {/* Approval Progress */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="bg-white p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-2">
                      <ListCheck size={18} className="text-primary" />
                    </div>
                    <h5 className="card-title mb-0 fw-bold">
                      Approval Progress
                    </h5>
                  </div>
                  <Badge
                    bg={getStatusVariant(expense.status)}
                    className="d-flex align-items-center gap-1 px-3 py-2"
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
                  style={{ height: "12px", borderRadius: "6px" }}
                />
                <div className="d-flex justify-content-between">
                  <small className="text-muted fw-medium">
                    {
                      approvalSteps.filter((s) => s.approvalStatus === "APPROVED")
                        .length
                    }{" "}
                    of {approvalSteps.length} steps completed
                  </small>
                  <small className="fw-bold text-dark">{Math.round(approvalProgress)}%</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Left Column - Expense Details */}
          <Col lg={8} className="mb-4">
            <Card className="mb-4 border-0 shadow-sm rounded-3">
              {/* Header */}
              <div className="bg-light border-bottom">
                <div className="container-fluid px-4 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-2">
                      <FileEarmarkText className="text-primary" size={20} />
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-0 fw-bold text-dark">
                        Expense Summary
                      </h5>
                      <p className="mb-0 small text-muted">
                        Detailed overview of expense #{expense.id}
                      </p>
                    </div>
                    <div className="d-flex align-items-end justify-content-end flex-column gap-2">
                      <div className="fw-bold text-dark fs-6">
                        {expense.amount.toLocaleString()} {expense.currency?.initials}
                      </div>
                      <div className="small">
                        <span className="d-flex align-items-center gap-1">
                          {expense.allowEditing ? (
                            <>
                              <Unlock size={14} className="text-success" />
                              <span className="text-success fw-medium">
                                Editable
                              </span>
                            </>
                          ) : (
                            <>
                              <Lock size={14} className="text-danger" />
                              <span className="text-danger fw-medium">
                                Locked
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
                    <Card className="h-100 border shadow-sm rounded-3 bg-white">
                      <Card.Body className="p-3">
                        <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                          <InfoCircle size={16} className="text-primary" />
                          Basic Information
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Expense ID</span>
                            <span className="fw-semibold text-dark">#{expense.id}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Status</span>
                            <Badge bg={getStatusVariant(expense.status)} className="px-2 py-1">
                              {expense.status}
                            </Badge>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Payment Status</span>
                            <Badge bg={getStatusVariant(expense.paymentStatus)} className="px-2 py-1">
                              {expense.paymentStatus}
                            </Badge>
                          </li>
                          <li className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Active</span>
                            <Badge
                              bg={expense.isActive ? "success" : "secondary"}
                              className="px-2 py-1"
                            >
                              {expense.isActive ? "Yes" : "No"}
                            </Badge>
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Financial Info */}
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-white">
                      <Card.Body className="p-3">
                        <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                          <WalletIcon size={16} className="text-primary" />
                          Financial Information
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Amount</span>
                            <span className="fw-bold text-success">
                              {expense.amount.toLocaleString()}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Primary Amount</span>
                            <span className="text-dark">
                              {expense.primaryAmount.toLocaleString()}{" "}
                              <small className="text-muted">
                                {expense.currency?.initials}
                              </small>
                            </span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Exchange Rate</span>
                            <span className="text-dark">
                              {expense.exchangeRate}
                              {expense.exchangeRateUsed && (
                                <small className="text-muted ms-1">
                                  ({expense.exchangeRateUsed})
                                </small>
                              )}
                            </span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Currency</span>
                            <span className="text-dark fw-medium">{expense.currency?.initials}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Payment Method</span>
                            <span className="text-dark">{expense.paymentMethod?.name}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Reference No.</span>
                            <span className="text-dark fw-medium">{expense.referenceNumber}</span>
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Payee Info */}
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-white">
                      <Card.Body className="p-3">
                        <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                          <PersonFill size={16} className="text-primary" />
                          Payee Details
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Payee Name</span>
                            <span className="text-dark fw-medium">{expense.payee}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Payee ID</span>
                            <span className="text-dark">{expense.payeeId}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Payee Number</span>
                            <span className="text-dark">{expense.payeeNumber || "N/A"}</span>
                          </li>
                          {expense.receiptUrl && (
                            <li className="d-flex justify-content-between align-items-center">
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
                    <Card className="h-100 border shadow-sm rounded-3 bg-white">
                      <Card.Body className="p-3">
                        <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                          <ListCheck size={16} className="text-primary" />
                          Organizational Information
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Category</span>
                            <span className="text-dark fw-medium">{expense.category?.name || "N/A"}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Department</span>
                            <span className="text-dark fw-medium">{expense.department?.name || "N/A"}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Region</span>
                            <span className="text-dark fw-medium">{expense.region?.name || "N/A"}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Workflow</span>
                            <span className="text-dark fw-medium">{expense.workflow?.name || "N/A"}</span>
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Timestamps */}
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-white">
                      <Card.Body className="p-3">
                        <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                          <Clock size={16} className="text-primary" />
                          Timestamps
                        </h6>
                        <ul className="list-unstyled mb-0 small">
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Created At</span>
                            <span className="text-dark">{formatDate(expense.createdAt)}</span>
                          </li>
                          <li className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <span className="text-muted">Updated At</span>
                            <span className="text-dark">{formatDate(expense.updatedAt)}</span>
                          </li>
                          {expense.paymentDate && (
                            <li className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Payment Date</span>
                              <span className="text-dark">{formatDate(expense.paymentDate)}</span>
                            </li>
                          )}
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* People */}
                  <Col md={6}>
                    <Card className="h-100 border shadow-sm rounded-3 bg-white">
                      <Card.Body className="p-3">
                        <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                          <WalletIcon size={16} className="text-primary" />
                          Payment Information
                        </h6>
                        <div className="small">
                          {expense.paidBy ? (
                            <div className="bg-success bg-opacity-10 p-3 rounded-2 border border-success">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <PersonFill size={16} className="text-success" />
                                <span className="fw-semibold text-dark">
                                  {expense.paidBy.firstName}{" "}
                                  {expense.paidBy.lastName}
                                </span>
                              </div>
                              {expense.paidBy.email && (
                                <small className="d-block text-muted">
                                  {expense.paidBy.email}
                                </small>
                              )}
                            </div>
                          ) : (
                            <div className="bg-warning bg-opacity-10 p-3 rounded-2 border border-warning">
                              <div className="d-flex align-items-center gap-2">
                                <ClockIcon size={16} className="text-warning" />
                                <span className="fw-medium text-dark">Pending payment</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Advances */}
            {expense.advances?.length > 0 && (
              <Card className="shadow-sm border-0 rounded-3 mt-4">
                <Card.Header className="bg-light border-bottom py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-info bg-opacity-10 p-2 rounded-2">
                      <WalletIcon size={18} className="text-info" />
                    </div>
                    <h5 className="mb-0 fw-bold text-dark">
                      Advance Breakdown
                    </h5>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table
                    responsive
                    hover
                    className="mb-0 align-middle small"
                  >
                    <thead className="bg-light">
                      <tr>
                        <th className="px-3 py-3 text-muted fw-semibold">ID</th>
                        <th className="px-3 py-3 text-muted fw-semibold">Primary Amount</th>
                        <th className="px-3 py-3 text-muted fw-semibold">Exchange Rate</th>
                        <th className="px-3 py-3 text-muted fw-semibold">Amount</th>
                        <th className="px-3 py-3 text-muted fw-semibold">Category</th>
                        <th className="px-3 py-3 text-muted fw-semibold">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.advances.map((advance) => (
                        <tr key={advance.id} className="border-bottom">
                          <td className="px-3 py-3">
                            <Badge bg="light" text="dark" className="fw-medium">
                              #{advance.id}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 fw-semibold text-dark">
                            {advance.primaryAmount?.toLocaleString() || "N/A"}
                          </td>
                          <td className="px-3 py-3 text-dark">{advance.exchangeRate || "1.0"}</td>
                          <td className="px-3 py-3 fw-bold text-success">
                            {advance.amount?.toLocaleString() || "N/A"}
                          </td>
                          <td className="px-3 py-3 text-dark">{advance.category?.name || "N/A"}</td>
                          <td className="px-3 py-3">
                            <Badge bg="primary" className="px-2 py-1">
                              {advance.currency?.initials || "N/A"}
                            </Badge>
                          </td>
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
            <Card className="mb-4 border-0 shadow-sm rounded-3">
              <div className="bg-light border-bottom">
                <div className="container-fluid px-4 py-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-2">
                      <ListCheck className="text-primary" size={20} />
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-0 fw-bold text-dark">
                        Approval Steps
                      </h5>
                      <p className="mb-0 small text-muted">
                        Process for expense #{expense.id}
                      </p>
                    </div>
                    <div>
                      <Badge
                        bg="primary"
                        className="px-3 py-2"
                      >
                        {expense.expenseSteps?.length || 0} Steps
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <Card.Body className="p-4">
                {!expense.expenseSteps || expense.expenseSteps.length === 0 ? (
                  <Alert variant="info" className="mb-0 border-0">
                    <div className="d-flex align-items-center gap-2">
                      <InfoCircle size={18} />
                      <span>No expense process steps available.</span>
                    </div>
                  </Alert>
                ) : (
                  <div className="timeline">
                    {expense.expenseSteps.map((step, index: number) => (
                      <div
                        key={`expense-${step.id || index}`}
                        className="timeline-item mb-4"
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div className="text-center position-relative">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center ${
                                step.status === "APPROVED"
                                  ? "bg-success"
                                  : step.status === "REJECTED"
                                  ? "bg-danger"
                                  : "bg-warning"
                              }`}
                              style={{ width: "32px", height: "32px", zIndex: 1 }}
                            >
                              {step.status === "APPROVED" ? (
                                <CheckCircle className="text-white" size={16} />
                              ) : step.status === "REJECTED" ? (
                                <XCircle className="text-white" size={16} />
                              ) : (
                                <Clock className="text-white" size={16} />
                              )}
                            </div>
                            {index < expense.expenseSteps.length - 1 && (
                              <div
                                className="position-absolute start-50 translate-middle-x"
                                style={{
                                  width: "2px",
                                  height: "40px",
                                  backgroundColor: "#dee2e6",
                                  top: "32px",
                                }}
                              ></div>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1 fw-bold text-dark">
                                  {step.role?.name || `Step ${step.order}`}
                                </h6>
                                {step.approver && (
                                  <div className="text-muted small d-flex align-items-center gap-1">
                                    <PersonFill size={12} className="text-primary" />
                                    {step.approver.firstName}{" "}
                                    {step.approver.lastName}
                                  </div>
                                )}
                              </div>
                              <Badge bg={getStatusVariant(step.status)} className="px-2 py-1">
                                {step.status}
                              </Badge>
                            </div>
                            {step.comments && (
                              <div className="mt-2 p-2 bg-light rounded-2 border">
                                <small className="text-muted fst-italic">
                                  &quot;{step.comments}&quot;
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Container>
        {/* Approval Steps */}
        <Card className="mb-5 shadow-sm border-0 rounded-3">
          <div className="bg-light border-bottom py-3 px-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-10 p-2 rounded-2">
                <ListCheck className="text-success" size={20} />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-0 fw-bold text-dark">Expense Approval Logs</h5>
                <p className="mb-0 small text-muted">Complete history of approval actions</p>
              </div>
              <Badge bg="success" className="px-3 py-2">
                {expense.approvalSteps?.length || 0} Actions
              </Badge>
            </div>
          </div>
          <Card.Body className="p-0">
            {expense.approvalSteps?.length === 0 ? (
              <div className="p-4">
                <Alert variant="info" className="mb-0 border-0">
                  <div className="d-flex align-items-center gap-2">
                    <InfoCircle size={18} />
                    <span>No approval logs available for this expense.</span>
                  </div>
                </Alert>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 py-3 text-muted fw-semibold border-bottom">
                        Status
                      </th>
                      <th className="py-3 text-muted fw-semibold border-bottom">
                        Role
                      </th>
                      <th className="py-3 text-muted fw-semibold border-bottom">
                        Approver
                      </th>
                      <th className="pe-4 py-3 text-muted fw-semibold border-bottom">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expense.approvalSteps?.map((step, index: number) => {
                      return (
                        <tr
                          key={`approval-${step.id || index}`}
                          className="border-bottom"
                        >
                          {/* Status */}
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className={`rounded-circle d-flex align-items-center justify-content-center ${
                                  step.approvalStatus === "APPROVED"
                                    ? "bg-success bg-opacity-10"
                                    : step.approvalStatus === "REJECTED"
                                    ? "bg-danger bg-opacity-10"
                                    : "bg-warning bg-opacity-10"
                                }`}
                                style={{ width: "32px", height: "32px" }}
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
                              <Badge
                                bg={
                                  step.approvalStatus === "APPROVED"
                                    ? "success"
                                    : step.approvalStatus === "REJECTED"
                                    ? "danger"
                                    : "warning"
                                }
                                className="px-2 py-1"
                              >
                                {step.approvalStatus}
                              </Badge>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px" }}
                              >
                                <ShieldCheck
                                  className="text-primary"
                                  size={16}
                                />
                              </div>
                              <span className="fw-medium text-dark">
                                {step.role?.name || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Approver */}
                          <td className="py-3">
                            {step.user || step.approver ? (
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  <PersonFill
                                    className="text-success"
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
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="bg-light rounded-circle d-flex align-items-center justify-content-center"
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
                              <div className="bg-light p-2 rounded-2 border">
                                <p className="mb-1 text-dark small">
                                  <span className="fst-italic">&quot;{step.comments}&quot;</span>
                                </p>
                                <small className="text-muted">
                                  {formatDate(step.createdAt)}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted fst-italic small">
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
