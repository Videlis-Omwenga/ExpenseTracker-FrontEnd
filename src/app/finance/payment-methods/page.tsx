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
  FaCreditCard,
  FaSearch,
  FaWallet,
  FaUniversity,
  FaMoneyCheck,
  FaMobileAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { BASE_API_URL } from "@/app/static/apiConfig";
import AuthProvider from "../../authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import PageLoader from "@/app/components/PageLoader";

interface PaymentMethod {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/finance/payment-methods`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to fetch payment methods");
      }
    } catch (error) {
      toast.error("An error occurred while fetching payment methods");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentMethod = async () => {
    if (!formData.name.trim()) {
      toast.error("Payment method name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_API_URL}/finance/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Payment method created successfully");
        setShowCreateModal(false);
        setFormData({ name: "" });
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create payment method");
      }
    } catch (error) {
      toast.error("An error occurred while creating payment method");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!selectedPaymentMethod || !formData.name.trim()) {
      toast.error("Payment method name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/finance/payment-methods/${selectedPaymentMethod.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success("Payment method updated successfully");
        setShowEditModal(false);
        setFormData({ name: "" });
        setSelectedPaymentMethod(null);
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update payment method");
      }
    } catch (error) {
      toast.error("An error occurred while updating payment method");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!selectedPaymentMethod) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/finance/payment-methods/${selectedPaymentMethod.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("expenseTrackerToken")}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Payment method deleted successfully");
        setShowDeleteModal(false);
        setSelectedPaymentMethod(null);
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete payment method");
      }
    } catch (error) {
      toast.error("An error occurred while deleting payment method");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setFormData({ name: paymentMethod.name });
    setShowEditModal(true);
  };

  const openViewModal = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowViewModal(true);
  };

  const openDeleteModal = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowDeleteModal(true);
  };

  const filteredPaymentMethods = paymentMethods.filter((method) =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("card") || lowerName.includes("credit")) return FaCreditCard;
    if (lowerName.includes("bank") || lowerName.includes("transfer")) return FaUniversity;
    if (lowerName.includes("cash") || lowerName.includes("wallet")) return FaWallet;
    if (lowerName.includes("mobile") || lowerName.includes("mpesa")) return FaMobileAlt;
    if (lowerName.includes("check") || lowerName.includes("cheque")) return FaMoneyCheck;
    return FaCreditCard;
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="payment-methods-container px-4 py-4">
        <Row className="mb-4">
          <Col>
            <div className="page-header-wrapper">
              <div>
                <h4 className="page-title mb-1">
                  <FaCreditCard className="me-2 text-primary" />
                  Payment Methods
                </h4>
                <p className="page-subtitle text-muted mb-0">
                  Manage payment methods for expense tracking
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={openCreateModal} className="btn-action">
                <FaPlus className="me-1" /> Add Method
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
                placeholder="Search payment methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </Col>
          <Col md={6} className="text-end">
            <Badge bg="light" text="dark" className="px-3 py-2">
              {filteredPaymentMethods.length} {filteredPaymentMethods.length === 1 ? 'method' : 'methods'}
            </Badge>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {filteredPaymentMethods.length === 0 ? (
                  <div className="text-center py-5">
                    <FaCreditCard size={40} className="text-muted mb-3" />
                    <h6 className="text-muted">
                      {searchTerm ? "No payment methods found" : "No payment methods yet"}
                    </h6>
                    <p className="text-muted small mb-3">
                      {searchTerm ? "Try a different search term" : "Create your first payment method"}
                    </p>
                    {!searchTerm && (
                      <Button variant="primary" size="sm" onClick={openCreateModal}>
                        <FaPlus className="me-1" /> Add Payment Method
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table responsive hover className="mb-0 table-modern">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 text-muted fw-semibold small">#</th>
                        <th className="border-0 text-muted fw-semibold small">Payment Method</th>
                        <th className="border-0 text-muted fw-semibold small">Created</th>
                        <th className="border-0 text-muted fw-semibold small">Updated</th>
                        <th className="border-0 text-muted fw-semibold small text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentMethods.map((method, index) => {
                        const Icon = getPaymentIcon(method.name);
                        return (
                          <tr key={method.id}>
                            <td className="align-middle small text-muted">{index + 1}</td>
                            <td className="align-middle">
                              <div className="d-flex align-items-center">
                                <div className="icon-wrapper me-2">
                                  <Icon />
                                </div>
                                <span className="fw-semibold small">{method.name}</span>
                              </div>
                            </td>
                            <td className="align-middle small text-muted">
                              {new Date(method.createdAt).toLocaleDateString()}
                            </td>
                            <td className="align-middle small text-muted">
                              {new Date(method.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="align-middle text-center">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => openViewModal(method)}
                                  className="btn-action-table"
                                >
                                  <FaEye size={12} />
                                </Button>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => openEditModal(method)}
                                  className="btn-action-table"
                                >
                                  <FaEdit size={12} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openDeleteModal(method)}
                                  className="btn-action-table"
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
              <FaPlus className="me-2 text-primary" />
              Create Payment Method
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form>
              <Form.Group>
                <Form.Label className="small fw-semibold">Payment Method Name</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., Cash, Credit Card, Bank Transfer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreatePaymentMethod}
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
              Edit Payment Method
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form>
              <Form.Group>
                <Form.Label className="small fw-semibold">Payment Method Name</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g., Cash, Credit Card, Bank Transfer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onClick={handleUpdatePaymentMethod}
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
              Payment Method Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            {selectedPaymentMethod && (
              <div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold">Name</label>
                  <p className="mb-0">{selectedPaymentMethod.name}</p>
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-semibold">Created At</label>
                  <p className="mb-0 small">{new Date(selectedPaymentMethod.createdAt).toLocaleString()}</p>
                </div>
                <div className="mb-0">
                  <label className="small text-muted fw-semibold">Last Updated</label>
                  <p className="mb-0 small">{new Date(selectedPaymentMethod.updatedAt).toLocaleString()}</p>
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
              Delete Payment Method
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <div className="text-center">
              <div className="mb-3">
                <FaTrash size={40} className="text-danger opacity-50" />
              </div>
              <h6>Are you sure?</h6>
              <p className="small text-muted mb-2">
                You are about to delete <strong>{selectedPaymentMethod?.name}</strong>.
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
              onClick={handleDeletePaymentMethod}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner animation="border" size="sm" /> : <><FaTrash className="me-1" /> Delete</>}
            </Button>
          </Modal.Footer>
        </Modal>

        <style jsx global>{`
          .payment-methods-container {
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

          .icon-wrapper {
            width: 32px;
            height: 32px;
            background-color: #e7f3ff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0d6efd;
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
