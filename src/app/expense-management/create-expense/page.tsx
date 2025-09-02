"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Container,
  Alert,
  Breadcrumb,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Receipt,
  Cash,
  Building,
  GeoAlt,
  CreditCard,
  Person,
  CurrencyDollar,
  FileEarmarkText,
  Tag,
  PersonBadge,
} from "react-bootstrap-icons";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";

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

interface CreateExpensePageProps {
  onSuccess?: () => void;
}

export default function CreateExpensePage({
  onSuccess,
}: CreateExpensePageProps) {
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
  const [isAdvance, setIsAdvance] = useState(false);
  const [allocations, setAllocations] = useState<Record<number, number>>({});

  const handleAllocationChange = (categoryId: number, value: string) => {
    setAllocations((prev) => ({
      ...prev,
      [categoryId]: value === "" ? 0 : parseFloat(value) || 0,
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Initialize allocations with 0 for each category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && Object.keys(allocations).length === 0) {
      const initialAllocations = categories.reduce(
        (acc, category) => ({
          ...acc,
          [category.id]: 0,
        }),
        {}
      );
      setAllocations(initialAllocations);
    }
  }, [categories]);

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

    const categoryAllocations = Object.entries(allocations)
      .filter(([_, amount]) => Number(amount) > 0)
      .map(([categoryId, amount]) => ({
        categoryId: Number(categoryId),
        amount: Number(amount),
      }));

    // Validate that the sum of category allocations matches the primary amount when in advance mode
    if (isAdvance) {
      const totalAllocated = categoryAllocations.reduce(
        (sum, { amount }) => sum + amount,
        0
      );
      const primary = Number(primaryAmount);

      if (Math.abs(totalAllocated - primary) > 0.01) {
        // Allow for small floating point differences
        toast.error(
          "The total allocated amount does not match the primary amount"
        );
        setSubmitting(false);
        return;
      }
    }

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
      categoryAllocations: isAdvance ? categoryAllocations : [],
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

      toast.success("Expense created successfully!");
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ms-2">Loading expense form...</span>
      </div>
    );
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container
        fluid
        className="create-expense-page rounded-3 mb-4"
        style={{ maxWidth: "1500px" }}
      >
        <Alert variant="info" className="mb-4 mt-5">
          <div className="d-flex justify-content-between align-items-center">
            {/* Header with Back Button */}
            <div className="d-flex align-items-center">
              <Button
                variant="outline-primary"
                className="me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "40px", height: "40px" }}
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <Receipt className="me-2 text-primary" /> Create New Expense
                </h6>
                <p className="text-muted mb-0 small">
                  Submit a new expense for reimbursement
                </p>
              </div>
            </div>
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="mb-0">
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item href="/expense-management/my-expenses">
                Expenses
              </Breadcrumb.Item>
              <Breadcrumb.Item active>Create Expense</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </Alert>
        {/* Form */}
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Left Column - Expense Details */}
            <Col lg={8} className="rounded-3">
              {/* Payee Information Card */}
              <Card className="border-0 mb-4 bg-light shadow-sm">
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <Person className="me-2 text-primary" /> Payee Information
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Person className="me-1" /> Payee Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={payee}
                          onChange={(e) => setPayee(e.target.value)}
                          required
                          className="py-2"
                        />
                        <Form.Text className="text-muted">
                          Enter payee name
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <PersonBadge className="me-1" /> ID Number
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={payeeId}
                          onChange={(e) => setPayeeId(e.target.value)}
                          required
                          className="py-2"
                        />
                        <Form.Text className="text-muted">
                          Enter ID number
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <PersonBadge className="me-1" /> Payment Reference
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={payeeNumber}
                      onChange={(e) => setPayeeNumber(e.target.value)}
                      required
                      className="py-2"
                    />
                    <Form.Text className="text-muted">
                      Enter payment reference
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Expense Details Card */}
              <Card className="border-0 mb-4 bg-light shadow-sm">
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <Cash className="me-2 text-primary" /> Expense Details
                  </h6>
                </Card.Header>
                <Card.Body className="p-4 rounded-3">
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <CurrencyDollar className="me-1" /> Amount
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={primaryAmount}
                          onChange={(e) => setPrimaryAmount(e.target.value)}
                          step="0.01"
                          min="0"
                          required
                          className="py-2"
                        />
                        <Form.Text className="text-muted">
                          Enter payment amount
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency</Form.Label>
                        <Form.Select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          required
                          className="py-2"
                        >
                          <option value=""></option>
                          {currencies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.initials} - {c.currency}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select currency for this expense</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="py-2"
                    />
                    <Form.Text className="text-muted">
                      Provide details about this expense
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Categorization Card */}
              <Card className="border-0 mb-4 bg-light shadow-sm">
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <Tag className="me-2 text-primary" /> Categorization
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Building className="me-1" /> Department
                        </Form.Label>
                        <Form.Select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required
                          className="py-2"
                        >
                          <option value=""></option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text>
                          Select the department for this expense
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                          className="py-2"
                        >
                          <option value=""></option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text>
                          Select expense category for this expense
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <GeoAlt className="me-1" /> Region
                        </Form.Label>
                        <Form.Select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          required
                          className="py-2"
                        >
                          <option value=""></option>
                          {regions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text>Select region for this expense</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Payment Information Card */}
              <Card className="border-0 mb-4 bg-light shadow-sm">
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <CreditCard className="me-2 text-primary" /> Payment
                    Information
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          required
                          className="py-2"
                        >
                          <option value=""></option>
                          {paymentMethods.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text>
                          Select how you prefer this expense to be paid
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reference Number (Optional)</Form.Label>
                        <Form.Control
                          type="text"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="py-2"
                        />
                        <Form.Text className="text-muted">
                          Internal reference number
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Payment Information Card */}
              <Card className="border-0 mb-4 bg-light shadow-sm">
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <CreditCard className="me-2 text-primary" /> Expense Details
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <div className="d-flex align-items-center">
                          <Form.Check
                            type="checkbox"
                            id="is-supplier-payment"
                            label="This is an advance request"
                            checked={isAdvance}
                            onChange={(e) => setIsAdvance(e.target.checked)}
                            className="py-1"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  {isAdvance && (
                    <div className="mt-4 p-3 border rounded">
                      <h6 className="mb-3 fw-semibold">Advance Allocation</h6>
                      <Row>
                        {categories.map((cat) => (
                          <Col md={6} className="mb-3" key={cat.id}>
                            <Form.Group>
                              <Form.Label>{cat.name}</Form.Label>
                              <InputGroup>
                                <InputGroup.Text>
                                  {currencies.find(
                                    (c) => c.id === Number(currency)
                                  )?.initials || "N/A"}
                                </InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    allocations[cat.id] === 0
                                      ? ""
                                      : allocations[cat.id]?.toString() || ""
                                  }
                                  onChange={(e) =>
                                    handleAllocationChange(
                                      cat.id,
                                      e.target.value
                                    )
                                  }
                                />
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        ))}
                        <Col md={12}>
                          <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                            <span>Total Allocated:</span>
                            <span className="fw-bold">
                              {currencies.find((c) => c.id === Number(currency))
                                ?.initials || "N/A"}{" "}
                              {Object.values(allocations).length > 0
                                ? Object.values(allocations)
                                    .reduce(
                                      (sum, amount) =>
                                        sum + (parseFloat(amount as any) || 0),
                                      0
                                    )
                                    .toFixed(2)
                                : "0.00"}
                            </span>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Attachments Card */}
              <Card className="border-0 mb-4 shadow-sm">
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <FileEarmarkText className="me-2 text-primary" />{" "}
                    Attachments
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
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
                      className="btn btn-primary rounded-pill mb-2 px-4"
                    >
                      Choose File
                    </label>

                    {fileName ? (
                      <div className="mt-3">
                        <span className="text-success small fw-semibold">
                          <Receipt className="me-1" /> {fileName}
                        </span>
                        <Button
                          variant="link"
                          className="text-danger p-0 small d-block"
                          onClick={() => {
                            setSelectedFile(null);
                            setFileName("");
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <p className="small text-muted mt-3 mb-0">
                        Upload receipts, invoices, or supporting documents (PDF,
                        JPG, PNG)
                      </p>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column - Summary and Actions */}
            <Col lg={4}>
              {/* Summary Card */}
              <Card
                className="border-0 mb-4 sticky-top"
                style={{ top: "20px" }}
              >
                <Card.Header className="bg-secondary bg-opacity-10 py-3">
                  <h6 className="fw-bold text-dark mb-0">Expense Summary</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Payee:</span>
                    <span className="fw-semibold text-end">
                      {payee || "Not specified"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">ID Number:</span>
                    <span>{payeeId || "Not specified"}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Amount:</span>
                    <span>
                      {primaryAmount
                        ? `${primaryAmount} ${
                            currencies.find((c) => c.id === Number(currency))
                              ?.initials || ""
                          }`
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Category:</span>
                    <span>
                      {category
                        ? categories.find((c) => c.id === Number(category))
                            ?.name
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Department:</span>
                    <span>
                      {department
                        ? departments.find((d) => d.id === Number(department))
                            ?.name
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Region:</span>
                    <span>
                      {region
                        ? regions.find((r) => r.id === Number(region))?.name
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Payment Method:</span>
                    <span>
                      {paymentMethod
                        ? paymentMethods.find(
                            (p) => p.id === Number(paymentMethod)
                          )?.name
                        : "Not specified"}
                    </span>
                  </div>
                </Card.Body>

                {/* Action Buttons Card */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-3">
                    <div className="d-grid gap-2">
                      <Button
                        size="sm"
                        type="submit"
                        variant="primary"
                        className="py-2 rounded-2 fw-semibold"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />{" "}
                            Creating...
                          </>
                        ) : (
                          "Create Expense"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="py-2 rounded-2"
                        disabled={submitting}
                        onClick={() => window.history.back()}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Card>
            </Col>
          </Row>
        </Form>

        <style jsx global>{`
          .create-expense-page {
            min-height: 100vh;
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
          .card {
            border-radius: 0.75rem;
          }
          .form-control,
          .form-select {
            border-radius: 0.5rem;
          }
          .btn {
            border-radius: 0.5rem;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
