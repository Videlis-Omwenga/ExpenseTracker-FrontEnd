"use client";

import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Form,
  Button,
  Table,
  InputGroup,
  Badge,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { BASE_API_URL } from "../../static/apiConfig";
import {
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Trash,
  Inboxes,
  XCircle,
  CheckCircle,
} from "react-bootstrap-icons";

interface WorkflowStep {
  order: number;
  roleId: number | "";
  isOptional: boolean;
}

interface WorkflowCreatorModalProps {
  show: boolean;
  onHide: () => void;
}

interface Role {
  id: number;
  name: string;
}

export default function WorkflowCreatorModal({
  show,
  onHide,
}: WorkflowCreatorModalProps) {
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [roleId, setRoleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/roles/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRoles(data);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to fetch roles: ${error}`);
      throw error;
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const addStep = () => {
    if (!roleId) return;
    setSteps([
      ...steps,
      { order: steps.length + 1, roleId: Number(roleId), isOptional: false },
    ]);
    setRoleId("");
  };

  const toggleOptional = (index: number) => {
    setSteps(
      steps.map((s, i) =>
        i === index ? { ...s, isOptional: !s.isOptional } : s
      )
    );
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index - 1]] = [
      newSteps[index - 1],
      newSteps[index],
    ];
    setSteps(newSteps.map((step, i) => ({ ...step, order: i + 1 })));
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [
      newSteps[index + 1],
      newSteps[index],
    ];
    setSteps(newSteps.map((step, i) => ({ ...step, order: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const workflowPayload = {
        name,
        institutionId: Number(institutionId),
      };

      const workflowRes = await fetch(`${BASE_API_URL}/workflows/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
        body: JSON.stringify(workflowPayload),
      });

      const workflowResponse = await workflowRes.json();

      if (workflowResponse.ok) {
        toast.info("Workflow created successfully!");
      } else {
        toast.error(`${workflowResponse.message}`);
        return;
      }

      const workflowData = await workflowRes.json();
      const workflowId = workflowData.id;

      if (steps.length > 0) {
        const stepsPayload = {
          workflowId,
          steps: steps.map((step) => ({
            order: step.order,
            roleId: step.roleId,
            isOptional: step.isOptional,
          })),
        };

        const stepsRes = await fetch(`${BASE_API_URL}/workflows/create-steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stepsPayload),
        });

        if (!stepsRes.ok) {
          const err = await stepsRes.json();
          toast.error(`${err.message}`);
          return;
        } else {
          toast.success("Workflow steps created successfully!");
        }
      }

      // reset form after success
      setName("");
      setInstitutionId("");
      setSteps([]);
      onHide(); // close modal
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
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
              <Inboxes size={24} className="text-white" />
            </div>
            <div>
              Create Workflow
              <div className="text-muted fw-normal small">
                Design approval process steps
              </div>
            </div>
            <Badge bg="secondary" className="ms-3 fs-6 rounded-pill">
              {steps.length} {steps.length === 1 ? "Step" : "Steps"}
            </Badge>
          </h5>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <Form onSubmit={handleSubmit}>
            {/* Workflow Details */}
            <div className="workflow-card mb-4">
              <div className="workflow-card-header">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <CheckCircle className="me-2 text-primary" size={18} />
                  Workflow Details
                </h6>
              </div>
              <div className="workflow-card-body">
                <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Workflow Name</Form.Label>
                  <Form.Control
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Document Approval Process"
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Institution ID
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    placeholder="Enter institution ID"
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
              </div>
            </div>

            {/* Steps Section */}
            <div className="workflow-card">
              <div className="workflow-card-header">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <PlusCircle className="me-2 text-primary" size={18} />
                  Workflow Steps
                </h6>
              </div>
              <div className="workflow-card-body">
                <div className="add-step-section mb-3">
                  <Form.Label className="fw-semibold">Add New Step</Form.Label>
                <InputGroup>
                  <Form.Select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="py-2"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    onClick={addStep}
                    disabled={!roleId}
                    className="d-flex align-items-center"
                  >
                    <PlusCircle className="me-2" /> Add Step
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  Enter the ID of the role that will be responsible for this
                  approval step.
                </Form.Text>
              </div>

              {steps.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Order</th>
                        <th>Role ID</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step, i) => (
                        <tr key={i}>
                          <td>
                            <Badge bg="primary" className="fs-6">
                              {step.order}
                            </Badge>
                          </td>
                          <td className="fw-semibold">
                            {
                              roles.find((role) => role.id === step.roleId)
                                ?.name
                            }{" "}
                            <br />
                            <span className="text-muted small">
                              ID: {step.roleId}
                            </span>
                          </td>
                          <td>
                            <Form.Check
                              type="switch"
                              id={`optional-switch-${i}`}
                              label={step.isOptional ? "Optional" : "Required"}
                              checked={step.isOptional}
                              onChange={() => toggleOptional(i)}
                            />
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => moveStepUp(i)}
                                disabled={i === 0}
                                title="Move Up"
                              >
                                <ArrowUp />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => moveStepDown(i)}
                                disabled={i === steps.length - 1}
                                title="Move Down"
                              >
                                <ArrowDown />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeStep(i)}
                                title="Remove Step"
                              >
                                <Trash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 bg-light rounded">
                  <Inboxes size={32} className="text-muted" />
                  <p className="mt-2 text-muted">
                    No steps added yet. Start by adding your first step above.
                  </p>
                </div>
              )}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer
          className="border-0 pt-0 px-4 pb-4 mt-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
        <Button
          variant="outline-secondary"
          onClick={() => {
            setName("");
            setInstitutionId("");
            setSteps([]);
          }}
        >
          <XCircle className="me-2" /> Reset Form
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={steps.length === 0 || isSubmitting}
          className="px-4"
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="me-2" /> Save Workflow
            </>
          )}
        </Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .workflow-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .workflow-card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .workflow-card-header {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 1.5rem;
        }

        .workflow-card-body {
          padding: 1.5rem;
        }

        .add-step-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 1rem;
        }

        .form-control, .form-select {
          border: 2px solid #e9ecef;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          font-size: 0.95rem;
        }

        .form-control:focus, .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          transform: translateY(-1px);
          background: #fefefe;
        }

        .form-control:hover:not(:focus), .form-select:hover:not(:focus) {
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

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-outline-secondary {
          border: 2px solid #d1d5db;
          color: #6b7280;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-outline-secondary:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          color: #374151;
          transform: translateY(-1px);
        }

        .modal-header {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .modal-footer {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-top: 2px solid #e5e7eb;
        }

        .icon-wrapper {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .table {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
        }

        .table thead th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: none;
          font-weight: 600;
          color: #374151;
          padding: 1rem;
        }

        .table tbody td {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          vertical-align: middle;
        }

        .badge {
          font-weight: 600;
          padding: 0.5rem 0.75rem;
        }

        .form-check-input:checked {
          background-color: #10b981;
          border-color: #10b981;
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

        .form-text {
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 0.375rem;
        }

        .text-muted {
          color: #64748b !important;
        }
      `}</style>
    </>
  );
}
