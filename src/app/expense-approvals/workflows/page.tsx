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

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Role {
  id: number;
  name: string;
}

interface WorkflowStepAssignment {
  stepOrder: number;
  userId: number;
  user?: User;
}

interface HierarchyAssignment {
  id: number;
  hierarchyId: number;
  hierarchyLevelId: number | null;
  userId: number;
  order: number;
  hierarchy?: {
    id: number;
    name: string;
  };
  user?: User;
  level?: HierarchyLevel;
  hierarchyLevel?: {
    id: number;
    order: number;
    role: Role;
    hierarchy: {
      id: number;
      name: string;
    };
  };
}

interface HierarchyLevel {
  id: number;
  order: number;
  approverCount: number;
  roleId: number;
  role: Role;
  assignments?: HierarchyAssignment[];
}

interface Hierarchy {
  id: number;
  name: string;
  description?: string;
  levels: HierarchyLevel[];
}

interface WorkflowStep {
  id?: number;
  order: number;
  roleId: number;
  roleName?: string;
  isOptional: boolean;
  assignedUserId?: number;
}

interface Workflow {
  id: number;
  name: string;
  institutionId: number;
  approvalHierarchyId?: number;
  steps: WorkflowStep[];
  createdAt?: string;
  updatedAt?: string;
}

export default function WorkflowEditor() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedHierarchyId, setSelectedHierarchyId] = useState<number | null>(null);
  const [allAssignments, setAllAssignments] = useState<HierarchyAssignment[]>([]);
  const [queuedHierarchies, setQueuedHierarchies] = useState<Hierarchy[]>([]);

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
        const workflowData = data.workflows;
        setWorkflow(workflowData);
        if (workflowData?.approvalHierarchyId) {
          setSelectedHierarchyId(workflowData.approvalHierarchyId);
        }
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
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Fetch detailed hierarchy data including assignments for each hierarchy
        const hierarchiesWithAssignments = await Promise.all(
          data.map(async (hierarchy: Hierarchy) => {
            try {
              const detailResponse = await fetch(
                `${BASE_API_URL}/approval-hierarchy/${hierarchy.id}`,
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

              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                return detailData;
              }
              return hierarchy;
            } catch (error) {
              console.error(`Failed to fetch details for hierarchy ${hierarchy.id}:`, error);
              return hierarchy;
            }
          })
        );

        setHierarchies(hierarchiesWithAssignments);
      } else {
        toast.error(`Failed to fetch hierarchies: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to fetch hierarchies:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/users`, {
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
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAllAssignments = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/approval-hierarchy/assignments/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await response.json();
      console.log("Fetched assignments:", data);
      if (response.ok) {
        setAllAssignments(data);
        console.log("Total assignments loaded:", data.length);
      } else {
        console.error("Failed to fetch assignments:", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchWorkflow(), fetchHierarchies(), fetchUsers(), fetchAllAssignments()]);
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

  // Queue hierarchy operations
  const handleAddHierarchyToQueue = (hierarchyId: number) => {
    const hierarchy = hierarchies.find(h => h.id === hierarchyId);
    if (!hierarchy) return;

    // Check if already in queue
    if (queuedHierarchies.some(h => h.id === hierarchyId)) {
      toast.warning(`${hierarchy.name} is already in the queue`);
      return;
    }

    setQueuedHierarchies([...queuedHierarchies, hierarchy]);
    toast.success(`${hierarchy.name} added to queue`);
    setSelectedHierarchyId(null); // Reset selection
  };

  const handleRemoveFromQueue = (hierarchyId: number) => {
    setQueuedHierarchies(queuedHierarchies.filter(h => h.id !== hierarchyId));
    toast.info("Hierarchy removed from queue");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...queuedHierarchies];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    setQueuedHierarchies(newQueue);
  };

  const handleMoveDown = (index: number) => {
    if (index === queuedHierarchies.length - 1) return;
    const newQueue = [...queuedHierarchies];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    setQueuedHierarchies(newQueue);
  };

  const handleClearQueue = () => {
    setQueuedHierarchies([]);
    toast.info("Queue cleared");
  };

  const handleSaveWorkflow = async () => {
    if (!workflow) return;

    if (queuedHierarchies.length === 0) {
      toast.error("Please add at least one hierarchy to the queue");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send queued hierarchies to backend in order
      const hierarchyIds = queuedHierarchies.map(h => h.id);

      const payload = {
        name: workflow.name,
        hierarchyIds: hierarchyIds, // Send array of hierarchy IDs in order
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
        toast.success("Workflow with queued hierarchies saved successfully!");
        setQueuedHierarchies([]); // Clear queue after successful save
        await Promise.all([fetchWorkflow(), fetchAllAssignments()]); // Refresh both workflow and assignments
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error("Failed to update workflow: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStepOptional = (stepOrder: number) => {
    if (!workflow) return;

    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((step) =>
        step.order === stepOrder
          ? { ...step, isOptional: !step.isOptional }
          : step
      ),
    });
  };

  const handleDeleteStep = (stepOrder: number) => {
    if (!workflow) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete Step ${stepOrder}? This will remove this approval level from the workflow.`)) {
      return;
    }

    // Remove the step from the workflow
    const updatedSteps = workflow.steps.filter(step => step.order !== stepOrder);

    // Reorder remaining steps to maintain sequential order
    const reorderedSteps = updatedSteps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));

    setWorkflow({
      ...workflow,
      steps: reorderedSteps,
    });

    toast.success(`Step ${stepOrder} deleted successfully. Don't forget to save changes!`);
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
                </Card.Header>
                <Card.Body className="p-4">
                  <Alert
                    variant="info"
                    className="border-0 border-start border-3 border-info bg-info bg-opacity-10 mb-4"
                  >
                    <div className="d-flex">
                      <FaInfoCircle className="text-info me-3 fs-5 flex-shrink-0" />
                      <div>
                        <h6 className="alert-heading mb-2 fw-bold">
                          Update Workflow
                        </h6>
                        <p className="mb-0 small">
                          Modify the workflow name and select the approval hierarchy.
                          The workflow steps represent the stages an expense must
                          go through before being paid by the finance department.
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
                    Approval Hierarchy Queue
                  </h6>
                  <Card className="border-0 bg-light mb-4">
                    <Card.Body className="p-4">
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Select Approval Hierarchy to Add <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Select
                            value={selectedHierarchyId || ""}
                            required
                            onChange={(e) => setSelectedHierarchyId(Number(e.target.value) || null)}
                            className="py-2 border-2 rounded-3"
                          >
                            <option value=""></option>
                            {hierarchies.map((hierarchy) => (
                              <option key={hierarchy.id} value={hierarchy.id}>
                                {hierarchy.name}
                              </option>
                            ))}
                          </Form.Select>
                          <Button
                            variant="primary"
                            onClick={() => selectedHierarchyId && handleAddHierarchyToQueue(selectedHierarchyId)}
                            disabled={!selectedHierarchyId}
                            className="px-4 rounded-3"
                          >
                            <FaPlusCircle className="me-2" />
                            Add to Queue
                          </Button>
                        </div>
                        <Form.Text className="text-muted">
                          Select hierarchies one by one and add them to the queue in order
                        </Form.Text>
                      </Form.Group>

                      {/* Queue Preview */}
                      {queuedHierarchies.length > 0 && (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                            <h6 className="mb-0 fw-bold text-dark">Queued Hierarchies ({queuedHierarchies.length})</h6>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={handleClearQueue}
                              className="rounded-3"
                            >
                              Clear All
                            </Button>
                          </div>
                          <Alert variant="success" className="border-0 mb-3">
                            <FaCheckCircle className="me-2" />
                            Hierarchies will be saved in this order when you click "Save Changes"
                          </Alert>
                          <div className="list-group">
                            {queuedHierarchies.map((hierarchy, index) => (
                              <div
                                key={hierarchy.id}
                                className="list-group-item d-flex justify-content-between align-items-center py-3"
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <Badge bg="primary" className="px-3 py-2 fs-6">
                                    {index + 1}
                                  </Badge>
                                  <div>
                                    <strong className="text-dark">{hierarchy.name}</strong>
                                    {hierarchy.description && (
                                      <p className="text-muted mb-0 small">{hierarchy.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    title="Move up"
                                  >
                                    <FaArrowUp />
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === queuedHierarchies.length - 1}
                                    title="Move down"
                                  >
                                    <FaArrowDown />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveFromQueue(hierarchy.id)}
                                    title="Remove from queue"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {queuedHierarchies.length === 0 && (
                        <Alert variant="warning" className="mt-3 mb-0">
                          <FaInfoCircle className="me-2" />
                          No hierarchies in queue. Add hierarchies above to preview the order.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>

                  {workflow.steps && workflow.steps.length > 0 && (
                    <>
                      <h6 className="mb-3 fw-bold text-dark d-flex align-items-center border-bottom pb-3">
                        <FaCheckCircle className="me-2 text-primary" />
                        Workflow Steps Configuration
                      </h6>
                      <Alert variant="info" className="border-0 mb-3">
                        <FaInfoCircle className="me-2" />
                        Configure whether each approval step is required or optional. User assignments are managed in the Approval Hierarchies page.
                      </Alert>
                      <Table hover className="align-middle">
                        <thead className="bg-light">
                          <tr>
                            <th className="py-3">Step Order</th>
                            <th className="py-3">Role</th>
                            <th className="py-3">Required/Optional</th>
                            <th className="py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workflow.steps
                            .sort((a, b) => a.order - b.order)
                            .map((step) => {
                              const selectedHierarchy = hierarchies.find(h => h.id === selectedHierarchyId);
                              const level = selectedHierarchy?.levels.find(l => l.order === step.order);
                              const role = level?.role || { name: `Role ${step.roleId}` };
                              return (
                                <tr key={step.order}>
                                  <td>
                                    <Badge bg="primary" className="px-3 py-2">
                                      Step {step.order}
                                    </Badge>
                                  </td>
                                  <td>
                                    <strong>{role.name}</strong>
                                  </td>
                                  <td>
                                    <Form.Check
                                      type="switch"
                                      id={`optional-switch-${step.order}`}
                                      label={
                                        step.isOptional ? (
                                          <Badge bg="warning" className="px-2 py-1">
                                            Optional
                                          </Badge>
                                        ) : (
                                          <Badge bg="success" className="px-2 py-1">
                                            Required
                                          </Badge>
                                        )
                                      }
                                      checked={step.isOptional}
                                      onChange={() => toggleStepOptional(step.order)}
                                    />
                                  </td>
                                  <td className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline-danger"
                                      onClick={() => handleDeleteStep(step.order)}
                                      title="Delete this step"
                                    >
                                      <FaTrash />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </Table>
                    </>
                  )}

                  {/* Display All Hierarchy Assignments */}
                  <h6 className="mb-3 mt-4 fw-bold text-dark d-flex align-items-center border-bottom pb-3">
                    <FaListOl className="me-2 text-primary" />
                    All Hierarchy Assignments
                  </h6>
                  {allAssignments.length > 0 ? (
                    <>
                      <Alert variant="info" className="border-0 mb-3">
                        <FaInfoCircle className="me-2" />
                        Data from HierarchyAssignment table
                      </Alert>
                      <Table hover className="align-middle">
                        <thead className="bg-light">
                          <tr>
                            <th className="py-3">Order</th>
                            <th className="py-3">Hierarchy Name</th>
                            <th className="py-3">User ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAssignments.map((assignment) => (
                            <tr key={assignment.id}>
                              <td>
                                <Badge bg="primary" className="px-3 py-2 fs-6">
                                  {assignment.order}
                                </Badge>
                              </td>
                              <td>
                                <strong className="text-dark">
                                  {assignment.hierarchy?.name || 'Unknown Hierarchy'}
                                </strong>
                              </td>
                              <td>
                                <Badge bg="info" className="px-2 py-1">
                                  {assignment.userId}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </>
                  ) : (
                    <Alert variant="warning" className="border-0 mb-3">
                      <FaInfoCircle className="me-2" />
                      No hierarchy assignments found in the database.
                    </Alert>
                  )}

                  <div className="d-flex justify-content-end pt-4 mt-4 border-top">
                    <Button
                      onClick={handleSaveWorkflow}
                      variant="primary"
                      disabled={isSubmitting || queuedHierarchies.length === 0}
                      className="px-4 py-2 rounded-pill fw-semibold shadow-sm"
                      title={queuedHierarchies.length === 0 ? "Please add at least one hierarchy to the queue" : ""}
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
                            <small className="text-muted fw-semibold d-block mb-1">
                              Created At
                            </small>
                            <span className="fw-bold text-dark">
                              {formatDate(workflow.createdAt)}
                            </span>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-0 bg-light h-100">
                          <Card.Body className="p-3">
                            <small className="text-muted fw-semibold d-block mb-1">
                              Last Updated
                            </small>
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
