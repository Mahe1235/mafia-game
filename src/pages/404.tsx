import Head from 'next/head';

/**
 * Simple 404 page for the Pages Router
 * Guaranteed to work during static generation
 */
export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Head>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#1e293b' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#334155' }}>Page Not Found</h2>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#64748b' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block'
          }}
        >
          Return Home
        </a>
      </div>
    </>
  );
} 