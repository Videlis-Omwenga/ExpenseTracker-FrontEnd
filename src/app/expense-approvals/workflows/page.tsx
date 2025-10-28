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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [selectedHierarchyId, setSelectedHierarchyId] = useState<number | null>(null);
  const [allAssignments, setAllAssignments] = useState<HierarchyAssignment[]>([]);
  const [queuedHierarchies, setQueuedHierarchies] = useState<Hierarchy[]>([]);
  const [hierarchyOptionalSettings, setHierarchyOptionalSettings] = useState<Record<number, boolean>>({});
  const [hierarchyDepartmentRestrictions, setHierarchyDepartmentRestrictions] = useState<Record<number, { restrictToDepartment: boolean; departmentIds: number[] }>>({});

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/data-inputs/get-departments`, {
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
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
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
      await Promise.all([fetchWorkflow(), fetchHierarchies(), fetchUsers(), fetchDepartments(), fetchAllAssignments()]);
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
        restrictToDepartment: !(prev[hierarchyId]?.restrictToDepartment || false),
        departmentIds: prev[hierarchyId]?.departmentIds || []
      }
    }));
  };

  const handleDepartmentSelection = (hierarchyId: number, departmentId: number) => {
    setHierarchyDepartmentRestrictions(prev => {
      const current = prev[hierarchyId] || { restrictToDepartment: false, departmentIds: [] };
      const departmentIds = current.departmentIds.includes(departmentId)
        ? current.departmentIds.filter(id => id !== departmentId)
        : [...current.departmentIds, departmentId];

      return {
        ...prev,
        [hierarchyId]: {
          ...current,
          departmentIds
        }
      };
    });
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
        const deptRestriction = hierarchyDepartmentRestrictions[hierarchy.id] || { restrictToDepartment: false, departmentIds: [] };

        return {
          hierarchyId: hierarchy.id,
          order: index + 1,
          isRequired: !(hierarchyOptionalSettings[hierarchy.id] || false),
          restrictToDepartment: deptRestriction.restrictToDepartment,
          departmentIds: deptRestriction.restrictToDepartment ? deptRestriction.departmentIds : []
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
      <Container fluid className="py-4">
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
                      <Table hover className="align-middle mb-0">
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
                                    <Badge bg="info" className="px-2 py-1 small" title="Restricted to specific departments">
                                      <FaBuilding className="me-1" size={10} />
                                      {assignment.departmentsRestrictedTo?.length || 0}
                                    </Badge>
                                  ) : (
                                    <Badge bg="secondary" className="px-2 py-1 small" title="All departments">
                                      All
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                              {assignment.restrictToDepartment && assignment.departmentsRestrictedTo && assignment.departmentsRestrictedTo.length > 0 && (
                                <tr className="bg-light">
                                  <td colSpan={4} className="py-2 ps-5">
                                    <div className="d-flex flex-wrap gap-1">
                                      <small className="text-muted me-2">Departments:</small>
                                      {assignment.departmentsRestrictedTo.map((dr) => (
                                        <Badge key={dr.id} bg="secondary" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                          {dr.department.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
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
                          <option value="">-- Select a hierarchy --</option>
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
                          <div className="bg-warning bg-opacity-10 p-2 rounded me-2">
                            <FaListOl className="text-warning" size={15} />
                          </div>
                          <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '1rem' }}>
                            Queue Preview ({queuedHierarchies.length})
                          </h6>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleClearQueue}
                          className="rounded-pill px-3"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <FaTrash className="me-1" size={11} />
                          Clear All
                        </Button>
                      </div>
                      <Alert variant="success" className="border-0 bg-success bg-opacity-10 mb-3" style={{ fontSize: '0.9rem' }}>
                        <FaCheckCircle className="me-2" />
                        Click "Save Changes" to apply this order
                      </Alert>
                      <div className="d-flex flex-column gap-3">
                            {queuedHierarchies.map((hierarchy, index) => {
                              const deptRestriction = hierarchyDepartmentRestrictions[hierarchy.id] || { restrictToDepartment: false, departmentIds: [] };

                              return (
                                <Card
                                  key={hierarchy.id}
                                  className="border-0 bg-white shadow-sm"
                                >
                                  <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                                        <Badge bg="primary" className="px-2 py-1" style={{ fontSize: '0.85rem' }}>
                                          #{index + 1}
                                        </Badge>
                                        <div className="flex-grow-1">
                                          <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{hierarchy.name}</h6>
                                          {hierarchy.description && (
                                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{hierarchy.description}</p>
                                          )}
                                        </div>
                                        <Form.Check
                                          type="switch"
                                          id={`queue-optional-${hierarchy.id}`}
                                          label={
                                            <Badge
                                              bg={hierarchyOptionalSettings[hierarchy.id] ? "warning" : "success"}
                                              className="px-2 py-1"
                                              style={{ fontSize: '0.8rem' }}
                                            >
                                              {hierarchyOptionalSettings[hierarchy.id] ? "Optional" : "Required"}
                                            </Badge>
                                          }
                                          checked={hierarchyOptionalSettings[hierarchy.id] || false}
                                          onChange={() => toggleHierarchyOptional(hierarchy.id)}
                                        />
                                      </div>
                                      <div className="d-flex gap-1 ms-2">
                                        <Button
                                          variant="light"
                                          size="sm"
                                          onClick={() => handleMoveUp(index)}
                                          disabled={index === 0}
                                          title="Move up"
                                          className="p-1 d-flex align-items-center justify-content-center"
                                          style={{ width: '28px', height: '28px' }}
                                        >
                                          <FaArrowUp size={12} />
                                        </Button>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          onClick={() => handleMoveDown(index)}
                                          disabled={index === queuedHierarchies.length - 1}
                                          title="Move down"
                                          className="p-1 d-flex align-items-center justify-content-center"
                                          style={{ width: '28px', height: '28px' }}
                                        >
                                          <FaArrowDown size={12} />
                                        </Button>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          onClick={() => handleRemoveFromQueue(hierarchy.id)}
                                          title="Remove from queue"
                                          className="p-1 d-flex align-items-center justify-content-center text-danger"
                                          style={{ width: '28px', height: '28px' }}
                                        >
                                          <FaTrash size={12} />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Department Restriction Section */}
                                    <div className="border-top pt-2 mt-2">
                                      <Form.Check
                                        type="switch"
                                        id={`dept-restrict-${hierarchy.id}`}
                                        label={
                                          <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                            <FaBuilding className="me-1" size={13} />
                                            Restrict to Departments
                                          </span>
                                        }
                                        checked={deptRestriction.restrictToDepartment}
                                        onChange={() => toggleDepartmentRestriction(hierarchy.id)}
                                        className="mb-2"
                                      />

                                      {deptRestriction.restrictToDepartment && (
                                        <div className="ps-3 mt-2">
                                          <div className="row g-2">
                                            {departments.map((dept) => (
                                              <div key={dept.id} className="col-md-6 col-sm-6">
                                                <Form.Check
                                                  type="checkbox"
                                                  id={`dept-${hierarchy.id}-${dept.id}`}
                                                  label={dept.name}
                                                  checked={deptRestriction.departmentIds.includes(dept.id)}
                                                  onChange={() => handleDepartmentSelection(hierarchy.id, dept.id)}
                                                  style={{ fontSize: '0.9rem' }}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                          {deptRestriction.departmentIds.length === 0 && (
                                            <Alert variant="warning" className="mt-2 mb-0 py-1 px-2" style={{ fontSize: '0.85rem' }}>
                                              <FaInfoCircle className="me-1" size={13} />
                                              Select at least one department
                                            </Alert>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </Card.Body>
                                </Card>
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
