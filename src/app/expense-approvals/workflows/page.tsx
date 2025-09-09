"use client";

import { useState, useEffect } from "react";
import { Diagram3Fill, PlusCircle } from "react-bootstrap-icons";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  Alert,
  Modal,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  FaExclamationTriangle,
  FaPencilAlt,
  FaBoxes,
  FaTrash,
  FaInfoCircle,
  FaListOl,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaPlusCircle,
  FaPlus,
} from "react-icons/fa";
import Navbar from "../../components/Navbar";
import { BASE_API_URL } from "../../static/apiConfig";
import AuthProvider from "../../authPages/tokenData";
import PageLoader from "@/app/components/PageLoader";

interface WorkflowStep {
  id?: number;
  order: number;
  roleId: number | "";
  roleName: string;
  isOptional: boolean;
}

interface Workflow {
  id: number;
  name: string;
  institutionId: number;
  steps: WorkflowStep[];
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  userCount?: number;
}

export default function WorkflowEditor() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  const [showStepDeleteModal, setShowStepDeleteModal] = useState(false);
  const [newStepRoleId, setNewStepRoleId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");

  // Fetch data
  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/workflows/institution`, {
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
        setWorkflow(data.workflows); // single workflow
        setRoles(data.roles);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to fetch workflow: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, []);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: workflowName,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${BASE_API_URL}/workflows/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Workflow created successfully");
        setShowCreateModal(false);
        fetchWorkflow(); // Refresh the workflow list
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to create workflow: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWorkflow = (field: string, value: string | number) => {
    if (!workflow) return;
    setWorkflow({ ...workflow, [field]: value });
  };

  const handleSaveWorkflow = async () => {
    if (!workflow) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: workflow.name,
        steps: workflow.steps.map((step) => ({
          id: step.id ?? null,
          order: step.order,
          roleId: step.roleId,
          isOptional: step.isOptional,
        })),
      };

      const response = await fetch(
        `${BASE_API_URL}/workflows/update/${workflow.id}`,
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

      const data = await response.json();

      if (response.ok) {
        toast.success("Workflow updated successfully!");
        fetchWorkflow();
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error("Failed to update workflow: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStep = () => {
    if (!workflow || !newStepRoleId) return;
    const selectedRole = roles.find(
      (role) => role.id === Number(newStepRoleId)
    );
    if (!selectedRole) return;

    const newStep: WorkflowStep = {
      order: workflow.steps.length + 1,
      roleId: Number(newStepRoleId),
      roleName: selectedRole.name,
      isOptional: false,
    };

    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep],
    });

    setNewStepRoleId("");
  };

  const handleDeleteStep = (stepId: number) => {
    if (!workflow) return;

    setWorkflow({
      ...workflow,
      steps: workflow.steps
        .filter((step) => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 })),
    });

    setShowStepDeleteModal(false);
    setStepToDelete(null);
  };

  const handleDeleteWorkflow = async () => {
    if (!workflow) return;
    setIsSubmitting(true);

    try {
      const workflowRes = await fetch(
        `${BASE_API_URL}/workflows/void/${workflow.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const workflowData = await workflowRes.json();

      if (workflowRes.ok) {
        toast.success("Workflow deleted successfully!");
        setWorkflow(null);
      } else {
        toast.error(`${workflowData.message}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred" + error);
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  const confirmDeleteStep = (stepId: number) => {
    setStepToDelete(stepId);
    setShowStepDeleteModal(true);
  };

  const toggleStepOptional = (stepId: number) => {
    if (!workflow) return;

    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((step) =>
        step.id === stepId ? { ...step, isOptional: !step.isOptional } : step
      ),
    });
  };

  const moveStep = (stepId: number, direction: "up" | "down") => {
    if (!workflow) return;

    const steps = [...workflow.steps];
    const index = steps.findIndex((step) => step.id === stepId);

    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === steps.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];

    const reorderedSteps = steps.map((step, i) => ({ ...step, order: i + 1 }));

    setWorkflow({
      ...workflow,
      steps: reorderedSteps,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <PageLoader />;

  return (
    <AuthProvider>
      <Navbar />
      <Container fluid className="my-5">
        <Row>
          <Col lg={12}>
            {workflow ? (
              <Card className="shadow-sm border-0 rounded-3">
                <Card.Header className="bg-light py-3 rounded-top-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">Expense approval steps</h6>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FaTrash className="me-1" /> Delete
                  </Button>
                </Card.Header>
                <Card.Body className="p-4">
                  <Alert
                    variant="info"
                    className="border-0 bg-light-info border-0 border-2 border-info border-start"
                  >
                    <div className="d-flex">
                      <FaInfoCircle className="text-info me-2 fs-5 mt-1" />
                      <div>
                        <h6 className="alert-heading mb-1">Update Workflow</h6>
                        Modify the workflow name or add the steps required for
                        the workflow. Workflow steps represent the roles that
                        will be assigned to it. These are the stages an expense
                        must go through before being paid by the finance
                        department.
                      </div>
                    </div>
                  </Alert>
                  <br />
                  <br />
                  <h6 className="mb-3 border-bottom pb-2 fw-bold">
                    Workflow Details
                  </h6>
                  <Row className="border-0 border-2 border-info border-start mb-4 bg-info bg-opacity-10 p-3 rounded">
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Workflow Name</Form.Label>
                        <Form.Control
                          value={workflow.name}
                          onChange={(e) =>
                            handleUpdateWorkflow("name", e.target.value)
                          }
                          className="py-2 border-2"
                        />
                        <Form.Text className="text-muted">
                          Workflow name is required
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <br />
                  <br />
                  <h6 className="mb-3 border-bottom pb-2 fw-bold">
                    Workflow Steps
                  </h6>
                  <div className="mb-4 border p-4 rounded-3">
                    <h6 className="mb-3 border-bottom pb-2 d-flex align-items-center">
                      <FaListOl className="me-2 text-primary" />
                      Workflow Steps
                      <Badge bg="primary" className="ms-2">
                        {workflow.steps.length}
                      </Badge>
                    </h6>

                    {workflow.steps.length > 0 ? (
                      <div className="table-responsive">
                        <Table hover className="align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>ID</th>
                              <th className="ps-4">Order</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th className="text-end pe-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workflow.steps.map((step) => (
                              <tr key={step.id ?? `step-${step.order}`}>
                                <td>{step.id}</td>
                                <td className="ps-4">
                                  <Badge
                                    bg="primary"
                                    className="fs-6 px-2 py-2"
                                  >
                                    {step.order}
                                  </Badge>
                                </td>
                                <td>
                                  <div>
                                    <div className="fw-semibold">
                                      {
                                        roles.find(
                                          (role) => role.id === step.roleId
                                        )?.name
                                      }
                                    </div>
                                    <small className="text-muted">
                                      ID: {step.roleId}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <Form.Check
                                    type="switch"
                                    id={`optional-switch-${step.id}`}
                                    label={
                                      step.isOptional ? "Optional" : "Required"
                                    }
                                    checked={step.isOptional}
                                    onChange={() =>
                                      toggleStepOptional(step.id!)
                                    }
                                  />
                                </td>
                                <td className="text-end pe-4">
                                  <div className="d-flex gap-2 justify-content-end">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => moveStep(step.id!, "up")}
                                      disabled={step.order === 1}
                                    >
                                      <FaArrowUp />
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => moveStep(step.id!, "down")}
                                      disabled={
                                        step.order === workflow.steps.length
                                      }
                                    >
                                      <FaArrowDown />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        confirmDeleteStep(step.id!)
                                      }
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-light rounded-3">
                        <FaBoxes className="display-4 text-muted opacity-50" />
                        <p className="mt-3 text-muted fw-semibold">
                          No steps in this workflow
                        </p>
                        <p className="text-muted mb-0">
                          Add steps using the form below
                        </p>
                      </div>
                    )}

                    <Card className="bg-info bg-opacity-10 border-0 border-2 border-info border-start mt-3">
                      <Card.Body className="p-3">
                        <Form.Label className="fw-semibold">
                          Add New Step
                        </Form.Label>
                        <Row>
                          <Col md={8}>
                            <Form.Select
                              value={newStepRoleId}
                              onChange={(e) => setNewStepRoleId(e.target.value)}
                              className="py-2 border-2"
                            >
                              <option value="">Select a role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name} (ID: {role.id})
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={4}>
                            <Button
                              onClick={handleAddStep}
                              disabled={!newStepRoleId}
                              className="w-100 d-flex align-items-center justify-content-center py-2"
                              variant="success"
                            >
                              <FaPlusCircle className="me-2" /> Add Step
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="d-flex justify-content-end pt-3 border-top">
                    <Button
                      onClick={handleSaveWorkflow}
                      variant="primary"
                      disabled={isSubmitting}
                      className="px-4"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-2" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="mt-4 pt-3 border-top">
                    <h6 className="mb-3">Workflow Metadata</h6>
                    <Row>
                      <Col md={6}>
                        <div className="d-flex flex-column">
                          <small className="text-muted">Created At</small>
                          <span className="fw-semibold">
                            {formatDate(workflow.createdAt)}
                          </span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex flex-column">
                          <small className="text-muted">Last Updated</small>
                          <span className="fw-semibold">
                            {formatDate(workflow.updatedAt)}
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <Card className="rounded-3 text-center h-100 bg-light border">
                <Card.Body className="d-flex flex-column justify-content-center align-items-center py-5">
                  <FaPencilAlt className="display-4 text-muted opacity-50" />
                  <h6 className="mt-3 text-muted">No Workflow Found</h6>
                  <p className="text-muted mb-4">
                    Please create a workflow in the system first.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="px-4"
                  >
                    <FaPlus className="me-2" />
                    Create Workflow
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Delete Workflow Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete this workflow? This action cannot be
            undone.
          </p>
          <Alert variant="warning" className="mb-0">
            <FaExclamationTriangle className="me-2" />
            All steps associated with this workflow will also be permanently
            deleted.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteWorkflow}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete Workflow"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Step Confirmation Modal */}
      <Modal
        show={showStepDeleteModal}
        onHide={() => setShowStepDeleteModal(false)}
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Step</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to remove this step from the workflow?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowStepDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => stepToDelete && handleDeleteStep(stepToDelete)}
          >
            Delete Step
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Workflow Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
        className="custom-modal"
      >
        <Form onSubmit={handleCreateWorkflow}>
          <Modal.Header closeButton className="border-0">
            <h6 className="fw-bold text-primary">
              <Diagram3Fill className="me-2" /> Create New Workflow
            </h6>
          </Modal.Header>
          <Modal.Body>
            <div className="p-4  border rounded-3">
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-muted">
                  Workflow Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  required
                  maxLength={100}
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="py-2 shadow-sm rounded-3"
                />
                <Form.Text className="text-muted">
                  Give your workflow a descriptive name (max 100 characters).
                </Form.Text>
              </Form.Group>{" "}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 d-flex justify-content-end">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setShowCreateModal(false)}
              className="px-4 rounded-3"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              className="px-4 rounded-3 shadow-sm"
            >
              <PlusCircle className="me-2" />
              Create Workflow
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AuthProvider>
  );
}
