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

export default function InstitutionCreationModal() {
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
  const [trialEndDate, setTrialEndDate] = useState("");
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
        trialEndDate,
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
        setTrialEndDate("");
        setBillingEmail("");
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
          <div className="border rounded p-4">
            <Modal.Body
              className="px-4 py-3 modal-body-scroll"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
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
                    <Col md={4}>
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
                          Subscription start date is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
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
                          Subscription end date is required.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Trial End
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={trialEndDate}
                          onChange={(e) => setTrialEndDate(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted">
                          Trial end date is required.
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
          border: 1px solid #dee2e6;
          transition: all 0.3s ease;
        }

        .modern-input:focus {
          border-color: #4e54c8;
          box-shadow: 0 0 0 0.2rem rgba(78, 84, 200, 0.25);
        }

        .modal-body-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .modal-body-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .modal-body-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }

        .modal-body-scroll::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        .shadow-primary-button {
          box-shadow: 0 4px 8px rgba(78, 84, 200, 0.3);
        }

        .gradient-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #3a3f99, #6f74e0);
        }
      `}</style>
    </>
  );
}
