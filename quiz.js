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
let currentModule = null;
let currentCourse = null;
let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizCompleted = false;

// DOM elements
const moduleTitle = document.getElementById('moduleTitle');
const progressText = document.getElementById('progressText');
const theoryContent = document.getElementById('theoryContent');
const theorySection = document.getElementById('theorySection');
const quizSection = document.getElementById('quizSection');
const resultsSection = document.getElementById('resultsSection');
const startQuizBtn = document.getElementById('startQuizBtn');
const backBtn = document.getElementById('backBtn');
const questionContainer = document.getElementById('questionContainer');
const questionCounter = document.getElementById('questionCounter');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const submitQuizBtn = document.getElementById('submitQuizBtn');
const resultsIcon = document.getElementById('resultsIcon');
const resultsTitle = document.getElementById('resultsTitle');
const resultsMessage = document.getElementById('resultsMessage');
const scoreDisplay = document.getElementById('scoreDisplay');
const passMarkDisplay = document.getElementById('passMarkDisplay');
const retakeBtn = document.getElementById('retakeBtn');
const continueBtn = document.getElementById('continueBtn');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const courseId = urlParams.get('course');
    const moduleId = urlParams.get('module');
    
    if (!userId || !courseId || !moduleId) {
        window.location.href = 'modules.html';
        return;
    }
    
    await loadUser(userId);
    await loadModule(courseId, moduleId);
    setupEventListeners();
});

// Load user data
async function loadUser(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            currentUser = userDoc.data();
            currentUser.id = userId;
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showError('Failed to load user data');
    }
}

// Load module data
async function loadModule(courseId, moduleId) {
    try {
        const moduleDoc = await db.collection('courses').doc(courseId).collection('modules').doc(moduleId).get();
        
        if (moduleDoc.exists) {
            currentModule = {
                id: moduleId,
                ...moduleDoc.data()
            };
            currentCourse = { id: courseId };
            
            moduleTitle.textContent = currentModule.title;
            displayTheory();
            updateProgress();
        } else {
            showError('Module not found');
        }
    } catch (error) {
        console.error('Error loading module:', error);
        showError('Failed to load module');
    }
}

// Display theory content
function displayTheory() {
    if (currentModule.theoryHTML) {
        theoryContent.innerHTML = currentModule.theoryHTML;
    } else {
        theoryContent.innerHTML = '<p>No theory content available for this module.</p>';
    }
}

// Update progress display
function updateProgress() {
    if (!currentUser || !currentUser.progress) return;
    
    const courseProgress = currentUser.progress[currentCourse.id];
    if (!courseProgress) return;
    
    const completedModules = Object.values(courseProgress).filter(Boolean).length;
    const totalModules = 1; // For now, just this module
    
    const progressPercent = Math.round((completedModules / totalModules) * 100);
    progressText.textContent = `Progress: ${progressPercent}%`;
}

// Setup event listeners
function setupEventListeners() {
    // Start quiz button
    startQuizBtn.addEventListener('click', startQuiz);
    
    // Back button
    backBtn.addEventListener('click', () => {
        window.location.href = `modules.html?id=${currentUser.id}`;
    });
    
    // Quiz navigation
    prevQuestionBtn.addEventListener('click', previousQuestion);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    submitQuizBtn.addEventListener('click', submitQuiz);
    
    // Results actions
    retakeBtn.addEventListener('click', retakeQuiz);
    continueBtn.addEventListener('click', continueToNext);
}

// Start quiz
function startQuiz() {
    if (!currentModule.questions || currentModule.questions.length === 0) {
        showError('No questions available for this module');
        return;
    }
    
    quizData = currentModule.questions;
    userAnswers = new Array(quizData.length).fill(null);
    currentQuestionIndex = 0;
    quizCompleted = false;
    
    theorySection.style.display = 'none';
    quizSection.style.display = 'block';
    
    displayQuestion();
    updateQuizNavigation();
}

// Display current question
function displayQuestion() {
    const question = quizData[currentQuestionIndex];
    
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    
    questionContainer.innerHTML = `
        <div class="question">${question.question}</div>
        <div class="options-list">
            ${question.options.map((option, index) => `
                <div class="option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
                     data-index="${index}">
                    ${option}
                </div>
            `).join('')}
        </div>
    `;
    
    // Add click listeners to options
    questionContainer.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => {
            selectOption(parseInt(option.dataset.index));
        });
    });
}

// Select an option
function selectOption(optionIndex) {
    // Remove previous selection
    questionContainer.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Select new option
    questionContainer.querySelector(`[data-index="${optionIndex}"]`).classList.add('selected');
    userAnswers[currentQuestionIndex] = optionIndex;
    
    updateQuizNavigation();
}

// Update quiz navigation buttons
function updateQuizNavigation() {
    prevQuestionBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        nextQuestionBtn.style.display = 'none';
        submitQuizBtn.style.display = 'block';
    } else {
        nextQuestionBtn.style.display = 'block';
        submitQuizBtn.style.display = 'none';
    }
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateQuizNavigation();
    }
}

// Next question
function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateQuizNavigation();
    }
}

// Submit quiz
async function submitQuiz() {
    // Check if all questions are answered
    const unansweredQuestions = userAnswers.filter(answer => answer === null).length;
    if (unansweredQuestions > 0) {
        if (!confirm(`You have ${unansweredQuestions} unanswered question(s). Continue anyway?`)) {
            return;
        }
    }
    
    // Calculate score
    const correctAnswers = userAnswers.filter((answer, index) => 
        answer === quizData[index].answerIndex
    ).length;
    
    const score = Math.round((correctAnswers / quizData.length) * 100);
    const passed = score >= currentModule.passMark;
    
    // Display results
    displayResults(score, passed);
}

// Display quiz results
function displayResults(score, passed) {
    quizSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    if (passed) {
        resultsIcon.textContent = '🎉';
        resultsTitle.textContent = 'Congratulations!';
        resultsMessage.textContent = 'You have successfully passed this module.';
    } else {
        resultsIcon.textContent = '📚';
        resultsTitle.textContent = 'Keep Learning';
        resultsMessage.textContent = 'You need to review the material and try again.';
    }
    
    scoreDisplay.textContent = `${score}%`;
    passMarkDisplay.textContent = `${currentModule.passMark}%`;
    
    // Store progress if passed
    if (passed) {
        storeProgress();
    }
    
    quizCompleted = true;
}

// Store progress in Firebase
async function storeProgress() {
    try {
        const userRef = db.collection('users').doc(currentUser.id);
        
        await userRef.update({
            [`progress.${currentCourse.id}.${currentModule.id}`]: true
        });
        
        console.log('Progress stored successfully');
    } catch (error) {
        console.error('Error storing progress:', error);
        showError('Failed to save progress');
    }
}

// Retake quiz
function retakeQuiz() {
    userAnswers = new Array(quizData.length).fill(null);
    currentQuestionIndex = 0;
    quizCompleted = false;
    
    resultsSection.style.display = 'none';
    quizSection.style.display = 'block';
    
    displayQuestion();
    updateQuizNavigation();
}

// Continue to next module
function continueToNext() {
    window.location.href = `modules.html?id=${currentUser.id}`;
}

// Show error message
function showError(message) {
    console.error(message);
    alert(message);
}

// Utility function to format user ID
function formatUserId(userId) {
    return userId;
}