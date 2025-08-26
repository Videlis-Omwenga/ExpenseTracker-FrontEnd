import { Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { useEffect, useState } from "react";
import { ArrowUpCircle, Upload, Receipt } from "react-bootstrap-icons";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { toast } from "react-toastify";

interface Currency {
  id: number;
  currency: string;
  initials: string;
  rate: number;
}

interface Region {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface CreateExpenseModalProps {
  onSuccess?: () => void;
}

export default function CreateExpenseModal({
  onSuccess,
}: CreateExpenseModalProps) {
  const [payee, setPayee] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [payeeNumber, setPayeeNumber] = useState("");
  const [description, setDescription] = useState("");
  const [primaryAmount, setPrimaryAmount] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [currency, setCurrency] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [region, setRegion] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const handleOpenCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedFile(null);
    setFileName("");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/expense-submission/currencies`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "expenseTrackerToken"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCurrencies(data.getCurrencies || []);
        setRegions(data.getRegions || []);
        setDepartments(data.getDepartments || []);
        setCategories(data.getCategories || []);
        setPaymentMethods(data.getPaymentMethods || []);
      } else {
        toast.error(data.message || "Failed to fetch data");
      }
    } catch (error) {
      toast.error(`Failed to fetch data: ${error}`);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    const payload = {
      payee,
      payeeId,
      payeeNumber,
      description,
      primaryAmount: Number(primaryAmount),
      category: Number(category),
      department: Number(department),
      currency: Number(currency),
      paymentMethod: Number(paymentMethod),
      region: Number(region),
      referenceNumber,
    };

    try {
      const response = await fetch(
        `${BASE_API_URL}/expense-submission/create`,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create expense");
      }

      // If we get here, the request was successful
      toast.success("Expense created successfully!");
      setShowCreateModal(false);

      // Call the success callback to refresh the expenses list
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" role="status" />;
  }

  return (
    <>
      <Button
        onClick={() => handleOpenCreateModal()}
        variant="light"
        className="w-100 text-start py-3 border"
      >
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
            <ArrowUpCircle size={20} className="text-primary" />
          </div>
          <div>
            <div className="fw-medium text-primary">Create expenses</div>
            <small className="text-muted d-block">Add new expenses</small>
          </div>
        </div>
      </Button>

      {/* Transaction Details Modal */}
      <Modal
        show={showCreateModal}
        onHide={handleCloseCreateModal}
        size="xl"
        centered
        className="expense-modal"
      >
        <Modal.Header
          closeButton
          className="border-bottom-0 pb-0 px-4 pt-4 mb-3"
          style={{ borderBottom: "1px solid #dee2e6" }}
        >
          <Receipt className="me-2 text-primary" size={24} />
          <h5 className="fw-bold">Create New Expense</h5>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 py-3">
            {/* Progress Steps */}
            <div className="d-flex justify-content-between align-items-center mb-4 position-relative">
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: "50%" }}
                ></div>
              </div>
              <div className="step active">
                <div className="step-circle">1</div>
                <div className="step-label">Details</div>
              </div>
              <div className="step">
                <div className="step-circle">2</div>
                <div className="step-label">Attachments</div>
              </div>
            </div>

            {/* --- Basic Details --- */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                  <Receipt size={16} className="text-primary" />
                </div>
                Expense Details
              </h6>

              <Card className="border shadow-sm mb-4">
                <Card.Body className="p-4">
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Payee <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="payee"
                          value={payee}
                          onChange={(e) => setPayee(e.target.value)}
                          required
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted small">
                          Person or company being paid
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Payment Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="paymentNumber"
                          required
                          value={payeeNumber}
                          onChange={(e) => setPayeeNumber(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted small">
                          Bank / Till / Mpesa / Reference Number
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          ID Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="idNumber"
                          required
                          value={payeeId}
                          onChange={(e) => setPayeeId(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        />
                        <Form.Text className="text-muted small">
                          Enter ID number or Pin number
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Amount <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="number"
                            name="amount"
                            value={primaryAmount}
                            onChange={(e) => setPrimaryAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                            className="rounded-3 py-2 px-3 modern-input"
                          />
                          <Form.Select
                            name="currency"
                            required
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="rounded-3 modern-input"
                            style={{ maxWidth: "120px" }}
                          >
                            <option value=""></option>
                            {currencies.map((currency) => (
                              <option key={currency.id} value={currency.id}>
                                {currency.initials}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                        <Form.Text className="text-muted small">
                          Enter the expense amount
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Department <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="department"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        >
                          <option value=""></option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Select the department this expense belongs to
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Category <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="category"
                          required
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        >
                          <option value=""></option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Select the most appropriate category for this expense
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Region <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="region"
                          required
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        >
                          <option value=""></option>
                          {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                              {region.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Select the region where the expense was incurred
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-dark">
                          Payment Method <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="paymentMethod"
                          required
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="rounded-3 py-2 px-3 modern-input"
                        >
                          <option value=""></option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Select how the payment was or will be made
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark">
                      Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-3 modern-input"
                    />
                    <Form.Text className="text-muted small">
                      Provide a detailed description of the expense purpose
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-dark">
                      Reference Number
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="referenceNumber"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="rounded-3 py-2 px-3 modern-input"
                    />
                    <Form.Text className="text-muted small">
                      Optional: Transaction / Mpesa or receipt reference number
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>

            {/* --- Attachments --- */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                  <Upload size={16} className="text-primary" />
                </div>
                Attachments
              </h6>

              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark d-block mb-3">
                      Upload supporting documents{" "}
                      <span className="text-danger">*</span>
                    </Form.Label>

                    <div className="file-upload-area border rounded-3 p-4 text-center">
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*,.pdf"
                        className="d-none"
                        onChange={handleFileChange}
                      />

                      <div className="mb-3">
                        <Upload size={32} className="text-muted" />
                      </div>

                      <label
                        htmlFor="file-upload"
                        className="btn btn-outline-primary rounded-pill mb-2"
                      >
                        Choose File
                      </label>

                      {fileName ? (
                        <div className="mt-3">
                          <div className="text-success small fw-semibold">
                            <Receipt className="me-1" size={14} />
                            {fileName}
                          </div>
                          <Button
                            variant="link"
                            className="text-danger p-0 small"
                            onClick={() => {
                              setSelectedFile(null);
                              setFileName("");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <p className="small text-muted mt-2 mb-0">
                          Upload receipts, invoices, or other supporting
                          documents
                        </p>
                      )}
                    </div>
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-top-0 px-4 pb-4 pt-0">
            {submitting ? (
              <div className="text-center w-100 py-2">
                <Spinner
                  animation="border"
                  variant="primary"
                  className="me-2"
                />
                <span className="text-muted">Creating expense...</span>
              </div>
            ) : (
              <div className="d-flex justify-content-end w-100 gap-3">
                <Button
                  variant="outline-secondary"
                  className="px-4 py-2 rounded-2"
                  onClick={handleCloseCreateModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="px-4 py-2 rounded-2 fw-semibold"
                  disabled={submitting}
                >
                  Create Expense
                </Button>
              </div>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        .expense-modal .modal-content {
          border-radius: 16px;
          border: none;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .modern-input {
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
        }

        .modern-input:focus {
          border-color: #4e54c8;
          box-shadow: 0 0 0 0.2rem rgba(78, 84, 200, 0.15);
        }

        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        .progress-bar-container {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #f0f0f0;
          z-index: 1;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .step {
          position: relative;
          z-index: 2;
          text-align: center;
          width: 100px;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: white;
          border: 2px solid #f0f0f0;
          color: #aaa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin: 0 auto 8px;
          transition: all 0.3s ease;
        }

        .step.active .step-circle {
          border-color: #4e54c8;
          background-color: #4e54c8;
          color: white;
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #aaa;
        }

        .step.active .step-label {
          color: #4e54c8;
        }

        .file-upload-area {
          border: 2px dashed #dee2e6 !important;
          transition: all 0.3s ease;
          background-color: #fafafa;
        }

        .file-upload-area:hover {
          border-color: #4e54c8 !important;
          background-color: #f8f9ff;
        }
      `}</style>
    </>
  );
}
