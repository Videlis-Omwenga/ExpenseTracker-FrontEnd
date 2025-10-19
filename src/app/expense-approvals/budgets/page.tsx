"use client";

import { useState, useMemo } from "react";
import { Col, Card, Modal, Table, Spinner, Button, Row } from "react-bootstrap";
import {
  BarChart2,
  X,
  TrendingUp,
  Tag,
  MapPin,
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Percent,
  Info,
  Calendar,
} from "lucide-react";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { toast } from "react-toastify";

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

interface Budget {
  id: number;
  expenseCategory: ExpenseCategory;
  departmentId: number;
  department: Department;
  regionId: number;
  region: Region;
  originalBudget: number;
  remainingBudget: number;
  monthYear: string;
  isActive: boolean;
}

interface BudgetSummary {
  totalBudget?: number;
  totalUsed?: number;
  totalRemaining?: number;
  averageUtilization?: number;
}

interface ExpenseResponse {
  budgets: Budget[];
  budgetSummary: BudgetSummary;
  id: number;
}

const BudgetOverviewHOD = () => {
  const [show, setShow] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setShow(true);
    fetchBudgets();
  };

  const handleClose = () => setShow(false);

  // Calculate budget statistics
  const budgetStats = useMemo(() => {
    const totalOriginal = budgets.reduce((sum, b) => sum + b.originalBudget, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingBudget, 0);
    const totalSpent = totalOriginal - totalRemaining;
    const avgUtilization = totalOriginal > 0 ? (totalSpent / totalOriginal) * 100 : 0;
    const criticalBudgets = budgets.filter(b => b.remainingBudget < b.originalBudget * 0.2).length;

    return {
      totalOriginal,
      totalRemaining,
      totalSpent,
      avgUtilization,
      criticalBudgets,
    };
  }, [budgets]);

  const handleRequestClick = (budget: Budget) => {
    // Close the current modal first
    setShow(false);

    // Set a small timeout to allow the modal to close before opening the new one
    setTimeout(() => {
      setCurrentBudget(budget);
      setRequestAmount("");
      setRequestReason("");
      setShowRequestModal(true);
    }, 300); // 300ms should be enough for the modal close animation
  };

  const handleCloseRequestModal = () => {
    // Close the request modal
    setShowRequestModal(false);
    setCurrentBudget(null);

    // Reopen the budgets modal after a short delay
    setTimeout(() => {
      setShow(true);
    }, 300); // 300ms should be enough for the modal close animation
  };

  const handleSubmitRequest = async () => {
    if (
      !currentBudget ||
      !requestAmount ||
      isNaN(Number(requestAmount)) ||
      Number(requestAmount) <= 0
    ) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically make an API call to submit the budget request
      // For example: await submitBudgetRequest(currentBudget.id, Number(requestAmount), requestReason);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Budget increase request submitted successfully");
      handleCloseRequestModal();
    } catch (error) {
      console.error("Error submitting budget request:", error);
      toast.error("Failed to submit budget request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_API_URL}/expense-submission/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch budgets");
      }

      const expenses: ExpenseResponse[] = await res.json();

      // Extract and flatten budgets from all expenses
      const allBudgets: Budget[] = [];

      expenses.forEach((expense: ExpenseResponse) => {
        if (expense.budgets && Array.isArray(expense.budgets)) {
          expense.budgets.forEach((budget: Budget) => {
            allBudgets.push({
              ...budget,
              expenseCategory: budget.expenseCategory || {
                id: 0,
                name: "Uncategorized",
              },
            });
          });
        }
      });

      // Remove duplicates based on budget ID
      const uniqueBudgets = Array.from(
        new Map(allBudgets.map((budget) => [budget.id, budget])).values()
      ) as Budget[];

      setBudgets(uniqueBudgets);
    } catch (err) {
      toast.error(`${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ===== Activator Card ===== */}
      <Col md={3} onClick={handleOpen} style={{ cursor: 'pointer' }}>
        <div className="budget-activator-card-hod position-relative overflow-hidden">
          <div className="gradient-overlay"></div>
          <div className="card-content position-relative">
            <div className="d-flex align-items-center">
              <div className="icon-wrapper">
                <FileText size={26} />
              </div>
              <div className="ms-3">
                <p className="label mb-1">Budget</p>
                <h6 className="title mb-0">Management</h6>
              </div>
            </div>
          </div>
        </div>
      </Col>

      {/* ===== Modal with Table ===== */}
      <Modal
        show={show}
        onHide={handleClose}
        size="xl"
        aria-labelledby="budget-modal-title"
        className="budget-overview-modal"
      >
        <Modal.Header className="border-0 pb-2 modern-modal-header">
          <div className="w-100">
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <div className="d-flex align-items-center mb-2">
                  <div className="header-icon-wrapper me-3">
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h4 id="budget-modal-title" className="modal-title mb-1">
                      Budget Overview
                    </h4>
                    <p className="modal-subtitle mb-0">
                      <Info size={14} className="me-1" />
                      Monitor department budgets and spending patterns
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-custom"
                onClick={handleClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-3">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-wrapper">
                <Spinner animation="border" variant="primary" />
                <BarChart2 className="spinner-icon" size={28} />
              </div>
              <p className="loading-text">Loading budget data...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <BarChart2 size={56} />
              </div>
              <h5 className="empty-title">No budgets available</h5>
              <p className="empty-text">
                There are no budgets to display at this time.
              </p>
            </div>
          ) : (
            <>
              {/* Budget Statistics Cards */}
              <Row className="g-3 mb-4">
                <Col xs={12} sm={6} lg={3}>
                  <Card className="stat-card stat-card-blue border-0 h-100">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="stat-icon-wrapper bg-primary bg-opacity-10">
                          <DollarSign size={20} className="text-primary" />
                        </div>
                      </div>
                      <h6 className="stat-value mb-1">
                        ${budgetStats.totalOriginal.toLocaleString()}
                      </h6>
                      <p className="stat-label mb-0">Total Budget</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                  <Card className="stat-card stat-card-green border-0 h-100">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="stat-icon-wrapper bg-success bg-opacity-10">
                          <TrendingUp size={20} className="text-success" />
                        </div>
                      </div>
                      <h6 className="stat-value mb-1">
                        ${budgetStats.totalRemaining.toLocaleString()}
                      </h6>
                      <p className="stat-label mb-0">Remaining</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                  <Card className="stat-card stat-card-orange border-0 h-100">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="stat-icon-wrapper bg-warning bg-opacity-10">
                          <TrendingDown size={20} className="text-warning" />
                        </div>
                      </div>
                      <h6 className="stat-value mb-1">
                        ${budgetStats.totalSpent.toLocaleString()}
                      </h6>
                      <p className="stat-label mb-0">Spent</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={3}>
                  <Card className="stat-card stat-card-red border-0 h-100">
                    <Card.Body className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="stat-icon-wrapper bg-danger bg-opacity-10">
                          <AlertTriangle size={20} className="text-danger" />
                        </div>
                      </div>
                      <h6 className="stat-value mb-1">
                        {budgetStats.criticalBudgets}
                      </h6>
                      <p className="stat-label mb-0">Critical Budgets</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Budget Table */}
              <div className="table-responsive rounded-3 shadow-sm">
                <Table hover className="mb-0 border modern-table">
                <thead>
                  <tr>
                    <th className="ps-4">
                      <div className="d-flex align-items-center">
                        <Tag size={14} className="me-2" />
                        <span>ID</span>
                      </div>
                    </th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>
                      <div className="d-flex align-items-center">
                        <MapPin size={14} className="me-2" />
                        <span>Region</span>
                      </div>
                    </th>
                    <th>Original Budget</th>
                    <th>
                      <div className="d-flex align-items-center">
                        <TrendingUp size={14} className="me-2" />
                        <span>Remaining</span>
                      </div>
                    </th>
                    <th>
                      <div className="d-flex align-items-center">
                        <Percent size={14} className="me-2" />
                        <span>Utilization</span>
                      </div>
                    </th>
                    <th>
                      <div className="d-flex align-items-center">
                        <Calendar size={14} className="me-2" />
                        <span>Period</span>
                      </div>
                    </th>
                    <th className="pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => {
                    const utilizationPercentage = Math.max(
                      0,
                      Math.min(
                        100,
                        100 - (b.remainingBudget / b.originalBudget) * 100
                      )
                    );
                    const isCritical =
                      b.remainingBudget < b.originalBudget * 0.2;
                    const isWarning =
                      !isCritical && b.remainingBudget < b.originalBudget * 0.5;

                    return (
                      <tr key={b.id} className="table-row-hover">
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <span className="budget-id">{b.id}</span>
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">
                            {b.expenseCategory?.name || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="department-text">
                            {b.department?.name || `Department ${b.departmentId}`}
                          </span>
                        </td>
                        <td>
                          <span className="region-badge">
                            <MapPin size={12} className="me-1" />
                            {b.region?.name || `Region ${b.regionId}`}
                          </span>
                        </td>
                        <td>
                          <span className="budget-amount fw-semibold">
                            ${b.originalBudget.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {isCritical ? (
                              <AlertTriangle size={16} className="me-2 text-danger" />
                            ) : isWarning ? (
                              <AlertTriangle size={16} className="me-2 text-warning" />
                            ) : (
                              <CheckCircle size={16} className="me-2 text-success" />
                            )}
                            <span className={`remaining-amount fw-semibold ${
                              isCritical ? "text-danger" : isWarning ? "text-warning" : "text-success"
                            }`}>
                              ${b.remainingBudget.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="utilization-wrapper">
                            <div className="progress-container">
                              <div
                                className={`progress-bar-modern ${
                                  isCritical ? "progress-danger" : isWarning ? "progress-warning" : "progress-success"
                                }`}
                                style={{ width: `${utilizationPercentage}%` }}
                              ></div>
                            </div>
                            <span className={`utilization-percent ${
                              isCritical ? "text-danger" : isWarning ? "text-warning" : "text-success"
                            }`}>
                              {Math.round(utilizationPercentage)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="period-text">
                            {new Date(b.monthYear).toLocaleDateString("en-US", {
                              month: "long",
                            })}
                          </span>
                        </td>
                        <td className="pe-4">
                          <Button
                            size="sm"
                            variant="primary"
                            className="action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestClick(b);
                            }}
                            disabled={isSubmitting}
                          >
                            Request More
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-top pt-3">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Showing {budgets.length} budget{budgets.length !== 1 ? "s" : ""}
            </span>
            <Button
              size="sm"
              variant="light"
              className="rounded-pill px-4"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Budget Request Modal */}
      <Modal
        show={showRequestModal}
        onHide={handleCloseRequestModal}
        size="xl"
        aria-labelledby="budget-request-modal-title"
        className="budget-request-modal"
      >
        <Modal.Header className="border-0 pb-2 modern-modal-header request-modal-header">
          <div className="w-100">
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <div className="d-flex align-items-center mb-2">
                  <div className="header-icon-wrapper-success me-3">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 id="budget-request-modal-title" className="modal-title mb-1">
                      Request Budget Addition
                    </h4>
                    <p className="modal-subtitle mb-0">
                      <Info size={14} className="me-1" />
                      Request additional budget allocation for your department
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-custom"
                onClick={handleCloseRequestModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-3">
          {currentBudget && (
            <div>
              <div className="budget-details-card mb-4">
                <h6 className="details-title mb-3">Budget Details</h6>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="detail-item">
                      <p className="detail-label">Category</p>
                      <p className="detail-value">
                        {currentBudget.expenseCategory?.name || "N/A"}
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="detail-item">
                      <p className="detail-label">Department</p>
                      <p className="detail-value">
                        {currentBudget.department?.name || "N/A"}
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="detail-item">
                      <p className="detail-label">Current Remaining</p>
                      <p className="detail-value-amount">
                        ${currentBudget.remainingBudget.toLocaleString()}
                      </p>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="request-form-card">
                <label htmlFor="amount" className="form-label-custom">
                  Amount to Request
                </label>
                <div className="input-group-custom mb-3">
                  <span className="input-prefix">
                    <DollarSign size={18} />
                  </span>
                  <input
                    type="number"
                    className="form-control-custom"
                    id="amount"
                    placeholder="Enter amount"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="form-hint">
                  Enter the additional amount you&apos;re requesting
                </p>

                <div className="mt-4">
                  <label htmlFor="reason" className="form-label-custom">
                    Reason for Request{" "}
                    <span className="optional-label">(Optional)</span>
                  </label>
                  <textarea
                    className="textarea-custom"
                    id="reason"
                    rows={4}
                    placeholder="Explain why you need this additional budget..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="form-hint">
                    Help us understand why you need this additional budget
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <div className="d-flex justify-content-end w-100 gap-3">
            <Button
              variant="light"
              className="cancel-button"
              onClick={handleCloseRequestModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              className="submit-button"
              onClick={handleSubmitRequest}
              disabled={isSubmitting || !requestAmount}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Submitting...
                </>
              ) : (
                <>
                  <TrendingUp size={16} className="me-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        /* ===== Activator Card Styles ===== */
        .budget-activator-card-hod {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
        }

        .budget-activator-card-hod:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
        }

        .budget-activator-card-hod .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          border-radius: 16px;
          pointer-events: none;
        }

        .budget-activator-card-hod .icon-wrapper {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
        }

        .budget-activator-card-hod:hover .icon-wrapper {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .budget-activator-card-hod .label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .budget-activator-card-hod .title {
          color: white;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        /* ===== Modal Styles ===== */
        :global(.budget-overview-modal .modal-content),
        :global(.budget-request-modal .modal-content) {
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        :global(.budget-overview-modal .modal-header),
        :global(.budget-request-modal .modal-header) {
          padding: 2rem 2rem 1rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }

        :global(.budget-overview-modal .modal-body),
        :global(.budget-request-modal .modal-body) {
          padding: 1.5rem 2rem 2rem;
          background: #fafbfc;
        }

        :global(.budget-overview-modal .modal-footer),
        :global(.budget-request-modal .modal-footer) {
          padding: 1rem 2rem 1.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .modern-modal-header .header-icon-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0.875rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .modern-modal-header .header-icon-wrapper-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 0.875rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .modern-modal-header .modal-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
          line-height: 1.2;
        }

        .modern-modal-header .modal-subtitle {
          font-size: 0.875rem;
          color: #718096;
          display: flex;
          align-items: center;
          margin: 0;
        }

        .btn-close-custom {
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #718096;
        }

        .btn-close-custom:hover {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          transform: rotate(90deg);
        }

        /* ===== Statistics Cards ===== */
        :global(.stat-card) {
          background: white;
          border-radius: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: relative;
          overflow: hidden;
        }

        :global(.stat-card)::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        :global(.stat-card):hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        :global(.stat-card):hover::before {
          opacity: 1;
        }

        :global(.stat-card-blue)::before {
          color: #0d6efd;
        }

        :global(.stat-card-green)::before {
          color: #198754;
        }

        :global(.stat-card-orange)::before {
          color: #ffc107;
        }

        :global(.stat-card-red)::before {
          color: #dc3545;
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        :global(.stat-card):hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.8125rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        /* ===== Loading & Empty States ===== */
        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .spinner-wrapper {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .spinner-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #0d6efd;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .loading-text {
          color: #718096;
          font-size: 1rem;
          font-weight: 500;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
          border-radius: 50%;
          margin-bottom: 1.5rem;
          color: #a0a0a0;
        }

        .empty-title {
          color: #1a202c;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .empty-text {
          color: #718096;
          font-size: 0.9375rem;
        }

        /* ===== Table Styles ===== */
        :global(.modern-table) {
          border: none !important;
          background: white;
        }

        :global(.modern-table thead) {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        :global(.modern-table thead th) {
          border: none !important;
          padding: 1rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #495057;
        }

        :global(.modern-table tbody tr) {
          border-bottom: 1px solid #f1f3f5;
          transition: all 0.2s ease;
        }

        :global(.modern-table tbody tr:hover) {
          background: linear-gradient(135deg, #f8f9ff 0%, #f5f7ff 100%);
          transform: scale(1.01);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        :global(.modern-table tbody td) {
          padding: 1.125rem 0.75rem;
          vertical-align: middle;
          border: none !important;
        }

        .budget-id {
          font-weight: 600;
          color: #495057;
          font-size: 0.875rem;
        }

        .category-badge {
          display: inline-block;
          padding: 0.375rem 0.875rem;
          background: linear-gradient(135deg, #e7f3ff 0%, #d3e9ff 100%);
          color: #0066cc;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid rgba(0, 102, 204, 0.1);
        }

        .department-text {
          color: #495057;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .region-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.875rem;
          background: linear-gradient(135deg, #fff7e6 0%, #ffe9b3 100%);
          color: #b37700;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid rgba(179, 119, 0, 0.1);
        }

        .budget-amount {
          color: #1a202c;
          font-size: 0.9375rem;
        }

        .remaining-amount {
          font-size: 0.9375rem;
        }

        .utilization-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .progress-container {
          flex: 1;
          height: 10px;
          background: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar-modern {
          height: 100%;
          border-radius: 10px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .progress-success {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .progress-warning {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
        }

        .progress-danger {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
          animation: pulse-danger 2s ease-in-out infinite;
        }

        @keyframes pulse-danger {
          0%, 100% {
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
          }
        }

        .progress-bar-modern::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .utilization-percent {
          font-size: 0.8125rem;
          font-weight: 700;
          min-width: 45px;
          text-align: right;
        }

        .period-text {
          color: #718096;
          font-size: 0.875rem;
          font-weight: 500;
        }

        :global(.action-button) {
          border-radius: 10px !important;
          padding: 0.5rem 1rem !important;
          font-weight: 600 !important;
          font-size: 0.8125rem !important;
          transition: all 0.2s ease !important;
          border: none !important;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2) !important;
        }

        :global(.action-button):hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3) !important;
        }

        /* ===== Request Modal Styles ===== */
        .budget-details-card {
          background: linear-gradient(135deg, #e7f3ff 0%, #d3e9ff 100%);
          border-radius: 16px;
          padding: 1.5rem;
          border-left: 4px solid #0066cc;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
        }

        .details-title {
          font-weight: 700;
          color: #1a202c;
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .detail-item {
          padding: 0;
        }

        .detail-label {
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .detail-value {
          font-size: 0.9375rem;
          color: #1a202c;
          font-weight: 600;
          margin: 0;
        }

        .detail-value-amount {
          font-size: 1.125rem;
          color: #10b981;
          font-weight: 700;
          margin: 0;
        }

        .request-form-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .form-label-custom {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.75rem;
          display: block;
        }

        .optional-label {
          color: #718096;
          font-weight: 400;
          font-size: 0.875rem;
        }

        .input-group-custom {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 1rem;
          z-index: 10;
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-control-custom {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          background: #f8f9fa;
          transition: all 0.2s ease;
        }

        .form-control-custom:focus {
          outline: none;
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .form-control-custom:disabled {
          background: #e9ecef;
          cursor: not-allowed;
        }

        .textarea-custom {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.9375rem;
          color: #1a202c;
          background: #f8f9fa;
          transition: all 0.2s ease;
          resize: vertical;
        }

        .textarea-custom:focus {
          outline: none;
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .textarea-custom:disabled {
          background: #e9ecef;
          cursor: not-allowed;
        }

        .form-hint {
          font-size: 0.8125rem;
          color: #718096;
          margin-top: 0.5rem;
          margin-bottom: 0;
        }

        .modern-modal-footer {
          padding: 1rem 2rem 1.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        :global(.cancel-button) {
          border-radius: 12px !important;
          padding: 0.625rem 1.5rem !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
          border: 2px solid #e9ecef !important;
          background: white !important;
          color: #495057 !important;
        }

        :global(.cancel-button):hover {
          background: #f8f9fa !important;
          border-color: #dee2e6 !important;
          transform: translateY(-1px);
        }

        :global(.submit-button) {
          border-radius: 12px !important;
          padding: 0.625rem 1.5rem !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
          border: none !important;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
        }

        :global(.submit-button):hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
        }

        :global(.submit-button):disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ===== Animations ===== */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.stat-card) {
          animation: fadeIn 0.5s ease-out forwards;
        }

        :global(.stat-card:nth-child(1)) {
          animation-delay: 0.1s;
        }

        :global(.stat-card:nth-child(2)) {
          animation-delay: 0.2s;
        }

        :global(.stat-card:nth-child(3)) {
          animation-delay: 0.3s;
        }

        :global(.stat-card:nth-child(4)) {
          animation-delay: 0.4s;
        }

        /* ===== Responsive Design ===== */
        @media (max-width: 768px) {
          .modern-modal-header .modal-title {
            font-size: 1.25rem;
          }

          .stat-value {
            font-size: 1.25rem;
          }

          :global(.modern-table thead th),
          :global(.modern-table tbody td) {
            padding: 0.75rem 0.5rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </>
  );
};

export default BudgetOverviewHOD;
