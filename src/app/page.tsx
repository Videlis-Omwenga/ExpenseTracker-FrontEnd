"use client";

import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Alert,
} from "react-bootstrap";
import {
  Eye,
  EyeSlash,
  Envelope,
  Lock,
  Building,
  Bank,
  ArrowRight,
  ShieldLock,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "./static/apiConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const payload = {
      email,
      password,
    };

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const { statusCode, message } = data;

      if (response.ok) {
        const { access_token } = data.token;
        localStorage.setItem("expenseTrackerToken", access_token);
        window.location.href = "/create-expense";
      } else {
        toast.error(`${statusCode} - ${message}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred" + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Container fluid>
        <Row className="g-0 min-vh-100">
          {/* Left Hero Section */}
          <Col
            md={6}
            className="d-none d-md-flex align-items-center justify-content-center hero-section"
          >
            <div className="text-center text-muted px-5">
              <Bank size={70} className="mb-4" />
              <h1 className="fw-bold display-4 mb-3">ExpenseTracker</h1>
              <p className="lead opacity-75 mb-5">
                Simplify your expense management with security and speed.
              </p>
              <div className="text-start mx-auto" style={{ maxWidth: "320px" }}>
                <div className="d-flex align-items-center mb-3">
                  <ShieldLock className="me-3" size={22} /> Bank-grade security
                </div>
                <div className="d-flex align-items-center mb-3">
                  <Building className="me-3" size={22} /> Multi-institution
                  support
                </div>
                <div className="d-flex align-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="me-3"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Real-time expense tracking
                </div>
              </div>
            </div>
          </Col>

          {/* Right Login Form */}
          <Col
            md={6}
            lg={5}
            xl={4}
            className="d-flex align-items-center justify-content-center bg-light"
          >
            <div className="w-100 px-4 py-5">
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4 p-md-5">
                  <div className="text-center mb-4">
                    <h3 className="fw-bold">Welcome Back</h3>
                    <p className="text-muted">Sign in to continue</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="py-2 text-center">
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Email */}
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <Envelope size={18} />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </InputGroup>
                    </Form.Group>

                    {/* Password */}
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <Lock size={18} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                        >
                          {showPassword ? (
                            <EyeSlash size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    {/* Submit */}
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-3 fw-bold rounded-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Signing in..."
                      ) : (
                        <>
                          Sign In <ArrowRight size={18} className="ms-2" />
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              <div className="text-center mt-4 small text-muted">
                © {new Date().getFullYear()} FinanceHub •{" "}
                <a href="#" className="text-muted">
                  Privacy
                </a>{" "}
                •{" "}
                <a href="#" className="text-muted">
                  Terms
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .login-wrapper {
          background: #f8fafc;
        }
        .hero-section {
          background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
          color: #fff;
          min-height: 100vh;
          padding: 4rem 2rem;
        }
        .hero-section h1 {
          letter-spacing: -0.5px;
        }
        .form-control,
        .form-select {
          border-radius: 8px;
          padding: 0.75rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: none;
          transition: all 0.2s ease-in-out;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.3);
        }
        .card {
          animation: fadeIn 0.8s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
