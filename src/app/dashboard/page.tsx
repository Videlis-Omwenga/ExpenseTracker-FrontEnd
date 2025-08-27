"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Table, Button } from 'react-bootstrap';
import { FileText, Clock, CheckCircle, XCircle, ArrowClockwise } from 'react-bootstrap-icons';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { DollarSign, RefreshCw } from 'lucide-react';

type Expense = {
  id: number;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  date: string;
  category: string;
};

const DashboardPage = () => {
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          const userData = { name: 'John' };
          setUserName(userData.name);
          
          const mockExpenses: Expense[] = [
            { id: 1, description: 'Office Supplies', amount: 245.67, status: 'APPROVED', date: '2023-06-15T10:30:00Z', category: 'Office' },
            { id: 2, description: 'Team Lunch', amount: 189.50, status: 'PENDING', date: '2023-06-14T14:15:00Z', category: 'Food' },
            { id: 3, description: 'Flight to Conference', amount: 1200.00, status: 'APPROVED', date: '2023-06-10T08:45:00Z', category: 'Travel' },
            { id: 4, description: 'Software Subscription', amount: 99.99, status: 'REJECTED', date: '2023-06-05T16:20:00Z', category: 'Software' },
            { id: 5, description: 'Hotel Accommodation', amount: 450.00, status: 'PAID', date: '2023-06-01T19:30:00Z', category: 'Travel' }
          ];
          
          setRecentExpenses(mockExpenses);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge bg="success">Approved</Badge>;
      case 'PENDING': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'REJECTED': return <Badge bg="danger">Rejected</Badge>;
      case 'PAID': return <Badge bg="info">Paid</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalExpenses = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = recentExpenses.filter(exp => exp.status === 'PENDING').length;
  const approvedExpenses = recentExpenses.filter(exp => exp.status === 'APPROVED').length;
  const rejectedExpenses = recentExpenses.filter(exp => exp.status === 'REJECTED').length;

  const SummaryCard = ({ title, value, icon, variant = 'primary' }: { title: string; value: string | number; icon: React.ReactNode; variant?: string }) => (
    <Card className="h-100 shadow-sm border-0 rounded-3">
      <Card.Body className="d-flex align-items-center">
        <div className={`bg-${variant} bg-opacity-10 p-3 rounded-circle me-3`}>
          <div className={`text-${variant}`}>
            {icon}
          </div>
        </div>
        <div>
          <h4 className="mb-0">{value}</h4>
          <p className="text-muted mb-0">{title}</p>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <Container fluid className="py-4">
        {/* Welcome Section */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-1">Welcome back, {userName}!</h2>
                    <p className="text-muted mb-0">Here's what's happening with your expenses today.</p>
                  </div>
                  <Button variant="primary" className="d-flex align-items-center">
                    <FileText className="me-2" /> New Expense
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Summary Cards */}
        <Row className="g-4 mb-4">
          <Col md={6} lg={3}>
            <SummaryCard 
              title="Total Expenses" 
              value={formatCurrency(totalExpenses)}
              icon={<DollarSign size={24} />}
              variant="primary"
            />
          </Col>
          <Col md={6} lg={3}>
            <SummaryCard 
              title="Pending Approval" 
              value={pendingExpenses}
              icon={<Clock size={24} />}
              variant="warning"
            />
          </Col>
          <Col md={6} lg={3}>
            <SummaryCard 
              title="Approved" 
              value={approvedExpenses}
              icon={<CheckCircle size={24} />}
              variant="success"
            />
          </Col>
          <Col md={6} lg={3}>
            <SummaryCard 
              title="Rejected" 
              value={rejectedExpenses}
              icon={<XCircle size={24} />}
              variant="danger"
            />
          </Col>
        </Row>

        {/* Recent Expenses */}
        <Row>
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Expenses</h5>
                  <Button variant="light" size="sm" className="d-flex align-items-center">
                    <RefreshCw size={14} className="me-1" /> Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {isLoading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th className="text-end">Amount</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentExpenses.map((expense) => (
                          <tr key={expense.id} className="cursor-pointer">
                            <td>{expense.description}</td>
                            <td>
                              <Badge bg="light" text="dark" className="text-uppercase">
                                {expense.category}
                              </Badge>
                            </td>
                            <td>{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                            <td className="text-end fw-medium">{formatCurrency(expense.amount)}</td>
                            <td className="text-center">{getStatusBadge(expense.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DashboardPage;