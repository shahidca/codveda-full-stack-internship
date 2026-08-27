import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { loginUser, registerUser } from "./api/auth";

import {
  getAdminDashboard,
  getCurrentUser,
} from "./api/user";

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "./api/task";

type Mode = "login" | "register";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function App() {
  // ======================================================
  // Authentication State
  // ======================================================

  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<User | null>(null);

  // ======================================================
  // General State
  // ======================================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ======================================================
  // Admin State
  // ======================================================

  const [adminLoading, setAdminLoading] = useState(false);

  // ======================================================
  // Task State
  // ======================================================

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] =
    useState("");

  const [editingTaskId, setEditingTaskId] =
    useState<number | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [editingDescription, setEditingDescription] =
    useState("");

  // ======================================================
  // Restore User After Refresh
  // ======================================================

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      return;
    }

    const loadUser = async () => {
      try {
        const response = await getCurrentUser();

        setUser(response.data.user);
      } catch (error) {
        console.error(
          "Failed to restore user:",
          error
        );

        localStorage.removeItem("accessToken");
        setUser(null);
      }
    };

    loadUser();
  }, []);

  // ======================================================
  // Load Tasks
  // ======================================================

  const loadTasks = async () => {
    setTasksLoading(true);

    try {
      const response = await getTasks();

      // Backend returns:
      // {
      //   success: true,
      //   data: [...]
      // }
      setTasks(response.data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load tasks"
      );
    } finally {
      setTasksLoading(false);
    }
  };

  // ======================================================
  // Load Tasks After User Login
  // ======================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    loadTasks();
  }, [user]);

  // ======================================================
  // Register / Login
  // ======================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      // --------------------------------------------------
      // Register
      // --------------------------------------------------

      if (mode === "register") {
        const data = await registerUser(
          name,
          email,
          password
        );

        setMessage(data.message);

        if (data.success) {
          setName("");
          setEmail("");
          setPassword("");

          setMode("login");
        }

        return;
      }

      // --------------------------------------------------
      // Login
      // --------------------------------------------------

      const data = await loginUser(
        email,
        password
      );

      if (
        data.success &&
        data.data.accessToken
      ) {
        localStorage.setItem(
          "accessToken",
          data.data.accessToken
        );

        const currentUser =
          await getCurrentUser();

        setUser(currentUser.data.user);

        setMessage("Login successful.");

        setEmail("");
        setPassword("");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Admin Dashboard
  // ======================================================

  const handleAdminDashboard = async () => {
    setMessage("");
    setAdminLoading(true);

    try {
      const response =
        await getAdminDashboard();

      setMessage(response.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Admin access denied"
      );
    } finally {
      setAdminLoading(false);
    }
  };

  // ======================================================
  // Create Task
  // ======================================================

  const handleCreateTask = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!taskTitle.trim()) {
      setMessage("Task title is required.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await createTask({
        title: taskTitle.trim(),
        description:
          taskDescription.trim() || undefined,
        status: "PENDING",
      });

      // Backend returns the created task directly:
      // data: result.rows[0]
      setTasks((currentTasks) => [
        response.data,
        ...currentTasks,
      ]);

      setTaskTitle("");
      setTaskDescription("");

      setMessage("Task created successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create task"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Start Editing Task
  // ======================================================

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(
      task.description ?? ""
    );

    setMessage("");
  };

  // ======================================================
  // Cancel Editing
  // ======================================================

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingDescription("");
  };

  // ======================================================
  // Save Task Update
  // ======================================================

  const handleUpdateTask = async (
    task: Task
  ) => {
    if (!editingTitle.trim()) {
      setMessage("Task title is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await updateTask(
        task.id,
        {
          title: editingTitle.trim(),
          description:
            editingDescription.trim(),
          status: task.status,
        }
      );

      // Backend returns:
      // data: result.rows[0]
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? response.data
            : currentTask
        )
      );

      cancelEditing();

      setMessage(
        "Task updated successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update task"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Change Task Status
  // ======================================================

  const handleStatusChange = async (
    task: Task,
    status: TaskStatus
  ) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await updateTask(
        task.id,
        {
          status,
        }
      );

      // Backend returns:
      // data: result.rows[0]
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? response.data
            : currentTask
        )
      );

      setMessage(
        "Task status updated successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update task status"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Delete Task
  // ======================================================

  const handleDeleteTask = async (
    taskId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await deleteTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );

      setMessage(
        "Task deleted successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete task"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Logout
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");

    setUser(null);
    setTasks([]);

    setName("");
    setEmail("");
    setPassword("");

    setMessage(
      "Logged out successfully."
    );
  };

  // ======================================================
  // Login / Register Screen
  // ======================================================

  if (!user) {
    return (
      <main className="auth-container">
        <section className="auth-card">
          <h1>TaskFlow</h1>

          <p className="subtitle">
            {mode === "login"
              ? "Login to your account"
              : "Create your TaskFlow account"}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
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
            <p className="message">
              {message}
            </p>
          )}

          <div className="switch-mode">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode("register");
                    setMessage("");
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ======================================================
  // TaskFlow Dashboard
  // ======================================================

  return (
    <main className="dashboard-container">
      <section className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1>TaskFlow Dashboard</h1>

            <p className="subtitle">
              Welcome back, {user.name}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* ==================================================
            USER INFORMATION
        ================================================== */}

        <div className="user-info">
          <p>
            <strong>ID:</strong>{" "}
            {user.id}
          </p>

          <p>
            <strong>Name:</strong>{" "}
            {user.name}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {user.email}
          </p>

          <p>
            <strong>Role:</strong>{" "}
            {user.role}
          </p>
        </div>

        {/* ==================================================
            ADMIN ACCESS
        ================================================== */}

        {user.role === "ADMIN" && (
          <div className="admin-section">
            <button
              type="button"
              onClick={
                handleAdminDashboard
              }
              disabled={adminLoading}
            >
              {adminLoading
                ? "Checking..."
                : "Open Admin Dashboard"}
            </button>
          </div>
        )}

        {/* ==================================================
            CREATE TASK
        ================================================== */}

        <section className="task-section">
          <h2>Create New Task</h2>

          <form
            onSubmit={handleCreateTask}
            className="task-form"
          >
            <div className="form-group">
              <label htmlFor="task-title">
                Title
              </label>

              <input
                id="task-title"
                type="text"
                value={taskTitle}
                onChange={(event) =>
                  setTaskTitle(
                    event.target.value
                  )
                }
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                value={taskDescription}
                onChange={(event) =>
                  setTaskDescription(
                    event.target.value
                  )
                }
                placeholder="Enter task description"
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Task"}
            </button>
          </form>
        </section>

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        {/* ==================================================
            TASK LIST
        ================================================== */}

        <section className="task-section">
          <div className="task-list-header">
            <h2>My Tasks</h2>

            <button
              type="button"
              onClick={loadTasks}
              disabled={tasksLoading}
            >
              {tasksLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {tasksLoading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p>
              No tasks found. Create your
              first task above.
            </p>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article
                  className="task-card"
                  key={task.id}
                >
                  {editingTaskId ===
                  task.id ? (
                    <>
                      <div className="form-group">
                        <label>
                          Title
                        </label>

                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(event) =>
                            setEditingTitle(
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Description
                        </label>

                        <textarea
                          value={
                            editingDescription
                          }
                          onChange={(event) =>
                            setEditingDescription(
                              event.target.value
                            )
                          }
                          rows={3}
                        />
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateTask(
                              task
                            )
                          }
                          disabled={loading}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditing
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>{task.title}</h3>

                      <p>
                        {task.description ||
                          "No description"}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}

                        <select
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(
                              task,
                              event.target
                                .value as TaskStatus
                            )
                          }
                          disabled={loading}
                        >
                          <option value="PENDING">
                            PENDING
                          </option>

                          <option value="IN_PROGRESS">
                            IN PROGRESS
                          </option>

                          <option value="COMPLETED">
                            COMPLETED
                          </option>
                        </select>
                      </p>

                      <div className="task-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEditingTask(
                              task
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteTask(
                              task.id
                            )
                          }
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;