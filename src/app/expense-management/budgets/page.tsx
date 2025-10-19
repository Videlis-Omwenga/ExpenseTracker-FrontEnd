"use client";

import { useState, useMemo } from "react";
import { Col, Modal, Table, Spinner, Button, Row, Card } from "react-bootstrap";
import {
  BarChart2,
  X,
  TrendingUp,
  Info,
  Tag,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  DollarSign,
  TrendingDown,
  Percent,
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

const BudgetOverview = () => {
  const [show, setShow] = useState(false);
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
      <Col xs={6} md={2} onClick={handleOpen} style={{ cursor: 'pointer' }}>
        <div className="budget-activator-card position-relative overflow-hidden">
          <div className="gradient-overlay"></div>
          <div className="card-content position-relative">
            <div className="d-flex align-items-center">
              <div className="icon-wrapper">
                <Eye size={24} />
              </div>
              <div className="ms-3">
                <p className="label mb-1">Budget</p>
                <h6 className="title mb-0">Overview</h6>
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
                      Track and manage your departmental budgets
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
                    <th className="pe-4">
                      <div className="d-flex align-items-center">
                        <Calendar size={14} className="me-2" />
                        <span>Period</span>
                      </div>
                    </th>
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
                        <td className="pe-4">
                          <span className="period-text">{b.monthYear}</span>
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

        <Modal.Footer className="border-0 pt-0">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Showing {budgets.length} budget{budgets.length !== 1 ? "s" : ""}
            </span>
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Close budgets
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        /* ===== Activator Card Styles ===== */
        .budget-activator-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
        }

        .budget-activator-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .budget-activator-card .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 100%
          );
          border-radius: 16px;
          pointer-events: none;
        }

        .budget-activator-card .icon-wrapper {
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

        .budget-activator-card:hover .icon-wrapper {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .budget-activator-card .label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .budget-activator-card .title {
          color: white;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        /* ===== Modal Styles ===== */
        :global(.budget-overview-modal .modal-content) {
          border-radius: 20px;
          border: none;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        :global(.budget-overview-modal .modal-header) {
          padding: 2rem 2rem 1rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }

        :global(.budget-overview-modal .modal-body) {
          padding: 1.5rem 2rem 2rem;
          background: #fafbfc;
        }

        :global(.budget-overview-modal .modal-footer) {
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
        .stat-card {
          background: white;
          border-radius: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
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

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card-blue::before {
          color: #0d6efd;
        }

        .stat-card-green::before {
          color: #198754;
        }

        .stat-card-orange::before {
          color: #ffc107;
        }

        .stat-card-red::before {
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

        .stat-card:hover .stat-icon-wrapper {
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

        /* ===== Loading State ===== */
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

        /* ===== Empty State ===== */
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
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
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

export default BudgetOverview;
