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
  Circle,
  ExclamationTriangle,
  Shield,
} from "react-bootstrap-icons";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
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

  // Payment type selection states
  const [paymentType, setPaymentType] = useState<
    "paybill" | "till" | "bank" | "phone" | ""
  >("");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [paybillAccount, setPaybillAccount] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Validation states for payment types
  const [paybillNumberValid, setPaybillNumberValid] = useState<boolean | null>(null);
  const [paybillAccountValid, setPaybillAccountValid] = useState<boolean | null>(null);
  const [tillNumberValid, setTillNumberValid] = useState<boolean | null>(null);
  const [bankNameValid, setBankNameValid] = useState<boolean | null>(null);
  const [bankAccountValid, setBankAccountValid] = useState<boolean | null>(null);
  const [branchCodeValid, setBranchCodeValid] = useState<boolean | null>(null);
  const [phoneNumberValid, setPhoneNumberValid] = useState<boolean | null>(null);

  // Validation functions
  const validatePaybillNumber = (value: string): boolean => {
    // Must be integer (numbers only)
    return /^\d+$/.test(value) && value.length > 0;
  };

  const validatePaybillAccount = (value: string): boolean => {
    // Must be alphanumeric mixture
    return /^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(value) && value.length > 0;
  };

  const validateTillNumber = (value: string): boolean => {
    // Must be numbers only
    return /^\d+$/.test(value) && value.length > 0;
  };

  const validateBankName = (value: string): boolean => {
    // Must be words/letters only (allow spaces)
    return /^[a-zA-Z\s]+$/.test(value) && value.length > 0;
  };

  const validateBankAccount = (value: string): boolean => {
    // Must be numbers only
    return /^\d+$/.test(value) && value.length > 0;
  };

  const validateBranchCode = (value: string): boolean => {
    // Must be numbers only
    return /^\d+$/.test(value) && value.length > 0;
  };

  const validatePhoneNumber = (value: string): boolean => {
    // Must be 254 followed by exactly 9 digits (total 12 digits)
    return /^254\d{9}$/.test(value);
  };

  const handleAllocationChange = (categoryId: number, value: string) => {
    setAllocations((prev) => ({
      ...prev,
      [categoryId]: value === "" ? 0 : parseFloat(value) || 0,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saved" | "saving" | "unsaved"
  >("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDuplicateCheck, setIsDuplicateCheck] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string>("");

  // TODO: Implement form completion percentage calculation
  // This should be updated based on form field validations
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [extractedData, setExtractedData] = useState<{
    amount?: string;
    date?: string;
    vendor?: string;
  }>({});
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

  // Auto-update payeeNumber field based on payment type selection with prefixes
  useEffect(() => {
    if (paymentType === "paybill") {
      const compiled = `PB: ${paybillNumber} | Acc: ${paybillAccount}`;
      setPayeeNumber(compiled);
    } else if (paymentType === "till") {
      const compiled = `Till: ${tillNumber}`;
      setPayeeNumber(compiled);
    } else if (paymentType === "bank") {
      const compiled = `Bank: ${bankName} | Acc: ${bankAccount} | Branch: ${branchCode}`;
      setPayeeNumber(compiled);
    } else if (paymentType === "phone") {
      const compiled = `Phone: ${phoneNumber}`;
      setPayeeNumber(compiled);
    } else {
      // Clear when no payment type selected
      setPayeeNumber("");
    }
  }, [
    paymentType,
    paybillNumber,
    paybillAccount,
    tillNumber,
    bankName,
    bankAccount,
    branchCode,
    phoneNumber,
  ]);

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
    loadSavedData();
  }, []);

  // Auto-save functionality
  const saveToLocalStorage = () => {
    setAutoSaveStatus("saving");
    const formData = {
      payee,
      payeeId,
      payeeNumber,
      description,
      primaryAmount,
      category,
      department,
      currency,
      paymentMethod,
      region,
      referenceNumber,
      isAdvance,
      allocations,
      // Payment type fields
      paymentType,
      paybillNumber,
      paybillAccount,
      tillNumber,
      bankName,
      bankAccount,
      branchCode,
      phoneNumber,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("expenseFormDraft", JSON.stringify(formData));
    setLastSaved(new Date());
    setTimeout(() => setAutoSaveStatus("saved"), 500);
  };

  const loadSavedData = () => {
    const saved = localStorage.getItem("expenseFormDraft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPayee(data.payee || "");
        setPayeeId(data.payeeId || "");
        setPayeeNumber(data.payeeNumber || "");
        setDescription(data.description || "");
        setPrimaryAmount(data.primaryAmount || "");
        setCategory(data.category || "");
        setDepartment(data.department || "");
        setCurrency(data.currency || "");
        setPaymentMethod(data.paymentMethod || "");
        setRegion(data.region || "");
        setReferenceNumber(data.referenceNumber || "");
        setIsAdvance(data.isAdvance || false);
        setAllocations(data.allocations || {});
        // Restore payment type fields
        setPaymentType(data.paymentType || "");
        setPaybillNumber(data.paybillNumber || "");
        setPaybillAccount(data.paybillAccount || "");
        setTillNumber(data.tillNumber || "");
        setBankName(data.bankName || "");
        setBankAccount(data.bankAccount || "");
        setBranchCode(data.branchCode || "");
        setPhoneNumber(data.phoneNumber || "");
        setLastSaved(new Date(data.timestamp));
        toast.info("Draft restored from previous session");
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    }
  };

  // Real-time validation functions
  const validateField = (fieldName: string, value: string) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case "payee":
        if (value && value.length < 2) {
          errors.payee = "Payee name must be at least 2 characters";
        } else {
          delete errors.payee;
        }
        break;
      case "payeeId":
        if (value && !/^[A-Z0-9]{8,20}$/i.test(value)) {
          errors.payeeId = "ID must be 8-20 alphanumeric characters";
        } else {
          delete errors.payeeId;
        }
        break;
      case "primaryAmount":
        const amount = parseFloat(value);
        if (value && (isNaN(amount) || amount <= 0)) {
          errors.primaryAmount = "Amount must be a positive number";
        } else if (amount > 1000000) {
          errors.primaryAmount = "Amount exceeds maximum limit";
        } else {
          delete errors.primaryAmount;
        }
        break;
      case "description":
        if (value && value.length < 10) {
          errors.description = "Description must be at least 10 characters";
        } else {
          delete errors.description;
        }
        break;
    }

    setFieldErrors(errors);
  };

  // Check for potential duplicates
  const checkDuplicates = async () => {
    if (!payee || !primaryAmount) return;

    setIsDuplicateCheck(true);
    try {
      // Simulate API call to check duplicates
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock duplicate detection logic
      const amount = parseFloat(primaryAmount);
      if (payee.toLowerCase().includes("supplier") && amount > 1000) {
        setDuplicateWarning(
          `Similar expense found: ${payee} - $${amount} (last week)`
        );
      } else {
        setDuplicateWarning("");
      }
    } catch (error) {
      console.error("Duplicate check failed:", error);
    } finally {
      setIsDuplicateCheck(false);
    }
  };

  // Auto-save when form data changes
  useEffect(() => {
    if (payee || payeeId || payeeNumber || description || primaryAmount) {
      setAutoSaveStatus("unsaved");
      const timer = setTimeout(saveToLocalStorage, 2000);
      return () => clearTimeout(timer);
    }
  }, [
    payee,
    payeeId,
    payeeNumber,
    description,
    primaryAmount,
    category,
    department,
    currency,
    paymentMethod,
    region,
    referenceNumber,
    isAdvance,
    allocations,
  ]);

  // Trigger duplicate check when payee and amount change
  useEffect(() => {
    if (payee && primaryAmount) {
      const timer = setTimeout(checkDuplicates, 1500);
      return () => clearTimeout(timer);
    }
  }, [payee, primaryAmount]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S - Save draft
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        saveToLocalStorage();
        toast.success("Draft saved manually");
      }

      // Ctrl/Cmd + Enter - Submit form
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (completionPercentage === 100) {
          (
            document.querySelector('button[type="submit"]') as HTMLButtonElement
          )?.click();
        } else {
          toast.warning("Complete all required fields first");
        }
      }

      // Escape - Clear current field if focused
      if (event.key === "Escape") {
        const activeElement = document.activeElement as HTMLInputElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA")
        ) {
          activeElement.blur();
        }
      }

      // F1 - Show help (prevent default browser help)
      if (event.key === "F1") {
        event.preventDefault();
        toast.info(
          "Keyboard shortcuts: Ctrl+S (save), Ctrl+Enter (submit), Alt+U (upload)"
        );
      }

      // Alt + U - Focus file upload
      if (event.altKey && event.key === "u") {
        event.preventDefault();
        (document.getElementById("file-upload") as HTMLInputElement)?.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [completionPercentage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Simulate OCR/data extraction
        extractDataFromReceipt(file);
      } else {
        setPreviewUrl("");
      }
    }
  };

  const extractDataFromReceipt = async (file: File) => {
    try {
      // Simulate AI-powered receipt analysis
      toast.info("Analyzing receipt...", { autoClose: 2000 });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock extracted data based on file name patterns
      const extracted: Record<string, string> = {};
      if (
        file.name.toLowerCase().includes("invoice") ||
        file.name.toLowerCase().includes("receipt")
      ) {
        extracted.amount = (Math.random() * 1000 + 50).toFixed(2);
        extracted.vendor = "Extracted Vendor Name";
        extracted.date = new Date().toISOString().split("T")[0];
      }

      setExtractedData(extracted);

      if (extracted.amount || extracted.vendor) {
        toast.success("Data extracted from receipt!");

        // Auto-fill form fields with extracted data
        if (extracted.amount && !primaryAmount) {
          setPrimaryAmount(extracted.amount);
        }
        if (extracted.vendor && !payee) {
          setPayee(extracted.vendor);
        }
      }
    } catch (error) {
      toast.error("Failed to analyze receipt");
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

    // payeeNumber is already compiled in real-time via useEffect
    const payload = {
      payee,
      payeeId,
      payeeNumber, // This contains the formatted payment reference (e.g., "Till: 123456" or "PB: 400200 | Acc: 123456")
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

    // Log payload for debugging
    console.log("📤 Sending to backend:", payload);
    console.log("💳 Payment Reference (payeeNumber):", payeeNumber);

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
        localStorage.removeItem("expenseFormDraft"); // Clear saved draft

        // // Clear all form fields
        // setPayee('');
        // setPayeeId('');
        // setPayeeNumber('');
        // setDescription('');
        // setPrimaryAmount('');
        // setCategory('');
        // setDepartment('');
        // setCurrency('');
        // setPaymentMethod('');
        // setRegion('');
        // setReferenceNumber('');
        // setIsAdvance(false);
        // setAllocations({});
        // setSelectedFile(null);
        // setFileName('');
        // setPreviewUrl('');
        // setExtractedData({});
        // setFieldErrors({});
        // setDuplicateWarning('');

        // // Navigate to my-expenses page
        // setTimeout(() => {
        //   window.location.href = '/expense-management/my-expenses';
        // }, 1500); // Small delay to show success message
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
              {/* Modern Header */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-5">
                  <div>
                    <div className="d-flex align-items-center mb-2">
                      <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                        <FileEarmarkPlus className="text-primary" size={28} />
                      </div>
                      <div>
                        <h2 className="fw-bold text-dark mb-0">
                          Create New Expense
                        </h2>
                        <p className="text-muted mb-0 small">
                          Submit a new expense for approval and payment
                        </p>
                      </div>
                    </div>
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
                <hr className="border-2 border-primary opacity-25 mb-5" />
              </div>

              <Row>
                {/* Left Column - Expense Details */}
                <Col lg={8} className="mt-2">
                  {/* Duplicate Warning */}
                  {duplicateWarning && (
                    <Alert
                      variant="warning"
                      className="border-0 border-start border-3 border-warning shadow-sm mb-5 bg-warning bg-opacity-10"
                    >
                      <div className="d-flex align-items-center">
                        <ExclamationTriangle
                          size={20}
                          className="me-3 flex-shrink-0"
                        />
                        <div>
                          <strong>Potential Duplicate Detected</strong>
                          <div className="small mt-1">{duplicateWarning}</div>
                        </div>
                      </div>
                    </Alert>
                  )}

                  {/* Progress Indicator */}
                  <Card className="border-0 shadow-sm mb-5 sticky-top rounded-3">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small">
                          Form Completion
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">
                            {completionPercentage}%
                          </span>
                          <div className="auto-save-indicator">
                            {autoSaveStatus === "saving" && (
                              <span className="text-info small">
                                <Spinner size="sm" className="me-1" />
                                Saving...
                              </span>
                            )}
                            {autoSaveStatus === "saved" && lastSaved && (
                              <span className="text-success small">
                                <CheckCircle size={12} className="me-1" />
                                Saved
                              </span>
                            )}
                            {autoSaveStatus === "unsaved" && (
                              <span className="text-warning small">
                                <Circle size={12} className="me-1" />
                                Unsaved
                              </span>
                            )}
                          </div>
                        </div>
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
                  <Card className="border-0 shadow-sm rounded-3 mb-5">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Person className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Payee Information
                          </h6>
                          <span className="text-muted small">
                            Who is receiving payment
                          </span>
                        </div>
                      </div>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <Person className="me-1" size={16} /> Payee Name{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={payee}
                              onChange={(e) => {
                                setPayee(e.target.value);
                                validateField("payee", e.target.value);
                              }}
                              required
                              className={`py-2 border-2 rounded-3 ${
                                fieldErrors.payee
                                  ? "is-invalid"
                                  : payee && !fieldErrors.payee
                                  ? "is-valid"
                                  : ""
                              }`}
                            />
                            {fieldErrors.payee && (
                              <div className="invalid-feedback d-flex align-items-center">
                                <ExclamationTriangle
                                  size={14}
                                  className="me-1"
                                />
                                {fieldErrors.payee}
                              </div>
                            )}
                            {payee && !fieldErrors.payee ? (
                              <div className="valid-feedback d-flex align-items-center">
                                <CheckCircle size={14} className="me-1" />
                                Looks good!
                              </div>
                            ) : (
                              <div className="invalid-feedback d-flex align-items-center">
                                <ExclamationTriangle
                                  size={14}
                                  className="me-1"
                                />
                                Please enter a valid payee name.
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <PersonBadge className="me-1" size={16} /> ID
                              Number <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={payeeId}
                              onChange={(e) => setPayeeId(e.target.value)}
                              required
                              className="py-2 border-2 rounded-3"
                            />
                            <Form.Text className="text-muted">
                              Government-issued ID number or business
                              registration number
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Payment Type Helper */}
                      <div className="border rounded-3 p-3 mb-2 bg-light">
                        <Form.Label className="fw-bold text-dark mb-5">
                          <CreditCard className="me-2" size={18} /> Select
                          Payment Type <span className="text-danger">*</span>
                          <small
                            className="text-muted fw-normal d-block mt-1"
                            style={{ fontSize: "0.85rem" }}
                          >
                            Choose how you want to receive payment and fill in
                            the details
                          </small>
                        </Form.Label>
                        <div className="d-flex flex-wrap gap-2">
                          <Form.Check
                            type="checkbox"
                            id="payment-paybill"
                            label="PayBill"
                            checked={paymentType === "paybill"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPaymentType("paybill");
                              } else {
                                setPaymentType("");
                              }
                            }}
                            className="btn-check"
                          />
                          <label
                            htmlFor="payment-paybill"
                            className={`btn btn-sm ${
                              paymentType === "paybill"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                          >
                            PayBill
                          </label>

                          <Form.Check
                            type="checkbox"
                            id="payment-till"
                            label="Till"
                            checked={paymentType === "till"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPaymentType("till");
                              } else {
                                setPaymentType("");
                              }
                            }}
                            className="btn-check d-none"
                          />
                          <label
                            htmlFor="payment-till"
                            className={`btn btn-sm ${
                              paymentType === "till"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                          >
                            Till
                          </label>

                          <Form.Check
                            type="checkbox"
                            id="payment-bank"
                            label="Bank"
                            checked={paymentType === "bank"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPaymentType("bank");
                              } else {
                                setPaymentType("");
                              }
                            }}
                            className="btn-check d-none"
                          />
                          <label
                            htmlFor="payment-bank"
                            className={`btn btn-sm ${
                              paymentType === "bank"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                          >
                            Bank
                          </label>

                          <Form.Check
                            type="checkbox"
                            id="payment-phone"
                            label="Phone"
                            checked={paymentType === "phone"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPaymentType("phone");
                              } else {
                                setPaymentType("");
                              }
                            }}
                            className="btn-check d-none"
                          />
                          <label
                            htmlFor="payment-phone"
                            className={`btn btn-sm ${
                              paymentType === "phone"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                          >
                            Phone Number
                          </label>
                        </div>
                      </div>

                      {/* PayBill Fields */}
                      {paymentType === "paybill" && (
                        <div className="border-start border-3 border-primary ps-3 mb-2 bg-light p-3 rounded">
                          <h6 className="text-primary fw-bold mb-3">
                            PayBill Details
                          </h6>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-5">
                                <Form.Label className="fw-semibold text-dark small">
                                  PayBill Number{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={paybillNumber}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setPaybillNumber(value);
                                    if (value) {
                                      setPaybillNumberValid(validatePaybillNumber(value));
                                    } else {
                                      setPaybillNumberValid(null);
                                    }
                                  }}
                                  required
                                  placeholder="e.g., 400200"
                                  className={`py-2 rounded-3 ${
                                    paybillNumberValid === true
                                      ? "is-valid"
                                      : paybillNumberValid === false
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                />
                                <Form.Control.Feedback type="invalid">
                                  PayBill number must contain only numbers
                                </Form.Control.Feedback>
                                <Form.Control.Feedback type="valid">
                                  Looks good!
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-5">
                                <Form.Label className="fw-semibold text-dark small">
                                  Account Number{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={paybillAccount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setPaybillAccount(value);
                                    if (value) {
                                      setPaybillAccountValid(validatePaybillAccount(value));
                                    } else {
                                      setPaybillAccountValid(null);
                                    }
                                  }}
                                  required
                                  placeholder="Account number"
                                  className={`py-2 rounded-3 ${
                                    paybillAccountValid === true
                                      ? "is-valid"
                                      : paybillAccountValid === false
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                />
                                <Form.Control.Feedback type="invalid">
                                  Account number must contain both letters and numbers
                                </Form.Control.Feedback>
                                <Form.Control.Feedback type="valid">
                                  Looks good!
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {/* Till Fields */}
                      {paymentType === "till" && (
                        <div className="border-start border-3 border-success ps-3 mb-2 bg-light p-3 rounded">
                          <h6 className="text-success fw-bold mb-2">
                            Till Details
                          </h6>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark small">
                              Till Number <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={tillNumber}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTillNumber(value);
                                if (value) {
                                  setTillNumberValid(validateTillNumber(value));
                                } else {
                                  setTillNumberValid(null);
                                }
                              }}
                              required
                              placeholder="e.g., 123456"
                              className={`py-2 rounded-3 ${
                                tillNumberValid === true
                                  ? "is-valid"
                                  : tillNumberValid === false
                                  ? "is-invalid"
                                  : ""
                              }`}
                            />
                            <Form.Control.Feedback type="invalid">
                              Till number must contain only numbers
                            </Form.Control.Feedback>
                            <Form.Control.Feedback type="valid">
                              Looks good!
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                      )}

                      {/* Bank Fields */}
                      {paymentType === "bank" && (
                        <div className="border-start border-3 border-info ps-3 mb-2 bg-light p-3 rounded">
                          <h6 className="text-info fw-bold mb-2">
                            Bank Details
                          </h6>
                          <Row>
                            <Col md={12}>
                              <Form.Group className="mb-5">
                                <Form.Label className="fw-semibold text-dark small">
                                  Bank Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={bankName}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setBankName(value);
                                    if (value) {
                                      setBankNameValid(validateBankName(value));
                                    } else {
                                      setBankNameValid(null);
                                    }
                                  }}
                                  required
                                  placeholder="e.g., Equity Bank"
                                  className={`py-2 rounded-3 ${
                                    bankNameValid === true
                                      ? "is-valid"
                                      : bankNameValid === false
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                />
                                <Form.Control.Feedback type="invalid">
                                  Bank name must contain only letters and spaces
                                </Form.Control.Feedback>
                                <Form.Control.Feedback type="valid">
                                  Looks good!
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-5">
                                <Form.Label className="fw-semibold text-dark small">
                                  Bank Account Number{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={bankAccount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setBankAccount(value);
                                    if (value) {
                                      setBankAccountValid(validateBankAccount(value));
                                    } else {
                                      setBankAccountValid(null);
                                    }
                                  }}
                                  required
                                  placeholder="Account number"
                                  className={`py-2 rounded-3 ${
                                    bankAccountValid === true
                                      ? "is-valid"
                                      : bankAccountValid === false
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                />
                                <Form.Control.Feedback type="invalid">
                                  Account number must contain only numbers
                                </Form.Control.Feedback>
                                <Form.Control.Feedback type="valid">
                                  Looks good!
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-5">
                                <Form.Label className="fw-semibold text-dark small">
                                  Branch Code{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={branchCode}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setBranchCode(value);
                                    if (value) {
                                      setBranchCodeValid(validateBranchCode(value));
                                    } else {
                                      setBranchCodeValid(null);
                                    }
                                  }}
                                  required
                                  placeholder="e.g., 068"
                                  className={`py-2 rounded-3 ${
                                    branchCodeValid === true
                                      ? "is-valid"
                                      : branchCodeValid === false
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                />
                                <Form.Control.Feedback type="invalid">
                                  Branch code must contain only numbers
                                </Form.Control.Feedback>
                                <Form.Control.Feedback type="valid">
                                  Looks good!
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {/* Phone Number Fields */}
                      {paymentType === "phone" && (
                        <div className="border-start border-3 border-warning ps-3 mb-1 bg-light p-3 rounded">
                          <h6 className="text-warning fw-bold mb-2">
                            Mobile Money Details
                          </h6>
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-semibold text-dark small">
                              Phone Number{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => {
                                const value = e.target.value;
                                setPhoneNumber(value);
                                if (value) {
                                  setPhoneNumberValid(validatePhoneNumber(value));
                                } else {
                                  setPhoneNumberValid(null);
                                }
                              }}
                              required
                              placeholder="e.g., 254712345678"
                              className={`py-2 rounded-3 ${
                                phoneNumberValid === true
                                  ? "is-valid"
                                  : phoneNumberValid === false
                                  ? "is-invalid"
                                  : ""
                              }`}
                            />
                            <Form.Control.Feedback type="invalid">
                              Phone number must be 254 followed by 9 digits (e.g., 254712345678)
                            </Form.Control.Feedback>
                            <Form.Control.Feedback type="valid">
                              Looks good!
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                              Enter mobile money number (M-Pesa, Airtel Money,
                              etc.)
                            </Form.Text>
                          </Form.Group>
                        </div>
                      )}

                      {/* Hidden input for form validation */}
                      <Form.Control
                        type="hidden"
                        value={payeeNumber}
                        required
                      />

                      {/* Payment Reference Display - Only shown when payment type is selected */}
                      {paymentType !== "" && payeeNumber && (
                        <div className="mt-3">
                          <Alert
                            variant="success"
                            className="border-0 shadow-sm mb-0"
                          >
                            <div className="d-flex align-items-start gap-3">
                              <div className="bg-success bg-opacity-25 p-2 rounded-circle">
                                <CheckCircle
                                  size={20}
                                  className="text-success"
                                />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="fw-bold text-success mb-2">
                                  <PersonBadge className="me-1" size={16} />{" "}
                                  Payment Reference Generated
                                  <Badge bg="success" className="ms-2 small">
                                    <Check2 size={12} className="me-1" />
                                    Ready
                                  </Badge>
                                </h6>
                                <div className="bg-white rounded-3 p-3 border border-success">
                                  <code
                                    className="text-dark fs-6 fw-bold d-block"
                                    style={{ letterSpacing: "0.5px" }}
                                  >
                                    {payeeNumber}
                                  </code>
                                </div>
                                <small className="text-muted d-block mt-2">
                                  <InfoCircle size={12} className="me-1" />
                                  This payment reference will be sent to the
                                  backend for processing
                                </small>
                              </div>
                            </div>
                          </Alert>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Expense Details Card */}
                  <Card className="border-0 shadow-sm rounded-3 mb-5">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Cash className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Expense Details
                          </h6>
                          <span className="text-muted small">
                            What you&apos;re claiming for
                          </span>
                        </div>
                      </div>
                      <Row className="mb-5">
                        <Col md={6}>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <CurrencyDollar className="me-1" size={16} />{" "}
                              Amount <span className="text-danger">*</span>
                            </Form.Label>
                            <InputGroup>
                              <InputGroup.Text className="bg-light border-2 rounded-start-3">
                                {currencies.find(
                                  (c) => c.id === Number(currency)
                                )?.initials || "---"}
                              </InputGroup.Text>
                              <Form.Control
                                type="number"
                                value={primaryAmount}
                                onChange={(e) => {
                                  setPrimaryAmount(e.target.value);
                                  validateField(
                                    "primaryAmount",
                                    e.target.value
                                  );
                                }}
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                className={`py-2 border-2 rounded-end-3 ${
                                  fieldErrors.primaryAmount
                                    ? "is-invalid"
                                    : primaryAmount &&
                                      !fieldErrors.primaryAmount
                                    ? "is-valid"
                                    : ""
                                }`}
                              />
                            </InputGroup>
                            {fieldErrors.primaryAmount && (
                              <div className="invalid-feedback d-flex align-items-center">
                                <ExclamationTriangle
                                  size={14}
                                  className="me-1"
                                />
                                {fieldErrors.primaryAmount}
                              </div>
                            )}
                            {primaryAmount && !fieldErrors.primaryAmount && (
                              <div className="valid-feedback d-flex align-items-center">
                                <CheckCircle size={14} className="me-1" />
                                Valid amount
                                {isDuplicateCheck && (
                                  <Spinner size="sm" className="ms-2" />
                                )}
                              </div>
                            )}
                            <Form.Text className="text-muted">
                              Total amount being claimed
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <CurrencyDollar className="me-1" size={16} />{" "}
                              Currency <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={currency}
                              onChange={(e) => setCurrency(e.target.value)}
                              required
                              className="py-2 border-2 rounded-3"
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

                      <Form.Group className="mb-5">
                        <Form.Label className="fw-semibold text-dark">
                          <FileEarmarkText className="me-1" size={16} />{" "}
                          Description <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="py-2 border-2 rounded-3"
                        />
                        <Form.Text className="text-muted">
                          Provide a detailed description of what this expense
                          was for
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Categorization Card */}
                  <Card className="border-0 shadow-sm rounded-3 mb-5">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Tag className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Categorization
                          </h6>
                          <span className="text-muted small">
                            How to classify this expense
                          </span>
                        </div>
                      </div>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <Building className="me-1" size={16} /> Department{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              required
                              className="py-2 border-2 rounded-3"
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
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <Tag className="me-1" size={16} /> Category{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              required
                              className="py-2 border-2 rounded-3"
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
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <GeoAlt className="me-1" size={16} /> Region{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              required
                              className="py-2 border-2 rounded-3"
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
                  <Card className="border-0 shadow-sm rounded-3 mb-5">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <CreditCard className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Payment Information
                          </h6>
                          <span className="text-muted small">
                            How to process payment
                          </span>
                        </div>
                      </div>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <CreditCard className="me-1" size={16} /> Payment
                              Method <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              required
                              className="py-2 border-2 rounded-3"
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
                          <Form.Group className="mb-5">
                            <Form.Label className="fw-semibold text-dark">
                              <Journal className="me-1" size={16} /> Reference
                              Number
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={referenceNumber}
                              onChange={(e) =>
                                setReferenceNumber(e.target.value)
                              }
                              className="py-2 border-2 rounded-3"
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
                  <Card className="border-0 shadow-sm rounded-3 mb-5">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Calculator className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Advance Request
                          </h6>
                          <span className="text-muted small">
                            Allocate funds to categories
                          </span>
                        </div>
                      </div>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-5">
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
                              Check this if you&apos;re requesting funds before
                              incurring expenses
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      {isAdvance && (
                        <div className="mt-4 p-3 border-start border-3 border-primary rounded bg-light">
                          <h6 className="mb-5 fw-semibold d-flex align-items-center">
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
                              <Col md={6} className="mb-5" key={cat.id}>
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
                                        sum + (parseFloat(String(amount)) || 0),
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
                                            (parseFloat(String(amount)) || 0),
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
                  <Card className="border-0 shadow-sm rounded-3 mb-5">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <Receipt className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Attachments
                          </h6>
                          <span className="text-muted small">
                            Upload supporting documents
                          </span>
                        </div>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="file-upload-area border border-2 border-primary border-dashed rounded-3 p-4 text-center bg-primary bg-opacity-10">
                            <input
                              type="file"
                              id="file-upload"
                              accept="image/*,.pdf,.doc,.docx"
                              className="d-none"
                              onChange={handleFileChange}
                            />

                            <div className="mb-5">
                              <FileEarmarkPlus
                                size={40}
                                className="text-primary opacity-75"
                              />
                            </div>

                            <label
                              htmlFor="file-upload"
                              className="btn btn-primary rounded-pill mb-2 px-4 fw-semibold shadow-sm"
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
                                    setPreviewUrl("");
                                    setExtractedData({});
                                  }}
                                >
                                  Remove File
                                </Button>
                              </div>
                            ) : (
                              <p className="small text-muted mt-3 mb-0">
                                Upload receipts, invoices, or supporting
                                documents
                                <br />
                                <span className="text-muted">
                                  (PDF, JPG, PNG, DOCX - Max 10MB)
                                </span>
                              </p>
                            )}
                          </div>
                        </Col>

                        {/* Preview and Extracted Data */}
                        <Col md={6}>
                          {previewUrl && (
                            <div className="receipt-preview">
                              <h6 className="fw-semibold mb-5">
                                <FileEarmarkText className="me-2" />
                                Receipt Preview
                              </h6>
                              <div className="border rounded-3 p-2 mb-5">
                                <img
                                  src={previewUrl}
                                  alt="Receipt preview"
                                  className="img-fluid rounded"
                                  style={{
                                    maxHeight: "200px",
                                    width: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {Object.keys(extractedData).length > 0 && (
                            <div className="extracted-data bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-3">
                              <h6 className="fw-semibold text-success mb-2">
                                <Shield className="me-2" />
                                Extracted Data
                              </h6>
                              {extractedData.amount && (
                                <div className="small mb-1">
                                  <strong>Amount:</strong> $
                                  {extractedData.amount}
                                </div>
                              )}
                              {extractedData.vendor && (
                                <div className="small mb-1">
                                  <strong>Vendor:</strong>{" "}
                                  {extractedData.vendor}
                                </div>
                              )}
                              {extractedData.date && (
                                <div className="small">
                                  <strong>Date:</strong> {extractedData.date}
                                </div>
                              )}
                              <div className="small text-muted mt-2">
                                <InfoCircle size={12} className="me-1" />
                                Data automatically filled in form
                              </div>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Right Column - Summary and Actions */}
                <Col lg={4} className="mt-2">
                  {/* Summary Card */}
                  <Card
                    className="border-0 shadow-sm rounded-3 sticky-top"
                    style={{ top: "100px" }}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <ClipboardCheck className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Expense Summary
                          </h6>
                          <span className="text-muted small">
                            Review before submitting
                          </span>
                        </div>
                      </div>
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

                      <div className="p-4 bg-light border-top">
                        <div className="d-grid gap-2">
                          <Button
                            size="lg"
                            type="submit"
                            variant="primary"
                            className="py-3 rounded-pill fw-semibold d-flex align-items-center justify-content-center shadow-sm"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                />
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
                            className="py-2 rounded-pill fw-semibold"
                            disabled={isSubmitting}
                            onClick={() => window.history.back()}
                          >
                            <Clock className="me-1" size={16} /> Cancel
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Keyboard Shortcuts Card */}
                  <Card className="border-0 shadow-sm rounded-3 mt-4">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center mb-5 pb-3 border-bottom">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                          <InfoCircle className="text-primary" size={20} />
                        </div>
                        <h6 className="fw-bold text-dark mb-0">
                          Keyboard Shortcuts
                        </h6>
                      </div>
                      <div className="small text-muted">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Save Draft:</span>
                          <kbd className="small">Ctrl+S</kbd>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Submit Form:</span>
                          <kbd className="small">Ctrl+Enter</kbd>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Upload File:</span>
                          <kbd className="small">Alt+U</kbd>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Clear Field:</span>
                          <kbd className="small">Esc</kbd>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Show Help:</span>
                          <kbd className="small">F1</kbd>
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
          .form-control,
          .form-select {
            border: 1px solid rgba(0,0,0,.05) !important;
            box-shadow: none !important;
          }
          .form-control:focus,
          .form-select:focus {
            border: 1px solid rgba(0,0,0,.1) !important;
            box-shadow: none !important;
          }
          .form-control.is-valid,
          .form-select.is-valid {
            border: 1px solid rgba(25,135,84,.3) !important;
            box-shadow: none !important;
          }
          .form-control.is-invalid,
          .form-select.is-invalid {
            border: 1px solid rgba(220,53,69,.3) !important;
            box-shadow: none !important;
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
