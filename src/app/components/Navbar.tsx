"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import {
  Navbar,
  Nav,
  Container,
  Dropdown,
  Badge,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  Bell,
  PersonCircle,
  Search,
  Gear,
  BoxArrowRight,
  List,
  X,
  GraphUp,
  FileText,
  ClipboardCheck,
  CashStack,
  Receipt,
  Wallet2,
  CreditCard,
  Collection,
  Building,
  Server,
  ChevronDown,
  PlusCircle,
  Journal,
  People,
  Folder,
  BarChart,
  Clock,
  CheckCircle,
  CurrencyExchange,
} from "react-bootstrap-icons";

export default function TopNavbar() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleNavigation = (path: string) => {
    router.push(path);
    setExpanded(false);
  };

  return (
    <div className="dual-navbar-container">
      {/* Primary Navbar (Dark) */}
      <Navbar
        expand="lg"
        expanded={expanded}
        className="top-navbar primary-navbar"
        variant="dark"
      >
        <Container fluid className="navbar-container">
          {/* Brand/Logo */}
          <Navbar.Brand
            href="/create-expense"
            className="d-flex align-items-center fw-bold brand-container"
          >
            <div className="logo-icon">
              <CashStack size={24} />
            </div>
            <span className="brand-text">ExpenseTracker</span>
            <span className="brand-subtitle d-none d-md-inline">
              Enterprise
            </span>
          </Navbar.Brand>

          {/* Toggle button for mobile */}
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={() => setExpanded(expanded ? false : true)}
            className="navbar-toggle"
          >
            {expanded ? <X size={24} /> : <List size={24} />}
          </Navbar.Toggle>

          <Navbar.Collapse id="basic-navbar-nav">
            {/* Navigation Links - Empty in primary navbar */}
            <Nav className="me-auto"></Nav>

            {/* Right side items */}
            <div className="navbar-right-container">
              {/* Quick Add Button */}
              <button className="btn btn-primary btn-sm me-2 quick-add-btn">
                <PlusCircle size={14} className="me-1" />
                <span className="d-none d-md-inline">New Expense</span>
              </button>

              {/* Notifications */}
              <Dropdown className="notification-dropdown-container">
                <Dropdown.Toggle
                  variant="dark"
                  className="notification-toggle position-relative"
                >
                  <Bell size={14} />
                  <Badge
                    bg="danger"
                    className="notification-badge position-absolute"
                  >
                    3
                  </Badge>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className="notification-dropdown">
                  <Dropdown.Header className="dropdown-header d-flex justify-content-between align-items-center">
                    <span>Notifications</span>
                    <Badge bg="primary" pill>
                      3 New
                    </Badge>
                  </Dropdown.Header>

                  <Dropdown.Item className="notification-item py-3 unread">
                    <div className="d-flex">
                      <div className="notification-icon bg-success bg-opacity-10 p-2 rounded me-3">
                        <CreditCard size={16} className="text-success" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium d-flex align-items-center">
                          New transaction
                          <span className="ms-2">
                            <Badge bg="success" className="ms-1" pill>
                              Payment
                            </Badge>
                          </span>
                        </div>
                        <small className="text-muted">
                          Payment received from Client X
                        </small>
                        <div className="text-muted mt-1 notification-time">
                          <Clock size={12} className="me-1" />
                          10 minutes ago
                        </div>
                      </div>
                    </div>
                  </Dropdown.Item>

                  <Dropdown.Item className="notification-item py-3 unread">
                    <div className="d-flex">
                      <div className="notification-icon bg-warning bg-opacity-10 p-2 rounded me-3">
                        <FileText size={16} className="text-warning" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium d-flex align-items-center">
                          Expense requires approval
                          <span className="ms-2">
                            <Badge bg="warning" className="ms-1" pill>
                              Action Needed
                            </Badge>
                          </span>
                        </div>
                        <small className="text-muted">
                          John Doe submitted a new expense
                        </small>
                        <div className="text-muted mt-1 notification-time">
                          <Clock size={12} className="me-1" />2 hours ago
                        </div>
                      </div>
                    </div>
                  </Dropdown.Item>

                  <Dropdown.Item className="notification-item py-3">
                    <div className="d-flex">
                      <div className="notification-icon bg-info bg-opacity-10 p-2 rounded me-3">
                        <ClipboardCheck size={16} className="text-info" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">Report generated</div>
                        <small className="text-muted">
                          Monthly financial report is ready
                        </small>
                        <div className="text-muted mt-1 notification-time">
                          <Clock size={12} className="me-1" />1 day ago
                        </div>
                      </div>
                    </div>
                  </Dropdown.Item>

                  <Dropdown.Divider />
                  <Dropdown.Item className="text-center view-all-notifications">
                    View all notifications
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* User Profile */}
              <Dropdown>
                <Dropdown.Toggle
                  variant="dark"
                  className="user-dropdown-toggle d-flex align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <div className="user-avatar me-2 position-relative">
                      <PersonCircle size={28} />
                      <span className="user-status position-absolute bg-success rounded-circle"></span>
                    </div>
                    <div className="user-info d-none d-md-block text-start">
                      <div className="user-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <small className="text-secondary">{user?.email}</small>
                    </div>
                    <ChevronDown size={14} className="ms-1 d-none d-md-block" />
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className="user-dropdown">
                  <Dropdown.Header className="dropdown-header d-flex align-items-center">
                    <PersonCircle size={24} className="me-2" />
                    <div>
                      <div className="fw-medium">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <small className="text-muted">{user?.email}</small>
                    </div>
                  </Dropdown.Header>

                  <Dropdown.Item className="dropdown-item">
                    <PersonCircle className="me-2" size={16} />
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item className="dropdown-item">
                    <Gear className="me-2" size={16} />
                    Settings
                  </Dropdown.Item>

                  {(user?.roles?.some((r) => r.role.name === "Company admin") ||
                    user?.roles?.some(
                      (r) => r.role.name === "System admin"
                    )) && (
                    <>
                      <Dropdown.Divider />

                      <Dropdown.Header className="dropdown-header">
                        Admin Portals
                      </Dropdown.Header>
                    </>
                  )}

                  {user?.roles?.some(
                    (r) => r.role.name === "Company admin"
                  ) && (
                    <Dropdown.Item
                      className="dropdown-item" style={{ fontSize: '0.95rem' }}
                      onClick={() =>
                        handleNavigation("/admin-pages/company-admin-dashboard")
                      }
                    >
                      <Building className="me-2 text-primary" size={16} />
                      Company admin
                    </Dropdown.Item>
                  )}
                  {user?.roles?.some((r) => r.role.name === "System admin") && (
                    <Dropdown.Item
                      className="dropdown-item" style={{ fontSize: '0.95rem' }}
                      onClick={() =>
                        handleNavigation("/admin-pages/system-admin-dashboard")
                      }
                    >
                      <Server className="me-2 text-success" size={16} />
                      System admin
                    </Dropdown.Item>
                  )}

                  <Dropdown.Divider />

                  <Dropdown.Item
                    className="dropdown-item" style={{ fontSize: '0.95rem' }}
                    onClick={() => handleNavigation("/")}
                  >
                    <BoxArrowRight className="me-2 text-danger" size={16} />
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Secondary Navbar (Light) */}
      <Navbar
        expand="lg"
        expanded={expanded}
        className="secondary-navbar shadow-sm border-bottom"
        variant="light"
        style={{ background: "rgba(13,110,253,0.10)", backdropFilter: "blur(8px)" }}
      >
        <Container fluid className="navbar-container px-3 px-md-4">
          {/* Toggle button for mobile */}
          <Navbar.Toggle
            aria-controls="secondary-navbar-nav"
            onClick={() => setExpanded(expanded ? false : true)}
            className="navbar-toggle rounded-3 border-0 shadow-sm"
            style={{ background: "rgba(25,135,84,0.10)" }}
          >
            {expanded ? <X size={24} /> : <List size={24} />}
          </Navbar.Toggle>

          <Navbar.Collapse id="secondary-navbar-nav" className="pt-2 pb-2">
            {/* Navigation Links */}
            <Nav className="me-auto main-navigation gap-2 gap-md-3">
              <Nav.Link
                onClick={() => handleNavigation("/dashboard")}
                className="nav-link-item rounded-3 px-2"
                style={{ 
                  background: "rgba(13,110,253,0.10)",
                  fontSize: "0.875rem",
                  paddingTop: "0.35rem",
                  paddingBottom: "0.35rem"
                }}
              >
                <GraphUp className="me-1 text-primary" size={14} />
                <span className="fw-semibold">Dashboard</span>
              </Nav.Link>

              {/* Expenses Dropdown */}
              <Dropdown as={Nav.Item} className="nav-dropdown">
                <Dropdown.Toggle 
                  as={Nav.Link} 
                  className="nav-link-item rounded-3 px-2 position-relative overflow-hidden" 
                  style={{ 
                    background: "linear-gradient(135deg, rgba(25,135,84,0.12) 0%, rgba(32,201,151,0.08) 100%)",
                    border: "1px solid rgba(25,135,84,0.2)",
                    boxShadow: "0 2px 8px rgba(25,135,84,0.08)",
                    fontSize: "0.875rem",
                    paddingTop: "0.35rem",
                    paddingBottom: "0.35rem"
                  }}
                >
                  <CashStack className="me-1" size={14} style={{ color: "#198754" }} />
                  <span style={{ color: "#198754", fontWeight: 600 }}>Expenses</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu shadow border-0 rounded-3 mt-2" style={{ borderTop: "3px solid #198754" }}>
                  <Dropdown.Header className="text-muted text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                    <CashStack className="me-1" size={12} style={{ color: "#198754" }} />
                    Expense Management
                  </Dropdown.Header>
                  <Dropdown.Item onClick={() => handleNavigation("/expense-management/my-expenses")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(13,110,253,0.1)" }}>
                        <Journal size={16} style={{ color: "#0d6efd" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>My Expenses</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>View your submissions</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/expense-management/create-expense")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(25,135,84,0.1)" }}>
                        <PlusCircle size={16} style={{ color: "#198754" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Create Expense</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Submit new expense</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/expense-management/reports")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(255,193,7,0.1)" }}>
                        <BarChart size={16} style={{ color: "#ffc107" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Reports</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Analytics & insights</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/data-inputs/policies")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(13,202,240,0.1)" }}>
                        <FileText size={16} style={{ color: "#0dcaf0" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Expense Policies</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>View guidelines</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* Approvals Dropdown */}
              <Dropdown as={Nav.Item} className="nav-dropdown">
                <Dropdown.Toggle 
                  as={Nav.Link} 
                  className="nav-link-item rounded-3 px-2 position-relative overflow-hidden" 
                  style={{ 
                    background: "linear-gradient(135deg, rgba(13,110,253,0.12) 0%, rgba(72,149,239,0.08) 100%)",
                    border: "1px solid rgba(13,110,253,0.2)",
                    boxShadow: "0 2px 8px rgba(13,110,253,0.08)",
                    fontSize: "0.875rem",
                    paddingTop: "0.35rem",
                    paddingBottom: "0.35rem"
                  }}
                >
                  <ClipboardCheck className="me-1" size={14} style={{ color: "#0d6efd" }} />
                  <span style={{ color: "#0d6efd", fontWeight: 600 }}>Approvals</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu shadow border-0 rounded-3 mt-2" style={{ borderTop: "3px solid #0d6efd" }}>
                  <Dropdown.Header className="text-muted text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                    <ClipboardCheck className="me-1" size={12} style={{ color: "#0d6efd" }} />
                    Approval Center
                  </Dropdown.Header>
                  <Dropdown.Item onClick={() => handleNavigation("/expense-approvals/approvals")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(25,135,84,0.1)" }}>
                        <CheckCircle size={16} style={{ color: "#198754" }} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between">
                          <div style={{ fontWeight: 500, color: "#2d3748" }}>Pending Approvals</div>
                          <Badge bg="warning" text="dark" pill style={{ fontSize: "0.7rem" }}>5</Badge>
                        </div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Review & approve</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/expense-approvals/history")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(13,202,240,0.1)" }}>
                        <Clock size={16} style={{ color: "#0dcaf0" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Departmental Expenses</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Track team expenses</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/expense-approvals/history")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(255,193,7,0.1)" }}>
                        <Clock size={16} style={{ color: "#ffc107" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Departmental Budgets</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Monitor allocations</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* Finance Dropdown */}
              <Dropdown as={Nav.Item} className="nav-dropdown">
                <Dropdown.Toggle 
                  as={Nav.Link} 
                  className="nav-link-item rounded-3 px-2 position-relative overflow-hidden" 
                  style={{ 
                    background: "linear-gradient(135deg, rgba(220,53,69,0.12) 0%, rgba(236,100,75,0.08) 100%)",
                    border: "1px solid rgba(220,53,69,0.2)",
                    boxShadow: "0 2px 8px rgba(220,53,69,0.08)",
                    fontSize: "0.875rem",
                    paddingTop: "0.35rem",
                    paddingBottom: "0.35rem"
                  }}
                >
                  <Wallet2 className="me-1" size={14} style={{ color: "#dc3545" }} />
                  <span style={{ color: "#dc3545", fontWeight: 600 }}>Finance</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu shadow border-0 rounded-3 mt-2" style={{ borderTop: "3px solid #dc3545", minWidth: "280px" }}>
                  <Dropdown.Header className="text-muted text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                    <Wallet2 className="me-1" size={12} style={{ color: "#dc3545" }} />
                    Financial Operations
                  </Dropdown.Header>
                  <Dropdown.Item onClick={() => handleNavigation("/finance/qued-expenses")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(13,110,253,0.1)" }}>
                        <Collection size={16} style={{ color: "#0d6efd" }} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between">
                          <div style={{ fontWeight: 500, color: "#2d3748" }}>Manage Expenses</div>
                          <Badge bg="info" pill style={{ fontSize: "0.7rem" }}>12</Badge>
                        </div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Queue & process</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/finance/pay-expenses")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(25,135,84,0.1)" }}>
                        <CreditCard size={16} style={{ color: "#198754" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Pay Expenses</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Process payments</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/finance/budgets")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(255,193,7,0.1)" }}>
                        <Receipt size={16} style={{ color: "#ffc107" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Budgets</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Budget management</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => handleNavigation("/finance/currencies")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(13,202,240,0.1)" }}>
                        <CurrencyExchange size={16} style={{ color: "#0dcaf0" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Currencies</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Exchange rates</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/finance/payment-methods")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(220,53,69,0.1)" }}>
                        <CreditCard size={16} style={{ color: "#dc3545" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Payment Methods</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Configure methods</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => handleNavigation("/finance/accounts")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(108,117,125,0.1)" }}>
                        <Folder size={16} style={{ color: "#6c757d" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>All Expenses</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Complete archive</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/data-inputs/categories")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(111,66,193,0.1)" }}>
                        <Collection size={16} style={{ color: "#6f42c1" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Categories</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Manage categories</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNavigation("/data-inputs/departments")}
                    className="dropdown-item" style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}>
                    <div className="d-flex align-items-center">
                      <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(13,110,253,0.1)" }}>
                        <People size={16} style={{ color: "#0d6efd" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#2d3748" }}>Departments</div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Department setup</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              {user?.roles?.some((r) => r.role.name === "Company admin") && (
                <Dropdown as={Nav.Item} className="nav-dropdown">
                  <Dropdown.Toggle 
                    as={Nav.Link} 
                    className="nav-link-item rounded-3 px-2 position-relative overflow-hidden" 
                    style={{ 
                      background: "linear-gradient(135deg, rgba(111,66,193,0.12) 0%, rgba(142,84,233,0.08) 100%)",
                      border: "1px solid rgba(111,66,193,0.2)",
                      boxShadow: "0 2px 8px rgba(111,66,193,0.08)",
                      fontSize: "0.875rem",
                      paddingTop: "0.35rem",
                      paddingBottom: "0.35rem"
                    }}
                  >
                    <Building className="me-1" size={14} style={{ color: "#6f42c1" }} />
                    <span style={{ color: "#6f42c1", fontWeight: 600 }}>Workflow</span>
                    <Badge 
                      bg="purple" 
                      className="ms-1" 
                      style={{ 
                        fontSize: "0.6rem", 
                        padding: "0.2em 0.4em",
                        background: "rgba(111,66,193,0.85)",
                        verticalAlign: "middle"
                      }}
                    >
                      Admin
                    </Badge>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu shadow border-0 rounded-3 mt-2" style={{ borderTop: "3px solid #6f42c1" }}>
                    <Dropdown.Header className="text-muted text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                      <Building className="me-1" size={12} style={{ color: "#6f42c1" }} />
                      Workflow Management
                    </Dropdown.Header>
                    <Dropdown.Item
                      onClick={() =>
                        handleNavigation("/expense-approvals/hierarchies")
                      }
                      className="dropdown-item"
                      style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(111,66,193,0.1)" }}>
                          <FileText size={16} style={{ color: "#6f42c1" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "#2d3748" }}>Approval Hierarchies</div>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>Manage approval levels</small>
                        </div>
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        handleNavigation("/expense-approvals/workflows")
                      }
                      className="dropdown-item"
                      style={{ fontSize: '0.95rem', padding: "0.625rem 1rem" }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-2 d-flex align-items-center justify-content-center rounded" style={{ width: "32px", height: "32px", background: "rgba(142,84,233,0.1)" }}>
                          <FileText size={16} style={{ color: "#8e54e9" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "#2d3748" }}>Approval Workflows</div>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>Configure workflow rules</small>
                        </div>
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Nav>

            {/* Right side items */}
            <div className="navbar-right-container d-flex align-items-center gap-2">
              {/* Search Bar */}
              <div className="search-container me-2 d-none d-md-block rounded-3 border bg-white bg-opacity-75 shadow-sm px-2 py-1">
                <InputGroup>
                  <InputGroup.Text className="search-icon-container border-0 bg-transparent">
                    <Search size={16} className="text-primary" />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search expenses ..."
                    className="search-input border-0 bg-transparent"
                  />
                </InputGroup>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <style jsx>{`
        .secondary-navbar {
          font-size: 1rem;
        }
        .nav-link-item {
          transition: background 0.2s, box-shadow 0.2s;
        }
        .nav-link-item:hover, .dropdown-item:hover {
          background: rgba(13,110,253,0.15) !important;
          box-shadow: 0 2px 8px rgba(13,110,253,0.08);
        }
        .dropdown-menu {
          min-width: 220px;
        }
        .dropdown-item {
          transition: background 0.2s, box-shadow 0.2s;
        }
        .dropdown-item:active {
          background: rgba(25,135,84,0.15) !important;
        }
        .search-input:focus {
          box-shadow: none;
        }
      `}</style>

      <style jsx global>{`
        .dual-navbar-container {
          margin-bottom: 0;
          position: sticky;
          top: 0;
          z-index: 1030;
          font-family: "Inter", "Segoe UI", system-ui, sans-serif;
        }

        /* Primary Navbar Styles */
        .primary-navbar {
          background: linear-gradient(
            135deg,
            #1a2a3a 0%,
            #0d1b2a 100%
          ) !important;
          padding: 0.5rem 0;
          min-height: 64px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .navbar-container {
          max-width: 100%;
          padding: 0 1.5rem;
        }

        .brand-container {
          padding: 0.5rem 0;
        }

        .logo-icon {
          background: linear-gradient(45deg, #4361ee, #3a0ca3);
          border-radius: 10px;
          padding: 8px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .brand-text {
          font-size: 1.5rem;
          background: linear-gradient(to right, #fff, #f8f9fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          background: linear-gradient(to right, #4cc9f0, #4361ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 600;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
        }

        .navbar-toggle {
          border: none;
          padding: 0.25rem 0.5rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .navbar-toggle:focus {
          box-shadow: none;
        }

        .navbar-right-container {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          gap: 0.75rem;
        }

        .quick-add-btn {
          background: linear-gradient(45deg, #4361ee, #3a0ca3);
          border: none;
          border-radius: 8px;
          padding: 0.35rem 0.75rem;
          font-weight: 500;
          font-size: 0.875rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .quick-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .notification-dropdown-container {
          margin-right: 0;
        }

        .notification-toggle {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 8px !important;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .notification-toggle:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-1px);
        }

        .notification-toggle:after {
          display: none;
        }

        .notification-badge {
          font-size: 0.65rem;
          padding: 0.25em 0.5em;
          top: -2px !important;
          right: -2px !important;
        }

        .notification-dropdown {
          width: 380px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }

        .dropdown-header {
          font-weight: 600;
          padding: 0.875rem 1rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .notification-item {
          border-left: 4px solid transparent;
          transition: all 0.2s ease;
          padding: 0.875rem 1rem;
        }

        .notification-item.unread {
          background-color: #f8fafd;
          border-left: 4px solid #4361ee;
        }

        .notification-item:hover {
          background-color: #f0f4f8;
        }

        .notification-time {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
        }

        .view-all-notifications {
          color: #4361ee !important;
          font-weight: 500;
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          transition: all 0.2s ease;
        }

        .view-all-notifications:hover {
          background-color: #e9ecef;
        }

        .user-dropdown-toggle {
          background: transparent !important;
          border: none !important;
          padding: 0.15rem 0.35rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .user-dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .user-dropdown-toggle:after {
          display: none;
        }

        .user-avatar {
          color: #fff;
          position: relative;
        }

        .user-status {
          width: 12px;
          height: 12px;
          bottom: 0;
          right: 0;
          border: 2px solid #1a2a3a;
        }

        .user-info {
          text-align: left;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.2;
        }

        .user-role {
          font-size: 0.75rem;
          color: #adb5bd !important;
          line-height: 1;
        }

        .user-dropdown {
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 0.5rem;
          width: 280px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 0.625rem 0.75rem;
          border-radius: 8px;
          margin: 0.125rem 0;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f0f4f8;
          transform: translateX(2px);
        }

        /* Secondary Navbar Styles */
        .secondary-navbar {
          background: linear-gradient(to right, #ffffff, #f8fafc) !important;
          padding: 0.5rem 0;
          min-height: 56px;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .main-navigation {
          align-items: center;
          gap: 0.25rem;
        }

        .nav-link-item {
          display: flex;
          align-items: center;
          padding: 0.625rem 0.875rem !important;
          border-radius: 8px;
          margin: 0 0.1rem;
          color: #4a5568 !important;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .nav-link-item:hover,
        .nav-link-item:focus {
          background-color: #f1f5f9;
          color: #4361ee !important;
          border-color: #e2e8f0;
        }

        .nav-dropdown .dropdown-toggle {
          display: flex;
          align-items: center;
        }

        .nav-dropdown .dropdown-menu {
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 0.5rem;
          margin-top: 0.5rem;
        }

        .nav-dropdown .dropdown-item {
          padding: 0.625rem 0.75rem;
          border-radius: 8px;
        }

        .search-icon-container {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          border-right: none;
          border-radius: 8px 0 0 8px;
          color: #64748b;
        }

        .search-input {
          border-left: none;
          border-radius: 0 8px 8px 0;
          border-color: #e2e8f0;
          min-width: 280px;
        }

        .search-input:focus {
          box-shadow: none;
          border-color: #e2e8f0;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .quick-stats {
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .stat-item {
          text-align: center;
          padding: 0 0.75rem;
          border-right: 1px solid #e2e8f0;
        }

        .stat-item:last-child {
          border-right: none;
        }

        .stat-label {
          font-size: 0.7rem;
          margin-bottom: 0.1rem;
        }

        .stat-value {
          font-size: 0.9rem;
        }

        /* Responsive adjustments */
        @media (max-width: 1199.98px) {
          .search-input {
            min-width: 220px;
          }
        }

        @media (max-width: 991.98px) {
          .navbar-container {
            padding: 0 1rem;
          }

          .navbar-right-container {
            margin-top: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
          }

          .main-navigation {
            margin-top: 1rem;
            margin-bottom: 1rem;
          }

          .nav-link-item {
            margin: 0.25rem 0;
            padding: 0.75rem 1rem !important;
          }

          .nav-dropdown .dropdown-menu {
            margin-left: 1rem;
            width: calc(100% - 2rem);
          }

          .search-container {
            width: 100%;
            margin: 1rem 0;
          }

          .search-input {
            min-width: 100%;
          }

          .quick-stats {
            display: none !important;
          }
        }

        @media (max-width: 767.98px) {
          .brand-text {
            font-size: 1.25rem;
          }

          .quick-add-btn span {
            display: none;
          }

          .quick-add-btn {
            padding: 0.5rem;
          }
        }

        @media (max-width: 575.98px) {
          .notification-dropdown {
            width: 300px;
            right: -50px;
          }
        }
      `}</style>
    </div>
  );
}
