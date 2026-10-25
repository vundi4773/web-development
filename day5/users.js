const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

function setStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", Boolean(isError));
}

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No users match your filter.";
    usersList.appendChild(empty);
    return;
  }

  list.forEach(function (user) {
    const item = document.createElement("li");

    const name = document.createElement("h2");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = "Email: " + user.email;

    const city = document.createElement("p");
    city.textContent = "City: " + user.address.city;

    const company = document.createElement("p");
    company.textContent = "Company: " + user.company.name;

    item.append(name, email, city, company);
    usersList.appendChild(item);
  });
}

function applyFilter() {
  const query = filterInput.value.trim().toLowerCase();
  const matches = users.filter(function (user) {
    return user.name.toLowerCase().includes(query);
  });
  renderUsers(matches);
}

async function loadUsers() {
  loadButton.disabled = true;
  setStatus("Loading users...", false);

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }
    users = await response.json();
    applyFilter();
    setStatus("Loaded " + users.length + " users.", false);
  } catch (error) {
    setStatus("Could not load users: " + error.message, true);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadUsers);

// Filters the stored array, so no new request is made.
filterInput.addEventListener("input", function () {
  if (users.length > 0) {
    applyFilter();
  }
});
