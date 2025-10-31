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
  ExclamationTriangle,
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

  // Form UX enhancements
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [pwStrength, setPwStrength] = useState<{ score: number; label: string; color: string }>({
    score: 0,
    label: "",
    color: "#e5e7eb",
  });

  const validateEmail = (value: string) => {
    if (!value) return "Email is required";
    const re = /\S+@\S+\.\S+/;
    if (!re.test(value)) return "Enter a valid email address";
    return "";
  };

  // Note: No password complexity validation for login; only require non-empty

  const passwordStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*(),.?\":{}|<>_\-]/.test(value)) score++;
    const map: Record<number, { label: string; color: string }> = {
      0: { label: "", color: "#e5e7eb" },
      1: { label: "Weak", color: "#ef4444" },
      2: { label: "Fair", color: "#f59e0b" },
      3: { label: "Good", color: "#10b981" },
      4: { label: "Strong", color: "#0ea5e9" },
    };
    return { score, ...map[score] };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    // Field-level validation
    const emailMsg = validateEmail(email);
  const passwordMsg = password ? "" : "Password is required";
    setEmailTouched(true);
    setEmailError(emailMsg);
    setPasswordError(passwordMsg);
    if (emailMsg || passwordMsg) {
      // Show a single error block at the top instead of red inputs
      setError([emailMsg, passwordMsg].filter(Boolean).join(" • "));
      setIsLoading(false);
      return;
    }
    
    const payload = {
      email,
      password,
      keepLoggedIn,
    };

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
      <Container fluid className="g-0 p-0">
        <Row className="g-0 min-vh-100 align-items-stretch m-0">
          {/* Left Hero Section - Enhanced with gradient and better spacing */}
          <Col
            md={6}
            className="d-none d-md-flex align-items-center justify-content-end hero-section position-relative min-vh-100 p-0 pe-md-3 pe-lg-4"
          >
            <div className="hero-pattern"></div>
            <div className="hero-glow hero-glow-1"></div>
            <div className="hero-glow hero-glow-2"></div>
            
            <div className="text-center position-relative ps-3 ps-md-5 pe-2 pe-md-3" style={{ zIndex: 2, maxWidth: '780px' }}>
              <div className="features-container">
                {/* Brand Header */}
                <div className="brand-header animate-fade-in mb-2">
                  <h1 className="hero-title mb-3">
                    Expense<span className="text-gradient">Tracker</span>
                  </h1>
                  <p className="hero-subtitle mb-0 small">
                    Take control of your finances with our secure and intuitive
                    expense management platform
                  </p>
                </div>

                <div className="text-start">
                  <div className="row g-3">
                    {/* 1. Control expenses */}
                    <div className="col-6 animate-slide-in" style={{ animationDelay: '0.3s' }}>
                      <div className="feature-card">
                        <div className="feature-icon-wrapper">
                          <div className="feature-icon">
                            <ShieldLock size={20} />
                          </div>
                        </div>
                        <div className="feature-content">
                          <div className="feature-title">Control Expenses</div>
                          <div className="feature-description">
                            Defined approval levels for spending
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Budget process */}
                    <div className="col-6 animate-slide-in" style={{ animationDelay: '0.4s' }}>
                      <div className="feature-card">
                        <div className="feature-icon-wrapper">
                          <div className="feature-icon">
                            <Wallet2 size={20} />
                          </div>
                        </div>
                        <div className="feature-content">
                          <div className="feature-title">Budget Process</div>
                          <div className="feature-description">
                            Control expenditure levels effectively
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Cost saving */}
                    <div className="col-6 animate-slide-in" style={{ animationDelay: '0.5s' }}>
                      <div className="feature-card">
                        <div className="feature-icon-wrapper">
                          <div className="feature-icon">
                            <FileEarmarkText size={20} />
                          </div>
                        </div>
                        <div className="feature-content">
                          <div className="feature-title">Cost Saving</div>
                          <div className="feature-description">
                            Eliminate manual files and paperwork
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Accessible anywhere */}
                    <div className="col-6 animate-slide-in" style={{ animationDelay: '0.6s' }}>
                      <div className="feature-card">
                        <div className="feature-icon-wrapper">
                          <div className="feature-icon">
                            <CloudCheck size={20} />
                          </div>
                        </div>
                        <div className="feature-content">
                          <div className="feature-title">Anywhere Access</div>
                          <div className="feature-description">
                            Manage finances from any location
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Multi-currency */}
                    <div className="col-6 animate-slide-in" style={{ animationDelay: '0.7s' }}>
                      <div className="feature-card">
                        <div className="feature-icon-wrapper">
                          <div className="feature-icon">
                            <CurrencyExchange size={20} />
                          </div>
                        </div>
                        <div className="feature-content">
                          <div className="feature-title">Multi-Currency</div>
                          <div className="feature-description">
                            Support for multiple currencies
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. Seamless integration */}
                    <div className="col-6 animate-slide-in" style={{ animationDelay: '0.8s' }}>
                      <div className="feature-card">
                        <div className="feature-icon-wrapper">
                          <div className="feature-icon">
                            <Plug size={20} />
                          </div>
                        </div>
                        <div className="feature-content">
                          <div className="feature-title">Integration</div>
                          <div className="feature-description">
                            Seamless third-party connectivity
                          </div>
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
            md={6}
            className="d-flex align-items-center justify-content-start form-section position-relative min-vh-100 p-0 ps-md-3 ps-lg-4"
          >
            {/* Decorative geometric patterns */}
            <div className="geometric-pattern"></div>
            
            {/* Decorative accents for the auth side */}
            <span className="form-blob form-blob-1" />
            <span className="form-blob form-blob-2" />
            <span className="form-blob form-blob-3" />
            
            <div className="w-100 position-relative ps-2 ps-md-3 pe-3 pe-md-5 py-5" style={{ maxWidth: "580px", zIndex: 2 }}>
              <Card className="auth-card border-0 shadow-2xl rounded-4 overflow-hidden animate-slide-up" style={{ backdropFilter: 'blur(20px)' }}>
                <Card.Body className="p-4 p-md-5">
                  {/* Brand Header */}
                  <div className="text-center mb-5 animate-fade-in">
                    <h3 className="fw-bold mb-2" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontSize: '1.25rem' }}>Welcome Back</h3>
                    <p className="mb-0" style={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      Sign in to continue to <span className="fw-semibold" style={{ color: '#4f46e5' }}>ExpenseTracker</span>
                    </p>
                  </div>

                  {(error || emailError || passwordError) && (
                    <Alert variant="danger" className="py-2 px-3 text-start mb-4 rounded-3 border-0 d-flex align-items-center" style={{ background: '#fee2e2', color: '#991b1b' }}>
                      <ExclamationTriangle size={16} className="me-2 flex-shrink-0" />
                      <span className="small">{error ? error : [emailError, passwordError].filter(Boolean).join(" • ")}</span>
                    </Alert>
                  )}

                                    <Form onSubmit={handleSubmit}>
                    {/* Email */}
                    <Form.Group className="mb-4 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                      <Form.Label className="fw-semibold mb-2 d-flex align-items-center" style={{ fontSize: '0.875rem', color: '#334155' }}>
                        <Envelope size={14} className="me-2" style={{ color: '#64748b' }} />
                        Email Address
                      </Form.Label>
                      <div className="input-wrapper">
                        <Form.Control
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailTouched) setEmailError(validateEmail(e.target.value));
                            if (error) setError("");
                          }}
                          onBlur={() => {
                            setEmailTouched(true);
                            setEmailError(validateEmail(email));
                          }}
                          required
                          placeholder="name@company.com"
                          className="modern-input"
                          style={{ 
                            padding: '0.875rem 1rem',
                            fontSize: '0.9375rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            transition: 'all 0.3s ease'
                          }}
                          aria-describedby="email-help"
                        />
                      </div>
                    </Form.Group>

                    {/* Password */}
                    <Form.Group className="mb-4 animate-slide-in" style={{ animationDelay: '0.2s' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="fw-semibold mb-0 d-flex align-items-center" style={{ fontSize: '0.875rem', color: '#334155' }}>
                          <Lock size={14} className="me-2" style={{ color: '#64748b' }} />
                          Password
                        </Form.Label>
                        <a
                          href="#"
                          className="text-decoration-none small fw-medium"
                          style={{ color: '#4f46e5', fontSize: '0.8125rem' }}
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="input-wrapper position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            const s = passwordStrength(e.target.value);
                            setPwStrength(s);
                            if (error) setError("");
                          }}
                          onKeyUp={(e) => {
                            // @ts-ignore
                            const on = e.getModifierState && e.getModifierState('CapsLock');
                            setCapsLockOn(!!on);
                          }}
                          required
                          placeholder="Enter your password"
                          className="modern-input"
                          style={{ 
                            padding: '0.875rem 3rem 0.875rem 1rem',
                            fontSize: '0.9375rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            transition: 'all 0.3s ease'
                          }}
                          aria-describedby="password-help"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-btn"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeSlash size={18} style={{ color: '#4f46e5' }} />
                          ) : (
                            <Eye size={18} style={{ color: '#94a3b8' }} />
                          )}
                        </button>
                      </div>
                      {capsLockOn && (
                        <div className="mt-2 d-flex align-items-center small animate-fade-in" style={{ color: '#d97706' }}>
                          <ExclamationTriangle size={14} className="me-1" />
                          Caps Lock is on
                        </div>
                      )}
                    </Form.Group>

                    {/* Keep me logged in checkbox */}
                    <Form.Group className="mb-5 animate-slide-in" style={{ animationDelay: '0.3s' }}>
                      <div className="modern-checkbox d-flex align-items-center p-3 rounded-3" style={{ background: '#f8fafc', border: '2px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setKeepLoggedIn(!keepLoggedIn)}>
                        <Form.Check
                          type="checkbox"
                          id="keep-logged-in"
                          checked={keepLoggedIn}
                          onChange={(e) => setKeepLoggedIn(e.target.checked)}
                          className="me-3"
                          style={{ cursor: 'pointer' }}
                        />
                        <div className="flex-grow-1">
                          <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                            Keep me signed in
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Stay logged in for {keepLoggedIn ? "8 hours" : "1 hour"}
                          </div>
                        </div>
                      </div>
                    </Form.Group>

                    {/* Submit */}
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 fw-semibold rounded-3 border-0 login-btn animate-slide-in position-relative overflow-hidden"
                      disabled={
                        isLoading || Boolean(error || emailError || passwordError)
                      }
                      style={{
                        background: '#0d6efd',
                        fontSize: '0.9375rem',
                        letterSpacing: '0.01em',
                        animationDelay: '0.4s',
                        padding: '1rem',
                        boxShadow: '0 10px 25px rgba(13, 110, 253, 0.3)'
                      }}
                    >
                      <div className="button-shine"></div>
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
                        <div className="d-flex align-items-center justify-content-center">
                          <span>Sign In</span>
                          <ArrowRight size={18} className="ms-2 arrow-icon" />
                        </div>
                      )}
                    </Button>

                    {/* Footer note */}
                    <div className="text-center mt-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                      <p className="mb-0 small" style={{ color: '#64748b' }}>
                        Don't have an account?{" "}
                        <span style={{ color: '#1e293b', fontWeight: 500 }}>Contact your admin</span>
                      </p>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .login-wrapper {
          background: #f8fafc;
           min-height: 100vh;
           max-height: 100vh;
           overflow: hidden;
        }
        .hero-section {
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
           height: 100vh;
          padding: 2rem;
          position: relative;
           overflow-y: auto;
        }
        .hero-pattern { display: none; }
        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          pointer-events: none;
          animation: hero-pulse 8s ease-in-out infinite;
        }
        .hero-glow-1 {
          width: 500px;
          height: 500px;
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
          top: -200px;
          left: -100px;
        }
        .hero-glow-2 {
          width: 400px;
          height: 400px;
          background: rgba(255, 193, 7, 0.10); /* warning @10% */
          bottom: -150px;
          right: -100px;
          animation-delay: 4s;
        }
        @keyframes hero-pulse {
          0%, 100% { 
            transform: scale(1) translate(0, 0);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.1) translate(20px, -20px);
            opacity: 0.4;
          }
        }
        .hero-logo-badge {
          width: 80px;
          height: 80px;
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 35px rgba(13, 110, 253, 0.15), 0 0 0 10px rgba(13, 110, 253, 0.08);
          position: relative;
          overflow: hidden;
          animation: float 6s ease-in-out infinite;
        }
        .hero-logo-shine { display: none; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .hero-title {
          font-size: 1.25rem; /* h5 size cap */
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .text-gradient { color: #0d6efd; }
        .hero-subtitle {
          font-style: normal;
          color: #64748b;
          line-height: 1.7;
          max-width: 480px;
          margin: 0 auto;
        }
        .features-heading {
          font-size: 1rem;
          font-weight: 600;
          color: #475569;
          text-align: center;
          margin-bottom: 0;
        }
        .features-badge {
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
          color: #0d6efd;
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
        }
        .feature-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 1rem;
          padding: 1.25rem;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.15);
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(79, 70, 229, 0.2);
        }
        .feature-icon-wrapper {
          margin-bottom: 0.875rem;
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d6efd;
          border: 1px solid rgba(13, 110, 253, 0.2);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
          transition: all 0.3s ease;
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
        }
        .feature-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.375rem;
        }
        .feature-description {
          font-size: 0.8125rem;
          color: #64748b;
          line-height: 1.5;
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
        background: rgba(13, 110, 253, 0.10); /* primary @10% */
           height: 100vh;
           overflow-y: auto;
        }
        .card-header-bg {
          height: 6px;
        }
        .form-control:focus {
          box-shadow: 0 0 0 0.25rem rgba(79, 70, 229, 0.15);
          border-color: #4f46e5;
        }
        .btn-primary {
          background: #0d6efd; /* primary */
          border: none;
          transition: all 0.2s ease;
        }
        .btn-primary:hover:not(:disabled) {
          background: #0b5ed7; /* primary dark */
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(13, 110, 253, 0.35);
        }
        .btn-check:focus + .btn-primary,
        .btn-primary:focus {
          background: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        .input-group-text,
        .form-section {
          position: relative;
          background: transparent;
          overflow: hidden;
        }
        .geometric-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: none;
        }
        .input-group-text {
          background: #f8fafc;
        }
        .toggle-visibility { cursor: pointer; }
        .auth-shell {
          border-radius: 1rem;
        }
        .auth-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .auth-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 25px 60px rgba(79, 70, 229, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        .shadow-2xl {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
        }
        .logo-container {
          position: relative;
        }
        .logo-badge {
          width: 72px;
          height: 72px;
          background: rgba(13, 110, 253, 0.10);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(13, 110, 253, 0.2), 0 0 0 8px rgba(13, 110, 253, 0.08);
          position: relative;
          overflow: hidden;
        }
        .logo-shine { display: none; }
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        .modern-input {
          background: #ffffff !important;
        }
        .modern-input:focus {
          outline: none;
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), 0 4px 12px rgba(79, 70, 229, 0.15) !important;
          transform: translateY(-1px);
        }
        .input-wrapper {
          position: relative;
        }
        .password-toggle-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }
        .password-toggle-btn:hover {
          background: rgba(79, 70, 229, 0.1);
        }
        .modern-checkbox:hover {
          border-color: #4f46e5 !important;
          background: rgba(79, 70, 229, 0.02) !important;
        }
        .login-btn {
          background: #0d6efd;
          border: none;
          padding: 0.875rem 2rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.35);
        }
        .login-btn:hover:not(:disabled) .arrow-icon {
          transform: translateX(4px);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .button-shine { display: none; }
        @keyframes button-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .arrow-icon {
          display: inline-block;
          transition: transform 0.3s ease;
          margin-left: 0.5rem;
        }
        .custom-checkbox input[type="checkbox"]:checked {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }
        .form-control:focus {
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          border-color: #4f46e5 !important;
        }
        .input-group-text {
          transition: all 0.2s ease;
        }
        .form-control:focus ~ .input-group-text,
        .form-control:focus + .input-group-text {
          border-color: #4f46e5;
        }
        .form-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.2;
          pointer-events: none;
          animation: form-float 15s ease-in-out infinite;
          transition: all 0.6s ease;
        }
        .auth-card:hover .form-blob {
          filter: blur(50px);
          opacity: 0.25;
        }
        .form-blob-1 {
          width: 260px;
          height: 260px;
          background: rgba(13, 110, 253, 0.10); /* primary @10% */
          top: -80px;
          left: -80px;
        }
        .form-blob-2 {
          width: 320px;
          height: 320px;
          background: rgba(25, 135, 84, 0.10); /* success @10% */
          bottom: -100px;
          right: -100px;
          animation-delay: 3s;
        }
        .form-blob-3 {
          width: 240px;
          height: 240px;
          background: rgba(255, 193, 7, 0.10); /* warning @10% */
          top: 50%;
          right: -60px;
          animation-delay: 6s;
        }
        .form-hint { line-height: 1.2; }
        .pw-bar {
          position: relative;
          width: 96px;
          height: 6px;
          background: #e5e7eb;
          border-radius: 999px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .pw-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0%;
          transition: width 0.25s ease;
          border-radius: 999px;
        }
        .testimonial {
          max-width: 500px;
          margin: 0 auto;
        }
        @keyframes form-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% { 
            transform: translate(30px, -30px) scale(1.08) rotate(5deg);
          }
          50% { 
            transform: translate(-15px, 35px) scale(0.92) rotate(-3deg);
          }
          75% { 
            transform: translate(-35px, -15px) scale(1.05) rotate(4deg);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out backwards;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
