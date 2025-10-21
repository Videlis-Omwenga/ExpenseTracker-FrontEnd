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
  Spinner,
} from "react-bootstrap";
import {
  Eye,
  EyeSlash,
  Envelope,
  Lock,
  Bank,
  ArrowRight,
  ShieldLock,
  CloudCheck,
  CurrencyExchange,
  FileEarmarkText,
  Plug,
  Wallet2,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { BASE_API_URL } from "./static/apiConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const payload = {
      email,
      password,
      keepLoggedIn,
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
        const { access_token, refresh_token } = data.token;

        // Store both tokens in localStorage
        localStorage.setItem("expenseTrackerToken", access_token);
        localStorage.setItem("expenseTrackerRefreshToken", refresh_token);
        localStorage.setItem("tokenExpiry", new Date(Date.now() + (keepLoggedIn ? 8 * 60 * 60 * 1000 : 60 * 60 * 1000)).toISOString());

        toast.success(keepLoggedIn ? "Logged in for 8 hours" : "Logged in for 1 hour");
        window.location.href = "/dashboard";
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
      <Container className="g-0">
        <Row className="g-0 min-vh-100">
          {/* Left Hero Section - Enhanced with gradient and better spacing */}
          <Col
            md={7}
            className="d-none d-md-flex align-items-center justify-content-center hero-section"
            style={{
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="text-center text-muted px-5">
              <div className="features-container bg-white bg-opacity-10 rounded-4 p-4 p-lg-5 mx-auto backdrop-blur">
                <div className="mb-1 bg-primary p-3 rounded-3 bg-opacity-10 mb-5">
                  <div className="d-flex align-items-center justify-content-center mb-4">
                    <div className="app-logo me-3">
                      <Bank size={22} />
                    </div>
                    <h3 className="fw-bold mb-0 text-dark">ExpenseTracker</h3>
                  </div>
                  <p className="opacity-90 mb-5 px-5">
                    Take control of your finances with our secure and intuitive
                    expense management platform.{" "}
                    <span className="fw-bold text-dark">
                      Why ExpenseTracker?
                    </span>
                  </p>
                </div>
                <div className="text-start">
                  <div className="row g-3">
                    {/* 1. Control expenses */}
                    <div className="col-6">
                      <div className="d-flex align-items-start h-100 p-3 bg-white bg-opacity-5 rounded-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: 50, height: 30 }}
                        >
                          <ShieldLock size={14} />
                        </div>
                        <div>
                          <div className="fw-medium">Control your expenses</div>
                          <small className="opacity-75">
                            Through defined approval levels for spending
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* 2. Budget process */}
                    <div className="col-6">
                      <div className="d-flex align-items-start h-100 p-3 bg-white bg-opacity-5 rounded-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: 50, height: 30 }}
                        >
                          <Wallet2 size={14} />
                        </div>
                        <div>
                          <div className="fw-medium">Budget process</div>
                          <small className="opacity-75">
                            Helps in controlling expenditure levels effectively
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* 3. Cost saving */}
                    <div className="col-6">
                      <div className="d-flex align-items-start h-100 p-3 bg-white bg-opacity-5 rounded-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: 50, height: 30 }}
                        >
                          <FileEarmarkText size={14} />
                        </div>
                        <div>
                          <div className="fw-medium">Cost saving</div>
                          <small className="opacity-75">
                            Avoid manual files and paperwork in the office
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* 4. Accessible anywhere */}
                    <div className="col-6">
                      <div className="d-flex align-items-start h-100 p-3 bg-white bg-opacity-5 rounded-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: 50, height: 30 }}
                        >
                          <CloudCheck size={14} />
                        </div>
                        <div>
                          <div className="fw-medium">Accessible anywhere</div>
                          <small className="opacity-75">
                            Users can log in and manage finances from any
                            location
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* 5. Multi-currency */}
                    <div className="col-6">
                      <div className="d-flex align-items-start h-100 p-3 bg-white bg-opacity-5 rounded-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: 50, height: 30 }}
                        >
                          <CurrencyExchange size={14} />
                        </div>
                        <div>
                          <div className="fw-medium">
                            Multi-currency support
                          </div>
                          <small className="opacity-75">
                            Manage accounts across different currencies
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* 6. System integration */}
                    <div className="col-6">
                      <div className="d-flex align-items-start h-100 p-3 bg-white bg-opacity-5 rounded-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: 50, height: 30 }}
                        >
                          <Plug size={14} />
                        </div>
                        <div>
                          <div className="fw-medium">System integration</div>
                          <small className="opacity-75">
                            Can be seamlessly integrated with other systems
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Right Login Form - Enhanced with better spacing and modern design */}
          <Col
            md={5}
            className="d-flex align-items-center justify-content-center form-section"
          >
            <div className="w-100 px-4 py-5" style={{ maxWidth: "600px" }}>
              <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="card-header-bg"></div>
                <Card.Body className="p-4 p-md-5">
                  {error && (
                    <Alert
                      variant="danger"
                      className="py-2 text-center mb-4 rounded-3"
                    >
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Email */}
                    <Form.Group className="mb-4">
                      <Form.Label className="text-dark mb-2">
                        Email Address
                      </Form.Label>
                      <InputGroup className="input-group-sm">
                        <InputGroup.Text className="bg-light border-end-0">
                          <Envelope size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="border-start-0 bg-light py-3"
                        />
                      </InputGroup>
                    </Form.Group>

                    {/* Password */}
                    <Form.Group className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="text-dark mb-0">
                          Password
                        </Form.Label>
                        <a
                          href="#"
                          className="text-decoration-none text-primary small"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <InputGroup className="input-group-sm">
                        <InputGroup.Text className="bg-light border-end-0">
                          <Lock size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="border-start-0 bg-light py-3"
                        />
                        <Button
                          variant="light border"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                          className="border-start-0"
                        >
                          {showPassword ? (
                            <EyeSlash size={18} className="text-primary" />
                          ) : (
                            <Eye size={18} className="text-primary" />
                          )}
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    {/* Keep me logged in checkbox */}
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="checkbox"
                        id="keep-logged-in"
                        checked={keepLoggedIn}
                        onChange={(e) => setKeepLoggedIn(e.target.checked)}
                        label={
                          <span className="text-dark">
                            Keep me logged in{" "}
                            <small className="text-muted">
                              ({keepLoggedIn ? "8 hours" : "1 hour"})
                            </small>
                          </span>
                        }
                        className="user-select-none"
                      />
                    </Form.Group>

                    {/* Submit */}
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-3 fw-bold rounded-3 border-0 shadow-sm"
                      disabled={isLoading}
                      size="sm"
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In <ArrowRight size={18} className="ms-2" />
                        </>
                      )}
                    </Button>
                  </Form>

                  {/* Divider */}
                  <div className="d-flex align-items-center my-4">
                    <div className="border-top flex-grow--1"></div>
                    <span className="px-3 small text-muted">or</span>
                    <div className="border-top flex-grow-1"></div>
                  </div>

                  {/* Social login options */}
                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-secondary"
                      className="py-2 rounded-3"
                    >
                      <svg
                        className="me-2"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  Don&apos;t have an account? Contact your admin
                </p>
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
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: #fff;
          min-height: 100vh;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .hero-section::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 70%
          );
        }
        .app-logo {
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        .features-container {
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .form-section {
          background: #ffffff;
        }
        .card-header-bg {
          height: 6px;
          background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
        }
        .form-control:focus {
          box-shadow: 0 0 0 0.25rem rgba(79, 70, 229, 0.15);
          border-color: #4f46e5;
        }
        .btn-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border: none;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(79, 70, 229, 0.4);
        }
        .btn-check:focus + .btn-primary,
        .btn-primary:focus {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          box-shadow: 0 0 0 0.25rem rgba(79, 70, 229, 0.25);
        }
        .input-group-text,
        .form-control {
          border-color: #e2e8f0;
        }
        .input-group-text {
          background: #f8fafc;
        }
        .testimonial {
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
