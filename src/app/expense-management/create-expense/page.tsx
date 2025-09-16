"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Container,
  Breadcrumb,
  Alert,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import {
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
  HouseDoor,
  ListCheck,
  PlusCircle,
  CheckCircle,
  Check2,
  InfoCircle,
  Clock,
  FileEarmarkPlus,
  Calculator,
  Journal,
  ClipboardCheck,
} from "react-bootstrap-icons";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

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

export default function CreateExpensePage() {
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

  const router = useRouter();
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // TODO: Implement form completion percentage calculation
  // This should be updated based on form field validations
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
      toast.error(`${error}`);
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
    setIsSubmitting(true);

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
        setIsSubmitting(false);
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

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        toast.success(`Expense created successfully!`);
        // handleNavigation("/expense-management/my-expenses");
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form completion percentage based on specified fields
  useEffect(() => {
    // Track only the specified fields for progress
    const trackedFields = [
      payee, // Payee Name
      payeeId, // ID Number
      payeeNumber, // Payment Reference
      primaryAmount, // Amount
      description, // Description
      department, // Department
      category, // Category
      region, // Region
      currency, // Currency
      paymentMethod, // Payment Method
      selectedFile, // Attachments (file upload)
    ];

    // Count filled fields from the tracked fields
    const filledFields = trackedFields.filter((field) => {
      // For files, check if a file is selected
      if (field === selectedFile) return Boolean(field);
      // For other fields, check if they have a value
      return Boolean(field);
    }).length;

    // Calculate percentage (0-100)
    const percentage =
      trackedFields.length > 0
        ? Math.round((filledFields / trackedFields.length) * 100)
        : 0;

    setCompletionPercentage(percentage);
  }, [
    payee,
    payeeId,
    payeeNumber,
    primaryAmount,
    description,
    department,
    category,
    region,
    currency,
    paymentMethod,
    selectedFile,
  ]);

  // Show loading state if data is being fetched
  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="bg-light min-vh-100 pb-5">
        <Form onSubmit={handleSubmit}>
          <Row className="justify-content-center">
            <Container fluid className="py-4">
              <Row>
                {/* Left Column - Expense Details */}
                <Col lg={8} className="mt-4">
                  <div className="alert alert-primary border-0 rounded-3 shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                    <div>
                      <h5 className="fw-bold text-dark mb-1 d-flex align-items-center">
                        <Receipt size={22} className="me-2" />
                        Create New Expense
                      </h5>
                      <p className="text-muted small mb-0">
                        Submit a new expense for payment
                      </p>
                    </div>

                    <Breadcrumb className="mb-0 d-none d-md-flex">
                      <Breadcrumb.Item
                        href="/"
                        className="d-flex align-items-center small"
                      >
                        <HouseDoor size={14} className="me-1" />
                        Home
                      </Breadcrumb.Item>
                      <Breadcrumb.Item
                        href="/expense-management/my-expenses"
                        className="d-flex align-items-center small"
                      >
                        <ListCheck size={14} className="me-1" />
                        My Expenses
                      </Breadcrumb.Item>
                      <Breadcrumb.Item
                        active
                        className="d-flex align-items-center small"
                      >
                        <PlusCircle size={14} className="me-1" />
                        Create New
                      </Breadcrumb.Item>
                    </Breadcrumb>
                  </div>

                  {/* Progress Indicator */}
                  <Card className="border-0 shadow-sm mb-4 sticky-top">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small">
                          Form Completion
                        </span>
                        <span className="fw-semibold">
                          {completionPercentage}%
                        </span>
                      </div>
                      <ProgressBar
                        now={completionPercentage}
                        variant={
                          completionPercentage === 100 ? "success" : "primary"
                        }
                        className="mb-2"
                        style={{ height: "6px" }}
                      />
                      <div className="d-flex justify-content-between">
                        <small className="text-muted">
                          {completionPercentage === 100
                            ? "All required fields completed!"
                            : "Complete all required fields to submit"}
                        </small>
                        {completionPercentage === 100 && (
                          <Check2 size={14} className="text-success" />
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                  {/* Payee Information Card */}
                  <Card className="border rounded-3 p-4 mb-4">
                    <Card.Header className="bg-white py-3 border-bottom-0 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Person className="text-primary" size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Payee Information</h6>
                          <span className="text-muted small">
                            Who is receiving payment
                          </span>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 pt-0">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              <Person className="me-1" /> Payee Name
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={payee}
                              onChange={(e) => setPayee(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            />
                            <Form.Text className="text-muted">
                              Enter the full name of the person or company
                              receiving payment
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              <PersonBadge className="me-1" /> ID Number
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={payeeId}
                              onChange={(e) => setPayeeId(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            />
                            <Form.Text className="text-muted">
                              Government-issued ID number or business
                              registration number
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          <PersonBadge className="me-1" /> Payment Reference
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={payeeNumber}
                          onChange={(e) => setPayeeNumber(e.target.value)}
                          required
                          className="py-2 border-0 border-bottom rounded-0"
                        />
                        <Form.Text className="text-muted">
                          Bank account number, mobile money number, or other
                          payment identifier
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Expense Details Card */}
                  <Card className="border rounded-3 p-4 mb-4">
                    <Card.Header className="bg-white py-3 border-bottom-0 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Cash className="text-primary" size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Expense Details</h6>
                          <span className="text-muted small">
                            What you're claiming for
                          </span>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 pt-0">
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              <CurrencyDollar className="me-1" /> Amount
                            </Form.Label>
                            <InputGroup>
                              <InputGroup.Text className="bg-light border-0 border-bottom rounded-0">
                                {currencies.find(
                                  (c) => c.id === Number(currency)
                                )?.initials || "---"}
                              </InputGroup.Text>
                              <Form.Control
                                type="number"
                                value={primaryAmount}
                                onChange={(e) =>
                                  setPrimaryAmount(e.target.value)
                                }
                                step="0.01"
                                min="0"
                                required
                                className="py-2 border-0 border-bottom rounded-0"
                              />
                            </InputGroup>
                            <Form.Text className="text-muted">
                              Total amount being claimed
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              Currency
                            </Form.Label>
                            <Form.Select
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            >
                              <option value=""></option>
                              {currencies.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.initials} - {c.currency}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Select the currency for this expense
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Description
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="py-2 border-0 border-bottom rounded-0"
                        />
                        <Form.Text className="text-muted">
                          Provide a detailed description of what this expense
                          was for
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Categorization Card */}
                  <Card className="border rounded-3 p-4 mb-4">
                    <Card.Header className="bg-white py-3 border-bottom-0 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Tag className="text-primary" size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Categorization</h6>
                          <span className="text-muted small">
                            How to classify this expense
                          </span>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 pt-0">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              <Building className="me-1" /> Department
                            </Form.Label>
                            <Form.Select
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            >
                              <option value=""></option>
                              {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Department that should bear this cost
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              Category
                            </Form.Label>
                            <Form.Select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            >
                              <option value=""></option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Type of expense being claimed
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              <GeoAlt className="me-1" /> Region
                            </Form.Label>
                            <Form.Select
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            >
                              <option value=""></option>
                              {regions.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Region where this expense was incurred
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Payment Information Card */}
                  <Card className="border rounded-3 p-4 mb-4">
                    <Card.Header className="bg-white py-3 border-bottom-0 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <CreditCard className="text-primary" size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Payment Information</h6>
                          <span className="text-muted small">
                            How to process payment
                          </span>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 pt-0">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              Payment Method
                            </Form.Label>
                            <Form.Select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              required
                              className="py-2 border-0 border-bottom rounded-0"
                            >
                              <option value=""></option>
                              {paymentMethods.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                              How the payee prefers to receive payment
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              Reference Number
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={referenceNumber}
                              onChange={(e) =>
                                setReferenceNumber(e.target.value)
                              }
                              className="py-2 border-0 border-bottom rounded-0"
                            />
                            <Form.Text className="text-muted">
                              Optional reference number for tracking purposes
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Advance Request Card */}
                  <Card className="border rounded-3 p-4 mb-4">
                    <Card.Header className="bg-white py-3 border-bottom-0 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Calculator className="text-primary" size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Advance Request</h6>
                          <span className="text-muted small">
                            Allocate funds to categories
                          </span>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 pt-0">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <div className="d-flex align-items-center">
                              <Form.Check
                                type="checkbox"
                                id="is-advance-request"
                                label="This is an advance request"
                                checked={isAdvance}
                                onChange={(e) => setIsAdvance(e.target.checked)}
                                className="py-1"
                              />
                              <InfoCircle
                                className="ms-2 text-muted"
                                size={16}
                              />
                            </div>
                            <Form.Text className="text-muted">
                              Check this if you're requesting funds before
                              incurring expenses
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      {isAdvance && (
                        <div className="mt-4 p-3 border-start border-3 border-primary rounded bg-light">
                          <h6 className="mb-3 fw-semibold d-flex align-items-center">
                            <ClipboardCheck className="me-2" /> Advance
                            Allocation
                          </h6>
                          <Alert variant="info" className="small">
                            <InfoCircle className="me-2" />
                            Allocate the total amount to specific categories.
                            The sum must equal the primary amount.
                          </Alert>
                          <Row>
                            {categories.map((cat) => (
                              <Col md={6} className="mb-3" key={cat.id}>
                                <Form.Group>
                                  <Form.Label className="small fw-semibold">
                                    {cat.name}
                                  </Form.Label>
                                  <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light">
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
                                          : allocations[cat.id]?.toString() ||
                                            ""
                                      }
                                      onChange={(e) =>
                                        handleAllocationChange(
                                          cat.id,
                                          e.target.value
                                        )
                                      }
                                      className="border-0 border-bottom rounded-0"
                                    />
                                  </InputGroup>
                                </Form.Group>
                              </Col>
                            ))}
                            <Col md={12}>
                              <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded shadow-sm mt-2">
                                <span className="fw-semibold">
                                  Total Allocated:
                                </span>
                                <Badge
                                  bg={
                                    Object.values(allocations).reduce(
                                      (sum, amount) =>
                                        sum + (parseFloat(amount as any) || 0),
                                      0
                                    ) === Number(primaryAmount)
                                      ? "success"
                                      : "danger"
                                  }
                                  className="fs-6"
                                >
                                  {currencies.find(
                                    (c) => c.id === Number(currency)
                                  )?.initials || "N/A"}{" "}
                                  {Object.values(allocations).length > 0
                                    ? Object.values(allocations)
                                        .reduce(
                                          (sum, amount) =>
                                            sum +
                                            (parseFloat(amount as any) || 0),
                                          0
                                        )
                                        .toFixed(2)
                                    : "0.00"}
                                </Badge>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Attachments Card */}
                  <Card className="border rounded-3 p-4 mb-4">
                    <Card.Header className="bg-white py-3 border-bottom-0 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                          <FileEarmarkText className="text-info" size={20} />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">Attachments</h6>
                          <span className="text-muted small">
                            Supporting documents
                          </span>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-4 pt-0">
                      <div className="file-upload-area border-dashed border-info border-2 rounded-3 p-4 text-center bg-info bg-opacity-10">
                        <input
                          type="file"
                          id="file-upload"
                          accept="image/*,.pdf,.doc,.docx"
                          className="d-none"
                          onChange={handleFileChange}
                        />

                        <div className="mb-3">
                          <FileEarmarkPlus
                            size={40}
                            className="text-muted opacity-50"
                          />
                        </div>

                        <label
                          htmlFor="file-upload"
                          className="btn btn-outline-info rounded-pill mb-2 px-4 text-primary"
                        >
                          <Upload size={16} className="me-2" /> Choose File
                        </label>

                        {fileName ? (
                          <div className="mt-3">
                            <span className="text-success small fw-semibold d-flex align-items-center justify-content-center">
                              <CheckCircle className="me-1" /> {fileName}
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
                            Upload receipts, invoices, or supporting documents
                            <br />
                            <span className="text-muted">
                              (PDF, JPG, PNG, DOCX - Max 10MB)
                            </span>
                          </p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Right Column - Summary and Actions */}
                <Col lg={4} className="mt-4">
                  {/* Summary Card */}
                  <Card
                    className="border-0 shadow-sm sticky-top"
                    style={{ top: "100px" }}
                  >
                    <Card.Header className="bg-white py-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                        <Journal className="me-2" /> Expense Summary
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="p-3 border-bottom">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Payee:</span>
                          <span className="text-end">
                            {payee || (
                              <span className="text-dark small">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">ID Number:</span>
                          <span className={payeeId ? "" : "text-dark small"}>
                            {payeeId || "Not specified"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Amount:</span>
                          <span
                            className={
                              primaryAmount ? "fw-bold" : "text-dark small"
                            }
                          >
                            {primaryAmount
                              ? `${primaryAmount} ${
                                  currencies.find(
                                    (c) => c.id === Number(currency)
                                  )?.initials || ""
                                }`
                              : "Not specified"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Category:</span>
                          <span>
                            {category ? (
                              categories.find((c) => c.id === Number(category))
                                ?.name
                            ) : (
                              <span className="text-dark small">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Department:</span>
                          <span>
                            {department ? (
                              departments.find(
                                (d) => d.id === Number(department)
                              )?.name
                            ) : (
                              <span className="text-dark small">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Region:</span>
                          <span>
                            {region ? (
                              regions.find((r) => r.id === Number(region))?.name
                            ) : (
                              <span className="text-dark small">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">
                            Payment Method:
                          </span>
                          <span>
                            {paymentMethod ? (
                              paymentMethods.find(
                                (p) => p.id === Number(paymentMethod)
                              )?.name
                            ) : (
                              <span className="text-dark small">
                                Not specified
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-light">
                        <div className="d-grid gap-2">
                          <Button
                            size="lg"
                            type="submit"
                            variant="primary"
                            className="py-2 rounded-2 fw-semibold d-flex align-items-center justify-content-center"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                />{" "}
                                Creating Expense...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="me-2" size={18} />
                                Create Expense
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="py-2 rounded-2"
                            disabled={isSubmitting}
                            onClick={() => window.history.back()}
                          >
                            <Clock className="me-1" size={16} /> Cancel
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                    <Card.Header className="bg-white py-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center">
                        <InfoCircle className="me-2" /> Need Help?
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="small text-muted mb-2">
                        If you need assistance with expense submission, contact:
                      </p>
                      <ul className="small text-muted ps-3 mb-0">
                        <li>Finance Department: finance@company.com</li>
                        <li>IT Support: support@company.com</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </Row>
        </Form>
        <style jsx global>{`
          .create-expense-page {
            min-height: 100vh;
          }
          .border-dashed {
            border-style: dashed !important;
          }
          .file-upload-area {
            border-color: #dee2e6 !important;
            transition: all 0.3s ease;
          }
          .file-upload-area:hover {
            border-color: #4e54c8 !important;
            background-color: #f8f9ff;
          }
          .form-control:focus,
          .form-select:focus {
            box-shadow: none;
            border-color: #4e54c8;
          }
          .btn {
            border-radius: 0.5rem;
          }
          .card {
            border-radius: 0.75rem;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
