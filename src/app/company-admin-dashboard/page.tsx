"use client";

import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Nav,
  Table,
  Button,
  Badge,
  Navbar,
  Dropdown,
  Card,
  InputGroup,
  FormControl,
  Breadcrumb,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import {
  People,
  Building,
  Diagram3,
  Gear,
  ClipboardCheck,
  CashStack,
  Pencil,
  Trash,
  PersonCircle,
  Search,
  Plus,
  Bell,
  Grid3x3Gap,
  ClockHistory,
} from "react-bootstrap-icons";
import AuthProvider from "../authPages/tokenData";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "ACTIVE",
      role: "Admin",
      lastLogin: "2 hours ago",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "INACTIVE",
      role: "Manager",
      lastLogin: "3 days ago",
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert@example.com",
      status: "ACTIVE",
      role: "User",
      lastLogin: "5 hours ago",
    },
    {
      id: 4,
      name: "Sarah Williams",
      email: "sarah@example.com",
      status: "ACTIVE",
      role: "Manager",
      lastLogin: "1 day ago",
    },
  ];

  const workflows = [
    {
      id: 1,
      name: "Expense Approval",
      steps: 3,
      isActive: true,
      lastModified: "2023-10-15",
    },
    {
      id: 2,
      name: "Travel Request",
      steps: 4,
      isActive: false,
      lastModified: "2023-09-22",
    },
    {
      id: 3,
      name: "Leave Application",
      steps: 2,
      isActive: true,
      lastModified: "2023-10-05",
    },
  ];

  const stats = {
    totalUsers: 42,
    activeWorkflows: 5,
    pendingApprovals: 12,
    monthlyExpenses: "$12,458",
  };

  // Filter data based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthProvider>
      <Navbar />
      <Container fluid className="p-0 admin-dashboard">
        {/* Top Navbar */}
        <Navbar bg="white" expand="lg" className="px-4 border-bottom shadow-sm">
          <Navbar.Brand className="fw-bold text-primary">
            <Building className="me-2" size={24} />
            Company Admin
          </Navbar.Brand>

          <div className="d-flex ms-auto align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-3 position-relative"
            >
              <Bell size={18} />
              <Badge
                bg="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
              >
                3
              </Badge>
            </Button>

            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-user"
                className="d-flex align-items-center border-0"
              >
                <PersonCircle className="me-2" size={20} />
                Admin User
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="#/profile">
                  <PersonCircle className="me-2" />
                  Profile
                </Dropdown.Item>
                <Dropdown.Item href="#/settings">
                  <Gear className="me-2" />
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item href="#/logout" className="text-danger">
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar>

        <Row className="g-0">
          {/* Sidebar */}
          <Col
            md={2}
            className="sidebar bg-white vh-100 d-flex flex-column p-3 border-end"
            style={{ minHeight: "100vh" }}
          >
            <h5 className="text-uppercase text-secondary fw-bold mt-3 mb-4 px-2 small">
              Main Navigation
            </h5>
            <Nav className="flex-column gap-1">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "dashboard"}
                  onClick={() => setActiveTab("dashboard")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "dashboard" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Grid3x3Gap className="me-2" /> Dashboard
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "users" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <People className="me-2" /> Users
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "institutions"}
                  onClick={() => setActiveTab("institutions")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "institutions"
                      ? "active-nav-link"
                      : "nav-link"
                  }`}
                >
                  <Building className="me-2" /> Institutions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "departments"}
                  onClick={() => setActiveTab("departments")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "departments" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Diagram3 className="me-2" /> Departments
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "roles"}
                  onClick={() => setActiveTab("roles")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "roles" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <Gear className="me-2" /> Roles
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "workflows"}
                  onClick={() => setActiveTab("workflows")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "workflows" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <ClipboardCheck className="me-2" /> Workflows
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "expenses"}
                  onClick={() => setActiveTab("expenses")}
                  className={`rounded py-2 px-3 d-flex align-items-center ${
                    activeTab === "expenses" ? "active-nav-link" : "nav-link"
                  }`}
                >
                  <CashStack className="me-2" /> Expenses
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <div className="mt-auto p-2 text-center">
              <small className="text-muted">v2.1.0</small>
            </div>
          </Col>

          {/* Main Content */}
          <Col md={10} className="p-4 bg-light content-area">
            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark">Dashboard Overview</h3>
                  <Breadcrumb>
                    <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Alert variant="info" className="d-flex align-items-center">
                  <Bell className="me-2" />
                  <span>
                    Welcome back! You have 3 pending actions that need your
                    attention.
                  </span>
                </Alert>

                <Row className="mb-4">
                  <Col md={3} className="mb-3">
                    <Card className="stat-card shadow-sm border-0">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                            <People size={24} className="text-primary" />
                          </div>
                          <div>
                            <h6 className="card-title text-muted mb-0">
                              Total Users
                            </h6>
                            <h4 className="fw-bold mb-0">{stats.totalUsers}</h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card className="stat-card shadow-sm border-0">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                            <ClipboardCheck
                              size={24}
                              className="text-success"
                            />
                          </div>
                          <div>
                            <h6 className="card-title text-muted mb-0">
                              Active Workflows
                            </h6>
                            <h4 className="fw-bold mb-0">
                              {stats.activeWorkflows}
                            </h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card className="stat-card shadow-sm border-0">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                            <ClockHistory size={24} className="text-warning" />
                          </div>
                          <div>
                            <h6 className="card-title text-muted mb-0">
                              Pending Approvals
                            </h6>
                            <h4 className="fw-bold mb-0">
                              {stats.pendingApprovals}
                            </h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card className="stat-card shadow-sm border-0">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                            <CashStack size={24} className="text-info" />
                          </div>
                          <div>
                            <h6 className="card-title text-muted mb-0">
                              Monthly Expenses
                            </h6>
                            <h4 className="fw-bold mb-0">
                              {stats.monthlyExpenses}
                            </h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-4">
                    <Card className="shadow-sm border-0">
                      <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Recent Users</h5>
                        <Button variant="outline-primary" size="sm">
                          View All
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        <Table hover responsive>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Status</th>
                              <th>Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.slice(0, 4).map((user) => (
                              <tr key={user.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <PersonCircle className="me-2 text-secondary" />
                                    {user.name}
                                  </div>
                                </td>
                                <td>
                                  <Badge
                                    bg={
                                      user.status === "ACTIVE"
                                        ? "success"
                                        : "secondary"
                                    }
                                  >
                                    {user.status}
                                  </Badge>
                                </td>
                                <td>{user.role}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6} className="mb-4">
                    <Card className="shadow-sm border-0">
                      <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Workflow Status</h5>
                        <Button variant="outline-primary" size="sm">
                          View All
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        <Table hover responsive>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Steps</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workflows.map((workflow) => (
                              <tr key={workflow.id}>
                                <td>{workflow.name}</td>
                                <td>{workflow.steps}</td>
                                <td>
                                  <Badge
                                    bg={
                                      workflow.isActive
                                        ? "success"
                                        : "secondary"
                                    }
                                  >
                                    {workflow.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark">User Management</h3>
                  <Breadcrumb>
                    <Breadcrumb.Item
                      href="#"
                      onClick={() => setActiveTab("dashboard")}
                    >
                      Dashboard
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>Users</Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <InputGroup style={{ width: "300px" }}>
                        <InputGroup.Text>
                          <Search />
                        </InputGroup.Text>
                        <FormControl
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>

                      <Button
                        variant="primary"
                        className="d-flex align-items-center"
                        onClick={() => setShowUserModal(true)}
                      >
                        <Plus className="me-2" size={18} /> Add User
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm border-0">
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Last Login</th>
                          <th>Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user, idx) => (
                          <tr key={user.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <PersonCircle
                                  className="me-2 text-primary"
                                  size={24}
                                />
                                {user.name}
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <Badge bg="light" text="dark" className="border">
                                {user.role}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {user.lastLogin}
                              </small>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  user.status === "ACTIVE"
                                    ? "success"
                                    : "secondary"
                                }
                                className="px-2 py-1"
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2 action-btn"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-btn"
                              >
                                <Trash size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </>
            )}

            {/* Workflows Tab */}
            {activeTab === "workflows" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold text-dark">Workflow Management</h3>
                  <Breadcrumb>
                    <Breadcrumb.Item
                      href="#"
                      onClick={() => setActiveTab("dashboard")}
                    >
                      Dashboard
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>Workflows</Breadcrumb.Item>
                  </Breadcrumb>
                </div>

                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <InputGroup style={{ width: "300px" }}>
                        <InputGroup.Text>
                          <Search />
                        </InputGroup.Text>
                        <FormControl
                          placeholder="Search workflows..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>

                      <Button
                        variant="primary"
                        className="d-flex align-items-center"
                        onClick={() => setShowWorkflowModal(true)}
                      >
                        <Plus className="me-2" size={18} /> New Workflow
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Row>
                  {filteredWorkflows.map((workflow) => (
                    <Col md={6} lg={4} key={workflow.id} className="mb-4">
                      <Card className="h-100 shadow-sm border-0">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h5 className="card-title mb-0">{workflow.name}</h5>
                            <Badge
                              bg={workflow.isActive ? "success" : "secondary"}
                            >
                              {workflow.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <span className="text-muted">
                              {workflow.steps} steps
                            </span>
                          </div>
                          <div className="mb-3">
                            <small className="text-muted">
                              Last modified: {workflow.lastModified}
                            </small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <Button variant="outline-primary" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline-secondary" size="sm">
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* Other Tabs */}
            {activeTab === "institutions" && <>One</>}
            {activeTab === "departments" && <>Two</>}
            {activeTab === "roles" && <>Three</>}
            {activeTab === "expenses" && <>Four</>}
          </Col>
        </Row>

        {/* Add User Modal */}
        <Modal
          show={showUserModal}
          onHide={() => setShowUserModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Add New User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control type="text" placeholder="Enter full name" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" placeholder="Enter email" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select>
                  <option>Select role</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>User</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowUserModal(false)}>
              Add User
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Workflow Modal */}
        <Modal
          show={showWorkflowModal}
          onHide={() => setShowWorkflowModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Workflow</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Workflow Name</Form.Label>
                <Form.Control type="text" placeholder="Enter workflow name" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter workflow description"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Number of Steps</Form.Label>
                <Form.Select>
                  <option>Select number of steps</option>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </Form.Select>
              </Form.Group>
              <Form.Check
                type="switch"
                id="active-switch"
                label="Activate workflow immediately"
                className="mb-3"
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowWorkflowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowWorkflowModal(false)}
            >
              Create Workflow
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Custom CSS */}
        <style jsx global>{`
          .admin-dashboard {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          }

          .sidebar {
            background: linear-gradient(to bottom, #f8f9fa, #f1f3f5);
          }

          .nav-link {
            color: #495057 !important;
            transition: all 0.2s ease;
          }

          .nav-link:hover,
          .active-nav-link {
            background-color: #e9ecef !important;
            color: #0d6efd !important;
            border-left: 3px solid #0d6efd;
          }

          .active-nav-link {
            font-weight: 500;
          }

          .content-area {
            background-color: #f8f9fa;
            min-height: 100vh;
          }

          .stat-card {
            transition: transform 0.2s ease;
          }

          .stat-card:hover {
            transform: translateY(-5px);
          }

          .action-btn {
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .table th {
            border-top: none;
            font-weight: 600;
            color: #495057;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
