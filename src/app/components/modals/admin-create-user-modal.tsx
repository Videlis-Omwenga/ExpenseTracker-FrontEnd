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
        size="sm"
        variant="primary"
        className="d-flex align-items-center gap-2 px-2 py-1 rounded-3 fw-semibold shadow-primary-button"
        onClick={handleShow}
      >
        <PersonPlus size={18} />
        Add User
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} size="xl">
        <Modal.Header
          closeButton
          className="border-0 pb-0 pt-4 px-4"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <h6 className="fw-bold text-dark d-flex align-items-center">
            <div
              className="icon-wrapper bg-primary me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px" }}
            >
              <PersonPlus size={24} className="text-white" />
            </div>
            <div>
              Add New User
              <div className="text-muted fw-normal small">
                Fill out the details to create a new user
              </div>
            </div>
          </h6>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-3">
            <Card className="border shadow-sm">
              <Card.Header className="bg-info bg-opacity-10 border-0 py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <Briefcase className="me-2 text-primary" size={18} />
                  User Details
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        First Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="rounded-3 py-2 px-3 modern-input"
                      />
                      <Form.Text className="text-muted">
                        Please enter the user&apos;s first name.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Last Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="rounded-3 py-2 px-3 modern-input"
                      />
                      <Form.Text className="text-muted">
                        Please enter the user&apos;s last name.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-3 py-2 px-3 modern-input"
                      />
                      <Form.Text className="text-muted">
                        Please enter the user&apos;s email address.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Phone number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="rounded-3 py-2 px-3 modern-input"
                      />
                      <Form.Text className="text-muted">
                        Please enter the user&apos;s phone number. 25471234567
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Region <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={regionId || ""}
                        onChange={(e) => setRegionId(Number(e.target.value))}
                        required
                        className="rounded-3 py-2 px-3 modern-input"
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Please select the user&apos;s region.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Roles <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="border-0 rounded-3 p-3 modern-input" style={{maxHeight: '200px', overflowY: 'auto'}}>
                        {roles.length === 0 ? (
                          <div className="text-muted text-center py-3">
                            No roles available
                          </div>
                        ) : (
                          <div className="row">
                            {roles.map((r) => (
                              <div key={r.id} className="col-md-3 col-sm-6 mb-2">
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
                                  label={r.name}
                                  className="modern-checkbox"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Form.Text className="text-muted">
                        Please select one or more roles for the user. Selected: {selectedRoles.length}
                      </Form.Text>
                      {selectedRoles.length === 0 && (
                        <div className="text-danger small mt-1">
                          At least one role must be selected.
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark">
                        Hierarchies
                      </Form.Label>
                      <div className="border-0 rounded-3 p-3 modern-input" style={{maxHeight: '200px', overflowY: 'auto'}}>
                        {hierarchies.length === 0 ? (
                          <div className="text-muted text-center py-3">
                            No hierarchies available. Create hierarchies in the Approval Hierarchy section.
                          </div>
                        ) : (
                          <div className="row">
                            {hierarchies.map((h) => (
                              <div key={h.id} className="col-md-3 col-sm-6 mb-2">
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
                                  label={h.name}
                                  className="modern-checkbox"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Form.Text className="text-muted">
                        Select hierarchies to assign to this user. Selected: {selectedHierarchies.length}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Modal.Body>

          <Modal.Footer
            className="border-0 pt-0 px-4 pb-4 mt-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={handleClose}
              className="rounded-3 px-4 py-2 fw-semibold"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={loading}
              className="rounded-3 px-4 py-2 fw-semibold gradient-button"
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Adding...
                </>
              ) : (
                "Add User"
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
          border-color: #06b6d4;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1);
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
          box-shadow: 0 8px 24px rgba(6, 182, 212, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shadow-primary-button:hover {
          box-shadow: 0 12px 32px rgba(6, 182, 212, 0.3);
          transform: translateY(-2px);
        }

        .gradient-button {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .gradient-button::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }

        .gradient-button:hover::before {
          left: 100%;
        }

        .gradient-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(6, 182, 212, 0.4);
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
          background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
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
          background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .modal-footer {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
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
          background-color: #06b6d4;
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }

        .modern-checkbox .form-check-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }

        .modern-checkbox .form-check-label {
          font-weight: 500;
          color: #374151;
          margin-left: 0.5rem;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .modern-checkbox:hover .form-check-label {
          color: #06b6d4;
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
