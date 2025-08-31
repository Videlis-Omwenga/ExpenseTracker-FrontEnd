"use client";

import { useEffect, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Form,
  InputGroup,
  Badge,
  Pagination,
  Card,
  ProgressBar,
} from "react-bootstrap";
import {
  PlusCircle,
  PencilSquare,
  Trash,
  Search,
  BarChart,
  Filter,
  Calendar,
  Tag,
  Wallet,
  Layers,
  Building,
  CheckCircle,
} from "react-bootstrap-icons";
import AuthProvider from "../authPages/tokenData";
import TopNavbar from "../components/Navbar";
import { BASE_API_URL } from "../static/apiConfig";
import { toast } from "react-toastify";
import BudgetModalPage from "../components/modals/budget-creation-modal";
import { Plus } from "lucide-react";

interface Budget {
  id: number;
  createdAt: string;
  updatedAt: string;
  originalBudget: number;
  remainingBudget: number;
  departmentId: number;
  description: string;
  expenseCategory: ExpenseCategory;
  department: Department;
  status: "Active" | "Expired" | "Upcoming";
}

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function BudgetsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_API_URL}/budgets/get-budgets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setBudgets(data.budgets);
        setDepartments(data.getDepartments);
        setCategories(data.getExpenseCategories);
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch budgets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "create" | "upload" | "move" | null
  >(null);
  const [currentTime, setCurrentTime] = useState("");

  const handleClose = () => {
    setShowModal(false);
    setModalType(null);
  };

  const handleShow = (type: "create" | "upload" | "move") => {
    setModalType(type);
    setShowModal(true);
  };

  // Update time on client-side only
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const updateTime = () => {
        setCurrentTime(new Date().toLocaleTimeString());
      };

      // Set initial time
      updateTime();

      // Update every minute
      const timer = setInterval(updateTime, 60000);

      // Cleanup
      return () => clearInterval(timer);
    }
  }, []);

  // Calculate total remaining balance
  const totalBalance = budgets.reduce(
    (sum, budget) => sum + budget.remainingBudget,
    0
  );

  return (
    <AuthProvider>
      <TopNavbar />
      <Container
        fluid
        className="p-4 min-vh-100"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        {/* Page Header */}
        <Row className="align-items-center mb-4">
          <Col>
            <div className="d-flex align-items-center p-2">
              <div className="bg-primary bg-opacity-10 p-3 rounded-4 me-3">
                <BarChart size={28} className="text-primary" />
              </div>
              <div>
                <h5 className="fw-bold mb-1 text-dark">Budgets Dashboard</h5>
                <div className="d-flex align-items-center">
                  <div className="d-flex align-items-center me-3">
                    <Tag size={16} className="me-2 text-muted" />
                    <span className="text-muted small">
                      {budgets.length} active budgets
                    </span>
                  </div>
                  <div className="vr mx-2"></div>
                  <div className="d-flex align-items-center">
                    <Calendar size={14} className="me-2 text-muted" />
                    <span className="text-muted small">
                      Last updated: {currentTime || "--:--:--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
          <Col className="text-end">
            <BudgetModalPage
              categories={categories}
              departments={departments}
              onBudgetCreated={fetchBudgets}
            />
          </Col>
        </Row>
        {/* Summary Cards */}
        <Row className="mb-4 g-3">
          {/* Total Budgets Card */}
          <Col md={3}>
            <Card
              className="border-0 rounded-4 h-100 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f6f8ff 0%, #f1f4ff 100%)",
                borderLeft: "4px solid #4361ee",
                transition: "transform 0.3s",
                cursor: "pointer",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6
                      className="text-muted mb-2"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Total Budgets
                    </h6>
                    <h3 className="fw-bold mb-0" style={{ color: "#1a237e" }}>
                      {budgets.length}
                    </h3>
                  </div>
                  <div
                    className="bg-primary bg-opacity-10 p-3 rounded-circle"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <Layers size={24} className="text-primary" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Total Balance Card */}
          <Col md={3}>
            <Card
              className="border-0 rounded-4 h-100 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #e6f7ee 0%, #d1f2e5 100%)",
                borderLeft: "4px solid #10b581",
                transition: "transform 0.3s",
                cursor: "pointer",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6
                      className="text-muted mb-2"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Total Balance
                    </h6>
                    <h3 className="fw-bold mb-0" style={{ color: "#0d5c42" }}>
                      ${totalBalance.toLocaleString()}
                    </h3>
                  </div>
                  <div
                    className="bg-success bg-opacity-10 p-3 rounded-circle"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <Wallet size={24} className="text-success" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {/* Departments Card */}
          <Col md={3}>
            <Card
              className="border-0 rounded-4 h-100 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                borderLeft: "4px solid #4f46e5",
                transition: "transform 0.3s",
                cursor: "pointer",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6
                      className="text-muted mb-2"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Departments
                    </h6>
                    <h3 className="fw-bold mb-0" style={{ color: "#3730a3" }}>
                      {new Set(budgets.map((b) => b.departmentId)).size}
                    </h3>
                  </div>
                  <div
                    className="bg-indigo-100 p-3 rounded-circle"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <Building size={24} className="text-indigo-600" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Active Budgets Card */}
          <Col md={3}>
            <Card
              className="border-0 rounded-4 h-100 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #fef6e6 0%, #fff1db 100%)",
                borderLeft: "4px solid #f59e0b",
                transition: "transform 0.3s",
                cursor: "pointer",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6
                      className="text-muted mb-2"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Active Budgets
                    </h6>
                    <h3 className="fw-bold mb-0" style={{ color: "#92400e" }}>
                      {budgets.filter((b) => b.status === "Active").length}
                    </h3>
                  </div>
                  <div
                    className="bg-amber-100 p-3 rounded-circle"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <CheckCircle size={24} className="text-amber-600" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search + Filter */}
        <Card className="border-0 shadow-sm rounded-4 mb-4">
          <Card.Body className="p-3">
            <Row className="g-2">
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-0">
                    <Search className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search budgets..."
                    className="border-0 bg-light"
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-0">
                    <Filter className="text-muted" />
                  </InputGroup.Text>
                  <Form.Select className="border-0 bg-light">
                    <option>All Departments</option>
                    <option>Finance</option>
                    <option>IT</option>
                    <option>HR</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-0">
                    <Calendar className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control type="month" className="border-0 bg-light" />
                </InputGroup>
              </Col>
              <Col md={1} className="text-end">
                <Button
                  variant="outline-primary"
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <BarChart size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Budget Table */}
        <Card className="border-0 shadow-sm rounded-4 small">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 ps-4">Period</th>
                    <th className="border-0">Initial Amount</th>
                    <th className="border-0">Balance</th>
                    <th className="border-0">Usage</th>
                    <th className="border-0">Category</th>
                    <th className="border-0">Department</th>
                    <th className="border-0">Description</th>
                    <th
                      className="border-0 text-end pe-4"
                      style={{ width: "100px" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-5">
                        <div className="py-4">
                          <BarChart size={48} className="text-muted mb-2" />
                          <h5>No budgets available</h5>
                          <p className="text-muted">
                            Create a new budget to get started
                          </p>
                          <Button
                            variant="primary"
                            className="rounded-pill mt-2"
                            onClick={() => handleShow("create")}
                          >
                            <PlusCircle className="me-2" /> Create Budget
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    budgets.map((budget) => {
                      const usagePercentage = Math.round(
                        (1 - budget.remainingBudget / budget.originalBudget) *
                          100
                      );
                      return (
                        <tr key={budget.id} className="border-top">
                          <td className="ps-4">
                            <div className="fw-semibold text-dark">
                              {new Date().toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-muted small">
                              {new Date(
                                new Date().getFullYear(),
                                new Date().getMonth(),
                                1
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              to{" "}
                              {new Date(
                                new Date().getFullYear(),
                                new Date().getMonth() + 1,
                                0
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </td>
                          <td>
                            <span className="fw-semibold text-dark">
                              ${budget.originalBudget.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`fw-semibold ${
                                budget.remainingBudget <
                                budget.originalBudget * 0.2
                                  ? "text-danger"
                                  : budget.remainingBudget <
                                    budget.originalBudget * 0.5
                                  ? "text-warning"
                                  : "text-success"
                              }`}
                            >
                              ${budget.remainingBudget.toLocaleString()}
                            </span>
                          </td>
                          <td style={{ width: "200px" }}>
                            <div className="d-flex align-items-center">
                              <ProgressBar
                                className="flex-grow-1 me-2"
                                now={usagePercentage}
                                variant={
                                  usagePercentage > 80
                                    ? "danger"
                                    : usagePercentage > 50
                                    ? "warning"
                                    : "success"
                                }
                                style={{ height: "8px" }}
                              />
                              <span className="text-muted">
                                {usagePercentage}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <Badge
                              text="primary"
                              className="px-2 py-1 rounded-pill bg-primary bg-opacity-10"
                            >
                              {budget.expenseCategory?.name || "N/A"}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              text="danger"
                              className="px-2 py-1 rounded-pill bg-danger bg-opacity-10"
                            >
                              {budget.department?.name || "N/A"}
                            </Badge>
                          </td>
                          <td>
                            <span
                              className="text-truncate d-inline-block"
                              style={{ maxWidth: "200px" }}
                            >
                              {budget.description ||
                                "No description found for this budget"}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex d-wrap align-items-center">
                              <Button
                                variant="outline-light"
                                size="sm"
                                className="me-1 rounded-circle text-success border"
                                style={{ width: "32px", height: "32px" }}
                                title="Add Budget"
                              >
                                <Plus size={14} />
                              </Button>
                              <Button
                                variant="outline-light"
                                size="sm"
                                className="me-1 rounded-circle text-primary border"
                                style={{ width: "32px", height: "32px" }}
                                title="Edit Budget"
                              >
                                <PencilSquare size={14} />
                              </Button>
                              <Button
                                variant="outline-light"
                                size="sm"
                                className="rounded-circle text-danger border"
                                style={{ width: "32px", height: "32px" }}
                                title="Delete Budget"
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Pagination */}
        {budgets.length > 0 && (
          <Row className="mt-4">
            <Col className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing 1 to {budgets.length} of {budgets.length} entries
              </div>
              <Pagination className="mb-0 rounded-2">
                <Pagination.Prev className="border-0 rounded-start">
                  Previous
                </Pagination.Prev>
                <Pagination.Item active className="border-0">
                  1
                </Pagination.Item>
                <Pagination.Item className="border-0">2</Pagination.Item>
                <Pagination.Item className="border-0">3</Pagination.Item>
                <Pagination.Next className="border-0 rounded-end">
                  Next
                </Pagination.Next>
              </Pagination>
            </Col>
          </Row>
        )}
      </Container>

      <style jsx global>{`
        .bg-success-light {
          background-color: rgba(25, 135, 84, 0.15) !important;
        }
        .bg-info-light {
          background-color: rgba(13, 202, 240, 0.15) !important;
        }
        .bg-primary-light {
          background-color: rgba(13, 110, 253, 0.15) !important;
        }
        .border-dashed {
          border: 2px dashed #dee2e6 !important;
        }
        .progress-bar {
          border-radius: 4px;
        }
      `}</style>
    </AuthProvider>
  );
}
