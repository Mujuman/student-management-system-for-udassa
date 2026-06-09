
/**
 * Admin Portal JavaScript
 * Handles all admin-specific functionality including CRUD operations
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
  students: [],
  teachers: [],
  classes: [],
  attendance: [],
  grades: [],
  editingId: null,
  editingType: null,
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
  studentsPage: document.getElementById('studentsPage'),
  teachersPage: document.getElementById('teachersPage'),
  classesPage: document.getElementById('classesPage'),
  attendancePage: document.getElementById('attendancePage'),
  gradesPage: document.getElementById('gradesPage'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  btnLogout: document.getElementById('btnLogout'),
  sidebarUserInitials: document.getElementById('sidebarUserInitials'),
  sidebarUserName: document.getElementById('sidebarUserName'),
  sidebarUserRole: document.getElementById('sidebarUserRole'),
  
  // Student elements
  studentForm: document.getElementById('studentForm'),
  studentsTableBody: document.getElementById('studentsTableBody'),
  studentSearch: document.getElementById('studentSearch'),
  studentClassFilter: document.getElementById('studentClassFilter'),
  
  // Teacher elements
  teacherForm: document.getElementById('teacherForm'),
  teachersTableBody: document.getElementById('teachersTableBody'),
  teacherSearch: document.getElementById('teacherSearch'),
  
  // Class elements
  classForm: document.getElementById('classForm'),
  classesTableBody: document.getElementById('classesTableBody'),
  classSearch: document.getElementById('classSearch'),
  
  // Attendance elements
  attendanceReportTableBody: document.getElementById('attendanceReportTableBody'),
  attendanceReportClass: document.getElementById('attendanceReportClass'),
  attendanceFromDate: document.getElementById('attendanceFromDate'),
  attendanceToDate: document.getElementById('attendanceToDate'),
  loadAttendanceReport: document.getElementById('loadAttendanceReport'),
  
  // Grades elements
  gradesReportTableBody: document.getElementById('gradesReportTableBody'),
  gradesReportClass: document.getElementById('gradesReportClass'),
  gradesReportSemester: document.getElementById('gradesReportSemester'),
  loadGradesReport: document.getElementById('loadGradesReport'),
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

function getInitials(firstName, lastName) {
  const firstInitial = firstName && firstName.length ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName && lastName.length ? lastName.charAt(0).toUpperCase() : '';
  return (firstInitial || lastInitial) ? `${firstInitial}${lastInitial}` : 'NA';
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

function generateUsername(firstName, lastName) {
  return (firstName + '_' + lastName).toLowerCase().replace(/[^a-z_]/g, '');
}

// ==========================================
// NAVIGATION
// ==========================================
function navigateTo(pageName) {
  // Hide all pages
  Object.keys(elements).forEach(key => {
    if (key.endsWith('Page') && elements[key]) {
      elements[key].style.display = 'none';
    }
  });

  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  // Show selected page and update header
  switch (pageName) {
    case 'dashboard':
      elements.dashboardPage.style.display = 'block';
      elements.pageTitle.textContent = 'Administrator Dashboard';
      elements.pageSubtitle.textContent = 'Manage your school\'s operations efficiently.';
      loadDashboardData();
      break;
    case 'students':
      elements.studentsPage.style.display = 'block';
      elements.pageTitle.textContent = 'Student Management';
      elements.pageSubtitle.textContent = 'Add, edit, and manage student records.';
      loadStudentsData();
      break;
    case 'teachers':
      elements.teachersPage.style.display = 'block';
      elements.pageTitle.textContent = 'Teacher Management';
      elements.pageSubtitle.textContent = 'Add, edit, and manage teacher records.';
      loadTeachersData();
      break;
    case 'classes':
      elements.classesPage.style.display = 'block';
      elements.pageTitle.textContent = 'Class Management';
      elements.pageSubtitle.textContent = 'Manage classes and sections.';
      loadClassesData();
      break;
    case 'attendance':
      elements.attendancePage.style.display = 'block';
      elements.pageTitle.textContent = 'Attendance Reports';
      elements.pageSubtitle.textContent = 'View and manage attendance records.';
      break;
    case 'grades':
      elements.gradesPage.style.display = 'block';
      elements.pageTitle.textContent = 'Grades Overview';
      elements.pageSubtitle.textContent = 'Monitor student academic performance.';
      break;
  }

  // Add active class to current nav item
  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.closest('.nav-item').classList.add('active');
  }

  // Close sidebar on mobile
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
  
  if (state.currentUser.role !== 'admin') {
    logout();
    return false;
  }
  
  return true;
}

// ==========================================
// DASHBOARD DATA
// ==========================================
async function loadDashboardData() {
  try {
    // Load all data for dashboard stats
    await Promise.all([
      loadStudentsData(),
      loadTeachersData(),
      loadClassesData(),
    ]);

    // Update dashboard statistics
    updateDashboardStats();

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Error loading dashboard data: ' + error.message, 'error');
  }
}

function updateDashboardStats() {
  // Update total counts
  const totalStudentsEl = document.getElementById('totalStudents');
  const totalTeachersEl = document.getElementById('totalTeachers');
  const totalClassesEl = document.getElementById('totalClasses');
  
  if (totalStudentsEl) totalStudentsEl.textContent = state.students.length;
  if (totalTeachersEl) totalTeachersEl.textContent = state.teachers.length;
  if (totalClassesEl) totalClassesEl.textContent = state.classes.length;

  // Update sidebar user info
  if (elements.sidebarUserInitials && state.currentUser) {
    elements.sidebarUserInitials.textContent = getInitials(state.currentUser.username || '', '');
  }
  if (elements.sidebarUserName && state.currentUser) {
    elements.sidebarUserName.textContent = state.currentUser.username || 'Administrator';
  }
  if (elements.sidebarUserRole) {
    elements.sidebarUserRole.textContent = 'Administrator';
  }
}

// ==========================================
// STUDENT MANAGEMENT
// ==========================================
async function loadStudentsData() {
  try {
    const response = await apiRequest('/students');
    state.students = response.data || [];
    renderStudentsTable();
    populateStudentClassFilter();
  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Error loading students: ' + error.message, 'error');
  }
}

function renderStudentsTable(studentsToRender = state.students) {
  if (!elements.studentsTableBody) return;

  if (studentsToRender.length === 0) {
    elements.studentsTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No students found</td></tr>';
    return;
  }

  elements.studentsTableBody.innerHTML = studentsToRender.map(student => `
    <tr>
      <td>
        <div class="student-avatar">
          ${getInitials(student.first_name, student.last_name)}
        </div>
      </td>
      <td>${student.first_name || 'N/A'} ${student.last_name || ''}</td>
      <td>${student.roll_number}</td>
      <td>${student.class_name || 'Unassigned'}</td>
      <td>${student.email || 'Not provided'}</td>
      <td>${student.username}</td>
      <td class="admin-only-column action-buttons-cell">
        <button class="btn-icon btn-edit" onclick="editStudent(${student.id})" title="Edit Student">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="btn-icon btn-delete" onclick="deleteStudent(${student.id})" title="Delete Student">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

async function submitStudent(event) {
  event.preventDefault();
  
  const formData = new FormData(elements.studentForm);
  const studentData = {
    first_name: document.getElementById('studentFirstName').value.trim(),
    last_name: document.getElementById('studentLastName').value.trim(),
    email: document.getElementById('studentEmail').value.trim(),
    phone_number: document.getElementById('studentPhone').value.trim(),
    date_of_birth: document.getElementById('studentDOB').value,
    gender: document.getElementById('studentGender').value,
    roll_number: document.getElementById('studentRoll').value.trim(),
    class_id: document.getElementById('studentClass').value || null,
    username: document.getElementById('studentUsername').value.trim(),
    password: document.getElementById('studentPassword').value.trim(),
  };

  // Validate required fields
  if (!studentData.first_name || !studentData.last_name || !studentData.roll_number || !studentData.username || !studentData.password) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    if (state.editingId && state.editingType === 'student') {
      // Update existing student
      delete studentData.password; // Don't update password in edit mode
      await apiRequest(`/students/${state.editingId}`, {
        method: 'PUT',
        body: JSON.stringify(studentData),
      });
      showToast('Student updated successfully!', 'success');
    } else {
      // Create new student
      await apiRequest('/students', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
      showToast('Student created successfully!', 'success');
    }

    clearStudentForm();
    await loadStudentsData();

  } catch (error) {
    console.error('Error saving student:', error);
    showToast('Error saving student: ' + error.message, 'error');
  }
}

function clearStudentForm() {
  elements.studentForm.reset();
  state.editingId = null;
  state.editingType = null;
  
  // Reset form button text
  const submitBtn = elements.studentForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Save Student';
  }
}

async function editStudent(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  // Populate form with student data
  document.getElementById('studentFirstName').value = student.first_name;
  document.getElementById('studentLastName').value = student.last_name;
  document.getElementById('studentEmail').value = student.email || '';
  document.getElementById('studentPhone').value = student.phone_number || '';
  document.getElementById('studentDOB').value = student.date_of_birth || '';
  document.getElementById('studentGender').value = student.gender || '';
  document.getElementById('studentRoll').value = student.roll_number;
  document.getElementById('studentClass').value = student.class_id || '';
  document.getElementById('studentUsername').value = student.username;
  
  // Hide password field in edit mode
  const passwordField = document.getElementById('studentPassword');
  const passwordParent = passwordField.closest('.form-field');
  if (passwordParent) {
    passwordParent.style.display = 'none';
  }

  // Update form state
  state.editingId = studentId;
  state.editingType = 'student';
  
  // Update button text
  const submitBtn = elements.studentForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Update Student';
  }
}

async function deleteStudent(studentId) {
  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
    return;
  }

  try {
    await apiRequest(`/students/${studentId}`, {
      method: 'DELETE',
    });
    
    showToast('Student deleted successfully!', 'success');
    await loadStudentsData();

  } catch (error) {
    console.error('Error deleting student:', error);
    showToast('Error deleting student: ' + error.message, 'error');
  }
}

function filterStudents() {
  const searchTerm = elements.studentSearch.value.toLowerCase();
  const classFilter = elements.studentClassFilter.value;
  
  let filtered = state.students;
  
  if (searchTerm) {
    filtered = filtered.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      return fullName.includes(searchTerm) || 
             student.roll_number.toLowerCase().includes(searchTerm) ||
             (student.email && student.email.toLowerCase().includes(searchTerm));
    });
  }
  
  if (classFilter) {
    filtered = filtered.filter(student => student.class_id == classFilter);
  }
  
  renderStudentsTable(filtered);
}

function populateStudentClassFilter() {
  if (!elements.studentClassFilter) return;
  
  const classOptions = state.classes.map(cls => 
    `<option value="${cls.id}">${cls.class_name} - Section ${cls.section || ''}</option>`
  ).join('');
  
  elements.studentClassFilter.innerHTML = '<option value="">All Classes</option>' + classOptions;
  
  // Also populate the class dropdown in the form
  const studentClassSelect = document.getElementById('studentClass');
  if (studentClassSelect) {
    studentClassSelect.innerHTML = '<option value="">Select Class</option>' + classOptions;
  }
}

// ==========================================
// TEACHER MANAGEMENT
// ==========================================
async function loadTeachersData() {
  try {
    const response = await apiRequest('/teachers');
    state.teachers = response.data || [];
    renderTeachersTable();
  } catch (error) {
    console.error('Error loading teachers:', error);
    showToast('Error loading teachers: ' + error.message, 'error');
  }
}

function renderTeachersTable(teachersToRender = state.teachers) {
  if (!elements.teachersTableBody) return;

  if (teachersToRender.length === 0) {
    elements.teachersTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No teachers found</td></tr>';
    return;
  }

  elements.teachersTableBody.innerHTML = teachersToRender.map(teacher => `
    <tr>
      <td>
        <div class="student-avatar">
          ${getInitials(teacher.first_name, teacher.last_name)}
        </div>
      </td>
      <td>${teacher.first_name || 'N/A'} ${teacher.last_name || ''}</td>
      <td>${teacher.email}</td>
      <td>${teacher.subject_specialization || 'Not specified'}</td>
      <td>${teacher.username}</td>
      <td>${teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'Not specified'}</td>
      <td class="admin-only-column action-buttons-cell">
        <button class="btn-icon btn-edit" onclick="editTeacher(${teacher.id})" title="Edit Teacher">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="btn-icon btn-delete" onclick="deleteTeacher(${teacher.id})" title="Delete Teacher">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

async function submitTeacher(event) {
  event.preventDefault();
  
  const teacherData = {
    first_name: document.getElementById('teacherFirstName').value.trim(),
    last_name: document.getElementById('teacherLastName').value.trim(),
    email: document.getElementById('teacherEmail').value.trim(),
    phone_number: document.getElementById('teacherPhone').value.trim(),
    subject_specialization: document.getElementById('teacherSubject').value.trim(),
    hire_date: document.getElementById('teacherHireDate').value,
    username: document.getElementById('teacherUsername').value.trim(),
    password: document.getElementById('teacherPassword').value.trim(),
  };

  // Validate required fields
  if (!teacherData.first_name || !teacherData.last_name || !teacherData.email || !teacherData.username || !teacherData.password) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    if (state.editingId && state.editingType === 'teacher') {
      // Update existing teacher
      delete teacherData.password; // Don't update password in edit mode
      await apiRequest(`/teachers/${state.editingId}`, {
        method: 'PUT',
        body: JSON.stringify(teacherData),
      });
      showToast('Teacher updated successfully!', 'success');
    } else {
      // Create new teacher
      await apiRequest('/teachers', {
        method: 'POST',
        body: JSON.stringify(teacherData),
      });
      showToast('Teacher created successfully!', 'success');
    }

    clearTeacherForm();
    await loadTeachersData();

  } catch (error) {
    console.error('Error saving teacher:', error);
    showToast('Error saving teacher: ' + error.message, 'error');
  }
}

function clearTeacherForm() {
  elements.teacherForm.reset();
  state.editingId = null;
  state.editingType = null;
  
  // Reset form button text
  const submitBtn = elements.teacherForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Save Teacher';
  }
  
  // Show password field
  const passwordField = document.getElementById('teacherPassword');
  const passwordParent = passwordField.closest('.form-field');
  if (passwordParent) {
    passwordParent.style.display = 'block';
  }
}

async function editTeacher(teacherId) {
  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) return;

  // Populate form with teacher data
  document.getElementById('teacherFirstName').value = teacher.first_name;
  document.getElementById('teacherLastName').value = teacher.last_name;
  document.getElementById('teacherEmail').value = teacher.email;
  document.getElementById('teacherPhone').value = teacher.phone_number || '';
  document.getElementById('teacherSubject').value = teacher.subject_specialization || '';
  document.getElementById('teacherHireDate').value = teacher.hire_date || '';
  document.getElementById('teacherUsername').value = teacher.username;
  
  // Hide password field in edit mode
  const passwordField = document.getElementById('teacherPassword');
  const passwordParent = passwordField.closest('.form-field');
  if (passwordParent) {
    passwordParent.style.display = 'none';
  }

  // Update form state
  state.editingId = teacherId;
  state.editingType = 'teacher';
  
  // Update button text
  const submitBtn = elements.teacherForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Update Teacher';
  }
}

async function deleteTeacher(teacherId) {
  if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
    return;
  }

  try {
    await apiRequest(`/teachers/${teacherId}`, {
      method: 'DELETE',
    });
    
    showToast('Teacher deleted successfully!', 'success');
    await loadTeachersData();

  } catch (error) {
    console.error('Error deleting teacher:', error);
    showToast('Error deleting teacher: ' + error.message, 'error');
  }
}

function filterTeachers() {
  const searchTerm = elements.teacherSearch.value.toLowerCase();
  
  let filtered = state.teachers;
  
  if (searchTerm) {
    filtered = filtered.filter(teacher => {
      const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
      return fullName.includes(searchTerm) || 
             teacher.email.toLowerCase().includes(searchTerm) ||
             (teacher.subject_specialization && teacher.subject_specialization.toLowerCase().includes(searchTerm));
    });
  }
  
  renderTeachersTable(filtered);
}

// ==========================================
// CLASS MANAGEMENT
// ==========================================
async function loadClassesData() {
  try {
    const response = await apiRequest('/classes');
    state.classes = response.data || [];
    renderClassesTable();
    populateClassTeacherDropdown();
    populateClassFilters();
  } catch (error) {
    console.error('Error loading classes:', error);
    showToast('Error loading classes: ' + error.message, 'error');
  }
}

function renderClassesTable(classesToRender = state.classes) {
  if (!elements.classesTableBody) return;

  if (classesToRender.length === 0) {
    elements.classesTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No classes found</td></tr>';
    return;
  }

  elements.classesTableBody.innerHTML = classesToRender.map(cls => `
    <tr>
      <td>${cls.class_name}</td>
      <td>${cls.section || '-'}</td>
      <td>${cls.academic_year}</td>
      <td>${cls.teacher_name || 'Not assigned'}</td>
      <td>${cls.student_count || 0}</td>
      <td class="admin-only-column action-buttons-cell">
        <button class="btn-icon btn-edit" onclick="editClass(${cls.id})" title="Edit Class">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="btn-icon btn-delete" onclick="deleteClass(${cls.id})" title="Delete Class">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

async function submitClass(event) {
  event.preventDefault();
  
  const classData = {
    class_name: document.getElementById('className').value.trim(),
    section: document.getElementById('classSection').value.trim(),
    academic_year: document.getElementById('classYear').value.trim(),
    teacher_id: document.getElementById('classTeacher').value || null,
  };

  // Validate required fields
  if (!classData.class_name || !classData.academic_year) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    if (state.editingId && state.editingType === 'class') {
      // Update existing class
      await apiRequest(`/classes/${state.editingId}`, {
        method: 'PUT',
        body: JSON.stringify(classData),
      });
      showToast('Class updated successfully!', 'success');
    } else {
      // Create new class
      await apiRequest('/classes', {
        method: 'POST',
        body: JSON.stringify(classData),
      });
      showToast('Class created successfully!', 'success');
    }

    clearClassForm();
    await loadClassesData();

  } catch (error) {
    console.error('Error saving class:', error);
    showToast('Error saving class: ' + error.message, 'error');
  }
}

function clearClassForm() {
  elements.classForm.reset();
  state.editingId = null;
  state.editingType = null;
  
  // Reset form button text
  const submitBtn = elements.classForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Save Class';
  }
}

async function editClass(classId) {
  const classData = state.classes.find(c => c.id === classId);
  if (!classData) return;

  // Populate form with class data
  document.getElementById('className').value = classData.class_name;
  document.getElementById('classSection').value = classData.section || '';
  document.getElementById('classYear').value = classData.academic_year;
  document.getElementById('classTeacher').value = classData.teacher_id || '';

  // Update form state
  state.editingId = classId;
  state.editingType = 'class';
  
  // Update button text
  const submitBtn = elements.classForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Update Class';
  }
}

async function deleteClass(classId) {
  if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
    return;
  }

  try {
    await apiRequest(`/classes/${classId}`, {
      method: 'DELETE',
    });
    
    showToast('Class deleted successfully!', 'success');
    await loadClassesData();

  } catch (error) {
    console.error('Error deleting class:', error);
    showToast('Error deleting class: ' + error.message, 'error');
  }
}

function filterClasses() {
  const searchTerm = elements.classSearch.value.toLowerCase();
  
  let filtered = state.classes;
  
  if (searchTerm) {
    filtered = filtered.filter(cls => {
      return cls.class_name.toLowerCase().includes(searchTerm) || 
             (cls.section && cls.section.toLowerCase().includes(searchTerm)) ||
             cls.academic_year.toLowerCase().includes(searchTerm) ||
             (cls.teacher_name && cls.teacher_name.toLowerCase().includes(searchTerm));
    });
  }
  
  renderClassesTable(filtered);
}

function populateClassTeacherDropdown() {
  const classTeacherSelect = document.getElementById('classTeacher');
  if (!classTeacherSelect) return;
  
  const teacherOptions = state.teachers.map(teacher => 
    `<option value="${teacher.id}">${teacher.first_name} ${teacher.last_name}</option>`
  ).join('');
  
  classTeacherSelect.innerHTML = '<option value="">Select Teacher</option>' + teacherOptions;
}

function populateClassFilters() {
  // Populate attendance report class filter
  if (elements.attendanceReportClass) {
    const classOptions = state.classes.map(cls => 
      `<option value="${cls.id}">${cls.class_name} - Section ${cls.section || ''}</option>`
    ).join('');
    elements.attendanceReportClass.innerHTML = '<option value="">All Classes</option>' + classOptions;
  }
  
  // Populate grades report class filter
  if (elements.gradesReportClass) {
    const classOptions = state.classes.map(cls => 
      `<option value="${cls.id}">${cls.class_name} - Section ${cls.section || ''}</option>`
    ).join('');
    elements.gradesReportClass.innerHTML = '<option value="">All Classes</option>' + classOptions;
  }
}

// ==========================================
// ATTENDANCE REPORTS
// ==========================================
async function loadAttendanceReport() {
  const classId = elements.attendanceReportClass.value;
  const fromDate = elements.attendanceFromDate.value;
  const toDate = elements.attendanceToDate.value;

  if (!fromDate || !toDate) {
    showToast('Please select both from and to dates', 'error');
    return;
  }

  try {
    let endpoint = `/attendance?from=${fromDate}&to=${toDate}`;
    if (classId) {
      endpoint += `&classId=${classId}`;
    }

    const response = await apiRequest(endpoint);
    const attendanceData = response.data || [];

    renderAttendanceReport(attendanceData);

  } catch (error) {
    console.error('Error loading attendance report:', error);
    showToast('Error loading attendance report: ' + error.message, 'error');
  }
}

function renderAttendanceReport(attendanceData) {
  if (!elements.attendanceReportTableBody) return;

  if (attendanceData.length === 0) {
    elements.attendanceReportTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No attendance records found for the selected criteria</td></tr>';
    return;
  }

  elements.attendanceReportTableBody.innerHTML = attendanceData.map(record => `
    <tr>
      <td>${new Date(record.date).toLocaleDateString()}</td>
      <td>${record.student_name}</td>
      <td>${record.class_name} - ${record.section || ''}</td>
      <td>
        <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
      </td>
      <td>${record.remarks || '-'}</td>
    </tr>
  `).join('');
}

// ==========================================
// GRADES REPORTS
// ==========================================
async function loadGradesReport() {
  const classId = elements.gradesReportClass.value;
  const semester = elements.gradesReportSemester.value;

  try {
    let endpoint = '/grades';
    const params = [];
    
    if (classId) params.push(`classId=${classId}`);
    if (semester) params.push(`semester=${semester}`);
    
    if (params.length > 0) {
      endpoint += '?' + params.join('&');
    }

    const response = await apiRequest(endpoint);
    const gradesData = response.data || [];

    renderGradesReport(gradesData);

  } catch (error) {
    console.error('Error loading grades report:', error);
    showToast('Error loading grades report: ' + error.message, 'error');
  }
}

function renderGradesReport(gradesData) {
  if (!elements.gradesReportTableBody) return;

  if (gradesData.length === 0) {
    elements.gradesReportTableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No grades found for the selected criteria</td></tr>';
    return;
  }

  elements.gradesReportTableBody.innerHTML = gradesData.map(grade => `
    <tr>
      <td>${grade.student_name}</td>
      <td>${grade.class_name} - ${grade.section || ''}</td>
      <td>${grade.subject_name}</td>
      <td>${parseFloat(grade.quiz_mark || 0).toFixed(1)}</td>
      <td>${parseFloat(grade.assignment_mark || 0).toFixed(1)}</td>
      <td>${parseFloat(grade.exam_mark || 0).toFixed(1)}</td>
      <td>${parseFloat(grade.total_mark || 0).toFixed(1)}</td>
      <td><span class="grade-badge grade-${grade.grade_letter}">${grade.grade_letter}</span></td>
      <td>${grade.semester}</td>
    </tr>
  `).join('');
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

  // Student management
  if (elements.studentForm) {
    elements.studentForm.addEventListener('submit', submitStudent);
  }

  const clearStudentBtn = document.getElementById('clearStudentForm');
  if (clearStudentBtn) {
    clearStudentBtn.addEventListener('click', () => {
      clearStudentForm();
      // Show password field when clearing
      const passwordField = document.getElementById('studentPassword');
      const passwordParent = passwordField.closest('.form-field');
      if (passwordParent) {
        passwordParent.style.display = 'block';
      }
    });
  }

  if (elements.studentSearch) {
    elements.studentSearch.addEventListener('input', filterStudents);
  }

  if (elements.studentClassFilter) {
    elements.studentClassFilter.addEventListener('change', filterStudents);
  }

  // Auto-generate username for students
  const studentFirstName = document.getElementById('studentFirstName');
  const studentLastName = document.getElementById('studentLastName');
  const studentUsername = document.getElementById('studentUsername');
  
  if (studentFirstName && studentLastName && studentUsername) {
    const generateStudentUsername = () => {
      const firstName = studentFirstName.value.trim();
      const lastName = studentLastName.value.trim();
      if (firstName && lastName && !studentUsername.value) {
        studentUsername.value = generateUsername(firstName, lastName);
      }
    };
    
    studentFirstName.addEventListener('blur', generateStudentUsername);
    studentLastName.addEventListener('blur', generateStudentUsername);
  }

  // Teacher management
  if (elements.teacherForm) {
    elements.teacherForm.addEventListener('submit', submitTeacher);
  }

  const clearTeacherBtn = document.getElementById('clearTeacherForm');
  if (clearTeacherBtn) {
    clearTeacherBtn.addEventListener('click', clearTeacherForm);
  }

  if (elements.teacherSearch) {
    elements.teacherSearch.addEventListener('input', filterTeachers);
  }

  // Auto-generate username for teachers
  const teacherFirstName = document.getElementById('teacherFirstName');
  const teacherLastName = document.getElementById('teacherLastName');
  const teacherUsername = document.getElementById('teacherUsername');
  
  if (teacherFirstName && teacherLastName && teacherUsername) {
    const generateTeacherUsername = () => {
      const firstName = teacherFirstName.value.trim();
      const lastName = teacherLastName.value.trim();
      if (firstName && lastName && !teacherUsername.value) {
        teacherUsername.value = generateUsername(firstName, lastName);
      }
    };
    
    teacherFirstName.addEventListener('blur', generateTeacherUsername);
    teacherLastName.addEventListener('blur', generateTeacherUsername);
  }

  // Class management
  if (elements.classForm) {
    elements.classForm.addEventListener('submit', submitClass);
  }

  const clearClassBtn = document.getElementById('clearClassForm');
  if (clearClassBtn) {
    clearClassBtn.addEventListener('click', clearClassForm);
  }

  if (elements.classSearch) {
    elements.classSearch.addEventListener('input', filterClasses);
  }

  // Attendance reports
  if (elements.loadAttendanceReport) {
    elements.loadAttendanceReport.addEventListener('click', loadAttendanceReport);
  }

  // Grades reports
  if (elements.loadGradesReport) {
    elements.loadGradesReport.addEventListener('click', loadGradesReport);
  }

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
}

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  console.log('Admin Portal initialized');
  
  // Check authentication
  if (!checkAuth()) {
    return;
  }

  try {
    // Initialize event listeners
    initEventListeners();

    // Load initial data and navigate to dashboard
    await loadDashboardData();
    navigateTo('dashboard');

    showToast(`Welcome back, Administrator!`, 'success');

  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Error initializing application: ' + error.message, 'error');
  }
}

// ==========================================
// GLOBAL FUNCTIONS FOR INLINE HANDLERS
// ==========================================
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.editTeacher = editTeacher;
window.deleteTeacher = deleteTeacher;
window.editClass = editClass;
window.deleteClass = deleteClass;
window.navigateTo = navigateTo;

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}