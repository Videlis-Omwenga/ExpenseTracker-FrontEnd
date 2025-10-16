"use client";

import { BASE_API_URL } from "@/app/static/apiConfig";
import { useState } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import {
  PlusCircle,
  Building,
  CreditCard,
  GeoAlt,
  Globe,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";

export default function InstitutionCreationModal({ onSuccess }: { onSuccess?: () => void }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        industry,
        address,
        city,
        country,
        contactEmail,
        phoneNumber,
        websiteUrl,
        logoUrl,
        subscriptionStartDate,
        subscriptionEndDate,
        billingEmail,
      };

      const response = await fetch(
        `${BASE_API_URL}/system-admin/create-institution`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Institution created successfully!");
        setShow(false);
        // Reset form fields
        setName("");
        setIndustry("");
        setAddress("");
        setCity("");
        setCountry("");
        setContactEmail("");
        setPhoneNumber("");
        setWebsiteUrl("");
        setLogoUrl("");
        setSubscriptionStartDate("");
        setSubscriptionEndDate("");
        setBillingEmail("");

        // Call the success callback to refresh data
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
        Create Institution
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
              <Building size={24} className="text-white" />
            </div>
            <div>
              Create New Institution
              <div className="text-muted fw-normal small">
                Add a new institution on the platform
              </div>
            </div>
          </h5>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body
            className="px-4 py-4 modal-body-scroll"
            style={{ maxHeight: "75vh", overflowY: "auto" }}
          >
              {/* Section: Basic Info */}
              <Card className="border shadow-sm mb-4">
                <Card.Header className="bg-info bg-opacity-10 border-0 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <GeoAlt className="me-2 text-primary" size={18} />
                    Basic Information
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Institution Name{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Institution name is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Industry <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                          required
                        >
                          <option value=""></option>
                          <option value="Education">Education</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Finance">Finance</option>
                          <option value="Technology">Technology</option>
                          <option value="Manufacturing">Manufacturing</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Industry is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Address
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Address is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          City <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          className="rounded-3 py-2 px-3 modern-input"
                        >
                          <option value=""></option>
                          <option value="Nairobi">Nairobi</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Kisumu">Kisumu</option>
                          <option value="Nakuru">Nakuru</option>
                          <option value="Eldoret">Eldoret</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          City is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Country
                        </Form.Label>
                        <Form.Select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        >
                          <option value=""></option>
                          <option value="Kenya">Kenya</option>
                          <option value="Uganda">Uganda</option>
                          <option value="Tanzania">Tanzania</option>
                          <option value="Rwanda">Rwanda</option>
                          <option value="Ethiopia">Ethiopia</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Country is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Contact Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Contact email is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Section: Contact Details */}
              <Card className="border shadow-sm mb-4">
                <Card.Header className="bg-info bg-opacity-10 border-0 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <Globe className="me-2 text-primary" size={18} />
                    Contact Details
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Phone Number
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Phone number is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Website URL
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Website URL is optional.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark">
                      Logo URL
                    </Form.Label>
                    <Form.Control
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="rounded-3 py-2 px-3 modern-input"
                    />
                    <Form.Text className="text-muted">
                      Provide a direct link to your institution's logo image
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Section: Subscription */}
              <Card className="border shadow-sm">
                <Card.Header className="bg-info bg-opacity-10 border-0 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <CreditCard className="me-2 text-primary" size={18} />
                    Subscription / Billing
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Subscription Start
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={subscriptionStartDate}
                          onChange={(e) =>
                            setSubscriptionStartDate(e.target.value)
                          }
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Subscription start date is optional.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Subscription End
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={subscriptionEndDate}
                          onChange={(e) =>
                            setSubscriptionEndDate(e.target.value)
                          }
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Subscription end date is optional.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark">
                      Billing Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="rounded-3 py-2 px-3 modern-input"
                    />
                    <Form.Text className="text-muted">
                      Invoices and billing information will be sent to this
                      email
                    </Form.Text>
                  </Form.Group>
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
              variant="primary"
              type="submit"
              size="sm"
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
                "Create Institution"
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
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
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

        .modal-body-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .modal-body-scroll::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 12px;
        }

        .modal-body-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #cbd5e1, #94a3b8);
          border-radius: 12px;
        }

        .modal-body-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #94a3b8, #64748b);
        }

        .shadow-primary-button {
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shadow-primary-button:hover {
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
        }

        .gradient-button {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
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
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
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
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
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
