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
  createdAt: string;
  updatedAt: string;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<ExchangeRate | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
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
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
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
    if (!selectedCurrency || !formData.currency || !formData.initials || !formData.rate) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_API_URL}/finance/exchange-rates/${selectedCurrency.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
        body: JSON.stringify({
          currency: formData.currency,
          initials: formData.initials.toUpperCase(),
          rate: parseFloat(formData.rate),
        }),
      });

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
      const response = await fetch(`${BASE_API_URL}/finance/exchange-rates/${selectedCurrency.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
      });

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
      <Container fluid className="currencies-container px-4 py-4">
        <Row className="mb-4">
          <Col>
            <div className="page-header-wrapper">
              <div>
                <h4 className="page-title mb-1">
                  <FaMoneyBillWave className="me-2 text-success" />
                  Currency Management
                </h4>
                <p className="page-subtitle text-muted mb-0">
                  Manage exchange rates for multi-currency support
                </p>
              </div>
              <Button variant="success" size="sm" onClick={openCreateModal} className="btn-action">
                <FaPlus className="me-1" /> Add Currency
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-white">
                <FaSearch className="text-muted" size={12} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by currency name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </Col>
          <Col md={6} className="text-end">
            <Badge bg="light" text="dark" className="px-3 py-2">
              {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'currency' : 'currencies'}
            </Badge>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {filteredCurrencies.length === 0 ? (
                  <div className="text-center py-5">
                    <FaMoneyBillWave size={40} className="text-muted mb-3" />
                    <h6 className="text-muted">
                      {searchTerm ? "No currencies found" : "No currencies yet"}
                    </h6>
                    <p className="text-muted small mb-3">
                      {searchTerm ? "Try a different search term" : "Create your first currency"}
                    </p>
                    {!searchTerm && (
                      <Button variant="success" size="sm" onClick={openCreateModal}>
                        <FaPlus className="me-1" /> Add Currency
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table responsive hover className="mb-0 table-modern">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 text-muted fw-semibold small">#</th>
                        <th className="border-0 text-muted fw-semibold small">Currency</th>
                        <th className="border-0 text-muted fw-semibold small">Code</th>
                        <th className="border-0 text-muted fw-semibold small">Exchange Rate</th>
                        <th className="border-0 text-muted fw-semibold small">Created</th>
                        <th className="border-0 text-muted fw-semibold small">Updated</th>
                        <th className="border-0 text-muted fw-semibold small text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCurrencies.map((currency, index) => (
                        <tr key={currency.id}>
                          <td className="align-middle small text-muted">{index + 1}</td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <div className="currency-icon me-2">
                                <FaMoneyBillWave />
                              </div>
                              <span className="fw-semibold small">{currency.currency}</span>
                            </div>
                          </td>
                          <td className="align-middle">
                            <Badge bg="success" className="px-2 py-1">
                              {currency.initials}
                            </Badge>
                          </td>
                          <td className="align-middle small fw-semibold text-success">
                            {currency.rate.toFixed(4)}
                          </td>
                          <td className="align-middle small text-muted">
                            {new Date(currency.createdAt).toLocaleDateString()}
                          </td>
                          <td className="align-middle small text-muted">
                            {new Date(currency.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="align-middle text-center">
                            <div className="btn-group btn-group-sm">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => openViewModal(currency)}
                                className="btn-action-table"
                              >
                                <FaEye size={12} />
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => openEditModal(currency)}
                                className="btn-action-table"
                              >
                                <FaEdit size={12} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openDeleteModal(currency)}
                                className="btn-action-table"
                              >
                                <FaTrash size={12} />
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
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaPlus className="me-2 text-success" />
              Create Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Currency Name</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., US Dollar"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Currency Code</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., USD"
                  value={formData.initials}
                  onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-semibold">Exchange Rate</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  step="0.0001"
                  placeholder="e.g., 1.0000"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleCreateCurrency}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner animation="border" size="sm" /> : <><FaPlus className="me-1" /> Create</>}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaEdit className="me-2 text-warning" />
              Edit Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Currency Name</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., US Dollar"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Currency Code</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., USD"
                  value={formData.initials}
                  onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-semibold">Exchange Rate</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  step="0.0001"
                  placeholder="e.g., 1.0000"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={handleEditCurrency}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner animation="border" size="sm" /> : <><FaEdit className="me-1" /> Update</>}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaEye className="me-2 text-info" />
              Currency Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            {selectedCurrency && (
              <div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold">Currency Name</label>
                  <p className="mb-0">{selectedCurrency.currency}</p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold">Currency Code</label>
                  <p className="mb-0">
                    <Badge bg="success">{selectedCurrency.initials}</Badge>
                  </p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold">Exchange Rate</label>
                  <p className="mb-0 fw-semibold text-success">{selectedCurrency.rate.toFixed(4)}</p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold">Created At</label>
                  <p className="mb-0 small">{new Date(selectedCurrency.createdAt).toLocaleString()}</p>
                </div>
                <div className="mb-0">
                  <label className="small text-muted fw-semibold">Last Updated</label>
                  <p className="mb-0 small">{new Date(selectedCurrency.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaTrash className="me-2 text-danger" />
              Delete Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <div className="text-center">
              <div className="mb-3">
                <FaTrash size={40} className="text-danger opacity-50" />
              </div>
              <h6>Are you sure?</h6>
              <p className="small text-muted mb-2">
                You are about to delete <strong>{selectedCurrency?.currency} ({selectedCurrency?.initials})</strong>.
              </p>
              <p className="small text-danger mb-0">This action cannot be undone.</p>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteCurrency}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner animation="border" size="sm" /> : <><FaTrash className="me-1" /> Delete</>}
            </Button>
          </Modal.Footer>
        </Modal>

        <style jsx global>{`
          .currencies-container {
            background-color: #f8f9fa;
            min-height: calc(100vh - 120px);
          }

          .page-header-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .page-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #212529;
            display: flex;
            align-items: center;
          }

          .page-subtitle {
            font-size: 0.813rem;
          }

          .btn-action {
            font-size: 0.813rem;
            padding: 0.375rem 0.75rem;
            font-weight: 500;
          }

          .currency-icon {
            width: 32px;
            height: 32px;
            background-color: #d1f4e0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #198754;
            font-size: 0.875rem;
          }

          .table-modern thead th {
            padding: 0.75rem 1rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .table-modern tbody td {
            padding: 0.875rem 1rem;
            font-size: 0.875rem;
          }

          .table-modern tbody tr {
            transition: background-color 0.2s ease;
          }

          .table-modern tbody tr:hover {
            background-color: #f8f9fa;
          }

          .btn-action-table {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            border-width: 1px;
          }

          .modal-title {
            font-size: 1rem;
          }

          @media (max-width: 768px) {
            .page-header-wrapper {
              flex-direction: column;
              gap: 1rem;
              align-items: flex-start;
            }

            .btn-action {
              width: 100%;
            }
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
