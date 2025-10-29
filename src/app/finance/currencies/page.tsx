"use client";

import { useState, useEffect, useMemo } from "react";
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
  Pagination,
  InputGroup,
} from "react-bootstrap";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaMoneyBillWave,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useApi } from "@/app/hooks/useApi";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import PageLoader from "@/app/components/PageLoader";

interface ExchangeRate extends Record<string, any> {
  id: number;
  currency: string;
  initials: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export default function CurrenciesPage() {
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExchangeRate; direction: 'ascending' | 'descending' } | null>({ key: 'currency', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
  const api = useApi();

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const { data, response } = await api.get("/finance/exchange-rates");
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
      const { data, response } = await api.post("/finance/exchange-rates", {
        currency: formData.currency,
        initials: formData.initials.toUpperCase(),
        rate: parseFloat(formData.rate),
      });

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
      const { data, response } = await api.put(`/finance/exchange-rates/${selectedCurrency.id}`, {
        currency: formData.currency,
        initials: formData.initials.toUpperCase(),
        rate: parseFloat(formData.rate),
      });

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
      const { data, response } = await api.delete(`/finance/exchange-rates/${selectedCurrency.id}`);

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

  const sortedCurrencies = useMemo(() => {
    let sortableItems = [...filteredCurrencies];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCurrencies, sortConfig]);

  const paginatedCurrencies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCurrencies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedCurrencies, currentPage]);

  const totalPages = Math.ceil(sortedCurrencies.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof ExchangeRate) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ExchangeRate) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FaSort size={12} className="ms-1 text-muted opacity-50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <FaSortUp size={12} className="ms-1" />;
    }
    return <FaSortDown size={12} className="ms-1" />;
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="currencies-container px-4 py-4">
        <Row className="mb-4">
          <Col>
            <Card className="page-header-card shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
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
              </Card.Body>
            </Card>
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
          <Col md={6} className="d-flex justify-content-end align-items-center mt-2 mt-md-0">
            <Badge pill bg="light" text="dark" className="currency-count-badge">
              {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'currency' : 'currencies'}
            </Badge>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {sortedCurrencies.length === 0 ? (
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
                        <th className="border-0 text-muted fw-semibold small sortable-header" onClick={() => requestSort('currency')}>Currency {getSortIcon('currency')}</th>
                        <th className="border-0 text-muted fw-semibold small sortable-header" onClick={() => requestSort('initials')}>Code {getSortIcon('initials')}</th>
                        <th className="border-0 text-muted fw-semibold small sortable-header" onClick={() => requestSort('rate')}>Exchange Rate {getSortIcon('rate')}</th>
                        <th className="border-0 text-muted fw-semibold small sortable-header" onClick={() => requestSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
                        <th className="border-0 text-muted fw-semibold small sortable-header" onClick={() => requestSort('updatedAt')}>Updated {getSortIcon('updatedAt')}</th>
                        <th className="border-0 text-muted fw-semibold small text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCurrencies.map((currency, index) => (
                        <tr key={currency.id}>
                          <td className="align-middle small text-muted">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <div className="currency-icon me-2">
                                <span>{currency.initials.charAt(0)}</span>
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
                              <OverlayTrigger overlay={<Tooltip>View</Tooltip>}>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => openViewModal(currency)}
                                  className="btn-action-table"
                                >
                                  <FaEye size={12} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => openEditModal(currency)}
                                  className="btn-action-table"
                                >
                                  <FaEdit size={12} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => openDeleteModal(currency)}
                                  className="btn-action-table"
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </OverlayTrigger>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
              {totalPages > 1 && (
                <Card.Footer className="bg-white border-0 py-2">
                  <Pagination size="sm" className="mb-0 justify-content-end">
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    {[...Array(totalPages)].map((_, i) => (
                      <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                  </Pagination>
                </Card.Footer>
              )}
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
                <Row>
                  <Col xs={6}><p className="small text-muted fw-semibold mb-1">Currency Name</p></Col>
                  <Col xs={6}><p className="mb-2">{selectedCurrency.currency}</p></Col>
                </Row>
                <Row>
                  <Col xs={6}><p className="small text-muted fw-semibold mb-1">Currency Code</p></Col>
                  <Col xs={6}><p className="mb-2"><Badge bg="success-light" text="success" className="fw-semibold">{selectedCurrency.initials}</Badge></p></Col>
                </Row>
                <Row>
                  <Col xs={6}><p className="small text-muted fw-semibold mb-1">Exchange Rate</p></Col>
                  <Col xs={6}><p className="mb-2 fw-semibold text-success">{selectedCurrency.rate.toFixed(4)}</p></Col>
                </Row>
                <hr />
                <Row>
                  <Col xs={6}><p className="small text-muted fw-semibold mb-1">Created At</p></Col>
                  <Col xs={6}><p className="mb-2 small">{new Date(selectedCurrency.createdAt).toLocaleString()}</p></Col>
                </Row>
                <Row>
                  <Col xs={6}><p className="small text-muted fw-semibold mb-1">Last Updated</p></Col>
                  <Col xs={6}><p className="mb-0 small">{new Date(selectedCurrency.updatedAt).toLocaleString()}</p></Col>
                </Row>
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
              <p className="small text-muted mb-3">
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
            background-color: #f0f2f5;
            min-height: calc(100vh - 56px);
          }

          .page-header-card {
            border: none;
          }
          
          .page-header-card .btn-action, .empty-state .btn-action {
            white-space: nowrap;
          }
          
          .page-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #343a40;
          }

          .page-subtitle {
            font-size: 0.9rem;
            color: #6c757d;
          }

          .btn-action {
            font-size: 0.875rem;
            font-weight: 600;
            padding: 0.5rem 1rem;
            border-radius: 0.3rem;
          }

          .currency-count-badge {
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.5rem 1rem;
            background-color: #e9ecef !important;
            color: #343a40 !important;
          }

          .sortable-header {
            cursor: pointer;
            user-select: none;
            transition: color 0.2s ease;
          }
          .sortable-header:hover {
            color: #007bff;
          }

          .currency-icon {
            width: 36px;
            height: 36px;
            background-color: #e9f7ef;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 700;
            color: #198754;
          }

          .currency-icon span {
            color: #198754;
          }

          .badge.bg-success-light {
            background-color: #d1e7dd !important;
            font-size: 0.85em;
            font-weight: 600;
          }

          .table-modern thead th {
            padding: 1rem;
            font-size: 0.8rem;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            background-color: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
          }

          .table-modern tbody td {
            padding: 1rem;
            font-size: 0.9rem;
            vertical-align: middle;
          }

          .table-modern tbody tr {
            transition: background-color 0.2s ease, box-shadow 0.2s ease;
          }

          .table-modern tbody tr:hover {
            background-color: #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transform: translateY(-2px);
          }

          .btn-action-table {
            color: #6c757d;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
            padding: 0.375rem 0.75rem;
            transition: all 0.2s ease;
          }
          .btn-action-table:hover {
            background-color: #e9ecef;
            color: #212529;
            border-color: #adb5bd;
          }
          .btn-group-sm > .btn-action-table {
            border-width: 1px;
          }

          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
          }
          .modal-header, .modal-footer {
            background-color: #f8f9fa;
            border: none;
          }
          .modal-content {
            border-radius: 0.5rem;
            border: none;
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }

          @media (max-width: 768px) {
            .page-header-wrapper {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 1rem;
            }

            .page-header-card .btn-action {
              width: 100%;
            }
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
