import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaUsers, FaTrash, FaUserShield, FaInfoCircle } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./UserList.css";

function UserList() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Custom Confirm Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setMessage("");
      setError("");
      await API.put(`/users/${userId}/role?role=${newRole}`);
      setMessage("User role updated successfully.");
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Failed to update user role.");
    }
  };

  const handleDeleteUser = (userId) => {
    triggerConfirm(
      "Confirm User Deletion",
      "Are you sure you want to delete this user? This will permanently remove their account from the platform.",
      async () => {
        try {
          setMessage("");
          setError("");
          await API.delete(`/users/${userId}`);
          setMessage("User deleted successfully.");
          fetchUsers();
        } catch (err) {
          console.error(err);
          setError("Failed to delete user.");
        }
      }
    );
  };

  const filteredUsers = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return users;

    return users.filter((user) =>
      [user.email, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text))
    );
  }, [query, users]);

  return (
    <Layout title="Registered Users" subtitle="Admin user management and role visibility.">
      <div className="users-page">
        <div className="users-hero">
          <div className="users-hero-left">
            <div className="users-badge">
              <FaUsers />
            </div>
            <div>
              <span className="section-label">People directory</span>
              <h2>User Directory</h2>
              <p>{users.length} accounts registered on the platform.</p>
            </div>
          </div>

          <label className="users-search">
            <FaSearch />
            <input
              type="search"
              placeholder="Search by email or role"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {message && <div className="users-success-banner">{message}</div>}
        {error && <div className="users-error">{error}</div>}

        <div className="users-table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action Controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-chip ${user.role.toLowerCase()}`}>{user.role}</span>
                  </td>
                  <td>
                    <div className="user-action-cell">
                      <div className="role-selector-wrap">
                        <FaUserShield />
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                      <button
                        className="delete-user-btn"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="users-empty">No users match your search.</div>
          )}
        </div>
      </div>

      {confirmDialog.isOpen && (
        <div className="custom-confirm-overlay">
          <div className="custom-confirm-card animate-scale-pop">
            <div className="custom-confirm-header">
              <FaInfoCircle className="custom-confirm-icon" />
              <h3>{confirmDialog.title}</h3>
            </div>
            <p className="custom-confirm-message">{confirmDialog.message}</p>
            <div className="custom-confirm-actions">
              <button 
                className="custom-confirm-btn cancel"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button 
                className="custom-confirm-btn confirm"
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default UserList;
