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
  CheckCircle,
  XCircle,
  Search,
  Filter,
  SortAlphaDown,
  SortAlphaUp,
  InfoCircle,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import PageLoader from "@/app/components/PageLoader";
import DateTimeDisplay from "@/app/components/DateTimeDisplay";

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
  const [sortConfig, setSortConfig] = useState({
    key: "",
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
              Category Management
            </h5>
            <small className="opacity-75">
              Manage expense categories and their properties
            </small>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleShow()}>
            <PlusCircle className="me-1" /> Add Category
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
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </InputGroup>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Dropdown className="me-2">
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    <Filter className="me-1" />
                    {activeFilter === "all"
                      ? "All Status"
                      : activeFilter === "active"
                      ? "Active"
                      : "Deleted"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setActiveFilter("all")}>
                      All Status
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setActiveFilter("active")}>
                      Active
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setActiveFilter("deleted")}>
                      Deleted
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
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
                    <th>#I</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Advances</th>
                    <th>Accounting</th>
                    <th>Any User</th>
                    <th>Budget Exempted</th>
                    <th>Created Date</th>
                    <th>Updated Date</th>
                    <th>Expenditures</th>
                    <th>Budgets</th>
                    <th>Advances</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((cat) => (
                      <tr
                        key={cat.id}
                        className={!cat.isActive ? "text-muted" : ""}
                      >
                        <td>{cat.id}</td>
                        <td>
                          <div className="d-flex flex-column">
                            <span>{cat.name}</span>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>{cat.description}</Tooltip>}
                            >
                              <span
                                className="text-truncate text-muted small"
                                style={{ maxWidth: "200px", cursor: "pointer" }}
                              >
                                {cat.description}
                              </span>
                            </OverlayTrigger>
                          </div>
                        </td>
                        <td>
                          {cat.isActive ? (
                            <Badge
                              bg="success"
                              className="d-flex align-items-center justify-content-center"
                            >
                              <CheckCircle className="me-1" /> Active
                            </Badge>
                          ) : (
                            <Badge
                              bg="danger"
                              className="d-flex align-items-center justify-content-center"
                            >
                              <XCircle className="me-1" /> Deleted
                            </Badge>
                          )}
                        </td>
                        <td className="text-center">
                          {cat.canBeUsedForAdvance ? (
                            <CheckCircle className="text-success" />
                          ) : (
                            <XCircle className="text-danger" />
                          )}
                        </td>
                        <td className="text-center">
                          {cat.canBeUsedForAccounting ? (
                            <CheckCircle className="text-success" />
                          ) : (
                            <XCircle className="text-danger" />
                          )}
                        </td>
                        <td className="text-center">
                          {cat.canBeUsedByAnyUser ? (
                            <CheckCircle className="text-success" />
                          ) : (
                            <XCircle className="text-danger" />
                          )}
                        </td>
                        <td className="text-center">
                          {cat.exemptedFromBudgetChecks ? (
                            <CheckCircle className="text-success" />
                          ) : (
                            <XCircle className="text-danger" />
                          )}
                        </td>
                        <td>
                          <DateTimeDisplay date={cat.createdAt} />
                        </td>
                        <td>
                          <DateTimeDisplay date={cat.updatedAt} />
                        </td>
                        <td className="text-center">
                          <Badge bg="info">{cat._count?.Expense || 0}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="primary">{cat._count?.budgets || 0}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="warning" text="dark">
                            {cat._count?.advances || 0}
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
                                onClick={() => handleEdit(cat.id)}
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
                                onClick={() => handleDelete(cat.id)}
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
                      <td colSpan={10} className="text-center py-4">
                        No categories found.{" "}
                        {searchTerm && "Try adjusting your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {filteredCategories.length > 0 && (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, filteredCategories.length)} of{" "}
                  {filteredCategories.length} entries
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
          <Modal.Header closeButton className="bg-secondary bg-opacity-10">
            <h5 className="modal-title fw-bold">Create New Category</h5>
          </Modal.Header>
          <Form onSubmit={handleCreate}>
            <Modal.Body>
              <div className="mb-3 border rounded-3 p-3">
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label className="form-label fw-bold">
                        Category name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        Category name is required.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group controlId="description" className="mb-3">
                      <Form.Label className="form-label fw-bold">
                        Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Description of the category.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <br />
                <h6 className="mb-3 fw-bold">Usage permissions</h6>
                <Row>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAdvance"
                      name="canBeUsedForAdvance"
                      label="Usable for advance"
                      checked={canBeUsedForAdvance}
                      onChange={(e) => setCanBeUsedForAdvance(e.target.checked)}
                      className="mb-3"
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAccounting"
                      name="canBeUsedForAccounting"
                      label="Usable for accounting"
                      checked={canBeUsedForAccounting}
                      onChange={(e) =>
                        setCanBeUsedForAccounting(e.target.checked)
                      }
                      className="mb-3"
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="canBeUsedByAnyUser"
                      name="canBeUsedByAnyUser"
                      label="Usable by any user"
                      checked={canBeUsedByAnyUser}
                      onChange={(e) => setCanBeUsedByAnyUser(e.target.checked)}
                      className="mb-3"
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="exemptedFromBudgetChecks"
                      name="exemptedFromBudgetChecks"
                      label="Exempted from budget checks"
                      checked={exemptedFromBudgetChecks}
                      onChange={(e) =>
                        setExemptedFromBudgetChecks(e.target.checked)
                      }
                      className="mb-3"
                    />
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
                Create category
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal show={editModal} onHide={handleEditClose} size="xl">
          <Modal.Header closeButton className="bg-secondary bg-opacity-10">
            <h5 className="modal-title fw-bold">
              Edit {selectedCategory?.name}
            </h5>
          </Modal.Header>
          <Form onSubmit={handleEditData}>
            <Modal.Body>
              <div className="mb-3 border rounded-3 p-3">
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label className="form-label fw-bold">
                        Category name *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        Category name is required.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group controlId="description" className="mb-3">
                      <Form.Label className="form-label fw-bold">
                        Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        required
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Description of the category.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <br />

                <h6 className="mb-3 fw-bold">Usage permissions</h6>
                <Row>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAdvance"
                      name="canBeUsedForAdvance"
                      label="Usable for advance"
                      checked={editedCanBeUsedForAdvance}
                      onChange={(e) =>
                        setEditedCanBeUsedForAdvance(e.target.checked)
                      }
                      className="mb-3"
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="canBeUsedForAccounting"
                      name="canBeUsedForAccounting"
                      label="Usable for accounting"
                      checked={editedCanBeUsedForAccounting}
                      onChange={(e) =>
                        setEditedCanBeUsedForAccounting(e.target.checked)
                      }
                      className="mb-3"
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="canBeUsedByAnyUser"
                      name="canBeUsedByAnyUser"
                      label="Usable by any user"
                      checked={editedCanBeUsedByAnyUser}
                      onChange={(e) =>
                        setEditedCanBeUsedByAnyUser(e.target.checked)
                      }
                      className="mb-3"
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      id="exemptedFromBudgetChecks"
                      name="exemptedFromBudgetChecks"
                      label="Exempted from budget checks"
                      checked={editedExemptedFromBudgetChecks}
                      onChange={(e) =>
                        setEditedExemptedFromBudgetChecks(e.target.checked)
                      }
                      className="mb-3"
                    />
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
                Update {selectedCategory?.name}
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
                Are you sure you want to delete "{selectedCategory?.name}
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
                  Delete {selectedCategory?.name}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </AuthProvider>
  );
}
