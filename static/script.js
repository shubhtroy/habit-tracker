// --- Element Selectors ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const habitContainer = document.querySelector('.habit-container');
const addHabitBtn = document.getElementById('add-habit-btn');

// --- View Management ---
function updateView(viewName) {
    appContainer.classList.add('hidden');
    authContainer.classList.add('hidden');
    if (viewName === 'app') {
        appContainer.classList.remove('hidden');
    } else {
        authContainer.classList.remove('hidden');
        loginView.classList.toggle('hidden', viewName !== 'login');
        registerView.classList.toggle('hidden', viewName !== 'register');
    }
}

// --- API Request Helper ---
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return await fetch(url, { ...options, headers });
}

// --- Authentication ---
async function loginUser() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt_token', data.access_token);
        loadHabits();
        updateView('app');
    } else {
        alert('Login failed!');
    }
}

async function registerUser() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    alert('Registration successful! Please log in.');
    updateView('login');
}

function logoutUser() {
    localStorage.removeItem('jwt_token');
    updateView('login');
}

// --- Habit Management ---
function createHabitElement(habit) {
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit-item');
    habitDiv.dataset.id = habit.id;
    habitDiv.innerHTML = `<span contenteditable="true" class="habit-name">${habit.name}</span><button class="delete-btn">Delete</button>`;
    habitContainer.appendChild(habitDiv);
}

async function loadHabits() {
    const response = await fetchWithAuth('/api/habits');
    if (response.ok) {
        const habits = await response.json();
        habitContainer.innerHTML = '';
        habits.forEach(createHabitElement);
    } else {
        logoutUser();
    }
}

// --- Event Listeners ---
showRegisterLink.addEventListener('click', () => updateView('register'));
showLoginLink.addEventListener('click', () => updateView('login'));
loginBtn.addEventListener('click', loginUser);
registerBtn.addEventListener('click', registerUser);
logoutBtn.addEventListener('click', logoutUser);

addHabitBtn.addEventListener('click', async () => {
    const habitInput = document.getElementById('habit-input');
    const habitText = habitInput.value.trim();
    if (habitText) {
        const response = await fetchWithAuth('/api/habits', {
            method: 'POST',
            body: JSON.stringify({ name: habitText }),
        });
        const newHabit = await response.json();
        createHabitElement(newHabit);
        habitInput.value = '';
    }
});

habitContainer.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const habitItem = event.target.closest('.habit-item');
        const habitId = habitItem.dataset.id;
        await fetchWithAuth(`/api/habits/${habitId}`, { method: 'DELETE' });
        habitItem.remove();
    }
});

habitContainer.addEventListener('blur', async function(event) {
    if (event.target.classList.contains('habit-name')) {
        const habitItem = event.target.closest('.habit-item');
        const habitId = habitItem.dataset.id;
        const newName = event.target.textContent.trim();
        await fetchWithAuth(`/api/habits/${habitId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName }),
        });
    }
}, true);

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        loadHabits();
        updateView('app');
    } else {
        updateView('login');
    }
});