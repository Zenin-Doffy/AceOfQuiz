// Enhanced Quiz App JavaScript - Polished Version
let socket = null;
let currentUser = null;
let currentRoom = null;
let isHost = false;
let gameState = 'waiting';
let currentQuestion = null;
let questionTimer = null;
let selectedAnswer = null;
let questionStartTime = null;

// Performance optimization: Cache DOM elements
const domCache = {};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Enhanced Quiz App initializing...');
  initializeApp();
});

// Main initialization function
function initializeApp() {
  try {
    cacheDOMElements();
    initializeSocket();
    setupEventListeners();
    checkAuthStatus();
    loadAchievements();
    loadLeaderboard('xp');
    setupCreateQuizForm();
    initializeAnimations();
    setupPerformanceOptimizations();
    console.log(' App initialized successfully');
  } catch (error) {
    console.error(' Error initializing app:', error);
    showToast('Failed to initialize app', 'error');
  }
}

// Cache frequently accessed DOM elements for better performance
function cacheDOMElements() {
  domCache.connectionStatus = document.getElementById('connectionStatus');
  domCache.roomDisplay = document.getElementById('roomDisplay');
  domCache.playersSection = document.getElementById('playersSection');
  domCache.playersGrid = document.getElementById('playersGrid');
  domCache.playerCount = document.getElementById('playerCount');
  domCache.roomActions = document.getElementById('roomActions');
  domCache.roomTabBtn = document.getElementById('roomTabBtn');
  domCache.quizOverlay = document.getElementById('quizOverlay');
  domCache.quizContent = document.getElementById('quizContent');
  domCache.gameStarting = document.getElementById('gameStarting');
  domCache.toastContainer = document.getElementById('toastContainer');
  domCache.joinRoomForm = document.getElementById('joinRoomForm');
  domCache.headerActions = document.getElementById('headerActions');
  domCache.authTabBtn = document.getElementById('authTabBtn');
}

// Performance optimizations
function setupPerformanceOptimizations() {
  // Debounced resize handler
  const debouncedResize = debounce(() => {
    // Handle responsive adjustments
    adjustLayoutForScreenSize();
  }, 250);
  
  window.addEventListener('resize', debouncedResize);
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Setup intersection observer for lazy loading
  setupLazyLoading();
}

function adjustLayoutForScreenSize() {
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
  
  // Adjust quiz options layout for mobile
  const quizOptions = document.querySelector('.quiz-options');
  if (quizOptions) {
    if (isMobile) {
      quizOptions.style.gridTemplateColumns = '1fr';
    } else {
      quizOptions.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }
  }
  
  // Adjust players grid for different screen sizes
  if (domCache.playersGrid) {
    if (isMobile) {
      domCache.playersGrid.style.gridTemplateColumns = '1fr';
    } else if (isTablet) {
      domCache.playersGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      domCache.playersGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    }
  }
}

function preloadCriticalResources() {
  // Preload confetti library if not already loaded
  if (typeof confetti === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
    script.async = true;
    document.head.appendChild(script);
  }
}

function setupLazyLoading() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        // Unobserve after animation to improve performance
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  // Observe elements for animation
  document.querySelectorAll('.action-card, .achievement-badge, .leaderboard-item, .player-card').forEach(el => {
    observer.observe(el);
  });
}

// Enhanced Socket Initialization with better error handling
function initializeSocket() {
  if (typeof io !== 'function') {
    console.error('Socket.IO client library not loaded');
    showToast('Couldn’t load Socket.IO – check your CDN link', 'error');
    return;
  }
  socket = io({
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  
  });
  
  socket.on('connect', () => {
    console.log('🔌 Connected to server');
    updateConnectionStatus(true);
    showToast('Connected to server', 'success');
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected from server:', reason);
    updateConnectionStatus(false);
    if (reason === 'io server disconnect') {
      showToast('Server disconnected. Attempting to reconnect...', 'warning');
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    updateConnectionStatus(false);
    showToast('Connection failed. Please check your internet connection.', 'error');
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log('🔌 Reconnected after', attemptNumber, 'attempts');
    updateConnectionStatus(true);
    showToast('Reconnected to server', 'success');
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
    showToast('Failed to reconnect. Please refresh the page.', 'error');
  });
  
  // Game event handlers
  socket.on('playerList', (data) => updatePlayersList(data.players, data.hostId));
  socket.on('quizStarted', (data) => showGameStarting(data));
  socket.on('newQuestion', (data) => showQuestion(data));
  socket.on('answerResult', (data) => showAnswerResult(data));
  socket.on('quizEnded', (data) => showGameResults(data));
  socket.on('error', (data) => showToast(data.message, 'error'));
  
  socket.on('achievementUnlocked', (achievement) => {
    showToast(`🎉 Achievement Unlocked: ${achievement.name}!`, 'success');
    loadAchievements();
    triggerConfetti();
    playAchievementSound();
  });
  
  socket.on('levelUp', (data) => {
    showToast(`🎉 Level Up! You are now level ${data.newLevel}!`, 'success');
    updateUserProfile();
    triggerConfetti();
    playLevelUpSound();
  });
}

// Enhanced Event Listeners with better organization
function setupEventListeners() {
  // Navigation tabs with improved accessibility
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', handleTabClick);
    tab.addEventListener('keydown', handleTabKeydown);
  });
  
  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', handleAuthTabClick);
  });
  
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Form submissions with validation
  setupFormSubmissions();
  
  // Window events
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Touch events for mobile
  setupTouchEvents();
}

function handleTabClick(e) {
  const tabName = e.currentTarget.dataset.tab;
  showTab(tabName);
  
  // Analytics tracking (if needed)
  trackEvent('tab_click', { tab: tabName });
}

function handleTabKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleTabClick(e);
  }
}

function handleAuthTabClick(e) {
  const formType = e.currentTarget.dataset.form;
  showAuthForm(formType);
}

function handleFilterClick(e) {
  const type = e.currentTarget.dataset.type;
  loadLeaderboard(type);
}

function handleBeforeUnload(e) {
  if (currentRoom && gameState === 'playing') {
    e.preventDefault();
    e.returnValue = 'You are currently in a quiz. Are you sure you want to leave?';
    return e.returnValue;
  }
}

function handleOnline() {
  showToast('Connection restored', 'success');
  if (socket && !socket.connected) {
    socket.connect();
  }
}

function handleOffline() {
  showToast('Connection lost. Please check your internet connection.', 'warning');
}

function setupTouchEvents() {
  // Add touch feedback for mobile devices
  document.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('btn') || e.target.classList.contains('quiz-option')) {
      e.target.style.transform = 'scale(0.98)';
    }
  });
  
  document.addEventListener('touchend', (e) => {
    if (e.target.classList.contains('btn') || e.target.classList.contains('quiz-option')) {
      setTimeout(() => {
        e.target.style.transform = '';
      }, 150);
    }
  });
}

// Enhanced Connection Status with better visual feedback
function updateConnectionStatus(connected) {
  if (!domCache.connectionStatus) return;
  
  const indicator = domCache.connectionStatus.querySelector('.status-indicator');
  const text = domCache.connectionStatus.querySelector('.status-text');
  
  if (connected) {
    domCache.connectionStatus.className = 'connection-status connected';
    text.textContent = 'Connected';
    indicator.style.background = 'var(--success)';
  } else {
    domCache.connectionStatus.className = 'connection-status disconnected';
    text.textContent = 'Disconnected';
    indicator.style.background = 'var(--error)';
  }
  
  // Add subtle animation
  domCache.connectionStatus.style.animation = 'none';
  setTimeout(() => {
    domCache.connectionStatus.style.animation = 'fadeIn 0.3s ease-in-out';
  }, 10);
}

// Enhanced Tab Navigation with better state management
function showTab(tabName) {
  // Validate tab name
  const validTabs = ['home', 'achievements', 'leaderboard', 'create', 'room', 'auth', 'profile'];
  if (!validTabs.includes(tabName)) {
    console.warn('Invalid tab name:', tabName);
    return;
  }
  
  // Update navigation with smooth transitions
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.setAttribute('aria-selected', 'false');
    }
  });
  
  // Update content with fade transition
  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.classList.contains('active')) {
      content.style.opacity = '0';
      setTimeout(() => {
        content.classList.remove('active');
      }, 150);
    }
  });
  
  setTimeout(() => {
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
      targetTab.classList.add('active');
      targetTab.style.opacity = '0';
      setTimeout(() => {
        targetTab.style.opacity = '1';
      }, 10);
      
      // Trigger animations and load content
      triggerTabAnimation(targetTab);
      handleTabSpecificActions(tabName);
    }
  }, 150);
  
  // Update URL hash for better navigation
  if (history.pushState) {
    history.pushState(null, null, `#${tabName}`);
  }
}

// Handle tab-specific actions with better error handling
function handleTabSpecificActions(tabName) {
  try {
    switch (tabName) {
      case 'auth':
        if (currentUser) {
          showTab('profile');
        }
        break;
      case 'profile':
        updateUserProfile();
        break;
      case 'achievements':
        loadAchievements();
        break;
      case 'leaderboard':
        loadLeaderboard('xp');
        break;
      case 'room':
        if (!currentRoom) {
          showTab('home');
          showToast('You are not in a room', 'warning');
        }
        break;
    }
  } catch (error) {
    console.error('Error in tab-specific actions:', error);
    showToast('Error loading tab content', 'error');
  }
}

// Enhanced Room Management with better UX
function showJoinRoom() {
  if (!domCache.joinRoomForm) return;
  
  domCache.joinRoomForm.style.display = 'flex';
  domCache.joinRoomForm.style.opacity = '0';
  
  // Focus management for accessibility
  const playerNameInput = document.getElementById('playerName');
  if (playerNameInput) {
    setTimeout(() => {
      playerNameInput.focus();
    }, 300);
  }
  
  // Smooth animation
  setTimeout(() => {
    domCache.joinRoomForm.style.opacity = '1';
    const content = domCache.joinRoomForm.querySelector('.modal-content');
    if (content) {
      content.style.transform = 'scale(1)';
    }
  }, 10);
}

function hideJoinRoom() {
  if (!domCache.joinRoomForm) return;
  
  const content = domCache.joinRoomForm.querySelector('.modal-content');
  
  domCache.joinRoomForm.style.opacity = '0';
  if (content) {
    content.style.transform = 'scale(0.9)';
  }
  
  setTimeout(() => {
    domCache.joinRoomForm.style.display = 'none';
  }, 200);
}

function createRoom() {
  const roomId = generateRoomId();
  currentRoom = roomId;
  isHost = true;
  
  // Update UI with better feedback
  if (domCache.roomDisplay) domCache.roomDisplay.textContent = roomId;
  if (domCache.joinRoomForm) domCache.joinRoomForm.style.display = 'none';
  if (domCache.playersSection) domCache.playersSection.style.display = 'block';
  if (domCache.roomTabBtn) domCache.roomTabBtn.style.display = 'flex';
  
  // Show room tab with animation
  showTab('room');
  
  // Emit to server with error handling
  if (socket && socket.connected) {
    socket.emit('joinRoom', {
      roomId,
      playerName: currentUser?.username || 'Host',
      userId: currentUser ? currentUser.id : null
    });
    
    showToast(`Room ${roomId} created successfully!`, 'success');
    playSuccessSound();
  } else {
    showToast('Cannot create room: Not connected to server', 'error');
  }
}

function generateRoomId() {
  // Generate a more user-friendly room ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function joinRoom() {
  const playerName = document.getElementById('playerName')?.value.trim();
  const roomCode = document.getElementById('roomCode')?.value.trim().toUpperCase();
  
  // Enhanced validation
  if (!playerName) {
    showToast('Please enter your name', 'error');
    document.getElementById('playerName')?.focus();
    return;
  }
  if (playerName.length < 2) {
    showToast('Name must be at least 2 characters long', 'error');
    return;
  }
  if (!roomCode) {
    showToast('Please enter a room code', 'error');
    document.getElementById('roomCode')?.focus();
    return;
  }
  if (roomCode.length !== 6) {
    showToast('Room code must be 6 characters long', 'error');
    return;
  }
  
  if (!socket || !socket.connected) {
    showToast('Cannot join room: Not connected to server', 'error');
    return;
  }
  
  // Show loading state
  const joinButton = document.querySelector('.modal-footer .btn-primary');
  if (joinButton) {
    joinButton.disabled = true;
    joinButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
  }
  
  socket.once('joinedRoom', (data) => {
    currentRoom = data.roomId;
    isHost = data.isHost;
    
    if (domCache.roomDisplay) domCache.roomDisplay.textContent = data.roomId;
    if (domCache.joinRoomForm) domCache.joinRoomForm.style.display = 'none';
    if (domCache.playersSection) domCache.playersSection.style.display = 'block';
    if (domCache.roomTabBtn) domCache.roomTabBtn.style.display = 'flex';
    
    showToast('Joined room successfully!', 'success');
    showTab('room');
    playSuccessSound();
    
    // Reset button state
    if (joinButton) {
      joinButton.disabled = false;
      joinButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Game';
    }
  });
  
  socket.once('error', (data) => {
    showToast(data.message, 'error');
    // Reset button state
    if (joinButton) {
      joinButton.disabled = false;
      joinButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Game';
    }
  });
  
  socket.emit('joinRoom', {
    roomId: roomCode,
    playerName,
    userId: currentUser ? currentUser.id : null
  });
}

function leaveRoom() {
  if (socket && currentRoom) {
    socket.disconnect();
    socket.connect();
    currentRoom = null;
    isHost = false;
    
    if (domCache.roomDisplay) domCache.roomDisplay.textContent = 'Not Connected';
    if (domCache.playersSection) domCache.playersSection.style.display = 'none';
    if (domCache.roomTabBtn) domCache.roomTabBtn.style.display = 'none';
    
    closeQuizMode();
    showToast('Left room', 'warning');
    showTab('home');
  }
}

// Enhanced Players List with better animations
function updatePlayersList(players, hostId) {
  if (!domCache.playersGrid || !domCache.playerCount) return;
  
  domCache.playersGrid.innerHTML = '';
  domCache.playerCount.textContent = `${players.length} player${players.length !== 1 ? 's' : ''}`;
  
  isHost = socket.id === hostId;
  
  players.forEach((player, index) => {
    const card = document.createElement('div');
    card.className = `player-card ${player.isHost ? 'host' : ''}`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Enhanced player card with better information display
    card.innerHTML = `
      ${player.isHost ? '<i class="crown-icon fas fa-crown"></i>' : ''}
      <div class="player-level-badge">Lv.${player.level || 1}</div>
      <div class="player-avatar" style="background: ${generatePlayerColor(player.name)}">${player.name.charAt(0).toUpperCase()}</div>
      <h3 title="${player.name}">${truncateText(player.name, 15)}</h3>
      <p><i class="fas fa-star"></i> Score: ${formatNumber(player.score || 0)}</p>
      <p><i class="fas fa-trophy"></i> XP: ${formatNumber(player.totalXP || 0)}</p>
      ${player.isHost ? '<p class="host-badge">Host</p>' : ''}
    `;
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
    
    domCache.playersGrid.appendChild(card);
  });
  
  // Update room actions
  updateRoomActions();
  
  // Trigger layout adjustment
  adjustLayoutForScreenSize();
}

function generatePlayerColor(name) {
  // Generate consistent color based on name
  const colors = [
    'linear-gradient(135deg, #dc2626, #b91c1c)',
    'linear-gradient(135deg, #ea580c, #c2410c)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #ca8a04, #a16207)',
    'linear-gradient(135deg, #65a30d, #4d7c0f)',
    'linear-gradient(135deg, #059669, #047857)',
    'linear-gradient(135deg, #0891b2, #0e7490)',
    'linear-gradient(135deg, #2563eb, #1d4ed8)',
    'linear-gradient(135deg, #7c3aed, #6d28d9)',
    'linear-gradient(135deg, #c026d3, #a21caf)'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function updateRoomActions() {
  if (!domCache.roomActions) return;
  
  if (isHost) {
    domCache.roomActions.innerHTML = `
      <div class="quiz-selection">
        <label for="quizSelect" class="input-label">Select Quiz Type:</label>
        <select id="quizSelect" class="input-field">
          <option value="">Random Questions</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="startSelectedQuiz()" ${!socket?.connected ? 'disabled' : ''}>
        <i class="fas fa-play"></i>
        Start Quiz
      </button>
      <button class="btn btn-secondary" onclick="leaveRoom()">
        <i class="fas fa-sign-out-alt"></i>
        Close Room
      </button>
    `;
    
    // Load available custom quizzes
    loadCustomQuizzes();
  } else {
    domCache.roomActions.innerHTML = `
      <button class="btn btn-warning" onclick="leaveRoom()">
        <i class="fas fa-sign-out-alt"></i>
        Leave Room
      </button>
    `;
  }
}

// Enhanced Quiz Functions with better error handling
function startQuiz(quizId = null) {
  if (!socket || !socket.connected) {
    showToast('Cannot start quiz: Not connected to server', 'error');
    return;
  }
  
  if (!isHost) {
    showToast('Only the host can start the quiz', 'error');
    return;
  }
  
  // Show loading state
  const startButton = domCache.roomActions?.querySelector('.btn-primary');
  if (startButton) {
    startButton.disabled = true;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
  }
  
  socket.emit('startQuiz', { roomId: currentRoom, quizId });
  
  // Reset button after timeout
  setTimeout(() => {
    if (startButton) {
      startButton.disabled = false;
      startButton.innerHTML = '<i class="fas fa-play"></i> Start Quiz';
    }
  }, 5000);
}

// New function to start quiz with selected quiz type
function startSelectedQuiz() {
  const quizSelect = document.getElementById('quizSelect');
  const selectedQuizId = quizSelect ? quizSelect.value : null;
  startQuiz(selectedQuizId || null);
}

// Function to load custom quizzes into the dropdown
async function loadCustomQuizzes() {
  try {
    const response = await fetch('/api/user-questions');
    if (response.ok) {
      const quizzes = await response.json();
      const quizSelect = document.getElementById('quizSelect');
      if (quizSelect && quizzes.length > 0) {
        // Add custom quizzes to dropdown
        quizzes.forEach(quiz => {
          const option = document.createElement('option');
          option.value = quiz._id;
          option.textContent = `${quiz.title} (${quiz.category} - ${quiz.difficulty})`;
          quizSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Failed to load custom quizzes:', error);
  }
}

function showGameStarting(data) {
  if (!domCache.gameStarting) return;
  
  const numberEl = domCache.gameStarting.querySelector('#countdownNumber');
  if (!numberEl) return;
  
  domCache.gameStarting.classList.add('active');
  
  let count = 3;
  numberEl.textContent = count;
  
  const countdown = setInterval(() => {
    count--;
    if (count >= 1) {
      numberEl.textContent = count;
      // Trigger animation with sound
      numberEl.style.animation = 'none';
      setTimeout(() => {
        numberEl.style.animation = 'countdownPulse 1s ease-in-out';
        playCountdownSound();
      }, 10);
    } else {
      clearInterval(countdown);
      domCache.gameStarting.classList.remove('active');
      showQuizMode();
      playStartSound();
    }
  }, 1000);
}

function showQuizMode() {
  if (!domCache.quizOverlay) return;
  
  domCache.quizOverlay.classList.add('active');
  gameState = 'playing';
  
  // Disable page scrolling during quiz
  document.body.style.overflow = 'hidden';
}

function closeQuizMode() {
  if (!domCache.quizOverlay) return;
  
  domCache.quizOverlay.classList.remove('active');
  gameState = 'waiting';
  
  // Re-enable page scrolling
  document.body.style.overflow = '';
  
  if (questionTimer) {
    clearInterval(questionTimer);
    questionTimer = null;
  }
}

function showQuestion(data) {
  currentQuestion = data;
  selectedAnswer = null;
  questionStartTime = Date.now();
  
  // Update progress with smooth animation
  const progress = (data.questionNumber / data.totalQuestions) * 100;
  const progressFill = document.getElementById('quizProgressFill');
  const progressText = document.getElementById('quizProgressText');
  const progressPercentage = document.getElementById('quizProgressPercentage');
  
  if (progressFill) {
    progressFill.style.width = progress + '%';
  }
  if (progressText) {
    progressText.textContent = `Question ${data.questionNumber} of ${data.totalQuestions}`;
  }
  if (progressPercentage) {
    progressPercentage.textContent = `${Math.round(progress)}%`;
  }
  
  // Render question with enhanced styling
  if (domCache.quizContent) {
    domCache.quizContent.innerHTML = `
      <div class="quiz-question">
        <div class="question-category">${data.question.category}</div>
        <div class="question-text">${data.question.text}</div>
        <div class="question-difficulty">
          <i class="fas fa-star"></i>
          Difficulty: <span class="difficulty-${data.question.difficulty}">${data.question.difficulty}</span>
        </div>
      </div>
      <div class="quiz-options">
        ${data.question.options.map((option, index) => `
          <button class="quiz-option" onclick="selectAnswer(${index})" data-index="${index}" aria-label="Option ${String.fromCharCode(65 + index)}: ${option}">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
          </button>
        `).join('')}
      </div>
    `;
  }
  
  // Start timer
  startQuestionTimer(data.timeLimit);
  
  // Animate options with staggered delay
  setTimeout(() => {
    document.querySelectorAll('.quiz-option').forEach((option, index) => {
      option.style.animationDelay = `${index * 0.1}s`;
      option.classList.add('animate-in');
    });
  }, 100);
  
  // Play question sound
  playQuestionSound();
}

function startQuestionTimer(timeLimit) {
  if (questionTimer) {
    clearInterval(questionTimer);
    questionTimer = null;
  }
  
  let timeLeft = timeLimit;
  const timerEl = document.getElementById('quizTimer');
  if (!timerEl) return;
  
  const timerText = timerEl.querySelector('.timer-text');
  const timerProgress = timerEl.querySelector('.timer-progress');
  
  const circumference = 2 * Math.PI * 35; // radius = 35
  if (timerProgress) {
    timerProgress.style.strokeDasharray = circumference;
    timerProgress.style.stroke = 'var(--primary)';
  }
  
  if (timerText) {
    timerText.textContent = timeLeft;
    timerText.style.color = 'var(--primary)';
  }
  
  questionTimer = setInterval(() => {
    timeLeft--;
    if (timerText) timerText.textContent = timeLeft;
    
    // Update progress circle
    if (timerProgress) {
      const progress = (timeLeft / timeLimit) * circumference;
      timerProgress.style.strokeDashoffset = circumference - progress;
      
      // Change color based on time left
      if (timeLeft <= 5) {
        timerProgress.style.stroke = 'var(--error)';
        if (timerText) timerText.style.color = 'var(--error)';
        // Add urgency animation
        timerEl.style.animation = 'pulse 0.5s infinite';
      } else if (timeLeft <= 10) {
        timerProgress.style.stroke = 'var(--warning)';
        if (timerText) timerText.style.color = 'var(--warning)';
      }
    }
    
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      questionTimer = null;
      if (selectedAnswer === null) {
        submitAnswer(-1);
        showToast('Time\'s up!', 'warning');
      }
    }
  }, 1000);
}

function selectAnswer(answerIndex) {
  if (selectedAnswer !== null) return;
  
  selectedAnswer = answerIndex;
  
  // Enhanced visual feedback
  document.querySelectorAll('.quiz-option').forEach((btn, index) => {
    if (index === answerIndex) {
      btn.classList.add('selected');
      btn.style.transform = 'scale(1.02)';
    }
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
  });
  
  // Play selection sound
  playSelectSound();
  
  // Submit answer with slight delay for visual feedback
  setTimeout(() => {
    submitAnswer(answerIndex);
  }, 200);
}

function submitAnswer(answerIndex) {
  if (!currentQuestion || !socket) return;
  
  const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
  const timeRemaining = Math.max(0, currentQuestion.timeLimit - elapsed);
  
  socket.emit('submitAnswer', {
    roomId: currentRoom,
    answerIndex: answerIndex,
    timeRemaining: timeRemaining
  });
  
  if (questionTimer) {
    clearInterval(questionTimer);
    questionTimer = null;
    
    // Stop timer animation
    const timerEl = document.getElementById('quizTimer');
    if (timerEl) timerEl.style.animation = '';
  }
}

function showAnswerResult(data) {
  document.querySelectorAll('.quiz-option').forEach((btn, index) => {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    
    if (index === data.correctAnswer) {
      btn.classList.add('correct');
      btn.style.transform = 'scale(1.02)';
    } else if (index === selectedAnswer && index !== data.correctAnswer) {
      btn.classList.add('incorrect');
      btn.style.animation = 'shake 0.6s ease-in-out';
    } else {
      btn.style.opacity = '0.6';
    }
  });
  
  // Show explanation if available
  if (data.explanation && domCache.quizContent) {
    const explanationCard = document.createElement('div');
    explanationCard.className = 'explanation-card';
    explanationCard.innerHTML = `
      <h4><i class="fas fa-lightbulb"></i> Explanation</h4>
      <p>${data.explanation}</p>
    `;
    explanationCard.style.opacity = '0';
    explanationCard.style.transform = 'translateY(20px)';
    
    domCache.quizContent.appendChild(explanationCard);
    
    setTimeout(() => {
      explanationCard.style.opacity = '1';
      explanationCard.style.transform = 'translateY(0)';
    }, 500);
  }
  
  // Enhanced feedback
  const pointsText = data.isCorrect ? 
    `+${data.points} points!` : 
    'No points';
  
  showToast(pointsText, data.isCorrect ? 'success' : 'error');
  
  if (data.isCorrect) {
    triggerConfetti();
    playCorrectSound();
  } else {
    playIncorrectSound();
  }
}

function showGameResults(data) {
  if (!domCache.quizContent) return;
  
  const myResult = data.results.find(r => r.id === socket.id) || {};
  const myRank = data.results.findIndex(r => r.id === socket.id) + 1;
  
  domCache.quizContent.innerHTML = `
    <div class="quiz-results">
      <div class="results-header">
        <div class="results-icon">
          <i class="fas fa-trophy"></i>
        </div>
        <div class="results-title">Quiz Complete!</div>
        <div class="results-score">${formatNumber(myResult.score || 0)}</div>
      </div>
      
      <div class="results-stats">
        <div class="result-stat">
          <span class="result-stat-value">${formatNumber(myResult.score || 0)}</span>
          <span class="result-stat-label">Points</span>
        </div>
        <div class="result-stat">
          <span class="result-stat-value">${myRank}</span>
          <span class="result-stat-label">Rank</span>
        </div>
        <div class="result-stat">
          <span class="result-stat-value">${data.results.length}</span>
          <span class="result-stat-label">Players</span>
        </div>
      </div>
      
      <div class="final-rankings">
        <h3>Final Rankings</h3>
        <div class="leaderboard-list">
          ${data.results.map((player, index) => `
            <div class="leaderboard-item ${player.id === socket.id ? 'highlight' : ''}">
              <div class="rank ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">${index + 1}</div>
              <div class="player-info">
                <div class="player-name">${truncateText(player.name, 20)}</div>
              </div>
              <div class="player-score">${formatNumber(player.score)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="results-actions">
        <button class="btn btn-primary" onclick="closeQuizMode()">
          <i class="fas fa-check"></i>
          Continue
        </button>
        ${isHost ? `
          <button class="btn btn-secondary" onclick="startQuiz()">
            <i class="fas fa-redo"></i>
            Play Again
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  // Trigger confetti for winner
  if (myRank === 1) {
    setTimeout(() => {
      triggerConfetti();
      playVictorySound();
    }, 1000);
  } else if (myRank <= 3) {
    setTimeout(() => {
      playSuccessSound();
    }, 1000);
  }
  
  // Update profile if logged in
  if (currentUser) {
    setTimeout(() => {
      updateUserProfile();
    }, 2000);
  }
}

// Enhanced Authentication with better error handling
function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      updateAuthUI();
      updateUserProfile();
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
    }
  } else {
    updateAuthUI();
  }
}

function updateAuthUI() {
  if (!domCache.authTabBtn || !domCache.headerActions) return;
  
  if (currentUser) {
    domCache.authTabBtn.innerHTML = '<i class="fas fa-user"></i><span>Profile</span>';
    domCache.authTabBtn.dataset.tab = 'profile';
    
    domCache.headerActions.innerHTML = `
      <div class="user-info">
        <div class="user-avatar" style="background: ${generatePlayerColor(currentUser.username)}">${currentUser.username.charAt(0).toUpperCase()}</div>
        <span class="user-name" title="${currentUser.username}">${truncateText(currentUser.username, 12)}</span>
      </div>
      <button class="btn btn-secondary" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i>
        Logout
      </button>
    `;
  } else {
    domCache.authTabBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login</span>';
    domCache.authTabBtn.dataset.tab = 'auth';
    domCache.headerActions.innerHTML = '';
  }
}

function showAuthForm(type) {
  const loginTab = document.querySelector('.auth-tab[data-form="login"]');
  const registerTab = document.querySelector('.auth-tab[data-form="register"]');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (!loginTab || !registerTab || !loginForm || !registerForm) return;
  
  // Update tabs with smooth transition
  document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
  
  if (type === 'login') {
    loginTab.classList.add('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    // Focus first input
    setTimeout(() => {
      document.getElementById('loginUsername')?.focus();
    }, 100);
  } else {
    registerTab.classList.add('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    // Focus first input
    setTimeout(() => {
      document.getElementById('registerUsername')?.focus();
    }, 100);
  }
}

async function login() {
  const username = document.getElementById('loginUsername')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  
  if (!username || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  // Show loading state
  const loginButton = document.querySelector('#loginForm .btn-primary');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      currentUser = data.user;
      updateAuthUI();
      updateUserProfile();
      showToast('Login successful!', 'success');
      showTab('profile');
      playSuccessSound();
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Network error: Could not connect to server', 'error');
  } finally {
    // Reset button state
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
  }
}

async function register() {
  const username = document.getElementById('registerUsername')?.value.trim();
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;
  
  // Enhanced validation
  if (!username || !email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (username.length < 3) {
    showToast('Username must be at least 3 characters long', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'error');
    return;
  }
  
  // Show loading state
  const registerButton = document.querySelector('#registerForm .btn-primary');
  if (registerButton) {
    registerButton.disabled = true;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      currentUser = data.user;
      updateAuthUI();
      updateUserProfile();
      showToast('Registration successful!', 'success');
      showTab('profile');
      playSuccessSound();
    } else {
      showToast(data.error, 'error');
    }
  } catch (error) {
    console.error('Register error:', error);
    showToast('Network error: Could not connect to server', 'error');
  } finally {
    // Reset button state
    if (registerButton) {
      registerButton.disabled = false;
      registerButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  currentUser = null;
  updateAuthUI();
  showToast('Logged out successfully', 'success');
  showTab('home');
}

// Enhanced Profile Management with better error handling
async function updateUserProfile() {
  if (!currentUser) {
    const userProfile = document.getElementById('userProfile');
    const guestMessage = document.getElementById('guestMessage');
    if (userProfile) userProfile.style.display = 'none';
    if (guestMessage) guestMessage.style.display = 'block';
    return;
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      showToast('Session expired, please log in again', 'error');
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const profile = await response.json();
    
    const guestMessage = document.getElementById('guestMessage');
    const userProfile = document.getElementById('userProfile');
    
    if (guestMessage) guestMessage.style.display = 'none';
    if (userProfile) userProfile.style.display = 'block';
    
    if (userProfile) {
      userProfile.innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar" style="background: ${generatePlayerColor(profile.username)}">${profile.username.charAt(0).toUpperCase()}</div>
          <div class="profile-info">
            <h2>${profile.username}</h2>
            <div class="profile-level">Level ${profile.level || 1}</div>
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div class="stat-value">${formatNumber(profile.totalXP || 0)}</div>
            <div class="stat-label">Total XP</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-brain"></i></div>
            <div class="stat-value">${formatNumber(profile.stats?.quizzesCompleted || 0)}</div>
            <div class="stat-label">Quizzes</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            <div class="stat-value">${profile.achievements?.length || 0}</div>
            <div class="stat-label">Achievements</div>
          </div>
        </div>
        
        <div class="xp-progress-section">
          <div class="xp-progress-header">
            <span>Progress to Level ${(profile.level || 1) + 1}</span>
            <span>${formatNumber(profile.totalXP || 0)} / ${formatNumber(getXPForNextLevel(profile.level || 1))} XP</span>
          </div>
          <div class="xp-progress-bar">
            <div class="xp-progress-fill" style="width: ${calculateXPProgress(profile.level, profile.totalXP)}%"></div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showToast('Failed to load profile: ' + error.message, 'error');
  }
}

function calculateXPProgress(level, totalXP) {
  const currentLevelXP = Math.pow((level || 1) - 1, 2) * 100;
  const nextLevelXP = Math.pow(level || 1, 2) * 100;
  const progressXP = (totalXP || 0) - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  return Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));
}

function getXPForNextLevel(level) {
  return Math.pow(level || 1, 2) * 100;
}

// Enhanced Leaderboard with better loading states
async function loadLeaderboard(type) {
  try {
    // Update filter buttons with loading state
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.type === type) {
        btn.classList.add('active');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${btn.textContent.trim()}`;
      }
    });
    
    const response = await fetch(`/api/leaderboard?type=${type}&limit=10`);
    const data = await response.json();
    const list = document.getElementById('leaderboardList');
    
    if (!list) return;
    
    list.innerHTML = '';
    
    if (data.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No players yet</h3>
          <p>Be the first to join and compete!</p>
        </div>
      `;
      return;
    }
    
    data.forEach((player, index) => {
      const score = type === 'xp'
        ? formatNumber(player.totalXP || 0)
        : type === 'level'
          ? `Level ${player.level || 1}`
          : formatNumber(player.stats?.quizzesCompleted || 0);
      
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="rank ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">${index + 1}</div>
        <div class="player-info">
          <div class="player-name" title="${player.username}">${truncateText(player.username, 20)}</div>
          <div class="player-level">Level ${player.level || 1} • ${player.achievements?.length || 0} achievements</div>
        </div>
        <div class="player-score">${score}</div>
      `;
      
      list.appendChild(item);
    });
  } catch (error) {
    console.error('Leaderboard load error:', error);
    showToast('Failed to load leaderboard', 'error');
  } finally {
    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.type === type) {
        const icon = btn.querySelector('i');
        const text = btn.textContent.replace(/\s*Loading.*/, '').trim();
        btn.innerHTML = `${icon.outerHTML} ${text}`;
      }
    });
  }
}

// Enhanced Achievements with better visual feedback
async function loadAchievements() {
  try {
    const response = await fetch('/api/achievements');
    const achievements = await response.json();
    
    let userAchievements = [];
    if (currentUser) {
      const token = localStorage.getItem('authToken');
      const profileResponse = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        userAchievements = profile.achievements || [];
      }
    }
    
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (achievements.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <h3>No achievements available</h3>
          <p>Check back later for new achievements!</p>
        </div>
      `;
      return;
    }
    
    achievements.forEach((achievement, index) => {
      const isUnlocked = userAchievements.includes(achievement.id);
      const badge = document.createElement('div');
      badge.className = `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
      badge.style.animationDelay = `${index * 0.1}s`;
      
      badge.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
        ${isUnlocked ? '<div class="achievement-unlocked"><i class="fas fa-check"></i></div>' : ''}
        <div class="achievement-reward">+${achievement.xpReward || 0} XP</div>
      `;
      
      grid.appendChild(badge);
    });
  } catch (error) {
    console.error('Achievements load error:', error);
    showToast('Failed to load achievements', 'error');
  }
}

// Enhanced Create Quiz with better validation
function setupCreateQuizForm() {
  const createTab = document.getElementById('createTab');
  if (!createTab) {
    console.error('Element #createTab not found in DOM');
    return;
  }
  
  createTab.innerHTML = `
    <div class="create-quiz-container">
      <div class="section-header">
        <div class="section-title">
          <i class="fas fa-plus-circle"></i>
          <h2>Create Quiz</h2>
        </div>
        <div class="section-subtitle">Design your own custom quiz and challenge your friends</div>
      </div>
      
      <div class="quiz-form">
        <div class="form-section">
          <h3>Quiz Details</h3>
          <div class="form-grid">
            <div class="input-group">
              <label class="input-label">Quiz Title</label>
              <input type="text" id="quizTitle" placeholder="Enter an engaging quiz title" class="input-field" maxlength="100" required>
            </div>
            <div class="input-group">
              <label class="input-label">Category</label>
              <select id="quizCategory" class="input-field" required>
                <option value="">Select a category</option>
                <option value="General">General Knowledge</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Sports">Sports</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Technology">Technology</option>
                <option value="Art">Art & Literature</option>
                <option value="Music">Music</option>
                <option value="Movies">Movies & TV</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Difficulty</label>
              <select id="quizDifficulty" class="input-field" required>
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="questions-header">
            <h3>Questions <span class="question-count">(0)</span></h3>
            <button type="button" class="btn btn-secondary" onclick="addQuestion()">
              <i class="fas fa-plus"></i>
              Add Question
            </button>
          </div>
          <div id="questionsContainer" class="questions-container">
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary btn-large" onclick="saveQuiz()">
            <i class="fas fa-save"></i>
            Save Quiz
          </button>
          <button type="button" class="btn btn-secondary btn-large" onclick="saveAndStartQuiz()">
            <i class="fas fa-play"></i>
            Save and Start
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add initial question
  addQuestion();
}

function addQuestion() {
  const container = document.getElementById('questionsContainer');
  if (!container) {
    console.error('questionsContainer not found');
    return;
  }
  
  const questionNumber = container.children.length + 1;
  
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question-form';
  questionDiv.innerHTML = `
    <div class="question-header">
      <div class="question-number">Question ${questionNumber}</div>
      <button type="button" class="btn-remove" onclick="removeQuestion(this)" ${questionNumber === 1 ? 'style="display: none;"' : ''}>
        <i class="fas fa-trash"></i>
      </button>
    </div>
    
    <div class="input-group">
      <label class="input-label">Question Text</label>
      <textarea placeholder="Enter your question" rows="3" class="input-field" required maxlength="500"></textarea>
    </div>
    
    <div class="options-section">
      <label class="input-label">Answer Options</label>
      <div class="options-grid">
        <div class="option-input">
          <div class="option-label">A</div>
          <input type="text" placeholder="Option A" class="input-field" required maxlength="200" />
        </div>
        <div class="option-input">
          <div class="option-label">B</div>
          <input type="text" placeholder="Option B" class="input-field" required maxlength="200" />
        </div>
        <div class="option-input">
          <div class="option-label">C</div>
          <input type="text" placeholder="Option C" class="input-field" required maxlength="200" />
        </div>
        <div class="option-input">
          <div class="option-label">D</div>
          <input type="text" placeholder="Option D" class="input-field" required maxlength="200" />
        </div>
      </div>
    </div>
    
    <div class="input-group">
      <label class="input-label">Correct Answer</label>
      <select class="input-field" required>
        <option value="">Select correct answer</option>
        <option value="0">A</option>
        <option value="1">B</option>
        <option value="2">C</option>
        <option value="3">D</option>
      </select>
    </div>
  `;
  
  container.appendChild(questionDiv);
  updateQuestionNumbers();
  
  // Animate in
  setTimeout(() => {
    questionDiv.classList.add('animate-in');
  }, 10);
  
  // Focus on question text
  const textarea = questionDiv.querySelector('textarea');
  if (textarea) {
    setTimeout(() => {
      textarea.focus();
    }, 300);
  }
}

function removeQuestion(button) {
  const questionForm = button.closest('.question-form');
  questionForm.style.animation = 'fadeOut 0.3s ease-in-out';
  setTimeout(() => {
    questionForm.remove();
    updateQuestionNumbers();
  }, 300);
}

function updateQuestionNumbers() {
  const questions = document.querySelectorAll('.question-form');
  const questionCount = document.querySelector('.question-count');
  
  if (questionCount) {
    questionCount.textContent = `(${questions.length})`;
  }
  
  questions.forEach((question, index) => {
    const numberEl = question.querySelector('.question-number');
    if (numberEl) {
      numberEl.textContent = `Question ${index + 1}`;
    }
    
    const removeBtn = question.querySelector('.btn-remove');
    if (removeBtn) {
      if (questions.length === 1) {
        removeBtn.style.display = 'none';
      } else {
        removeBtn.style.display = 'flex';
      }
    }
  });
}

async function saveQuiz() {
  const title = document.getElementById('quizTitle')?.value.trim();
  const category = document.getElementById('quizCategory')?.value;
  const difficulty = document.getElementById('quizDifficulty')?.value;
  
  // Enhanced validation
  if (!title) {
    showToast('Please enter a quiz title', 'error');
    document.getElementById('quizTitle')?.focus();
    return;
  }
  if (title.length < 5) {
    showToast('Quiz title must be at least 5 characters long', 'error');
    return;
  }
  if (!category) {
    showToast('Please select a category', 'error');
    document.getElementById('quizCategory')?.focus();
    return;
  }
  if (!difficulty) {
    showToast('Please select difficulty level', 'error');
    document.getElementById('quizDifficulty')?.focus();
    return;
  }
  
  const questions = [];
  const questionForms = document.querySelectorAll('.question-form');
  
  for (let i = 0; i < questionForms.length; i++) {
    const form = questionForms[i];
    const text = form.querySelector('textarea')?.value.trim();
    const options = Array.from(form.querySelectorAll('.option-input input')).map(input => input.value.trim());
    const correctIndex = parseInt(form.querySelector('select')?.value);
    
    if (!text) {
      showToast(`Please enter text for question ${i + 1}`, 'error');
      form.querySelector('textarea')?.focus();
      return;
    }
    
    if (text.length < 10) {
      showToast(`Question ${i + 1} must be at least 10 characters long`, 'error');
      return;
    }
    
    if (options.length !== 4 || options.some(option => !option)) {
      showToast(`Please fill all four options for question ${i + 1}`, 'error');
      return;
    }
    
    if (options.some(option => option.length < 1)) {
      showToast(`All options for question ${i + 1} must have at least 1 character`, 'error');
      return;
    }
    
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      showToast(`Please select a valid correct answer for question ${i + 1}`, 'error');
      form.querySelector('select')?.focus();
      return;
    }
    
    // Check for duplicate options
    const uniqueOptions = [...new Set(options.map(opt => opt.toLowerCase()))];
    if (uniqueOptions.length !== options.length) {
      showToast(`Question ${i + 1} has duplicate options. Please make each option unique.`, 'error');
      return;
    }
    
    questions.push({ text, options, correctIndex });
  }
  
  if (questions.length < 3) {
    showToast('Please add at least 3 questions to create a quiz', 'error');
    return;
  }
  
  // Show loading state
  const saveButton = document.querySelector('.form-actions .btn-primary');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  }
  
  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ title, category, difficulty, questions })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Quiz created successfully!', 'success');
      
      // Reset form
      document.getElementById('quizTitle').value = '';
      document.getElementById('quizCategory').value = '';
      document.getElementById('quizDifficulty').value = '';
      document.getElementById('questionsContainer').innerHTML = '';
      addQuestion();
      
      triggerConfetti();
      playSuccessSound();
    } else {
      showToast(data.error || 'Failed to save quiz', 'error');
    }
  } catch (error) {
    console.error('Save quiz error:', error);
    showToast('Failed to create quiz: Network error', 'error');
  } finally {
    // Reset button state
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fas fa-save"></i> Save Quiz';
    }
  }
}

async function saveAndStartQuiz() {
  await saveQuiz();
  // Additional logic for starting quiz immediately could be added here
}

// Enhanced Toast System with better management
function showToast(message, type = 'info') {
  if (!domCache.toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Limit number of toasts
  const existingToasts = domCache.toastContainer.children;
  if (existingToasts.length >= 3) {
    existingToasts[0].remove();
  }
  
  domCache.toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out';
  }, 10);
  
  // Remove after delay
  const removeToast = () => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };
  
  setTimeout(removeToast, 4000);
  
  // Allow manual dismissal
  toast.addEventListener('click', removeToast);
}

// Enhanced Animations with better performance
function initializeAnimations() {
  // Use Intersection Observer for better performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  // Observe elements for animation
  document.querySelectorAll('.action-card, .achievement-badge, .leaderboard-item').forEach(el => {
    observer.observe(el);
  });
}

function triggerTabAnimation(tab) {
  const elements = tab.querySelectorAll('.action-card, .achievement-badge, .leaderboard-item, .player-card');
  elements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`;
    el.classList.add('animate-in');
  });
}

function triggerConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#b91c1c', '#ef4444', '#f87171']
    });
  }
}

// Enhanced Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  // ESC to close modals
  if (e.key === 'Escape') {
    hideJoinRoom();
    closeQuizMode();
  }
  
  // Number keys for quiz answers
  if (gameState === 'playing' && selectedAnswer === null) {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 4) {
      selectAnswer(num - 1);
    }
  }
  
  // Ctrl/Cmd + Enter to submit forms
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab?.id === 'authTab') {
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      
      if (loginForm?.style.display !== 'none') {
        login();
      } else if (registerForm?.style.display !== 'none') {
        register();
      }
    }
  }
}

// Form Submissions with better validation
function setupFormSubmissions() {
  // Enhanced form validation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const target = e.target;
      
      // Handle different form contexts
      if (target.closest('#loginForm')) {
        e.preventDefault();
        login();
      } else if (target.closest('#registerForm')) {
        e.preventDefault();
        register();
      } else if (target.closest('#joinRoomForm')) {
        e.preventDefault();
        joinRoom();
      }
    }
  });
  
  // Real-time validation
  setupRealTimeValidation();
}

function setupRealTimeValidation() {
  // Username validation
  const usernameInputs = document.querySelectorAll('#loginUsername, #registerUsername');
  usernameInputs.forEach(input => {
    input.addEventListener('input', debounce((e) => {
      const value = e.target.value.trim();
      if (value.length > 0 && value.length < 3) {
        e.target.style.borderColor = 'var(--error)';
      } else {
        e.target.style.borderColor = '';
      }
    }, 300));
  });
  
  // Email validation
  const emailInput = document.getElementById('registerEmail');
  if (emailInput) {
    emailInput.addEventListener('input', debounce((e) => {
      const value = e.target.value.trim();
      if (value.length > 0 && !isValidEmail(value)) {
        e.target.style.borderColor = 'var(--error)';
      } else {
        e.target.style.borderColor = '';
      }
    }, 300));
  }
  
  // Password validation
  const passwordInput = document.getElementById('registerPassword');
  if (passwordInput) {
    passwordInput.addEventListener('input', debounce((e) => {
      const value = e.target.value;
      if (value.length > 0 && value.length < 6) {
        e.target.style.borderColor = 'var(--error)';
      } else {
        e.target.style.borderColor = '';
      }
    }, 300));
  }
}

// Sound Effects (placeholder functions)
function playSuccessSound() {
  // Placeholder for success sound
  console.log('🔊 Success sound');
}

function playErrorSound() {
  // Placeholder for error sound
  console.log('🔊 Error sound');
}

function playCountdownSound() {
  // Placeholder for countdown sound
  console.log('🔊 Countdown sound');
}

function playStartSound() {
  // Placeholder for start sound
  console.log('🔊 Start sound');
}

function playQuestionSound() {
  // Placeholder for question sound
  console.log('🔊 Question sound');
}

function playSelectSound() {
  // Placeholder for select sound
  console.log('🔊 Select sound');
}

function playCorrectSound() {
  // Placeholder for correct answer sound
  console.log('🔊 Correct sound');
}

function playIncorrectSound() {
  // Placeholder for incorrect answer sound
  console.log('🔊 Incorrect sound');
}

function playVictorySound() {
  // Placeholder for victory sound
  console.log('🔊 Victory sound');
}

function playAchievementSound() {
  // Placeholder for achievement sound
  console.log('🔊 Achievement sound');
}

function playLevelUpSound() {
  // Placeholder for level up sound
  console.log('🔊 Level up sound');
}

// Utility Functions
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function trackEvent(eventName, properties = {}) {
  // Placeholder for analytics tracking
  console.log('📊 Event tracked:', eventName, properties);
}

// Error Handling with better reporting
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showToast('An unexpected error occurred', 'error');
  trackEvent('javascript_error', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno
  });
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showToast('Network error occurred', 'error');
  trackEvent('promise_rejection', {
    reason: e.reason?.toString()
  });
});

// Initialize URL hash navigation
window.addEventListener('load', () => {
  const hash = window.location.hash.substring(1);
  if (hash && ['home', 'achievements', 'leaderboard', 'create', 'auth', 'profile'].includes(hash)) {
    showTab(hash);
  }
});

console.log('🎮 Enhanced Quiz App loaded successfully!');

