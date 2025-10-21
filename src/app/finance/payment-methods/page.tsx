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
  FaCreditCard,
  FaSearch,
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
  });

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
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
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
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
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
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
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
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
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
    setFormData({
      name: paymentMethod.name,
    });
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
                  <FaCreditCard className="me-2 text-primary" />
                  Payment Methods
                </h2>
                <p className="text-muted mb-0">
                  Manage payment methods for expense tracking
                </p>
              </div>
              <Button variant="primary" onClick={openCreateModal}>
                <FaPlus className="me-2" />
                Add Payment Method
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
                placeholder="Search by payment method name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
              />
            </div>
          </Col>
          <Col md={6} className="text-end">
            <Badge bg="primary" className="px-3 py-2">
              Total Payment Methods: {paymentMethods.length}
            </Badge>
          </Col>
        </Row>

        {/* Payment Methods Table */}
        <Row>
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                {filteredPaymentMethods.length === 0 ? (
                  <div className="text-center py-5">
                    <FaCreditCard size={48} className="text-muted mb-3" />
                    <p className="text-muted">
                      {searchTerm
                        ? "No payment methods found matching your search"
                        : "No payment methods available. Create one to get started!"}
                    </p>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Payment Method Name</th>
                        <th className="px-4 py-3">Created At</th>
                        <th className="px-4 py-3">Last Updated</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentMethods.map((method, index) => (
                        <tr key={method.id}>
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3">
                            <strong>{method.name}</strong>
                          </td>
                          <td className="px-4 py-3">
                            {new Date(method.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {new Date(method.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => openViewModal(method)}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() => openEditModal(method)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openDeleteModal(method)}
                            >
                              <FaTrash />
                            </Button>
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
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>
              <FaPlus className="me-2 text-primary" />
              Create Payment Method
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Cash, Credit Card, Bank Transfer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePaymentMethod}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaPlus className="me-2" />
                  Create
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          centered
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>
              <FaEdit className="me-2 text-warning" />
              Edit Payment Method
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Cash, Credit Card, Bank Transfer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={handleUpdatePaymentMethod}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaEdit className="me-2" />
                  Update
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Modal */}
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          centered
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>
              <FaEye className="me-2 text-info" />
              Payment Method Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPaymentMethod && (
              <div>
                <div className="mb-3">
                  <strong>Payment Method Name:</strong>
                  <p className="mb-0">{selectedPaymentMethod.name}</p>
                </div>
                <div className="mb-3">
                  <strong>Created At:</strong>
                  <p className="mb-0">
                    {new Date(selectedPaymentMethod.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="mb-3">
                  <strong>Last Updated:</strong>
                  <p className="mb-0">
                    {new Date(selectedPaymentMethod.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Modal */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>
              <FaTrash className="me-2 text-danger" />
              Delete Payment Method
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedPaymentMethod?.name}</strong>?
            </p>
            <p className="text-danger mb-0">This action cannot be undone.</p>
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
              onClick={handleDeletePaymentMethod}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FaTrash className="me-2" />
                  Delete
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AuthProvider>
  );
}
