"use client";

import { useState } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import { PersonPlus, Briefcase } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";

interface Institution {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface AdminCreateUserModalProps {
  institutions: Institution[];
  roles: Role[];
  onSuccess?: () => void;
}

export default function AdminCreateUserModal({
  institutions,
  roles,
  onSuccess,
}: AdminCreateUserModalProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        roles: selectedRoles,
        institution: Number(institution),
        phone,
      };

      const response = await fetch(`${BASE_API_URL}/system-admin/create-user`, {
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
        style={{ fontSize: '0.95rem' }}
      >
        <PersonPlus size={18} />
        Add New User
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} size="xl" centered>
        <Modal.Header
          closeButton
          className="border-0 pb-3 pt-4 px-4"
          style={{ backgroundColor: '#0d6efd', borderRadius: '0' }}
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
                <Row>
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
                        required
                        placeholder="Enter first name"
                        className="rounded-3 border-0 shadow-sm"
                        style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
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
                        required
                        placeholder="Enter last name"
                        className="rounded-3 border-0 shadow-sm"
                        style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
                      />
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please enter the user&apos;s last name.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
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
                        required
                        placeholder="user@company.com"
                        className="rounded-3 border-0 shadow-sm"
                        style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
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
                        required
                        placeholder="254712345678"
                        className="rounded-3 border-0 shadow-sm"
                        style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
                      />
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please enter the user&apos;s phone number. 25471234567
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-shield-fill text-primary"></i>
                        Roles <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="border-0 rounded-3 p-3 shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                        {roles.length === 0 ? (
                          <div className="text-muted text-center py-3">
                            <i className="bi bi-info-circle me-2"></i>
                            No roles available
                          </div>
                        ) : (
                          <div className="row g-2">
                            {roles.map((role) => (
                              <div key={role.id} className="col-md-4 col-sm-6">
                                <Form.Check
                                  type="checkbox"
                                  id={`role-${role.id}`}
                                  checked={selectedRoles.includes(role.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRoles([...selectedRoles, role.id]);
                                    } else {
                                      setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                                    }
                                  }}
                                  label={
                                    <span className="d-flex align-items-center gap-2">
                                      <i className="bi bi-shield-check text-success"></i>
                                      {role.name}{role.description ? ` - ${role.description}` : ''}
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
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex align-items-center gap-2">
                        <i className="bi bi-building text-primary"></i>
                        Institution <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        required
                        className="rounded-3 border-0 shadow-sm"
                        style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', backgroundColor: '#ffffff' }}
                      >
                        <option value="">Select Institution</option>
                        {institutions.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted small mt-1 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Please select the user&apos;s institution.
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
              style={{ fontSize: '0.95rem', backgroundColor: '#0d6efd', color: 'white' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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

        .gradient-button::before { display: none; }

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
          background-color: #ffffff;
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
          /* controlled by utility classes; keep subtle primary-tinted shadow */
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
      `}</style>
    </>
  );
}
