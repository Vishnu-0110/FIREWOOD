import { useSelector } from 'react-redux';
import AppLayout from '../layout/AppLayout';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">Account</span>
          <h1 className="page-title mb-1">Profile</h1>
          <p className="page-subtitle mb-0">Your workspace identity and access details.</p>
        </div>
      </section>

      <div className="card shadow-sm">
        <div className="card-header">Profile Details</div>
        <div className="card-body">
          <div className="info-grid info-grid-compact">
            <div className="info-tile">
              <span className="detail-label">Name</span>
              <strong>{user?.name || '-'}</strong>
            </div>
            <div className="info-tile">
              <span className="detail-label">Email</span>
              <strong>{user?.email || '-'}</strong>
            </div>
            <div className="info-tile">
              <span className="detail-label">Role</span>
              <strong>{user?.role || '-'}</strong>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
