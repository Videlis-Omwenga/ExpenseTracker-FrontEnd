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
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create Workflow</Modal.Title>
        <Badge bg="secondary" className="ms-3 fs-6">
          {steps.length} {steps.length === 1 ? "Step" : "Steps"}
        </Badge>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="border p-4 rounded">
          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3 border-bottom pb-2">Workflow Details</h5>
            {/* Workflow Details */}
            <Row className="mb-4 bg-info bg-opacity-10 p-3 rounded">
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

            {/* Steps Section */}
            <div className="mb-4">
              <h5 className="mb-3 border-bottom pb-2">Workflow Steps</h5>

              <div className="bg-info bg-opacity-10 p-3 rounded mb-3">
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
          </Form>
        </div>
      </Modal.Body>
      <Modal.Footer>
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
  );
}
