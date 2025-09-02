"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  People,
  ClipboardCheck,
  CashStack,
  Receipt,
  Wallet2,
  CreditCard,
  Collection,
  Building,
  Server,
} from "react-bootstrap-icons";

export default function TopNavbar() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    setExpanded(false);
  };

  return (
    <Navbar
      expand="lg"
      expanded={expanded}
      className="top-navbar shadow-sm mb-4"
    >
      <Container fluid className="px-4">
        {/* Brand/Logo */}
        <Navbar.Brand
          href="/create-expense"
          className="d-flex align-items-center fw-bold"
        >
          <span className="brand-text">ExpenseTracker</span>
        </Navbar.Brand>

        {/* Toggle button for mobile */}
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(expanded ? false : true)}
        >
          {expanded ? <X size={24} /> : <List size={24} />}
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Navigation Links */}
          <Nav className="me-auto">
            <Nav.Link
              onClick={() => handleNavigation("/dashboard")}
              className="mx-2"
            >
              <GraphUp className="me-1" size={16} />
              Dashboard
            </Nav.Link>
            <Dropdown as={Nav.Item} className="mx-2">
              <Dropdown.Toggle
                as={Nav.Link}
                className="d-flex align-items-center"
              >
                <CashStack className="me-1" size={16} />
                Expenses
              </Dropdown.Toggle>
              <Dropdown.Menu className="mt-2">
                <Dropdown.Item
                  onClick={() =>
                    handleNavigation("/expense-management/my-expenses")
                  }
                  className="d-flex align-items-center"
                >
                  <CreditCard className="me-2" size={16} />
                  My expenses
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() =>
                    handleNavigation("/expense-management/create-expense")
                  }
                  className="d-flex align-items-center"
                >
                  <Collection className="me-2" size={16} />
                  Create expense
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Nav.Link
              onClick={() => handleNavigation("/expense-approvals/workflows")}
              className="mx-2"
            >
              <FileText className="me-1" size={16} />
              Workflows
            </Nav.Link>
            <Nav.Link
              onClick={() => handleNavigation("/expense-approvals/approvals")}
              className="mx-2"
            >
              <ClipboardCheck className="me-1" size={16} />
              Approvals
            </Nav.Link>

            {/* Finance Dropdown */}
            <Dropdown as={Nav.Item} className="mx-2">
              <Dropdown.Toggle
                as={Nav.Link}
                className="d-flex align-items-center"
              >
                <CashStack className="me-1" size={16} />
                Finance
              </Dropdown.Toggle>
              <Dropdown.Menu className="mt-2">
                <Dropdown.Item
                  onClick={() => handleNavigation("/finance/qued-expenses")}
                  className="d-flex align-items-center"
                >
                  <Collection className="me-2" size={16} />
                  Manage expenses
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleNavigation("/finance/pay-expenses")}
                  className="d-flex align-items-center"
                >
                  <CreditCard className="me-2" size={16} />
                  Pay expenses
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleNavigation("/finance/budgets")}
                  className="d-flex align-items-center"
                >
                  <Receipt className="me-2" size={16} />
                  Budgets
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleNavigation("/finance/accounts")}
                  className="d-flex align-items-center"
                >
                  <Wallet2 className="me-2" size={16} />
                  All expenses
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown as={Nav.Item} className="mx-2">
              <Dropdown.Toggle
                as={Nav.Link}
                className="d-flex align-items-center"
              >
                <CashStack className="me-1" size={16} />
                Data inputs
              </Dropdown.Toggle>
              <Dropdown.Menu className="mt-2">
                <Dropdown.Item
                  onClick={() => handleNavigation("/data-inputs/categories")}
                  className="d-flex align-items-center"
                >
                  <Collection className="me-2" size={16} />
                  Categories
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleNavigation("/data-inputs/departments")}
                  className="d-flex align-items-center"
                >
                  <CreditCard className="me-2" size={16} />
                  Departments
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>

          {/* Right side items */}
          <div className="d-flex align-items-center mt-3 mt-lg-0">
            {/* Search Bar */}
            <div className="search-container me-3 d-none d-md-block">
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search..."
                  className="border-start-0"
                />
              </InputGroup>
            </div>

            {/* Notifications */}
            <Dropdown className="me-3">
              <Dropdown.Toggle
                variant="light"
                className="position-relative p-2 rounded-circle"
              >
                <Bell size={20} />
                <Badge
                  bg="danger"
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: "0.6rem" }}
                >
                  3
                </Badge>
              </Dropdown.Toggle>

              <Dropdown.Menu align="end" className="notification-dropdown">
                <Dropdown.Header>Notifications</Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item className="py-3">
                  <div className="d-flex">
                    <div className="notification-icon bg-success bg-opacity-10 p-2 rounded me-3">
                      <CreditCard size={20} className="text-success" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">New transaction</div>
                      <small className="text-muted">
                        Payment received from Client X
                      </small>
                      <div
                        className="text-muted mt-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        10 minutes ago
                      </div>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="py-3">
                  <div className="d-flex">
                    <div className="notification-icon bg-warning bg-opacity-10 p-2 rounded me-3">
                      <FileText size={20} className="text-warning" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">Expense requires approval</div>
                      <small className="text-muted">
                        John Doe submitted a new expense
                      </small>
                      <div
                        className="text-muted mt-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        2 hours ago
                      </div>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="py-3">
                  <div className="d-flex">
                    <div className="notification-icon bg-info bg-opacity-10 p-2 rounded me-3">
                      <ClipboardCheck size={20} className="text-info" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">Report generated</div>
                      <small className="text-muted">
                        Monthly financial report is ready
                      </small>
                      <div
                        className="text-muted mt-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        1 day ago
                      </div>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-center text-primary">
                  View all notifications
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* User Profile */}
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                className="d-flex align-items-center user-dropdown-toggle"
              >
                <div className="d-flex align-items-center">
                  <div className="user-avatar me-2">
                    <PersonCircle size={28} />
                  </div>
                  <div className="d-none d-md-block">
                    <div className="fw-medium" style={{ fontSize: "0.9rem" }}>
                      Admin User
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.75rem", lineHeight: "1" }}
                    >
                      Administrator
                    </div>
                  </div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu align="end" className="user-dropdown">
                <Dropdown.Header>Account</Dropdown.Header>
                <Dropdown.Item>
                  <PersonCircle className="me-2" size={18} />
                  Profile
                </Dropdown.Item>
                <Dropdown.Item>
                  <Gear className="me-2" size={18} />
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => handleNavigation("/company-admin")}
                >
                  <Building className="me-2 text-primary" size={18} />
                  Company admin
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => handleNavigation("/system-admin")}
                >
                  <Server className="me-2 text-primary" size={18} />
                  System admin
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleNavigation("/login")}>
                  <BoxArrowRight className="me-2 text-danger" size={18} />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar.Collapse>
      </Container>

      {/* Custom CSS */}
      <style jsx>{`
        .top-navbar {
          background-color: #fff;
          padding: 0.5rem 0;
          position: sticky;
          top: 0;
          z-index: 1020;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-icon svg {
          color: white !important;
        }

        .brand-text {
          background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }

        .nav-link {
          font-weight: 500;
          color: #4a5568 !important;
          border-radius: 6px;
          margin: 0 0.25rem;
        }

        .nav-link:hover,
        .nav-link:focus {
          background-color: #f7fafc;
          color: #2d3748 !important;
        }

        .search-container {
          width: 300px;
        }

        .notification-dropdown {
          width: 350px;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-dropdown {
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-dropdown-toggle::after {
          margin-left: 0.5rem;
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 991.98px) {
          .search-container {
            width: 100%;
            margin: 1rem 0;
          }

          .nav-link {
            margin: 0.25rem 0;
          }
        }
      `}</style>
    </Navbar>
  );
}
