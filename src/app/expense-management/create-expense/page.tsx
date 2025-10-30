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
import { Upload, XCircle } from "lucide-react";
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
  const [paybillNumberValid, setPaybillNumberValid] = useState<boolean | null>(
    null
  );
  const [paybillAccountValid, setPaybillAccountValid] = useState<
    boolean | null
  >(null);
  const [tillNumberValid, setTillNumberValid] = useState<boolean | null>(null);
  const [bankNameValid, setBankNameValid] = useState<boolean | null>(null);
  const [bankAccountValid, setBankAccountValid] = useState<boolean | null>(
    null
  );
  const [branchCodeValid, setBranchCodeValid] = useState<boolean | null>(null);
  const [phoneNumberValid, setPhoneNumberValid] = useState<boolean | null>(
    null
  );

  // Validation functions
  const validatePaybillNumber = (value: string): boolean => {
    // Must be integer (numbers only)
    return /^\d+$/.test(value) && value.length > 0;
  };

  const validatePaybillAccount = (value: string): boolean => {
    // Must be alphanumeric mixture
    return (
      /^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(value) && value.length > 0
    );
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
                        <h5 className="fw-bold text-primary mb-0">
                          Create New Expense
                        </h5>
                        <p className="text-muted mb-0 small">
                          Submit a new expense for approval and payment
                        </p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="d-none d-md-flex align-items-center"
                    style={{
                      gap: '0.5rem'
                    }}
                  >
                    {/* Home */}
                    <a
                      href="/"
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none"
                      style={{
                        background: 'white',
                        border: '2px solid #e9ecef',
                        transition: 'all 0.2s ease',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: '#64748b'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e9ecef';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <HouseDoor size={14} />
                      <span>Home</span>
                    </a>

                    {/* Separator */}
                    <div style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>›</div>

                    {/* My Expenses */}
                    <a
                      href="/expense-management/my-expenses"
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none"
                      style={{
                        background: 'white',
                        border: '2px solid #e9ecef',
                        transition: 'all 0.2s ease',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: '#64748b'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e9ecef';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <ListCheck size={14} />
                      <span>My Expenses</span>
                    </a>

                    {/* Separator */}
                    <div style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>›</div>

                    {/* Current Page - Active */}
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                      style={{
                        background: '#667eea',
                        border: '2px solid #667eea',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      <PlusCircle size={14} />
                      <span>Create New</span>
                    </div>
                  </div>
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
                                      setPaybillNumberValid(
                                        validatePaybillNumber(value)
                                      );
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
                                      setPaybillAccountValid(
                                        validatePaybillAccount(value)
                                      );
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
                                  Account number must contain both letters and
                                  numbers
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
                                      setBankAccountValid(
                                        validateBankAccount(value)
                                      );
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
                                      setBranchCodeValid(
                                        validateBranchCode(value)
                                      );
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
                                  setPhoneNumberValid(
                                    validatePhoneNumber(value)
                                  );
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
                              Phone number must be 254 followed by 9 digits
                              (e.g., 254712345678)
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
                        <div className="mt-4">
                          <div 
                            className="payment-reference-card border-0 shadow-sm mb-0"
                            style={{
                              background: 'linear-gradient(135deg, #f8f9ff 0%, #e7f1ff 100%)',
                              borderRadius: '1rem',
                              padding: '1.5rem',
                              border: '2px solid #667eea',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Decorative Background Elements */}
                            <div style={{
                              position: 'absolute',
                              top: '-20px',
                              right: '-20px',
                              width: '100px',
                              height: '100px',
                              background: 'rgba(102, 126, 234, 0.1)',
                              borderRadius: '50%',
                              filter: 'blur(30px)'
                            }}></div>
                            <div style={{
                              position: 'absolute',
                              bottom: '-30px',
                              left: '-30px',
                              width: '120px',
                              height: '120px',
                              background: 'rgba(102, 126, 234, 0.08)',
                              borderRadius: '50%',
                              filter: 'blur(40px)'
                            }}></div>

                            <div className="d-flex align-items-start gap-3" style={{ position: 'relative', zIndex: 1 }}>
                              <div 
                                className="flex-shrink-0"
                                style={{
                                  background: '#667eea',
                                  padding: '0.75rem',
                                  borderRadius: '0.75rem',
                                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <CheckCircle
                                  size={24}
                                  className="text-white"
                                  style={{ 
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                  }}
                                />
                              </div>
                              
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                  <h6 className="fw-bold mb-0" style={{ 
                                    color: '#4c51bf',
                                    fontSize: '1rem',
                                    letterSpacing: '0.3px'
                                  }}>
                                    <PersonBadge className="me-2" size={18} />
                                    Payment Reference Generated
                                  </h6>
                                  <Badge 
                                    bg=""
                                    className="px-3 py-2"
                                    style={{
                                      background: '#667eea',
                                      color: 'white',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      letterSpacing: '0.5px',
                                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem'
                                    }}
                                  >
                                    <Check2 size={14} />
                                    READY
                                  </Badge>
                                </div>
                                
                                <div 
                                  className="payment-reference-value"
                                  style={{
                                    background: 'white',
                                    borderRadius: '0.75rem',
                                    padding: '1.25rem 1.5rem',
                                    border: '2px solid #667eea',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                                    marginBottom: '1rem',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                  }}></div>
                                  
                                  <code
                                    className="text-dark d-block"
                                    style={{ 
                                      fontSize: '0.9rem',
                                      fontWeight: '600',
                                      letterSpacing: '0.5px',
                                      fontFamily: '"Courier New", monospace',
                                      color: '#4c51bf',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {payeeNumber}
                                  </code>
                                </div>
                                
                                <div 
                                  className="d-flex align-items-center gap-2 p-3"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(102, 126, 234, 0.2)'
                                  }}
                                >
                                  <div 
                                    className="flex-shrink-0"
                                    style={{
                                      background: '#667eea',
                                      padding: '0.4rem',
                                      borderRadius: '0.4rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <InfoCircle size={14} className="text-white" />
                                  </div>
                                  <small 
                                    className="mb-0"
                                    style={{ 
                                      color: '#4c51bf',
                                      fontSize: '0.85rem',
                                      fontWeight: '500',
                                      lineHeight: '1.5'
                                    }}
                                  >
                                    This payment reference will be sent to the backend for processing
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
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
                        <div 
                          className="p-3 rounded-3 me-3"
                          style={{
                            background: 'linear-gradient(135deg, #f0f4ff 0%, #e7f1ff 100%)',
                            border: '2px solid #667eea'
                          }}
                        >
                          <Receipt className="text-primary" size={22} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">
                            Attachments
                          </h6>
                          <span className="text-muted small">
                            Upload supporting documents (PDF, JPG, PNG, DOCX - Max 10MB)
                          </span>
                        </div>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div 
                            className="file-upload-area border border-2 border-dashed rounded-3 p-4 text-center position-relative"
                            style={{
                              background: fileName 
                                ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
                                : 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                              borderColor: fileName ? '#10b981' : '#cbd5e1',
                              transition: 'all 0.3s ease',
                              minHeight: '280px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <input
                              type="file"
                              id="file-upload"
                              accept="image/*,.pdf,.doc,.docx"
                              className="d-none"
                              onChange={handleFileChange}
                            />

                            {!fileName ? (
                              <>
                                <div 
                                  className="mb-4 p-4 rounded-circle"
                                  style={{
                                    background: 'rgba(102, 126, 234, 0.1)',
                                    border: '3px dashed #667eea'
                                  }}
                                >
                                  <FileEarmarkPlus
                                    size={48}
                                    style={{ color: '#667eea' }}
                                  />
                                </div>

                                <h6 className="fw-bold mb-2" style={{ color: '#1f2937' }}>
                                  Drop your files here
                                </h6>
                                <p className="text-muted small mb-3">
                                  or click the button below to browse
                                </p>

                                <label
                                  htmlFor="file-upload"
                                  className="btn px-4 py-2 fw-semibold"
                                  style={{
                                    background: '#667eea',
                                    color: 'white',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                                  }}
                                >
                                  <Upload size={16} className="me-2" /> 
                                  Choose File
                                </label>

                                <div className="mt-4 d-flex align-items-center justify-content-center gap-2">
                                  <div 
                                    className="px-2 py-1 rounded"
                                    style={{
                                      background: '#f1f5f9',
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      color: '#64748b'
                                    }}
                                  >
                                    PDF
                                  </div>
                                  <div 
                                    className="px-2 py-1 rounded"
                                    style={{
                                      background: '#f1f5f9',
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      color: '#64748b'
                                    }}
                                  >
                                    JPG
                                  </div>
                                  <div 
                                    className="px-2 py-1 rounded"
                                    style={{
                                      background: '#f1f5f9',
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      color: '#64748b'
                                    }}
                                  >
                                    PNG
                                  </div>
                                  <div 
                                    className="px-2 py-1 rounded"
                                    style={{
                                      background: '#f1f5f9',
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      color: '#64748b'
                                    }}
                                  >
                                    DOCX
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-100">
                                <div 
                                  className="mb-3 p-3 rounded-circle mx-auto"
                                  style={{
                                    background: '#10b981',
                                    width: '80px',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                  }}
                                >
                                  <CheckCircle size={40} className="text-white" />
                                </div>
                                
                                <h6 className="fw-bold mb-2" style={{ color: '#047857' }}>
                                  File Uploaded Successfully!
                                </h6>
                                
                                <div 
                                  className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 mb-3"
                                  style={{
                                    background: 'white',
                                    border: '2px solid #10b981'
                                  }}
                                >
                                  <FileEarmarkText size={16} style={{ color: '#10b981' }} />
                                  <span 
                                    className="small fw-semibold"
                                    style={{ color: '#047857' }}
                                  >
                                    {fileName}
                                  </span>
                                </div>

                                <div className="d-flex gap-2 justify-content-center">
                                  <label
                                    htmlFor="file-upload"
                                    className="btn btn-sm px-3 py-2"
                                    style={{
                                      background: 'white',
                                      color: '#667eea',
                                      border: '2px solid #667eea',
                                      borderRadius: '0.5rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    Change File
                                  </label>
                                  
                                  <Button
                                    variant=""
                                    size="sm"
                                    className="px-3 py-2"
                                    style={{
                                      background: 'white',
                                      color: '#ef4444',
                                      border: '2px solid #ef4444',
                                      borderRadius: '0.5rem',
                                      fontWeight: '600',
                                      fontSize: '0.85rem'
                                    }}
                                    onClick={() => {
                                      setSelectedFile(null);
                                      setFileName("");
                                      setPreviewUrl("");
                                      setExtractedData({});
                                    }}
                                  >
                                    <XCircle size={14} className="me-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </Col>

                        {/* Preview and Extracted Data */}
                        <Col md={6}>
                          {previewUrl && (
                            <div className="receipt-preview mb-4">
                              <div 
                                className="d-flex align-items-center gap-2 mb-3 pb-2"
                                style={{ borderBottom: '2px solid #e9ecef' }}
                              >
                                <div 
                                  className="p-2 rounded"
                                  style={{ background: '#f1f5f9' }}
                                >
                                  <FileEarmarkText size={18} style={{ color: '#667eea' }} />
                                </div>
                                <h6 className="fw-bold mb-0" style={{ color: '#1f2937' }}>
                                  Preview
                                </h6>
                              </div>
                              <div 
                                className="border rounded-3 p-3"
                                style={{
                                  background: '#f8f9fa',
                                  borderColor: '#e9ecef !important'
                                }}
                              >
                                <img
                                  src={previewUrl}
                                  alt="Receipt preview"
                                  className="img-fluid rounded"
                                  style={{
                                    maxHeight: "200px",
                                    width: "100%",
                                    objectFit: "contain",
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {Object.keys(extractedData).length > 0 && (
                            <div 
                              className="rounded-3 p-4"
                              style={{
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                border: '2px solid #10b981'
                              }}
                            >
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <div 
                                  className="p-2 rounded"
                                  style={{ background: '#10b981' }}
                                >
                                  <Shield size={18} className="text-white" />
                                </div>
                                <h6 className="fw-bold mb-0" style={{ color: '#047857' }}>
                                  Extracted Data
                                </h6>
                              </div>
                              
                              <div className="small" style={{ color: '#047857' }}>
                                {extractedData.amount && (
                                  <div 
                                    className="d-flex justify-content-between align-items-center mb-2 p-2 rounded"
                                    style={{ background: 'rgba(255, 255, 255, 0.7)' }}
                                  >
                                    <strong>Amount:</strong>
                                    <span className="fw-semibold">${extractedData.amount}</span>
                                  </div>
                                )}
                                {extractedData.vendor && (
                                  <div 
                                    className="d-flex justify-content-between align-items-center mb-2 p-2 rounded"
                                    style={{ background: 'rgba(255, 255, 255, 0.7)' }}
                                  >
                                    <strong>Vendor:</strong>
                                    <span className="fw-semibold">{extractedData.vendor}</span>
                                  </div>
                                )}
                                {extractedData.date && (
                                  <div 
                                    className="d-flex justify-content-between align-items-center p-2 rounded"
                                    style={{ background: 'rgba(255, 255, 255, 0.7)' }}
                                  >
                                    <strong>Date:</strong>
                                    <span className="fw-semibold">{extractedData.date}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div 
                                className="small mt-3 p-2 rounded d-flex align-items-center gap-2"
                                style={{ 
                                  background: 'rgba(255, 255, 255, 0.7)',
                                  color: '#047857'
                                }}
                              >
                                <InfoCircle size={14} />
                                <span>Data automatically filled in form</span>
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
          /* Modern Create Expense Page Styles */
          .create-expense-page {
            min-height: 100vh;
            background: #f8f9fa;
          }

          /* Enhanced Card Styles */
          .card {
            border-radius: 1rem !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none !important;
          }

          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
          }

          /* Form Control Enhancements */
          .form-control,
          .form-select {
            border: 2px solid #e9ecef !important;
            border-radius: 0.75rem !important;
            padding: 0.75rem 1rem !important;
            font-size: 0.95rem !important;
            transition: all 0.3s ease !important;
            background-color: #fff !important;
          }

          .form-control:hover,
          .form-select:hover {
            border-color: #cbd5e1 !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
          }

          .form-control:focus,
          .form-select:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
            background-color: #fff !important;
          }

          .form-control.is-valid,
          .form-select.is-valid {
            border-color: #e9ecef !important;
            background-color: #fff !important;
          }

          .form-control.is-valid:focus,
          .form-select.is-valid:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
          }

          /* Valid feedback - green text only */
          .valid-feedback {
            color: #10b981 !important;
          }

          .form-control.is-invalid,
          .form-select.is-invalid {
            border-color: #ef4444 !important;
            background-color: #fef2f2 !important;
          }

          .form-control.is-invalid:focus,
          .form-select.is-invalid:focus {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
          }

          /* Form Labels */
          .form-label {
            font-weight: 600 !important;
            color: #1f2937 !important;
            margin-bottom: 0.5rem !important;
            font-size: 0.9rem !important;
            letter-spacing: 0.3px !important;
          }

          /* File Upload Area */
          .file-upload-area {
            border: 2px dashed #cbd5e1 !important;
            border-radius: 1rem !important;
            transition: all 0.3s ease !important;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%) !important;
          }

          .file-upload-area:hover {
            border-color: #667eea !important;
            background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%) !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15) !important;
          }

          .border-dashed {
            border-style: dashed !important;
          }

          /* Button Enhancements */
          .btn {
            border-radius: 0.75rem !important;
            padding: 0.75rem 1.5rem !important;
            font-weight: 600 !important;
            letter-spacing: 0.3px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border: none !important;
          }

          /* Smaller buttons for payment type selection */
          .btn-sm {
            padding: 0.4rem 0.9rem !important;
            font-size: 0.8rem !important;
            border-radius: 0.5rem !important;
          }

          .btn-primary {
            background: #667eea !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
          }

          .btn-primary:hover {
            background: #5568d3 !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
          }

          .btn-primary:active {
            transform: translateY(0);
          }

          .btn-outline-primary {
            border: 2px solid #667eea !important;
            color: #667eea !important;
            background: transparent !important;
          }

          .btn-outline-primary:hover {
            background: #667eea !important;
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3) !important;
          }

          .btn-outline-secondary {
            border: 2px solid #6c757d !important;
            color: #6c757d !important;
            background: white !important;
          }

          .btn-outline-secondary:hover {
            background: #6c757d !important;
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(108, 117, 125, 0.2) !important;
          }

          /* Radio and Checkbox Styles */
          .form-check-input {
            width: 1.25rem !important;
            height: 1.25rem !important;
            border: 2px solid #cbd5e1 !important;
            transition: all 0.2s ease !important;
          }

          .form-check-input:checked {
            background-color: #667eea !important;
            border-color: #667eea !important;
          }

          .form-check-input:focus {
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
          }

          .form-check-label {
            font-weight: 500 !important;
            margin-left: 0.5rem !important;
            cursor: pointer !important;
          }

          /* Alert Enhancements */
          .alert {
            border-radius: 0.75rem !important;
            border: none !important;
            padding: 1rem 1.25rem !important;
          }

          .alert-warning {
            background: linear-gradient(135deg, #fff3cd 0%, #fffbeb 100%) !important;
            border-left: 4px solid #f59e0b !important;
          }

          /* Badge Enhancements */
          .badge {
            padding: 0.5rem 1rem !important;
            border-radius: 0.5rem !important;
            font-weight: 600 !important;
            font-size: 0.8rem !important;
            letter-spacing: 0.3px !important;
          }

          /* Progress Bar */
          .progress {
            height: 8px !important;
            border-radius: 999px !important;
            background-color: #e9ecef !important;
            overflow: hidden !important;
          }

          .progress-bar {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
            transition: width 0.6s ease !important;
          }

          /* Input Group Enhancements */
          .input-group-text {
            background-color: #f1f5f9 !important;
            border: 2px solid #e9ecef !important;
            border-right: none !important;
            border-radius: 0.75rem 0 0 0.75rem !important;
            color: #64748b !important;
            font-weight: 600 !important;
          }

          .input-group .form-control {
            border-left: none !important;
            border-radius: 0 0.75rem 0.75rem 0 !important;
          }

          .input-group .form-control:focus {
            border-left: none !important;
          }

          /* Kbd (Keyboard Shortcut) Styling */
          kbd {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 0.35rem 0.6rem !important;
            border-radius: 0.4rem !important;
            font-size: 0.75rem !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3) !important;
            border: none !important;
          }

          /* Breadcrumb Enhancements */
          .breadcrumb {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .breadcrumb-item {
            font-size: 0.9rem !important;
          }

          .breadcrumb-item + .breadcrumb-item::before {
            color: #cbd5e1 !important;
          }

          .breadcrumb-item a {
            color: #64748b !important;
            text-decoration: none !important;
            transition: color 0.2s ease !important;
          }

          .breadcrumb-item a:hover {
            color: #667eea !important;
          }

          .breadcrumb-item.active {
            color: #667eea !important;
            font-weight: 600 !important;
          }

          /* Sticky Top Enhancement */
          .sticky-top {
            top: 1rem !important;
            z-index: 100 !important;
          }

          /* Spinner */
          .spinner-border-sm {
            width: 1rem !important;
            height: 1rem !important;
          }

          /* Validation Feedback */
          .invalid-feedback,
          .valid-feedback {
            font-size: 0.85rem !important;
            font-weight: 500 !important;
            margin-top: 0.5rem !important;
          }

          /* Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          /* Smooth Animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .card {
            animation: fadeIn 0.3s ease-out;
          }

          /* Responsive Enhancements */
          @media (max-width: 768px) {
            .card {
              margin-bottom: 1.5rem !important;
            }

            .btn {
              width: 100%;
              margin-bottom: 0.5rem;
            }

            .form-control,
            .form-select {
              font-size: 16px !important; /* Prevents zoom on iOS */
            }
          }

          /* Auto-save Indicator */
          .auto-save-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          /* Icon Containers */
          .bg-primary.bg-opacity-10 {
            background-color: rgba(102, 126, 234, 0.1) !important;
          }

          .rounded-circle {
            transition: all 0.3s ease !important;
          }

          .rounded-circle:hover {
            transform: rotate(360deg);
          }

          /* Shadow Enhancements */
          .shadow-sm {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          }

          /* HR Line */
          .border-primary {
            border-color: #667eea !important;
          }

          .opacity-25 {
            opacity: 0.25 !important;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
