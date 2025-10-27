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
  hierarchyName?: string | null;
  nextApprovers?: {
    firstName: string;
    lastName: string;
    email: string;
  }[];
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
    const filtered = expenses.filter((expense) => {
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
      let aValue: string | number;
      let bValue: string | number;

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
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
            <Search size={48} className="text-muted" />
          </div>
          <h5 className="text-dark mb-2">No expenses found</h5>
          <p className="text-muted mb-0">
            There are no expense records to display.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Advanced Filters and Search */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="mb-3">
            <h6 className="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
              <Search size={18} className="text-primary" />
              Search & Filter
            </h6>
          </div>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <Search size={16} className="text-primary" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="border-start-0 ps-0"
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="form-select-sm"
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
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="form-select-sm"
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
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange("department", e.target.value)
                }
                className="form-select-sm"
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
              <Button
                variant="outline-primary"
                onClick={clearFilters}
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <RotateCcw size={16} />
                Reset Filters
              </Button>
            </Col>
          </Row>

          {/* Results Summary */}
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <div className="text-muted small">
              Showing{" "}
              <span className="fw-semibold text-dark">
                {paginatedExpenses.length}
              </span>{" "}
              of{" "}
              <span className="fw-semibold text-dark">
                {filteredAndSortedExpenses.length}
              </span>{" "}
              expenses
              {filteredAndSortedExpenses.length !== expenses.length && (
                <span className="text-primary">
                  {" "}
                  (filtered from {expenses.length} total)
                </span>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted fw-medium">Rows per page:</small>
              <Form.Select
                size="sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: "70px" }}
                className="border"
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
      <Card className="border-0 shadow-sm">
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr className="border-bottom">
                <th style={{ width: "80px" }} className="py-3 ps-4 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
                    onClick={() => handleSort("id")}
                  >
                    ID <SortIcon field="id" />
                  </Button>
                </th>
                <th className="py-3 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
                    onClick={() => handleSort("description")}
                  >
                    Description <SortIcon field="description" />
                  </Button>
                </th>
                <th className="py-3 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
                    onClick={() => handleSort("category")}
                  >
                    <Tag size={14} className="me-1" />
                    Category <SortIcon field="category" />
                  </Button>
                </th>
                <th className="py-3 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
                    onClick={() => handleSort("department")}
                  >
                    <Building size={14} className="me-1" />
                    Department <SortIcon field="department" />
                  </Button>
                </th>
                <th className="text-end py-3 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
                    onClick={() => handleSort("amount")}
                  >
                    <DollarSign size={14} className="me-1" />
                    Amount <SortIcon field="amount" />
                  </Button>
                </th>
                <th className="py-3 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
                    onClick={() => handleSort("status")}
                  >
                    Status <SortIcon field="status" />
                  </Button>
                </th>
                <th className="py-3 pe-4 border-0">
                  <Button
                    variant="link"
                    className="text-dark text-decoration-none p-0 fw-bold"
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
                  <td colSpan={7} className="text-center py-5">
                    <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                      <Search size={32} className="text-muted" />
                    </div>
                    <div className="text-dark fw-medium mb-1">
                      No expenses match your filters
                    </div>
                    <small className="text-muted">
                      Try adjusting your search criteria
                    </small>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <Fragment key={exp.id}>
                    <tr
                      className={`${
                        expandedRow === exp.id ? "bg-primary bg-opacity-10" : ""
                      }`}
                      style={{
                        cursor: "pointer",
                        borderLeft: `3px solid ${getStatusColor(exp.status)}`,
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => toggleRow(exp.id)}
                    >
                      <td className="align-middle ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="text-muted">
                            {expandedRow === exp.id ? (
                              <ChevronDown size={18} className="text-primary" />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </div>
                          <div className="fw-bold text-primary">#{exp.id}</div>
                        </div>
                      </td>
                      <td className="align-middle py-3">
                        <div>
                          <div
                            className="fw-medium text-dark text-truncate"
                            style={{ maxWidth: "250px" }}
                          >
                            {exp.description}
                          </div>
                          {exp.pendingApprovalSteps &&
                            exp.pendingApprovalSteps.length > 0 && (
                              <small className="text-warning d-flex align-items-center gap-1 mt-1">
                                <Clock size={12} />
                                {exp.pendingApprovalSteps.length} pending
                                approval(s)
                              </small>
                            )}
                        </div>
                      </td>
                      <td className="align-middle py-3">
                        {exp.category?.name ? (
                          <Badge
                            bg="light"
                            text="dark"
                            className="bg-opacity-10 border px-2 py-1 fw-normal border-0 border-bottom border-success"
                          >
                            <Tag size={12} className="me-1" />
                            {exp.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted small fst-italic">
                            No category
                          </span>
                        )}
                      </td>
                      <td className="align-middle py-3">
                        {exp.department?.name ? (
                          <Badge
                            bg="light"
                            text="dark"
                            className="bg-opacity-10 border px-2 py-1 fw-normal border-0 border-bottom border-info"
                          >
                            <Building size={12} className="me-1" />
                            {exp.department.name}
                          </Badge>
                        ) : (
                          <span className="text-muted small fst-italic">
                            No department
                          </span>
                        )}
                      </td>
                      <td className="text-end align-middle py-3">
                        <div className="fw-bold text-success fs-6">
                          {exp.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </td>
                      <td className="align-middle py-3">
                        <Badge
                          bg={
                            STATUS_COLORS[
                              exp.status as keyof typeof STATUS_COLORS
                            ] || "secondary"
                          }
                          className="d-inline-flex align-items-center gap-1 px-3 py-2"
                        >
                          {getStatusIcon(exp.status)}
                          <span>{exp.status}</span>
                        </Badge>
                      </td>
                      <td className="align-middle py-3 pe-4">
                        <div className="text-dark small">
                          <DateTimeDisplay date={exp.createdAt} />
                        </div>
                        {exp.updatedAt !== exp.createdAt && (
                          <div className="small text-muted">
                            Updated:{" "}
                            <DateTimeDisplay
                              date={exp.updatedAt}
                              isHighlighted
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <Card className="border-0 shadow-sm mt-4">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Page{" "}
                <span className="fw-semibold text-dark">{currentPage}</span> of{" "}
                <span className="fw-semibold text-dark">{totalPages}</span>
              </div>
              <Pagination className="mb-0">
                <Pagination.First
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                />
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
          </Card.Body>
        </Card>
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
