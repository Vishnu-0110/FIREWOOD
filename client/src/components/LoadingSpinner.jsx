const LoadingSpinner = ({ full = false }) => (
  <div className={full ? 'd-flex justify-content-center align-items-center min-vh-100' : 'text-center py-4'}>
    <div className="spinner-border text-warning" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default LoadingSpinner;