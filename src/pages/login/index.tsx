import React, { useState } from 'react';
import './index.css';

export interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGoogleSignIn = () => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMessage('Connecting to Google Identity Services...');

    // Simulate enterprise SSO auth cycle
    setTimeout(() => {
      setStatusMessage('Verifying security credentials...');
    }, 1200);

    setTimeout(() => {
      setStatusMessage('Redirecting to workspace...');
      setTimeout(() => {
        setIsLoading(false);
        setStatusMessage('');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 1800);
    }, 2500);
  };

  return (
    <div className="login-viewport">
      {/* Ambient Warm Backdrop Glow & Texture */}
      <div className="ambient-glow" aria-hidden="true" />
      <div className="ambient-mesh" aria-hidden="true" />

      {/* Main Centered Layout */}
      <main className="page-wrapper" role="main">
        <div className="login-container">
          
          {/* Brand Header with Claude Serif Aesthetic */}
          <header className="brand-header">
            <div className="brand-logo-mark">✻</div>
            <h1 className="brand-title">MIBR AI</h1>
          </header>

          {/* Login Card Surface */}
          <section className="login-card" aria-labelledby="workspace-title">
            
            <div className="card-header">
              <h2 id="workspace-title" className="card-title">
                Welcome back
              </h2>
              <p className="card-subtitle">
                Sign in to continue to your workspace
              </p>
            </div>

            {/* Google SSO Action Button */}
            <button 
              type="button" 
              id="google-sso-btn" 
              className={`btn-google ${isLoading ? 'is-loading' : ''}`}
              aria-label="Continue with Google Single Sign-On"
              aria-busy={isLoading}
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              {/* Official Google 'G' Multi-Color SVG */}
              <span className="google-icon-wrapper" aria-hidden="true">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </span>

              <span className="btn-label">Continue with Google</span>
              
              {/* Micro-interaction Loading Spinner */}
              <span className="btn-spinner" aria-hidden="true" />
            </button>

            {/* Live Status Feedback Message */}
            <div 
              id="status-feedback" 
              className={`status-feedback ${statusMessage ? 'is-visible' : ''}`}
              role="status" 
              aria-live="polite"
            >
              {statusMessage}
            </div>

          </section>

          {/* Enterprise Compliance & Security Footer Note */}
          <footer className="footer-note">
            <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/>
            </svg>
            <span>Authorized internal personnel only • Secure SSO</span>
          </footer>

          {/* Live SSO Gateway Health Indicator */}
          <div className="system-status-indicator" aria-label="System status: SSO Gateway operational">
            <span className="status-dot" aria-hidden="true" />
            <span>SSO Gateway Active &bull; TLS 1.3</span>
          </div>

        </div>
      </main>

      {/* Page Legal & Security Info */}
      <footer className="page-footer">
        <p>&copy; {new Date().getFullYear()} MIBR AI Systems. Confidential and Proprietary.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
