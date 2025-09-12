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
    <div className="dual-navbar-container">
      {/* Primary Navbar (Dark) */}
      <Navbar
        expand="lg"
        expanded={expanded}
        className="top-navbar primary-navbar shadow-sm"
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
              {/* Notifications */}
              <Dropdown className="notification-dropdown-container">
                <Dropdown.Toggle
                  variant="dark"
                  className="notification-toggle position-relative"
                >
                  <Bell size={20} />
                  <Badge
                    bg="danger"
                    className="notification-badge position-absolute"
                  >
                    3
                  </Badge>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className="notification-dropdown">
                  <Dropdown.Header className="dropdown-header">
                    Notifications
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item className="notification-item py-3">
                    <div className="d-flex">
                      <div className="notification-icon bg-success bg-opacity-10 p-2 rounded me-3">
                        <CreditCard size={20} className="text-success" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">New transaction</div>
                        <small className="text-muted">
                          Payment received from Client X
                        </small>
                        <div className="text-muted mt-1 notification-time">
                          10 minutes ago
                        </div>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item className="notification-item py-3">
                    <div className="d-flex">
                      <div className="notification-icon bg-warning bg-opacity-10 p-2 rounded me-3">
                        <FileText size={20} className="text-warning" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">
                          Expense requires approval
                        </div>
                        <small className="text-muted">
                          John Doe submitted a new expense
                        </small>
                        <div className="text-muted mt-1 notification-time">
                          2 hours ago
                        </div>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item className="notification-item py-3">
                    <div className="d-flex">
                      <div className="notification-icon bg-info bg-opacity-10 p-2 rounded me-3">
                        <ClipboardCheck size={20} className="text-info" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">Report generated</div>
                        <small className="text-muted">
                          Monthly financial report is ready
                        </small>
                        <div className="text-muted mt-1 notification-time">
                          1 day ago
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
                    <div className="user-avatar me-2">
                      <PersonCircle size={28} />
                    </div>
                    <div className="user-info d-none d-md-block">
                      <div className="user-name">Admin User</div>
                      <div className="user-role">Administrator</div>
                    </div>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className="user-dropdown">
                  <Dropdown.Header className="dropdown-header">
                    Account
                  </Dropdown.Header>
                  <Dropdown.Item className="dropdown-item">
                    <PersonCircle className="me-2" size={18} />
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item className="dropdown-item">
                    <Gear className="me-2" size={18} />
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    className="dropdown-item"
                    onClick={() =>
                      handleNavigation("/admin-pages/company-admin-dashboard")
                    }
                  >
                    <Building className="me-2 text-primary" size={18} />
                    Company admin
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="dropdown-item"
                    onClick={() =>
                      handleNavigation("/admin-pages/system-admin-dashboard")
                    }
                  >
                    <Server className="me-2 text-primary" size={18} />
                    System admin
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    className="dropdown-item"
                    onClick={() => handleNavigation("/login")}
                  >
                    <BoxArrowRight className="me-2 text-danger" size={18} />
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
        className="secondary-navbar shadow-sm"
        variant="light"
      >
        <Container fluid className="navbar-container">
          {/* Toggle button for mobile */}
          <Navbar.Toggle
            aria-controls="secondary-navbar-nav"
            onClick={() => setExpanded(expanded ? false : true)}
            className="navbar-toggle"
          >
            {expanded ? <X size={24} /> : <List size={24} />}
          </Navbar.Toggle>

          <Navbar.Collapse id="secondary-navbar-nav">
            {/* Navigation Links */}
            <Nav className="me-auto main-navigation">
              <Nav.Link
                onClick={() => handleNavigation("/dashboard")}
                className="nav-link-item"
              >
                <GraphUp className="me-1" size={16} />
                Dashboard
              </Nav.Link>
              <Dropdown as={Nav.Item} className="nav-dropdown">
                <Dropdown.Toggle as={Nav.Link} className="nav-link-item">
                  <CashStack className="me-1" size={16} />
                  Expenses
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu">
                  <Dropdown.Item
                    onClick={() =>
                      handleNavigation("/expense-management/my-expenses")
                    }
                    className="dropdown-item"
                  >
                    <CreditCard className="me-2" size={16} />
                    My expenses
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() =>
                      handleNavigation("/expense-management/create-expense")
                    }
                    className="dropdown-item"
                  >
                    <Collection className="me-2" size={16} />
                    Create expense
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Nav.Link
                onClick={() => handleNavigation("/expense-approvals/workflows")}
                className="nav-link-item"
              >
                <FileText className="me-1" size={16} />
                Workflows
              </Nav.Link>
              <Nav.Link
                onClick={() => handleNavigation("/expense-approvals/approvals")}
                className="nav-link-item"
              >
                <ClipboardCheck className="me-1" size={16} />
                Approvals
              </Nav.Link>

              {/* Finance Dropdown */}
              <Dropdown as={Nav.Item} className="nav-dropdown">
                <Dropdown.Toggle as={Nav.Link} className="nav-link-item">
                  <CashStack className="me-1" size={16} />
                  Finance
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu">
                  <Dropdown.Item
                    onClick={() => handleNavigation("/finance/qued-expenses")}
                    className="dropdown-item"
                  >
                    <Collection className="me-2" size={16} />
                    Manage expenses
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleNavigation("/finance/pay-expenses")}
                    className="dropdown-item"
                  >
                    <CreditCard className="me-2" size={16} />
                    Pay expenses
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleNavigation("/finance/budgets")}
                    className="dropdown-item"
                  >
                    <Receipt className="me-2" size={16} />
                    Budgets
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleNavigation("/finance/accounts")}
                    className="dropdown-item"
                  >
                    <Wallet2 className="me-2" size={16} />
                    All expenses
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown as={Nav.Item} className="nav-dropdown">
                <Dropdown.Toggle as={Nav.Link} className="nav-link-item">
                  <CashStack className="me-1" size={16} />
                  Data inputs
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu">
                  <Dropdown.Item
                    onClick={() => handleNavigation("/data-inputs/categories")}
                    className="dropdown-item"
                  >
                    <Collection className="me-2" size={16} />
                    Categories
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleNavigation("/data-inputs/departments")}
                    className="dropdown-item"
                  >
                    <CreditCard className="me-2" size={16} />
                    Departments
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>

            {/* Right side items */}
            <div className="navbar-right-container">
              {/* Search Bar */}
              <div className="search-container me-3 d-none d-md-block">
                <InputGroup>
                  <InputGroup.Text className="search-icon-container">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search..."
                    className="search-input"
                  />
                </InputGroup>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <style jsx global>{`
        .dual-navbar-container {
          margin-bottom: 0;
          position: sticky;
          top: 0;
          z-index: 1030;
        }

        /* Primary Navbar Styles */
        .primary-navbar {
          background: linear-gradient(
            135deg,
            #2c3e50 0%,
            #1a2530 100%
          ) !important;
          padding: 0.5rem 0;
          min-height: 64px;
        }

        .navbar-container {
          max-width: 100%;
          padding: 0 1.5rem;
        }

        .brand-container {
          padding: 0.5rem 0;
        }

        .logo-icon {
          background: linear-gradient(45deg, #4e73df, #224abe);
          border-radius: 8px;
          padding: 6px;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-text {
          font-size: 1.4rem;
          background: linear-gradient(to right, #fff, #e0e0e0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }

        .navbar-toggle {
          border: none;
          padding: 0.25rem 0.5rem;
        }

        .navbar-toggle:focus {
          box-shadow: none;
        }

        .navbar-right-container {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .notification-dropdown-container {
          margin-right: 1rem;
        }

        .notification-toggle {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 50% !important;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .notification-toggle:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        .notification-toggle:after {
          display: none;
        }

        .notification-badge {
          font-size: 0.6rem;
          padding: 0.25em 0.5em;
          top: -5px !important;
          right: -5px !important;
        }

        .notification-dropdown {
          width: 350px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border-radius: 0.5rem;
          padding: 0;
        }

        .dropdown-header {
          font-weight: 600;
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }

        .notification-item {
          border-left: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
          border-left: 3px solid #4e73df;
        }

        .notification-time {
          font-size: 0.75rem;
        }

        .view-all-notifications {
          color: #4e73df !important;
          font-weight: 500;
          padding: 0.75rem 1rem;
        }

        .view-all-notifications:hover {
          background-color: #f8f9fa;
        }

        .user-dropdown-toggle {
          background: transparent !important;
          border: none !important;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .user-dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .user-dropdown-toggle:after {
          margin-left: 0.5rem;
        }

        .user-avatar {
          color: #fff;
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
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border-radius: 0.5rem;
          padding: 0.5rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          margin: 0 0.25rem;
          width: auto;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }

        /* Secondary Navbar Styles */
        .secondary-navbar {
          background: linear-gradient(to right, #f8f9fa, #e9ecef) !important;
          padding: 0.5rem 0;
          min-height: 56px;
          border-top: 1px solid #dee2e6;
        }

        .main-navigation {
          align-items: center;
        }

        .nav-link-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem !important;
          border-radius: 0.375rem;
          margin: 0 0.15rem;
          color: #4e73df !important;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-link-item:hover {
          background-color: rgba(78, 115, 223, 0.1);
          color: #224abe !important;
        }

        .nav-dropdown .dropdown-toggle {
          display: flex;
          align-items: center;
        }

        .nav-dropdown .dropdown-menu {
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          border-radius: 0.5rem;
          padding: 0.5rem;
        }

        .search-icon-container {
          background-color: #fff;
          border: 1px solid #ced4da;
          border-right: none;
          border-radius: 0.375rem 0 0 0.375rem;
        }

        .search-input {
          border-left: none;
          border-radius: 0 0.375rem 0.375rem 0;
        }

        .search-input:focus {
          box-shadow: none;
          border-color: #ced4da;
        }

        /* Responsive adjustments */
        @media (max-width: 991.98px) {
          .navbar-container {
            padding: 0 1rem;
          }

          .navbar-right-container {
            margin-top: 1rem;
            margin-bottom: 1rem;
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
        }
      `}</style>
    </div>
  );
}
