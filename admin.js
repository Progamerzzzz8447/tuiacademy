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
let currentModule = null;

// Admin ID
const ADMIN_ID = '1094741743372611744';

// DOM elements
const adminStatus = document.getElementById('adminStatus');
const backToMainBtn = document.getElementById('backToMainBtn');
const adminCoursesList = document.getElementById('adminCoursesList');
const addCourseBtn = document.getElementById('addCourseBtn');
const moduleManagement = document.getElementById('moduleManagement');
const currentCourseName = document.getElementById('currentCourseName');
const adminModulesList = document.getElementById('adminModulesList');
const addModuleBtn = document.getElementById('addModuleBtn');

// Modal elements
const courseModal = document.getElementById('courseModal');
const courseModalTitle = document.getElementById('courseModalTitle');
const closeCourseModal = document.getElementById('closeCourseModal');
const courseForm = document.getElementById('courseForm');
const courseName = document.getElementById('courseName');
const courseDescription = document.getElementById('courseDescription');
const accessRole = document.getElementById('accessRole');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');

const moduleModal = document.getElementById('moduleModal');
const moduleModalTitle = document.getElementById('moduleModalTitle');
const closeModuleModal = document.getElementById('closeModuleModal');
const moduleForm = document.getElementById('moduleForm');
const moduleTitle = document.getElementById('moduleTitle');
const passMark = document.getElementById('passMark');
const theoryHTML = document.getElementById('theoryHTML');
const questionsContainer = document.getElementById('questionsContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const cancelModuleBtn = document.getElementById('cancelModuleBtn');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    if (!userId || userId !== ADMIN_ID) {
        window.location.href = 'index.html';
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
            currentUser.id = userId;
            adminStatus.textContent = `Admin: ${currentUser.username}`;
        } else {
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

// Render courses list
function renderCourses() {
    if (courses.length === 0) {
        adminCoursesList.innerHTML = `
            <div class="no-courses">
                <p>No courses created yet. Create your first course!</p>
            </div>
        `;
        return;
    }
    
    adminCoursesList.innerHTML = courses.map(course => `
        <div class="course-item">
            <div>
                <h3>${course.name}</h3>
                <p>${course.description || 'No description'}</p>
                <p><strong>Access Role:</strong> ${course.accessRole || 'All roles'}</p>
            </div>
            <div class="course-actions">
                <button class="action-btn" onclick="manageModules('${course.id}')">Manage Modules</button>
                <button class="action-btn" onclick="editCourse('${course.id}')">Edit</button>
                <button class="action-btn delete" onclick="deleteCourse('${course.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Manage modules for a course
async function manageModules(courseId) {
    currentCourse = courses.find(c => c.id === courseId);
    if (!currentCourse) return;
    
    currentCourseName.textContent = currentCourse.name;
    
    // Show module management section
    document.querySelector('.admin-section').style.display = 'none';
    moduleManagement.style.display = 'block';
    
    await loadModules(courseId);
}

// Load modules for a course
async function loadModules(courseId) {
    try {
        const modulesSnapshot = await db.collection('courses').doc(courseId).collection('modules').get();
        const modules = [];
        
        modulesSnapshot.forEach(doc => {
            modules.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderModules(modules);
    } catch (error) {
        console.error('Error loading modules:', error);
        adminModulesList.innerHTML = '<p>Failed to load modules</p>';
    }
}

// Render modules list
function renderModules(modules) {
    if (modules.length === 0) {
        adminModulesList.innerHTML = `
            <div class="no-modules">
                <p>No modules created yet. Create your first module!</p>
            </div>
        `;
        return;
    }
    
    adminModulesList.innerHTML = modules.map(module => `
        <div class="module-item">
            <div class="module-info">
                <h4>${module.title}</h4>
                <p>Pass mark: ${module.passMark}% | Questions: ${module.questions?.length || 0}</p>
            </div>
            <div class="module-actions">
                <button class="action-btn" onclick="editModule('${module.id}')">Edit</button>
                <button class="action-btn delete" onclick="deleteModule('${module.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Back to main button
    backToMainBtn.addEventListener('click', () => {
        window.location.href = `modules.html?id=${currentUser.id}`;
    });
    
    // Course modal
    addCourseBtn.addEventListener('click', () => openCourseModal());
    closeCourseModal.addEventListener('click', closeCourseModalFunc);
    cancelCourseBtn.addEventListener('click', closeCourseModalFunc);
    courseForm.addEventListener('submit', handleCourseSubmit);
    
    // Module modal
    addModuleBtn.addEventListener('click', () => openModuleModal());
    closeModuleModal.addEventListener('click', closeModuleModalFunc);
    cancelModuleBtn.addEventListener('click', closeModuleModalFunc);
    moduleForm.addEventListener('submit', handleModuleSubmit);
    addQuestionBtn.addEventListener('click', addQuestion);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === courseModal) {
            closeCourseModalFunc();
        }
        if (event.target === moduleModal) {
            closeModuleModalFunc();
        }
    });
}

// Course modal functions
function openCourseModal(courseId = null) {
    if (courseId) {
        // Edit mode
        const course = courses.find(c => c.id === courseId);
        if (course) {
            courseModalTitle.textContent = 'Edit Course';
            courseName.value = course.name;
            courseDescription.value = course.description || '';
            accessRole.value = course.accessRole || '';
            courseForm.dataset.courseId = courseId;
        }
    } else {
        // Add mode
        courseModalTitle.textContent = 'Add Course';
        courseForm.reset();
        delete courseForm.dataset.courseId;
    }
    
    courseModal.style.display = 'block';
}

function closeCourseModalFunc() {
    courseModal.style.display = 'none';
    courseForm.reset();
}

async function handleCourseSubmit(e) {
    e.preventDefault();
    
    const courseData = {
        name: courseName.value.trim(),
        description: courseDescription.value.trim(),
        accessRole: accessRole.value.trim() || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (courseForm.dataset.courseId) {
            // Edit existing course
            await db.collection('courses').doc(courseForm.dataset.courseId).update(courseData);
        } else {
            // Create new course
            await db.collection('courses').add(courseData);
        }
        
        closeCourseModalFunc();
        await loadCourses();
        showSuccess('Course saved successfully');
    } catch (error) {
        console.error('Error saving course:', error);
        showError('Failed to save course');
    }
}

// Module modal functions
function openModuleModal(moduleId = null) {
    if (moduleId) {
        // Edit mode - load module data
        loadModuleForEdit(moduleId);
    } else {
        // Add mode
        moduleModalTitle.textContent = 'Add Module';
        moduleForm.reset();
        delete moduleForm.dataset.moduleId;
        questionsContainer.innerHTML = '';
        addQuestion(); // Add first question
    }
    
    moduleModal.style.display = 'block';
}

function closeModuleModalFunc() {
    moduleModal.style.display = 'none';
    moduleForm.reset();
    questionsContainer.innerHTML = '';
}

async function loadModuleForEdit(moduleId) {
    try {
        const moduleDoc = await db.collection('courses').doc(currentCourse.id).collection('modules').doc(moduleId).get();
        
        if (moduleDoc.exists) {
            const moduleData = moduleDoc.data();
            moduleModalTitle.textContent = 'Edit Module';
            moduleTitle.value = moduleData.title;
            passMark.value = moduleData.passMark;
            theoryHTML.value = moduleData.theoryHTML || '';
            moduleForm.dataset.moduleId = moduleId;
            
            // Load questions
            questionsContainer.innerHTML = '';
            if (moduleData.questions) {
                moduleData.questions.forEach((question, index) => {
                    addQuestion(question, index);
                });
            } else {
                addQuestion();
            }
        }
    } catch (error) {
        console.error('Error loading module:', error);
        showError('Failed to load module data');
    }
}

async function handleModuleSubmit(e) {
    e.preventDefault();
    
    const questions = [];
    const questionElements = questionsContainer.querySelectorAll('.question-item');
    
    questionElements.forEach(element => {
        const questionText = element.querySelector('.question-text-input').value.trim();
        const options = Array.from(element.querySelectorAll('.option-input input[type="text"]')).map(input => input.value.trim());
        const correctAnswer = parseInt(element.querySelector('input[type="radio"]:checked')?.value);
        
        if (questionText && options.every(opt => opt) && !isNaN(correctAnswer)) {
            questions.push({
                question: questionText,
                options: options,
                answerIndex: correctAnswer
            });
        }
    });
    
    if (questions.length === 0) {
        showError('Please add at least one question');
        return;
    }
    
    const moduleData = {
        title: moduleTitle.value.trim(),
        passMark: parseInt(passMark.value),
        theoryHTML: theoryHTML.value.trim(),
        questions: questions,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (moduleForm.dataset.moduleId) {
            // Edit existing module
            await db.collection('courses').doc(currentCourse.id).collection('modules').doc(moduleForm.dataset.moduleId).update(moduleData);
        } else {
            // Create new module
            await db.collection('courses').doc(currentCourse.id).collection('modules').add(moduleData);
        }
        
        closeModuleModalFunc();
        await loadModules(currentCourse.id);
        showSuccess('Module saved successfully');
    } catch (error) {
        console.error('Error saving module:', error);
        showError('Failed to save module');
    }
}

// Question management
function addQuestion(questionData = null, index = null) {
    const questionIndex = index !== null ? index : questionsContainer.children.length;
    const questionId = `question_${questionIndex}`;
    
    const questionHTML = `
        <div class="question-item" data-question-id="${questionId}">
            <div class="question-header">
                <input type="text" class="question-text-input" placeholder="Enter question text" 
                       value="${questionData?.question || ''}" required>
                <button type="button" class="remove-question" onclick="removeQuestion('${questionId}')">Remove</button>
            </div>
            <div class="options-inputs">
                ${['A', 'B', 'C', 'D'].map((option, optIndex) => `
                    <div class="option-input">
                        <input type="radio" name="${questionId}" value="${optIndex}" 
                               ${questionData?.answerIndex === optIndex ? 'checked' : ''} required>
                        <input type="text" placeholder="Option ${option}" 
                               value="${questionData?.options?.[optIndex] || ''}" required>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(questionId) {
    const questionElement = questionsContainer.querySelector(`[data-question-id="${questionId}"]`);
    if (questionElement) {
        questionElement.remove();
    }
}

// Edit functions
function editCourse(courseId) {
    openCourseModal(courseId);
}

function editModule(moduleId) {
    openModuleModal(moduleId);
}

// Delete functions
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also delete all its modules.')) {
        return;
    }
    
    try {
        // Delete all modules first
        const modulesSnapshot = await db.collection('courses').doc(courseId).collection('modules').get();
        const deletePromises = modulesSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        
        // Delete the course
        await db.collection('courses').doc(courseId).delete();
        
        await loadCourses();
        showSuccess('Course deleted successfully');
    } catch (error) {
        console.error('Error deleting course:', error);
        showError('Failed to delete course');
    }
}

async function deleteModule(moduleId) {
    if (!confirm('Are you sure you want to delete this module?')) {
        return;
    }
    
    try {
        await db.collection('courses').doc(currentCourse.id).collection('modules').doc(moduleId).delete();
        await loadModules(currentCourse.id);
        showSuccess('Module deleted successfully');
    } catch (error) {
        console.error('Error deleting module:', error);
        showError('Failed to delete module');
    }
}

// Utility functions
function showSuccess(message) {
    // You can implement a proper success notification system here
    console.log(message);
    alert(message);
}

function showError(message) {
    console.error(message);
    alert(message);
}