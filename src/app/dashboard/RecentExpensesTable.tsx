"use client";

import { useState, Fragment, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  Tag,
  Building,
  User,
  RotateCcw,
} from "lucide-react";
import {
  Table,
  Badge,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Pagination,
  Card,
} from "react-bootstrap";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";
import { Cash } from "react-bootstrap-icons";

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

type SortField =
  | "id"
  | "description"
  | "amount"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "category"
  | "department";
type SortDirection = "asc" | "desc";

interface FilterState {
  search: string;
  status: string;
  category: string;
  department: string;
  dateRange: string;
}

const STATUS_COLORS = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  DRAFT: "secondary",
  PROCESSING: "info",
} as const;

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

export default function RecentExpensesTable({
  expenses,
}: RecentExpensesTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    category: "",
    department: "",
    dateRange: "",
  });

  const toggleRow = (expenseId: number) => {
    setExpandedRow((prev) => (prev === expenseId ? null : expenseId));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      category: "",
      department: "",
      dateRange: "",
    });
    setCurrentPage(1);
  };

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter((expense) => {
      // Search filter - search in ID and description
      const matchesSearch =
        !filters.search.trim() ||
        expense.description
          .toLowerCase()
          .includes(filters.search.toLowerCase().trim()) ||
        expense.id.toString().includes(filters.search.trim());

      // Status filter - exact match
      const matchesStatus =
        !filters.status || expense.status === filters.status;

      // Category filter - partial match
      const matchesCategory =
        !filters.category ||
        (expense.category?.name &&
          expense.category.name
            .toLowerCase()
            .includes(filters.category.toLowerCase()));

      // Department filter - partial match
      const matchesDepartment =
        !filters.department ||
        (expense.department?.name &&
          expense.department.name
            .toLowerCase()
            .includes(filters.department.toLowerCase()));

      return (
        matchesSearch && matchesStatus && matchesCategory && matchesDepartment
      );
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "category":
          aValue = a.category?.name || "";
          bValue = b.category?.name || "";
          break;
        case "department":
          aValue = a.department?.name || "";
          bValue = b.department?.name || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [expenses, filters, sortField, sortDirection]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedExpenses.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredAndSortedExpenses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);

  // Auto-expand first row when filtered data changes
  useEffect(() => {
    if (paginatedExpenses.length > 0 && !expandedRow) {
      setExpandedRow(paginatedExpenses[0].id);
    }
  }, [paginatedExpenses, expandedRow]);

  const uniqueStatuses = [...new Set(expenses.map((e) => e.status))];
  const uniqueCategories = [
    ...new Set(expenses.map((e) => e.category?.name).filter(Boolean)),
  ];
  const uniqueDepartments = [
    ...new Set(expenses.map((e) => e.department?.name).filter(Boolean)),
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown size={14} className="text-muted" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <div className="mb-3" style={{ fontSize: "3rem" }}>
          📋
        </div>
        <h5>No expenses found</h5>
        <p className="text-muted">There are no expense records to display.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Advanced Filters and Search */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange("department", e.target.value)
                }
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={clearFilters}
                  className="flex-grow-1"
                >
                  <RotateCcw size={14} className="me-1" />
                  Reset
                </Button>
              </div>
            </Col>
          </Row>

          {/* Results Summary */}
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <small className="text-muted">
              Showing {paginatedExpenses.length} of{" "}
              {filteredAndSortedExpenses.length} expenses
              {filteredAndSortedExpenses.length !== expenses.length && (
                <span> (filtered from {expenses.length} total)</span>
              )}
            </small>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">Items per page:</small>
              <Form.Select
                size="sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: "auto" }}
              >
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Enhanced Table */}
      <div className="table-responsive">
        <Table hover className="mb-0" style={{ fontSize: "0.9rem" }}>
          <thead className="table-light border-bottom border-2">
            <tr>
              <th style={{ width: "100px" }} className="border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("id")}
                >
                  ID <SortIcon field="id" />
                </Button>
              </th>
              <th className="border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("description")}
                >
                  Description <SortIcon field="description" />
                </Button>
              </th>
              <th className="border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("category")}
                >
                  <Tag size={14} className="me-1" />
                  Category <SortIcon field="category" />
                </Button>
              </th>
              <th className="border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("department")}
                >
                  <Building size={14} className="me-1" />
                  Department <SortIcon field="department" />
                </Button>
              </th>
              <th className="text-end border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("amount")}
                >
                  <DollarSign size={14} className="me-1" />
                  Amount <SortIcon field="amount" />
                </Button>
              </th>
              <th className="border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </Button>
              </th>
              <th className="border-0">
                <Button
                  variant="link"
                  className="text-dark text-decoration-none p-0 fw-semibold"
                  onClick={() => handleSort("createdAt")}
                >
                  <Calendar size={14} className="me-1" />
                  Created <SortIcon field="createdAt" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <div className="text-muted">
                    <Search size={24} className="mb-2" />
                    <div>No expenses match your current filters</div>
                    <small>Try adjusting your search criteria</small>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedExpenses.map((exp, index) => (
                <Fragment key={exp.id}>
                  <tr
                    className={`${
                      expandedRow === exp.id ? "table-active" : ""
                    } ${index % 2 === 0 ? "bg-light bg-opacity-25" : ""}`}
                    style={{
                      cursor: "pointer",
                      borderLeft: `4px solid ${getStatusColor(exp.status)}`,
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => toggleRow(exp.id)}
                  >
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <div className="me-2">
                          {expandedRow === exp.id ? (
                            <ChevronDown size={16} className="text-primary" />
                          ) : (
                            <ChevronRight size={16} className="text-muted" />
                          )}
                        </div>
                        <div className="fw-bold text-primary">#{exp.id}</div>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div>
                        <div
                          className="fw-semibold text-truncate"
                          style={{ maxWidth: "220px" }}
                        >
                          {exp.description}
                        </div>
                        {exp.pendingApprovalSteps &&
                          exp.pendingApprovalSteps.length > 0 && (
                            <small className="text-info">
                              <User size={12} className="me-1" />
                              {exp.pendingApprovalSteps.length} pending step(s)
                            </small>
                          )}
                      </div>
                    </td>
                    <td className="align-middle">
                      {exp.category?.name ? (
                        <Badge bg="light" text="dark" className="border">
                          <Tag size={12} className="me-1" />
                          {exp.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted small">No category</span>
                      )}
                    </td>
                    <td className="align-middle">
                      {exp.department?.name ? (
                        <Badge
                          bg="info"
                          className="bg-opacity-25 text-dark border border-secondary"
                        >
                          <Building size={12} className="me-1" />
                          {exp.department.name}
                        </Badge>
                      ) : (
                        <span className="text-muted small">No department</span>
                      )}
                    </td>
                    <td className="text-end align-middle">
                      <div className="fw-bold text-success">
                        {exp.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="align-middle">
                      <Badge
                        bg={
                          STATUS_COLORS[
                            exp.status as keyof typeof STATUS_COLORS
                          ] || "secondary"
                        }
                        className="d-inline-flex align-items-center px-2 py-1"
                      >
                        {getStatusIcon(exp.status)}
                        <span className="ms-1">{exp.status}</span>
                      </Badge>
                    </td>
                    <td className="align-middle">
                      <DateTimeDisplay date={exp.createdAt} />
                      {exp.updatedAt !== exp.createdAt && (
                        <div className="small text-muted">
                          Updated:{" "}
                          <DateTimeDisplay date={exp.updatedAt} isHighlighted />
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row for Approval Steps */}
                  {exp.pendingApprovalSteps &&
                    exp.pendingApprovalSteps.length > 0 &&
                    expandedRow === exp.id && (
                      <tr>
                        <td colSpan={7} className="p-0 border-0">
                          <div className="bg-light bg-opacity-75 border border-0 border-start border-3 border-info rounded border-end">
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0 text-muted">
                                  <User size={16} className="me-2" />
                                  Approval Workflow Steps
                                </h6>
                                <Badge bg="info">
                                  {exp.pendingApprovalSteps.length} step(s)
                                  pending
                                </Badge>
                              </div>
                              <div className="table-responsive">
                                <Table size="sm" className="mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th style={{ width: "60px" }}>Order</th>
                                      <th>Role</th>
                                      <th>Approver</th>
                                      <th>Status</th>
                                      <th>Comments</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {exp.pendingApprovalSteps.map((step) => (
                                      <tr key={step.id}>
                                        <td>
                                          <Badge
                                            bg="outline-info"
                                            className="rounded-circle px-2"
                                          >
                                            {step.order}
                                          </Badge>
                                        </td>
                                        <td className="fw-semibold">
                                          {step.role?.name || "N/A"}
                                        </td>
                                        <td>
                                          {step.approver ? (
                                            <div>
                                              <div className="fw-semibold">
                                                {step.approver.firstName}{" "}
                                                {step.approver.lastName}
                                              </div>
                                              <small className="text-muted">
                                                {step.approver.email}
                                              </small>
                                            </div>
                                          ) : (
                                            <span className="text-muted">
                                              Not assigned
                                            </span>
                                          )}
                                        </td>
                                        <td>
                                          <div className="d-flex gap-1">
                                            <Badge
                                              bg={
                                                STATUS_COLORS[
                                                  step.status as keyof typeof STATUS_COLORS
                                                ] || "secondary"
                                              }
                                            >
                                              {step.status}
                                            </Badge>
                                            {step.isOptional && (
                                              <Badge
                                                bg="info"
                                                className="small"
                                              >
                                                Optional
                                              </Badge>
                                            )}
                                          </div>
                                        </td>
                                        <td>
                                          {step.comments ? (
                                            <div className="small">
                                              <span className="text-muted">
                                                "
                                              </span>
                                              {step.comments}
                                              <span className="text-muted">
                                                "
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-muted small">
                                              No comments
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </div>
                              <br />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </Fragment>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
          <div className="text-muted small">
            Page {currentPage} of {totalPages}
          </div>
          <Pagination size="sm" className="mb-0">
            <Pagination.First
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            />
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}

            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
            />
            <Pagination.Last
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "#198754";
    case "PENDING":
      return "#ffc107";
    case "REJECTED":
      return "#dc3545";
    case "PROCESSING":
      return "#0dcaf0";
    default:
      return "#6c757d";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "APPROVED":
      return <CheckCircle size={14} />;
    case "REJECTED":
      return <XCircle size={14} />;
    case "PENDING":
    case "PROCESSING":
    default:
      return <Clock size={14} />;
  }
}
