import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { loginUser, registerUser } from "./api/auth";

import { getAdminDashboard, getCurrentUser } from "./api/user";

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "./api/task";

/* ============================================================
   Types
   ============================================================ */

type Mode = "login" | "register";
type MessageType = "success" | "error" | "info";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

/* ============================================================
   Icons
   ============================================================ */

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A18.5 18.5 0 0 0 2 11s3.6 7 10 7a9.1 9.1 0 0 0 4.24-1" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2 14 9l7 2-7 2-2 7-2-7-7-2 7-2 2-7Z" />
    </svg>
  );
}

/* ============================================================
   Animated Background
   ============================================================ */

function AnimatedBackground() {
  return (
    <div className="bg-orbs" aria-hidden="true">
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />
      <span className="orb orb-4" />
    </div>
  );
}

/* ============================================================
   Password Field
   ============================================================ */

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>

      <div className="input-with-icon">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   App
   ============================================================ */

function App() {
  /* ---------------- Auth state ---------------- */

  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<User | null>(null);

  /* ---------------- General state ---------------- */

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [loading, setLoading] = useState(false);

  const notify = (text: string, type: MessageType = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => setMessage("");

  /* ---------------- Admin state ---------------- */

  const [adminLoading, setAdminLoading] = useState(false);

  /* ---------------- Task state ---------------- */

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  /* ======================================================
     Restore user
     ====================================================== */

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) return;

    const loadUser = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        console.error("Failed to restore user:", error);
        localStorage.removeItem("accessToken");
        setUser(null);
      }
    };

    loadUser();
  }, []);

  /* ======================================================
     Load tasks
     ====================================================== */

  const loadTasks = async () => {
    setTasksLoading(true);

    try {
      const response = await getTasks();
      setTasks(response.data);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Failed to load tasks",
        "error"
      );
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ======================================================
     Register / Login
     ====================================================== */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearMessage();
    setLoading(true);

    try {
      if (mode === "register") {
        const data = await registerUser(name, email, password);
        notify(data.message, data.success ? "success" : "error");

        if (data.success) {
          setName("");
          setEmail("");
          setPassword("");
          setMode("login");
        }
        return;
      }

      const data = await loginUser(email, password);

      if (data.success && data.data.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);

        const currentUser = await getCurrentUser();

        setUser(currentUser.data.user);
        notify("Login successful. Welcome back!", "success");

        setEmail("");
        setPassword("");
      } else {
        notify(data.message, "error");
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Something went wrong",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     Admin dashboard
     ====================================================== */

  const handleAdminDashboard = async () => {
    clearMessage();
    setAdminLoading(true);

    try {
      const response = await getAdminDashboard();
      notify(response.message, "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Admin access denied",
        "error"
      );
    } finally {
      setAdminLoading(false);
    }
  };

  /* ======================================================
     Create task
     ====================================================== */

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!taskTitle.trim()) {
      notify("Task title is required.", "error");
      return;
    }

    clearMessage();
    setLoading(true);

    try {
      const response = await createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        status: "PENDING",
      });

      setTasks((current) => [response.data, ...current]);

      setTaskTitle("");
      setTaskDescription("");

      notify("Task created successfully.", "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Failed to create task",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     Edit task
     ====================================================== */

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description ?? "");
    clearMessage();
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingDescription("");
  };

  const handleUpdateTask = async (task: Task) => {
    if (!editingTitle.trim()) {
      notify("Task title is required.", "error");
      return;
    }

    setLoading(true);
    clearMessage();

    try {
      const response = await updateTask(task.id, {
        title: editingTitle.trim(),
        description: editingDescription.trim(),
        status: task.status,
      });

      setTasks((current) =>
        current.map((t) => (t.id === task.id ? response.data : t))
      );

      cancelEditing();
      notify("Task updated successfully.", "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Failed to update task",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     Change status
     ====================================================== */

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    setLoading(true);
    clearMessage();

    try {
      const response = await updateTask(task.id, { status });

      setTasks((current) =>
        current.map((t) => (t.id === task.id ? response.data : t))
      );

      notify("Task status updated successfully.", "success");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Failed to update task status",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     Delete task
     ====================================================== */

  const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setLoading(true);
    clearMessage();

    try {
      await deleteTask(taskId);

      setTasks((current) => current.filter((t) => t.id !== taskId));

      notify("Task deleted successfully.", "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Failed to delete task",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     Logout
     ====================================================== */

  const handleLogout = () => {
    localStorage.removeItem("accessToken");

    setUser(null);
    setTasks([]);

    setName("");
    setEmail("");
    setPassword("");

    cancelEditing();
    setSearchQuery("");
    setStatusFilter("ALL");

    notify("Logged out successfully.", "info");
  };

  /* ======================================================
     Filtered tasks
     ====================================================== */

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.description ?? "").toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  /* ======================================================
     Login / Register Screen
     ====================================================== */

  if (!user) {
    return (
      <>
        <AnimatedBackground />

        <main className="auth-container">
          <section className="auth-card">
            <div className="brand-logo">
              <LogoIcon />
            </div>

            <h1>TaskFlow</h1>

            <p className="subtitle">
              {mode === "login"
                ? "Welcome back — sign in to continue"
                : "Create your account and start organizing"}
            </p>

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="form-group">
                  <label htmlFor="name">Name</label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={6}
              />

              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            {message && (
              <p
                key={message}
                className={`message-banner message-${messageType}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}

            <div className="switch-mode">
              {mode === "login" ? (
                <>
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode("register");
                      clearMessage();
                    }}
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode("login");
                      clearMessage();
                    }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </section>
        </main>
      </>
    );
  }

  /* ======================================================
     Dashboard
     ====================================================== */

  return (
    <>
      <AnimatedBackground />

      <main className="dashboard-container">
        <div className="dashboard-wrapper">
          {/* ---------- Header ---------- */}
          <header className="dashboard-header">
            <div className="dashboard-header-left">
              <div className="avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <span className="app-badge">
                  <SparkleIcon /> TaskFlow
                </span>

                <h1>Welcome back, {user.name}</h1>

                <p className="subtitle">
                  Here's your workspace overview for today.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </header>

          {/* ---------- Message ---------- */}
          {message && (
            <p
              key={message}
              className={`message-banner message-${messageType}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          {/* ---------- User Info ---------- */}
          <section className="user-info-grid">
            <div className="info-card">
              <span className="info-label">ID</span>
              <span className="info-value">{user.id}</span>
            </div>

            <div className="info-card">
              <span className="info-label">Name</span>
              <span className="info-value">{user.name}</span>
            </div>

            <div className="info-card">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>

            <div className="info-card">
              <span className="info-label">Role</span>
              <span
                className={`role-badge ${
                  user.role === "ADMIN" ? "admin" : "user"
                }`}
              >
                {user.role}
              </span>
            </div>
          </section>

          {user.role === "ADMIN" && (
            <section className="admin-section">
              <button
                type="button"
                className="admin-btn"
                onClick={handleAdminDashboard}
                disabled={adminLoading}
              >
                {adminLoading ? "Checking..." : "Open Admin Dashboard"}
              </button>
            </section>
          )}

          {/* ---------- Dashboard Grid ---------- */}
          <div className="dashboard-grid">
            {/* ---------- Create Task ---------- */}
            <section className="card">
              <h2>Create New Task</h2>

              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label htmlFor="task-title">Title</label>

                  <input
                    id="task-title"
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Prepare the sprint report"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-description">Description</label>

                  <textarea
                    id="task-description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Add any details that will help you complete this task"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Task"}
                </button>
              </form>
            </section>

            {/* ---------- Task List ---------- */}
            <section className="card">
              <div className="task-list-header">
                <h2>My Tasks</h2>

                <button
                  type="button"
                  className="secondary-btn small"
                  onClick={loadTasks}
                  disabled={tasksLoading}
                >
                  {tasksLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="task-toolbar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="filter-chips">
                  <button
                    type="button"
                    className={`chip ${
                      statusFilter === "ALL" ? "active" : ""
                    }`}
                    onClick={() => setStatusFilter("ALL")}
                  >
                    All
                  </button>

                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`chip ${
                        statusFilter === option.value ? "active" : ""
                      }`}
                      onClick={() => setStatusFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <p className="task-count">
                  {filteredTasks.length} of {tasks.length} task
                  {tasks.length === 1 ? "" : "s"}
                </p>
              </div>

              {tasksLoading ? (
                <div className="skeleton-list">
                  <div className="skeleton-card" />
                  <div className="skeleton-card" />
                  <div className="skeleton-card" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="state-placeholder">
                  {tasks.length === 0
                    ? "No tasks found. Create your first task above."
                    : "No tasks match your current filters."}
                </div>
              ) : (
                <div className="task-list">
                  {filteredTasks.map((task) => (
                    <article
                      key={task.id}
                      className={`task-card task-${task.status.toLowerCase()}`}
                    >
                      {editingTaskId === task.id ? (
                        <>
                          <div className="form-group">
                            <label htmlFor={`edit-title-${task.id}`}>
                              Title
                            </label>

                            <input
                              id={`edit-title-${task.id}`}
                              type="text"
                              value={editingTitle}
                              onChange={(e) =>
                                setEditingTitle(e.target.value)
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor={`edit-desc-${task.id}`}>
                              Description
                            </label>

                            <textarea
                              id={`edit-desc-${task.id}`}
                              value={editingDescription}
                              onChange={(e) =>
                                setEditingDescription(e.target.value)
                              }
                              rows={3}
                            />
                          </div>

                          <div className="task-buttons">
                            <button
                              type="button"
                              className="primary-btn small"
                              onClick={() => handleUpdateTask(task)}
                              disabled={loading}
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              className="secondary-btn small"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="task-card-top">
                            <h3>{task.title}</h3>

                            <span
                              className={`status-badge ${task.status.toLowerCase()}`}
                            >
                              {STATUS_LABELS[task.status]}
                            </span>
                          </div>

                          <p className="task-desc">
                            {task.description || "No description provided."}
                          </p>

                          <div className="task-card-footer">
                            <label className="status-changer">
                              <span>Status</span>

                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    task,
                                    e.target.value as TaskStatus
                                  )
                                }
                                disabled={loading}
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <div className="task-buttons">
                              <button
                                type="button"
                                className="icon-btn edit"
                                onClick={() => startEditingTask(task)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="icon-btn delete"
                                onClick={() => handleDeleteTask(task.id)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;