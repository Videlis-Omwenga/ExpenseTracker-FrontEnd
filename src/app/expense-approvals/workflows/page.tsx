"use client";

import React, { useState, useEffect } from "react";
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
  FaBuilding,
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

interface Department {
  id: number;
  name: string;
}

interface HierarchyAssignment {
  id: number;
  hierarchyId: number;
  hierarchyLevelId: number | null;
  userId: number;
  order: number;
  isRequired: boolean;
  restrictToDepartment: boolean;
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
  departmentsRestrictedTo?: {
    id: number;
    departmentId: number;
    department: Department;
  }[];
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
  const [selectedHierarchyId, setSelectedHierarchyId] = useState<number | null>(null);
  const [allAssignments, setAllAssignments] = useState<HierarchyAssignment[]>([]);
  const [queuedHierarchies, setQueuedHierarchies] = useState<Hierarchy[]>([]);
  const [hierarchyOptionalSettings, setHierarchyOptionalSettings] = useState<Record<number, boolean>>({});
  const [hierarchyDepartmentRestrictions, setHierarchyDepartmentRestrictions] = useState<Record<number, { restrictToDepartment: boolean }>>({});

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
    // Clean up settings for removed hierarchy
    const newOptionalSettings = { ...hierarchyOptionalSettings };
    delete newOptionalSettings[hierarchyId];
    setHierarchyOptionalSettings(newOptionalSettings);

    const newDeptRestrictions = { ...hierarchyDepartmentRestrictions };
    delete newDeptRestrictions[hierarchyId];
    setHierarchyDepartmentRestrictions(newDeptRestrictions);

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
    setHierarchyOptionalSettings({});
    setHierarchyDepartmentRestrictions({});
    toast.info("Queue cleared");
  };

  const toggleHierarchyOptional = (hierarchyId: number) => {
    setHierarchyOptionalSettings(prev => ({
      ...prev,
      [hierarchyId]: !(prev[hierarchyId] || false)
    }));
  };

  const toggleDepartmentRestriction = (hierarchyId: number) => {
    setHierarchyDepartmentRestrictions(prev => ({
      ...prev,
      [hierarchyId]: {
        restrictToDepartment: !(prev[hierarchyId]?.restrictToDepartment || false)
      }
    }));
  };


  const handleSaveWorkflow = async () => {
    if (!workflow) return;

    if (queuedHierarchies.length === 0) {
      toast.error("Please add at least one hierarchy to the queue");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build hierarchies data with isRequired and department restriction settings
      const hierarchiesData = queuedHierarchies.map((hierarchy, index) => {
        const deptRestriction = hierarchyDepartmentRestrictions[hierarchy.id] || { restrictToDepartment: false };

        return {
          hierarchyId: hierarchy.id,
          order: index + 1,
          isRequired: !(hierarchyOptionalSettings[hierarchy.id] || false),
          restrictToDepartment: deptRestriction.restrictToDepartment
        };
      });

      const payload = {
        name: workflow.name,
        hierarchies: hierarchiesData,
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

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
        setQueuedHierarchies([]);
        setHierarchyOptionalSettings({});
        setHierarchyDepartmentRestrictions({});
        await Promise.all([fetchWorkflow(), fetchAllAssignments()]);
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

    if (!confirm(`Are you sure you want to delete Step ${stepOrder}? This will remove this approval level from the workflow.`)) {
      return;
    }

    const updatedSteps = workflow.steps.filter(step => step.order !== stepOrder);
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
      <Container fluid className="workflows-container px-4 py-4">
        {/* Header Section */}
        <Row className="mb-4">
          <Col>
            <Card className="page-header-card shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="page-title mb-1">
                      <Diagram3Fill className="me-2 text-primary" />
                      Workflow Management
                    </h4>
                    <p className="page-subtitle text-muted mb-0">
                      Configure expense approval workflows and hierarchies
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* LEFT SIDE: All Hierarchy Assignments */}
          <Col lg={5}>
            <Card className="shadow-sm border-0 rounded-3 h-100">
              <Card.Header className="bg-light py-3 border-bottom">
                <div className="d-flex align-items-center">
                  <FaListOl className="me-2 text-primary" size={18} />
                  <h6 className="mb-0 fw-bold">Current Workflow Assignments</h6>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {allAssignments.length > 0 ? (
                  <>
                    <Alert variant="info" className="border-0 mb-3 small">
                      <FaInfoCircle className="me-2" />
                      Active hierarchies in the workflow queue
                    </Alert>
                    <div className="table-responsive">
                      <Table hover className="align-middle mb-0 table-modern">
                        <thead className="bg-light">
                          <tr>
                            <th className="py-2 small">Order</th>
                            <th className="py-2 small">Hierarchy</th>
                            <th className="py-2 small">Status</th>
                            <th className="py-2 small">Dept.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAssignments.map((assignment) => (
                            <React.Fragment key={assignment.id}>
                              <tr>
                                <td>
                                  <Badge bg="primary" className="px-2 py-1 small">
                                    {assignment.order}
                                  </Badge>
                                </td>
                                <td>
                                  <strong className="text-dark small">
                                    {assignment.hierarchy?.name || 'Unknown'}
                                  </strong>
                                </td>
                                <td>
                                  {assignment.isRequired ? (
                                    <Badge bg="success" className="px-2 py-1 small">
                                      Required
                                    </Badge>
                                  ) : (
                                    <Badge bg="warning" className="px-2 py-1 small">
                                      Optional
                                    </Badge>
                                  )}
                                </td>
                                <td>
                                  {assignment.restrictToDepartment ? (
                                    <Badge bg="warning" className="px-2 py-1 small">
                                      <FaBuilding className="me-1" size={10} />
                                      Restricted
                                    </Badge>
                                  ) : (
                                    <Badge bg="secondary" className="px-2 py-1 small">
                                      Not Restricted
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <Alert variant="warning" className="border-0 mb-0">
                    <FaInfoCircle className="me-2" />
                    No hierarchies assigned to workflow yet. Add hierarchies using the form on the right.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT SIDE: Update Workflow */}
          <Col lg={7}>
            {workflow ? (
              <Card className="shadow-sm border-0 rounded-3">
                <Card.Header className="bg-light py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <Diagram3Fill className="text-primary" size={18} />
                    </div>
                    <h6 className="mb-0 fw-bold">Update Workflow</h6>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  {/* Workflow Name Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                        <FaPencilAlt className="text-primary" size={15} />
                      </div>
                      <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '1rem' }}>Workflow Details</h6>
                    </div>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                        Workflow Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        value={workflow.name}
                        onChange={(e) =>
                          handleUpdateWorkflow("name", e.target.value)
                        }
                        className="py-2 rounded-3"
                        style={{ fontSize: '0.95rem' }}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Enter a descriptive name for this workflow
                      </Form.Text>
                    </Form.Group>
                  </div>

                  <hr className="my-4" />

                  {/* Add Hierarchy Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                        <FaPlusCircle className="text-success" size={15} />
                      </div>
                      <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '1rem' }}>Add Hierarchy to Queue</h6>
                    </div>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                        Select Approval Hierarchy
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          value={selectedHierarchyId || ""}
                          required
                          onChange={(e) => setSelectedHierarchyId(Number(e.target.value) || null)}
                          className="py-2 rounded-3 flex-grow-1"
                          style={{ fontSize: '0.95rem' }}
                        >
                          <option value=""></option>
                          {hierarchies.map((hierarchy) => (
                            <option key={hierarchy.id} value={hierarchy.id}>
                              {hierarchy.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="success"
                          onClick={() => selectedHierarchyId && handleAddHierarchyToQueue(selectedHierarchyId)}
                          disabled={!selectedHierarchyId}
                          className="px-3 rounded-3 d-flex align-items-center"
                          style={{ fontSize: '0.9rem' }}
                        >
                          <FaPlusCircle className="me-2" size={16} />
                          Add
                        </Button>
                      </div>
                      <Form.Text className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Choose hierarchies to add in the order they should be processed
                      </Form.Text>
                    </Form.Group>
                  </div>

                  {/* Queued Hierarchies Section */}
                  {queuedHierarchies.length > 0 && (
                    <div className="mb-4">
                      <hr className="my-4" />
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-gradient-blue p-2 rounded-circle me-2">
                            <FaListOl className="text-white" size={15} />
                          </div>
                          <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '1rem' }}>
                            Queue Preview <span className="badge bg-primary bg-opacity-10 text-primary ms-2">{queuedHierarchies.length}</span>
                          </h6>
                        </div>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={handleClearQueue}
                          className="btn-soft-danger"
                        >
                          <FaTrash className="me-2" size={12} />
                          Clear Queue
                        </Button>
                      </div>

                      <div className="queue-container">
                        {queuedHierarchies.map((hierarchy, index) => {
                          const deptRestriction = hierarchyDepartmentRestrictions[hierarchy.id] || { restrictToDepartment: false };
                          const isOptional = hierarchyOptionalSettings[hierarchy.id] || false;

                          return (
                            <div key={hierarchy.id} className="queue-item">
                              <div className="queue-item-header">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="queue-number">{index + 1}</div>
                                  <div className="flex-grow-1">
                                    <h6 className="queue-title">{hierarchy.name}</h6>
                                    {hierarchy.description && (
                                      <p className="queue-description">{hierarchy.description}</p>
                                    )}
                                  </div>
                                  <div className="queue-badges">
                                    <Badge 
                                      bg={isOptional ? "warning" : "success"} 
                                      className="queue-badge"
                                    >
                                      {isOptional ? "Optional" : "Required"}
                                    </Badge>
                                    {deptRestriction.restrictToDepartment && (
                                      <Badge bg="info" className="queue-badge ms-2">
                                        <FaBuilding className="me-1" size={10} />
                                        Department Restricted
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="queue-item-body">
                                <div className="queue-controls">
                                  <Form.Check
                                    type="switch"
                                    id={`queue-optional-${hierarchy.id}`}
                                    label="Make step optional"
                                    checked={isOptional}
                                    onChange={() => toggleHierarchyOptional(hierarchy.id)}
                                    className="modern-switch"
                                  />
                                  <Form.Check
                                    type="switch"
                                    id={`dept-restrict-${hierarchy.id}`}
                                    label="Restrict to departments"
                                    checked={deptRestriction.restrictToDepartment}
                                    onChange={() => toggleDepartmentRestriction(hierarchy.id)}
                                    className="modern-switch"
                                  />
                                </div>
                              </div>

                              <div className="queue-item-actions">
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleMoveUp(index)}
                                  disabled={index === 0}
                                  className="btn-action"
                                >
                                  <FaArrowUp size={12} />
                                </Button>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleMoveDown(index)}
                                  disabled={index === queuedHierarchies.length - 1}
                                  className="btn-action"
                                >
                                  <FaArrowDown size={12} />
                                </Button>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleRemoveFromQueue(hierarchy.id)}
                                  className="btn-action btn-action-danger"
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {queuedHierarchies.length === 0 && (
                    <Alert variant="info" className="border-0 bg-info bg-opacity-10 mb-4" style={{ fontSize: '0.9rem' }}>
                      <FaInfoCircle className="me-2" />
                      No hierarchies in queue. Select a hierarchy above to get started.
                    </Alert>
                  )}

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
                      <Table hover className="align-middle table-modern">
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
              <Card className="rounded-3 text-center h-100 border-0 shadow-lg empty-state">
                <Card.Body className="d-flex flex-column justify-content-center align-items-center py-5">
                  <div className="bg-primary bg-opacity-10 p-4 rounded-circle mb-4 empty-state-icon">
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

      <style jsx global>{`
        /* Container Styles */
        .workflows-container {
          background-color: #f8fafc;
          min-height: calc(100vh - 56px);
        }

        /* Header Card */
        .page-header-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
          border-radius: 1rem;
          transition: transform 0.2s ease;
        }

        .page-header-card:hover {
          transform: translateY(-2px);
        }

        .page-title {
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(45deg, #0d6efd, #0dcaf0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        /* Card Styles */
        .card {
          border-radius: 1rem;
          transition: all 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
        }

        .card-header {
          border-radius: 1rem 1rem 0 0 !important;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        }

        /* Table Styles */
        .table-modern {
          border-collapse: separate;
          border-spacing: 0 0.5rem;
        }

        .table-modern thead th {
          padding: 1rem 1.2rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          background-color: #f1f5f9;
          border: none;
          color: #64748b;
        }

        .table-modern tbody tr {
          background: white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
        }

        .table-modern tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
        }

        /* Form Controls */
        .form-control, .form-select {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .form-control:focus, .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Badges */
        .badge {
          font-weight: 600;
          letter-spacing: 0.3px;
          padding: 0.5em 0.75em;
        }

        /* Buttons */
        .btn {
          font-weight: 600;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn-icon {
          width: 35px;
          height: 35px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        /* Alert Styles */
        .alert {
          border-radius: 0.75rem;
          border: none;
          padding: 1rem 1.25rem;
        }

        /* Switch Controls */
        .form-switch {
          padding-left: 2.5rem;
        }

        .form-switch .form-check-input {
          width: 2rem;
          height: 1rem;
          border-radius: 2rem;
          background-color: #e2e8f0;
          border: none;
        }

        .form-switch .form-check-input:checked {
          background-color: #3b82f6;
        }

        /* Modal Styling */
        .modal-content {
          border: none;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          border: none;
          padding: 1.5rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          border: none;
          padding: 1.5rem;
        }

        /* Queue Item Styles */
        .queue-item {
          background: white;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .queue-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }

        .queue-item-header {
          padding: 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .queue-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d6efd;
          color: white;
          font-weight: 600;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .queue-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }

        .queue-description {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        .queue-badge {
          font-size: 0.75rem;
          padding: 0.35em 0.65em;
          font-weight: 600;
        }

        .queue-item-body {
          padding: 1rem;
        }

        .queue-controls {
          display: flex;
          gap: 2rem;
        }

        .queue-item-actions {
          padding: 0.75rem;
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn-action {
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          background: white;
          border: 1px solid #e5e7eb;
        }

        .btn-action:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .btn-action-danger {
          color: #dc3545;
        }

        .btn-action-danger:hover {
          background: #dc354510;
          color: #dc3545;
        }

        .modern-switch .form-check-input {
          height: 1.25rem;
          width: 2.25rem;
          border-radius: 2rem;
        }

        .modern-switch .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .bg-gradient-blue {
          background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
        }

        .btn-soft-danger {
          color: #dc3545;
          background-color: #dc354520;
          border: none;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .btn-soft-danger:hover {
          background-color: #dc354530;
          color: #dc3545;
        }

        .queue-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>
    </AuthProvider>
  );
}
