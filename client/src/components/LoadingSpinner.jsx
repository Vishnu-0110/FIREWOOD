const LoadingSpinner = ({ full = false }) => (
  <div className={full ? 'loading-screen' : 'text-center py-4'}>
    <div className="loading-shell">
      <div className="spinner-border text-warning" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {full ? <p className="loading-copy mb-0">Loading your workspace...</p> : null}
    </div>
  </div>
);

export default LoadingSpinner;
