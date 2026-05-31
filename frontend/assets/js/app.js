/**
 * Student Management System - Frontend Application
 * Vanilla JavaScript - No frameworks required
 */

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  API_BASE_URL: window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api',
  AUTH_TOKEN_KEY: 'sms_auth_token',
  AUTH_USER_KEY: 'sms_auth_user',
};

// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
  currentPage: 'dashboard',
  authToken: localStorage.getItem(CONFIG.AUTH_TOKEN_KEY) || null,
  currentUser: JSON.parse(localStorage.getItem(CONFIG.AUTH_USER_KEY) || 'null'),
  classes: [],
  students: [],
  gradeRecords: [],
};

const ROLE_CONFIG = {
  admin: {
    label: 'Administrator',
    pages: ['dashboard', 'grades', 'students'],
    dashboardTitle: 'Admin Dashboard',
    dashboardSubtitle: 'Manage students, classes, and academic records.'
  },
  teacher: {
    label: 'Teacher',
    pages: ['dashboard', 'attendance', 'grades', 'students'],
    dashboardTitle: 'Teacher Dashboard',
    dashboardSubtitle: "Welcome back! Here's what's happening today."
  },
  student: {
    label: 'Student',
    pages: ['dashboard', 'grades', 'students'],
    dashboardTitle: 'Student Dashboard',
    dashboardSubtitle: 'Review your profile and academic records.'
  }
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const elements = {
  sidebar: document.getElementById('sidebar'),
  hamburgerBtn: document.getElementById('hamburgerBtn'),
  sidebarClose: document.getElementById('sidebarClose'),
  navLinks: document.querySelectorAll('.nav-link'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  dashboardPage: document.getElementById('dashboardPage'),
  attendancePage: document.getElementById('attendancePage'),
  gradesPage: document.getElementById('gradesPage'),
  studentsPage: document.getElementById('studentsPage'),
  submitAttendance: document.getElementById('submitAttendance'),
  attendanceDate: document.getElementById('attendanceDate'),
  attendanceClass: document.getElementById('attendanceClass'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  btnLogout: document.getElementById('btnLogout'),
  quickAttendance: document.getElementById('quickAttendance'),
  quickGrades: document.getElementById('quickGrades'),
  quickStudents: document.getElementById('quickStudents'),
  quickGradesText: document.getElementById('quickGradesText'),
  quickStudentsText: document.getElementById('quickStudentsText'),
  sidebarUserName: document.getElementById('sidebarUserName'),
  sidebarUserRole: document.getElementById('sidebarUserRole'),
  adminStudentPanel: document.getElementById('adminStudentPanel'),
  studentCreateForm: document.getElementById('studentCreateForm'),
  createStudentButton: document.getElementById('createStudentButton'),
  newStudentClass: document.getElementById('newStudentClass'),
};

const attendanceTableBody = document.getElementById('attendanceTableBody');
const gradeStudentSelect = document.getElementById('gradeStudentSelect');
const gradesTableBody = document.getElementById('gradesTableBody');
const studentTableBody = document.getElementById('studentTableBody');
const studentSearchInput = document.getElementById('studentSearch');
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

// ==========================================
// UTILITIES
// ==========================================
function showToast(message, type = 'success') {
  elements.toastMessage.textContent = message;
  elements.toast.classList.remove('show');

  if (type === 'success') {
    elements.toast.style.background = '#10b981';
  } else if (type === 'error') {
    elements.toast.style.background = '#ef4444';
  } else {
    elements.toast.style.background = '#3b82f6';
  }

  requestAnimationFrame(() => elements.toast.classList.add('show'));
  setTimeout(() => elements.toast.classList.remove('show'), 4000);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentRole() {
  return state.currentUser?.role || null;
}

function canAccessPage(pageName) {
  const role = getCurrentRole();
  return Boolean(role && ROLE_CONFIG[role]?.pages.includes(pageName));
}

function updateRoleUI() {
  const role = getCurrentRole();
  const config = ROLE_CONFIG[role];

  elements.sidebarUserName.textContent = state.currentUser?.username || 'User';
  elements.sidebarUserRole.textContent = config?.label || 'Portal Access';

  elements.navLinks.forEach(link => {
    const page = link.getAttribute('data-page');
    link.closest('.nav-item').classList.toggle('hidden', !canAccessPage(page));
  });

  elements.quickAttendance.classList.toggle('hidden', role !== 'teacher');
  elements.adminStudentPanel.style.display = role === 'admin' ? 'block' : 'none';

  if (elements.quickGradesText) {
    elements.quickGradesText.textContent = role === 'teacher' ? 'Manage Grades' : 'View Grades';
  }

  if (elements.quickStudentsText) {
    elements.quickStudentsText.textContent = role === 'admin' ? 'Add Students' : 'Student Records';
  }
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (state.authToken) {
    headers.Authorization = `Bearer ${state.authToken}`;
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error('Unexpected API response.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      logout();
      showLoginScreen();
    }
    throw new Error(payload.message || 'API request failed');
  }

  return payload;
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(pageName) {
  if (!canAccessPage(pageName)) {
    pageName = 'dashboard';
  }

  elements.dashboardPage.style.display = 'none';
  elements.attendancePage.style.display = 'none';
  elements.gradesPage.style.display = 'none';
  elements.studentsPage.style.display = 'none';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  switch (pageName) {
    case 'dashboard':
      elements.dashboardPage.style.display = 'block';
      elements.pageTitle.textContent = ROLE_CONFIG[getCurrentRole()]?.dashboardTitle || 'Dashboard';
      elements.pageSubtitle.textContent = ROLE_CONFIG[getCurrentRole()]?.dashboardSubtitle || 'Welcome back.';
      break;
    case 'attendance':
      elements.attendancePage.style.display = 'block';
      elements.pageTitle.textContent = 'Attendance Management';
      elements.pageSubtitle.textContent = 'Mark daily attendance for your classes.';
      break;
    case 'grades':
      elements.gradesPage.style.display = 'block';
      elements.pageTitle.textContent = 'Grades Management';
      elements.pageSubtitle.textContent = getCurrentRole() === 'student' ? 'Read your grade records.' : 'View student grades and progress.';
      break;
    case 'students':
      elements.studentsPage.style.display = 'block';
      elements.pageTitle.textContent = getCurrentRole() === 'student' ? 'My Profile' : 'Student Directory';
      elements.pageSubtitle.textContent = getCurrentRole() === 'admin' ? 'Add and browse student records.' : 'Browse student records and class assignments.';
      break;
  }

  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.closest('.nav-item').classList.add('active');
  }

  if (window.innerWidth <= 768) {
    elements.sidebar.classList.remove('open');
  }

  state.currentPage = pageName;
}

// ==========================================
// ATTENDANCE
// ==========================================
function renderAttendanceRows(students) {
  if (!students || students.length === 0) {
    attendanceTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No students found for the selected class.</td>
      </tr>
    `;
    return;
  }

  attendanceTableBody.innerHTML = students.map(student => {
    const status = student.attendance_status || 'Present';
    const remarks = student.attendance_remarks || '';

    return `
      <tr class="attendance-row" data-student-id="${student.id}">
        <td class="roll-number">${student.roll_number}</td>
        <td class="student-name">
          <div class="student-info">
            <div class="student-avatar">${student.first_name.charAt(0)}${student.last_name.charAt(0)}</div>
            <span>${student.first_name} ${student.last_name}</span>
          </div>
        </td>
        <td>
          <div class="attendance-status-toggle">
            <label class="status-option">
              <input type="radio" name="status_${student.id}" value="Present" ${status === 'Present' ? 'checked' : ''} />
              <span class="status-label status-present">Present</span>
            </label>
            <label class="status-option">
              <input type="radio" name="status_${student.id}" value="Absent" ${status === 'Absent' ? 'checked' : ''} />
              <span class="status-label status-absent">Absent</span>
            </label>
            <label class="status-option">
              <input type="radio" name="status_${student.id}" value="Late" ${status === 'Late' ? 'checked' : ''} />
              <span class="status-label status-late">Late</span>
            </label>
            <label class="status-option">
              <input type="radio" name="status_${student.id}" value="Excused" ${status === 'Excused' ? 'checked' : ''} />
              <span class="status-label status-excused">Excused</span>
            </label>
          </div>
        </td>
        <td>
          <input type="text" class="remarks-input" placeholder="Optional notes..." value="${remarks}" />
        </td>
      </tr>
    `;
  }).join('');
}

function collectAttendanceData() {
  const classId = elements.attendanceClass.value;
  const date = elements.attendanceDate.value;
  const rows = document.querySelectorAll('.attendance-row');
  const attendanceRecords = [];

  rows.forEach(row => {
    const studentId = row.dataset.studentId;
    const statusInputs = row.querySelectorAll('input[type="radio"]');
    const remarksInput = row.querySelector('.remarks-input');
    let selectedStatus = 'Present';

    statusInputs.forEach(input => {
      if (input.checked) {
        selectedStatus = input.value;
      }
    });

    attendanceRecords.push({
      student_id: Number(studentId),
      class_id: Number(classId),
      date,
      status: selectedStatus,
      remarks: remarksInput.value.trim() || null,
    });
  });

  return attendanceRecords;
}

async function loadAttendanceStudents() {
  if (getCurrentRole() !== 'teacher') {
    renderAttendanceRows([]);
    return;
  }

  const classId = elements.attendanceClass.value;
  const date = elements.attendanceDate.value;

  if (!classId || !date) {
    renderAttendanceRows([]);
    return;
  }

  try {
    const [studentsResponse, attendanceResponse] = await Promise.all([
      apiRequest(`/students?classId=${classId}`),
      apiRequest(`/attendance/class/${classId}/date/${date}`)
    ]);

    const attendanceByStudent = new Map(
      attendanceResponse.data.map(record => [record.student_id, record])
    );

    const students = studentsResponse.data.map(student => {
      const attendance = attendanceByStudent.get(student.id);
      return {
        ...student,
        attendance_status: attendance ? attendance.status : 'Present',
        attendance_remarks: attendance ? attendance.remarks : ''
      };
    });

    renderAttendanceRows(students);
  } catch (error) {
    showToast(`Failed to load attendance: ${error.message}`, 'error');
    renderAttendanceRows([]);
  }
}

async function submitAttendanceData() {
  if (getCurrentRole() !== 'teacher') {
    showToast('Only teachers can submit attendance.', 'error');
    return;
  }

  try {
    const attendanceRecords = collectAttendanceData();

    elements.submitAttendance.disabled = true;
    elements.submitAttendance.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
        <path d="M12 2a10 10 0 0110 10" stroke-opacity="0.75" />
      </svg>
      Submitting...
    `;

    await apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify({ attendanceRecords }),
    });

    showToast('Attendance submitted successfully!', 'success');
    await initializeAppData();
  } catch (error) {
    showToast(`Error submitting attendance: ${error.message}`, 'error');
  } finally {
    elements.submitAttendance.disabled = false;
    elements.submitAttendance.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
      Submit Attendance Records
    `;
  }
}

function renderStudentDirectory(students) {
  if (!students || students.length === 0) {
    studentTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No student records available.</td>
      </tr>
    `;
    return;
  }

  studentTableBody.innerHTML = students.map(student => `
    <tr>
      <td>${student.roll_number}</td>
      <td>${student.first_name} ${student.last_name}</td>
      <td>${student.class_name || 'Unassigned'}</td>
      <td>${student.gender}</td>
      <td>${student.date_of_birth || '—'}</td>
      <td>${student.status}</td>
    </tr>
  `).join('');
}

function renderGradeRecords(grades) {
  if (!grades || grades.length === 0) {
    gradesTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">Select a student to view their grades.</td>
      </tr>
    `;
    return;
  }

  gradesTableBody.innerHTML = grades.map(grade => `
    <tr>
      <td>${grade.subject_name}</td>
      <td>${Number(grade.quiz_mark).toFixed(2)}</td>
      <td>${Number(grade.assignment_mark).toFixed(2)}</td>
      <td>${Number(grade.exam_mark).toFixed(2)}</td>
      <td>${Number(grade.total_mark).toFixed(2)}</td>
      <td>${Number(grade.percentage).toFixed(2)}%</td>
      <td>${grade.grade_letter}</td>
      <td>${grade.semester}</td>
      <td>${grade.academic_year}</td>
    </tr>
  `).join('');
}

function populateGradeStudentSelect(students) {
  if (!students || students.length === 0) {
    gradeStudentSelect.innerHTML = '<option value="">No students available</option>';
    return;
  }

  if (getCurrentRole() === 'student' && students.length === 1) {
    gradeStudentSelect.innerHTML = `
      <option value="${students[0].id}">${students[0].roll_number} • ${students[0].first_name} ${students[0].last_name}</option>
    `;
    gradeStudentSelect.value = String(students[0].id);
    return;
  }

  gradeStudentSelect.innerHTML = `
    <option value="">Select a student</option>
    ${students.map(student => `
      <option value="${student.id}">${student.roll_number} • ${student.first_name} ${student.last_name} (${student.class_name || 'Unassigned'})</option>
    `).join('')}
  `;
}

function filterStudentDirectory() {
  const term = studentSearchInput.value.trim().toLowerCase();
  const filtered = state.students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return (
      fullName.includes(term) ||
      student.roll_number.toLowerCase().includes(term) ||
      (student.class_name || '').toLowerCase().includes(term)
    );
  });
  renderStudentDirectory(filtered);
}

async function loadGradesForStudent(studentId) {
  if (!studentId) {
    state.gradeRecords = [];
    updateDashboardCards();
    renderGradeRecords([]);
    return;
  }

  try {
    const response = await apiRequest(`/grades/student/${studentId}`);
    state.gradeRecords = response.data;
    renderGradeRecords(response.data);
    updateDashboardCards();
  } catch (error) {
    showToast(`Failed to load grades: ${error.message}`, 'error');
    state.gradeRecords = [];
    updateDashboardCards();
    renderGradeRecords([]);
  }
}

function updateDashboardCards() {
  document.getElementById('totalStudentsCount').textContent = state.students.length;
  document.getElementById('classesTodayCount').textContent = state.classes.length;
  document.getElementById('pendingActionsCount').textContent = state.gradeRecords.length || 0;
  document.getElementById('attendanceRateCount').textContent = state.students.length ? '94.2%' : '0%';
}

async function loadClasses() {
  try {
    const response = await apiRequest('/classes');
    state.classes = response.data;

    if (!state.classes.length) {
      elements.attendanceClass.innerHTML = '<option value="">No classes assigned</option>';
      elements.newStudentClass.innerHTML = '<option value="">No classes available</option>';
      return;
    }

    elements.attendanceClass.innerHTML = state.classes.map(classItem => `
      <option value="${classItem.id}">${classItem.name}</option>
    `).join('');

    elements.newStudentClass.innerHTML = `
      <option value="">Select class</option>
      ${state.classes.map(classItem => `
        <option value="${classItem.id}">${classItem.name} - Section ${classItem.section}</option>
      `).join('')}
    `;
  } catch (error) {
    showToast(`Unable to load classes: ${error.message}`, 'error');
  }
}

async function loadStudents() {
  try {
    const response = await apiRequest('/students');
    state.students = response.data;
    renderStudentDirectory(state.students);
    populateGradeStudentSelect(state.students);
  } catch (error) {
    showToast(`Unable to load student data: ${error.message}`, 'error');
  }
}

async function createStudent(event) {
  event.preventDefault();

  if (getCurrentRole() !== 'admin') {
    showToast('Only admins can add students.', 'error');
    return;
  }

  const payload = {
    username: document.getElementById('newStudentUsername').value.trim(),
    password: document.getElementById('newStudentPassword').value.trim(),
    first_name: document.getElementById('newStudentFirstName').value.trim(),
    last_name: document.getElementById('newStudentLastName').value.trim(),
    roll_number: document.getElementById('newStudentRollNumber').value.trim(),
    class_id: Number(elements.newStudentClass.value),
    gender: document.getElementById('newStudentGender').value || null,
    date_of_birth: document.getElementById('newStudentDateOfBirth').value || null,
    email: document.getElementById('newStudentEmail').value.trim() || null,
    phone_number: document.getElementById('newStudentPhone').value.trim() || null
  };

  try {
    elements.createStudentButton.disabled = true;
    elements.createStudentButton.textContent = 'Adding...';

    const response = await apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    elements.studentCreateForm.reset();
    const createdUsername = response.data?.username || response.data?.user_id || '';
    showToast(`Student added — username: ${createdUsername}`, 'success');
    await loadStudents();
    updateDashboardCards();
  } catch (error) {
    showToast(`Unable to add student: ${error.message}`, 'error');
  } finally {
    elements.createStudentButton.disabled = false;
    elements.createStudentButton.textContent = 'Add Student';
  }
}

async function initializeAppData() {
  await loadClasses();
  await loadStudents();
  updateDashboardCards();

  if (elements.attendanceClass.value) {
    await loadAttendanceStudents();
  }

  if (gradeStudentSelect.value) {
    await loadGradesForStudent(gradeStudentSelect.value);
  }
}

function showLoginScreen() {
  loginScreen.style.display = 'flex';
}

function hideLoginScreen() {
  loginScreen.style.display = 'none';
}

function clearLoginForm() {
  loginUsername.value = '';
  loginPassword.value = '';
  loginError.textContent = '';
}

async function login(event) {
  event.preventDefault();
  loginError.textContent = '';

  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  if (!username || !password) {
    loginError.textContent = 'Username and password are required.';
    return;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      loginError.textContent = data.message || 'Invalid username or password.';
      return;
    }

    state.authToken = data.data.token;
    state.currentUser = data.data.user;
    localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, state.authToken);
    localStorage.setItem(CONFIG.AUTH_USER_KEY, JSON.stringify(state.currentUser));

    hideLoginScreen();
    clearLoginForm();
    updateRoleUI();
    await initializeAppData();
    navigateTo('dashboard');
    showToast(`Welcome back, ${state.currentUser.username}!`, 'success');
  } catch (error) {
    loginError.textContent = 'Unable to sign in. Please try again.';
    console.error('Login error:', error);
  }
}

function logout() {
  localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
  localStorage.removeItem(CONFIG.AUTH_USER_KEY);
  state.authToken = null;
  state.currentUser = null;
  updateRoleUI();
  showLoginScreen();
  showToast('Logged out successfully.', 'info');
}

function initEventListeners() {
  elements.hamburgerBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('open');
  });

  elements.sidebarClose.addEventListener('click', () => {
    elements.sidebar.classList.remove('open');
  });

  document.addEventListener('click', (event) => {
    if (window.innerWidth <= 768) {
      const isInsideSidebar = elements.sidebar.contains(event.target);
      const isHamburger = elements.hamburgerBtn.contains(event.target);
      if (!isInsideSidebar && !isHamburger) {
        elements.sidebar.classList.remove('open');
      }
    }
  });

  elements.navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = link.getAttribute('data-page');
      navigateTo(page);
    });
  });

  document.querySelectorAll('.action-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      navigateTo(page);
    });
  });

  if (elements.quickAttendance) {
    elements.quickAttendance.addEventListener('click', () => navigateTo('attendance'));
  }

  if (elements.submitAttendance) {
    elements.submitAttendance.addEventListener('click', submitAttendanceData);
  }

  if (elements.studentCreateForm) {
    elements.studentCreateForm.addEventListener('submit', createStudent);
  }

  const loadAttendanceButton = document.getElementById('loadAttendance');
  if (loadAttendanceButton) {
    loadAttendanceButton.addEventListener('click', loadAttendanceStudents);
  }

  const cancelAttendanceButton = document.getElementById('cancelAttendance');
  if (cancelAttendanceButton) {
    cancelAttendanceButton.addEventListener('click', () => {
      if (elements.attendanceClass.value) {
        loadAttendanceStudents();
      }
    });
  }

  if (elements.attendanceClass) {
    elements.attendanceClass.addEventListener('change', loadAttendanceStudents);
  }

  if (elements.attendanceDate) {
    elements.attendanceDate.addEventListener('change', loadAttendanceStudents);
  }

  if (gradeStudentSelect) {
    gradeStudentSelect.addEventListener('change', () => loadGradesForStudent(gradeStudentSelect.value));
  }

  if (studentSearchInput) {
    studentSearchInput.addEventListener('input', filterStudentDirectory);
  }

  if (elements.btnLogout) {
    elements.btnLogout.addEventListener('click', logout);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', login);
  }
}

async function init() {
  if (elements.attendanceDate) {
    elements.attendanceDate.value = getTodayDate();
  }

  initEventListeners();

  if (state.authToken) {
    if (!state.currentUser) {
      logout();
      navigateTo('dashboard');
      return;
    }

    try {
      updateRoleUI();
      await initializeAppData();
      hideLoginScreen();
    } catch (error) {
      logout();
      showLoginScreen();
    }
  } else {
    updateRoleUI();
    showLoginScreen();
  }

  navigateTo('dashboard');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

const style = document.createElement('style');
style.textContent = `
  .spinner {
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
