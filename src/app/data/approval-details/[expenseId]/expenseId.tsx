"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Head from "next/head";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Table,
  ProgressBar,
  Alert,
  Spinner,
  Button,
  ListGroup,
} from "react-bootstrap";
import { BASE_API_URL } from "@/app/static/apiConfig";

interface ExpenseApprovalDetailsProps {
  params: {
    expenseId: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const ExpenseApprovalDetails = ({ params }: ExpenseApprovalDetailsProps) => {
  const router = useRouter();
  const [expenseId, setExpenseId] = useState<string | null>(null);

  const [expenseData, setExpenseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

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
          throw new Error(errorData.message || 'Failed to fetch expense data');
        }
        
        const data = await response.json();
        // The backend returns { ...expense, approvalSteps: [...] }
        // So we can set it directly as expenseData
        setExpenseData({
          ...data,
          expense: data,  // The expense data is at the root level
          approvalSteps: data.approvalSteps || []  // Extract approvalSteps
        });
        toast.success("Expense data loaded successfully");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred while fetching expense data";
        if (!initialLoad) {
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchExpenseData();
  }, [expenseId]);

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

  const calculateApprovalProgress = () => {
    if (!expenseData?.approvalSteps) return 0;
    const totalSteps = expenseData.approvalSteps.length;
    const approvedSteps = expenseData.approvalSteps.filter(
      (step: any) => step.status === "APPROVED"
    ).length;
    return totalSteps > 0 ? (approvedSteps / totalSteps) * 100 : 0;
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="text-center">
          <Spinner
            animation="border"
            role="status"
            variant="primary"
            className="mb-3"
          />
          <p>Loading expense details...</p>
        </div>
      </Container>
    );
  }

  if (!expenseData) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Expense Not Found</Alert.Heading>
          <p>The requested expense could not be found.</p>
          <Button onClick={() => router.back()} variant="outline-warning">
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  // The expense data is at the root level, with approvalSteps as a property
  const expense = expenseData;
  const approvalSteps = expenseData.approvalSteps || [];
  const approvalProgress = calculateApprovalProgress();

  return (
    <>
      <Head>
        <title>Expense #{expense.id} - Approval Details</title>
      </Head>

      <Container className="py-5">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2">Expense Approval Details</h1>
                <p className="text-muted">
                  Tracking approval process for expense #{expense.id}
                </p>
              </div>
              <Button variant="outline-secondary" onClick={() => router.back()}>
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
                  <h6 className="card-title mb-0">Approval Progress</h6>
                  <Badge bg={getStatusVariant(expense.status)}>
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
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Expense Summary</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Description</h6>
                    <p>{expense.description || "No description provided"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Amount</h6>
                    <p className="fw-bold fs-5">
                      {formatCurrency(expense.amount, expense.currency?.code)}
                    </p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Category</h6>
                    <p>{expense.category?.name || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Department</h6>
                    <p>{expense.department?.name || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Payment Method</h6>
                    <p>{expense.paymentMethod?.name || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Region</h6>
                    <p>{expense.region?.name || "N/A"}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Submitted By</h6>
                    <p>
                      {expense.user?.firstName} {expense.user?.lastName}
                      {expense.user?.email && (
                        <>
                          <br />
                          <small>{expense.user.email}</small>
                        </>
                      )}
                    </p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Paid By</h6>
                    <p>
                      {expense.paidBy
                        ? `${expense.paidBy.firstName} ${expense.paidBy.lastName}`
                        : "N/A"}
                      {expense.paidBy?.email && (
                        <>
                          <br />
                          <small>{expense.paidBy.email}</small>
                        </>
                      )}
                    </p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Date Submitted</h6>
                    <p>{formatDate(expense.createdAt)}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6 className="text-muted">Status</h6>
                    <p>
                      <Badge bg={getStatusVariant(expense.status)}>
                        {expense.status}
                      </Badge>
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Budgets */}
            {expense.budgets?.length > 0 && (
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">Budget Information</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Budget Name</th>
                        <th>Category</th>
                        <th>Department</th>
                        <th>Region</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.budgets.map((budget: any) => (
                        <tr key={budget.id}>
                          <td>{budget.name}</td>
                          <td>{budget.expenseCategory?.name || "N/A"}</td>
                          <td>{budget.department?.name || "N/A"}</td>
                          <td>{budget.region?.name || "N/A"}</td>
                          <td>
                            <Badge
                              bg={budget.isActive ? "success" : "secondary"}
                            >
                              {budget.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Advances */}
            {expense.advances?.length > 0 && (
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Advance Payments</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive striped hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.advances.map((advance: any) => (
                        <tr key={advance.id}>
                          <td>{advance.description || "No description"}</td>
                          <td>
                            {formatCurrency(
                              advance.amount,
                              advance.currency?.code
                            )}
                          </td>
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
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Approval Process</h6>
              </Card.Header>
              <Card.Body>
                {approvalSteps.length === 0 ? (
                  <Alert variant="danger" className="mb-0">
                    No approval steps recorded yet.
                  </Alert>
                ) : (
                  <ListGroup variant="flush">
                    {approvalSteps.map((step: any, index: number) => (
                      <ListGroup.Item key={step.id || index} className="px-0">
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
                            {index < approvalSteps.length - 1 && (
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
                                {step.user ? (
                                  <>
                                    Approved by {step.user.firstName}{" "}
                                    {step.user.lastName}
                                  </>
                                ) : step.role ? (
                                  <>
                                    Pending approval from {step.role.name} role
                                  </>
                                ) : (
                                  <>Approval step {step.stepNumber}</>
                                )}
                              </h6>
                              <Badge bg={getStatusVariant(step.status)}>
                                {step.status}
                              </Badge>
                            </div>
                            <small className="text-muted d-block">
                              {formatDate(step.createdAt)}
                            </small>
                            {step.comments && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small>"{step.comments}"</small>
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

            {/* Workflow */}
            {expense.workflow && (
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Workflow Details</h6>
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
    </>
  );
};

export default ExpenseApprovalDetails;
