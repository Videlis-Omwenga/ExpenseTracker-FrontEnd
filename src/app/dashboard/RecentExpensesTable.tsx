"use client";

import { useState, Fragment } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Table, Badge } from "react-bootstrap";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";

interface ExpenseStep {
  id: number;
  order: number;
  isOptional: boolean;
  status: string;
  comments: string | null;
  role: {
    name: string;
  } | null;
  approver: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  workflowStepId: number;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  pendingApprovalSteps?: ExpenseStep[];
}

interface RecentExpensesTableProps {
  expenses: Expense[];
}

export default function RecentExpensesTable({
  expenses,
}: RecentExpensesTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(
    expenses[0]?.id || null
  );

  const toggleRow = (expenseId: number) => {
    setExpandedRow((prev) => (prev === expenseId ? null : expenseId));
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        No recent expenses found
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <Table hover className="mb-0">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Category</th>
            <th>Department</th>
            <th className="text-end">Amount</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <Fragment key={exp.id}>
              <tr
                onClick={() => toggleRow(exp.id)}
                style={{ cursor: "pointer" }}
                className={expandedRow === exp.id ? "table-active" : ""}
              >
                <td className="fw-bold">
                  <div className="d-flex align-items-center">
                    {expandedRow === exp.id ? (
                      <ChevronDown size={16} className="me-1" />
                    ) : (
                      <ChevronRight size={16} className="me-1" />
                    )}
                    #{exp.id}
                  </div>
                </td>
                <td>
                  <div className="text-truncate" style={{ maxWidth: "200px" }}>
                    {exp.description}
                  </div>
                </td>
                <td>
                  {exp.category?.name || <span className="text-muted">-</span>}
                </td>
                <td>
                  {exp.department?.name || (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="text-end fw-bold">
                  {exp.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  <Badge
                    bg={
                      exp.status === "APPROVED"
                        ? "success"
                        : exp.status === "REJECTED"
                        ? "danger"
                        : exp.status === "PENDING"
                        ? "warning"
                        : "secondary"
                    }
                    className="d-inline-flex align-items-center"
                  >
                    {exp.status === "APPROVED" ? (
                      <CheckCircle size={14} className="me-1" />
                    ) : exp.status === "REJECTED" ? (
                      <XCircle size={14} className="me-1" />
                    ) : (
                      <Clock size={14} className="me-1" />
                    )}
                    {exp.status}
                  </Badge>
                </td>
                <td>
                  <DateTimeDisplay date={exp.createdAt} />
                </td>
                <td>
                  <DateTimeDisplay
                    date={exp.updatedAt}
                    isHighlighted={exp.updatedAt !== exp.createdAt}
                  />
                </td>
              </tr>
              {exp.pendingApprovalSteps &&
                exp.pendingApprovalSteps.length > 0 &&
                expandedRow === exp.id && (
                  <tr className="bg-light">
                    <td colSpan={8} className="p-0">
                      <div className="p-3 bg-success shadow-sm bg-opacity-10 border-0 border-3 border-start border-success">
                        <p className="mb-3 text-muted">
                          Shows only pending approval steps
                        </p>
                        <Table size="sm" className="mb-2">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Role</th>
                              <th>Approver</th>
                              <th>Status</th>
                              <th>Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exp.pendingApprovalSteps.map((step) => (
                              <tr key={step.id}>
                                <td>{step.order}</td>
                                <td>{step.role?.name || "N/A"}</td>
                                <td>
                                  {step.approver
                                    ? `${step.approver.firstName} ${step.approver.lastName} (${step.approver.email})`
                                    : "-"}
                                </td>
                                <td>
                                  <Badge
                                    bg={
                                      step.status === "APPROVED"
                                        ? "success"
                                        : step.status === "REJECTED"
                                        ? "danger"
                                        : step.status === "PENDING"
                                        ? "warning"
                                        : "secondary"
                                    }
                                  >
                                    {step.status}
                                  </Badge>
                                  {step.isOptional && (
                                    <Badge bg="info" className="ms-1">
                                      Optional
                                    </Badge>
                                  )}
                                </td>
                                <td>{step.comments || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </td>
                  </tr>
                )}
            </Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
