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
  FaTrash,
  FaInfoCircle,
  FaListOl,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaPlusCircle,
} from "react-icons/fa";
import Navbar from "../../components/Navbar";
import { BASE_API_URL } from "../../static/apiConfig";
import AuthProvider from "../../authPages/tokenData";
import PageLoader from "@/app/components/PageLoader";

interface WorkflowStep {
  id?: number;
  order: number;
  hierarchyId: number | "";
  hierarchyName: string;
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

interface Hierarchy {
  id: number;
  name: string;
  description?: string;
  level?: number;
}

export default function WorkflowEditor() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  const [showStepDeleteModal, setShowStepDeleteModal] = useState(false);
  const [newStepHierarchyId, setNewStepHierarchyId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");

  // Fetch data
  const fetchWorkflow = async () => {
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
        // Map roleId to hierarchyId for frontend compatibility
        const workflowData = data.workflows;
        if (workflowData && workflowData.steps) {
          workflowData.steps = workflowData.steps.map((step: { roleId: number; roleName?: string }) => ({
            ...step,
            hierarchyId: step.roleId,
            hierarchyName: step.roleName || "",
          }));
        }
        setWorkflow(workflowData); // single workflow
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to fetch workflow: ${error}`);
    }
  };

  const fetchHierarchies = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/approval-hierarchy/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHierarchies(data);
      } else {
        toast.error(`Failed to fetch hierarchies: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to fetch hierarchies:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchWorkflow(), fetchHierarchies()]);
      setLoading(false);
    };
    fetchData();
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
          roleId: step.hierarchyId, // Backend expects roleId, but we're using hierarchyId
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
    if (!workflow || !newStepHierarchyId) return;
    const selectedHierarchy = hierarchies.find(
      (hierarchy) => hierarchy.id === Number(newStepHierarchyId)
    );
    if (!selectedHierarchy) return;

    const newStep: WorkflowStep = {
      order: workflow.steps.length + 1,
      hierarchyId: Number(newStepHierarchyId),
      hierarchyName: selectedHierarchy.name,
      isOptional: false,
    };

    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep],
    });

    setNewStepHierarchyId("");
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

  const toggleStepOptional = (stepId: number | undefined, stepOrder: number) => {
    if (!workflow) return;

    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((step) =>
        (stepId ? step.id === stepId : step.order === stepOrder)
          ? { ...step, isOptional: !step.isOptional }
          : step
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
      <Container fluid className="py-4">
        {/* Modern Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                  <Diagram3Fill className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="fw-bold text-dark mb-0">
                    Workflow Management
                  </h2>
                  <p className="text-muted mb-0 small">
                    Configure expense approval workflows and steps
                  </p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-2 border-primary opacity-25 mb-4" />
        </div>

        <Row>
          <Col lg={12}>
            {workflow ? (
              <Card className="shadow-lg border-0 rounded-3">
                <Card.Header className="bg-light py-4 rounded-top-3 d-flex justify-content-between align-items-center border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                      <Diagram3Fill className="text-primary" size={20} />
                    </div>
                    <h5 className="mb-0 fw-bold">Expense Approval Workflow</h5>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-pill px-3 py-2 fw-medium"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FaTrash className="me-1" /> Delete Workflow
                  </Button>
                </Card.Header>
                <Card.Body className="p-4">
                  <Alert
                    variant="info"
                    className="border-0 border-start border-3 border-info bg-info bg-opacity-10 mb-4"
                  >
                    <div className="d-flex">
                      <FaInfoCircle className="text-info me-3 fs-5 flex-shrink-0" />
                      <div>
                        <h6 className="alert-heading mb-2 fw-bold">Update Workflow</h6>
                        <p className="mb-0 small">
                          Modify the workflow name or add the steps required for
                          the workflow. Workflow steps represent the hierarchies that
                          will be assigned to it. These are the stages an expense
                          must go through before being paid by the finance
                          department.
                        </p>
                      </div>
                    </div>
                  </Alert>

                  <h6 className="mb-3 fw-bold text-dark d-flex align-items-center border-bottom pb-3">
                    <FaPencilAlt className="me-2 text-primary" />
                    Workflow Details
                  </h6>
                  <Card className="border-0 bg-light mb-4">
                    <Card.Body className="p-4">
                      <Form.Group className="mb-0">
                        <Form.Label className="fw-semibold text-dark">
                          Workflow Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={workflow.name}
                          onChange={(e) =>
                            handleUpdateWorkflow("name", e.target.value)
                          }
                          className="py-2 border-2 rounded-3"
                          placeholder="Enter workflow name"
                        />
                        <Form.Text className="text-muted">
                          Workflow name is required
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  <h6 className="mb-3 fw-bold text-dark d-flex align-items-center border-bottom pb-3">
                    <FaListOl className="me-2 text-primary" />
                    Workflow Steps
                    <Badge bg="primary" className="ms-2 rounded-pill px-3">
                      {workflow.steps.length}
                    </Badge>
                  </h6>
                  <div className="mb-4">

                    {workflow.steps.length > 0 ? (
                      <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                          <thead className="bg-light border-0">
                            <tr>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">ID</th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Order</th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Hierarchy</th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Status</th>
                              <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workflow.steps.map((step) => (
                              <tr key={step.id ?? `step-${step.order}`} className="border-bottom">
                                <td className="py-3 px-4">
                                  <span className="fw-semibold text-primary">{step.id}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    bg="primary"
                                    className="px-3 py-2 rounded-pill fw-semibold"
                                  >
                                    Step {step.order}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="fw-semibold text-dark">
                                      {
                                        hierarchies.find(
                                          (hierarchy) => hierarchy.id === step.hierarchyId
                                        )?.name
                                      }
                                    </div>
                                    <small className="text-muted">
                                      Hierarchy ID: {step.hierarchyId}
                                    </small>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Form.Check
                                    type="switch"
                                    id={`optional-switch-${step.id}`}
                                    label={
                                      step.isOptional ? (
                                        <Badge bg="warning" className="px-2 py-1">Optional</Badge>
                                      ) : (
                                        <Badge bg="success" className="px-2 py-1">Required</Badge>
                                      )
                                    }
                                    checked={step.isOptional}
                                    onChange={() =>
                                      toggleStepOptional(step.id, step.order)
                                    }
                                  />
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="d-flex gap-2 justify-content-center">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="rounded-pill px-3"
                                      onClick={() => moveStep(step.id!, "up")}
                                      disabled={step.order === 1}
                                      title="Move Up"
                                    >
                                      <FaArrowUp />
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="rounded-pill px-3"
                                      onClick={() => moveStep(step.id!, "down")}
                                      disabled={
                                        step.order === workflow.steps.length
                                      }
                                      title="Move Down"
                                    >
                                      <FaArrowDown />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="rounded-pill px-3"
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
                      <div className="text-center py-5 bg-light rounded-3">
                        <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                          <FaListOl className="text-primary" size={32} />
                        </div>
                        <p className="mt-2 text-dark fw-semibold mb-1">
                          No steps in this workflow
                        </p>
                        <p className="text-muted mb-0 small">
                          Add steps using the form below to define your approval process
                        </p>
                      </div>
                    )}

                    <Card className="bg-primary bg-opacity-10 border-0 mt-4 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-opacity-25 p-2 rounded-circle me-2">
                            <FaPlusCircle className="text-primary" size={16} />
                          </div>
                          <Form.Label className="fw-bold text-dark mb-0">
                            Add New Step
                          </Form.Label>
                        </div>
                        <Row className="align-items-end">
                          <Col md={9}>
                            <Form.Group>
                              <Form.Label className="fw-semibold text-dark small">
                                Select Hierarchy <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Select
                                value={newStepHierarchyId}
                                onChange={(e) => setNewStepHierarchyId(e.target.value)}
                                className="py-2 border-2 rounded-3"
                              >
                                <option value="">Choose a hierarchy for this step</option>
                                {hierarchies.map((hierarchy) => (
                                  <option key={hierarchy.id} value={hierarchy.id}>
                                    {hierarchy.name}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Button
                              onClick={handleAddStep}
                              disabled={!newStepHierarchyId}
                              className="w-100 d-flex align-items-center justify-content-center py-2 rounded-3 fw-semibold"
                              variant="primary"
                            >
                              <FaPlusCircle className="me-2" /> Add Step
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="d-flex justify-content-end pt-4 mt-4 border-top">
                    <Button
                      onClick={handleSaveWorkflow}
                      variant="primary"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-pill fw-semibold shadow-sm"
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
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-2" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-top">
                    <h6 className="mb-3 fw-bold text-dark d-flex align-items-center">
                      <FaInfoCircle className="me-2 text-primary" />
                      Workflow Metadata
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Card className="border-0 bg-light h-100">
                          <Card.Body className="p-3">
                            <small className="text-muted fw-semibold d-block mb-1">Created At</small>
                            <span className="fw-bold text-dark">
                              {formatDate(workflow.createdAt)}
                            </span>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-0 bg-light h-100">
                          <Card.Body className="p-3">
                            <small className="text-muted fw-semibold d-block mb-1">Last Updated</small>
                            <span className="fw-bold text-dark">
                              {formatDate(workflow.updatedAt)}
                            </span>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            ) : (
              <Card className="rounded-3 text-center h-100 border-0 shadow-lg">
                <Card.Body className="d-flex flex-column justify-content-center align-items-center py-5">
                  <div className="bg-primary bg-opacity-10 p-4 rounded-circle mb-4">
                    <Diagram3Fill className="text-primary" size={48} />
                  </div>
                  <h5 className="fw-bold text-dark mb-2">No Workflow Found</h5>
                  <p className="text-muted mb-4">
                    Create your first expense approval workflow to get started.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-pill fw-semibold shadow-sm"
                  >
                    <PlusCircle className="me-2" />
                    Create Workflow
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Delete Workflow Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="xl">
        <Modal.Header
          closeButton
          className="border-0 pb-0 pt-4 px-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
            <div
              className="icon-wrapper bg-danger me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              <FaTrash className="text-white" size={24} />
            </div>
            <div>
              Confirm Deletion
              <div className="text-muted fw-normal small">
                This action cannot be undone
              </div>
            </div>
          </h5>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <p className="text-dark mb-3">
            Are you sure you want to delete this workflow? This action cannot be
            undone.
          </p>
          <Alert variant="warning" className="mb-0 border-0 border-start border-3 border-warning">
            <FaExclamationTriangle className="me-2" />
            All steps associated with this workflow will also be permanently
            deleted.
          </Alert>
        </Modal.Body>
        <Modal.Footer
          className="border-0 pt-0 px-4 pb-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-3 fw-semibold"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDeleteWorkflow}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-3 fw-semibold"
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
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete Workflow
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Step Confirmation Modal */}
      <Modal
        show={showStepDeleteModal}
        onHide={() => setShowStepDeleteModal(false)}
        size="xl"
      >
        <Modal.Header
          closeButton
          className="border-0 pb-0 pt-4 px-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
            <div
              className="icon-wrapper bg-danger me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              <FaTrash className="text-white" size={24} />
            </div>
            <div>
              Delete Step
              <div className="text-muted fw-normal small">
                Remove this step from workflow
              </div>
            </div>
          </h5>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <p className="text-dark mb-0">
            Are you sure you want to remove this step from the workflow? The remaining steps will be automatically reordered.
          </p>
        </Modal.Body>
        <Modal.Footer
          className="border-0 pt-0 px-4 pb-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setShowStepDeleteModal(false)}
            className="px-4 py-2 rounded-3 fw-semibold"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => stepToDelete && handleDeleteStep(stepToDelete)}
            className="px-4 py-2 rounded-3 fw-semibold"
          >
            <FaTrash className="me-2" />
            Delete Step
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Workflow Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="xl"
      >
        <Form onSubmit={handleCreateWorkflow}>
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
                <PlusCircle size={24} className="text-white" />
              </div>
              <div>
                Create New Workflow
                <div className="text-muted fw-normal small">
                  Define a new expense approval workflow
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body className="px-4 py-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark">
                Workflow Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                required
                maxLength={100}
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="py-2 border-2 rounded-3"
                placeholder="e.g., Standard Expense Approval"
              />
              <Form.Text className="text-muted">
                Give your workflow a descriptive name (max 100 characters).
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer
            className="border-0 pt-0 px-4 pb-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-3 fw-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              className="px-4 py-2 rounded-3 fw-semibold"
              disabled={isSubmitting}
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
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="me-2" />
                  Create Workflow
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AuthProvider>
  );
}
