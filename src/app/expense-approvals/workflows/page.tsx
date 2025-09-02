"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  InputGroup,
  Badge,
  Alert,
  Modal,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  FaExclamationTriangle,
  FaPencilAlt,
  FaSitemap,
  FaSearch,
  FaBoxes,
  FaTrash,
  FaInfoCircle,
  FaListOl,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaCheckCircle,
  FaPlusCircle,
} from "react-icons/fa";
import Navbar from "../../components/Navbar";
import { BASE_API_URL } from "../../static/apiConfig";
import WorkflowCreatorModal from "../../components/modals/workflowModal";
import AuthProvider from "../../authPages/tokenData";

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
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<number | null>(null);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  const [showStepDeleteModal, setShowStepDeleteModal] = useState(false);
  const [newStepRoleId, setNewStepRoleId] = useState("");

  const [showModal, setShowModal] = useState(false);

  // Fetch data
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/workflows/institution/${1}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setWorkflows(data.workflows);
        setRoles(data.roles);
        setFilteredWorkflows(data.workflows);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to fetch workflows: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Filter workflows based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = workflows.filter(
        (workflow) =>
          workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workflow.institutionId.toString().includes(searchTerm)
      );
      setFilteredWorkflows(filtered);
    } else {
      setFilteredWorkflows(workflows);
    }
  }, [searchTerm, workflows]);

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  const handleUpdateWorkflow = (field: string, value: string | number) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow({
      ...selectedWorkflow,
      [field]: value,
    });
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;

    setIsSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        name: selectedWorkflow.name,
        steps: selectedWorkflow.steps.map((step) => ({
          id: step.id ?? null,
          order: step.order,
          roleId: step.roleId,
          isOptional: step.isOptional,
        })),
      };

      // Send update to backend
      const response = await fetch(
        `${BASE_API_URL}/workflows/update/${selectedWorkflow.id}`,
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
        fetchWorkflows();
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
    if (!selectedWorkflow || !newStepRoleId) return;

    const selectedRole = roles.find(
      (role) => role.id === Number(newStepRoleId)
    );
    if (!selectedRole) return;

    const newStep: WorkflowStep = {
      order: selectedWorkflow.steps.length + 1,
      roleId: Number(newStepRoleId),
      roleName: selectedRole.name,
      isOptional: false,
    };

    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep],
    });

    setNewStepRoleId("");
  };

  const handleDeleteStep = (stepId: number) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps
        .filter((step) => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 })),
    });

    setShowStepDeleteModal(false);
    setStepToDelete(null);
  };

  const handleDeleteWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowToDelete) return;

    setIsSubmitting(true);

    try {
      const workflowRes = await fetch(
        `${BASE_API_URL}/workflows/void/${workflowToDelete}`,
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
        setShowDeleteModal(false);
        setWorkflowToDelete(null);
        setSelectedWorkflow(null);
        fetchWorkflows();
      } else {
        toast.error(`${workflowData.message}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred" + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStep = (stepId: number) => {
    setStepToDelete(stepId);
    setShowStepDeleteModal(true);
  };

  const confirmDeleteWorkflow = (workflowId: number) => {
    setWorkflowToDelete(workflowId);
    setShowDeleteModal(true);
  };

  const toggleStepOptional = (stepId: number) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map((step) =>
        step.id === stepId ? { ...step, isOptional: !step.isOptional } : step
      ),
    });
  };

  const moveStep = (stepId: number, direction: "up" | "down") => {
    if (!selectedWorkflow) return;

    const steps = [...selectedWorkflow.steps];
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

    setSelectedWorkflow({
      ...selectedWorkflow,
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

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <AuthProvider>
      <Navbar />
      <Container className="my-5">
        <Row>
          <Col lg={4}>
            <Card className="shadow-sm border-0 rounded-3 h-100">
              <Card.Header className="bg-primary text-white py-3 rounded-top-3 d-flex d-wrap justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaSitemap className="me-2" />
                  Workflows
                </h5>
                <Button variant="light" onClick={() => setShowModal(true)}>
                  Create Workflow
                </Button>
                <WorkflowCreatorModal
                  show={showModal}
                  onHide={() => {
                    setShowModal(false);
                    fetchWorkflows();
                  }}
                />
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search workflows..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </div>

                {filteredWorkflows.length === 0 ? (
                  <div className="text-center py-4">
                    <FaBoxes className="display-4 text-muted" />
                    <p className="mt-3 text-muted">No workflows found</p>
                  </div>
                ) : (
                  <ListGroup variant="flush" className="rounded">
                    {filteredWorkflows.map((workflow) => (
                      <ListGroup.Item
                        key={workflow.id}
                        action
                        active={false}
                        onClick={() => handleSelectWorkflow(workflow)}
                        className={`d-flex justify-content-between align-items-center py-3 ${
                          selectedWorkflow?.id === workflow.id
                            ? "bg-info bg-opacity-10"
                            : ""
                        }`}
                        style={
                          {
                            "--bs-list-group-action-hover-bg":
                              "rgba(var(--bs-info-rgb), 0.1)",
                            "--bs-list-group-action-hover-color": "inherit",
                          } as React.CSSProperties
                        }
                      >
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{workflow.name}</span>
                          <small className="text-muted">
                            Inst. ID: {workflow.institutionId} • Steps:{" "}
                            {workflow.steps.length}
                          </small>
                        </div>
                        <Badge
                          bg={
                            selectedWorkflow?.id === workflow.id
                              ? "warning"
                              : "secondary"
                          }
                          text={
                            selectedWorkflow?.id === workflow.id
                              ? "dark"
                              : undefined
                          }
                        >
                          {workflow.steps.length}
                        </Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            {selectedWorkflow ? (
              <Card className="shadow-sm border-0 rounded-3">
                <Card.Header className="bg-light py-3 rounded-top-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Edit Workflow</h5>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => confirmDeleteWorkflow(selectedWorkflow.id)}
                  >
                    <FaTrash className="me-1" /> Delete
                  </Button>
                </Card.Header>
                <Card.Body className="p-4">
                  <Alert variant="info" className="border-0 bg-light-info">
                    <div className="d-flex">
                      <FaInfoCircle className="text-info me-2 fs-5 mt-1" />
                      <div>
                        <h6 className="alert-heading mb-1">Editing Workflow</h6>
                        Modify the workflow details and steps below. Changes are
                        saved automatically when you click the Save button.
                      </div>
                    </div>
                  </Alert>

                  <h5 className="mb-3 border-bottom pb-2">Workflow Details</h5>
                  <Row className="mb-4 bg-info bg-opacity-10 p-3 rounded">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Workflow Name
                        </Form.Label>
                        <Form.Control
                          value={selectedWorkflow.name}
                          onChange={(e) =>
                            handleUpdateWorkflow("name", e.target.value)
                          }
                          className="py-2 border-2"
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
                          value={selectedWorkflow.institutionId}
                          onChange={(e) =>
                            handleUpdateWorkflow(
                              "institutionId",
                              parseInt(e.target.value)
                            )
                          }
                          className="py-2 border-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h5 className="mb-3 border-bottom pb-2">Workflow Steps</h5>
                  <div className="mb-4">
                    <h6 className="mb-3 border-bottom pb-2 d-flex align-items-center">
                      <FaListOl className="me-2 text-primary" />
                      Workflow Steps
                      <Badge bg="primary" className="ms-2">
                        {selectedWorkflow.steps.length}
                      </Badge>
                    </h6>

                    {selectedWorkflow.steps.length > 0 ? (
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
                            {selectedWorkflow.steps.map((step) => (
                              <tr
                                key={
                                  step.id ?? `step-${step.order}-${step.roleId}`
                                }
                                className="border-top"
                              >
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
                                      title="Move Up"
                                    >
                                      <FaArrowUp />
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => moveStep(step.id!, "down")}
                                      disabled={
                                        step.order ===
                                        selectedWorkflow.steps.length
                                      }
                                      title="Move Down"
                                    >
                                      <FaArrowDown />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        confirmDeleteStep(step.id!)
                                      }
                                      title="Delete Step"
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
                    <Card className="bg-info bg-opacity-10 border-0 mt-3">
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

                  <div className="d-flex justify-content-between pt-3 border-top">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedWorkflow(null)}
                    >
                      <FaArrowLeft className="me-2" /> Back to List
                    </Button>

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
                            {formatDate(selectedWorkflow.createdAt)}
                          </span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex flex-column">
                          <small className="text-muted">Last Updated</small>
                          <span className="fw-semibold">
                            {formatDate(selectedWorkflow.updatedAt)}
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
                  <h5 className="mt-3 text-muted">Select a Workflow</h5>
                  <p className="text-muted mb-0">
                    Choose a workflow from the list to view and edit its details
                  </p>
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
            disabled={isSubmitting || !workflowToDelete}
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
    </AuthProvider>
  );
}
