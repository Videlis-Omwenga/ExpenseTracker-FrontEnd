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
  Search,
  SortAlphaDown,
  SortAlphaUp,
  InfoCircle,
  Filter,
  Building,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import PageLoader from "@/app/components/PageLoader";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";
import { FaSort, FaSortUp, FaSortDown, FaFileExport } from "react-icons/fa";

interface Department {
  id: number;
  name: string;
  institutionId: number | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    Expense: number;
    budgets: number;
  };
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

export default function DepartmentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedInstitutionId, setEditedInstitutionId] = useState<number | null>(
    null
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "ascending",
  });

  /** Fetch departments */
  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_API_URL}/data-inputs/get-departments`, {
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
        setDepartments(data);
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
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        institutionId: institutionId || undefined,
      };
      const res = await fetch(`${BASE_API_URL}/data-inputs/create-department`, {
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
        setDepartments(data);
        setShowModal(false);
        toast.success("Department created successfully");
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
        institutionId: editedInstitutionId || undefined,
      };
      const res = await fetch(
        `${BASE_API_URL}/data-inputs/update-department/${itemId}`,
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
        setDepartments(data);
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
        `${BASE_API_URL}/data-inputs/delete-department/${itemId}`,
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
        toast.success(`${selectedDepartment?.name} deleted successfully`);
        setDepartments(data);
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [itemId, setItemId] = useState(0);
  const selectedDepartment = departments.find((d) => d.id === itemId);

  useEffect(() => {
    if (selectedDepartment) {
      setEditedName(selectedDepartment.name);
      setEditedInstitutionId(selectedDepartment.institutionId);
    }
  }, [selectedDepartment]);

  const handleClose = () => {
    setShowModal(false);
    setName("");
    setInstitutionId(null);
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
    setEditedInstitutionId(null);
  };

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FaSort size={12} className="ms-1 text-muted opacity-50" />;
    }
    return sortConfig.direction === "ascending" ? (
      <FaSortUp size={12} className="ms-1" />
    ) : (
      <FaSortDown size={12} className="ms-1" />
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredDepartments = departments
    .filter((department) => {
      return department.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      // Handle nested properties (_count.users, etc.)
      const getValue = (obj: any, path: string) => {
        return path.split(".").reduce((acc, part) => {
          return acc && acc[part] !== undefined ? acc[part] : null;
        }, obj);
      };

      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);

      // Handle undefined/null cases
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === "ascending" ? -1 : 1;
      if (bValue === null) return sortConfig.direction === "ascending" ? 1 : -1;

      // Handle different types
      if (typeof aValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "ascending" ? comparison : -comparison;
      }

      if (typeof aValue === "number") {
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle dates
      if (
        aValue instanceof Date ||
        (typeof aValue === "string" && !isNaN(Date.parse(aValue)))
      ) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.direction === "ascending"
          ? dateA - dateB
          : dateB - dateA;
      }

      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleExportData = async () => {
    try {
      const data = departments.map((dept) => ({
        "Department Name": dept.name,
        "Users Count": dept._count.users,
        "Expenses Count": dept._count.Expense,
        "Budgets Count": dept._count.budgets,
        "Created At": new Date(dept.createdAt).toLocaleString(),
        "Updated At": new Date(dept.updatedAt).toLocaleString(),
      }));

      const filename = `departments_${new Date()
        .toISOString()
        .split("T")[0]}`;
      exportService.downloadCSV(data, filename);
      toast.success("Successfully exported to CSV");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export: ${error}`);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="departments-container px-4 py-4">
        {/* Header Section - Matching Currencies Style */}
        <Row className="mb-4">
          <Col>
            <Card className="page-header-card shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="page-title mb-1">
                      <Building className="me-2 text-primary" />
                      Department Management
                    </h4>
                    <p className="page-subtitle text-muted mb-0">
                      Manage company departments and organizational structure
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleShow}
                    className="btn-action"
                  >
                    <PlusCircle className="me-1" /> Add Department
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search Section - Matching Currencies Style */}
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
                    placeholder="Search departments..."
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
                      Found{" "}
                      {filteredDepartments.length}{" "}
                      {filteredDepartments.length === 1 ? 'result' : 'results'}
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
              disabled={departments.length === 0}
            >
              <FaFileExport className="me-1" /> Export CSV
            </Button>
          </Col>
        </Row>

        {/* Table Section - Matching Currencies Style */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 table-modern">
                  <thead className="bg-light border-0">
                    <tr>
                      <th className="border-0 text-muted fw-semibold small">#</th>
                      <th
                        className="border-0 text-muted fw-semibold small sortable-header"
                        onClick={() => requestSort("name")}
                        style={{ cursor: "pointer" }}
                      >
                        Department Name {getSortIcon("name")}
                      </th>
                      <th
                        className="border-0 text-muted fw-semibold small sortable-header"
                        onClick={() => requestSort("createdAt")}
                        style={{ cursor: "pointer" }}
                      >
                        Created {getSortIcon("createdAt")}
                      </th>
                      <th
                        className="border-0 text-muted fw-semibold small sortable-header"
                        onClick={() => requestSort("updatedAt")}
                        style={{ cursor: "pointer" }}
                      >
                        Updated {getSortIcon("updatedAt")}
                      </th>
                      <th
                        className="border-0 text-muted fw-semibold small text-center sortable-header"
                        onClick={() => requestSort("_count.users")}
                        style={{ cursor: "pointer" }}
                      >
                        Users {getSortIcon("_count.users")}
                      </th>
                      <th
                        className="border-0 text-muted fw-semibold small text-center sortable-header"
                        onClick={() => requestSort("_count.Expense")}
                        style={{ cursor: "pointer" }}
                      >
                        Expenses {getSortIcon("_count.Expense")}
                      </th>
                      <th
                        className="border-0 text-muted fw-semibold small text-center sortable-header"
                        onClick={() => requestSort("_count.budgets")}
                        style={{ cursor: "pointer" }}
                      >
                        Budgets {getSortIcon("_count.budgets")}
                      </th>
                      <th className="border-0 text-muted fw-semibold small text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((dept, idx) => (
                        <tr key={dept.id} className="border-bottom">
                          <td className="py-3 px-4">
                            <span className="fw-semibold text-success">
                              {indexOfFirstItem + idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="fw-semibold text-dark">{dept.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <DateTimeDisplay date={dept.createdAt} />
                          </td>
                          <td className="py-3 px-4">
                            <DateTimeDisplay date={dept.updatedAt} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge bg="primary" className="px-3 py-1 rounded-pill">
                              {dept._count?.users || 0}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge bg="info" className="px-3 py-1 rounded-pill">
                              {dept._count?.Expense || 0}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge bg="warning" text="dark" className="px-3 py-1 rounded-pill">
                              {dept._count?.budgets || 0}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Edit Department</Tooltip>}
                              >
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleEdit(dept.id)}
                                  className="btn-icon btn-edit"
                                >
                                  <PencilSquare size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Delete Department</Tooltip>}
                              >
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleDelete(dept.id)}
                                  className="btn-icon btn-delete"
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
                        <td colSpan={8} className="text-center py-5">
                          <div className="text-muted">
                            <Building size={48} className="mb-3 opacity-50" />
                            <p className="mb-0 fw-semibold">No departments found</p>
                            {searchTerm && <small>Try adjusting your search criteria</small>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
              {filteredDepartments.length > 0 && (
                <div className="d-flex justify-content-between align-items-center p-4 border-top bg-light">
                  <div className="text-muted small">
                    Showing{" "}
                    <span className="fw-bold text-dark">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="fw-bold text-dark">
                      {Math.min(indexOfLastItem, filteredDepartments.length)}
                    </span>{" "}
                    of{" "}
                    <span className="fw-bold text-dark">{filteredDepartments.length}</span> entries
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
            </Card>
          </Col>
        </Row>

        {/* Create Modal */}
        <Modal show={showModal} onHide={handleClose} size="xl">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6">
              <PlusCircle className="me-2 text-success" />
              Create Department
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form onSubmit={handleCreate}>
              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <Building className="me-2 text-primary" />
                    Department Name
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
                    Enter the department name
                  </Form.Text>
                </Form.Group>
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
                      <PlusCircle className="me-1" /> Create Department
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
              Edit Department
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form onSubmit={handleEditData}>
              <div className="form-card mb-3">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <Building className="me-2 text-primary" />
                    Department Name
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
                    Update the department name
                  </Form.Text>
                </Form.Group>
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
                      <PencilSquare className="me-1" /> Update Department
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
              Delete Department
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <div className="text-center">
              <div className="delete-icon-wrapper">
                <Trash size={48} className="text-danger opacity-75" />
              </div>
              <h5 className="mb-3">Delete Department</h5>
              <p className="text-muted mb-2">
                Are you sure you want to delete <br />
                <strong className="text-dark">{selectedDepartment?.name}</strong>
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
                        <Trash className="me-1" /> Delete Department
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </div>
          </Modal.Body>
        </Modal>

        <style jsx global>{`
          /* Matching Currencies Page Styles */
          .departments-container {
            background-color: #f8fafc;
            min-height: calc(100vh - 56px);
          }

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
            background: linear-gradient(45deg, #0d6efd, #0dcaf0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
          }

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

          .table-modern tbody tr {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
            transition: all 0.2s ease;
          }

          .table-modern tbody tr:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
          }

          .btn-action {
            font-size: 0.875rem;
            font-weight: 600;
            padding: 0.6rem 1.2rem;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

          .sortable-header {
            cursor: pointer;
            user-select: none;
            transition: color 0.2s ease;
            position: relative;
          }

          .sortable-header:hover {
            color: #0d6efd !important;
          }

          .sortable-header svg {
            vertical-align: -2px;
          }
        `}</style>
      </Container>
    </AuthProvider>
  );
}
