"use client";

import { useState } from "react";
import { Col, Modal, Table, Spinner, Button } from "react-bootstrap";
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

interface ExpenseResponse {
  budgets: Budget[];
  budgetSummary: any;
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
      <Col xs={6} md={3} onClick={handleOpen}>
        <div className="bg-danger p-3 rounded-3 shadow-sm bg-opacity-10 border-start border-warning border-2">
          <div className="d-flex align-items-center">
            <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
              <Eye size={20} className="me-1" />
            </div>
            <div>
              <p className="text-muted small mb-1">Budgets</p>
              <h6 className="mb-1 fw-semibold text-dark">
                View budgets
              </h6>
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
        <Modal.Header className="border-0 pb-0 position-relative">
          <div className="w-100">
            <div className="d-flex align-items-center justify-content-between mb-0">
              <h6
                id="budget-modal-title"
                className="fw-bold text-dark"
              >
                {" "}
                📊 Budget Overview
              </h6>
              <button
                type="button"
                className="btn-close p-1 rounded-circle text-danger"
                onClick={handleClose}
                style={{
                  background: "rgba(0,0,0,0.1)",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-muted mb-0 d-flex align-items-center small">
              <Info size={16} className="me-2" />
              Your departmental budgets overview
            </p>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="position-relative d-inline-block mb-3">
                <Spinner
                  animation="border"
                  variant="primary"
                  className="mb-2"
                />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <BarChart2 size={24} className="text-primary" />
                </div>
              </div>
              <p className="text-muted">📊 Loading budget data...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-5">
              <BarChart2 size={48} className="text-muted mb-3" />
              <h5 className="text-dark">No budgets available</h5>
              <p className="text-muted">
                There are no budgets to display at this time.
              </p>
            </div>
          ) : (
            <div className="table-responsive rounded-3 shadow-sm">
              <Table hover className="mb-0 border">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 fw-semibold text-dark">
                      <Tag size={14} className="me-1" /> ID
                    </th>
                    <th className="py-3 fw-semibold text-dark">Category</th>
                    <th className="py-3 fw-semibold text-dark">Department</th>
                    <th className="py-3 fw-semibold text-dark">
                      <MapPin size={14} className="me-1" /> Region
                    </th>
                    <th className="py-3 fw-semibold text-dark"> Original</th>
                    <th className="py-3 fw-semibold text-dark">
                      <TrendingUp size={14} className="me-1" /> Remaining
                    </th>
                    <th className="py-3 fw-semibold text-dark">
                      <BarChart2 size={14} className="me-1" /> Utilization
                    </th>
                    <th className="pe-4 py-3 fw-semibold text-dark">
                      <Calendar size={14} className="me-1" /> Date
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
                      <tr key={b.id} className="border-bottom">
                        <td className="ps-4 py-3">
                          <Tag size={12} className="me-1" />
                          {b.id}
                        </td>
                        <td className="py-3">
                          <span className="badge bg-light text-dark px-2 py-1 d-inline-flex align-items-center">
                            {b.expenseCategory?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="d-inline-flex align-items-center">
                            {b.department?.name ||
                              `Department ${b.departmentId}`}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-light text-dark px-2 py-1 d-inline-flex align-items-center">
                            <MapPin size={12} className="me-1" />
                            {b.region?.name || `Region ${b.regionId}`}
                          </span>
                        </td>
                        <td className="py-3 fw-semibold">
                          <span className="d-inline-flex align-items-center">
                            {b.originalBudget.toLocaleString()}
                          </span>
                        </td>
                        <td
                          className={`py-3 fw-semibold ${
                            isCritical
                              ? "text-danger"
                              : isWarning
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          <div className="d-flex align-items-center">
                            {isCritical ? (
                              <>
                                <AlertTriangle size={16} className="me-1" />
                              </>
                            ) : isWarning ? (
                              <>
                                <AlertTriangle size={16} className="me-1" />
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="me-1" />
                              </>
                            )}
                            <span className="ms-1">
                              {b.remainingBudget.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1 me-3">
                              <div
                                className="progress"
                                style={{
                                  height: "8px",
                                  borderRadius: "4px",
                                  backgroundColor: "#f0f0f0",
                                }}
                              >
                                <div
                                  className={`progress-bar ${
                                    isCritical
                                      ? "bg-danger"
                                      : isWarning
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                  role="progressbar"
                                  style={{
                                    width: `${utilizationPercentage}%`,
                                    borderRadius: "4px",
                                    transition:
                                      "width 0.6s ease, background-color 0.3s ease",
                                    boxShadow: isCritical
                                      ? "0 0 8px rgba(220, 53, 69, 0.4)"
                                      : "none",
                                  }}
                                  aria-valuenow={utilizationPercentage}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                            </div>
                            <div
                              className={`fw-semibold small ${
                                isCritical
                                  ? "text-danger"
                                  : isWarning
                                  ? "text-warning"
                                  : "text-success"
                              }`}
                              style={{ minWidth: "40px" }}
                            >
                              {Math.round(utilizationPercentage)}%
                            </div>
                          </div>
                        </td>
                        <td className="pe-4 py-3">
                          <span className="text-muted">{b.monthYear}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
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
        @keyframes blink {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 1;
          }
        }
        .blinking {
          animation: blink 1.5s infinite;
        }
        .progress-bar {
          position: relative;
          overflow: visible;
        }
        .progress-bar::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 4px;
        }
        .bg-danger::after {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0.2) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
      <style jsx>{`
        .budget-overview-modal .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .budget-overview-modal .modal-header {
          padding: 1.5rem 1.5rem 0;
        }

        .budget-overview-modal .modal-body {
          padding: 1rem 1.5rem;
        }

        .budget-overview-modal .modal-footer {
          padding: 0 1.5rem 1.5rem;
        }

        .budget-overview-modal .table th {
          border-top: none;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .budget-overview-modal .table td {
          vertical-align: middle;
          border-color: #f1f1f1;
        }

        .budget-overview-modal .table tr:last-child {
          border-bottom: none;
        }
      `}</style>
    </>
  );
};

export default BudgetOverview;
