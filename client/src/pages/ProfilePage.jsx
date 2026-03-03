import { useSelector } from 'react-redux';
import AppLayout from '../layout/AppLayout';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <AppLayout>
      <div className="card shadow-sm">
        <div className="card-header">Profile</div>
        <div className="card-body">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;