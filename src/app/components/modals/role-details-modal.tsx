"use client";

import { Modal, Button, Row, Col, Card, Badge } from "react-bootstrap";
import {
  ShieldCheck,
  InfoCircle,
  BuildingFill,
  GeoAltFill,
  Calendar,
  ClockHistory,
  CheckCircle,
  XCircle,
  PersonFill
} from "react-bootstrap-icons";

interface RoleDetailsModalProps {
  role: any;
  show: boolean;
  onHide: () => void;
}

export default function RoleDetailsModal({ role, show, onHide }: RoleDetailsModalProps) {
  if (!role) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-dark d-flex align-items-center">
          <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
            <ShieldCheck className="text-warning" size={24} />
          </div>
          Role Details
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 py-3">
        <Row>
          {/* Basic Information */}
          <Col md={6} className="mb-4">
            <Card className="border h-100">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <ShieldCheck className="me-2 text-warning" size={18} />
                  Basic Information
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase">Role Name</label>
                  <p className="fw-semibold text-dark mb-0">{role.name}</p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <InfoCircle className="me-1" size={12} />
                    Description
                  </label>
                  <p className="fw-medium text-dark mb-0">
                    {role.description || "No description provided"}
                  </p>
                </div>
                <div className="mb-0">
                  <label className="small text-muted fw-semibold text-uppercase">Status</label>
                  <div>
                    <Badge
                      bg={role.isActive ? "success" : "danger"}
                      className="px-3 py-1 rounded-pill fw-medium d-flex align-items-center gap-2"
                      style={{width: "fit-content"}}
                    >
                      {role.isActive ? (
                        <>
                          <CheckCircle size={14} />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Organization & Settings */}
          <Col md={6} className="mb-4">
            <Card className="border h-100">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <BuildingFill className="me-2 text-info" size={18} />
                  Organization & Settings
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <BuildingFill className="me-1" size={12} />
                    Institution
                  </label>
                  <p className="fw-semibold text-dark mb-0">
                    {role.institution?.name || "N/A"}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                    <GeoAltFill className="me-1" size={12} />
                    Region
                  </label>
                  <p className="fw-medium text-dark mb-0">
                    {role.region?.name || "No specific region"}
                  </p>
                </div>
                <div className="mb-0">
                  <label className="small text-muted fw-semibold text-uppercase">Department Restriction</label>
                  <div>
                    <Badge
                      bg={role.restrictToDepartment ? "warning" : "light"}
                      text={role.restrictToDepartment ? "white" : "dark"}
                      className="px-3 py-1 rounded-pill fw-medium"
                    >
                      {role.restrictToDepartment ? "Restricted to Department" : "No Department Restriction"}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* System Information */}
          <Col md={12}>
            <Card className="border">
              <Card.Header className="bg-light border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <ClockHistory className="me-2 text-secondary" size={18} />
                  System Information
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row>
                  <Col md={3}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase">Role ID</label>
                      <p className="fw-medium text-dark mb-0">#{role.id}</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                        <PersonFill className="me-1" size={12} />
                        Created By
                      </label>
                      <p className="fw-medium text-dark mb-0">
                        User #{role.createdBy || "System"}
                      </p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase">Admin Created</label>
                      <p className="fw-medium text-dark mb-0">
                        {role.adminCreatedRole ? "Yes" : "No"}
                      </p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-3">
                      <label className="small text-muted fw-semibold text-uppercase">Institution ID</label>
                      <p className="fw-medium text-dark mb-0">
                        #{role.institutionId || "N/A"}
                      </p>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <div className="mb-0">
                      <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                        <Calendar className="me-1" size={12} />
                        Created At
                      </label>
                      <p className="fw-medium text-dark mb-0">{formatDate(role.createdAt)}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-0">
                      <label className="small text-muted fw-semibold text-uppercase d-flex align-items-center">
                        <Calendar className="me-1" size={12} />
                        Last Updated
                      </label>
                      <p className="fw-medium text-dark mb-0">{formatDate(role.updatedAt)}</p>
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
          background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
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