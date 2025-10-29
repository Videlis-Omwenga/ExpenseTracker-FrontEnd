"use client";

// Remove file-saver and xlsx imports
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
  FaFileExport,
  FaHistory,
  FaCompressArrowsAlt,
} from "react-icons/fa";

// Create a simpler export service without external dependencies
const exportService = {
  downloadCSV(data: any[], filename: string) {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => obj[header]));
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const [formData, setFormData] = useState({
    currency: "",
    initials: "",
    rate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [compareData, setCompareData] = useState<{
    from: ExchangeRate | null;
    to: ExchangeRate | null;
  }>({ from: null, to: null });

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

  const openHistoryModal = (currency: ExchangeRate) => {
    setSelectedCurrency(currency);
    setShowHistoryModal(true);
  };

  const openCompareModal = (currency: ExchangeRate) => {
    if (!compareData.from) {
      setCompareData({ from: currency, to: null });
    } else {
      setCompareData((prev) => ({ ...prev, to: currency }));
    }
    setShowCompareModal(true);
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

  const handleExportData = async (type: 'csv') => {
    try {
      const data = currencies.map(c => ({
        Currency: c.currency,
        Code: c.initials,
        'Exchange Rate': c.rate.toFixed(4),
        'Created At': new Date(c.createdAt).toLocaleString(),
        'Updated At': new Date(c.updatedAt).toLocaleString(),
      }));

      const filename = `currencies_${new Date().toISOString().split('T')[0]}`;
      exportService.downloadCSV(data, filename);
      toast.success('Successfully exported to CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export: ${error}`);
    }
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
            <div className="search-wrapper">
              <div className="search-container">
                <InputGroup size="sm" className="search-input-group">
                  <InputGroup.Text className="search-icon-wrapper">
                    <FaSearch className="search-icon" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search currencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <InputGroup.Text 
                      className="search-clear-wrapper"
                      onClick={() => setSearchTerm("")}
                      role="button"
                    >
                      <FaTrash className="search-clear-icon" />
                    </InputGroup.Text>
                  )}
                </InputGroup>
                {searchTerm && (
                  <div className="search-results">
                    <div className="results-content">
                      Found {filteredCurrencies.length} {filteredCurrencies.length === 1 ? 'result' : 'results'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Col>
          <Col md={6} className="d-flex justify-content-end align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handleExportData('csv')}
              disabled={currencies.length === 0}
            >
              <FaFileExport className="me-1" /> Export CSV
            </Button>
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
                          <td className="align-middle small text-muted">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>
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
                            <div className="d-flex gap-2 justify-content-center">
                              <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => openViewModal(currency)}
                                  className="btn-icon btn-view"
                                >
                                  <FaEye size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Edit Currency</Tooltip>}>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => openEditModal(currency)}
                                  className="btn-icon btn-edit"
                                >
                                  <FaEdit size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Delete Currency</Tooltip>}>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => openDeleteModal(currency)}
                                  className="btn-icon btn-delete"
                                >
                                  <FaTrash size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>View History</Tooltip>}>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => openHistoryModal(currency)}
                                  className="btn-icon btn-history"
                                >
                                  <FaHistory size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Compare Currency</Tooltip>}>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => openCompareModal(currency)}
                                  className="btn-icon btn-compare"
                                >
                                  <FaCompressArrowsAlt size={14} />
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
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaPlus className="me-2 text-success" />
              Create Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form>
              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <FaMoneyBillWave className="me-2 text-success" />
                    Currency Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="form-input"
                  />
                  <Form.Text className="text-muted">e.g., US Dollar</Form.Text>
                </Form.Group>
              </div>

              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <FaFileExport className="me-2 text-primary" />
                    Currency Code
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={formData.initials}
                    onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className="form-input text-uppercase"
                  />
                  <Form.Text className="text-muted">
                    Enter a 3-letter currency code (e.g., USD, EUR, GBP)
                  </Form.Text>
                </Form.Group>
              </div>

              <div className="form-card">
                <Form.Group>
                  <Form.Label className="form-label">
                    <FaSort className="me-2 text-warning" />
                    Exchange Rate
                  </Form.Label>
                  <InputGroup size="sm">
                    <Form.Control
                      type="number"
                      step="0.0001"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      className="form-input"
                    />
                    <InputGroup.Text className="bg-light">Rate</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Enter the exchange rate relative to the base currency e.g. 120
                  </Form.Text>
                </Form.Group>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              variant="light" 
              size="sm" 
              onClick={() => setShowCreateModal(false)}
              className="btn-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleCreateCurrency}
              disabled={isSubmitting}
              className="btn-submit"
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaPlus className="me-1" /> Create Currency
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaEdit className="me-2 text-warning" />
              Edit Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form>
              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <FaMoneyBillWave className="me-2 text-success" />
                    Currency Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="form-input"
                  />
                  <Form.Text className="text-muted">e.g., US Dollar</Form.Text>
                </Form.Group>
              </div>

              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <FaFileExport className="me-2 text-primary" />
                    Currency Code
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={formData.initials}
                    onChange={(e) => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className="form-input text-uppercase"
                  />
                  <Form.Text className="text-muted">
                    Enter a 3-letter currency code (e.g., USD, EUR, GBP)
                  </Form.Text>
                </Form.Group>
              </div>

              <div className="form-card">
                <Form.Group>
                  <Form.Label className="form-label">
                    <FaSort className="me-2 text-warning" />
                    Exchange Rate
                  </Form.Label>
                  <InputGroup size="sm">
                    <Form.Control
                      type="number"
                      step="0.0001"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      className="form-input"
                    />
                    <InputGroup.Text className="bg-light">Rate</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Enter the exchange rate relative to the base currency e.g. 120
                  </Form.Text>
                </Form.Group>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              variant="light" 
              size="sm" 
              onClick={() => setShowEditModal(false)}
              className="btn-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={handleEditCurrency}
              disabled={isSubmitting}
              className="btn-submit"
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaEdit className="me-1" /> Update Currency
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaEye className="me-2 text-info" />
              Currency Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4">
            {selectedCurrency && (
              <div className="currency-details">
                <div className="currency-header mb-4">
                  <div className="currency-avatar">
                    {selectedCurrency.initials.charAt(0)}
                  </div>
                  <div className="text-center">
                    <h4 className="currency-name mb-2">{selectedCurrency.currency}</h4>
                    <Badge bg="success" className="currency-code-badge">
                      {selectedCurrency.initials}
                    </Badge>
                  </div>
                </div>

                <Row className="g-4">
                  <Col md={6}>
                    <div className="detail-card">
                      <div className="detail-icon">
                        <FaMoneyBillWave className="text-success" />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Exchange Rate</div>
                        <div className="detail-value text-success">
                          {selectedCurrency.rate.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-card">
                      <div className="detail-icon">
                        <FaHistory className="text-primary" />
                      </div>
                      <div className="detail-content">
                        <div className="detail-label">Last Updated</div>
                        <div className="detail-value">
                          {new Date(selectedCurrency.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="additional-info mt-4">
                  <h6 className="section-title mb-3">Additional Information</h6>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Created Date</span>
                      <span className="info-value">
                        {new Date(selectedCurrency.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Created Time</span>
                      <span className="info-value">
                        {new Date(selectedCurrency.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status</span>
                      <span className="info-value">
                        <Badge bg="success" className="status-badge">Active</Badge>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" size="sm" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button
              variant="info"
              size="sm"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedCurrency!);
              }}
            >
              <FaEdit className="me-1" /> Edit Currency
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaTrash className="me-2 text-danger" />
              Delete Currency
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <div className="text-center">
              <div className="delete-icon-wrapper">
                <FaTrash />
              </div>
              <h5 className="mb-3">Delete Currency</h5>
              <p className="text-muted mb-2">
                Are you sure you want to delete <br />
                <strong className="text-dark">{selectedCurrency?.currency}</strong>
                <Badge bg="danger" className="ms-2">{selectedCurrency?.initials}</Badge>
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

        {/* History Modal */}
        <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaHistory className="me-2 text-info" />
              Currency Rate History
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            {selectedCurrency && selectedCurrency.history && selectedCurrency.history.length > 0 ? (
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 text-muted fw-semibold small">#</th>
                    <th className="border-0 text-muted fw-semibold small">Date</th>
                    <th className="border-0 text-muted fw-semibold small">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCurrency.history.map((item: { date: string; rate: number }, index: number) => (
                    <tr key={index}>
                      <td className="align-middle small text-muted">{index + 1}</td>
                      <td className="align-middle small text-muted">
                        {new Date(item.date).toLocaleString()}
                      </td>
                      <td className="align-middle small fw-semibold text-success">
                        {item.rate.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-5">
                <FaHistory size={40} className="text-muted mb-3" />
                <h6 className="text-muted">No rate history available</h6>
                <p className="text-muted small mb-3">
                  This currency has no recorded rate changes.
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Compare Modal */}
        <Modal show={showCompareModal} onHide={() => setShowCompareModal(false)} size="lg">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <FaCompressArrowsAlt className="me-2 text-info" />
              Compare Currencies
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label className="small fw-semibold">From Currency</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    value={compareData.from?.id || ""}
                    onChange={(e) => {
                      const selected = currencies.find(c => c.id === parseInt(e.target.value));
                      setCompareData(prev => ({ ...prev, from: selected || null }));
                    }}
                  >
                    <option value="">Select a currency</option>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.id}>
                        {currency.currency} ({currency.initials})
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="small fw-semibold">To Currency</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    value={compareData.to?.id || ""}
                    onChange={(e) => {
                      const selected = currencies.find(c => c.id === parseInt(e.target.value));
                      setCompareData(prev => ({ ...prev, to: selected || null }));
                    }}
                  >
                    <option value="">Select a currency</option>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.id}>
                        {currency.currency} ({currency.initials})
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            {compareData.from && compareData.to && (
              <div className="mt-4">
                <h6 className="text-muted mb-3">Comparison Result</h6>
                <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                  <div>
                    <div className="fw-semibold">{compareData.from.currency} ({compareData.from.initials})</div>
                    <div className="small text-muted">
                      Rate: {compareData.from.rate.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-center">
                    <FaCompressArrowsAlt size={24} className="text-info" />
                  </div>
                  <div>
                    <div className="fw-semibold">{compareData.to.currency} ({compareData.to.initials})</div>
                    <div className="small text-muted">
                      Rate: {compareData.to.rate.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowCompareModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <style jsx global>{`
          .currencies-container {
            background-color: #f8fafc;
            min-height: calc(100vh - 56px);
          }

          .page-header-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 2px 15px rgba(0,0,0,0.04);
            border-radius: 1rem;
            transition: transform 0.2s ease;
          }

          .page-header-card:hover {
            transform: translateY(-2px);
          }
          
          .page-title {
            font-size: 1.6rem;
            font-weight: 800;
            background: linear-gradient(45deg, #198754, #20c997);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
          }

          .page-subtitle {
            font-size: 0.95rem;
            color: #64748b;
            font-weight: 500;
          }

          .btn-action {
            font-size: 0.875rem;
            font-weight: 600;
            padding: 0.6rem 1.2rem;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .btn-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.08);
          }

          .currency-count-badge {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 0.6rem 1.2rem;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
            border: 1px solid #e2e8f0;
            color: #475569 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }

          .table-modern {
            border-collapse: separate;
            border-spacing: 0 0.5rem;
          }

          .table-modern thead th {
            padding: 1rem 1.2rem;
            font-size: 0.8rem;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            background-color: #f1f5f9;
            border: none;
            color: #64748b;
          }

          .table-modern tbody td {
            padding: 1.2rem;
            font-size: 0.9rem;
            background-color: #ffffff;
            border: none;
          }

          .table-modern tbody tr {
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
          }

          .table-modern tbody tr:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.06);
          }

          .currency-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #e9f7ef 0%, #d1e7dd 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            font-weight: 700;
            color: #198754;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .badge {
            padding: 0.5rem 1rem;
            font-weight: 600;
            letter-spacing: 0.3px;
          }

          .badge.bg-success {
            background: linear-gradient(135deg, #198754 0%, #20c997 100%) !important;
          }

          .btn-action-table {
            width: 32px;
            height: 32px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s ease;
            background: #ffffff;
            border: 1px solid #e2e8f0;
          }

          .btn-action-table:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.06);
          }

          .btn-icon {
            width: 35px;
            height: 35px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s ease-in-out;
            position: relative;
            overflow: hidden;
            border: none;
          }

          .btn-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: currentColor;
            opacity: 0.1;
            transition: opacity 0.2s ease-in-out;
          }

          .btn-icon:hover::before {
            opacity: 0.15;
          }

          .btn-icon:active {
            transform: scale(0.95);
          }

          .btn-view {
            color: #3b82f6;
          }

          .btn-view:hover {
            background-color: #eff6ff;
            color: #2563eb;
          }

          .btn-edit {
            color: #f59e0b;
          }

          .btn-edit:hover {
            background-color: #fef3c7;
            color: #d97706;
          }

          .btn-delete {
            color: #ef4444;
          }

          .btn-delete:hover {
            background-color: #fee2e2;
            color: #dc2626;
          }

          /* Form Styling */
          .form-card {
            background: #f8fafc;
            border-radius: 1rem;
            padding: 1.25rem;
            transition: all 0.2s ease;
          }

          .form-card:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
          }

          .form-label {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 0.75rem;
          }

          .form-input {
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            background: white;
          }

          .form-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .text-uppercase {
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .form-text {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 0.5rem;
          }

          .btn-submit {
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
            border: none;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .btn-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .btn-cancel {
            border: 1px solid #e2e8f0;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .btn-cancel:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
          }

          .input-group-text {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            color: #64748b;
            font-size: 0.875rem;
            font-weight: 600;
          }

          /* Spinner animation */
          .spinner-border {
            width: 1.2rem;
            height: 1.2rem;
            border-width: 0.15em;
          }

          /* Modal animation refinements */
          .modal-content {
            transform: scale(0.95) translateY(-10px);
          }

          .modal.show .modal-content {
            transform: scale(1) translateY(0);
          }

          /* Currency Details Modal Styling */
          .currency-details {
            position: relative;
          }

          .currency-header {
            text-align: center;
            padding-bottom: 2rem;
            border-bottom: 1px solid #e2e8f0;
          }

          .currency-avatar {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 700;
            color: white;
            margin: 0 auto 1rem;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
          }

          .currency-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
          }

          .currency-code-badge {
            font-size: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
            border: none;
          }

          .detail-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 1rem;
            transition: all 0.2s ease;
          }

          .detail-card:hover {
            transform: translateY(-2px);
            background: #f1f5f9;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }

          .detail-icon {
            width: 48px;
            height: 48px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .detail-content {
            flex: 1;
          }

          .detail-label {
            font-size: 0.875rem;
            color: #64748b;
            margin-bottom: 0.25rem;
          }

          .detail-value {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
          }

          .section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 1rem;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .info-item {
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .info-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .info-value {
            font-size: 0.875rem;
            color: #1e293b;
            font-weight: 500;
          }

          .status-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
          }

          .additional-info {
            background: white;
            border-radius: 1rem;
            padding: 1.5rem;
            margin-top: 2rem;
            border: 1px solid #e2e8f0;
          }

          /* Updated Search Styling */
          .search-wrapper {
            position: relative;
            z-index: 1000;
          }

          .search-container {
            position: relative;
            width: 100%;
          }

          .search-results {
            position: absolute;
            left: 0;
            right: 0;
            top: 100%;
            margin-top: -1px;
            background: white;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 0.75rem;
            border-bottom-right-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            z-index: 1000;
          }

          .results-content {
            padding: 0.75rem;
            font-size: 0.875rem;
            color: #64748b;
            font-weight: 500;
          }

          .search-input-group {
            position: relative;
            z-index: 1001;
          }

          /* Spinner animation */
          .spinner-border {
            width: 1.2rem;
            height: 1.2rem;
            border-width: 0.15em;
          }

          /* Modal animation refinements */
          .modal-content {
            transform: scale(0.95) translateY(-10px);
          }

          .modal.show .modal-content {
            transform: scale(1) translateY(0);
          }

          /* Currency Details Modal Styling */
          .currency-details {
            position: relative;
          }

          .currency-header {
            text-align: center;
            padding-bottom: 2rem;
            border-bottom: 1px solid #e2e8f0;
          }

          .currency-avatar {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 700;
            color: white;
            margin: 0 auto 1rem;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
          }

          .currency-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
          }

          .currency-code-badge {
            font-size: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            background: linear-gradient(135deg, #198754 0%, #20c997 100%);
            border: none;
          }

          .detail-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 1rem;
            transition: all 0.2s ease;
          }

          .detail-card:hover {
            transform: translateY(-2px);
            background: #f1f5f9;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }

          .detail-icon {
            width: 48px;
            height: 48px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .detail-content {
            flex: 1;
          }

          .detail-label {
            font-size: 0.875rem;
            color: #64748b;
            margin-bottom: 0.25rem;
          }

          .detail-value {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
          }

          .section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 1rem;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .info-item {
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .info-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .info-value {
            font-size: 0.875rem;
            color: #1e293b;
            font-weight: 500;
          }

          .status-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
          }

          .additional-info {
            background: white;
            border-radius: 1rem;
            padding: 1.5rem;
            margin-top: 2rem;
            border: 1px solid #e2e8f0;
          }

          /* Search Styling */
          .search-container {
            position: relative;
          }

          .search-input-group {
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            border-radius: 1rem;
            overflow: hidden;
          }

          .search-icon-wrapper {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-right: none !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          .search-icon {
            color: #64748b;
            font-size: 0.875rem;
            transition: color 0.2s ease;
          }

          .search-input {
            border: 1px solid #e2e8f0 !important;
            border-left: none !important;
            padding: 1rem !important;
            font-size: 0.875rem !important;
            background: white !important;
            color: #1e293b !important;
            transition: all 0.2s ease !important;
          }

          .search-input:focus {
            box-shadow: none !important;
            border-color: #e2e8f0 !important;
          }

          .search-input:focus + .search-icon-wrapper .search-icon {
            color: #3b82f6;
          }

          .search-input::placeholder {
            color: #94a3b8;
            font-size: 0.875rem;
          }

          .search-clear-wrapper {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-left: none !important;
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .search-clear-wrapper:hover {
            background: #f8fafc !important;
          }

          .search-clear-icon {
            color: #94a3b8;
            font-size: 0.75rem;
            transition: color 0.2s ease;
          }

          .search-clear-wrapper:hover .search-clear-icon {
            color: #ef4444;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .search-input-group:focus-within {
            box-shadow: 0 4px 6px -1px rgba(59,130,246,0.05);
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}

