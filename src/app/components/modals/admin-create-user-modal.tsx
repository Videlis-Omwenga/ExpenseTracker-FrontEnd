"use client";

import { useState } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import { PersonPlus, Briefcase } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";

interface Region {
  id: number;
  name: string;
}

interface Hierarchy {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface AdminCreateUserModalProps {
  roles: Role[];
  regions?: Region[];
  hierarchies?: Hierarchy[];
  onSuccess?: () => void;
}

export default function AdminCreateUserModal({
  roles,
  regions = [],
  hierarchies = [],
  onSuccess,
}: AdminCreateUserModalProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedHierarchies, setSelectedHierarchies] = useState<number[]>([]);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role for the user.");
      return;
    }

    if (!regionId) {
      toast.error("Please select a region for the user.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        role: selectedRoles,
        hierarchies: selectedHierarchies,
        regionId,
        institution: Number(institution),
        phone,
      };

      const response = await fetch(`${BASE_API_URL}/company-admin/create-user`, {
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
        toast.success("User added successfully!");
        setFirstName("");
        setLastName("");
        setEmail("");
        setSelectedRoles([]);
        setSelectedHierarchies([]);
        setRegionId(null);
        setPhone("");
        setInstitution("");
        setShow(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to add user: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="primary"
        className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold shadow-sm border-0"
        onClick={handleShow}
        style={{
          fontSize: '0.95rem'
        }}
      >
        <PersonPlus size={18} />
        Add New User
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} size="xl" centered>
        <Modal.Header
          closeButton
          className="border-0 pb-3 pt-4 px-4"
          style={{
            backgroundColor: '#0d6efd',
            borderRadius: '0'
          }}
        >
          <div className="d-flex align-items-center w-100">
            <div
              className="icon-wrapper bg-white bg-opacity-20 me-3 rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "56px", height: "56px" }}
            >
              <PersonPlus size={26} className="text-white" />
            </div>
            <div>
              <h5 className="fw-bold text-white mb-1">Add New User</h5>
              <p className="text-white text-opacity-90 mb-0 small">
                Fill out the details to create a new user
              </p>
            </div>
          </div>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-4" style={{ backgroundColor: '#f8f9fa' }}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 py-3 px-4">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                    <Briefcase className="text-primary" size={18} />
                  </div>
                  User Information
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                        <i className="bi bi-person-fill text-primary"></i>
                        First Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        required
                        className="rounded-3 border-0 shadow-sm"
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.95rem",
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please enter the user&apos;s first name.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                        <i className="bi bi-person-fill text-primary"></i>
                        Last Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        required
                        className="rounded-3 border-0 shadow-sm"
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.95rem",
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please enter the user&apos;s last name.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                        <i className="bi bi-envelope-fill text-primary"></i>
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@company.com"
                        required
                        className="rounded-3 border-0 shadow-sm"
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.95rem",
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please enter the user&apos;s email address.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                        <i className="bi bi-telephone-fill text-primary"></i>
                        Phone Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="254712345678"
                        required
                        className="rounded-3 border-0 shadow-sm"
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.95rem",
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please enter the user&apos;s phone number. e.g., 254712345678
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                        <i className="bi bi-geo-alt-fill text-primary"></i>
                        Region <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={regionId || ""}
                        onChange={(e) => setRegionId(Number(e.target.value))}
                        required
                        className="rounded-3 border-0 shadow-sm"
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.95rem",
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            🌍 {region.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please select the user&apos;s region.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-shield-fill text-primary"></i>
                        Roles <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="border-0 rounded-3 p-3 shadow-sm" style={{maxHeight: '200px', overflowY: 'auto', backgroundColor: '#ffffff'}}>
                        {roles.length === 0 ? (
                          <div className="text-muted text-center py-3">
                            <i className="bi bi-info-circle me-2"></i>
                            No roles available
                          </div>
                        ) : (
                          <div className="row g-2">
                            {roles.map((r) => (
                              <div key={r.id} className="col-md-4 col-sm-6">
                                <Form.Check
                                  type="checkbox"
                                  id={`role-${r.id}`}
                                  checked={selectedRoles.includes(r.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRoles([...selectedRoles, r.id]);
                                    } else {
                                      setSelectedRoles(selectedRoles.filter(roleId => roleId !== r.id));
                                    }
                                  }}
                                  label={
                                    <span className="d-flex align-items-center gap-2">
                                      <i className="bi bi-shield-check text-success"></i>
                                      {r.name}
                                    </span>
                                  }
                                  className="p-2 rounded hover-bg-light"
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Form.Text className="text-muted small mt-2 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please select one or more roles for the user. Selected: <strong className="text-primary">{selectedRoles.length}</strong>
                      </Form.Text>
                      {selectedRoles.length === 0 && (
                        <div className="alert alert-danger border-0 mt-2 py-2 px-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                          <i className="bi bi-exclamation-triangle-fill"></i>
                          At least one role must be selected.
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-diagram-3-fill text-primary"></i>
                        Hierarchies
                      </Form.Label>
                      <div className="border-0 rounded-3 p-3 shadow-sm" style={{maxHeight: '200px', overflowY: 'auto', backgroundColor: '#ffffff'}}>
                        {hierarchies.length === 0 ? (
                          <div className="text-muted text-center py-3">
                            <i className="bi bi-info-circle me-2"></i>
                            No hierarchies available. Create hierarchies in the Approval Hierarchy section.
                          </div>
                        ) : (
                          <div className="row g-2">
                            {hierarchies.map((h) => (
                              <div key={h.id} className="col-md-4 col-sm-6">
                                <Form.Check
                                  type="checkbox"
                                  id={`hierarchy-${h.id}`}
                                  checked={selectedHierarchies.includes(h.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedHierarchies([...selectedHierarchies, h.id]);
                                    } else {
                                      setSelectedHierarchies(selectedHierarchies.filter(hierarchyId => hierarchyId !== h.id));
                                    }
                                  }}
                                  label={
                                    <span className="d-flex align-items-center gap-2">
                                      <i className="bi bi-diagram-2 text-info"></i>
                                      {h.name}
                                    </span>
                                  }
                                  className="p-2 rounded hover-bg-light"
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Form.Text className="text-muted small mt-2 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Select hierarchies to assign to this user. Selected: <strong className="text-info">{selectedHierarchies.length}</strong>
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Modal.Body>

          <Modal.Footer className="border-0 p-4" style={{ backgroundColor: '#ffffff' }}>
            <Button
              variant="light"
              onClick={handleClose}
              className="px-5 py-3 rounded-pill fw-semibold border-2 shadow-sm"
              disabled={loading}
              style={{ fontSize: '0.95rem' }}
            >
              <i className="bi bi-x-lg me-2"></i>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-pill fw-semibold shadow border-0"
              style={{
                fontSize: '0.95rem',
                backgroundColor: '#0d6efd',
                color: 'white'
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Adding User...
                </>
              ) : (
                <>
                  <PersonPlus size={18} className="me-2" />
                  Add User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        .modern-input {
          border: 2px solid #e9ecef;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          font-size: 0.95rem;
          line-height: 1.6;
          position: relative;
        }

        .modern-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
          transform: translateY(-1px);
          background: #fefefe;
        }

        .modern-input:hover:not(:focus) {
          border-color: #d1d5db;
          background: #fafafa;
        }

        .form-label {
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.025em;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .shadow-primary-button {
          box-shadow: 0 8px 24px rgba(13, 110, 253, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shadow-primary-button:hover {
          box-shadow: 0 12px 32px rgba(13, 110, 253, 0.28);
          transform: translateY(-2px);
        }

        .gradient-button {
          background-color: #0d6efd;
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        /* removed gradient sheen */

        .gradient-button:hover::before { display: none; }

        .gradient-button:hover:not(:disabled) {
          background-color: #0b5ed7;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 110, 253, 0.35);
        }

        .gradient-button:active {
          transform: translateY(0);
        }

        .card {
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          background: #ffffff;
        }

        .card:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .modal .card-header {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-text {
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 0.375rem;
        }

        .text-danger {
          color: #ef4444 !important;
        }

        .text-muted {
          color: #64748b !important;
        }

        .modal-header {
          background-color: #ffffff; /* default solid background */
          border-bottom: 2px solid #e5e7eb;
        }

        .modal-footer {
          background-color: #ffffff;
          border-top: 2px solid #e5e7eb;
        }

        .btn-outline-secondary {
          border: 2px solid #d1d5db;
          color: #6b7280;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-outline-secondary:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          color: #374151;
          transform: translateY(-1px);
        }

        .icon-wrapper {
          /* let Bootstrap bg-* classes control background; keep subtle shadow */
          box-shadow: 0 4px 16px rgba(13, 110, 253, 0.25);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content {
          animation: slideUp 0.3s ease-out;
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .modern-checkbox .form-check-input {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          transition: all 0.3s ease;
          margin-top: 0.125rem;
        }

        .modern-checkbox .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }

        .modern-checkbox .form-check-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }

        .modern-checkbox .form-check-label {
          font-weight: 500;
          color: #374151;
          margin-left: 0.5rem;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .modern-checkbox:hover .form-check-label {
          color: #0d6efd;
        }

        .modern-checkbox {
          padding: 0.5rem;
          border-radius: 6px;
          transition: background-color 0.3s ease;
        }

        .modern-checkbox:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </>
  );
}
