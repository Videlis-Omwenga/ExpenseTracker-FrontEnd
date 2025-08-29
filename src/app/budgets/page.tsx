"use client";

import { useEffect, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  InputGroup,
  Badge,
  Pagination,
  Card,
  ProgressBar,
} from "react-bootstrap";
import {
  PlusCircle,
  Upload,
  ArrowLeftRight,
  PencilSquare,
  Trash,
  Search,
  Download,
  BarChart,
  Filter,
  Calendar,
  ThreeDotsVertical,
  Tag,
  Wallet,
  Layers,
  Building,
  CheckCircle,
} from "react-bootstrap-icons";
import AuthProvider from "../authPages/tokenData";
import TopNavbar from "../components/Navbar";

interface Budget {
  id: number;
  fromDate: string;
  toDate: string;
  initialAmount: number;
  balanceAmount: number;
  department: string;
  description: string;
  status: "Active" | "Expired" | "Upcoming";
}

export default function BudgetsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const [budgets] = useState<Budget[]>([
    {
      id: 1,
      fromDate: "2025-01-01",
      toDate: "2025-03-31",
      initialAmount: 100000,
      balanceAmount: 75000,
      department: "Finance",
      description: "Q1 Operating Budget",
      status: "Expired",
    },
    {
      id: 2,
      fromDate: "2025-04-01",
      toDate: "2025-06-30",
      initialAmount: 120000,
      balanceAmount: 110000,
      department: "IT",
      description: "Infrastructure Upgrades",
      status: "Active",
    },
    {
      id: 3,
      fromDate: "2025-07-01",
      toDate: "2025-09-30",
      initialAmount: 90000,
      balanceAmount: 90000,
      department: "HR",
      description: "Training & Development",
      status: "Upcoming",
    },
  ]);

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
    (sum, budget) => sum + budget.balanceAmount,
    0
  );

  return (
    <AuthProvider>
      <TopNavbar />
      <Container
        fluid
        className="p-4 bg-light min-vh-100"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        {/* Page Header */}
        <Row className="align-items-center mb-4">
          <Col>
            <div className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-4 me-3">
                <BarChart size={28} className="text-primary" />
              </div>
              <div>
                <h1
                  className="fw-bold mb-1 text-dark"
                  style={{ fontSize: "1.75rem" }}
                >
                  Budgets Dashboard
                </h1>
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
            <div className="d-flex gap-2 justify-content-end">
              <Button
                variant="primary"
                className="rounded-pill shadow-sm px-3 d-inline-flex align-items-center"
                onClick={() => handleShow("create")}
                style={{ backgroundColor: "#4361ee", border: "none" }}
              >
                <PlusCircle className="me-2" /> New Budget
              </Button>

              <div className="position-relative" ref={menuRef}>
                <Button
                  variant="outline-light"
                  className="rounded-pill shadow-sm px-3 d-inline-flex align-items-center"
                  style={{ borderColor: "#dee2e6", color: "#495057" }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                >
                  <ThreeDotsVertical />
                </Button>

                {isMenuOpen && (
                  <div
                    className="position-absolute end-0 mt-2 shadow-lg rounded-3 bg-white border"
                    style={{ minWidth: "200px", zIndex: 1000 }}
                  >
                    <div className="p-2">
                      <button
                        className="w-100 btn btn-light rounded-2 text-start p-2 d-flex align-items-center"
                        onClick={() => {
                          handleShow("upload");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Upload className="me-2" /> Upload Budget
                      </button>
                      <button
                        className="w-100 btn btn-light rounded-2 text-start p-2 d-flex align-items-center mt-1"
                        onClick={() => {
                          handleShow("move");
                          setIsMenuOpen(false);
                        }}
                      >
                        <ArrowLeftRight className="me-2" /> Move Budget
                      </button>
                      <hr className="my-1" />
                      <button className="w-100 btn btn-light rounded-2 text-start p-2 d-flex align-items-center">
                        <Download className="me-2" /> Export as CSV
                      </button>
                      <button className="w-100 btn btn-light rounded-2 text-start p-2 d-flex align-items-center mt-1">
                        <Download className="me-2" /> Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                      {new Set(budgets.map((b) => b.department)).size}
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
                    <th className="border-0">Department</th>
                    <th className="border-0">Description</th>
                    <th className="border-0">Status</th>
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
                        (1 - budget.balanceAmount / budget.initialAmount) * 100
                      );
                      return (
                        <tr key={budget.id} className="border-top">
                          <td className="ps-4">
                            <div className="fw-semibold text-dark">
                              {new Date(budget.fromDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                            <div className="text-muted small">
                              to{" "}
                              {new Date(budget.toDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="fw-semibold text-dark">
                              ${budget.initialAmount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`fw-semibold ${
                                budget.balanceAmount <
                                budget.initialAmount * 0.2
                                  ? "text-danger"
                                  : budget.balanceAmount <
                                    budget.initialAmount * 0.5
                                  ? "text-warning"
                                  : "text-success"
                              }`}
                            >
                              ${budget.balanceAmount.toLocaleString()}
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
                              <span className="text-muted small">
                                {usagePercentage}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <Badge
                              bg="light"
                              text="dark"
                              className="px-1 py-1 rounded-pill"
                            >
                              {budget.department}
                            </Badge>
                          </td>
                          <td>
                            <span
                              className="text-truncate d-inline-block"
                              style={{ maxWidth: "200px" }}
                            >
                              {budget.description}
                            </span>
                          </td>
                          <td>
                            <Badge
                              bg={
                                budget.status === "Active"
                                  ? "success-light" // Custom class in CSS
                                  : budget.status === "Expired"
                                  ? "secondary"
                                  : "info-light" // Custom class in CSS
                              }
                              text={
                                budget.status === "Active"
                                  ? "success"
                                  : budget.status === "Expired"
                                  ? "light"
                                  : "info"
                              }
                              className="px-3 py-2 rounded-pill"
                            >
                              {budget.status}
                            </Badge>
                          </td>
                          <td className="text-end pe-4">
                            <Button
                              variant="outline-light"
                              size="sm"
                              className="me-1 rounded-circle text-primary"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <PencilSquare size={14} />
                            </Button>
                            <Button
                              variant="outline-light"
                              size="sm"
                              className="rounded-circle text-danger"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <Trash size={14} />
                            </Button>
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

        {/* Modal */}
        <Modal show={showModal} onHide={handleClose} centered size="lg">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              {modalType === "create" && "Create New Budget"}
              {modalType === "upload" && "Upload Budget File"}
              {modalType === "move" && "Move Budget Between Departments"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0">
            {modalType === "create" && (
              <Form>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-semibold">From Date</Form.Label>
                    <Form.Control
                      type="date"
                      className="rounded-3 border-0 bg-light"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label className="fw-semibold">To Date</Form.Label>
                    <Form.Control
                      type="date"
                      className="rounded-3 border-0 bg-light"
                    />
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Initial Amount
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="rounded-start-3 border-0 bg-light">
                      $
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      placeholder="Enter amount"
                      className="rounded-end-3 border-0 bg-light"
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Department</Form.Label>
                  <Form.Select className="rounded-3 border-0 bg-light">
                    <option>Select department</option>
                    <option>Finance</option>
                    <option>IT</option>
                    <option>HR</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    className="rounded-3 border-0 bg-light"
                    placeholder="Brief description of this budget"
                  />
                </Form.Group>
              </Form>
            )}

            {modalType === "upload" && (
              <Form>
                <div className="border-dashed rounded-3 p-4 text-center bg-light">
                  <Upload size={48} className="text-muted mb-3" />
                  <h5>Drag & drop your file here</h5>
                  <p className="text-muted mb-3">or</p>
                  <Form.Group>
                    <Form.Control
                      type="file"
                      className="d-none"
                      id="file-upload"
                    />
                    <Button
                      as="label"
                      htmlFor="file-upload"
                      variant="outline-primary"
                      className="rounded-pill"
                    >
                      Browse Files
                    </Button>
                  </Form.Group>
                  <p className="small text-muted mt-3">
                    Supported formats: CSV, XLSX (max 5MB)
                  </p>
                </div>
              </Form>
            )}

            {modalType === "move" && (
              <Form>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Select Budget</Form.Label>
                  <Form.Select className="rounded-3 border-0 bg-light">
                    <option>Choose budget to move...</option>
                    {budgets.map((b) => (
                      <option key={b.id}>
                        {b.department} ({b.fromDate} → {b.toDate})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Move To Department
                  </Form.Label>
                  <Form.Select className="rounded-3 border-0 bg-light">
                    <option>Select target department</option>
                    <option>Finance</option>
                    <option>IT</option>
                    <option>HR</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={handleClose} className="rounded-2">
              Cancel
            </Button>
            <Button
              variant="primary"
              className="rounded-2 px-4"
              style={{ backgroundColor: "#4361ee", border: "none" }}
            >
              {modalType === "create" && "Create Budget"}
              {modalType === "upload" && "Upload File"}
              {modalType === "move" && "Move Budget"}
            </Button>
          </Modal.Footer>
        </Modal>
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
