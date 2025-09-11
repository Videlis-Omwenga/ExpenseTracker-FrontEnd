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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amountToMove, setAmountToMove] = useState("");

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitExcel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (departmentId) {
      const deptId = Number(departmentId);
      if (!isNaN(deptId)) {
        formData.append("departmentId", deptId.toString());
      }
    }
    if (budgetComments) formData.append("comments", budgetComments);

    try {
      const res = await fetch(`${BASE_API_URL}/budgets/upload-bulk-budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Budget file uploaded successfully");
        setShowModal(false);
        setSelectedFile(null);
        setBudgetComments("");
        setDepartmentId("");
        await onBudgetCreated();
      } else {
        toast.error(`${data.message}`);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`${error}`);
    }
  };

  return (
    <div>
      {/* Dashboard Action Header */}
      <Card className=" border-0 rounded-4 mb-4">
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
            {modalType === "move" && "🔀 Move Budget"}
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
                          className="rounded-3 "
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
                          className="rounded-3 "
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
                          <InputGroup.Text className="rounded-start-3 ">
                            $
                          </InputGroup.Text>
                          <Form.Control
                            type="number"
                            className="rounded-end-3 "
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
                      className="rounded-3 "
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
                  className="rounded-2 px-4 "
                  style={{ backgroundColor: "#4361ee", border: "none" }}
                >
                  Create Budget
                </Button>
              </Modal.Footer>
            </Form>
          )}

          {modalType === "upload" && (
            <Form onSubmit={handleSubmitExcel}>
              <div className="mb-3 border p-4 rounded-4 ">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted">
                    <Building className="me-1 text-secondary" /> Department
                  </Form.Label>
                  <Form.Select
                    className="rounded-3 "
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
                <div className="border-dashed rounded-4 p-5 text-center bg-light mt-3">
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
                      accept=".xlsx"
                      onChange={handleFileChange}
                    />
                    <Button
                      as="label"
                      htmlFor="file-upload"
                      variant="outline-primary"
                      className="rounded-pill "
                    >
                      Browse Files
                    </Button>
                  </Form.Group>
                  <p className="small text-muted mt-3">
                    Supported formats: XLSX (max 5MB)
                    {selectedFile && (
                      <span className="d-block text-success mt-1">
                        Selected: {selectedFile.name}
                      </span>
                    )}
                  </p>
                </div>
                <Form.Group className="mt-3">
                  <Form.Label className="fw-semibold small text-muted">
                    <FileText className="me-1 text-muted" /> Comments
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    className="rounded-3 "
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
              </div>
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
                  className="rounded-2 px-4 "
                  style={{ backgroundColor: "#4361ee", border: "none" }}
                >
                  Upload Budget
                </Button>
              </Modal.Footer>
            </Form>
          )}

          {modalType === "move" && (
            <Form>
              <Card className="border  mb-3 rounded-4">
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small text-muted">
                      <Building className="me-1 text-secondary" /> Department
                    </Form.Label>
                    <Form.Select
                      className="rounded-3 "
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
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small text-muted">
                      <Tags className="me-1 text-info" /> Category
                    </Form.Label>
                    <Form.Select
                      className="rounded-3 "
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
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small text-muted">
                      <FileText className="me-1 text-muted" /> Amount to move
                    </Form.Label>
                    <Form.Control
                      type="number"
                      className="rounded-3  "
                      required
                      value={amountToMove}
                      onChange={(e) => setAmountToMove(e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide an amount
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small text-muted">
                      <FileText className="me-1 text-muted" /> Comments
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className="rounded-3 "
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
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
