"use client";

import { BASE_API_URL } from "@/app/static/apiConfig";
import { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  InputGroup,
  Card,
  ButtonGroup,
} from "react-bootstrap";
import {
  PlusCircle,
  Upload,
  ArrowLeftRight,
  Download,
  CashStack,
  Building,
  Tags,
  FileText,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";

interface Category {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface BudgetModalProps {
  categories: Category[];
  departments: Department[];
  onBudgetCreated: () => Promise<void>;
}

export default function BudgetModalPage({
  categories,
  departments,
  onBudgetCreated,
}: BudgetModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"create" | "upload" | "move">(
    "create"
  );

  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetComments, setBudgetComments] = useState<string>("");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const handleShow = (type: "create" | "upload" | "move") => {
    setModalType(type);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      departmentId: Number(departmentId),
      categoryId: Number(categoryId),
      amount: Number(budgetAmount),
      comments: budgetComments,
    };
    try {
      const res = await fetch(`${BASE_API_URL}/budgets/create-budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Budget created successfully");
        setShowModal(false);
        // Reset form fields
        setBudgetAmount("");
        setBudgetComments("");
        setDepartmentId("");
        setCategoryId("");
        // Call the parent component's callback to refresh budgets
        await onBudgetCreated();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  return (
    <div>
      {/* Dashboard Action Header */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Body className="d-flex flex-column d-wrap flex-md-row justify-content-between align-items-center p-4">
          <div>
            <h5 className="fw-bold mb-1">Budgets Management</h5>
            <p className="text-muted mb-0 small">
              Manage, upload, and track departmental budgets seamlessly.
            </p>
          </div>
          <div className="mt-3 mt-md-0">
            <ButtonGroup>
              <Button
                variant="primary"
                className="d-flex align-items-center px-3"
                style={{ backgroundColor: "#4361ee", border: "none" }}
                onClick={() => handleShow("create")}
              >
                <PlusCircle className="me-2" /> Create
              </Button>
              <Button
                variant="outline-secondary"
                className="d-flex align-items-center px-3"
                onClick={() => handleShow("upload")}
              >
                <Upload className="me-2" /> Upload
              </Button>
              <Button
                variant="outline-success"
                className="d-flex align-items-center px-3"
                onClick={() => handleShow("move")}
              >
                <ArrowLeftRight className="me-2" /> Move
              </Button>
              <Button
                variant="outline-dark"
                className="d-flex align-items-center px-3"
              >
                <Download className="me-2" /> Export
              </Button>
            </ButtonGroup>
          </div>
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={handleClose} size="xl">
        <Modal.Header closeButton className="border-0 pb-0">
          <h5 className="fw-bold text-primary">
            {modalType === "create" && "📝 Create New Budget"}
            {modalType === "upload" && "📂 Upload Budget File"}
            {modalType === "move" && "🔀 Move Budget Between Departments"}
          </h5>
        </Modal.Header>

        <Modal.Body className="pt-3">
          {modalType === "create" && (
            <Form>
              <Card className="border-0 mb-3 rounded-4">
                <Card.Body className="p-4 rounded border">
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">
                          <Building className="me-1 text-secondary" />{" "}
                          Department
                        </Form.Label>
                        <Form.Select
                          className="rounded-3 border-0 bg-light shadow-sm"
                          required
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                        >
                          <option value=""></option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Select the department this budget applies to
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          Please select a department
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">
                          <Tags className="me-1 text-info" /> Category
                        </Form.Label>
                        <Form.Select
                          className="rounded-3 border-0 bg-light shadow-sm"
                          required
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value=""></option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Choose the appropriate category
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          Please select a category
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">
                          <CashStack className="me-1 text-success" /> Amount
                        </Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="rounded-start-3 border-0 bg-light shadow-sm">
                            $
                          </InputGroup.Text>
                          <Form.Control
                            type="number"
                            className="rounded-end-3 border-0 bg-light shadow-sm"
                            min="0"
                            step="0.01"
                            required
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted small">
                          Enter the budget amount to be added
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          Please enter a valid amount
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted">
                      <FileText className="me-1 text-muted" /> Comments
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className="rounded-3 border-0 bg-light shadow-sm"
                      required
                      value={budgetComments}
                      onChange={(e) => setBudgetComments(e.target.value)}
                    />
                    <Form.Text className="text-muted small">
                      Add any additional details about this budget (max 500
                      characters)
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">
                      Please provide a description
                    </Form.Control.Feedback>
                  </Form.Group>
                </Card.Body>
              </Card>

              <Modal.Footer className="border-0">
                <Button
                  variant="light"
                  onClick={handleClose}
                  className="rounded-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  onClick={handleSubmit}
                  className="rounded-2 px-4 shadow-sm"
                  style={{ backgroundColor: "#4361ee", border: "none" }}
                >
                  Create Budget
                </Button>
              </Modal.Footer>
            </Form>
          )}

          {modalType === "upload" && (
            <Form>
              <div className="border-dashed rounded-4 p-5 text-center bg-light shadow-sm">
                <Upload size={48} className="text-muted mb-3" />
                <h5 className="fw-bold text-secondary">
                  Drag & drop your file here
                </h5>
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
                    className="rounded-pill shadow-sm"
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
              <Card className="border-0 shadow-sm mb-3 rounded-4">
                <Card.Body>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted">
                      <FileText className="me-1 text-muted" /> Select Budget
                    </Form.Label>
                    <Form.Select className="rounded-3 border-0 bg-light shadow-sm">
                      <option>Choose budget to move...</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>

              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted">
                      <Building className="me-1 text-secondary" /> Move To
                      Department
                    </Form.Label>
                    <Form.Select className="rounded-3 border-0 bg-light shadow-sm">
                      <option>Select target department</option>
                      <option>Finance</option>
                      <option>IT</option>
                      <option>HR</option>
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
