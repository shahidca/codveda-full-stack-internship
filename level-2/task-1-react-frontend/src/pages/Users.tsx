import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import type { User } from "../types/user";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import UserList from "../components/UserList";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      setUsers(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to connect to the REST API. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <main className="users-page">
      <section className="page-header">
        <div>
          <span className="badge">
            REST API DATA
          </span>

          <h1>User Management</h1>

          <p>
            Users loaded dynamically from the Express
            and PostgreSQL backend.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchUsers}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      {loading && <LoadingSpinner />}

      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={fetchUsers}
        />
      )}

      {!loading && !error && (
        <UserList users={users} />
      )}
    </main>
  );
};

export default Users;