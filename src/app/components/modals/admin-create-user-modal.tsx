"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import { PersonPlus, Briefcase, CheckCircle, XCircle } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";

export default function AdminCreateUserModal({ roles }: { roles: any[] }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const firstNameRef = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2) return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s'.-]+$/.test(value.trim())) return "First name contains invalid characters";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2) return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s'.-]+$/.test(value.trim())) return "Last name contains invalid characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return "Please enter a valid email address";
        return "";
      case "role":
        if (!value) return "Role is required";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    newErrors.firstName = validateField("firstName", firstName);
    newErrors.lastName = validateField("lastName", lastName);
    newErrors.email = validateField("email", email);
    newErrors.role = validateField("role", role);

    const validErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, error]) => error !== "")
    );

    setErrors(validErrors);
    return Object.keys(validErrors).length === 0;
  };

  const handleFieldChange = (name: string, value: string) => {
    switch (name) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "role":
        setRole(value);
        break;
    }

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleFieldBlur = (name: string, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("");
    setErrors({});
    setTouched({});
  };

  const handleClose = () => {
    setShow(false);
    setTimeout(resetForm, 300);
  };

  const handleShow = () => {
    setShow(true);
    setTimeout(() => {
      firstNameRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (show && e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        role,
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
        toast.success(`User ${payload.firstName} ${payload.lastName} created successfully!`);
        resetForm();
        setShow(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        if (data.message?.includes("email") && data.message?.includes("exists")) {
          setErrors(prev => ({ ...prev, email: "This email address is already registered" }));
          toast.error("Email address already exists");
        } else {
          toast.error(data.message || "Failed to create user");
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="primary"
        className="d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-semibold shadow-primary-button"
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
          <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
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
          </h5>
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
                      <Form.Label className="fw-semibold text-dark" htmlFor="firstName">
                        First Name <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          id="firstName"
                          ref={firstNameRef}
                          type="text"
                          value={firstName}
                          onChange={(e) => handleFieldChange("firstName", e.target.value)}
                          onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
                          required
                          className={`rounded-3 py-2 px-3 modern-input ${errors.firstName ? 'is-invalid' : touched.firstName && !errors.firstName ? 'is-valid' : ''}`}
                          placeholder="Enter first name"
                          autoComplete="given-name"
                        />
                        {touched.firstName && !errors.firstName && (
                          <CheckCircle className="position-absolute text-success" style={{ top: '10px', right: '10px' }} size={16} />
                        )}
                        {errors.firstName && (
                          <XCircle className="position-absolute text-danger" style={{ top: '10px', right: '10px' }} size={16} />
                        )}
                      </div>
                      {errors.firstName ? (
                        <Form.Text className="text-danger">
                          {errors.firstName}
                        </Form.Text>
                      ) : touched.firstName ? (
                        <Form.Text className="text-success">
                          Looks good!
                        </Form.Text>
                      ) : (
                        <Form.Text className="text-muted">
                          Enter the user's first name (minimum 2 characters)
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark" htmlFor="lastName">
                        Last Name <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => handleFieldChange("lastName", e.target.value)}
                          onBlur={(e) => handleFieldBlur("lastName", e.target.value)}
                          required
                          className={`rounded-3 py-2 px-3 modern-input ${errors.lastName ? 'is-invalid' : touched.lastName && !errors.lastName ? 'is-valid' : ''}`}
                          placeholder="Enter last name"
                          autoComplete="family-name"
                        />
                        {touched.lastName && !errors.lastName && (
                          <CheckCircle className="position-absolute text-success" style={{ top: '10px', right: '10px' }} size={16} />
                        )}
                        {errors.lastName && (
                          <XCircle className="position-absolute text-danger" style={{ top: '10px', right: '10px' }} size={16} />
                        )}
                      </div>
                      {errors.lastName ? (
                        <Form.Text className="text-danger">
                          {errors.lastName}
                        </Form.Text>
                      ) : touched.lastName ? (
                        <Form.Text className="text-success">
                          Looks good!
                        </Form.Text>
                      ) : (
                        <Form.Text className="text-muted">
                          Enter the user's last name (minimum 2 characters)
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark" htmlFor="email">
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          onBlur={(e) => handleFieldBlur("email", e.target.value)}
                          required
                          className={`rounded-3 py-2 px-3 modern-input ${errors.email ? 'is-invalid' : touched.email && !errors.email ? 'is-valid' : ''}`}
                          placeholder="Enter email address"
                          autoComplete="email"
                        />
                        {touched.email && !errors.email && (
                          <CheckCircle className="position-absolute text-success" style={{ top: '10px', right: '10px' }} size={16} />
                        )}
                        {errors.email && (
                          <XCircle className="position-absolute text-danger" style={{ top: '10px', right: '10px' }} size={16} />
                        )}
                      </div>
                      {errors.email ? (
                        <Form.Text className="text-danger">
                          {errors.email}
                        </Form.Text>
                      ) : touched.email ? (
                        <Form.Text className="text-success">
                          Looks good!
                        </Form.Text>
                      ) : (
                        <Form.Text className="text-muted">
                          Enter a valid email address (e.g., user@company.com)
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-dark" htmlFor="role">
                        Role <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Select
                          id="role"
                          value={role}
                          onChange={(e) => handleFieldChange("role", e.target.value)}
                          onBlur={(e) => handleFieldBlur("role", e.target.value)}
                          required
                          className={`rounded-3 py-2 px-3 modern-input ${errors.role ? 'is-invalid' : touched.role && !errors.role ? 'is-valid' : ''}`}
                        >
                          <option value="">Choose a role...</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.role}>
                              {r.role}
                            </option>
                          ))}
                        </Form.Select>
                        {touched.role && !errors.role && (
                          <CheckCircle className="position-absolute text-success" style={{ top: '10px', right: '30px' }} size={16} />
                        )}
                        {errors.role && (
                          <XCircle className="position-absolute text-danger" style={{ top: '10px', right: '30px' }} size={16} />
                        )}
                      </div>
                      {errors.role ? (
                        <Form.Text className="text-danger">
                          {errors.role}
                        </Form.Text>
                      ) : touched.role ? (
                        <Form.Text className="text-success">
                          Great choice!
                        </Form.Text>
                      ) : (
                        <Form.Text className="text-muted">
                          Select the appropriate role for this user
                        </Form.Text>
                      )}
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
              disabled={loading || Object.keys(errors).length > 0}
              className="rounded-3 px-4 py-2 fw-semibold gradient-button d-flex align-items-center"
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating User...
                </>
              ) : (
                <>
                  <PersonPlus size={16} className="me-2" />
                  Create User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        .modern-input {
          border: 1px solid #dee2e6;
          transition: all 0.3s ease;
          position: relative;
        }

        .modern-input:focus {
          border-color: #28a745;
          box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
          transform: translateY(-1px);
        }

        .modern-input.is-valid {
          border-color: #28a745;
          background-image: none;
        }

        .modern-input.is-invalid {
          border-color: #dc3545;
          background-image: none;
          animation: shake 0.5s ease-in-out;
        }

        .gradient-button {
          background: linear-gradient(135deg, #007bff, #0056b3);
          border: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .gradient-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #0056b3, #004085);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .gradient-button:disabled {
          background: #6c757d;
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .gradient-button:active:not(:disabled) {
          transform: translateY(0);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .form-text.text-success {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-text.text-danger {
          font-size: 0.875rem;
          font-weight: 500;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .position-relative .text-success,
        .position-relative .text-danger {
          animation: bounceIn 0.3s ease-out;
        }

        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        .card {
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .card:hover {
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
      `}</style>
    </>
  );
}
