"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Badge,
  Spinner,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaMoneyBillWave,
  FaSearch,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import PageLoader from "@/app/components/PageLoader";

interface ExchangeRate {
  id: number;
  currency: string;
  initials: string;
  rate: number;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<ExchangeRate | null>(
    null
  );

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    currency: "",
    initials: "",
    rate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/finance/exchange-rates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCurrencies(data);
      } else {
        toast.error(data.message || "Failed to fetch currencies");
      }
    } catch (error) {
      toast.error(`Error fetching currencies: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCurrency = async () => {
    if (!formData.currency || !formData.initials || !formData.rate) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_API_URL}/finance/exchange-rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
        body: JSON.stringify({
          currency: formData.currency,
          initials: formData.initials.toUpperCase(),
          rate: parseFloat(formData.rate),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Currency created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchCurrencies();
      } else {
        toast.error(data.message || "Failed to create currency");
      }
    } catch (error) {
      toast.error(`Error creating currency: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCurrency = async () => {
    if (
      !selectedCurrency ||
      !formData.currency ||
      !formData.initials ||
      !formData.rate
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/finance/exchange-rates/${selectedCurrency.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
          body: JSON.stringify({
            currency: formData.currency,
            initials: formData.initials.toUpperCase(),
            rate: parseFloat(formData.rate),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Currency updated successfully!");
        setShowEditModal(false);
        resetForm();
        fetchCurrencies();
      } else {
        toast.error(data.message || "Failed to update currency");
      }
    } catch (error) {
      toast.error(`Error updating currency: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCurrency = async () => {
    if (!selectedCurrency) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/finance/exchange-rates/${selectedCurrency.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Currency deleted successfully!");
        setShowDeleteModal(false);
        setSelectedCurrency(null);
        fetchCurrencies();
      } else {
        toast.error(data.message || "Failed to delete currency");
      }
    } catch (error) {
      toast.error(`Error deleting currency: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ currency: "", initials: "", rate: "" });
    setSelectedCurrency(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (currency: ExchangeRate) => {
    setSelectedCurrency(currency);
    setFormData({
      currency: currency.currency,
      initials: currency.initials,
      rate: currency.rate.toString(),
    });
    setShowEditModal(true);
  };

  const openViewModal = (currency: ExchangeRate) => {
    setSelectedCurrency(currency);
    setShowViewModal(true);
  };

  const openDeleteModal = (currency: ExchangeRate) => {
    setSelectedCurrency(currency);
    setShowDeleteModal(true);
  };

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.initials.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="fw-bold mb-1">
                  <FaMoneyBillWave className="me-2 text-success" />
                  Currency Management
                </h2>
                <p className="text-muted mb-0">
                  Manage exchange rates for multi-currency support
                </p>
              </div>
              <Button
                variant="success"
                onClick={openCreateModal}
                className="d-flex align-items-center"
              >
                <FaPlus className="me-2" /> Add Currency
              </Button>
            </div>
          </Col>
        </Row>

        {/* Search Bar */}
        <Row className="mb-4">
          <Col md={6}>
            <div className="position-relative">
              <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <Form.Control
                type="text"
                placeholder="Search by currency name or initials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
              />
            </div>
          </Col>
          <Col md={6} className="text-end">
            <Badge bg="primary" className="px-3 py-2">
              Total Currencies: {currencies.length}
            </Badge>
          </Col>
        </Row>

        {/* Currencies Table */}
        <Row>
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading currencies...</p>
                  </div>
                ) : filteredCurrencies.length === 0 ? (
                  <div className="text-center py-5">
                    <FaMoneyBillWave size={50} className="text-muted mb-3" />
                    <p className="text-muted">
                      {searchTerm
                        ? "No currencies found matching your search"
                        : "No currencies created yet"}
                    </p>
                    {!searchTerm && (
                      <Button
                        variant="success"
                        onClick={openCreateModal}
                        className="mt-3"
                      >
                        <FaPlus className="me-2" /> Add Your First Currency
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Currency Name</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Exchange Rate</th>
                        <th className="py-3 px-4">Last Updated</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCurrencies.map((currency) => (
                        <tr key={currency.id}>
                          <td className="py-3 px-4 fw-semibold">
                            #{currency.id}
                          </td>
                          <td className="py-3 px-4">{currency.currency}</td>
                          <td className="py-3 px-4">
                            <Badge bg="info" className="px-3 py-2">
                              {currency.initials}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 fw-bold text-success">
                            {currency.rate.toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {new Date(currency.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openViewModal(currency)}
                                title="View Details"
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => openEditModal(currency)}
                                title="Edit"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openDeleteModal(currency)}
                                title="Delete"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Create Modal */}
        <Modal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaPlus className="me-2 text-success" />
              Add New Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  Currency Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., US Dollar, Euro, British Pound"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Currency Code <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., USD, EUR, GBP"
                  value={formData.initials}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initials: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={3}
                />
                <Form.Text className="text-muted">
                  3-letter currency code
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Exchange Rate <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 1.2500"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                />
                <Form.Text className="text-muted">
                  Rate against base currency
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleCreateCurrency}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaPlus className="me-2" />
              )}
              Create Currency
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaEdit className="me-2 text-warning" />
              Edit Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  Currency Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Currency Code <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.initials}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initials: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Exchange Rate <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={handleEditCurrency}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaEdit className="me-2" />
              )}
              Update Currency
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Details Modal */}
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaEye className="me-2 text-primary" />
              Currency Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedCurrency && (
              <div>
                <Table borderless>
                  <tbody>
                    <tr>
                      <td className="text-muted fw-semibold">ID:</td>
                      <td>#{selectedCurrency.id}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Currency Name:</td>
                      <td className="fw-bold">{selectedCurrency.currency}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Currency Code:</td>
                      <td>
                        <Badge bg="info" className="px-3 py-2">
                          {selectedCurrency.initials}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Exchange Rate:</td>
                      <td className="fw-bold text-success fs-5">
                        {selectedCurrency.rate.toFixed(4)}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Created At:</td>
                      <td>
                        {new Date(selectedCurrency.createdAt).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Last Updated:</td>
                      <td>
                        {new Date(selectedCurrency.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title>
              <FaTrash className="me-2 text-danger" />
              Delete Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-0">
              Are you sure you want to delete{" "}
              <strong>{selectedCurrency?.currency}</strong> (
              {selectedCurrency?.initials})?
            </p>
            <p className="text-danger mt-2 mb-0">
              <small>This action cannot be undone.</small>
            </p>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCurrency}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaTrash className="me-2" />
              )}
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AuthProvider>
  );
}
