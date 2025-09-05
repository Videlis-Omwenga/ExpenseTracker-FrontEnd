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
      <Container fluid className="py-4 small">
        <Alert
          variant="info"
          className="d-flex justify-content-between align-items-center py-3"
        >
          <div>
            <h5 className="mb-0 d-flex align-items-center">
              <InfoCircle className="me-2" size={20} />
              Department Management
            </h5>
            <small className="opacity-75">
              Manage departments and their associations
            </small>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleShow()}>
            <PlusCircle className="me-1" /> Add Department
          </Button>
        </Alert>

        <Card className="shadow-sm rounded-3">
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <Search />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </InputGroup>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <SortAlphaDown className="me-1" /> Sort
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
              </Col>
            </Row>

            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#ID</th>
                    <th>Name</th>
                    <th>Created Date</th>
                    <th>Updated Date</th>
                    <th>Users</th>
                    <th>Expenses</th>
                    <th>Budgets</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((dept) => (
                      <tr key={dept.id}>
                        <td>{dept.id}</td>
                        <td>{dept.name}</td>
                        <td>
                          <DateTimeDisplay date={dept.createdAt} />
                        </td>
                        <td>
                          <DateTimeDisplay date={dept.updatedAt} />
                        </td>
                        <td className="text-center">
                          <Badge bg="primary">{dept._count?.users || 0}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="info">{dept._count?.Expense || 0}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="warning" text="dark">
                            {dept._count?.budgets || 0}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Edit</Tooltip>}
                            >
                              <Button
                                size="sm"
                                className="rounded-circle shadow-lg border-0"
                                variant="outline-primary"
                                onClick={() => handleEdit(dept.id)}
                              >
                                <PencilSquare size={16} />
                              </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Delete</Tooltip>}
                            >
                              <Button
                                size="sm"
                                className="rounded-circle shadow-lg border-0"
                                variant="outline-danger"
                                onClick={() => handleDelete(dept.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        No departments found.{" "}
                        {searchTerm && "Try adjusting your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {filteredDepartments.length > 0 && (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                  {filteredDepartments.length} entries
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
        <Modal show={showModal} onHide={handleClose} size="lg">
          <Modal.Header closeButton className="bg-secondary bg-opacity-10">
            <h5 className="modal-title fw-bold">Create New Department</h5>
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
        <Modal show={editModal} onHide={handleEditClose} size="lg">
          <Modal.Header closeButton className="bg-secondary bg-opacity-10">
            <h5 className="modal-title fw-bold">
              Edit {selectedDepartment?.name}
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
        <Modal show={deleteModal} onHide={handleDeleteClose}>
          <div className="modal-header text-danger">
            <h5 className="modal-title fw-bold">Confirm Delete</h5>
          </div>
          <Modal.Body>
            <Form onSubmit={handleDeleteConfirm}>
              <div className="mb-3 rounded-3 p-3 border">
                Are you sure you want to delete "{selectedDepartment?.name}
                "? This action cannot be undone. Proceed with caution.
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
