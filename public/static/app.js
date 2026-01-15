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
        // Check if user is already logged in (session storage)
        const stored = sessionStorage.getItem('currentUser');
        if (stored) {
            STATE.currentUser = JSON.parse(stored);
            this.showApp();
            return true;
        }
        
        // Load users data
        await this.loadUsers();
        
        // Show login screen
        Utils.hide('loading-screen');
        Utils.show('login-screen');
        
        // Setup login form
        this.setupLoginForm();
        
        return false;
    },
    
    async loadUsers() {
        const data = await SheetsAPI.fetchSheet(
            CONFIG.SHEETS.USERS,
            CONFIG.SHEET_TABS.USERS
        );
        
        // Skip header row and map to user objects
        STATE.users = data.slice(1).map((row, index) => ({
            rowIndex: index + 2, // +2 because: 0-indexed + 1 for header + 1 for Google Sheets 1-indexing
            username: row['Username'] || row['Column0'] || '',
            password: row['Password'] || row['Column1'] || '',
            name: row['Name'] || row['Column2'] || '',
            type: (row['Type'] || row['Column3'] || 'User').trim(),
            contentBusiness: (row['Content Business'] || row['Column4'] || '').toLowerCase() === 'yes',
            channelBusiness: (row['Channel Business'] || row['Column5'] || '').toLowerCase() === 'yes',
            lastLogin: row['Last Login'] || row['Column6'] || ''
        })).filter(u => u.username); // Filter out empty rows
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
            
            // Update last login (in production, would call Apps Script)
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
        // Load mastery data
        await this.loadMasteryData();
        
        // Load kanban data
        await this.loadKanbanData();
        
        // Load performance data (placeholder)
        this.loadPerformanceData();
    },
    
    async loadMasteryData() {
        const data = await SheetsAPI.fetchSheet(
            CONFIG.SHEETS.MASTERY,
            CONFIG.SHEET_TABS.MASTERY_DASHBOARD
        );
        
        // Skip header row
        STATE.masteryData = data.slice(1).map((row, index) => ({
            rowIndex: index + 2,
            username: row['Username'] || row['Column0'] || '',
            category: row['Category'] || row['Column1'] || '',
            course: row['Course'] || row['Column2'] || '',
            completion: parseFloat(row['% Completion'] || row['Column3'] || 0),
            initiated: row['Initiated'] || row['Column4'] || '',
            updated: row['Updated'] || row['Column5'] || '',
            concluded: row['Concluded'] || row['Column6'] || ''
        })).filter(m => m.username);
        
        // Load courses list
        const courses = await SheetsAPI.fetchSheet(
            CONFIG.SHEETS.MASTERY,
            CONFIG.SHEET_TABS.MASTERY_COURSES
        );
        
        STATE.coursesList = courses.slice(1).map(row => ({
            name: row['Course Name'] || row['Column0'] || '',
            category: row['Category'] || row['Column1'] || ''
        })).filter(c => c.name);
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
        document.getElementById('add-course-btn').addEventListener('click', () => this.showCourseModal());
        document.getElementById('add-card-btn').addEventListener('click', () => this.showCardModal());
        
        // Save buttons
        document.getElementById('save-password-btn').addEventListener('click', () => this.savePassword());
        document.getElementById('save-course-btn').addEventListener('click', () => this.saveCourse());
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
    
    updateMasteryStats() {
        // Calculate learning hours by category
        const stats = {
            'Function': 0,
            'Technology': 0,
            'Leadership': 0,
            'Compliance': 0
        };
        
        // Filter by user permissions
        let filteredData = STATE.masteryData;
        if (STATE.currentUser.type === 'User') {
            filteredData = filteredData.filter(m => m.username === STATE.currentUser.username);
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            // Filter by business category users
            const categoryUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            }).map(u => u.username);
            filteredData = filteredData.filter(m => categoryUsers.includes(m.username));
        }
        
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
            
            // Filter cards
            let cards = STATE.kanbanCards.filter(c => c.capability === capFilter);
            
            // Apply user permissions
            if (STATE.currentUser.type === 'User') {
                cards = cards.filter(c => c.owner === STATE.currentUser.username);
            } else if (STATE.currentUser.type === 'Lead') {
                const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
                cards = cards.filter(c => c.category === category);
            }
            
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
        
        // Update password (in production, would call Apps Script)
        STATE.currentUser.password = newPass;
        sessionStorage.setItem('currentUser', JSON.stringify(STATE.currentUser));
        
        console.log('Password changed for:', STATE.currentUser.username);
        
        Utils.hide('change-password-modal');
        alert('Password changed successfully!');
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
        // Username filter
        const usernameFilter = document.getElementById('mastery-filter-username');
        usernameFilter.innerHTML = '<option value="">All Users</option>';
        
        // Filter users based on permissions
        let availableUsers = STATE.users;
        if (STATE.currentUser.type === 'User') {
            availableUsers = STATE.users.filter(u => u.username === STATE.currentUser.username);
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            availableUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            });
        }
        
        availableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name;
            usernameFilter.appendChild(option);
        });
        
        // Set initial filter
        if (STATE.currentUser.type === 'User') {
            usernameFilter.value = STATE.currentUser.username;
            usernameFilter.disabled = true;
        }
    },
    
    filterMasteryTable() {
        STATE.filters.mastery.username = document.getElementById('mastery-filter-username').value;
        STATE.filters.mastery.category = document.getElementById('mastery-filter-category').value;
        this.renderMasteryTable();
    },
    
    renderMasteryTable() {
        const tbody = document.getElementById('mastery-table-body');
        
        // Filter data
        let data = [...STATE.masteryData];
        
        // Apply user permissions
        if (STATE.currentUser.type === 'User') {
            data = data.filter(m => m.username === STATE.currentUser.username);
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            const categoryUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            }).map(u => u.username);
            data = data.filter(m => categoryUsers.includes(m.username));
        }
        
        // Apply filters
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
        
        tbody.innerHTML = data.map(course => `
            <tr>
                <td>${Utils.escapeHtml(course.username)}</td>
                <td>${Utils.escapeHtml(course.category)}</td>
                <td>${Utils.escapeHtml(course.course)}</td>
                <td>${course.completion}%</td>
                <td>${Utils.formatDate(course.initiated)}</td>
                <td>${Utils.formatDate(course.updated)}</td>
                <td>${Utils.formatDate(course.concluded)}</td>
                <td class="action-buttons">
                    <button class="btn-icon" onclick="App.editCourse('${course.rowIndex}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="App.deleteCourse('${course.rowIndex}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    showCourseModal(courseRow = null) {
        Utils.show('course-modal');
        
        // Setup username dropdown
        const usernameSelect = document.getElementById('course-username');
        usernameSelect.innerHTML = '';
        
        let availableUsers = STATE.users;
        if (STATE.currentUser.type === 'User') {
            availableUsers = [STATE.currentUser];
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            availableUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            });
        }
        
        availableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name;
            usernameSelect.appendChild(option);
        });
        
        if (courseRow) {
            // Edit mode
            const course = STATE.masteryData.find(c => c.rowIndex === parseInt(courseRow));
            if (course) {
                document.getElementById('course-modal-title').textContent = 'Edit Course';
                document.getElementById('course-row-id').value = course.rowIndex;
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
            document.getElementById('course-modal-title').textContent = 'Add Course';
            document.getElementById('course-row-id').value = '';
            document.getElementById('course-form').reset();
            if (STATE.currentUser.type === 'User') {
                document.getElementById('course-username').value = STATE.currentUser.username;
            }
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
            concluded
        };
        
        if (rowId) {
            // Update existing
            const index = STATE.masteryData.findIndex(c => c.rowIndex === parseInt(rowId));
            if (index !== -1) {
                STATE.masteryData[index] = { ...STATE.masteryData[index], ...courseData };
            }
        } else {
            // Add new
            courseData.rowIndex = STATE.masteryData.length + 2;
            STATE.masteryData.push(courseData);
        }
        
        // In production, would call Apps Script to update sheet
        console.log('Course saved:', courseData);
        
        Utils.hide('course-modal');
        this.renderMasteryTable();
        this.updateScorecardData();
    },
    
    editCourse(rowIndex) {
        this.showCourseModal(rowIndex);
    },
    
    deleteCourse(rowIndex) {
        if (!confirm('Are you sure you want to delete this course?')) return;
        
        const index = STATE.masteryData.findIndex(c => c.rowIndex === parseInt(rowIndex));
        if (index !== -1) {
            STATE.masteryData.splice(index, 1);
            // In production, would call Apps Script to delete from sheet
            console.log('Course deleted:', rowIndex);
            this.renderMasteryTable();
            this.updateScorecardData();
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
        // Owner filter
        const ownerFilter = document.getElementById('kanban-filter-owner');
        ownerFilter.innerHTML = '';
        
        let availableUsers = STATE.users;
        if (STATE.currentUser.type === 'User') {
            availableUsers = [STATE.currentUser];
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            availableUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            });
        }
        
        availableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name;
            ownerFilter.appendChild(option);
        });
        
        // Apply user-based filters
        if (STATE.currentUser.type === 'User') {
            STATE.filters.kanban.owner = [STATE.currentUser.username];
            ownerFilter.value = STATE.currentUser.username;
            Array.from(ownerFilter.options).forEach(opt => {
                opt.selected = opt.value === STATE.currentUser.username;
            });
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            STATE.filters.kanban.category = [category];
            const catFilter = document.getElementById('kanban-filter-category');
            Array.from(catFilter.options).forEach(opt => {
                opt.selected = opt.value === category;
            });
        }
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
        
        // Filter cards
        let cards = [...STATE.kanbanCards];
        
        // Apply filters
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
        
        // Setup owner dropdown
        const ownerSelect = document.getElementById('card-owner');
        ownerSelect.innerHTML = '';
        
        let availableUsers = STATE.users;
        if (STATE.currentUser.type === 'User') {
            availableUsers = [STATE.currentUser];
        } else if (STATE.currentUser.type === 'Lead') {
            const category = STATE.currentUser.contentBusiness ? 'Content' : 'Channel';
            availableUsers = STATE.users.filter(u => {
                return category === 'Content' ? u.contentBusiness : u.channelBusiness;
            });
        }
        
        availableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.name;
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

// ====================
// Initialize on page load
// ====================
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
