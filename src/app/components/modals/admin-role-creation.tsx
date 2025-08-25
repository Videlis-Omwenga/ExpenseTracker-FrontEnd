"use client";

import { BASE_API_URL } from "@/app/static/apiConfig";
import { useState } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import { PlusCircle, Person, Briefcase } from "react-bootstrap-icons";
import { toast } from "react-toastify";

export default function RoleCreationModal() {
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
          <div className="border rounded p-4">
            <Modal.Body className="px-4 py-3">
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
          </div>
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
          border: 1px solid #dee2e6;
          transition: all 0.3s ease;
        }

        .modern-input:focus {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
        }

        .shadow-success-button {
          box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
        }

        .gradient-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #218838, #1aa179);
        }
      `}</style>
    </>
  );
}
