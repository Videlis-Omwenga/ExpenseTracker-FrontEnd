"use client";

import AuthProvider from "@/app/authPages/tokenData";
import TopNavbar from "@/app/components/Navbar";
import { BASE_API_URL } from "@/app/static/apiConfig";
import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Container,
  Row,
  Col,
  Badge,
  Card,
  InputGroup,
  Dropdown,
  Pagination,
  Alert,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import {
  PencilSquare,
  Trash,
  PlusCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Tags,
  InfoCircle,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import PageLoader from "@/app/components/PageLoader";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";
import { FaSortUp, FaSortDown, FaFileExport } from "react-icons/fa";

interface Category {
  id: number;
  name: string;
  isActive: boolean;
  canBeUsedForAdvance: boolean;
  canBeUsedForAccounting: boolean;
  canBeUsedByAnyUser: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    Expense: number;
    budgets: number;
    advances: number;
  };
  // Optional properties for display purposes
  institution?: string;
  region?: string;
  exemptedFromBudgetChecks: boolean;
  description: string;
  comments: string;
}

interface SortConfig {
  key: string;
  direction: "ascending" | "descending";
}

const exportService = {
  downloadCSV(data: any[], filename: string) {
    const headers = Object.keys(data[0]);
    const rows = data.map((obj) => headers.map((header) => obj[header]));
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default function CategoriesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [canBeUsedForAdvance, setCanBeUsedForAdvance] = useState(false);
  const [canBeUsedForAccounting, setCanBeUsedForAccounting] = useState(false);
  const [canBeUsedByAnyUser, setCanBeUsedByAnyUser] = useState(false);
  const [exemptedFromBudgetChecks, setExemptedFromBudgetChecks] =
    useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedCanBeUsedForAdvance, setEditedCanBeUsedForAdvance] =
    useState(false);
  const [editedCanBeUsedForAccounting, setEditedCanBeUsedForAccounting] =
    useState(false);
  const [editedCanBeUsedByAnyUser, setEditedCanBeUsedByAnyUser] =
    useState(false);
  const [editedExemptedFromBudgetChecks, setEditedExemptedFromBudgetChecks] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState("");
  const [description, setDescription] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  /** Fetch "expenses to approve" */
  const fetchExpensesToApprove = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_API_URL}/data-inputs/get-categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setCategories(data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesToApprove();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        canBeUsedForAdvance,
        canBeUsedForAccounting,
        canBeUsedByAnyUser,
        exemptedFromBudgetChecks,
        description,
      };
      const res = await fetch(`${BASE_API_URL}/data-inputs/create-category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "expenseTrackerToken"
          )}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories(data);
        setShowModal(false);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditData = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: editedName,
        canBeUsedForAdvance: editedCanBeUsedForAdvance,
        canBeUsedForAccounting: editedCanBeUsedForAccounting,
        canBeUsedByAnyUser: editedCanBeUsedByAnyUser,
        exemptedFromBudgetChecks: editedExemptedFromBudgetChecks,
        description: editedDescription,
      };
      const res = await fetch(
        `${BASE_API_URL}/data-inputs/update-category/${itemId}`,
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

      const data = await res.json();

      if (res.ok) {
        toast.success(`${editedName} updated successfully`);
        setCategories(data);
        setEditModal(false);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        comments,
      };
      const res = await fetch(
        `${BASE_API_URL}/data-inputs/delete-category/${itemId}`,
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

      const data = await res.json();

      if (res.ok) {
        toast.success(`${selectedCategory?.name} deleted successfully`);
        setCategories(data);
        setDeleteModal(false);
      } else {
        toast.error(`${data.message}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "ascending",
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [itemId, setItemId] = useState(0);
  const selectedCategory = categories.find((c) => c.id === itemId);

  useEffect(() => {
    if (selectedCategory) {
      setEditedName(selectedCategory.name);
      setEditedCanBeUsedForAdvance(selectedCategory.canBeUsedForAdvance);
      setEditedCanBeUsedForAccounting(selectedCategory.canBeUsedForAccounting);
      setEditedCanBeUsedByAnyUser(selectedCategory.canBeUsedByAnyUser);
      setEditedExemptedFromBudgetChecks(
        selectedCategory.exemptedFromBudgetChecks
      );
      setEditedDescription(selectedCategory.description);
    }
  }, [selectedCategory]);

  const handleClose = () => {
    setShowModal(false);
    setName("");
    setDescription("");
    setCanBeUsedForAdvance(false);
    setCanBeUsedForAccounting(false);
    setCanBeUsedByAnyUser(false);
    setExemptedFromBudgetChecks(false);
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const [deleteModal, setDeleteModal] = useState(false);
  const handleDelete = (id: number) => {
    setItemId(id);
    setDeleteModal(true);
  };

  const handleDeleteClose = () => {
    setDeleteModal(false);
    setComments("");
  };

  const [editModal, setEditModal] = useState(false);
  const handleEdit = (id: number) => {
    setItemId(id);
    setEditModal(true);
  };

  const handleEditClose = () => {
    setEditModal(false);
    setEditedName("");
    setEditedCanBeUsedForAdvance(false);
    setEditedCanBeUsedForAccounting(false);
    setEditedCanBeUsedByAnyUser(false);
    setEditedExemptedFromBudgetChecks(false);
    setEditedDescription("");
  };

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleExportData = () => {
    const exportData = categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      isActive: cat.isActive ? 'Yes' : 'No',
      canBeUsedForAdvance: cat.canBeUsedForAdvance ? 'Yes' : 'No',
      canBeUsedForAccounting: cat.canBeUsedForAccounting ? 'Yes' : 'No',
      canBeUsedByAnyUser: cat.canBeUsedByAnyUser ? 'Yes' : 'No',
      exemptedFromBudgetChecks: cat.exemptedFromBudgetChecks ? 'Yes' : 'No',
      createdAt: new Date(cat.createdAt).toLocaleString(),
      updatedAt: new Date(cat.updatedAt).toLocaleString()
    }));
    exportService.downloadCSV(exportData, 'categories-export');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredCategories = categories
    .filter((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && category.isActive) ||
        (activeFilter === "inactive" && !category.isActive);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortConfig.key && sortConfig.key in a && sortConfig.key in b) {
        const aValue = a[sortConfig.key as keyof Category];
        const bValue = b[sortConfig.key as keyof Category];

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (bValue === undefined)
          return sortConfig.direction === "ascending" ? 1 : -1;

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
      }
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <FaSortUp />
    ) : (
      <FaSortDown />
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="categories-container px-4 py-4">
        {/* Header Section */}
        <Row className="mb-4">
          <Col>
            <Card className="page-header-card shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="page-title mb-1">
                      <Tags className="me-2 text-success" />
                      Categories Management
                    </h4>
                    <p className="page-subtitle text-muted mb-0">
                      Manage expense categories and classifications
                    </p>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleShow}
                    className="btn-action"
                  >
                    <PlusCircle className="me-1" /> Add Category
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search Section */}
        <Row className="mb-3">
          <Col md={6}>
            <div className="search-wrapper">
              <div className="search-container">
                <InputGroup size="sm" className="search-input-group">
                  <InputGroup.Text className="search-icon-wrapper">
                    <Search className="search-icon" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search categories by name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                  />
                  {searchTerm && (
                    <InputGroup.Text
                      className="search-clear-wrapper"
                      onClick={() => setSearchTerm("")}
                      role="button"
                    >
                      <Trash className="search-clear-icon" />
                    </InputGroup.Text>
                  )}
                </InputGroup>
                {searchTerm && (
                  <div className="search-results">
                    <div className="results-content">
                      Found {filteredCategories.length} {filteredCategories.length === 1 ? 'result' : 'results'}
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
              onClick={handleExportData}
              disabled={categories.length === 0}
              className="btn-action"
            >
              <FaFileExport className="me-1" /> Export CSV
            </Button>
          </Col>
        </Row>

        {/* Table Section */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table responsive hover className="mb-0 table-modern">
                    <thead className="bg-light border-0">
                      <tr>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                          #
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                          Name
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                          Status
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Advances
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Accounting
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Any User
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Budget Exempt
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                          Created
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">
                          Updated
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Expenses
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Budgets
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Advances
                        </th>
                        <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((cat, idx) => (
                          <tr
                            key={cat.id}
                            className={`border-bottom ${!cat.isActive ? "text-muted" : ""
                              }`}
                          >
                            <td className="py-3 px-4">
                              <span className="fw-semibold text-primary">
                                {indexOfFirstItem + idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="d-flex flex-column">
                                <span className="fw-semibold text-dark">
                                  {cat.name}
                                </span>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>{cat.description}</Tooltip>}
                                >
                                  <span
                                    className="text-truncate text-muted small"
                                    style={{
                                      maxWidth: "200px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {cat.description}
                                  </span>
                                </OverlayTrigger>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {cat.isActive ? (
                                <Badge
                                  bg="success"
                                  className="px-3 py-1 rounded-pill fw-medium d-inline-flex align-items-center"
                                >
                                  <CheckCircle className="me-1" size={14} /> Active
                                </Badge>
                              ) : (
                                <Badge
                                  bg="danger"
                                  className="px-3 py-1 rounded-pill fw-medium d-inline-flex align-items-center"
                                >
                                  <XCircle className="me-1" size={14} /> Deleted
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {cat.canBeUsedForAdvance ? (
                                <CheckCircle className="text-success" size={20} />
                              ) : (
                                <XCircle className="text-danger" size={20} />
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {cat.canBeUsedForAccounting ? (
                                <CheckCircle className="text-success" size={20} />
                              ) : (
                                <XCircle className="text-danger" size={20} />
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {cat.canBeUsedByAnyUser ? (
                                <CheckCircle className="text-success" size={20} />
                              ) : (
                                <XCircle className="text-danger" size={20} />
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {cat.exemptedFromBudgetChecks ? (
                                <CheckCircle className="text-success" size={20} />
                              ) : (
                                <XCircle className="text-danger" size={20} />
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <DateTimeDisplay date={cat.createdAt} />
                            </td>
                            <td className="py-3 px-4">
                              <DateTimeDisplay date={cat.updatedAt} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                bg="info"
                                className="px-3 py-1 rounded-pill"
                              >
                                {cat._count?.Expense || 0}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                bg="primary"
                                className="px-3 py-1 rounded-pill"
                              >
                                {cat._count?.budgets || 0}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                bg="warning"
                                text="dark"
                                className="px-3 py-1 rounded-pill"
                              >
                                {cat._count?.advances || 0}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="d-flex justify-content-center gap-2">
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Edit Category</Tooltip>}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline-warning"
                                    className="rounded-pill px-3 py-1 fw-medium"
                                    onClick={() => handleEdit(cat.id)}
                                  >
                                    <PencilSquare size={14} />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Delete Category</Tooltip>}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    className="rounded-pill px-3 py-1 fw-medium"
                                    onClick={() => handleDelete(cat.id)}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </OverlayTrigger>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={13} className="text-center py-5">
                            <div className="text-muted">
                              <InfoCircle size={48} className="mb-3 opacity-50" />
                              <p className="mb-0 fw-semibold">No categories found</p>
                              {searchTerm && (
                                <small>Try adjusting your search criteria</small>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {filteredCategories.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top bg-light">
                    <div className="text-muted small">
                      Showing{" "}
                      <span className="fw-bold text-dark">
                        {indexOfFirstItem + 1}
                      </span>{" "}
                      to{" "}
                      <span className="fw-bold text-dark">
                        {Math.min(indexOfLastItem, filteredCategories.length)}
                      </span>{" "}
                      of{" "}
                      <span className="fw-bold text-dark">
                        {filteredCategories.length}
                      </span>{" "}
                      entries
                    </div>
                    <Pagination size="sm" className="mb-0">
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => paginate(currentPage - 1)}
                      />
                      {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item
                          key={i + 1}
                          active={i + 1 === currentPage}
                          onClick={() => paginate(i + 1)}
                        >
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => paginate(currentPage + 1)}
                      />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Create Modal */}
        <Modal show={showModal} onHide={handleClose} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <PlusCircle className="me-2 text-success" />
              Create Category
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form onSubmit={handleCreate}>
              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <Tags className="me-2 text-success" />
                    Category Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter the category name
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="form-label">
                    <InfoCircle className="me-2 text-primary" />
                    Description
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input"
                    required
                  />
                </Form.Group>

                <div className="permissions-section bg-light p-3 rounded-3">
                  <h6 className="mb-3 d-flex align-items-center">
                    <Filter className="me-2 text-primary" />
                    Usage Permissions
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAdvance"
                      label="Can be used for advance"
                      checked={canBeUsedForAdvance}
                      onChange={(e) => setCanBeUsedForAdvance(e.target.checked)}
                      className="modern-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAccounting"
                      label="Can be used for accounting"
                      checked={canBeUsedForAccounting}
                      onChange={(e) =>
                        setCanBeUsedForAccounting(e.target.checked)
                      }
                      className="modern-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="canBeUsedByAnyUser"
                      label="Can be used by any user"
                      checked={canBeUsedByAnyUser}
                      onChange={(e) => setCanBeUsedByAnyUser(e.target.checked)}
                      className="modern-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="exemptedFromBudgetChecks"
                      label="Exempted from budget checks"
                      checked={exemptedFromBudgetChecks}
                      onChange={(e) =>
                        setExemptedFromBudgetChecks(e.target.checked)
                      }
                      className="modern-switch"
                    />
                  </div>
                </div>
              </div>
              <Modal.Footer className="border-0">
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleClose}
                  className="btn-cancel"
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  type="submit"
                  disabled={submitting}
                  className="btn-submit"
                >
                  {submitting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <PlusCircle className="me-1" /> Create Category
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Edit Modal */}
        <Modal show={editModal} onHide={handleEditClose} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <PencilSquare className="me-2 text-warning" />
              Edit Category
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form onSubmit={handleEditData}>
              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <Tags className="me-2 text-success" />
                    Category Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="form-input"
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter the category name
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="form-label">
                    <InfoCircle className="me-2 text-primary" />
                    Description
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="form-input"
                    required
                  />
                </Form.Group>

                <div className="permissions-section bg-light p-3 rounded-3">
                  <h6 className="mb-3 d-flex align-items-center">
                    <Filter className="me-2 text-primary" />
                    Usage Permissions
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAdvance"
                      label="Can be used for advance"
                      checked={editedCanBeUsedForAdvance}
                      onChange={(e) =>
                        setEditedCanBeUsedForAdvance(e.target.checked)
                      }
                      className="modern-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAccounting"
                      label="Can be used for accounting"
                      checked={editedCanBeUsedForAccounting}
                      onChange={(e) =>
                        setEditedCanBeUsedForAccounting(e.target.checked)
                      }
                      className="modern-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="canBeUsedByAnyUser"
                      label="Can be used by any user"
                      checked={editedCanBeUsedByAnyUser}
                      onChange={(e) =>
                        setEditedCanBeUsedByAnyUser(e.target.checked)
                      }
                      className="modern-switch"
                    />
                    <Form.Check
                      type="switch"
                      id="exemptedFromBudgetChecks"
                      label="Exempted from budget checks"
                      checked={editedExemptedFromBudgetChecks}
                      onChange={(e) =>
                        setEditedExemptedFromBudgetChecks(e.target.checked)
                      }
                      className="modern-switch"
                    />
                  </div>
                </div>
              </div>
              <Modal.Footer className="border-0">
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleEditClose}
                  className="btn-cancel"
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  type="submit"
                  disabled={submitting}
                  className="btn-submit"
                >
                  {submitting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <PencilSquare className="me-1" /> Update Category
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Delete Modal */}
        <Modal show={deleteModal} onHide={handleDeleteClose} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <Trash className="me-2 text-danger" />
              Delete Category
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <div className="text-center">
              <div className="delete-icon-wrapper">
                <Trash size={48} className="text-danger opacity-75" />
              </div>
              <h5 className="mb-3">Delete Category</h5>
              <p className="text-muted mb-2">
                Are you sure you want to delete <br />
                <strong className="text-dark">{selectedCategory?.name}</strong>
              </p>
              <Form onSubmit={handleDeleteConfirm}>
                <div className="form-card">
                  <Form.Group>
                    <Form.Label className="form-label text-start d-block">
                      <InfoCircle className="me-2 text-danger" />
                      Reason for deletion
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="form-input"
                      required
                    />
                    <Form.Text className="text-danger">
                      This action cannot be undone
                    </Form.Text>
                  </Form.Group>
                </div>
                <Modal.Footer className="border-0">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleDeleteClose}
                    className="btn-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="submit"
                    disabled={submitting}
                    className="btn-submit"
                  >
                    {submitting ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <Trash className="me-1" /> Delete Category
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </div>
          </Modal.Body>
        </Modal>

        <style jsx global>{`
          /* Base Container */
          .categories-container {
            background-color: #f8fafc;
            min-height: calc(100vh - 56px);
          }

          /* Header Card */
          .page-header-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
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

          /* Search Styling */
          .search-wrapper {
            position: relative;
            z-index: 1000;
          }

          .search-container {
            position: relative;
            width: 100%;
          }

          .search-input-group {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
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

          .search-input {
            border: 1px solid #e2e8f0 !important;
            border-left: none !important;
            padding: 1rem !important;
            font-size: 0.875rem !important;
            background: white !important;
          }

          .search-clear-wrapper {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-left: none !important;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .search-clear-wrapper:hover {
            color: #ef4444;
          }

          .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 1rem 1rem;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: #64748b;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          /* Table Styling */
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

          /* Action Buttons */
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

          /* Modal Styling */
          .modal-content {
            border: none;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }

          .modal-header {
            padding: 1.5rem;
          }

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

          .permissions-section {
            border: 1px solid #e2e8f0;
          }

          .modern-switch {
            padding-left: 2.5rem;
          }

          .modern-switch .form-check-input {
            width: 2rem;
            height: 1rem;
            margin-left: -2.5rem;
          }

          .delete-icon-wrapper {
            width: 80px;
            height: 80px;
            background: #fee2e2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }

          .btn-submit {
            background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
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
        `}</style>
      </Container>
    </AuthProvider>
  );
}
