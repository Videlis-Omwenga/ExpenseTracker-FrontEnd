"use client";

import { Modal, Button, Row, Col, Card, Badge } from "react-bootstrap";
import {
  PersonCircle,
  EnvelopeFill,
  TelephoneFill,
  GeoAltFill,
  BuildingFill,
  ShieldCheck,
  Calendar,
  ClockHistory,
  Diagram3
} from "react-bootstrap-icons";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  institution?: {
    id: number;
    name: string;
    country?: string | null;
  } | null;
  region?: {
    id: number;
    name: string;
  } | null;
  roles?: Array<{
    role?: {
      name: string;
    };
    name?: string;
  }>;
  hierarchies?: Array<{
    id: number;
    name: string;
    hierarchyId?: number;
  }>;
  hierarchyAssignments?: Array<{
    hierarchy: {
      id: number;
      name: string;
    };
    hierarchyLevel: {
      id: number;
      order: number;
    };
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  adminCreatedUser: boolean;
}

interface UserDetailsModalProps {
  user: User | null;
  show: boolean;
  onHide: () => void;
}

export default function UserDetailsModal({ user, show, onHide }: UserDetailsModalProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRoles = (): string[] => {
    if (!user.roles || !Array.isArray(user.roles)) return [];
    return user.roles.map((roleObj) => {
      if (roleObj.role && roleObj.role.name) {
        return roleObj.role.name;
      }
      return roleObj.name || '';
    }).filter(Boolean);
  };

  const getHierarchies = (): string[] => {
    // First try to get from hierarchyAssignments (new structure)
    if (user.hierarchyAssignments && Array.isArray(user.hierarchyAssignments)) {
      return user.hierarchyAssignments.map((ha) => ha.hierarchy.name).filter(Boolean);
    }
    // Fallback to hierarchies (old structure)
    if (user.hierarchies && Array.isArray(user.hierarchies)) {
      return user.hierarchies.map((hierarchy) => hierarchy.name).filter(Boolean);
    }
    return [];
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <h6 className="fw-bold text-dark d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
            <PersonCircle className="text-primary" size={24} />
          </div>
          User Details
        </h6>
      </Modal.Header>

      <Modal.Body className="px-4 py-3">
        <Row>
          {/* Basic Information */}
          <Col md={6} className="mb-4">
            <Card className="border h-100">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <PersonCircle className="me-2 text-primary" size={18} />
                  Basic Information
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase">Full Name</label>
                  <p className="fw-semibold text-dark mb-0">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <EnvelopeFill className="me-1" size={12} />
                    Email Address
                  </label>
                  <p className="fw-medium text-dark mb-0">{user.email}</p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <TelephoneFill className="me-1" size={12} />
                    Phone Number
                  </label>
                  <p className="fw-medium text-dark mb-0">{user.phone}</p>
                </div>
                <div className="mb-0">
                  <label className="small text-muted fw-semibold text-uppercase">Status</label>
                  <div>
                    <Badge
                      bg={user.status === "ACTIVE" ? "success" : user.status === "INACTIVE" ? "warning" : "secondary"}
                      className="px-3 py-1 rounded-pill fw-medium"
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Organization Information */}
          <Col md={6} className="mb-4">
            <Card className="border h-100">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <BuildingFill className="me-2 text-success" size={18} />
                  Organization Details
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <BuildingFill className="me-1" size={12} />
                    Institution
                  </label>
                  <p className="fw-semibold text-dark mb-0">
                    {user.institution?.name || "N/A"}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <GeoAltFill className="me-1" size={12} />
                    Region
                  </label>
                  <p className="fw-medium text-dark mb-0">
                    {user.region?.name || "N/A"}
                  </p>
                </div>
                <div className="mb-0">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <ShieldCheck className="me-1" size={12} />
                    Roles
                  </label>
                  <div className="d-flex flex-wrap gap-1">
                    {getRoles().length > 0 ? (
                      getRoles().map((role: string, index: number) => (
                        <Badge
                          key={index}
                          bg="primary"
                          className="px-2 py-1 rounded-pill small fw-medium"
                        >
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">No roles assigned</span>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Approval Hierarchies */}
          <Col md={12} className="mb-4">
            <Card className="border">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <Diagram3 className="me-2 text-warning" size={18} />
                  Approval Hierarchies
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-0">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center mb-2">
                    <Diagram3 className="me-1" size={12} />
                    Assigned Hierarchies
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {getHierarchies().length > 0 ? (
                      getHierarchies().map((hierarchy: string, index: number) => (
                        <Badge
                          key={index}
                          bg="warning"
                          text="dark"
                          className="px-3 py-2 rounded-pill fw-medium"
                        >
                          {hierarchy}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">No approval hierarchies assigned</span>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Account Information */}
          <Col md={12}>
            <Card className="border">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <ClockHistory className="me-2 text-info" size={18} />
                  Account Information
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row>
                  <Col md={4}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                        <Calendar className="me-1" size={12} />
                        Created At
                      </label>
                      <p className="fw-medium text-dark mb-0">{formatDate(user.createdAt)}</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                        <Calendar className="me-1" size={12} />
                        Last Updated
                      </label>
                      <p className="fw-medium text-dark mb-0">{formatDate(user.updatedAt)}</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                        <ClockHistory className="me-1" size={12} />
                        Last Login
                      </label>
                      <p className="fw-medium text-dark mb-0">
                        {user.lastLogin ? formatDate(user.lastLogin) : "Never logged in"}
                      </p>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <div className="mb-0">
                      <label className="small text-muted fw-semibold text-uppercase">User ID</label>
                      <p className="fw-medium text-dark mb-0">#{user.id}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-0">
                      <label className="small text-muted fw-semibold text-uppercase">Admin Created</label>
                      <p className="fw-medium text-dark mb-0">
                        {user.adminCreatedUser ? "Yes" : "No"}
                      </p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          className="rounded-3 px-4 py-2 fw-semibold"
        >
          Close
        </Button>
      </Modal.Footer>

      <style jsx global>{`
        .modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .modal-footer {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-top: 2px solid #e5e7eb;
        }

        .card {
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </Modal>
  );
}