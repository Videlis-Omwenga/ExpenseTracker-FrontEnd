"use client";

import { useEffect, useState } from "react";
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
  Modal,
} from "react-bootstrap";
import {
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
  InfoCircle,
  XCircle,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import BudgetModalPage from "@/app/components/modals/budget-creation-modal";
import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import { BASE_API_URL } from "@/app/static/apiConfig";
import PageLoader from "@/app/components/PageLoader";
import { FaInfoCircle } from "react-icons/fa";

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
  addedVia: string;
  amountAdd: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submiting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<number | "all">("all");
  const [monthFilter, setMonthFilter] = useState("");

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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to fetch budgets";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateTime = () => {
        setCurrentTime(new Date().toLocaleTimeString());
      };
      updateTime();
      const timer = setInterval(updateTime, 60000);
      return () => clearInterval(timer);
    }
  }, []);

  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetComments, setBudgetComments] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const selectedBudgetData = budgets.find(
    (budget) => budget.id === selectedBudgetId
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const openAddModal = (id: number) => {
    setSelectedBudgetId(id);
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  const handleAddBudgetAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      amount: Number(budgetAmount),
      comments: budgetComments,
    };
    try {
      const res = await fetch(
        `${BASE_API_URL}/budgets/add-budget/${selectedBudgetId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Budget amount added successfully");
        setShowAddModal(false);
        setBudgetAmount("");
        setBudgetComments("");
        setSelectedBudgetId(null);
        await fetchBudgets();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter budgets based on search and filters
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = searchQuery === "" ||
      budget.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.expenseCategory?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.id.toString().includes(searchQuery);

    const matchesDepartment = departmentFilter === "all" || budget.departmentId === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const totalBalance = filteredBudgets.reduce((sum, b) => sum + (b.remainingBudget || 0), 0);

  if (isLoading) return <PageLoader />;

  return (
    <AuthProvider>
      <TopNavbar />
      <Container
        fluid
        className="p-4 min-vh-100"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        {/* Modern Page Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                  <Wallet className="text-primary" size={28} />
                </div>
                <div>
                  <h2 className="fw-bold text-dark mb-0">
                    Budget Management
                  </h2>
                  <p className="text-muted mb-0 small">
                    Monitor and manage department budgets
                  </p>
                </div>
              </div>
            </div>
            <BudgetModalPage
              categories={categories}
              departments={departments}
              onBudgetCreated={fetchBudgets}
            />
          </div>
          <hr className="border-2 border-primary opacity-25 mb-4" />
        </div>
        {/* Summary Cards */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-4">
                <Row className="g-4">
                  {/* Total Budgets Card */}
                  <Col md={3}>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 shadow-sm border-start border-primary border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                          <Layers size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Total Budgets</p>
                          <h6 className="mb-0 fw-bold">{filteredBudgets.length}</h6>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Total Balance Card */}
                  <Col md={3}>
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 shadow-sm border-start border-success border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                          <Wallet size={20} className="text-success" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Total Balance</p>
                          <h6 className="mb-0 fw-bold">{totalBalance.toLocaleString()}</h6>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Departments Card */}
                  <Col md={3}>
                    <div className="bg-info bg-opacity-10 p-3 rounded-3 shadow-sm border-start border-info border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                          <Building size={20} className="text-info" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Departments</p>
                          <h6 className="mb-0 fw-bold">{new Set(filteredBudgets.map((b) => b.departmentId)).size}</h6>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Active Budgets Card */}
                  <Col md={3}>
                    <div className="bg-warning bg-opacity-10 p-3 rounded-3 shadow-sm border-start border-warning border-2">
                      <div className="d-flex align-items-center">
                        <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                          <CheckCircle size={20} className="text-warning" />
                        </div>
                        <div>
                          <p className="text-muted small mb-1">Active Budgets</p>
                          <h6 className="mb-0 fw-bold">{filteredBudgets.filter((b) => b.status === "Active").length}</h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search + Filter */}
        <Card className="border-0 shadow-sm rounded-3 mb-4">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-0">
                    <Filter className="text-muted" />
                  </InputGroup.Text>
                  <Form.Select
                    className="border-0 bg-light"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-0">
                    <Calendar className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="month"
                    className="border-0 bg-light"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                  />
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
        <Card className="border-0 shadow-sm rounded-3">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light border-0">
                  <tr>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">ID</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Period</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Initial Amount</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Balance</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Usage</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Category</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Department</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Description</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Added Via</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Amount adjusted</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgets.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center text-muted py-5">
                        <div className="py-4">
                          <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                            <Wallet size={48} className="text-primary" />
                          </div>
                          <h5 className="fw-bold text-dark">No budgets available</h5>
                          <p className="text-muted">
                            Create a new budget to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((budget) => {
                      const usagePercentage = Math.round(
                        (1 - budget.remainingBudget / budget.originalBudget) *
                          100
                      );
                      return (
                        <tr key={budget.id} className="border-bottom">
                          <td className="py-3 px-4">
                            <div className="fw-semibold text-dark">
                              <Tag className="text-primary me-1" />
                              {budget.id}
                            </div>
                          </td>
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
                          <td>
                            <Badge
                              bg={
                                budget.addedVia === "manual"
                                  ? "info"
                                  : "secondary"
                              }
                              className="text-capitalize"
                            >
                              {budget.addedVia || "N/A"}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              bg={budget.amountAdd ? "danger" : "secondary"}
                              className="text-light"
                            >
                              {budget.amountAdd ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex d-wrap align-items-center">
                              <Button
                                variant="outline-light"
                                size="sm"
                                className="me-1 rounded-circle text-success border"
                                style={{ width: "32px", height: "32px" }}
                                title="Add Budget"
                                onClick={() => openAddModal(budget.id)}
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

      <Modal
        show={showAddModal}
        onHide={closeAddModal}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          {selectedBudgetId && (
            <div className="d-flex align-items-center gap-2">
              <Tag className="text-primary" />
              <h6 className="mb-0">
                Adding budget to budget ID:{" "}
                <span className="text-danger fw-bold">{selectedBudgetId}</span>
              </h6>
            </div>
          )}
        </Modal.Header>

        {/* Body */}
        <Form onSubmit={handleAddBudgetAmount}>
          <Modal.Body className="p-4">
            <div className="alert alert-light">
              <div className="bg-info p-2 rounded-2 bg-opacity-10 fw-bold mb-4 text-center d-flex gap-2 border-start border-3 border-info">
                <FaInfoCircle size={16} className="text-primary" />
                <h6 className="fw-bold text-muted">Budget Details</h6>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Building size={16} className="text-primary" />
                    <span className="fw-semibold">Department:</span>
                    <span className="ms-1">
                      {selectedBudgetData?.department?.name || "N/A"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Layers size={16} className="text-primary" />
                    <span className="fw-semibold">Category:</span>
                    <span className="ms-1">
                      {selectedBudgetData?.expenseCategory?.name || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Wallet size={16} className="text-primary" />
                    <span className="fw-semibold">Current Budget:</span>
                    <span className="ms-1">
                      {selectedBudgetData?.originalBudget?.toLocaleString() ||
                        "0.00"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <BarChart size={16} className="text-primary" />
                    <span className="fw-semibold">Remaining:</span>
                    <span
                      className={`ms-1 ${
                        Number(selectedBudgetData?.remainingBudget) < 0
                          ? "text-danger"
                          : "text-success"
                      }`}
                    >
                      {selectedBudgetData?.remainingBudget?.toLocaleString() ||
                        "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Card className="shadow-sm border rounded-3 p-4">
              <div className="d-flex flex-column gap-4">
                {/* Amount */}
                <Form.Group controlId="budgetAmount">
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2 mb-2">
                    <span>Budget Amount</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-primary text-white fw-bold border-0">
                      <Wallet size={18} className="text-white" />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted small mt-2 d-flex align-items-center">
                    <InfoCircle size={14} className="me-1 text-secondary" />
                    Enter the total budget you want to allocate
                  </Form.Text>
                </Form.Group>

                {/* Comments */}
                <Form.Group controlId="budgetComments">
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2 mb-2">
                    <span>Comments / Reason</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={budgetComments}
                    onChange={(e) => setBudgetComments(e.target.value)}
                  />
                  <Form.Text className="text-muted small mt-2 d-flex align-items-center">
                    <InfoCircle size={14} className="me-1 text-secondary" />
                    Explain why this budget is being added
                  </Form.Text>
                </Form.Group>
              </div>
            </Card>
          </Modal.Body>

          {/* Footer */}
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button
              variant="outline-dark"
              size="sm"
              disabled={submiting}
              onClick={closeAddModal}
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            >
              <XCircle size={16} />
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="sm"
              disabled={submiting}
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm"
            >
              <CheckCircle size={16} />
              Add budget
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
