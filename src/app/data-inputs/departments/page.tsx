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
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "ascending",
  });
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

  const handleSort = (key: string) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
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
      if (!sortConfig.key || !(sortConfig.key in a) || !(sortConfig.key in b)) {
        return 0;
      }

      const aValue = a[sortConfig.key as keyof Department];
      const bValue = b[sortConfig.key as keyof Department];

      // Handle undefined/null cases
      if (aValue === undefined || aValue === null) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (bValue === undefined || bValue === null) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }

      // Convert to string for consistent comparison if values are of different types
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (aString < bString) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aString > bString) {
        return sortConfig.direction === "ascending" ? 1 : -1;
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

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <SortAlphaDown />
    ) : (
      <SortAlphaUp />
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <AuthProvider>
      <TopNavbar />
      <Container fluid className="py-4">
        {/* Modern Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                  <Building className="text-success" size={24} />
                </div>
                <div>
                  <h2 className="fw-bold text-dark mb-0">
                    Department Management
                  </h2>
                  <p className="text-muted mb-0 small">
                    Manage departments and their associations
                  </p>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-2 border-success opacity-25 mb-4" />
        </div>

        {/* Search and Actions Card */}
        <Card className="shadow-lg border-0 mb-4 modern-search-card">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div className="search-container">
                <InputGroup style={{ width: "350px" }} className="modern-search-group">
                  <InputGroup.Text className="bg-white border-end-0">
                    <Search className="text-success" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search departments by name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="border-start-0 ps-0"
                  />
                </InputGroup>
              </div>
              <Button
                variant="success"
                onClick={() => handleShow()}
                className="px-4 py-2 fw-semibold"
              >
                <PlusCircle size={16} className="me-2" />
                Add Department
              </Button>
            </div>

            {/* Filters Row */}
            <div className="bg-light rounded-4 p-3 border-0">
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                    <Filter className="text-success" size={14} />
                  </div>
                  <span className="text-dark fw-bold small text-uppercase">Filters</span>
                </div>

                <Dropdown>
                  <Dropdown.Toggle variant="outline-success" size="sm">
                    <SortAlphaDown className="me-1" size={14} /> Sort By
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleSort("name")}>
                      Name {getSortIcon("name")}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleSort("createdAt")}>
                      Created Date {getSortIcon("createdAt")}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleSort("updatedAt")}>
                      Updated Date {getSortIcon("updatedAt")}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <div className="d-flex align-items-center gap-2 ms-auto">
                  <Badge bg="info" className="px-3 py-2 rounded-pill fw-semibold">
                    📊 {filteredDepartments.length} departments
                  </Badge>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Table Card */}
        <Card className="shadow-lg border-0 modern-table-card">
          <Card.Body className="p-0">

            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light border-0">
                  <tr>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">#</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Department Name</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Created</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small">Updated</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">Users</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">Expenses</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">Budgets</th>
                    <th className="border-0 py-3 px-4 fw-semibold text-muted text-uppercase small text-center">Actions</th>
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
                                size="sm"
                                variant="outline-warning"
                                className="rounded-pill px-3 py-1 fw-medium"
                                onClick={() => handleEdit(dept.id)}
                              >
                                <PencilSquare size={14} />
                              </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Delete Department</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-danger"
                                className="rounded-pill px-3 py-1 fw-medium"
                                onClick={() => handleDelete(dept.id)}
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
            </div>

            {filteredDepartments.length > 0 && (
              <div className="d-flex justify-content-between align-items-center p-4 border-top bg-light">
                <div className="text-muted small">
                  Showing <span className="fw-bold text-dark">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="fw-bold text-dark">{Math.min(indexOfLastItem, filteredDepartments.length)}</span> of{" "}
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
          </Card.Body>
        </Card>

        {/* Create Modal */}
        <Modal show={showModal} onHide={handleClose} size="xl">
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-success me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <PlusCircle size={24} className="text-white" />
              </div>
              <div>
                Create New Department
                <div className="text-muted fw-normal small">
                  Add a new department
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Form onSubmit={handleCreate}>
            <Modal.Body>
              <div className="mb-3 border rounded-3 p-3">
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label className="form-label fw-bold">
                        Department name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        Department name is required.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={submitting}
                onClick={handleClose}
              >
                Cancel creation
              </Button>
              <Button
                size="sm"
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                Create department
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal show={editModal} onHide={handleEditClose} size="xl">
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-success me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <PencilSquare size={24} className="text-white" />
              </div>
              <div>
                Edit {selectedDepartment?.name}
                <div className="text-muted fw-normal small">
                  Update department information
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Form onSubmit={handleEditData}>
            <Modal.Body>
              <div className="mb-3 border rounded-3 p-3">
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label className="form-label fw-bold">
                        Department name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        Department name is required.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={submitting}
                onClick={handleEditClose}
              >
                Close update
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
              >
                Update {selectedDepartment?.name}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={deleteModal} onHide={handleDeleteClose} size="xl">
          <Modal.Header
            closeButton
            className="border-0 pb-0 pt-4 px-4"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <h5 className="fw-bold text-dark fs-5 d-flex align-items-center">
              <div
                className="icon-wrapper bg-danger me-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px" }}
              >
                <Trash size={24} className="text-white" />
              </div>
              <div>
                Delete Department
                <div className="text-muted fw-normal small">
                  This action cannot be undone
                </div>
              </div>
            </h5>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleDeleteConfirm}>
              <div className="mb-3 rounded-3 p-3 border">
                Are you sure you want to delete &quot;{selectedDepartment?.name}
                &quot;? This action cannot be undone. Proceed with caution.
                <Form.Label className="form-label fw-bold mt-5">
                  Reason for deletion *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  name="name"
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Reason for deletion is required.
                </Form.Text>
              </div>

              <Modal.Footer>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={submitting}
                  onClick={handleDeleteClose}
                >
                  Cancel deleting
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={submitting}
                  type="submit"
                >
                  Delete {selectedDepartment?.name}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </AuthProvider>
  );
}
