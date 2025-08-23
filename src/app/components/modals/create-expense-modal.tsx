import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useState } from "react";
import { ArrowUpCircle } from "react-bootstrap-icons";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { toast } from "react-toastify";

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
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [currency, setCurrency] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [region, setRegion] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const handleOpenCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => setShowCreateModal(false);

  const currencies = [
    { code: "KES", name: "Kenyan Shilling" },
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "CAD", name: "Canadian Dollar" },
  ];

  const regions = ["Kenya", "Uganda", "Tanzania"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    const payload = {
      payee,
      payeeId,
      payeeNumber,
      description,
      amount: Number(amount),
      category,
      department,
      currency,
      paymentMethod,
      region,
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

      // Clear the form
      // setPayee("");
      // setPayeeId("");
      // setPayeeNumber("");
      // setDescription("");
      // setAmount("");
      // setCategory("");
      // setDepartment("");
      // setCurrency("");
      // setPaymentMethod("");
      // setRegion("");
      // setReferenceNumber("");

      // Call the success callback to refresh the expenses list
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      toast.error("An unexpected error occurred" + error);
    } finally {
      setSubmitting(false);
    }
  };

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
        onHide={() => handleCloseCreateModal()}
        size="lg"
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title>Create an Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit} className="p-3">
            {/* --- Basic Details --- */}
            <Alert variant="info" className="border fw-bold">
              Expense Details
            </Alert>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Payee <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="payee"
                        value={payee}
                        onChange={(e) => setPayee(e.target.value)}
                        required
                      />
                      <Form.Text muted>Person or company being paid</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Payment Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="paymentNumber"
                        required
                        value={payeeNumber}
                        onChange={(e) => setPayeeNumber(e.target.value)}
                      />
                      <Form.Text muted>
                        Bank / Till / Mpesa / Reference Number
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        ID Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="idNumber"
                        required
                        value={payeeId}
                        onChange={(e) => setPayeeId(e.target.value)}
                      />
                      <Form.Text muted>Enter ID number or Pin number</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Amount <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="number"
                          name="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          step="0.01"
                          min="0"
                          required
                        />
                        <Form.Select
                          name="currency"
                          required
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          style={{ maxWidth: "120px" }}
                        >
                          <option value=""></option>
                          {currencies.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                      <Form.Text muted>Enter the expense amount</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-2">
                    <Form.Group>
                      <Form.Label>
                        Department <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="department"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      >
                        <option value=""></option>
                        <option value="IT">Information Technology</option>
                        <option value="HR">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                      </Form.Select>
                      <Form.Text muted>
                        Select the department this expense belongs to
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-2">
                    <Form.Group>
                      <Form.Label>
                        Category <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="category"
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value=""></option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Internet">Internet</option>
                        <option value="Travel">Travel</option>
                        <option value="Meals">Meals</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Software">Software</option>
                        <option value="Training">Training</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                      <Form.Text muted>
                        Select the most appropriate category for this expense
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-2">
                    <Form.Group>
                      <Form.Label>
                        Region <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="region"
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        <option value=""></option>
                        {regions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text muted>
                        Select the region where this expense was incurred
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <br />
                <Form.Group className="mb-3">
                  <Form.Label>
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Form.Text muted>
                    Provide a detailed description of the expense purpose
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Payment Method <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="paymentMethod"
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value=""></option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Check">Check</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                  <Form.Text muted>
                    Select how the payment was or will be made
                  </Form.Text>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Reference Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="referenceNumber"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                  <Form.Text muted>
                    Optional: Transaction / Mpesa or receipt reference number
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
            <br />
            {/* --- Attachments --- */}

            <Alert variant="info" className="border fw-bold">
              Attachments
            </Alert>
            <Card className="mb-4 shadow-sm ">
              <Card.Body>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf"
                    className="d-none"
                  />
                  <Button variant="light w-100 border p-3">
                    Upload File <span className="text-danger">*</span>
                  </Button>
                </div>
                <Form.Text muted>
                  Upload supporting documents (receipts, invoices, etc.)
                </Form.Text>
              </Card.Body>
            </Card>
            <Modal.Footer style={{ borderTop: "none" }}>
              {submitting ? (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Creating expense...</span>
                  </Spinner>
                </div>
              ) : (
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="light"
                    className="px-5 me-2 border"
                    onClick={() => handleCloseCreateModal()}
                  >
                    Close
                  </Button>
                  <Button type="submit" variant="primary" className="px-5">
                    Create expense
                  </Button>
                </div>
              )}
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
