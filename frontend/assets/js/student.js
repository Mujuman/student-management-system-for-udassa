/**
 * Student Portal JavaScript
 * Handles all student-specific functionality
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
  studentData: null,
  grades: [],
  attendanceData: [],
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
  gradesPage: document.getElementById('gradesPage'),
  studentsPage: document.getElementById('studentsPage'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  btnLogout: document.getElementById('btnLogout'),
  sidebarUserInitials: document.getElementById('sidebarUserInitials'),
  sidebarUserName: document.getElementById('sidebarUserName'),
  sidebarUserRole: document.getElementById('sidebarUserRole'),
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
  elements.gradesPage.style.display = 'none';
  elements.studentsPage.style.display = 'none';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  switch (pageName) {
    case 'dashboard':
      elements.dashboardPage.style.display = 'block';
      elements.pageTitle.textContent = 'Student Dashboard';
      elements.pageSubtitle.textContent = 'Welcome back! Here\'s your academic overview.';
      break;
    case 'grades':
      elements.gradesPage.style.display = 'block';
      elements.pageTitle.textContent = 'My Academic Performance';
      elements.pageSubtitle.textContent = 'Track your progress across all subjects and semesters.';
      loadStudentGradesPage();
      break;
    case 'students':
      elements.studentsPage.style.display = 'block';
      elements.pageTitle.textContent = 'My Profile';
      elements.pageSubtitle.textContent = 'View your personal and academic information.';
      loadStudentProfilePage();
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
  
  if (state.currentUser.role !== 'student') {
    logout();
    return false;
  }
  
  return true;
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadStudentData() {
  try {
    // Get student profile data
    const studentsResponse = await apiRequest('/students');
    const students = studentsResponse.data || [];
    
    // Find current student
    state.studentData = students.find(s => s.user_id === state.currentUser.id);
    
    if (!state.studentData) {
      throw new Error('Student profile not found');
    }

    // Update UI with student data
    updateStudentUI();
    
  } catch (error) {
    console.error('Error loading student data:', error);
    showToast('Error loading profile data: ' + error.message, 'error');
  }
}

function updateStudentUI() {
  if (!state.studentData) return;

  const student = state.studentData;
  
  // Update sidebar
  if (elements.sidebarUserInitials) {
    elements.sidebarUserInitials.textContent = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`;
  }
  if (elements.sidebarUserName) {
    elements.sidebarUserName.textContent = `${student.first_name} ${student.last_name}`;
  }
  if (elements.sidebarUserRole) {
    elements.sidebarUserRole.textContent = 'Student';
  }

  // Update welcome banner
  const welcomeName = document.getElementById('studentWelcomeName');
  if (welcomeName) {
    welcomeName.textContent = student.first_name;
  }

  // Update dashboard stats
  const classInfo = document.getElementById('studentClassInfo');
  if (classInfo) {
    classInfo.textContent = student.class_name || '-';
  }

  // Update profile card
  const profileName = document.getElementById('studentProfileName');
  const rollNumber = document.getElementById('studentRollNumber');
  const studentClass = document.getElementById('studentClass');
  const studentEmail = document.getElementById('studentEmail');
  const studentStatus = document.getElementById('studentStatus');
  const avatarInitials = document.getElementById('studentAvatarInitials');

  if (profileName) profileName.textContent = `${student.first_name} ${student.last_name}`;
  if (rollNumber) rollNumber.textContent = student.roll_number || '-';
  if (studentClass) studentClass.textContent = student.class_name ? `${student.class_name} - Section ${student.section || ''}` : '-';
  if (studentEmail) studentEmail.textContent = student.email || 'Not provided';
  if (studentStatus) studentStatus.textContent = student.status || 'Active';
  if (avatarInitials) {
    avatarInitials.textContent = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`;
  }
}

async function loadGrades() {
  if (!state.studentData) return;

  try {
    const response = await apiRequest(`/grades/student/${state.studentData.id}`);
    state.grades = response.data || [];
    
    // Update grade count
    const gradeCount = document.getElementById('studentGradeCount');
    if (gradeCount) gradeCount.textContent = state.grades.length;

    // Calculate average grade
    if (state.grades.length > 0) {
      const avgPercentage = state.grades.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) / state.grades.length;
      const avgGrade = document.getElementById('studentAvgGrade');
      if (avgGrade) avgGrade.textContent = avgPercentage.toFixed(1) + '%';
    }

    // Display recent grades (top 5)
    const recentGradesContainer = document.getElementById('studentRecentGrades');
    if (recentGradesContainer) {
      if (state.grades.length === 0) {
        recentGradesContainer.innerHTML = '<div class="empty-state-small">No grades available yet</div>';
      } else {
        const recentGrades = state.grades.slice(0, 5);
        recentGradesContainer.innerHTML = recentGrades.map(grade => `
          <div class="grade-item">
            <div class="grade-subject">${grade.subject_name}</div>
            <div class="grade-score">
              <span class="grade-percentage">${parseFloat(grade.percentage).toFixed(1)}%</span>
              <span class="grade-letter ${grade.grade_letter}">${grade.grade_letter}</span>
            </div>
          </div>
        `).join('');
      }
    }

  } catch (error) {
    console.error('Error loading grades:', error);
    showToast('Error loading grades: ' + error.message, 'error');
  }
}

async function loadAttendance() {
  if (!state.studentData) return;

  try {
    const response = await apiRequest(`/attendance/student/${state.studentData.id}`);
    state.attendanceData = response.data || [];

    // Count attendance by status
    const counts = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0
    };

    state.attendanceData.forEach(record => {
      if (counts.hasOwnProperty(record.status)) {
        counts[record.status]++;
      }
    });

    // Update attendance circles
    const presentDays = document.getElementById('studentPresentDays');
    const absentDays = document.getElementById('studentAbsentDays');
    const lateDays = document.getElementById('studentLateDays');
    const excusedDays = document.getElementById('studentExcusedDays');

    if (presentDays) presentDays.textContent = counts.Present;
    if (absentDays) absentDays.textContent = counts.Absent;
    if (lateDays) lateDays.textContent = counts.Late;
    if (excusedDays) excusedDays.textContent = counts.Excused;

    // Calculate attendance rate
    const totalDays = state.attendanceData.length;
    const attendanceRate = totalDays > 0 ? ((counts.Present + counts.Late) / totalDays * 100).toFixed(1) : 0;
    
    const attendanceRateEl = document.getElementById('studentAttendanceRate');
    if (attendanceRateEl) attendanceRateEl.textContent = attendanceRate + '%';

  } catch (error) {
    console.error('Error loading attendance:', error);
    showToast('Error loading attendance: ' + error.message, 'error');
  }
}

// ==========================================
// GRADES PAGE
// ==========================================
async function loadStudentGradesPage() {
  if (!state.studentData) return;

  try {
    // Update hero stats
    const totalSubjects = new Set(state.grades.map(g => g.subject_name)).size;
    const totalSubjectsEl = document.getElementById('studentTotalSubjects');
    if (totalSubjectsEl) totalSubjectsEl.textContent = totalSubjects;

    if (state.grades.length > 0) {
      const avgPercentage = state.grades.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) / state.grades.length;
      const overallAvgEl = document.getElementById('studentOverallAvg');
      if (overallAvgEl) overallAvgEl.textContent = avgPercentage.toFixed(1) + '%';
      
      const highest = Math.max(...state.grades.map(g => parseFloat(g.percentage || 0)));
      const highestGradeEl = document.getElementById('studentHighestGrade');
      if (highestGradeEl) highestGradeEl.textContent = highest.toFixed(1) + '%';
    }

    // Count performance categories
    const excellent = state.grades.filter(g => ['A', 'B'].includes(g.grade_letter)).length;
    const good = state.grades.filter(g => g.grade_letter === 'C').length;
    const needsImprovement = state.grades.filter(g => ['D', 'F'].includes(g.grade_letter)).length;

    const excellentCountEl = document.getElementById('excellentCount');
    const goodCountEl = document.getElementById('goodCount');
    const needsImprovementCountEl = document.getElementById('needsImprovementCount');

    if (excellentCountEl) excellentCountEl.textContent = `${excellent} subject${excellent !== 1 ? 's' : ''}`;
    if (goodCountEl) goodCountEl.textContent = `${good} subject${good !== 1 ? 's' : ''}`;
    if (needsImprovementCountEl) needsImprovementCountEl.textContent = `${needsImprovement} subject${needsImprovement !== 1 ? 's' : ''}`;

    // Render grade cards
    renderStudentGradeCards(state.grades);

    // Setup semester filter
    const semesterFilter = document.getElementById('studentSemesterFilter');
    if (semesterFilter) {
      semesterFilter.addEventListener('change', () => {
        const semester = semesterFilter.value;
        const filtered = semester === 'all' ? state.grades : state.grades.filter(g => g.semester === semester);
        renderStudentGradeCards(filtered);
      });
    }

  } catch (error) {
    console.error('Error loading grades page:', error);
  }
}

function renderStudentGradeCards(grades) {
  const container = document.getElementById('studentGradesCards');
  if (!container) return;

  if (grades.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <h4>No Grades Yet</h4>
        <p>Your grades will appear here once they are posted by your teachers.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = grades.map(grade => {
    const gradeClass = grade.grade_letter;
    const gradeColor = {
      'A': '#10b981',
      'B': '#3b82f6',
      'C': '#f59e0b',
      'D': '#ef4444',
      'F': '#991b1b'
    }[gradeClass] || '#64748b';

    return `
      <div class="grade-card">
        <div class="grade-card-header">
          <h4 class="grade-subject-name">${grade.subject_name}</h4>
          <div class="grade-letter-large" style="background: ${gradeColor};">${grade.grade_letter}</div>
        </div>
        <div class="grade-card-body">
          <div class="grade-detail-item">
            <span class="grade-detail-label">Quiz</span>
            <span class="grade-detail-value">${parseFloat(grade.quiz_mark || 0).toFixed(1)}</span>
          </div>
          <div class="grade-detail-item">
            <span class="grade-detail-label">Assignment</span>
            <span class="grade-detail-value">${parseFloat(grade.assignment_mark || 0).toFixed(1)}</span>
          </div>
          <div class="grade-detail-item">
            <span class="grade-detail-label">Exam</span>
            <span class="grade-detail-value">${parseFloat(grade.exam_mark || 0).toFixed(1)}</span>
          </div>
          <div class="grade-detail-item">
            <span class="grade-detail-label">Total</span>
            <span class="grade-detail-value">${parseFloat(grade.total_mark || 0).toFixed(1)}</span>
          </div>
        </div>
        <div class="grade-card-footer">
          <span class="grade-meta">${grade.semester} • ${grade.academic_year}</span>
          <span class="grade-percentage-large">${parseFloat(grade.percentage || 0).toFixed(1)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// PROFILE PAGE
// ==========================================
async function loadStudentProfilePage() {
  if (!state.studentData) return;

  try {
    const student = state.studentData;

    // Update hero section
    const avatarXL = document.getElementById('studentProfileAvatarXL');
    const heroName = document.getElementById('studentProfileHeroName');
    const rollNo = document.getElementById('studentProfileRollNo');
    const classInfo = document.getElementById('studentProfileClassInfo');

    if (avatarXL) avatarXL.textContent = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`;
    if (heroName) heroName.textContent = `${student.first_name} ${student.last_name}`;
    if (rollNo) rollNo.textContent = `Roll: ${student.roll_number}`;
    if (classInfo) classInfo.textContent = `Class: ${student.class_name || '-'}`;

    // Update personal information
    const fullNameEl = document.getElementById('studentFullName');
    const infoRollNoEl = document.getElementById('studentInfoRollNo');
    const genderEl = document.getElementById('studentGender');
    const dobEl = document.getElementById('studentDOB');
    const statusEl = document.getElementById('studentProfileStatus');

    if (fullNameEl) fullNameEl.textContent = `${student.first_name} ${student.last_name}`;
    if (infoRollNoEl) infoRollNoEl.textContent = student.roll_number;
    if (genderEl) genderEl.textContent = student.gender || 'Not specified';
    if (dobEl) dobEl.textContent = student.date_of_birth || 'Not specified';
    if (statusEl) statusEl.textContent = student.status || 'Active';

    // Update academic information
    const academicClassEl = document.getElementById('studentAcademicClass');
    const sectionEl = document.getElementById('studentSection');
    const gradeCountEl = document.getElementById('studentProfileGradeCount');
    const avgGradeEl = document.getElementById('studentProfileAvgGrade');
    const attendanceEl = document.getElementById('studentProfileAttendance');

    if (academicClassEl) academicClassEl.textContent = student.class_name || 'Not assigned';
    if (sectionEl) sectionEl.textContent = student.section || '-';
    if (gradeCountEl) gradeCountEl.textContent = state.grades.length;
    
    if (state.grades.length > 0) {
      const avgPercentage = state.grades.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) / state.grades.length;
      if (avgGradeEl) avgGradeEl.textContent = avgPercentage.toFixed(1) + '%';
    } else {
      if (avgGradeEl) avgGradeEl.textContent = 'No grades yet';
    }

    if (state.attendanceData.length > 0) {
      const presentCount = state.attendanceData.filter(a => a.status === 'Present' || a.status === 'Late').length;
      const rate = (presentCount / state.attendanceData.length * 100).toFixed(1);
      if (attendanceEl) attendanceEl.textContent = rate + '%';
    } else {
      if (attendanceEl) attendanceEl.textContent = 'No data';
    }

    // Update contact information
    const contactEmailEl = document.getElementById('studentContactEmail');
    const phoneEl = document.getElementById('studentPhone');
    const usernameEl = document.getElementById('studentUsername');

    if (contactEmailEl) contactEmailEl.textContent = student.email || 'Not provided';
    if (phoneEl) phoneEl.textContent = student.phone_number || 'Not provided';
    if (usernameEl) usernameEl.textContent = student.username || '-';

  } catch (error) {
    console.error('Error loading profile page:', error);
  }
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
  console.log('Student Portal initialized');
  
  // Check authentication
  if (!checkAuth()) {
    return;
  }

  try {
    // Initialize event listeners
    initEventListeners();

    // Load student data
    await loadStudentData();
    await loadGrades();
    await loadAttendance();

    // Navigate to dashboard
    navigateTo('dashboard');

    showToast(`Welcome back, ${state.currentUser.username}!`, 'success');

  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Error initializing application: ' + error.message, 'error');
  }
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}