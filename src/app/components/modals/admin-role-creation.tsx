"use client";

import { BASE_API_URL } from "@/app/static/apiConfig";
import { useState } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import { PlusCircle, Person, Briefcase } from "react-bootstrap-icons";
import { toast } from "react-toastify";

type RoleCreationModalProps = {
  onSuccess?: () => void;
};

export default function RoleCreationModal({ onSuccess }: RoleCreationModalProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        role,
        description,
      };

      const response = await fetch(`${BASE_API_URL}/system-admin/create-role`, {
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
        toast.success("Role created successfully!");
        setShow(false);
        // Reset form fields
        setRole("");
        setDescription("");
        // Notify parent to refresh data
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to fetch data: ${error}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Enhanced Trigger Button */}
      <Button
        variant="primary"
        className="d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-primary-button"
        onClick={handleShow}
      >
        <PlusCircle size={18} />
        Create Role
      </Button>

      {/* Enhanced Modal */}
      <Modal show={show} onHide={handleClose} size="xl">
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
              <Person size={24} className="text-white" />
            </div>
            <div>
              Create New Role
              <div className="text-muted fw-normal small">
                Add a new role to the system
              </div>
            </div>
          </h5>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-4">
              {/* Section: Role Information */}
              <Card className="border shadow-sm">
                <Card.Header className="bg-info bg-opacity-10 border-0 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <Briefcase className="me-2 text-primary" size={18} />
                    Role Details
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Role Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          required
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Role name is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Description <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Role description is required.
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
                  Creating...
                </>
              ) : (
                "Create Role"
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
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
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
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shadow-primary-button:hover {
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3);
          transform: translateY(-2px);
        }

        .gradient-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .gradient-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .gradient-button:hover::before {
          left: 100%;
        }

        .gradient-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
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

        .card-header {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
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
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
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
