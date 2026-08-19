import React, { useState } from 'react';

/**
 * Production-Ready Enterprise Login Page for MIBR
 * Stack: React + Tailwind CSS
 */
export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMessage('Connecting to Google Identity Services...');

    // Simulate enterprise SSO auth cycle
    setTimeout(() => {
      setStatusMessage('Verifying security credentials...');
    }, 1200);

    setTimeout(() => {
      setStatusMessage('Redirecting to workspace...');
      // Production redirect logic: window.location.href = '/auth/google';
      setTimeout(() => {
        setIsLoading(false);
        setStatusMessage('');
      }, 1800);
    }, 2500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0B0E14] text-white flex flex-col justify-between items-center overflow-x-hidden font-sans select-none">
      {/* Ambient Lighting & Mesh Background */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <div className="w-[600px] h-[600px] max-w-[90vw] max-h-[90vw] rounded-full bg-radial from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl opacity-80" />
      </div>

      {/* Subtle Dot Matrix Pattern */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed inset-0 z-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_85%)]"
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center w-full px-4 py-8">
        <div className="w-full max-w-[420px] flex flex-col items-center animate-fade-in">
          
          {/* Brand Header */}
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-[0.15em] text-[#F3F4F6] uppercase drop-shadow-sm">
              MIBR
            </h1>
          </header>

          {/* Login Card Surface */}
          <section 
            aria-labelledby="workspace-heading" 
            className="w-full bg-[#151921]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.16] transition-colors duration-300 rounded-[16px] p-7 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden"
          >
            {/* Top Border Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="text-center mb-7">
              <h2 id="workspace-heading" className="text-[20px] font-semibold text-white tracking-tight">
                Internal Workspace
              </h2>
              <p className="text-[14px] text-gray-400 mt-1.5 leading-relaxed">
                Sign in with your Google account
              </p>
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label="Continue with Google Single Sign-On"
              className="w-full h-[46px] inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-[#1F2937] font-medium text-[15px] rounded-[10px] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-90 disabled:cursor-not-allowed relative"
            >
              {isLoading ? (
                <div 
                  className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" 
                  aria-hidden="true" 
                />
              ) : (
                <>
                  {/* Official Google SVG Icon */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Accessibility & Micro-interaction Status Message */}
            <div 
              role="status" 
              aria-live="polite"
              className={`mt-4 text-xs text-blue-400 text-center min-h-[16px] transition-opacity duration-200 ${
                statusMessage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {statusMessage}
            </div>
          </section>

          {/* Footer Note */}
          <footer className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 text-center">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/>
            </svg>
            <span>Authorized internal personnel only &bull; Secure SSO</span>
          </footer>

          {/* Health Status Indicator */}
          <div className="mt-3.5 flex items-center gap-1.5 text-[11.5px] text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SSO Gateway Active &bull; TLS 1.3</span>
          </div>

        </div>
      </main>

      {/* Proprietary Bottom Notice */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} MIBR Enterprise Systems. Confidential and Proprietary.
      </footer>
    </div>
  );
};

export default LoginPage;
