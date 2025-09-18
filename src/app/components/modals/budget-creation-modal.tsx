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
        <Modal.Header
          closeButton
          className="border-0 pb-0 pt-4 px-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
            <div
              className="icon-wrapper bg-primary me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              {modalType === "create" && <CashStack size={24} className="text-white" />}
              {modalType === "upload" && <Upload size={24} className="text-white" />}
              {modalType === "move" && <ArrowLeftRight size={24} className="text-white" />}
            </div>
            <div>
              {modalType === "create" && "Create New Budget"}
              {modalType === "upload" && "Upload Budget File"}
              {modalType === "move" && "Move Budget"}
              <div className="text-muted fw-normal small">
                {modalType === "create" && "Add a new budget allocation"}
                {modalType === "upload" && "Import budget data from file"}
                {modalType === "move" && "Transfer budget between categories"}
              </div>
            </div>
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

              <Modal.Footer
                className="border-0 pt-0 px-4 pb-4 mt-4"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <Button
                  variant="light"
                  onClick={handleClose}
                  className="rounded-3 px-4 py-2 fw-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  onClick={handleSubmit}
                  className="rounded-3 px-4 py-2 fw-semibold"
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
              <Modal.Footer
                className="border-0 pt-0 px-4 pb-4 mt-4"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <Button
                  variant="light"
                  onClick={handleClose}
                  className="rounded-3 px-4 py-2 fw-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-3 px-4 py-2 fw-semibold"
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

      <style jsx global>{`
        .modern-input, .form-control, .form-select {
          border: 2px solid #e9ecef;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          font-size: 0.95rem;
          line-height: 1.6;
          position: relative;
        }

        .modern-input:focus, .form-control:focus, .form-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
          transform: translateY(-1px);
          background: #fefefe;
        }

        .modern-input:hover:not(:focus), .form-control:hover:not(:focus), .form-select:hover:not(:focus) {
          border-color: #d1d5db;
          background: #fafafa;
        }

        .form-label {
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.025em;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .card {
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          background: #ffffff;
          border-radius: 12px;
        }

        .card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .card-body {
          padding: 1.5rem;
        }

        .form-text {
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 0.375rem;
        }

        .text-danger {
          color: #ef4444 !important;
        }

        .text-muted {
          color: #64748b !important;
        }

        .modal-header {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .modal-footer {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-top: 2px solid #e5e7eb;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
        }

        .btn-light {
          border: 2px solid #d1d5db;
          color: #6b7280;
          font-weight: 600;
          transition: all 0.3s ease;
          background: #ffffff;
        }

        .btn-light:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          color: #374151;
          transform: translateY(-1px);
        }

        .icon-wrapper {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .border-dashed {
          border: 2px dashed #d1d5db !important;
          transition: all 0.3s ease;
        }

        .border-dashed:hover {
          border-color: #f59e0b !important;
          background-color: #fef3c7 !important;
        }

        .btn-outline-primary {
          border: 2px solid #f59e0b;
          color: #f59e0b;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-outline-primary:hover {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .input-group-text {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px solid #e9ecef;
          border-right: none;
          font-weight: 600;
          color: #374151;
        }

        .input-group .form-control {
          border-left: none;
        }

        .input-group .form-control:focus {
          border-left: none;
          box-shadow: none;
        }

        .input-group:focus-within .input-group-text {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content {
          animation: slideUp 0.3s ease-out;
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .text-success {
          color: #10b981 !important;
        }

        .text-info {
          color: #3b82f6 !important;
        }

        .text-secondary {
          color: #6b7280 !important;
        }

        .bg-light {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
        }

        .small {
          font-size: 0.825rem;
        }

        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }

        .rounded-pill {
          border-radius: 50rem !important;
        }

        .d-none {
          display: none !important;
        }

        .btn[data-bs-toggle="tooltip"] {
          position: relative;
        }

        .fw-semibold {
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
}
