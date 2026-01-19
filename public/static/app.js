/**
 * DrumTree Business Tracker
 * Main Application JavaScript
 */

// ====================
// Configuration
// ====================
const CONFIG = {
    SHEETS: {
        USERS: '1ftPlrOVjAt1V4H9dSRN3ptHYJJemoNLiheSRG4QtBr0',
        MASTERY: '1ZuXWFgJu5PMcoa7q74nh_C5pEpoLzYNzHQ-cMxUyL9I',
        PERFORMANCE: '1851AkYrs6SIS63X51yVFfP_7l7EcLBUiiJgYn74XXMI',
        KANBAN: '1ftPlrOVjAt1V4H9dSRN3ptHYJJemoNLiheSRG4QtBr0' // Using same as users for simplicity
    },
    SHEET_TABS: {
        USERS: 'Users',
        MASTERY_DASHBOARD: 'Dashboard',
        MASTERY_COURSES: 'Course',
        KANBAN_CARDS: 'KanbanCards'
    }
};

// ====================
// Global State
// ====================
const STATE = {
    currentUser: null,
    currentLevel: 1,
    currentView: null,
    globalBusinessFilter: 'company', // company, Content, or Channel
    users: [],
    masteryData: [],
    coursesList: [],
    kanbanCards: [],
    performanceData: null,
    filters: {
        mastery: {
            username: '',
            category: ''
        },
        kanban: {
            capability: [],
            lanes: ['Planned', 'In Progress', 'Completed', 'Paused'],
            category: [],
            owner: []
        }
    }
};

// ====================
// Utility Functions
// ====================
const Utils = {
    // Format date to YYYY-MM-DD
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    },
    
    // Calculate days between dates
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.abs(d2 - d1);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },
    
    // Get days since date
    daysSince(date) {
        return this.daysBetween(date, new Date());
    },
    
    // Show/hide elements
    show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) element.style.display = 'block';
    },
    
    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) element.style.display = 'none';
    },
    
    // Show error message
    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            this.show(el);
        }
    },
    
    // Hide error message
    hideError(elementId) {
        this.hide(elementId);
    },
    
    // Generate unique ID
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ====================
// Google Sheets API
// ====================
const SheetsAPI = {
    // Base URL for Google Sheets API
    getSheetUrl(sheetId, tabName, range = '') {
        const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
        let url = `${baseUrl}?sheet=${encodeURIComponent(tabName)}`;
        if (range) url += `&range=${encodeURIComponent(range)}`;
        url += '&tqx=out:json';
        return url;
    },
    
    // Fetch data from Google Sheets
    async fetchSheet(sheetId, tabName, range = '') {
        try {
            const url = this.getSheetUrl(sheetId, tabName, range);
            const response = await fetch(url);
            const text = await response.text();
            
            // Google Sheets returns JSONP, need to parse it
            const jsonText = text.substring(47).slice(0, -2);
            const data = JSON.parse(jsonText);
            
            return this.parseSheetData(data);
        } catch (error) {
            console.error('Error fetching sheet:', error);
            return [];
        }
    },
    
    // Parse Google Sheets response
    parseSheetData(data) {
        if (!data.table || !data.table.rows) return [];
        
        const cols = data.table.cols || [];
        const rows = data.table.rows || [];
        
        return rows.map(row => {
            const obj = {};
            cols.forEach((col, i) => {
                const cell = row.c && row.c[i];
                const value = cell ? (cell.v !== null ? cell.v : '') : '';
                const label = col.label || `Column${i}`;
                obj[label] = value;
            });
            return obj;
        });
    },
    
    // Update Google Sheet (via Google Apps Script Web App)
    async updateSheet(scriptUrl, data) {
        try {
            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Required for cross-origin Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating sheet:', error);
            return { success: false, error: error.message };
        }
    }
};

// ====================
// Authentication
// ====================
const Auth = {
    async init() {
        // Always load users first
        await this.loadUsers();
        
        // Check if user is already logged in (session storage)
        const stored = sessionStorage.getItem('currentUser');
        if (stored) {
            STATE.currentUser = JSON.parse(stored);
            this.showApp();
            return true;
        }
        
        // Show login screen
        Utils.hide('loading-screen');
        Utils.show('login-screen');
        
        // Setup login form
        this.setupLoginForm();
        
        return false;
    },
    
    async loadUsers() {
        // Load users from localStorage
        const stored = localStorage.getItem('users');
        
        if (stored) {
            STATE.users = JSON.parse(stored);
            console.log('Loaded users from localStorage:', STATE.users.length, 'users');
        } else {
            // First time - initialize with default users migrated from Google Sheet
            console.log('Initializing users for first time from Google Sheet data...');
            STATE.users = [
                {
                    id: 'user-1',
                    username: 'Pelayo',
                    password: 'password123',
                    name: 'Pelayo',
                    type: 'Admin',
                    contentBusiness: true,
                    channelBusiness: true,
                    lastLogin: ''
                },
                {
                    id: 'user-2',
                    username: 'Charlotte',
                    password: 'password123',
                    name: 'Charlotte',
                    type: 'Lead',
                    contentBusiness: true,
                    channelBusiness: false,
                    lastLogin: ''
                },
                {
                    id: 'user-3',
                    username: 'Vambai',
                    password: 'password123',
                    name: 'Vambai',
                    type: 'Lead',
                    contentBusiness: false,
                    channelBusiness: true,
                    lastLogin: ''
                },
                {
                    id: 'user-4',
                    username: 'Comfort',
                    password: 'password123',
                    name: 'Comfort',
                    type: 'User',
                    contentBusiness: true,
                    channelBusiness: false,
                    lastLogin: ''
                },
                {
                    id: 'user-5',
                    username: 'Kudzanai',
                    password: 'password123',
                    name: 'Kudzanai',
                    type: 'User',
                    contentBusiness: false,
                    channelBusiness: true,
                    lastLogin: ''
                },
                {
                    id: 'user-6',
                    username: 'Unesu',
                    password: 'password123',
                    name: 'Unesu',
                    type: 'Admin',
                    contentBusiness: true,
                    channelBusiness: true,
                    lastLogin: ''
                }
            ];
            
            this.saveUsers();
            console.log('Initialized', STATE.users.length, 'users');
        }
    },
    
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(STATE.users));
        console.log('Saved users to localStorage');
    },
    
    setupLoginForm() {
        const loginBtn = document.getElementById('login-btn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        const handleLogin = async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            Utils.hideError('login-error');
            
            if (!username || !password) {
                Utils.showError('login-error', 'Please enter both username and password');
                return;
            }
            
            // Find user
            const user = STATE.users.find(u => 
                u.username.toLowerCase() === username.toLowerCase() &&
                u.password === password
            );
            
            if (!user) {
                Utils.showError('login-error', 'Invalid username or password');
                return;
            }
            
            // Update last login timestamp
            user.lastLogin = new Date().toISOString();
            this.saveUsers();
            
            console.log('User logged in:', user.username, 'Type:', user.type, 'Type length:', user.type.length);
            
            // Store user session
            STATE.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Show app
            this.showApp();
        };
        
        loginBtn.addEventListener('click', handleLogin);
        
        // Enter key support
        [usernameInput, passwordInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
        });
    },
    
    showApp() {
        Utils.hide('login-screen');
        Utils.hide('loading-screen');
        Utils.show('app');
        
        // Update user info
        const userInfo = document.getElementById('user-info');
        userInfo.textContent = `${STATE.currentUser.name} (${STATE.currentUser.type})`;
        
        // Initialize app
        App.init();
    },
    
    logout() {
        sessionStorage.removeItem('currentUser');
        STATE.currentUser = null;
        location.reload();
    }
};

// ====================
// Main App
// ====================
const App = {
    async init() {
        console.log('App.init() called');
        
        // Wait for DOM to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load all data
        await this.loadAllData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show Level 1 (Scorecard)
        this.showLevel1();
        
        console.log('App.init() completed');
    },
    
    async loadAllData() {
        // Load mastery data (local)
        await this.loadMasteryData();
        
        // Load courses library (local)
        await this.loadCoursesLibrary();
        
        // Load kanban data
        await this.loadKanbanData();
        
        // Load performance data (placeholder)
        this.loadPerformanceData();
    },
    
    async loadMasteryData() {
        // Load mastery data from localStorage
        const stored = localStorage.getItem('masteryData');
        
        if (stored) {
            STATE.masteryData = JSON.parse(stored);
            console.log('Loaded mastery data from localStorage:', STATE.masteryData.length, 'records');
        } else {
            // Initialize with empty data
            STATE.masteryData = [];
            this.saveMasteryData();
            console.log('Initialized empty mastery data');
        }
    },
    
    saveMasteryData() {
        localStorage.setItem('masteryData', JSON.stringify(STATE.masteryData));
        console.log('Saved mastery data to localStorage');
    },
    
    async loadCoursesLibrary() {
        // Load courses library from localStorage
        const stored = localStorage.getItem('coursesLibrary');
        
        if (stored) {
            STATE.coursesList = JSON.parse(stored);
            console.log('Loaded courses library from localStorage:', STATE.coursesList.length, 'courses');
            
            // Migration: Add hours field to existing courses that don't have it
            let migrated = false;
            STATE.coursesList = STATE.coursesList.map(course => {
                if (!course.hours) {
                    migrated = true;
                    return { ...course, hours: 4 }; // Default 4 hours
                }
                return course;
            });
            
            if (migrated) {
                console.log('Migrated courses to include hours field (default: 4 hours)');
                this.saveCoursesLibrary();
            }
        } else {
            // Initialize with courses from Excel file
            console.log('Initializing courses library from Excel data...');
            STATE.coursesList = [
                {"id":"course-18","name":"AI Ethics: Ethical Intelligence for 2026","category":"Compliance","url":"https://www.udemy.com/course/chatgpt-ai-ethics-ethical-intelligence/","hours":4},
                {"id":"course-19","name":"Corporate Governance: Principles and Practice","category":"Compliance","url":"https://www.udemy.com/course/corporate-governance-k/","hours":4},
                {"id":"course-20","name":"Employment Laws in South Africa","category":"Compliance","url":"https://www.udemy.com/course/human-resources-labour-law-employment-laws-in-south-africa/","hours":4},
                {"id":"course-17","name":"Professional Ethics & Workplace Integrity Masterclass","category":"Compliance","url":"https://www.udemy.com/course/professional-ethics-mastery/","hours":4},
                {"id":"course-16","name":"The Complete Cyber Security Awareness Training for Employees","category":"Compliance","url":"https://www.udemy.com/course/cybersecurity-for-corporate-employees/","hours":4},
                {"id":"course-10","name":"Business Fundamentals: Marketing Strategy","category":"Function","url":"https://www.udemy.com/course/business-fundamentals-marketing-strategy/","hours":4},
                {"id":"course-6","name":"Canva Master Course 2026","category":"Function","url":"https://www.udemy.com/course/canva-master-course-graphic-design-for-beginners/","hours":4},
                {"id":"course-8","name":"Financial Reporeting & Analysis","category":"Function","url":"https://www.udemy.com/course/financial-reporting-analysis/","hours":4},
                {"id":"course-7","name":"Management Consulting Presentation Essentials Training 2026","category":"Function","url":"https://www.udemy.com/course/management-consulting-presentation-mckinsey/","hours":4},
                {"id":"course-9","name":"The Complete Digital Marketing Guide","category":"Function","url":"https://www.udemy.com/course/digital-marketing-guide/","hours":4},
                {"id":"course-14","name":"Business Model Innovation For Business Growth","category":"Leadership","url":"https://www.udemy.com/course/part-1-business-innovation-for-brand-growth/","hours":4},
                {"id":"course-11","name":"Communication, Leadership & Management","category":"Leadership","url":"https://www.udemy.com/course/high-impact-communication-skills/","hours":4},
                {"id":"course-13","name":"Leadership: Growth Mindset for Leadership and Organizations","category":"Leadership","url":"https://www.udemy.com/course/growth-mindset-for-leadership-and-organizations/","hours":4},
                {"id":"course-12","name":"Leadership: The Emotionally Intelligent Leader","category":"Leadership","url":"https://www.udemy.com/course/the-emotionally-intelligent-leader/","hours":4},
                {"id":"course-15","name":"MBA in a Box: Business Lessons from a CEO","category":"Leadership","url":"https://www.udemy.com/course/mba-in-a-box-business-lessons-from-a-ceo/","hours":4},
                {"id":"course-5","name":"Agentic AI for Beginners","category":"Technology","url":"https://www.udemy.com/course/agentic-ai-for-beginners/","hours":4},
                {"id":"course-2","name":"Claude Code Beginner to Pro","category":"Technology","url":"https://www.udemy.com/course/learn-claude-code/","hours":4},
                {"id":"course-3","name":"The Complete AI Coding Course (2025)","category":"Technology","url":"https://www.udemy.com/course/the-complete-ai-coding-course-2025-cursor-ai-v0-vercel/","hours":4},
                {"id":"course-4","name":"The Complete AI Guide","category":"Technology","url":"https://www.udemy.com/course/complete-ai-guide/","hours":4},
                {"id":"course-1","name":"Udemy: 100 Days of Code","category":"Technology","url":"https://www.udemy.com/course/100-days-of-code/","hours":4}
            ];
            
            this.saveCoursesLibrary();
            console.log('Initialized', STATE.coursesList.length, 'courses');
        }
    },
    
    saveCoursesLibrary() {
        localStorage.setItem('coursesLibrary', JSON.stringify(STATE.coursesList));
        console.log('Saved courses library to localStorage');
    },
    
    async loadKanbanData() {
        // For demo purposes, using local storage
        // In production, would load from a dedicated sheet
        const stored = localStorage.getItem('kanbanCards');
        const storedVersion = localStorage.getItem('kanbanVersion');
        const currentVersion = '2.0'; // Increment this to regenerate sample data
        
        // If no data, wrong version, or cards have invalid owners, regenerate
        if (!stored || storedVersion !== currentVersion) {
            console.log('Generating new sample kanban data with current users...');
            STATE.kanbanCards = this.generateSampleKanbanData();
            localStorage.setItem('kanbanVersion', currentVersion);
            this.saveKanbanData();
        } else {
            STATE.kanbanCards = JSON.parse(stored);
            
            // Validate that all card owners exist in current users list
            const validUsernames = STATE.users.map(u => u.username);
            const hasInvalidOwners = STATE.kanbanCards.some(card => !validUsernames.includes(card.owner));
            
            if (hasInvalidOwners) {
                console.log('Found invalid card owners, regenerating data...');
                STATE.kanbanCards = this.generateSampleKanbanData();
                localStorage.setItem('kanbanVersion', currentVersion);
                this.saveKanbanData();
            }
        }
    },
    
    generateSampleKanbanData() {
        // Generate sample data using actual users from the sheet
        // Use the current logged-in user as the owner
        const currentUsername = STATE.currentUser?.username;
        
        // Find different user types for variety
        const adminUsers = STATE.users.filter(u => u.type.trim() === 'Admin');
        const leadUsers = STATE.users.filter(u => u.type.trim() === 'Lead');
        const regularUsers = STATE.users.filter(u => u.type.trim() === 'User');
        
        // Pick owners from actual users
        const owner1 = adminUsers[0]?.username || STATE.users[0]?.username || currentUsername;
        const owner2 = leadUsers[0]?.username || STATE.users[1]?.username || currentUsername;
        const owner3 = regularUsers[0]?.username || STATE.users[2]?.username || currentUsername;
        
        console.log('Generating sample cards with owners:', { owner1, owner2, owner3 });
        
        return [
            {
                id: Utils.generateId(),
                name: 'Q1 Stakeholder Meeting with Econet',
                capability: 'Stakeholder Engagement',
                owner: owner1,
                category: 'Content',
                startDate: '2026-01-01',
                targetDate: '2026-01-31',
                status: 'green',
                lane: 'In Progress',
                comments: 'Quarterly business review scheduled'
            },
            {
                id: Utils.generateId(),
                name: 'Launch NoFunds Service',
                capability: 'Business Development',
                owner: owner2,
                category: 'Channel',
                startDate: '2026-01-10',
                targetDate: '2026-06-30',
                status: 'amber',
                lane: 'Planned',
                comments: 'Awaiting technical specifications'
            },
            {
                id: Utils.generateId(),
                name: 'YoGamezPro Product Refresh',
                capability: 'Product Planning',
                owner: owner3,
                category: 'Content',
                startDate: '2026-01-05',
                targetDate: '2026-02-28',
                status: 'green',
                lane: 'In Progress',
                comments: 'Design phase completed, moving to development'
            }
        ];
    },
    
    saveKanbanData() {
        localStorage.setItem('kanbanCards', JSON.stringify(STATE.kanbanCards));
    },
    
    loadPerformanceData() {
        // Placeholder for performance data
        // In production, would fetch from performance sheet
        STATE.performanceData = {
            mtdRevenue: 'R 2.1M',
            actualRunRate: 'R 85K/day',
            totalBase: '154k',
            revenueToday: 'R 89K'
        };
    },
    
    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());
        
        // Change password
        document.getElementById('change-password-btn').addEventListener('click', () => this.showChangePasswordModal());
        
        // Manage Users (Admin only)
        document.getElementById('manage-users-btn').addEventListener('click', () => this.showUserManagement());
        if (STATE.currentUser.type === 'Admin') {
            Utils.show('manage-users-btn');
        }
        
        // Add user button
        document.getElementById('add-user-btn').addEventListener('click', () => this.showEditUserModal());
        
        // Save user button
        document.getElementById('save-user-btn').addEventListener('click', () => this.saveUser());
        
        // Delete user button
        document.getElementById('delete-user-btn').addEventListener('click', () => {
            const userId = document.getElementById('edit-user-id').value;
            this.deleteUser(userId);
        });
        
        // Global Business Category Filter
        document.getElementById('global-business-filter').addEventListener('change', (e) => {
            STATE.globalBusinessFilter = e.target.value;
            this.applyGlobalBusinessFilter();
        });
        
        // Level 1 boxes click handlers
        document.querySelectorAll('.capability-box').forEach(box => {
            box.addEventListener('click', (e) => {
                const capability = box.getAttribute('data-capability');
                this.showKanban(capability);
            });
        });
        
        document.querySelector('.scorecard-box[data-view="performance"]').addEventListener('click', () => {
            this.showPerformance();
        });
        
        document.querySelector('.scorecard-box[data-view="mastery"]').addEventListener('click', () => {
            this.showMastery();
        });
        
        // Back buttons
        document.getElementById('back-to-level-1').addEventListener('click', () => this.showLevel1());
        document.getElementById('back-to-level-1-perf').addEventListener('click', () => this.showLevel1());
        document.getElementById('back-to-level-1-kanban').addEventListener('click', () => this.showLevel1());
        
        // Add buttons
        document.getElementById('add-course-activity-btn').addEventListener('click', () => this.showCourseModal());
        document.getElementById('course-library-btn').addEventListener('click', () => this.showCourseLibrary());
        document.getElementById('add-card-btn').addEventListener('click', () => this.showCardModal());
        
        // Course library buttons
        document.getElementById('add-library-course-btn').addEventListener('click', () => this.showLibraryCourseModal());
        document.getElementById('save-library-course-btn').addEventListener('click', () => this.saveLibraryCourse());
        
        // Open course library link from course modal
        document.getElementById('open-course-library-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            Utils.hide('course-modal');
            this.showCourseLibrary();
        });
        
        // Save buttons
        document.getElementById('save-password-btn').addEventListener('click', () => this.savePassword());
        document.getElementById('save-course-btn').addEventListener('click', () => this.saveCourse());
        document.getElementById('save-library-course-btn').addEventListener('click', () => this.saveLibraryCourse());
        document.getElementById('add-library-course-btn').addEventListener('click', () => this.showLibraryCourseModal());
        document.getElementById('save-card-btn').addEventListener('click', () => this.saveCard());
        document.getElementById('delete-card-btn').addEventListener('click', () => this.deleteCard());
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) Utils.hide(modal);
            });
        });
        
        // Filter change handlers
        document.getElementById('mastery-filter-username').addEventListener('change', () => this.filterMasteryTable());
        document.getElementById('mastery-filter-category').addEventListener('change', () => this.filterMasteryTable());
        
        document.getElementById('kanban-filter-capability').addEventListener('change', () => this.renderKanban());
        document.getElementById('kanban-filter-lanes').addEventListener('change', () => this.renderKanban());
        document.getElementById('kanban-filter-category').addEventListener('change', () => this.renderKanban());
        document.getElementById('kanban-filter-owner').addEventListener('change', () => this.renderKanban());
    },
    
    showLevel1() {
        console.log('showLevel1() called');
        STATE.currentLevel = 1;
        STATE.currentView = null;
        
        // Hide all level 2 views
        Utils.hide('level-2-mastery');
        Utils.hide('level-2-performance');
        Utils.hide('level-2-kanban');
        
        // Show level 1
        Utils.show('level-1');
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumb-content');
        if (breadcrumb) {
            breadcrumb.textContent = 'Business Review Scorecard';
        } else {
            console.warn('breadcrumb-content element not found');
        }
        
        // Update scorecard data
        this.updateScorecardData();
    },
    
    updateScorecardData() {
        console.log('updateScorecardData() called');
        
        // Update performance KPIs
        if (STATE.performanceData) {
            const perfContent = document.getElementById('performance-content');
            if (perfContent) {
                const kpis = perfContent.querySelectorAll('.kpi-value');
                if (kpis.length >= 4) {
                    kpis[0].textContent = STATE.performanceData.mtdRevenue;
                    kpis[1].textContent = STATE.performanceData.actualRunRate;
                    kpis[2].textContent = STATE.performanceData.totalBase;
                    kpis[3].textContent = STATE.performanceData.revenueToday;
                }
            }
        }
        
        // Update mastery stats
        this.updateMasteryStats();
        
        // Update capability stats
        this.updateCapabilityStats();
    },
    
    applyGlobalBusinessFilter() {
        // This function is called when the global business category filter changes
        console.log('Applying global business filter:', STATE.globalBusinessFilter);
        
        // Update scorecard data with new filter
        this.updateScorecardData();
        
        // If in Level 2 views, refresh them
        if (STATE.currentLevel === 2) {
            if (STATE.currentView === 'mastery') {
                this.filterMasteryTable();
            } else if (STATE.currentView === 'kanban') {
                this.renderKanban();
            }
        }
    },
    
    getFilteredUsers() {
        // Get users based on global business filter
        if (STATE.globalBusinessFilter === 'company') {
            return STATE.users;
        } else if (STATE.globalBusinessFilter === 'Content') {
            return STATE.users.filter(u => u.contentBusiness);
        } else if (STATE.globalBusinessFilter === 'Channel') {
            return STATE.users.filter(u => u.channelBusiness);
        }
        return STATE.users;
    },
    
    getFilteredMasteryData() {
        // Get mastery data based on global business filter
        const filteredUsers = this.getFilteredUsers();
        const usernames = filteredUsers.map(u => u.username);
        
        let data = STATE.masteryData.filter(m => usernames.includes(m.username));
        
        // Apply user permissions on top of business filter
        if (STATE.currentUser.type === 'User') {
            data = data.filter(m => m.username === STATE.currentUser.username);
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            const categoryUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            }).map(u => u.username);
            data = data.filter(m => categoryUsers.includes(m.username));
        }
        
        return data;
    },
    
    getFilteredKanbanCards() {
        // Get kanban cards based on global business filter
        let cards = STATE.kanbanCards;
        
        // Apply global business filter
        if (STATE.globalBusinessFilter === 'Content') {
            cards = cards.filter(c => c.category === 'Content');
        } else if (STATE.globalBusinessFilter === 'Channel') {
            cards = cards.filter(c => c.category === 'Channel');
        }
        // 'company' shows all cards
        
        // Apply user permissions on top of business filter
        if (STATE.currentUser.type === 'User') {
            cards = cards.filter(c => c.owner === STATE.currentUser.username);
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            cards = cards.filter(c => c.category === category);
        }
        
        return cards;
    },
    
    updateMasteryStats() {
        // Calculate learning hours by category
        const stats = {
            'Function': 0,
            'Technology': 0,
            'Leadership': 0,
            'Compliance': 0
        };
        
        // Use filtered data based on global business filter
        const filteredData = this.getFilteredMasteryData();
        
        // Calculate hours based on actual course hours and completion percentage
        filteredData.forEach(m => {
            if (stats[m.category] !== undefined) {
                // Find the course in the library to get its hours
                const course = STATE.coursesList.find(c => c.name === m.course);
                const courseHours = course ? (course.hours || 4) : 4; // Default to 4 hours if not found
                
                // Calculate completed hours: (completion % / 100) * course hours
                const completedHours = (m.completion / 100) * courseHours;
                stats[m.category] += completedHours;
            }
        });
        
        // Round to 1 decimal place
        Object.keys(stats).forEach(key => {
            stats[key] = Math.round(stats[key] * 10) / 10;
        });
        
        // Update UI
        const masteryContent = document.getElementById('mastery-content');
        if (masteryContent) {
            const statValues = masteryContent.querySelectorAll('.stat-value');
            if (statValues.length >= 4) {
                statValues[0].textContent = `${stats['Function']} hrs`;
                statValues[1].textContent = `${stats['Technology']} hrs`;
                statValues[2].textContent = `${stats['Leadership']} hrs`;
                statValues[3].textContent = `${stats['Compliance']} hrs`;
            }
        }
    },
    
    updateCapabilityStats() {
        // Calculate stats for each capability
        const capabilities = [
            'stakeholder-engagement',
            'business-development',
            'product-planning',
            'marketing-campaigns'
        ];
        
        capabilities.forEach(capKey => {
            const capName = capKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const capMap = {
                'Stakeholder Engagement': 'Stakeholder Engagement',
                'Business Development': 'Business Development',
                'Product Planning': 'Product Planning',
                'Marketing Campaigns': 'Marketing Campaign'
            };
            const capFilter = capMap[capName];
            
            // Use filtered cards based on global business filter
            let cards = this.getFilteredKanbanCards().filter(c => c.capability === capFilter);
            
            // Calculate percentages
            const total = cards.length;
            if (total === 0) {
                this.updateCapabilityBox(capKey, 0, 0, 0);
                return;
            }
            
            const today = new Date();
            let onTrack = 0, inProgress = 0, offTrack = 0;
            
            cards.forEach(card => {
                if (card.lane === 'Completed') {
                    onTrack++;
                } else if (card.lane === 'In Progress') {
                    if (card.status === 'green') onTrack++;
                    else if (card.status === 'amber') inProgress++;
                    else offTrack++;
                } else if (card.lane === 'Planned') {
                    inProgress++;
                } else if (card.lane === 'Paused') {
                    offTrack++;
                }
            });
            
            const onTrackPct = Math.round((onTrack / total) * 100);
            const inProgressPct = Math.round((inProgress / total) * 100);
            const offTrackPct = Math.round((offTrack / total) * 100);
            
            this.updateCapabilityBox(capKey, onTrackPct, inProgressPct, offTrackPct);
        });
    },
    
    updateCapabilityBox(capKey, onTrack, inProgress, offTrack) {
        const box = document.querySelector(`.capability-box[data-capability="${capKey}"]`);
        if (!box) return;
        
        const statuses = box.querySelectorAll('.status-item .value');
        statuses[0].textContent = `${onTrack}%`;
        statuses[1].textContent = `${inProgress}%`;
        statuses[2].textContent = `${offTrack}%`;
    },
    
    // Continue in next part...
    showChangePasswordModal() {
        Utils.show('change-password-modal');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        Utils.hideError('password-error');
    },
    
    savePassword() {
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;
        
        Utils.hideError('password-error');
        
        if (!current || !newPass || !confirm) {
            Utils.showError('password-error', 'All fields are required');
            return;
        }
        
        if (current !== STATE.currentUser.password) {
            Utils.showError('password-error', 'Current password is incorrect');
            return;
        }
        
        if (newPass !== confirm) {
            Utils.showError('password-error', 'New passwords do not match');
            return;
        }
        
        if (newPass.length < 4) {
            Utils.showError('password-error', 'Password must be at least 4 characters');
            return;
        }
        
        // Update password in local storage
        const userIndex = STATE.users.findIndex(u => u.id === STATE.currentUser.id);
        if (userIndex !== -1) {
            STATE.users[userIndex].password = newPass;
            STATE.currentUser.password = newPass;
            Auth.saveUsers();
            sessionStorage.setItem('currentUser', JSON.stringify(STATE.currentUser));
        }
        
        console.log('Password changed for:', STATE.currentUser.username);
        
        Utils.hide('change-password-modal');
        alert('Password changed successfully!');
    },
    
    // User Management (Admin Only)
    showUserManagement() {
        if (STATE.currentUser.type !== 'Admin') {
            alert('Only administrators can manage users');
            return;
        }
        
        Utils.show('user-management-modal');
        this.renderUsersTable();
    },
    
    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        
        if (STATE.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = STATE.users.map(user => {
            const lastLogin = user.lastLogin ? 
                `<span class="last-login">${new Date(user.lastLogin).toLocaleString()}</span>` :
                '<span class="never-logged-in">Never logged in</span>';
            
            return `
                <tr>
                    <td>${Utils.escapeHtml(user.username)}</td>
                    <td>${'*'.repeat(8)}</td>
                    <td><span class="badge badge-${user.type.toLowerCase()}">${user.type}</span></td>
                    <td>${user.contentBusiness ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>'}</td>
                    <td>${user.channelBusiness ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>'}</td>
                    <td>${lastLogin}</td>
                    <td class="action-buttons">
                        <button class="btn-icon" onclick="App.editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="App.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showEditUserModal(userId = null) {
        Utils.show('edit-user-modal');
        
        const titleEl = document.getElementById('edit-user-modal-title');
        const deleteBtn = document.getElementById('delete-user-btn');
        
        if (userId) {
            const user = STATE.users.find(u => u.id === userId);
            if (!user) return;
            
            titleEl.textContent = 'Edit User';
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('edit-user-username').value = user.username;
            document.getElementById('edit-user-password').value = user.password;
            document.getElementById('edit-user-type').value = user.type;
            document.getElementById('edit-user-content').checked = user.contentBusiness;
            document.getElementById('edit-user-channel').checked = user.channelBusiness;
            Utils.show(deleteBtn);
        } else {
            titleEl.textContent = 'Add New User';
            document.getElementById('edit-user-id').value = '';
            document.getElementById('edit-user-username').value = '';
            document.getElementById('edit-user-password').value = 'password123';
            document.getElementById('edit-user-type').value = 'User';
            document.getElementById('edit-user-content').checked = false;
            document.getElementById('edit-user-channel').checked = false;
            Utils.hide(deleteBtn);
        }
    },
    
    editUser(userId) {
        this.showEditUserModal(userId);
    },
    
    saveUser() {
        const userId = document.getElementById('edit-user-id').value;
        const username = document.getElementById('edit-user-username').value.trim();
        const password = document.getElementById('edit-user-password').value.trim();
        const type = document.getElementById('edit-user-type').value;
        const contentBusiness = document.getElementById('edit-user-content').checked;
        const channelBusiness = document.getElementById('edit-user-channel').checked;
        
        if (!username || !password) {
            alert('Username and password are required');
            return;
        }
        
        if (password.length < 4) {
            alert('Password must be at least 4 characters');
            return;
        }
        
        // Check for duplicate username (excluding current user)
        const duplicate = STATE.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.id !== userId
        );
        
        if (duplicate) {
            alert('Username already exists');
            return;
        }
        
        if (userId) {
            // Update existing user
            const userIndex = STATE.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                STATE.users[userIndex] = {
                    ...STATE.users[userIndex],
                    username,
                    password,
                    name: username,
                    type,
                    contentBusiness,
                    channelBusiness
                };
                
                // Update current user if editing self
                if (STATE.currentUser.id === userId) {
                    STATE.currentUser = STATE.users[userIndex];
                    sessionStorage.setItem('currentUser', JSON.stringify(STATE.currentUser));
                }
            }
        } else {
            // Create new user
            const newUser = {
                id: 'user-' + Date.now(),
                username,
                password,
                name: username,
                type,
                contentBusiness,
                channelBusiness,
                lastLogin: ''
            };
            STATE.users.push(newUser);
        }
        
        Auth.saveUsers();
        this.renderUsersTable();
        Utils.hide('edit-user-modal');
        alert('User saved successfully!');
    },
    
    deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        // Prevent deleting self
        if (STATE.currentUser.id === userId) {
            alert('You cannot delete your own account');
            return;
        }
        
        // Prevent deleting last admin
        const admins = STATE.users.filter(u => u.type === 'Admin');
        const userToDelete = STATE.users.find(u => u.id === userId);
        if (userToDelete && userToDelete.type === 'Admin' && admins.length === 1) {
            alert('Cannot delete the last administrator account');
            return;
        }
        
        STATE.users = STATE.users.filter(u => u.id !== userId);
        Auth.saveUsers();
        this.renderUsersTable();
        Utils.hide('edit-user-modal');
        alert('User deleted successfully!');
    },
    
    // Mastery View
    showMastery() {
        console.log('showMastery() called');
        STATE.currentLevel = 2;
        STATE.currentView = 'mastery';
        
        Utils.hide('level-1');
        Utils.hide('level-2-performance');
        Utils.hide('level-2-kanban');
        Utils.show('level-2-mastery');
        
        const breadcrumb = document.getElementById('breadcrumb-content');
        if (breadcrumb) {
            breadcrumb.textContent = 'Business Review Scorecard > Mastery & Learning';
        } else {
            console.warn('breadcrumb-content element not found in showMastery');
        }
        
        this.setupMasteryFilters();
        this.renderMasteryTable();
    },
    
    setupMasteryFilters() {
        console.log('=== setupMasteryFilters START ===');
        console.log('STATE.users length:', STATE.users.length);
        console.log('STATE.users:', STATE.users.map(u => ({ username: u.username, name: u.name })));
        
        // Username filter - Show ALL users for filtering purposes
        const usernameFilter = document.getElementById('mastery-filter-username');
        console.log('usernameFilter element:', usernameFilter);
        
        if (!usernameFilter) {
            console.error('ERROR: mastery-filter-username element not found in DOM');
            return;
        }
        
        // Clear and populate
        usernameFilter.innerHTML = '';
        
        // Add "All Users" option
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All Users';
        usernameFilter.appendChild(allOption);
        console.log('Added "All Users" option');
        
        // Add each user
        STATE.users.forEach((user, index) => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name || user.username;
            usernameFilter.appendChild(option);
            console.log(`Added user ${index + 1}:`, { value: user.username, text: user.name || user.username });
        });
        
        console.log('Final dropdown option count:', usernameFilter.options.length);
        console.log('=== setupMasteryFilters END ===');
    },
    
    filterMasteryTable() {
        STATE.filters.mastery.username = document.getElementById('mastery-filter-username').value;
        STATE.filters.mastery.category = document.getElementById('mastery-filter-category').value;
        this.renderMasteryTable();
    },
    
    renderMasteryTable() {
        const tbody = document.getElementById('mastery-table-body');
        
        // Start with filtered data based on global business filter and user permissions
        let data = this.getFilteredMasteryData();
        
        // Apply additional mastery-specific filters
        if (STATE.filters.mastery.username) {
            data = data.filter(m => m.username === STATE.filters.mastery.username);
        }
        if (STATE.filters.mastery.category) {
            data = data.filter(m => m.category === STATE.filters.mastery.category);
        }
        
        // Render table
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No courses found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(course => {
            // Check if current user can edit/delete this course
            const canModify = STATE.currentUser.type === 'Admin' || course.createdBy === STATE.currentUser.username;
            
            return `
                <tr>
                    <td>${Utils.escapeHtml(course.username)}</td>
                    <td>${Utils.escapeHtml(course.category)}</td>
                    <td>${Utils.escapeHtml(course.course)}</td>
                    <td>${course.completion}%</td>
                    <td>${Utils.formatDate(course.initiated)}</td>
                    <td>${Utils.formatDate(course.updated)}</td>
                    <td>${Utils.formatDate(course.concluded)}</td>
                    <td class="action-buttons">
                        ${canModify ? `
                            <button class="btn-icon" onclick="App.editCourse('${course.id}')" title="Edit course activity">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="App.deleteCourse('${course.id}')" title="Delete course activity">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : '<span style="color: var(--text-secondary); font-size: 12px;">View only</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showCourseModal(courseRow = null) {
        console.log('=== showCourseModal START ===');
        console.log('STATE.users length:', STATE.users.length);
        console.log('STATE.coursesList length:', STATE.coursesList.length);
        
        Utils.show('course-modal');
        
        // Setup username dropdown - Show ALL users
        const usernameSelect = document.getElementById('course-username');
        console.log('usernameSelect element:', usernameSelect);
        
        if (!usernameSelect) {
            console.error('ERROR: course-username element not found');
            return;
        }
        
        usernameSelect.innerHTML = '';
        
        // Show all users in dropdown (filtering is just for display, not access control)
        STATE.users.forEach((user, index) => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name || user.username;
            usernameSelect.appendChild(option);
            console.log(`Added username ${index + 1}:`, { value: user.username, text: user.name || user.username });
        });
        
        console.log('Username dropdown option count:', usernameSelect.options.length);
        
        // Setup category change listener to filter courses
        const categorySelect = document.getElementById('course-category');
        if (categorySelect) {
            // Remove existing listener if any
            categorySelect.removeEventListener('change', this.filterCoursesByCategory);
            // Add new listener
            categorySelect.addEventListener('change', () => this.filterCoursesByCategory());
        }
        
        // Initial course dropdown population (will be empty until category is selected)
        this.filterCoursesByCategory();
        
        console.log('=== showCourseModal username/course setup END ===');
        
        if (courseRow) {
            // Edit mode
            const course = STATE.masteryData.find(c => c.id === courseRow);
            if (course) {
                document.getElementById('course-modal-title').textContent = 'Edit Course';
                document.getElementById('course-row-id').value = course.id;
                document.getElementById('course-username').value = course.username;
                document.getElementById('course-category').value = course.category;
                
                // Filter courses by category before setting course value
                this.filterCoursesByCategory();
                
                document.getElementById('course-name').value = course.course;
                document.getElementById('course-completion').value = course.completion;
                document.getElementById('course-initiated').value = Utils.formatDate(course.initiated);
                document.getElementById('course-updated').value = Utils.formatDate(course.updated);
                document.getElementById('course-concluded').value = Utils.formatDate(course.concluded);
            }
        } else {
            // Add mode
            document.getElementById('course-modal-title').textContent = 'Add Course Activity';
            document.getElementById('course-row-id').value = '';
            document.getElementById('course-form').reset();
            // Pre-select current user
            document.getElementById('course-username').value = STATE.currentUser.username;
            // Clear courses since no category selected yet
            this.filterCoursesByCategory();
        }
    },
    
    filterCoursesByCategory() {
        console.log('=== filterCoursesByCategory called ===');
        
        const categorySelect = document.getElementById('course-category');
        const courseSelect = document.getElementById('course-name');
        
        if (!categorySelect || !courseSelect) {
            console.error('Category or course select not found');
            return;
        }
        
        const selectedCategory = categorySelect.value;
        console.log('Selected category:', selectedCategory);
        
        // Clear current options
        courseSelect.innerHTML = '<option value="">Select a course</option>';
        
        if (!selectedCategory) {
            // No category selected, show message
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Please select a category first';
            option.disabled = true;
            courseSelect.appendChild(option);
            console.log('No category selected');
            return;
        }
        
        // Filter courses by selected category
        const filteredCourses = STATE.coursesList
            .filter(course => course.category === selectedCategory)
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Filtered ${filteredCourses.length} courses for category ${selectedCategory}`);
        
        if (filteredCourses.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No courses available in this category';
            option.disabled = true;
            courseSelect.appendChild(option);
            return;
        }
        
        // Populate dropdown with filtered courses
        filteredCourses.forEach((course, index) => {
            const option = document.createElement('option');
            option.value = course.name;
            option.textContent = course.name;
            courseSelect.appendChild(option);
            if (index < 3) {
                console.log(`  Course ${index + 1}:`, course.name);
            }
        });
        
        console.log('Course dropdown populated with', filteredCourses.length, 'courses');
    },
    
    saveCourse() {
        const rowId = document.getElementById('course-row-id').value;
        const username = document.getElementById('course-username').value;
        const category = document.getElementById('course-category').value;
        const course = document.getElementById('course-name').value;
        const completion = parseFloat(document.getElementById('course-completion').value);
        const initiated = document.getElementById('course-initiated').value;
        const updated = document.getElementById('course-updated').value;
        const concluded = document.getElementById('course-concluded').value;
        
        if (!username || !category || !course) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (completion > 0 && !initiated) {
            alert('Initiated date is required when completion > 0%');
            return;
        }
        
        if (completion === 100 && !concluded) {
            alert('Concluded date is required when completion is 100%');
            return;
        }
        
        const courseData = {
            username,
            category,
            course,
            completion,
            initiated,
            updated: updated || Utils.formatDate(new Date()),
            concluded,
            createdBy: STATE.currentUser.username,
            createdAt: new Date().toISOString()
        };
        
        if (rowId) {
            // Update existing
            const index = STATE.masteryData.findIndex(c => c.id === rowId);
            if (index !== -1) {
                // Check permissions: Only owner or admin can edit
                const existingRecord = STATE.masteryData[index];
                if (existingRecord.createdBy !== STATE.currentUser.username && STATE.currentUser.type !== 'Admin') {
                    alert('You can only edit your own course activities');
                    return;
                }
                STATE.masteryData[index] = { ...existingRecord, ...courseData, id: rowId };
            }
        } else {
            // Add new
            courseData.id = 'mastery-' + Date.now();
            STATE.masteryData.push(courseData);
        }
        
        this.saveMasteryData();
        console.log('Course saved:', courseData);
        
        Utils.hide('course-modal');
        this.renderMasteryTable();
        this.updateScorecardData();
    },
    
    editCourse(courseId) {
        this.showCourseModal(courseId);
    },
    
    deleteCourse(courseId) {
        const course = STATE.masteryData.find(c => c.id === courseId);
        if (!course) return;
        
        // Check permissions: Only owner or admin can delete
        if (course.createdBy !== STATE.currentUser.username && STATE.currentUser.type !== 'Admin') {
            alert('You can only delete your own course activities');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this course activity?')) return;
        
        const index = STATE.masteryData.findIndex(c => c.id === courseId);
        if (index !== -1) {
            STATE.masteryData.splice(index, 1);
            this.saveMasteryData();
            console.log('Course deleted:', courseId);
            this.renderMasteryTable();
            this.updateScorecardData();
        }
    },

    // Course Library Management
    showCourseLibrary() {
        Utils.show('course-library-modal');
        
        // Show/hide Add button based on admin status
        const addBtn = document.getElementById('add-library-course-btn');
        if (STATE.currentUser.type === 'Admin') {
            addBtn.style.display = 'block';
        } else {
            addBtn.style.display = 'none';
        }
        
        this.renderCourseLibrary();
        
        // Default to first category
        this.switchCourseCategory('compliance');
    },

    renderCourseLibrary() {
        const categories = ['compliance', 'function', 'leadership', 'technology'];
        
        categories.forEach(category => {
            const grid = document.getElementById(`${category}-courses`);
            const courses = STATE.coursesList
                .filter(c => c.category.toLowerCase() === category)
                .sort((a, b) => a.name.localeCompare(b.name));
            
            if (courses.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No courses in this category yet</p>';
                return;
            }
            
            grid.innerHTML = courses.map(course => `
                <div class="course-card ${category}">
                    <div class="course-card-name">
                        ${course.url ? `<a href="${course.url}" target="_blank" title="Open course">${Utils.escapeHtml(course.name)}</a>` : Utils.escapeHtml(course.name)}
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                            <i class="fas fa-clock"></i> ${course.hours || 4} hours
                        </div>
                    </div>
                    ${STATE.currentUser.type === 'Admin' ? `
                        <div class="course-card-actions">
                            <button class="btn-icon" onclick="App.editLibraryCourse('${course.id}')" title="Edit course">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="App.deleteLibraryCourse('${course.id}')" title="Delete course">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        });
    },

    switchCourseCategory(category) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Show/hide category grids
        const categories = ['compliance', 'function', 'leadership', 'technology'];
        categories.forEach(cat => {
            const grid = document.getElementById(`${cat}-courses`);
            if (cat === category) {
                grid.style.display = 'grid';
            } else {
                grid.style.display = 'none';
            }
        });
    },

    showLibraryCourseModal(courseId = null) {
        if (STATE.currentUser.type !== 'Admin') {
            alert('Only administrators can add or edit courses');
            return;
        }
        
        Utils.show('library-course-modal');
        
        if (courseId) {
            // Edit mode
            const course = STATE.coursesList.find(c => c.id === courseId);
            if (course) {
                document.getElementById('library-course-modal-title').textContent = 'Edit Course';
                document.getElementById('library-course-id').value = course.id;
                document.getElementById('library-course-name').value = course.name;
                document.getElementById('library-course-category').value = course.category;
                document.getElementById('library-course-url').value = course.url || '';
                document.getElementById('library-course-hours').value = course.hours || 4;
            }
        } else {
            // Add mode
            document.getElementById('library-course-modal-title').textContent = 'Add New Course';
            document.getElementById('library-course-id').value = '';
            document.getElementById('library-course-form').reset();
            // Set default hours
            document.getElementById('library-course-hours').value = 4;
        }
    },

    saveLibraryCourse() {
        const courseId = document.getElementById('library-course-id').value;
        const name = document.getElementById('library-course-name').value.trim();
        const category = document.getElementById('library-course-category').value;
        const url = document.getElementById('library-course-url').value.trim();
        const hours = parseFloat(document.getElementById('library-course-hours').value);
        
        if (!name || !category || !hours || hours <= 0) {
            alert('Please fill in all required fields');
            return;
        }
        
        const courseData = {
            name,
            category,
            url: url || '',
            hours
        };
        
        if (courseId) {
            // Update existing
            const index = STATE.coursesList.findIndex(c => c.id === courseId);
            if (index !== -1) {
                STATE.coursesList[index] = { ...STATE.coursesList[index], ...courseData };
            }
        } else {
            // Add new
            courseData.id = 'course-' + Date.now();
            STATE.coursesList.push(courseData);
        }
        
        this.saveCoursesLibrary();
        console.log('Library course saved:', courseData);
        
        Utils.hide('library-course-modal');
        this.renderCourseLibrary();
    },

    editLibraryCourse(courseId) {
        this.showLibraryCourseModal(courseId);
    },

    deleteLibraryCourse(courseId) {
        if (STATE.currentUser.type !== 'Admin') {
            alert('Only administrators can delete courses');
            return;
        }
        
        const course = STATE.coursesList.find(c => c.id === courseId);
        if (!course) return;
        
        // Check if course is being used in any mastery activities
        const isUsed = STATE.masteryData.some(m => m.course === course.name);
        if (isUsed) {
            if (!confirm(`This course is currently assigned to users. Are you sure you want to delete "${course.name}"? This will not affect existing course activities.`)) {
                return;
            }
        } else {
            if (!confirm(`Are you sure you want to delete "${course.name}"?`)) {
                return;
            }
        }
        
        const index = STATE.coursesList.findIndex(c => c.id === courseId);
        if (index !== -1) {
            STATE.coursesList.splice(index, 1);
            this.saveCoursesLibrary();
            console.log('Library course deleted:', courseId);
            this.renderCourseLibrary();
        }
    },
    
    // Performance View
    showPerformance() {
        console.log('showPerformance() called');
        STATE.currentLevel = 2;
        STATE.currentView = 'performance';
        
        Utils.hide('level-1');
        Utils.hide('level-2-mastery');
        Utils.hide('level-2-kanban');
        Utils.show('level-2-performance');
        
        // Update breadcrumb if element exists
        const breadcrumb = document.getElementById('breadcrumb-content');
        if (breadcrumb) {
            breadcrumb.textContent = 'Business Review Scorecard > Performance Dashboard';
        }
        
        // Load performance dashboard
        this.loadPerformanceDashboard();
    },
    
    loadPerformanceDashboard() {
        console.log('loadPerformanceDashboard() called');
        const container = document.getElementById('performance-dashboard-container');
        if (!container) {
            console.error('Performance dashboard container not found');
            return;
        }
        
        // Generate sample performance data
        this.generatePerformanceData();
        
        container.innerHTML = `
            <div class="performance-dashboard">
                <!-- Filter Bar -->
                <div class="perf-filter-bar" style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
                    <div class="filter-group" style="flex: 1; min-width: 150px;">
                        <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Category</label>
                        <select id="perf-category-filter" class="filter-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; background: white; cursor: pointer;">
                            <option value="All">All Categories</option>
                            <option value="Content Business">Content Business</option>
                            <option value="Channel Business">Channel Business</option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1; min-width: 150px;">
                        <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Service</label>
                        <select id="perf-service-filter" class="filter-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; background: white; cursor: pointer;">
                            <option value="All">All Services</option>
                            <!-- Will be populated dynamically -->
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1; min-width: 150px;">
                        <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Month</label>
                        <select id="perf-month-filter" class="filter-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; background: white; cursor: pointer;">
                            <option value="2025-01">January 2025</option>
                            <option value="2024-12">December 2024</option>
                            <option value="2024-11">November 2024</option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 0; min-width: auto;">
                        <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.25rem;">&nbsp;</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0;">
                            <input type="checkbox" id="toggle-target-to-date" style="width: 16px; height: 16px; cursor: pointer;">
                            <label for="toggle-target-to-date" style="font-size: 0.875rem; color: #374151; cursor: pointer; margin: 0;">Show Target to Date</label>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="kpi-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 0.5rem;">MTD REVENUE</div>
                        <div id="kpi-mtd-revenue" style="font-size: 1.75rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">R 2.1M</div>
                        <div id="kpi-mtd-variance" style="font-size: 0.875rem;">
                            <i class="fas fa-arrow-up"></i> <span style="font-weight: 600;">R 100K</span> vs Target
                        </div>
                    </div>
                    <div class="kpi-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 0.5rem;">ACTUAL RUN RATE</div>
                        <div id="kpi-actual-runrate" style="font-size: 1.75rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">R 85K/day</div>
                        <div id="kpi-runrate-status" style="font-size: 0.875rem;">
                            <span style="font-weight: 600;">Required: R 90K/day</span>
                        </div>
                    </div>
                    <div class="kpi-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 0.5rem;">SUBSCRIBER BASE</div>
                        <div id="kpi-subscriber-base" style="font-size: 1.75rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">154K</div>
                        <div id="kpi-subscriber-growth" style="font-size: 0.875rem;">
                            <i class="fas fa-arrow-up"></i> <span style="font-weight: 600;">+2.3K</span> this month
                        </div>
                    </div>
                    <div class="kpi-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #6b7280; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 0.5rem;">REVENUE TODAY</div>
                        <div id="kpi-revenue-today" style="font-size: 1.75rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">R 89K</div>
                        <div id="kpi-today-status" style="font-size: 0.875rem; color: #10b981;">
                            <i class="fas fa-check-circle"></i> <span style="font-weight: 600;">On Track</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section" style="margin-bottom: 2rem;">
                    <div style="background: white; padding: 1rem 1.5rem; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;">
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0;">Performance Trends</h2>
                    </div>
                    <div class="charts-grid" style="background: white; padding: 1.5rem; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
                        <div class="chart-container">
                            <h3 style="font-size: 1rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">MTD Revenue vs Target</h3>
                            <canvas id="revenue-chart" style="max-height: 300px;"></canvas>
                        </div>
                        <div class="chart-container">
                            <h3 style="font-size: 1rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">Daily Run Rate</h3>
                            <canvas id="runrate-chart" style="max-height: 300px;"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Detail Table -->
                <div class="detail-section" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0;">Detailed Breakdown</h2>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="add-perf-service-btn" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                <i class="fas fa-plus"></i> Add Service
                            </button>
                            <button id="export-perf-csv" class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="data-table" id="performance-detail-table">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Service</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">MTD Revenue</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">MTD Target</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Variance</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">% to Target</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Actual Run Rate</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Required Run Rate</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Subscriber Base</th>
                                    <th id="perf-actions-header" style="text-align: center; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="performance-detail-tbody">
                                <!-- Will be populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Daily Data Table -->
                <div class="detail-section" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0;">Daily Data Breakdown</h2>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="add-daily-data-btn" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                <i class="fas fa-plus"></i> Add Daily Entry
                            </button>
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="data-table" id="daily-data-table">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Service</th>
                                    <th style="text-align: center; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Day</th>
                                    <th style="text-align: center; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Date</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Daily Revenue</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Daily Target</th>
                                    <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Variance</th>
                                    <th id="daily-actions-header" style="text-align: center; padding: 0.75rem; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="daily-data-tbody">
                                <!-- Will be populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Setup filter event listeners
        this.setupPerformanceFilters();
        
        // Initialize charts and table
        setTimeout(() => this.renderPerformanceDashboard(), 100);
    },
    
    generatePerformanceData() {
        // Check if data exists in localStorage first
        this.loadPerformanceData();
        
        // If no stored data, generate sample data
        if (!STATE.performanceData || !STATE.performanceData.services) {
            STATE.performanceData = {
                services: [
                    {
                        name: 'YoGamezPro',
                        category: 'Content Business',
                        mtdRevenue: 1250000,
                        mtdTarget: 1200000,
                        actualRunRate: 48076,
                        requiredRunRate: 50000,
                        subscriberBase: 85000,
                        dailyData: this.generateDailyData(1250000, 1200000, 26)
                    },
                    {
                        name: 'MobiStream',
                        category: 'Content Business',
                        mtdRevenue: 850000,
                        mtdTarget: 800000,
                        actualRunRate: 32692,
                        requiredRunRate: 35000,
                        subscriberBase: 69000,
                        dailyData: this.generateDailyData(850000, 800000, 26)
                    }
                ],
                filters: {
                    category: 'All',
                    service: 'All',
                    month: '2025-01'
                }
            };
            // Save the initial data
            this.savePerformanceData();
        }
    },
    
    generateDailyData(mtdRevenue, mtdTarget, days) {
        const dailyData = [];
        const avgDaily = mtdRevenue / days;
        const variance = avgDaily * 0.15;
        
        for (let i = 1; i <= days; i++) {
            const dailyRev = avgDaily + (Math.random() - 0.5) * variance;
            dailyData.push({
                day: i,
                date: `2025-01-${String(i).padStart(2, '0')}`,
                revenue: Math.round(dailyRev),
                target: Math.round(mtdTarget / days)
            });
        }
        return dailyData;
    },
    
    setupPerformanceFilters() {
        // Populate service filter
        const serviceFilter = document.getElementById('perf-service-filter');
        if (serviceFilter && STATE.performanceData) {
            const services = STATE.performanceData.services;
            serviceFilter.innerHTML = '<option value="All">All Services</option>';
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.name;
                option.textContent = service.name;
                serviceFilter.appendChild(option);
            });
        }
        
        // Show/hide Add Service button based on user type
        const addServiceBtn = document.getElementById('add-perf-service-btn');
        const actionsHeader = document.getElementById('perf-actions-header');
        const addDailyDataBtn = document.getElementById('add-daily-data-btn');
        const dailyActionsHeader = document.getElementById('daily-actions-header');
        
        if (STATE.currentUser.type === 'Admin') {
            if (addServiceBtn) {
                addServiceBtn.style.display = 'inline-flex';
                addServiceBtn.style.cursor = 'pointer';
                addServiceBtn.style.opacity = '1';
            }
            if (actionsHeader) {
                actionsHeader.style.display = 'table-cell';
            }
            if (addDailyDataBtn) {
                addDailyDataBtn.style.display = 'inline-flex';
                addDailyDataBtn.style.cursor = 'pointer';
                addDailyDataBtn.style.opacity = '1';
            }
            if (dailyActionsHeader) {
                dailyActionsHeader.style.display = 'table-cell';
            }
        } else {
            if (addServiceBtn) {
                addServiceBtn.style.display = 'inline-flex';
                addServiceBtn.style.cursor = 'not-allowed';
                addServiceBtn.style.opacity = '0.5';
                addServiceBtn.disabled = true;
            }
            if (actionsHeader) {
                actionsHeader.style.display = 'none';
            }
            if (addDailyDataBtn) {
                addDailyDataBtn.style.display = 'inline-flex';
                addDailyDataBtn.style.cursor = 'not-allowed';
                addDailyDataBtn.style.opacity = '0.5';
                addDailyDataBtn.disabled = true;
            }
            if (dailyActionsHeader) {
                dailyActionsHeader.style.display = 'none';
            }
        }
        
        // Attach filter change listeners
        document.getElementById('perf-category-filter')?.addEventListener('change', () => this.renderPerformanceDashboard());
        document.getElementById('perf-service-filter')?.addEventListener('change', () => this.renderPerformanceDashboard());
        document.getElementById('perf-month-filter')?.addEventListener('change', () => this.renderPerformanceDashboard());
        document.getElementById('toggle-target-to-date')?.addEventListener('change', () => this.renderPerformanceDashboard());
        document.getElementById('export-perf-csv')?.addEventListener('click', () => this.exportPerformanceData());
        
        // Add service button (Admin only)
        document.getElementById('add-perf-service-btn')?.addEventListener('click', () => {
            if (STATE.currentUser.type === 'Admin') {
                this.showPerformanceServiceModal();
            } else {
                alert('Only Admins can add services');
            }
        });
        
        // Save service button
        document.getElementById('save-perf-service-btn')?.addEventListener('click', () => this.savePerformanceService());
        
        // Add daily data button (Admin only)
        document.getElementById('add-daily-data-btn')?.addEventListener('click', () => {
            if (STATE.currentUser.type === 'Admin') {
                alert('Add Daily Entry functionality - Please edit existing entries from the table');
            } else {
                alert('Only Admins can edit daily data');
            }
        });
        
        // Save daily data button
        document.getElementById('save-daily-data-btn')?.addEventListener('click', () => this.saveDailyData());
    },
    
    renderPerformanceDashboard() {
        console.log('renderPerformanceDashboard() called');
        
        if (!STATE.performanceData) {
            console.error('No performance data available');
            return;
        }
        
        // Get filter values
        const categoryFilter = document.getElementById('perf-category-filter')?.value || 'All';
        const serviceFilter = document.getElementById('perf-service-filter')?.value || 'All';
        const showTargetToDate = document.getElementById('toggle-target-to-date')?.checked || false;
        
        // Filter services
        let filteredServices = STATE.performanceData.services;
        if (categoryFilter !== 'All') {
            filteredServices = filteredServices.filter(s => s.category === categoryFilter);
        }
        if (serviceFilter !== 'All') {
            filteredServices = filteredServices.filter(s => s.name === serviceFilter);
        }
        
        // Calculate aggregated metrics
        const totalMtdRevenue = filteredServices.reduce((sum, s) => sum + s.mtdRevenue, 0);
        const totalMtdTarget = filteredServices.reduce((sum, s) => sum + s.mtdTarget, 0);
        const totalActualRunRate = filteredServices.reduce((sum, s) => sum + s.actualRunRate, 0);
        const totalRequiredRunRate = filteredServices.reduce((sum, s) => sum + s.requiredRunRate, 0);
        const totalSubscriberBase = filteredServices.reduce((sum, s) => sum + s.subscriberBase, 0);
        
        const variance = totalMtdRevenue - totalMtdTarget;
        const variancePercent = ((variance / totalMtdTarget) * 100).toFixed(1);
        
        // Update KPIs
        document.getElementById('kpi-mtd-revenue').textContent = `R ${(totalMtdRevenue / 1000000).toFixed(1)}M`;
        document.getElementById('kpi-mtd-variance').innerHTML = `
            <i class="fas fa-arrow-${variance >= 0 ? 'up' : 'down'}"></i> 
            <span style="font-weight: 600;">R ${Math.abs(variance / 1000).toFixed(0)}K</span> 
            (${variancePercent}%) vs Target
        `;
        document.getElementById('kpi-mtd-variance').style.color = variance >= 0 ? '#10b981' : '#ef4444';
        
        document.getElementById('kpi-actual-runrate').textContent = `R ${(totalActualRunRate / 1000).toFixed(0)}K/day`;
        document.getElementById('kpi-runrate-status').innerHTML = `
            <span style="font-weight: 600;">Required: R ${(totalRequiredRunRate / 1000).toFixed(0)}K/day</span>
        `;
        
        document.getElementById('kpi-subscriber-base').textContent = `${(totalSubscriberBase / 1000).toFixed(0)}K`;
        
        // Get today's revenue (last day in data)
        const todayRevenue = filteredServices[0]?.dailyData[filteredServices[0].dailyData.length - 1]?.revenue || 0;
        document.getElementById('kpi-revenue-today').textContent = `R ${(todayRevenue / 1000).toFixed(0)}K`;
        
        // Render charts
        this.renderPerformanceCharts(filteredServices, showTargetToDate);
        
        // Render detail table
        this.renderPerformanceTable(filteredServices);
        
        // Render daily data table
        this.renderDailyDataTable(filteredServices);
    },
    
    renderPerformanceCharts(services, showTargetToDate) {
        console.log('Rendering performance charts with', services.length, 'services');
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        // Destroy existing charts
        if (window.revenueChart) window.revenueChart.destroy();
        if (window.runrateChart) window.runrateChart.destroy();
        
        // Aggregate daily data across services
        const aggregatedDaily = {};
        services.forEach(service => {
            service.dailyData.forEach(day => {
                if (!aggregatedDaily[day.date]) {
                    aggregatedDaily[day.date] = { revenue: 0, target: 0 };
                }
                aggregatedDaily[day.date].revenue += day.revenue;
                aggregatedDaily[day.date].target += day.target;
            });
        });
        
        const sortedDates = Object.keys(aggregatedDaily).sort();
        const dailyRevenues = sortedDates.map(date => aggregatedDaily[date].revenue);
        const dailyTargets = sortedDates.map(date => aggregatedDaily[date].target);
        
        // Calculate cumulative for MTD chart
        let cumulativeRevenue = 0;
        let cumulativeTarget = 0;
        const cumulativeRevenues = dailyRevenues.map(rev => { cumulativeRevenue += rev; return cumulativeRevenue; });
        const cumulativeTargets = dailyTargets.map(tgt => { cumulativeTarget += tgt; return cumulativeTarget; });
        
        // Revenue Chart (MTD Cumulative)
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueCtx) {
            window.revenueChart = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: sortedDates.map(d => d.substring(8)),
                    datasets: [{
                        label: 'Actual MTD Revenue',
                        data: cumulativeRevenues,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }, {
                        label: showTargetToDate ? 'Target to Date' : 'Full Month Target',
                        data: showTargetToDate ? cumulativeTargets : Array(sortedDates.length).fill(cumulativeTargets[cumulativeTargets.length - 1]),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderDash: [5, 5],
                        tension: 0,
                        fill: false,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => `R ${(value / 1000000).toFixed(1)}M`
                            }
                        }
                    },
                    plugins: {
                        legend: { display: true, position: 'top' }
                    }
                }
            });
        }
        
        // Run Rate Chart
        const runrateCtx = document.getElementById('runrate-chart');
        if (runrateCtx) {
            window.runrateChart = new Chart(runrateCtx, {
                type: 'line',
                data: {
                    labels: sortedDates.map(d => d.substring(8)),
                    datasets: [{
                        label: 'Daily Revenue',
                        data: dailyRevenues,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }, {
                        label: 'Daily Target',
                        data: dailyTargets,
                        borderColor: '#ef4444',
                        borderDash: [5, 5],
                        tension: 0,
                        fill: false,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => `R ${(value / 1000).toFixed(0)}K`
                            }
                        }
                    },
                    plugins: {
                        legend: { display: true, position: 'top' }
                    }
                }
            });
        }
    },
    
    renderPerformanceTable(services) {
        const tbody = document.getElementById('performance-detail-tbody');
        if (!tbody) return;
        
        const isAdmin = STATE.currentUser.type === 'Admin';
        
        tbody.innerHTML = services.map((service, index) => {
            const variance = service.mtdRevenue - service.mtdTarget;
            const variancePercent = ((variance / service.mtdTarget) * 100).toFixed(1);
            const varianceColor = variance >= 0 ? '#10b981' : '#ef4444';
            const varianceIcon = variance >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            const actionsCell = isAdmin ? `
                <td style="padding: 0.75rem; text-align: center;">
                    <button class="btn-icon" onclick="App.editPerformanceService(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="App.deletePerformanceService(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            ` : '';
            
            return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 0.75rem; font-weight: 500;">${service.name}</td>
                    <td style="padding: 0.75rem; text-align: right; font-weight: 600;">R ${(service.mtdRevenue / 1000000).toFixed(2)}M</td>
                    <td style="padding: 0.75rem; text-align: right;">R ${(service.mtdTarget / 1000000).toFixed(2)}M</td>
                    <td style="padding: 0.75rem; text-align: right; color: ${varianceColor}; font-weight: 600;">
                        <i class="fas ${varianceIcon}"></i> R ${Math.abs(variance / 1000).toFixed(0)}K
                    </td>
                    <td style="padding: 0.75rem; text-align: right; color: ${varianceColor}; font-weight: 600;">${variancePercent}%</td>
                    <td style="padding: 0.75rem; text-align: right;">R ${(service.actualRunRate / 1000).toFixed(0)}K</td>
                    <td style="padding: 0.75rem; text-align: right;">R ${(service.requiredRunRate / 1000).toFixed(0)}K</td>
                    <td style="padding: 0.75rem; text-align: right;">${(service.subscriberBase / 1000).toFixed(1)}K</td>
                    ${actionsCell}
                </tr>
            `;
        }).join('');
    },
    
    exportPerformanceData() {
        // Simple CSV export
        alert('CSV export functionality would download filtered performance data here');
    },
    
    showPerformanceServiceModal(serviceIndex = null) {
        const modal = document.getElementById('performance-service-modal');
        const title = document.getElementById('perf-service-modal-title');
        const form = document.getElementById('performance-service-form');
        
        if (!modal || !form) return;
        
        // Reset form
        form.reset();
        document.getElementById('perf-service-id').value = '';
        
        if (serviceIndex !== null && STATE.performanceData.services[serviceIndex]) {
            // Edit mode
            const service = STATE.performanceData.services[serviceIndex];
            title.textContent = 'Edit Service';
            document.getElementById('perf-service-id').value = serviceIndex;
            document.getElementById('perf-service-name').value = service.name;
            document.getElementById('perf-service-category').value = service.category;
            document.getElementById('perf-service-mtd-revenue').value = service.mtdRevenue;
            document.getElementById('perf-service-mtd-target').value = service.mtdTarget;
            document.getElementById('perf-service-actual-runrate').value = service.actualRunRate;
            document.getElementById('perf-service-required-runrate').value = service.requiredRunRate;
            document.getElementById('perf-service-subscriber-base').value = service.subscriberBase;
        } else {
            // Add mode
            title.textContent = 'Add Service';
        }
        
        Utils.show('performance-service-modal');
    },
    
    savePerformanceService() {
        // Get form values
        const serviceIndex = document.getElementById('perf-service-id').value;
        const name = document.getElementById('perf-service-name').value.trim();
        const category = document.getElementById('perf-service-category').value;
        const mtdRevenue = parseInt(document.getElementById('perf-service-mtd-revenue').value);
        const mtdTarget = parseInt(document.getElementById('perf-service-mtd-target').value);
        const actualRunRate = parseInt(document.getElementById('perf-service-actual-runrate').value);
        const requiredRunRate = parseInt(document.getElementById('perf-service-required-runrate').value);
        const subscriberBase = parseInt(document.getElementById('perf-service-subscriber-base').value);
        
        // Validate required fields
        if (!name || !category || isNaN(mtdRevenue) || isNaN(mtdTarget) || isNaN(actualRunRate) || isNaN(requiredRunRate) || isNaN(subscriberBase)) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Create service object
        const serviceData = {
            name: name,
            category: category,
            mtdRevenue: mtdRevenue,
            mtdTarget: mtdTarget,
            actualRunRate: actualRunRate,
            requiredRunRate: requiredRunRate,
            subscriberBase: subscriberBase,
            dailyData: this.generateDailyData(mtdRevenue, mtdTarget, 26)
        };
        
        if (serviceIndex !== '') {
            // Update existing service
            STATE.performanceData.services[parseInt(serviceIndex)] = serviceData;
            console.log('Updated service:', name);
        } else {
            // Add new service
            STATE.performanceData.services.push(serviceData);
            console.log('Added new service:', name);
        }
        
        // Save to localStorage
        this.savePerformanceData();
        
        // Close modal and refresh dashboard
        Utils.hide('performance-service-modal');
        this.renderPerformanceDashboard();
        this.setupPerformanceFilters(); // Refresh service dropdown
    },
    
    editPerformanceService(serviceIndex) {
        if (STATE.currentUser.type !== 'Admin') {
            alert('Only Admins can edit services');
            return;
        }
        this.showPerformanceServiceModal(serviceIndex);
    },
    
    deletePerformanceService(serviceIndex) {
        if (STATE.currentUser.type !== 'Admin') {
            alert('Only Admins can delete services');
            return;
        }
        
        const service = STATE.performanceData.services[serviceIndex];
        if (!service) return;
        
        if (confirm(`Are you sure you want to delete "${service.name}"?`)) {
            STATE.performanceData.services.splice(serviceIndex, 1);
            this.savePerformanceData();
            console.log('Deleted service:', service.name);
            this.renderPerformanceDashboard();
            this.setupPerformanceFilters(); // Refresh service dropdown
        }
    },
    
    savePerformanceData() {
        localStorage.setItem('performanceData', JSON.stringify(STATE.performanceData));
        console.log('Saved performance data to localStorage');
    },
    
    loadPerformanceData() {
        const stored = localStorage.getItem('performanceData');
        if (stored) {
            STATE.performanceData = JSON.parse(stored);
            console.log('Loaded performance data from localStorage');
        }
    },
    
    renderDailyDataTable(services) {
        const tbody = document.getElementById('daily-data-tbody');
        if (!tbody) return;
        
        const isAdmin = STATE.currentUser.type === 'Admin';
        const rows = [];
        
        // Flatten all daily data from all services
        services.forEach((service, serviceIndex) => {
            if (service.dailyData && service.dailyData.length > 0) {
                service.dailyData.forEach((day, dayIndex) => {
                    const variance = day.revenue - day.target;
                    const varianceColor = variance >= 0 ? '#10b981' : '#ef4444';
                    const varianceIcon = variance >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                    
                    const actionsCell = isAdmin ? `
                        <td style="padding: 0.75rem; text-align: center;">
                            <button class="btn-icon" onclick="App.editDailyData(${serviceIndex}, ${dayIndex})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    ` : '';
                    
                    rows.push(`
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 0.75rem; font-weight: 500;">${service.name}</td>
                            <td style="padding: 0.75rem; text-align: center;">${day.day}</td>
                            <td style="padding: 0.75rem; text-align: center;">${day.date}</td>
                            <td style="padding: 0.75rem; text-align: right; font-weight: 600;">R ${(day.revenue / 1000).toFixed(1)}K</td>
                            <td style="padding: 0.75rem; text-align: right;">R ${(day.target / 1000).toFixed(1)}K</td>
                            <td style="padding: 0.75rem; text-align: right; color: ${varianceColor}; font-weight: 600;">
                                <i class="fas ${varianceIcon}"></i> R ${Math.abs(variance / 1000).toFixed(1)}K
                            </td>
                            ${actionsCell}
                        </tr>
                    `);
                });
            }
        });
        
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">No daily data available</td></tr>';
        } else {
            tbody.innerHTML = rows.join('');
        }
    },
    
    editDailyData(serviceIndex, dayIndex) {
        if (STATE.currentUser.type !== 'Admin') {
            alert('Only Admins can edit daily data');
            return;
        }
        
        const service = STATE.performanceData.services[serviceIndex];
        const day = service.dailyData[dayIndex];
        
        if (!service || !day) {
            alert('Error: Daily data not found');
            return;
        }
        
        // Open modal with data
        const modal = document.getElementById('daily-data-modal');
        const title = document.getElementById('daily-data-modal-title');
        
        if (!modal) return;
        
        title.textContent = 'Edit Daily Data';
        document.getElementById('daily-service-index').value = serviceIndex;
        document.getElementById('daily-day-index').value = dayIndex;
        document.getElementById('daily-service-name').value = service.name;
        document.getElementById('daily-day').value = day.day;
        document.getElementById('daily-date').value = day.date;
        document.getElementById('daily-revenue').value = day.revenue;
        document.getElementById('daily-target').value = day.target;
        
        Utils.show('daily-data-modal');
    },
    
    saveDailyData() {
        const serviceIndex = parseInt(document.getElementById('daily-service-index').value);
        const dayIndex = parseInt(document.getElementById('daily-day-index').value);
        const revenue = parseInt(document.getElementById('daily-revenue').value);
        const target = parseInt(document.getElementById('daily-target').value);
        
        if (isNaN(serviceIndex) || isNaN(dayIndex) || isNaN(revenue) || isNaN(target)) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Update the daily data
        const service = STATE.performanceData.services[serviceIndex];
        if (service && service.dailyData[dayIndex]) {
            service.dailyData[dayIndex].revenue = revenue;
            service.dailyData[dayIndex].target = target;
            
            // Recalculate MTD values
            const totalRevenue = service.dailyData.reduce((sum, day) => sum + day.revenue, 0);
            const totalTarget = service.dailyData.reduce((sum, day) => sum + day.target, 0);
            service.mtdRevenue = totalRevenue;
            service.mtdTarget = totalTarget;
            service.actualRunRate = Math.round(totalRevenue / service.dailyData.length);
            service.requiredRunRate = Math.round(totalTarget / service.dailyData.length);
            
            // Save to localStorage
            this.savePerformanceData();
            
            console.log('Updated daily data for', service.name, 'day', service.dailyData[dayIndex].day);
            
            // Close modal and refresh dashboard
            Utils.hide('daily-data-modal');
            this.renderPerformanceDashboard();
            this.setupPerformanceFilters(); // Refresh filters
        } else {
            alert('Error: Could not update daily data');
        }
    },
    
    // Kanban View
    showKanban(capability = null) {
        console.log('showKanban() called with capability:', capability);
        STATE.currentLevel = 2;
        STATE.currentView = 'kanban';
        
        Utils.hide('level-1');
        Utils.hide('level-2-mastery');
        Utils.hide('level-2-performance');
        Utils.show('level-2-kanban');
        
        // Set capability filter
        if (capability) {
            const capMap = {
                'stakeholder-engagement': 'Stakeholder Engagement',
                'business-development': 'Business Development',
                'product-planning': 'Product Planning',
                'marketing-campaigns': 'Marketing Campaign'
            };
            STATE.filters.kanban.capability = [capMap[capability]];
            
            // Update filter dropdown
            const capFilter = document.getElementById('kanban-filter-capability');
            if (capFilter) {
                Array.from(capFilter.options).forEach(opt => {
                    opt.selected = opt.value === capMap[capability];
                });
            }
            
            // Update title
            const kanbanTitle = document.getElementById('kanban-title');
            if (kanbanTitle) {
                kanbanTitle.textContent = `${capMap[capability]} Activities`;
            }
            
            const breadcrumb = document.getElementById('breadcrumb-content');
            if (breadcrumb) {
                breadcrumb.textContent = `Business Review Scorecard > ${capMap[capability]}`;
            }
        } else {
            const kanbanTitle = document.getElementById('kanban-title');
            if (kanbanTitle) {
                kanbanTitle.textContent = 'Activity Board';
            }
            
            const breadcrumb = document.getElementById('breadcrumb-content');
            if (breadcrumb) {
                breadcrumb.textContent = 'Business Review Scorecard > Activity Board';
            }
        }
        
        this.setupKanbanFilters();
        this.renderKanban();
    },
    
    setupKanbanFilters() {
        console.log('=== setupKanbanFilters START ===');
        console.log('STATE.users length:', STATE.users.length);
        console.log('STATE.users:', STATE.users.map(u => ({ username: u.username, name: u.name })));
        
        // Owner filter - Show ALL users for filtering purposes
        const ownerFilter = document.getElementById('kanban-filter-owner');
        console.log('ownerFilter element:', ownerFilter);
        
        if (!ownerFilter) {
            console.error('ERROR: kanban-filter-owner element not found in DOM');
            return;
        }
        
        // Clear and populate
        ownerFilter.innerHTML = '';
        
        // Add each user
        STATE.users.forEach((user, index) => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name || user.username;
            ownerFilter.appendChild(option);
            console.log(`Added owner ${index + 1}:`, { value: user.username, text: user.name || user.username });
        });
        
        console.log('Final owner filter option count:', ownerFilter.options.length);
        console.log('=== setupKanbanFilters END ===');
    },
    
    renderKanban() {
        // Get filter values
        const capFilter = document.getElementById('kanban-filter-capability');
        const laneFilter = document.getElementById('kanban-filter-lanes');
        const catFilter = document.getElementById('kanban-filter-category');
        const ownerFilter = document.getElementById('kanban-filter-owner');
        
        STATE.filters.kanban.capability = Array.from(capFilter.selectedOptions).map(o => o.value);
        STATE.filters.kanban.lanes = Array.from(laneFilter.selectedOptions).map(o => o.value);
        STATE.filters.kanban.category = Array.from(catFilter.selectedOptions).map(o => o.value);
        STATE.filters.kanban.owner = Array.from(ownerFilter.selectedOptions).map(o => o.value);
        
        // Start with filtered cards based on global business filter and user permissions
        let cards = this.getFilteredKanbanCards();
        
        // Apply additional Kanban-specific filters
        if (STATE.filters.kanban.capability.length > 0) {
            cards = cards.filter(c => STATE.filters.kanban.capability.includes(c.capability));
        }
        if (STATE.filters.kanban.category.length > 0) {
            cards = cards.filter(c => STATE.filters.kanban.category.includes(c.category));
        }
        if (STATE.filters.kanban.owner.length > 0) {
            cards = cards.filter(c => STATE.filters.kanban.owner.includes(c.owner));
        }
        
        // Group by lane
        const lanes = STATE.filters.kanban.lanes.length > 0 ? STATE.filters.kanban.lanes : ['Planned', 'In Progress', 'Completed', 'Paused'];
        const board = document.getElementById('kanban-board');
        
        board.innerHTML = lanes.map(lane => {
            const laneCards = cards.filter(c => c.lane === lane);
            return `
                <div class="kanban-lane" data-lane="${lane}">
                    <div class="lane-header">
                        <div class="lane-title">${lane}</div>
                        <div class="lane-count">${laneCards.length}</div>
                    </div>
                    <div class="lane-cards" data-lane="${lane}">
                        ${laneCards.map(card => this.renderKanbanCard(card)).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        // Setup drag and drop
        this.setupDragAndDrop();
    },
    
    renderKanbanCard(card) {
        const daysActive = Utils.daysSince(card.startDate);
        const targetDate = new Date(card.targetDate);
        const today = new Date();
        const isOverdue = today > targetDate && card.lane !== 'Completed';
        
        const capabilityClass = card.capability.toLowerCase().replace(/ /g, '-').replace('stakeholder-engagement', 'stakeholder').replace('business-development', 'bizdev').replace('product-planning', 'product').replace('marketing-campaign', 'marketing');
        
        return `
            <div class="kanban-card" data-card-id="${card.id}" draggable="true">
                <div class="card-header">
                    <div class="card-title">${Utils.escapeHtml(card.name)}</div>
                    <div class="card-status-dot ${card.status}"></div>
                </div>
                <div class="card-capability-tag ${capabilityClass}">
                    ${card.capability}
                </div>
                <div class="card-meta">
                    <div class="card-meta-row">
                        <span><i class="fas fa-user"></i>${Utils.escapeHtml(card.owner)}</span>
                    </div>
                    <div class="card-meta-row">
                        <span><i class="fas fa-building"></i>${Utils.escapeHtml(card.category)}</span>
                    </div>
                    <div class="card-meta-row">
                        <span><i class="fas fa-calendar"></i>${Utils.formatDate(card.targetDate)}</span>
                        ${isOverdue ? `<span class="days-overdue">${Utils.daysSince(card.targetDate)}d overdue</span>` : `<span class="days-active">${daysActive}d active</span>`}
                    </div>
                </div>
            </div>
        `;
    },
    
    setupDragAndDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const lanes = document.querySelectorAll('.lane-cards');
        
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', card.innerHTML);
                e.dataTransfer.setData('card-id', card.getAttribute('data-card-id'));
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
            });
            
            // Click to edit
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-status-dot')) {
                    const cardId = card.getAttribute('data-card-id');
                    this.showCardModal(cardId);
                }
            });
        });
        
        lanes.forEach(lane => {
            lane.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            lane.addEventListener('drop', (e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData('card-id');
                const newLane = lane.getAttribute('data-lane');
                
                // Update card lane
                const card = STATE.kanbanCards.find(c => c.id === cardId);
                if (card) {
                    console.log('Drop permission check:', {
                        userType: STATE.currentUser.type,
                        userTypeTrimmed: STATE.currentUser.type.trim(),
                        isAdmin: STATE.currentUser.type.trim() === 'Admin',
                        cardOwner: card.owner,
                        currentUser: STATE.currentUser.username,
                        ownersMatch: card.owner === STATE.currentUser.username
                    });
                    
                    // Check permissions - Admin can move any card, others can only move their own
                    if (STATE.currentUser.type.trim() !== 'Admin' && card.owner !== STATE.currentUser.username) {
                        alert('You can only move cards you own');
                        return;
                    }
                    
                    card.lane = newLane;
                    
                    // Auto-update status if moved to completed
                    if (newLane === 'Completed') {
                        card.status = 'green';
                    }
                    
                    this.saveKanbanData();
                    this.renderKanban();
                    this.updateScorecardData();
                }
            });
        });
    },
    
    showCardModal(cardId = null) {
        Utils.show('card-modal');
        
        // Setup owner dropdown - Show ALL users
        const ownerSelect = document.getElementById('card-owner');
        if (!ownerSelect) {
            console.error('card-owner element not found');
            return;
        }
        
        ownerSelect.innerHTML = '';
        
        // Show all users in dropdown (filtering is just for display, not access control)
        STATE.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name || user.username;
            ownerSelect.appendChild(option);
        });
        
        if (cardId) {
            // Edit mode
            const card = STATE.kanbanCards.find(c => c.id === cardId);
            if (card) {
                console.log('Edit permission check:', {
                    userType: STATE.currentUser.type,
                    userTypeTrimmed: STATE.currentUser.type.trim(),
                    isAdmin: STATE.currentUser.type.trim() === 'Admin',
                    cardOwner: card.owner,
                    currentUser: STATE.currentUser.username,
                    ownersMatch: card.owner === STATE.currentUser.username
                });
                
                // Check permissions - Admin can edit any card, others can only edit their own
                if (STATE.currentUser.type.trim() !== 'Admin' && card.owner !== STATE.currentUser.username) {
                    alert('You can only edit cards you own');
                    Utils.hide('card-modal');
                    return;
                }
                
                document.getElementById('card-modal-title').textContent = 'Edit Activity';
                document.getElementById('card-id').value = card.id;
                document.getElementById('card-name').value = card.name;
                document.getElementById('card-capability').value = card.capability;
                document.getElementById('card-owner').value = card.owner;
                document.getElementById('card-category').value = card.category;
                document.getElementById('card-start-date').value = Utils.formatDate(card.startDate);
                document.getElementById('card-target-date').value = Utils.formatDate(card.targetDate);
                document.getElementById('card-status').value = card.status;
                document.getElementById('card-lane').value = card.lane;
                document.getElementById('card-comments').value = card.comments || '';
                
                Utils.show('delete-card-btn');
            }
        } else {
            // Add mode
            document.getElementById('card-modal-title').textContent = 'Add Activity';
            document.getElementById('card-id').value = '';
            document.getElementById('card-form').reset();
            document.getElementById('card-start-date').value = Utils.formatDate(new Date());
            if (STATE.currentUser.type === 'User') {
                document.getElementById('card-owner').value = STATE.currentUser.username;
            }
            Utils.hide('delete-card-btn');
        }
    },
    
    saveCard() {
        const cardId = document.getElementById('card-id').value;
        const name = document.getElementById('card-name').value;
        const capability = document.getElementById('card-capability').value;
        const owner = document.getElementById('card-owner').value;
        const category = document.getElementById('card-category').value;
        const startDate = document.getElementById('card-start-date').value;
        const targetDate = document.getElementById('card-target-date').value;
        const status = document.getElementById('card-status').value;
        const lane = document.getElementById('card-lane').value;
        const comments = document.getElementById('card-comments').value;
        
        if (!name || !capability || !owner || !category || !startDate || !targetDate) {
            alert('Please fill in all required fields');
            return;
        }
        
        const cardData = {
            name,
            capability,
            owner,
            category,
            startDate,
            targetDate,
            status,
            lane,
            comments
        };
        
        if (cardId) {
            // Update existing
            const card = STATE.kanbanCards.find(c => c.id === cardId);
            if (card) {
                // Check permissions - Admin can edit any card, others can only edit their own
                if (STATE.currentUser.type.trim() !== 'Admin' && card.owner !== STATE.currentUser.username) {
                    alert('You can only edit cards you own');
                    return;
                }
                Object.assign(card, cardData);
            }
        } else {
            // Add new
            cardData.id = Utils.generateId();
            STATE.kanbanCards.push(cardData);
        }
        
        this.saveKanbanData();
        Utils.hide('card-modal');
        this.renderKanban();
        this.updateScorecardData();
    },
    
    deleteCard() {
        if (!confirm('Are you sure you want to delete this activity?')) return;
        
        const cardId = document.getElementById('card-id').value;
        const index = STATE.kanbanCards.findIndex(c => c.id === cardId);
        
        if (index !== -1) {
            const card = STATE.kanbanCards[index];
            
            // Check permissions - Admin can delete any card, others can only delete their own
            if (STATE.currentUser.type.trim() !== 'Admin' && card.owner !== STATE.currentUser.username) {
                alert('You can only delete cards you own');
                return;
            }
            
            STATE.kanbanCards.splice(index, 1);
            this.saveKanbanData();
            Utils.hide('card-modal');
            this.renderKanban();
            this.updateScorecardData();
        }
    }
};

// Expose App to global scope for onclick handlers
window.App = App;

// ====================
// Initialize on page load
// ====================
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
