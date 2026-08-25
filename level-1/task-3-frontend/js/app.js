
const API_URL = "http://localhost:4000/api/users";

const usersContainer = document.getElementById("usersContainer");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const emptyState = document.getElementById("emptyState");
const refreshBtn = document.getElementById("refreshBtn");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

async function fetchUsers() {
  showLoading();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    const users = result.data || [];

    setApiStatus(true);

    renderUsers(users);
  } catch (error) {
    console.error("Fetch users error:", error);

    setApiStatus(false);

    showError(
      "Unable to connect to the REST API. Make sure the backend server is running."
    );
  } finally {
    loading.classList.add("hidden");
  }
}

function renderUsers(users) {
  usersContainer.innerHTML = "";


  errorMessage.classList.add("hidden");
  emptyState.classList.add("hidden");

  if (users.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  users.forEach((user) => {
    const card = document.createElement("article");

    card.className = "user-card";

    const initial = user.name
      ? user.name.charAt(0).toUpperCase()
      : "?";

    card.innerHTML = `
      <div class="user-avatar">
        ${escapeHtml(initial)}
      </div>

      <h3>${escapeHtml(user.name)}</h3>

      <p class="user-email">
        ${escapeHtml(user.email)}
      </p>

      ${
        user.age !== null && user.age !== undefined
          ? `<span class="user-age">Age: ${escapeHtml(String(user.age))}</span>`
          : ""
      }
    `;

    usersContainer.appendChild(card);
  });
}

function showLoading() {
  loading.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  emptyState.classList.add("hidden");
  usersContainer.innerHTML = "";
}

function showError(message) {
  loading.classList.add("hidden");
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  usersContainer.innerHTML = "";
  emptyState.classList.add("hidden");
}

function setApiStatus(isOnline) {
  if (isOnline) {
    statusDot.classList.remove("offline");
    statusDot.classList.add("online");
    statusText.textContent = "API Connected";
  } else {
    statusDot.classList.remove("online");
    statusDot.classList.add("offline");
    statusText.textContent = "API Offline";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

refreshBtn.addEventListener("click", fetchUsers);

fetchUsers();