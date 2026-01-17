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
        // Load all data
        await this.loadAllData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show Level 1 (Scorecard)
        this.showLevel1();
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
        } else {
            // Initialize with courses from Excel file
            console.log('Initializing courses library from Excel data...');
            STATE.coursesList = [
                {"id":"course-18","name":"AI Ethics: Ethical Intelligence for 2026","category":"Compliance","url":"https://www.udemy.com/course/chatgpt-ai-ethics-ethical-intelligence/"},
                {"id":"course-19","name":"Corporate Governance: Principles and Practice","category":"Compliance","url":"https://www.udemy.com/course/corporate-governance-k/"},
                {"id":"course-20","name":"Employment Laws in South Africa","category":"Compliance","url":"https://www.udemy.com/course/human-resources-labour-law-employment-laws-in-south-africa/"},
                {"id":"course-17","name":"Professional Ethics & Workplace Integrity Masterclass","category":"Compliance","url":"https://www.udemy.com/course/professional-ethics-mastery/"},
                {"id":"course-16","name":"The Complete Cyber Security Awareness Training for Employees","category":"Compliance","url":"https://www.udemy.com/course/cybersecurity-for-corporate-employees/"},
                {"id":"course-10","name":"Business Fundamentals: Marketing Strategy","category":"Function","url":"https://www.udemy.com/course/business-fundamentals-marketing-strategy/"},
                {"id":"course-6","name":"Canva Master Course 2026","category":"Function","url":"https://www.udemy.com/course/canva-master-course-graphic-design-for-beginners/"},
                {"id":"course-8","name":"Financial Reporeting & Analysis","category":"Function","url":"https://www.udemy.com/course/financial-reporting-analysis/"},
                {"id":"course-7","name":"Management Consulting Presentation Essentials Training 2026","category":"Function","url":"https://www.udemy.com/course/management-consulting-presentation-mckinsey/"},
                {"id":"course-9","name":"The Complete Digital Marketing Guide","category":"Function","url":"https://www.udemy.com/course/digital-marketing-guide/"},
                {"id":"course-14","name":"Business Model Innovation For Business Growth","category":"Leadership","url":"https://www.udemy.com/course/part-1-business-innovation-for-brand-growth/"},
                {"id":"course-11","name":"Communication, Leadership & Management","category":"Leadership","url":"https://www.udemy.com/course/high-impact-communication-skills/"},
                {"id":"course-13","name":"Leadership: Growth Mindset for Leadership and Organizations","category":"Leadership","url":"https://www.udemy.com/course/growth-mindset-for-leadership-and-organizations/"},
                {"id":"course-12","name":"Leadership: The Emotionally Intelligent Leader","category":"Leadership","url":"https://www.udemy.com/course/the-emotionally-intelligent-leader/"},
                {"id":"course-15","name":"MBA in a Box: Business Lessons from a CEO","category":"Leadership","url":"https://www.udemy.com/course/mba-in-a-box-business-lessons-from-a-ceo/"},
                {"id":"course-5","name":"Agentic AI for Beginners","category":"Technology","url":"https://www.udemy.com/course/agentic-ai-for-beginners/"},
                {"id":"course-2","name":"Claude Code Beginner to Pro","category":"Technology","url":"https://www.udemy.com/course/learn-claude-code/"},
                {"id":"course-3","name":"The Complete AI Coding Course (2025)","category":"Technology","url":"https://www.udemy.com/course/the-complete-ai-coding-course-2025-cursor-ai-v0-vercel/"},
                {"id":"course-4","name":"The Complete AI Guide","category":"Technology","url":"https://www.udemy.com/course/complete-ai-guide/"},
                {"id":"course-1","name":"Udemy: 100 Days of Code","category":"Technology","url":"https://www.udemy.com/course/100-days-of-code/"}
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
        STATE.currentLevel = 1;
        STATE.currentView = null;
        
        // Hide all level 2 views
        Utils.hide('level-2-mastery');
        Utils.hide('level-2-performance');
        Utils.hide('level-2-kanban');
        
        // Show level 1
        Utils.show('level-1');
        
        // Update breadcrumb
        document.getElementById('breadcrumb-content').textContent = 'Business Review Scorecard';
        
        // Update scorecard data
        this.updateScorecardData();
    },
    
    updateScorecardData() {
        // Update performance KPIs
        if (STATE.performanceData) {
            const perfContent = document.getElementById('performance-content');
            const kpis = perfContent.querySelectorAll('.kpi-value');
            kpis[0].textContent = STATE.performanceData.mtdRevenue;
            kpis[1].textContent = STATE.performanceData.actualRunRate;
            kpis[2].textContent = STATE.performanceData.totalBase;
            kpis[3].textContent = STATE.performanceData.revenueToday;
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
        
        // Count hours (assume each completed course = 10 hours)
        filteredData.forEach(m => {
            if (m.completion === 100 && stats[m.category] !== undefined) {
                stats[m.category] += 10;
            }
        });
        
        // Update UI
        const masteryContent = document.getElementById('mastery-content');
        const statValues = masteryContent.querySelectorAll('.stat-value');
        statValues[0].textContent = `${stats['Function']} hrs`;
        statValues[1].textContent = `${stats['Technology']} hrs`;
        statValues[2].textContent = `${stats['Leadership']} hrs`;
        statValues[3].textContent = `${stats['Compliance']} hrs`;
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
        STATE.currentLevel = 2;
        STATE.currentView = 'mastery';
        
        Utils.hide('level-1');
        Utils.hide('level-2-performance');
        Utils.hide('level-2-kanban');
        Utils.show('level-2-mastery');
        
        document.getElementById('breadcrumb-content').textContent = 'Business Review Scorecard > Mastery & Learning';
        
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
        
        // Setup course dropdown from library
        const courseSelect = document.getElementById('course-name');
        console.log('courseSelect element:', courseSelect);
        
        if (!courseSelect) {
            console.error('ERROR: course-name element not found');
            return;
        }
        
        courseSelect.innerHTML = '<option value="">Select a course</option>';
        
        // Sort courses alphabetically
        const sortedCourses = [...STATE.coursesList].sort((a, b) => a.name.localeCompare(b.name));
        sortedCourses.forEach((course, index) => {
            const option = document.createElement('option');
            option.value = course.name;
            option.textContent = course.name;
            courseSelect.appendChild(option);
            if (index < 3) {
                console.log(`Added course ${index + 1}:`, course.name);
            }
        });
        
        console.log('Course dropdown option count:', courseSelect.options.length);
        console.log('=== showCourseModal username/course setup END ===');
        });
        
        if (courseRow) {
            // Edit mode
            const course = STATE.masteryData.find(c => c.id === courseRow);
            if (course) {
                document.getElementById('course-modal-title').textContent = 'Edit Course';
                document.getElementById('course-row-id').value = course.id;
                document.getElementById('course-username').value = course.username;
                document.getElementById('course-category').value = course.category;
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
        }
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
            }
        } else {
            // Add mode
            document.getElementById('library-course-modal-title').textContent = 'Add New Course';
            document.getElementById('library-course-id').value = '';
            document.getElementById('library-course-form').reset();
        }
    },

    saveLibraryCourse() {
        const courseId = document.getElementById('library-course-id').value;
        const name = document.getElementById('library-course-name').value.trim();
        const category = document.getElementById('library-course-category').value;
        const url = document.getElementById('library-course-url').value.trim();
        
        if (!name || !category) {
            alert('Please fill in all required fields');
            return;
        }
        
        const courseData = {
            name,
            category,
            url: url || ''
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
        STATE.currentLevel = 2;
        STATE.currentView = 'performance';
        
        Utils.hide('level-1');
        Utils.hide('level-2-mastery');
        Utils.hide('level-2-kanban');
        Utils.show('level-2-performance');
        
        document.getElementById('breadcrumb-content').textContent = 'Business Review Scorecard > Performance Dashboard';
        
        // Load performance dashboard
        this.loadPerformanceDashboard();
    },
    
    loadPerformanceDashboard() {
        const container = document.getElementById('performance-dashboard-container');
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    <i class="fas fa-chart-line" style="font-size: 48px; color: var(--primary);"></i>
                </p>
                <h3>Performance Dashboard Integration</h3>
                <p style="margin-top: 1rem; color: var(--text-secondary);">
                    This section will integrate the existing performance dashboard from:<br>
                    <a href="https://amper8and.github.io/service-performance-dashboard/" target="_blank" style="color: var(--primary);">
                        https://amper8and.github.io/service-performance-dashboard/
                    </a>
                </p>
                <p style="margin-top: 1rem; color: var(--text-secondary);">
                    The dashboard will be embedded or the code will be integrated to show:<br>
                    • MTD Revenue vs Target<br>
                    • Actual vs Required Run Rate<br>
                    • Subscriber Base & Net Adds<br>
                    • Daily Revenue Breakdown
                </p>
            </div>
        `;
    },
    
    // Kanban View
    showKanban(capability = null) {
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
            Array.from(capFilter.options).forEach(opt => {
                opt.selected = opt.value === capMap[capability];
            });
            
            // Update title
            document.getElementById('kanban-title').textContent = `${capMap[capability]} Activities`;
            document.getElementById('breadcrumb-content').textContent = `Business Review Scorecard > ${capMap[capability]}`;
        } else {
            document.getElementById('kanban-title').textContent = 'Activity Board';
            document.getElementById('breadcrumb-content').textContent = 'Business Review Scorecard > Activity Board';
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
