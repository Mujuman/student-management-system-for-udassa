/**
 * Teacher Portal JavaScript
 * Handles all teacher-specific functionality
 */

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
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
  grades: [],
  selectedStudentId: null,
  selectedClassId: null,
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
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  btnLogout: document.getElementById('btnLogout'),
  sidebarUserInitials: document.getElementById('sidebarUserInitials'),
  sidebarUserName: document.getElementById('sidebarUserName'),
  sidebarUserRole: document.getElementById('sidebarUserRole'),
  attendanceClass: document.getElementById('attendanceClass'),
  attendanceDate: document.getElementById('attendanceDate'),
  attendanceTableBody: document.getElementById('attendanceTableBody'),
  loadAttendance: document.getElementById('loadAttendance'),
  submitAttendance: document.getElementById('submitAttendance'),
  gradeStudentSelect: document.getElementById('gradeStudentSelect'),
  gradesTableBody: document.getElementById('gradesTableBody'),
  studentsGrid: document.getElementById('studentsGrid'),
  gradeModal: document.getElementById('gradeModal'),
  gradeForm: document.getElementById('gradeForm'),
};

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
    console.error('API Response Parse Error:', error);
    throw new Error('Unexpected API response.');
  }

  if (!response.ok) {
    console.error('API Error:', {
      endpoint,
      status: response.status,
      payload
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    
    let errorMessage = 'API request failed';
    if (payload.message) {
      errorMessage = payload.message;
    } else if (payload.errors && Array.isArray(payload.errors)) {
      errorMessage = payload.errors.map(e => e.msg || e.message).join(', ');
    }
    
    throw new Error(errorMessage);
  }

  return payload;
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(pageName) {
  elements.dashboardPage.style.display = 'none';
  elements.attendancePage.style.display = 'none';
  elements.gradesPage.style.display = 'none';
  elements.studentsPage.style.display = 'none';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  switch (pageName) {
    case 'dashboard':
      elements.dashboardPage.style.display = 'block';
      elements.pageTitle.textContent = 'Teacher Dashboard';
      elements.pageSubtitle.textContent = 'Welcome back! Manage your classes and students.';
      break;
    case 'attendance':
      elements.attendancePage.style.display = 'block';
      elements.pageTitle.textContent = 'Attendance Management';
      elements.pageSubtitle.textContent = 'Mark daily attendance for your classes.';
      break;
    case 'grades':
      elements.gradesPage.style.display = 'block';
      elements.pageTitle.textContent = 'Grade Management';
      elements.pageSubtitle.textContent = 'View and manage student grades.';
      loadGradesPage();
      break;
    case 'students':
      elements.studentsPage.style.display = 'block';
      elements.pageTitle.textContent = 'Student Directory';
      elements.pageSubtitle.textContent = 'View and manage your assigned students.';
      loadStudentsPage();
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
// AUTHENTICATION
// ==========================================
function logout() {
  localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
  localStorage.removeItem(CONFIG.AUTH_USER_KEY);
  window.location.href = 'login.html';
}

function checkAuth() {
  if (!state.authToken || !state.currentUser) {
    logout();
    return false;
  }
  
  if (state.currentUser.role !== 'teacher') {
    logout();
    return false;
  }
  
  return true;
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadClasses() {
  try {
    const response = await apiRequest('/classes');
    state.classes = response.data || [];

    // Populate class dropdowns
    const classOptions = state.classes.map(cls => 
      `<option value="${cls.id}">${cls.class_name} - Section ${cls.section}</option>`
    ).join('');

    if (elements.attendanceClass) {
      elements.attendanceClass.innerHTML = '<option value="">Choose a class</option>' + classOptions;
    }

    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
      classFilter.innerHTML = '<option value="">All Classes</option>' + classOptions;
    }

    // Update dashboard stats
    const assignedClassesEl = document.getElementById('assignedClasses');
    if (assignedClassesEl) assignedClassesEl.textContent = state.classes.length;

  } catch (error) {
    console.error('Error loading classes:', error);
    showToast('Error loading classes: ' + error.message, 'error');
  }
}

async function loadStudents() {
  try {
    const response = await apiRequest('/students');
    state.students = response.data || [];

    // Update dashboard stats
    const assignedStudentsEl = document.getElementById('assignedStudents');
    const totalStudentsEl = document.getElementById('totalStudents');
    if (assignedStudentsEl) assignedStudentsEl.textContent = state.students.length;
    if (totalStudentsEl) totalStudentsEl.textContent = state.students.length;

    // Populate student dropdown for grades
    const studentOptions = state.students.map(student =>
      `<option value="${student.id}">${student.roll_number} - ${student.first_name} ${student.last_name} (${student.class_name || 'Unassigned'})</option>`
    ).join('');

    if (elements.gradeStudentSelect) {
      elements.gradeStudentSelect.innerHTML = '<option value="">Choose a student</option>' + studentOptions;
    }

  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Error loading students: ' + error.message, 'error');
  }
}

async function loadDashboardData() {
  try {
    // Update welcome message
    const welcomeName = document.getElementById('teacherWelcomeName');
    if (welcomeName && state.currentUser) {
      welcomeName.textContent = state.currentUser.username;
    }

    // Update sidebar
    if (elements.sidebarUserInitials && state.currentUser) {
      elements.sidebarUserInitials.textContent = state.currentUser.username.charAt(0).toUpperCase();
    }
    if (elements.sidebarUserName && state.currentUser) {
      elements.sidebarUserName.textContent = state.currentUser.username;
    }
    if (elements.sidebarUserRole) {
      elements.sidebarUserRole.textContent = 'Teacher';
    }

    // Set today's date
    if (elements.attendanceDate) {
      elements.attendanceDate.value = getTodayDate();
    }

    // Load classes and students
    await loadClasses();
    await loadStudents();

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Error loading dashboard data: ' + error.message, 'error');
  }
}

// ==========================================
// ATTENDANCE MANAGEMENT
// ==========================================
async function loadAttendanceStudents() {
  const classId = elements.attendanceClass.value;
  const date = elements.attendanceDate.value;

  if (!classId || !date) {
    elements.attendanceTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Select a class and date to load students</td></tr>';
    return;
  }

  try {
    // Load students for the selected class
    const studentsResponse = await apiRequest(`/students?classId=${classId}`);
    const students = studentsResponse.data || [];

    // Load existing attendance for the date
    let attendance = [];
    try {
      const attendanceResponse = await apiRequest(`/attendance/class/${classId}/date/${date}`);
      attendance = attendanceResponse.data || [];
    } catch (error) {
      // No attendance yet for this date
      console.log('No existing attendance for this date');
    }

    // Create a map of student attendance
    const attendanceMap = new Map(attendance.map(a => [a.student_id, a]));

    // Render attendance table
    if (students.length === 0) {
      elements.attendanceTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No students found for this class</td></tr>';
      return;
    }

    elements.attendanceTableBody.innerHTML = students.map(student => {
      const existingAttendance = attendanceMap.get(student.id);
      const status = existingAttendance ? existingAttendance.status : 'Present';
      const remarks = existingAttendance ? existingAttendance.remarks || '' : '';

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

  } catch (error) {
    console.error('Error loading attendance students:', error);
    showToast('Error loading students: ' + error.message, 'error');
    elements.attendanceTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Error loading students</td></tr>';
  }
}

async function submitAttendance() {
  const classId = elements.attendanceClass.value;
  const date = elements.attendanceDate.value;

  if (!classId || !date) {
    showToast('Please select a class and date', 'error');
    return;
  }

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

  try {
    elements.submitAttendance.disabled = true;
    elements.submitAttendance.innerHTML = 'Submitting...';

    await apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify({ attendanceRecords }),
    });

    showToast('Attendance submitted successfully!', 'success');

  } catch (error) {
    console.error('Error submitting attendance:', error);
    showToast('Error submitting attendance: ' + error.message, 'error');
  } finally {
    elements.submitAttendance.disabled = false;
    elements.submitAttendance.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
      Submit Attendance
    `;
  }
}

// ==========================================
// GRADES MANAGEMENT
// ==========================================
async function loadGradesPage() {
  // Load grades for selected student if any
  if (state.selectedStudentId) {
    await loadStudentGrades(state.selectedStudentId);
  }
}

async function loadStudentGrades(studentId) {
  if (!studentId) {
    elements.gradesTableBody.innerHTML = '<tr><td colspan="10" class="empty-state">Select a student to view their grades</td></tr>';
    return;
  }

  try {
    const response = await apiRequest(`/grades/student/${studentId}`);
    const grades = response.data || [];

    if (grades.length === 0) {
      elements.gradesTableBody.innerHTML = '<tr><td colspan="10" class="empty-state">No grades found for this student</td></tr>';
      return;
    }

    elements.gradesTableBody.innerHTML = grades.map(grade => `
      <tr>
        <td>${grade.subject_name}</td>
        <td>${parseFloat(grade.quiz_mark || 0).toFixed(1)}</td>
        <td>${parseFloat(grade.assignment_mark || 0).toFixed(1)}</td>
        <td>${parseFloat(grade.exam_mark || 0).toFixed(1)}</td>
        <td>${parseFloat(grade.total_mark || 0).toFixed(1)}</td>
        <td>${parseFloat(grade.percentage || 0).toFixed(1)}%</td>
        <td><span class="grade-badge grade-${grade.grade_letter}">${grade.grade_letter}</span></td>
        <td>${grade.semester}</td>
        <td>${grade.academic_year}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-sm btn-secondary" onclick="editGrade(${grade.id})">Edit</button>
            <button class="btn-sm btn-danger" onclick="deleteGrade(${grade.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading grades:', error);
    showToast('Error loading grades: ' + error.message, 'error');
  }
}

function openGradeModal(gradeId = null) {
  elements.gradeModal.style.display = 'flex';
  
  if (gradeId) {
    // Load existing grade data
    // TODO: Implement edit functionality
  } else {
    // Clear form for new grade
    elements.gradeForm.reset();
  }
}

function closeGradeModal() {
  elements.gradeModal.style.display = 'none';
}

async function saveGrade(event) {
  event.preventDefault();
  
  if (!state.selectedStudentId) {
    showToast('Please select a student first', 'error');
    return;
  }

  const formData = new FormData(elements.gradeForm);
  const gradeData = {
    student_id: state.selectedStudentId,
    subject_name: formData.get('subject'),
    quiz_mark: formData.get('quizMark') || 0,
    assignment_mark: formData.get('assignmentMark') || 0,
    exam_mark: formData.get('examMark') || 0,
    semester: formData.get('semester'),
    academic_year: formData.get('year'),
  };

  try {
    await apiRequest('/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });

    showToast('Grade saved successfully!', 'success');
    closeGradeModal();
    await loadStudentGrades(state.selectedStudentId);

  } catch (error) {
    console.error('Error saving grade:', error);
    showToast('Error saving grade: ' + error.message, 'error');
  }
}

// ==========================================
// STUDENTS MANAGEMENT
// ==========================================
async function loadStudentsPage() {
  renderStudentsGrid(state.students);
}

function renderStudentsGrid(students) {
  if (!students || students.length === 0) {
    elements.studentsGrid.innerHTML = '<div class="empty-state">No students found</div>';
    return;
  }

  elements.studentsGrid.innerHTML = students.map(student => `
    <div class="student-card">
      <div class="student-card-header">
        <div class="student-avatar-large">
          ${student.first_name.charAt(0)}${student.last_name.charAt(0)}
        </div>
        <div class="student-info">
          <h4>${student.first_name} ${student.last_name}</h4>
          <p class="student-roll">Roll: ${student.roll_number}</p>
          <p class="student-class">${student.class_name || 'Unassigned'}</p>
        </div>
      </div>
      <div class="student-card-body">
        <div class="student-detail">
          <span class="detail-label">Gender:</span>
          <span class="detail-value">${student.gender || '-'}</span>
        </div>
        <div class="student-detail">
          <span class="detail-label">Status:</span>
          <span class="status-badge status-${(student.status || 'active').toLowerCase()}">${student.status || 'Active'}</span>
        </div>
        <div class="student-detail">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${student.email || 'Not provided'}</span>
        </div>
      </div>
      <div class="student-card-actions">
        <button class="btn-sm btn-primary" onclick="viewStudentGrades(${student.id})">View Grades</button>
        <button class="btn-sm btn-secondary" onclick="viewStudentAttendance(${student.id})">Attendance</button>
      </div>
    </div>
  `).join('');
}

function filterStudents() {
  const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
  const classFilter = document.getElementById('classFilter').value;
  
  let filtered = state.students;
  
  if (searchTerm) {
    filtered = filtered.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      return fullName.includes(searchTerm) || student.roll_number.toLowerCase().includes(searchTerm);
    });
  }
  
  if (classFilter) {
    filtered = filtered.filter(student => student.class_id == classFilter);
  }
  
  renderStudentsGrid(filtered);
}

function viewStudentGrades(studentId) {
  state.selectedStudentId = studentId;
  elements.gradeStudentSelect.value = studentId;
  navigateTo('grades');
}

function viewStudentAttendance(studentId) {
  // TODO: Implement attendance view for specific student
  showToast('Attendance view not implemented yet', 'info');
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function initEventListeners() {
  // Sidebar toggle
  if (elements.hamburgerBtn) {
    elements.hamburgerBtn.addEventListener('click', () => {
      elements.sidebar.classList.toggle('open');
    });
  }

  if (elements.sidebarClose) {
    elements.sidebarClose.addEventListener('click', () => {
      elements.sidebar.classList.remove('open');
    });
  }

  // Navigation
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = link.getAttribute('data-page');
      navigateTo(page);
    });
  });

  // Logout
  if (elements.btnLogout) {
    elements.btnLogout.addEventListener('click', logout);
  }

  // Attendance
  if (elements.loadAttendance) {
    elements.loadAttendance.addEventListener('click', loadAttendanceStudents);
  }

  if (elements.submitAttendance) {
    elements.submitAttendance.addEventListener('click', submitAttendance);
  }

  if (elements.attendanceClass) {
    elements.attendanceClass.addEventListener('change', loadAttendanceStudents);
  }

  if (elements.attendanceDate) {
    elements.attendanceDate.addEventListener('change', loadAttendanceStudents);
  }

  // Grades
  if (elements.gradeStudentSelect) {
    elements.gradeStudentSelect.addEventListener('change', (e) => {
      state.selectedStudentId = e.target.value;
      loadStudentGrades(e.target.value);
    });
  }

  // Grade modal
  const addGradeBtn = document.getElementById('addGradeBtn');
  if (addGradeBtn) {
    addGradeBtn.addEventListener('click', () => openGradeModal());
  }

  const closeGradeModalBtn = document.getElementById('closeGradeModal');
  const cancelGradeBtn = document.getElementById('cancelGrade');
  if (closeGradeModalBtn) closeGradeModalBtn.addEventListener('click', closeGradeModal);
  if (cancelGradeBtn) cancelGradeBtn.addEventListener('click', closeGradeModal);

  if (elements.gradeForm) {
    elements.gradeForm.addEventListener('submit', saveGrade);
  }

  // Students search and filter
  const studentSearch = document.getElementById('studentSearch');
  const classFilter = document.getElementById('classFilter');
  if (studentSearch) studentSearch.addEventListener('input', filterStudents);
  if (classFilter) classFilter.addEventListener('change', filterStudents);

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (event) => {
    if (window.innerWidth <= 768) {
      const isInsideSidebar = elements.sidebar.contains(event.target);
      const isHamburger = elements.hamburgerBtn?.contains(event.target);
      if (!isInsideSidebar && !isHamburger) {
        elements.sidebar.classList.remove('open');
      }
    }
  });

  // Close modal on outside click
  if (elements.gradeModal) {
    elements.gradeModal.addEventListener('click', (event) => {
      if (event.target === elements.gradeModal) {
        closeGradeModal();
      }
    });
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  console.log('Teacher Portal initialized');
  
  // Check authentication
  if (!checkAuth()) {
    return;
  }

  try {
    // Initialize event listeners
    initEventListeners();

    // Load dashboard data
    await loadDashboardData();

    // Navigate to dashboard
    navigateTo('dashboard');

    showToast(`Welcome back, ${state.currentUser.username}!`, 'success');

  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Error initializing application: ' + error.message, 'error');
  }
}

// Global functions for inline handlers
window.editGrade = (gradeId) => openGradeModal(gradeId);
window.deleteGrade = async (gradeId) => {
  if (confirm('Are you sure you want to delete this grade?')) {
    try {
      await apiRequest(`/grades/${gradeId}`, { method: 'DELETE' });
      showToast('Grade deleted successfully!', 'success');
      await loadStudentGrades(state.selectedStudentId);
    } catch (error) {
      showToast('Error deleting grade: ' + error.message, 'error');
    }
  }
};
window.viewStudentGrades = viewStudentGrades;
window.viewStudentAttendance = viewStudentAttendance;

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}