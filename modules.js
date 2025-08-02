// Firebase configuration
const firebaseConfig = {
    // Add your Firebase config here
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let currentUser = null;
let courses = [];
let currentCourse = null;

// Check if user is admin
const ADMIN_ID = '1094741743372611744';

// DOM elements
const coursesGrid = document.getElementById('coursesGrid');
const username = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const courseModal = document.getElementById('courseModal');
const modulesList = document.getElementById('modulesList');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Check if user is admin and redirect to admin panel
    if (userId === ADMIN_ID) {
        window.location.href = `admin.html?id=${userId}`;
        return;
    }
    
    await loadUser(userId);
    await loadCourses();
    setupEventListeners();
});

// Load user data
async function loadUser(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            currentUser = userDoc.data();
            username.textContent = currentUser.username || 'User';
        } else {
            // User doesn't exist, redirect to login
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showError('Failed to load user data');
    }
}

// Load all courses
async function loadCourses() {
    try {
        const coursesSnapshot = await db.collection('courses').get();
        courses = [];
        
        coursesSnapshot.forEach(doc => {
            courses.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Failed to load courses');
    }
}

// Render courses grid
function renderCourses() {
    if (courses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="no-courses">
                <p>No courses available at the moment.</p>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <h3>${course.name}</h3>
            <p>${course.description || 'No description available'}</p>
            <div class="course-stats">
                <span>${course.modules?.length || 0} modules</span>
                <span>${course.accessRole || 'All roles'}</span>
            </div>
        </div>
    `).join('');
    
    // Add click listeners to course cards
    document.querySelectorAll('.course-card').forEach(card => {
        card.addEventListener('click', () => {
            const courseId = card.dataset.courseId;
            openCourseModal(courseId);
        });
    });
}

// Open course modal and load modules
async function openCourseModal(courseId) {
    currentCourse = courses.find(c => c.id === courseId);
    if (!currentCourse) return;
    
    modalTitle.textContent = currentCourse.name;
    courseModal.style.display = 'block';
    
    try {
        const modulesSnapshot = await db.collection('courses').doc(courseId).collection('modules').get();
        const modules = [];
        
        modulesSnapshot.forEach(doc => {
            modules.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort modules by creation order
        modules.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
        
        renderModules(modules);
    } catch (error) {
        console.error('Error loading modules:', error);
        modulesList.innerHTML = '<p>Failed to load modules</p>';
    }
}

// Render modules list
function renderModules(modules) {
    if (modules.length === 0) {
        modulesList.innerHTML = `
            <div class="no-modules">
                <p>No modules available for this course.</p>
            </div>
        `;
        return;
    }
    
    modulesList.innerHTML = modules.map((module, index) => {
        const isCompleted = isModuleCompleted(currentCourse.id, module.id);
        const isLocked = index > 0 && !isModuleCompleted(currentCourse.id, modules[index - 1].id);
        
        return `
            <div class="module-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" 
                 data-module-id="${module.id}" ${!isLocked ? 'style="cursor: pointer;"' : ''}>
                <div class="module-info">
                    <h4>${module.title}</h4>
                    <p>Pass mark: ${module.passMark}%</p>
                </div>
                <div class="module-status">
                    <span class="status-icon">
                        ${isCompleted ? '✅' : isLocked ? '🔒' : '📖'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners to unlocked modules
    document.querySelectorAll('.module-item:not(.locked)').forEach(item => {
        item.addEventListener('click', () => {
            const moduleId = item.dataset.moduleId;
            openModule(moduleId);
        });
    });
}

// Check if module is completed
function isModuleCompleted(courseId, moduleId) {
    if (!currentUser || !currentUser.progress) return false;
    
    const courseProgress = currentUser.progress[courseId];
    if (!courseProgress) return false;
    
    return courseProgress[moduleId] === true;
}

// Open module viewer
function openModule(moduleId) {
    const url = `module-viewer.html?id=${currentUser.id}&course=${currentCourse.id}&module=${moduleId}`;
    window.location.href = url;
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    logoutBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        courseModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === courseModal) {
            courseModal.style.display = 'none';
        }
    });
}

// Show error message
function showError(message) {
    // You can implement a proper error notification system here
    console.error(message);
    alert(message);
}

// Utility function to format user ID
function formatUserId(userId) {
    return userId;
}