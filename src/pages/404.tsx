/**
 * Simple 404 page fallback in the pages directory (not app directory)
 * This gives Next.js an alternative for static generation
 */
export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <a 
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          borderRadius: '0.375rem',
          textDecoration: 'none'
        }}
      >
        Return Home
      </a>
    </div>
  );
} 