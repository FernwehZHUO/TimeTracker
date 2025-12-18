// ===== ChronosTrack - Time Management Application =====

// ===== State Management =====
const state = {
    tasks: [],
    logs: {},
    selectedDate: new Date().toISOString().split('T')[0],
    timer: {
        minutes: 25,
        seconds: 0,
        isActive: false,
        mode: 'work',
        interval: null
    },
    sessions: 0
};

// ===== Local Storage Keys =====
const STORAGE_KEYS = {
    TASKS: 'chronos_tasks_',
    LOGS: 'chronos_logs_',
    SESSIONS: 'chronos_sessions_'
};

// ===== DOM Elements =====
const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Date
    selectedDate: document.getElementById('selectedDate'),
    prevDay: document.getElementById('prevDay'),
    nextDay: document.getElementById('nextDay'),
    
    // Tasks
    taskForm: document.getElementById('taskForm'),
    newTaskInput: document.getElementById('newTaskInput'),
    tasksList: document.getElementById('tasksList'),
    taskCounter: document.getElementById('taskCounter'),
    
    // Momentum
    momentumValue: document.getElementById('momentumValue'),
    momentumFill: document.getElementById('momentumFill'),
    
    // Hours
    hoursList: document.getElementById('hoursList'),
    
    // Timer
    timerDisplay: document.getElementById('timerDisplay'),
    timerStartBtn: document.getElementById('timerStartBtn'),
    timerResetBtn: document.getElementById('timerResetBtn'),
    timerModes: document.querySelectorAll('.timer-mode'),
    sessionCount: document.getElementById('sessionCount'),
    
    // Stats
    allocationBars: document.getElementById('allocationBars'),
    summaryCards: document.getElementById('summaryCards'),
    tipText: document.getElementById('tipText'),
    
    // Weekly
    weeklyChart: document.getElementById('weeklyChart'),
    insightsList: document.getElementById('insightsList')
};

// ===== Initialize Application =====
function init() {
    // Set today's date
    elements.selectedDate.value = state.selectedDate;
    
    // Load data for current date
    loadData();
    
    // Render all components
    renderHoursList();
    renderTasks();
    updateMomentum();
    renderStats();
    renderWeekly();
    loadSessions();
    
    // Setup event listeners
    setupEventListeners();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Navigation tabs
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Date navigation
    elements.selectedDate.addEventListener('change', (e) => {
        state.selectedDate = e.target.value;
        loadData();
        renderAll();
    });
    
    elements.prevDay.addEventListener('click', () => changeDate(-1));
    elements.nextDay.addEventListener('click', () => changeDate(1));
    
    // Task form
    elements.taskForm.addEventListener('submit', addTask);
    
    // Timer controls
    elements.timerStartBtn.addEventListener('click', toggleTimer);
    elements.timerResetBtn.addEventListener('click', resetTimer);
    
    elements.timerModes.forEach(btn => {
        btn.addEventListener('click', () => setTimerMode(btn.dataset.mode));
    });
}

// ===== Tab Navigation =====
function switchTab(tabName) {
    elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Refresh data when switching tabs
    if (tabName === 'stats') renderStats();
    if (tabName === 'weekly') renderWeekly();
}

// ===== Date Management =====
function changeDate(direction) {
    const date = new Date(state.selectedDate);
    date.setDate(date.getDate() + direction);
    state.selectedDate = date.toISOString().split('T')[0];
    elements.selectedDate.value = state.selectedDate;
    loadData();
    renderAll();
}

// ===== Local Storage =====
function saveData() {
    const dateKey = state.selectedDate;
    localStorage.setItem(STORAGE_KEYS.TASKS + dateKey, JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.LOGS + dateKey, JSON.stringify(state.logs));
}

function loadData() {
    const dateKey = state.selectedDate;
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS + dateKey);
    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS + dateKey);
    
    state.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    state.logs = savedLogs ? JSON.parse(savedLogs) : {};
}

function saveSessions() {
    const dateKey = state.selectedDate;
    localStorage.setItem(STORAGE_KEYS.SESSIONS + dateKey, state.sessions.toString());
}

function loadSessions() {
    const dateKey = state.selectedDate;
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS + dateKey);
    state.sessions = saved ? parseInt(saved) : 0;
    updateSessionDisplay();
}

// ===== Render All =====
function renderAll() {
    renderTasks();
    renderHoursList();
    updateMomentum();
    renderStats();
    loadSessions();
}

// ===== Tasks =====
function addTask(e) {
    e.preventDefault();
    const text = elements.newTaskInput.value.trim();
    if (!text) return;
    
    state.tasks.push({
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    elements.newTaskInput.value = '';
    saveData();
    renderTasks();
    updateMomentum();
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
        updateMomentum();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveData();
    renderTasks();
    updateMomentum();
}

function renderTasks() {
    const completed = state.tasks.filter(t => t.completed).length;
    elements.taskCounter.textContent = `${completed}/${state.tasks.length} Completed`;
    
    if (state.tasks.length === 0) {
        elements.tasksList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <p>No tasks set for today. Add one above!</p>
            </div>
        `;
        return;
    }
    
    elements.tasksList.innerHTML = state.tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-left" onclick="toggleTask(${task.id})">
                <div class="task-checkbox">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <button class="task-delete" onclick="deleteTask(${task.id}); event.stopPropagation();">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                </svg>
            </button>
        </div>
    `).join('');
}

function updateMomentum() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    elements.momentumValue.textContent = `${percentage}%`;
    elements.momentumFill.style.width = `${percentage}%`;
}

// ===== Hours List =====
function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
}

function renderHoursList() {
    elements.hoursList.innerHTML = Array.from({ length: 24 }, (_, i) => {
        const log = state.logs[i] || { text: '', category: 'general' };
        return `
            <div class="hour-item">
                <div class="hour-label">${formatHour(i)}</div>
                <div class="hour-input-wrapper">
                    <input type="text" 
                           class="hour-input" 
                           placeholder="Untracked hour..."
                           value="${escapeHtml(log.text)}"
                           onchange="updateLog(${i}, this.value)"
                           data-hour="${i}">
                    <select class="hour-category ${log.category}" 
                            onchange="updateLogCategory(${i}, this.value)"
                            data-hour="${i}">
                        <option value="general" ${log.category === 'general' ? 'selected' : ''}>Gen</option>
                        <option value="revision" ${log.category === 'revision' ? 'selected' : ''}>Rev</option>
                        <option value="break" ${log.category === 'break' ? 'selected' : ''}>Brk</option>
                        <option value="routine" ${log.category === 'routine' ? 'selected' : ''}>Rtn</option>
                    </select>
                </div>
            </div>
        `;
    }).join('');
}

function updateLog(hour, text) {
    if (!state.logs[hour]) {
        state.logs[hour] = { text: '', category: 'general' };
    }
    state.logs[hour].text = text;
    saveData();
}

function updateLogCategory(hour, category) {
    if (!state.logs[hour]) {
        state.logs[hour] = { text: '', category: 'general' };
    }
    state.logs[hour].category = category;
    
    // Update visual class
    const select = document.querySelector(`select[data-hour="${hour}"]`);
    if (select) {
        select.className = `hour-category ${category}`;
    }
    
    saveData();
    renderStats();
}

// ===== Timer =====
function toggleTimer() {
    state.timer.isActive = !state.timer.isActive;
    
    if (state.timer.isActive) {
        elements.timerStartBtn.textContent = 'Pause';
        elements.timerStartBtn.classList.add('running');
        state.timer.interval = setInterval(tickTimer, 1000);
    } else {
        elements.timerStartBtn.textContent = 'Start';
        elements.timerStartBtn.classList.remove('running');
        clearInterval(state.timer.interval);
    }
}

function tickTimer() {
    if (state.timer.seconds > 0) {
        state.timer.seconds--;
    } else if (state.timer.minutes > 0) {
        state.timer.minutes--;
        state.timer.seconds = 59;
    } else {
        // Timer complete
        completeTimer();
    }
    updateTimerDisplay();
}

function completeTimer() {
    state.timer.isActive = false;
    clearInterval(state.timer.interval);
    elements.timerStartBtn.textContent = 'Start';
    elements.timerStartBtn.classList.remove('running');
    
    // Increment sessions if work mode
    if (state.timer.mode === 'work') {
        state.sessions++;
        saveSessions();
        updateSessionDisplay();
    }
    
    // Play notification sound (if supported)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleC4MPIzf6bqQTC85i+PtvqJgMi2G6e7GqHQuJYLr78+seSwhhO7w1LF+LR2B7vLYtIAtGoHu89y3gy4Ygu7z4LuGLhWE7vTkvokvFIXu9ei/jC8ThO716sKOMRKG7vXsxJEyEYfu9e7GkzMPiO717seUNQ2L7vXwyJY3C43u9fHJlzkJju718sqYOgeP7vXzzJk8BY/u9fXNmj0Eke/19c+cPgCR7/X20Z4+');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {}
    
    // Switch mode
    setTimerMode(state.timer.mode === 'work' ? 'break' : 'work');
}

function resetTimer() {
    state.timer.isActive = false;
    clearInterval(state.timer.interval);
    elements.timerStartBtn.textContent = 'Start';
    elements.timerStartBtn.classList.remove('running');
    
    const minutes = state.timer.mode === 'work' ? 25 : 5;
    state.timer.minutes = minutes;
    state.timer.seconds = 0;
    updateTimerDisplay();
}

function setTimerMode(mode) {
    state.timer.mode = mode;
    state.timer.isActive = false;
    clearInterval(state.timer.interval);
    elements.timerStartBtn.textContent = 'Start';
    elements.timerStartBtn.classList.remove('running');
    
    // Update UI
    elements.timerModes.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Set time
    state.timer.minutes = mode === 'work' ? 25 : 5;
    state.timer.seconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = String(state.timer.minutes).padStart(2, '0');
    const secs = String(state.timer.seconds).padStart(2, '0');
    elements.timerDisplay.textContent = `${mins}:${secs}`;
}

function updateSessionDisplay() {
    elements.sessionCount.textContent = `Sessions today: ${state.sessions}`;
}

// ===== Stats =====
function calculateStats() {
    const categories = { revision: 0, break: 0, routine: 0, general: 0 };
    
    Object.values(state.logs).forEach(log => {
        if (log.text && log.text.trim()) {
            categories[log.category] = (categories[log.category] || 0) + 1;
        }
    });
    
    return categories;
}

function renderStats() {
    const stats = calculateStats();
    
    // Allocation bars
    elements.allocationBars.innerHTML = Object.entries(stats).map(([cat, count]) => {
        const percentage = (count / 24) * 100;
        const displayPercentage = count > 0 ? Math.max(percentage, 4) : 0;
        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        return `
            <div class="allocation-bar-item">
                <div class="allocation-bar-header">
                    <span class="label">${catName}</span>
                    <span class="value">${count}h</span>
                </div>
                <div class="allocation-bar">
                    <div class="allocation-bar-fill ${cat}" style="width: ${displayPercentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    // Summary cards
    const completedTasks = state.tasks.filter(t => t.completed).length;
    
    elements.summaryCards.innerHTML = `
        <div class="summary-card study">
            <div>
                <div class="label">Deep Study</div>
                <div class="value">${stats.revision}h<span class="suffix">Today</span></div>
            </div>
            <div class="icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
            </div>
        </div>
        <div class="summary-card goals">
            <div>
                <div class="label">Goals Met</div>
                <div class="value">${completedTasks}<span class="suffix">Total</span></div>
            </div>
            <div class="icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                </svg>
            </div>
        </div>
    `;
    
    // Tip text
    elements.tipText.textContent = `You've logged ${stats.break} hours of downtime. Research shows periodic 5-10 minute breaks every hour significantly improve retention.`;
}

// ===== Weekly =====
function renderWeekly() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date(state.selectedDate);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekData = [];
    let totalRevision = 0;
    let bestDay = { day: '', hours: 0 };
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        
        const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS + dateKey);
        const logs = savedLogs ? JSON.parse(savedLogs) : {};
        
        let revisionHours = 0;
        Object.values(logs).forEach(log => {
            if (log.text && log.text.trim() && log.category === 'revision') {
                revisionHours++;
            }
        });
        
        weekData.push({
            day: days[i],
            hours: revisionHours,
            isToday: dateKey === state.selectedDate
        });
        
        totalRevision += revisionHours;
        if (revisionHours > bestDay.hours) {
            bestDay = { day: days[i], hours: revisionHours };
        }
    }
    
    const maxHours = Math.max(...weekData.map(d => d.hours), 1);
    
    // Render chart
    elements.weeklyChart.innerHTML = weekData.map(d => {
        const height = (d.hours / maxHours) * 180;
        return `
            <div class="chart-bar-container">
                <div class="chart-bar" style="height: ${Math.max(height, 4)}px">
                    <span class="chart-bar-value">${d.hours}h</span>
                </div>
                <span class="chart-bar-label" style="${d.isToday ? 'color: var(--primary);' : ''}">${d.day}</span>
            </div>
        `;
    }).join('');
    
    // Render insights
    const avgDaily = (totalRevision / 7).toFixed(1);
    
    elements.insightsList.innerHTML = `
        <div class="insight-item">
            <div class="insight-icon ${totalRevision >= 14 ? 'good' : 'warning'}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
            </div>
            <div class="insight-content">
                <div class="insight-title">Weekly Study Total</div>
                <div class="insight-desc">${totalRevision} hours of revision this week</div>
            </div>
        </div>
        <div class="insight-item">
            <div class="insight-icon info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
            </div>
            <div class="insight-content">
                <div class="insight-title">Daily Average</div>
                <div class="insight-desc">${avgDaily} hours per day</div>
            </div>
        </div>
        <div class="insight-item">
            <div class="insight-icon ${bestDay.hours >= 4 ? 'good' : 'warning'}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                </svg>
            </div>
            <div class="insight-content">
                <div class="insight-title">Best Day</div>
                <div class="insight-desc">${bestDay.day} with ${bestDay.hours} hours</div>
            </div>
        </div>
    `;
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', init);
