import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { readFileSync } from 'fs'
import { join } from 'path'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Serve index.html for root and any other routes (SPA)
app.get('*', async (c) => {
  // In development, read from public/index.html
  // In production (after build), this will be bundled
  try {
    // Try to serve as static file first
    if (c.req.path.startsWith('/static/')) {
      return serveStatic({ root: './public' })(c, async () => {})
    }
    
    // Serve index.html for all other routes
    return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Tracker</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Styles -->
    <link href="/static/style.css" rel="stylesheet">
</head>
<body>
    <!-- Loading Screen -->
    <div id="loading-screen" class="loading-screen">
        <div class="loading-spinner"></div>
        <p>Loading Business Tracker...</p>
    </div>

    <!-- Login Screen -->
    <div id="login-screen" class="login-screen" style="display: none;">
        <div class="login-container">
            <div class="login-header">
                <h1 class="login-title">DrumTree</h1>
                <p class="login-subtitle">Business Tracker</p>
            </div>
            <div class="login-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" placeholder="Enter your username" autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" autocomplete="current-password">
                </div>
                <div id="login-error" class="error-message" style="display: none;"></div>
                <button id="login-btn" class="btn-primary">Sign In</button>
            </div>
        </div>
    </div>

    <!-- Main App -->
    <div id="app" style="display: none;">
        <!-- Header -->
        <header class="app-header">
            <div class="header-left">
                <h1 class="app-title">Business Tracker</h1>
            </div>
            <div class="header-center">
                <div class="business-category-filter">
                    <label for="global-business-filter">
                        <i class="fas fa-filter"></i> Business View:
                    </label>
                    <select id="global-business-filter">
                        <option value="company">Company View</option>
                        <option value="Content">Content Business</option>
                        <option value="Channel">Channel Business</option>
                    </select>
                </div>
            </div>
            <div class="header-right">
                <span class="user-info" id="user-info"></span>
                <button id="manage-users-btn" class="btn-secondary" style="display: none;">
                    <i class="fas fa-users-cog"></i> Manage Users
                </button>
                <button id="change-password-btn" class="btn-secondary">
                    <i class="fas fa-key"></i> Change Password
                </button>
                <button id="logout-btn" class="btn-secondary">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="app-content">
            <!-- Level 1: Business Review Scorecard -->
            <div id="level-1" class="level-container">
                <div class="scorecard-grid">
                    <!-- Activation Row -->
                    <div class="scorecard-row activation-row">
                        <div class="scorecard-box capability-box" data-capability="stakeholder-engagement">
                            <div class="box-header">
                                <h3>Stakeholder Engagement</h3>
                                <i class="fas fa-handshake"></i>
                            </div>
                            <div class="box-content" id="stakeholder-content">
                                <div class="status-indicator">
                                    <div class="status-item on-track">
                                        <span class="label">On Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item in-progress">
                                        <span class="label">In Progress:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item off-track">
                                        <span class="label">Off Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="scorecard-box capability-box" data-capability="business-development">
                            <div class="box-header">
                                <h3>Business Development</h3>
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="box-content" id="bizdev-content">
                                <div class="status-indicator">
                                    <div class="status-item on-track">
                                        <span class="label">On Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item in-progress">
                                        <span class="label">In Progress:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item off-track">
                                        <span class="label">Off Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="scorecard-box capability-box" data-capability="product-planning">
                            <div class="box-header">
                                <h3>Product Planning</h3>
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <div class="box-content" id="product-content">
                                <div class="status-indicator">
                                    <div class="status-item on-track">
                                        <span class="label">On Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item in-progress">
                                        <span class="label">In Progress:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item off-track">
                                        <span class="label">Off Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="scorecard-box capability-box" data-capability="marketing-campaigns">
                            <div class="box-header">
                                <h3>Marketing Campaigns</h3>
                                <i class="fas fa-bullhorn"></i>
                            </div>
                            <div class="box-content" id="marketing-content">
                                <div class="status-indicator">
                                    <div class="status-item on-track">
                                        <span class="label">On Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item in-progress">
                                        <span class="label">In Progress:</span>
                                        <span class="value">0%</span>
                                    </div>
                                    <div class="status-item off-track">
                                        <span class="label">Off Track:</span>
                                        <span class="value">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Performance Row -->
                    <div class="scorecard-row performance-row">
                        <div class="scorecard-box wide-box" data-view="performance">
                            <div class="box-header">
                                <h3>Performance</h3>
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <div class="box-content" id="performance-content">
                                <div class="performance-kpis">
                                    <div class="kpi-item">
                                        <span class="kpi-label">MTD Revenue</span>
                                        <span class="kpi-value">Loading...</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Actual Run Rate</span>
                                        <span class="kpi-value">Loading...</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Total Base</span>
                                        <span class="kpi-value">Loading...</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Revenue Today</span>
                                        <span class="kpi-value">Loading...</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Net Additions Today</span>
                                        <span class="kpi-value">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Mastery Row -->
                    <div class="scorecard-row mastery-row">
                        <div class="scorecard-box wide-box" data-view="mastery">
                            <div class="box-header">
                                <h3>Mastery</h3>
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <div class="box-content" id="mastery-content">
                                <div class="mastery-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Function</span>
                                        <span class="stat-value">0 hrs</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Technology</span>
                                        <span class="stat-value">0 hrs</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Leadership</span>
                                        <span class="stat-value">0 hrs</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Compliance</span>
                                        <span class="stat-value">0 hrs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Level 2: Mastery Table -->
            <div id="level-2-mastery" class="level-container" style="display: none;">
                <div class="level-2-header">
                    <button id="back-to-level-1" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Back to Scorecard
                    </button>
                    <h2 class="section-title">Mastery & Learning</h2>
                </div>
                
                <div class="filters-bar">
                    <div class="filter-group">
                        <label>Username:</label>
                        <select id="mastery-filter-username"></select>
                    </div>
                    <div class="filter-group">
                        <label>Business Category:</label>
                        <select id="mastery-filter-category">
                            <option value="">All</option>
                            <option value="Content">Content Business</option>
                            <option value="Channel">Channel Business</option>
                        </select>
                    </div>
                    <button id="add-course-activity-btn" class="btn-primary">
                        <i class="fas fa-plus"></i> Add Course Activity
                    </button>
                    <button id="course-library-btn" class="btn-secondary">
                        <i class="fas fa-book"></i> Course Library
                    </button>
                </div>
                
                <div class="table-container">
                    <table id="mastery-table" class="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Category</th>
                                <th>Course</th>
                                <th>% Completion</th>
                                <th>Initiated</th>
                                <th>Updated</th>
                                <th>Concluded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="mastery-table-body">
                            <tr><td colspan="8" class="no-data">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Level 2: Performance Dashboard -->
            <div id="level-2-performance" class="level-container" style="display: none;">
                <div class="level-2-header">
                    <button id="back-to-level-1-perf" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Back to Scorecard
                    </button>
                    <h2 class="section-title">Performance Dashboard</h2>
                </div>
                
                <div id="performance-dashboard-container">
                    <!-- Performance dashboard will be loaded here -->
                    <p class="loading-message">Loading performance dashboard...</p>
                </div>
            </div>

            <!-- Level 2: Kanban Board -->
            <div id="level-2-kanban" class="level-container" style="display: none;">
                <div class="level-2-header">
                    <button id="back-to-level-1-kanban" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Back to Scorecard
                    </button>
                    <h2 class="section-title" id="kanban-title">Activity Board</h2>
                </div>
                
                <div class="filters-bar kanban-filters">
                    <div class="filter-group">
                        <label>Capability:</label>
                        <select id="kanban-filter-capability" multiple>
                            <option value="Stakeholder Engagement">Stakeholder Engagement</option>
                            <option value="Business Development">Business Development</option>
                            <option value="Product Planning">Product Planning</option>
                            <option value="Marketing Campaign">Marketing Campaign</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Lanes:</label>
                        <select id="kanban-filter-lanes" multiple>
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Paused">Paused</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Business Category:</label>
                        <select id="kanban-filter-category" multiple>
                            <option value="Content">Content Business</option>
                            <option value="Channel">Channel Business</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Owner:</label>
                        <select id="kanban-filter-owner" multiple></select>
                    </div>
                    <button id="add-card-btn" class="btn-primary">
                        <i class="fas fa-plus"></i> Add Activity
                    </button>
                </div>
                
                <div class="kanban-board" id="kanban-board">
                    <!-- Kanban lanes will be dynamically generated -->
                </div>
            </div>
        </main>
    </div>

    <!-- Modals -->
    <!-- Change Password Modal -->
    <div id="change-password-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Change Password</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="current-password">Current Password</label>
                    <input type="password" id="current-password" autocomplete="current-password">
                </div>
                <div class="form-group">
                    <label for="new-password">New Password</label>
                    <input type="password" id="new-password" autocomplete="new-password">
                </div>
                <div class="form-group">
                    <label for="confirm-password">Confirm New Password</label>
                    <input type="password" id="confirm-password" autocomplete="new-password">
                </div>
                <div id="password-error" class="error-message" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="save-password-btn" class="btn-primary">Save Password</button>
            </div>
        </div>
    </div>

    <!-- Course Form Modal -->
    <div id="course-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="course-modal-title">Add Course</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="course-form">
                    <input type="hidden" id="course-row-id">
                    <div class="form-group">
                        <label for="course-username">Username *</label>
                        <select id="course-username" required></select>
                    </div>
                    <div class="form-group">
                        <label for="course-category">Category *</label>
                        <select id="course-category" required>
                            <option value="">Select Category</option>
                            <option value="Compliance">Compliance</option>
                            <option value="Function">Function</option>
                            <option value="Leadership">Leadership</option>
                            <option value="Technology">Technology</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="course-name">Course *</label>
                        <select id="course-name" required>
                            <option value="">Select a course</option>
                        </select>
                        <small class="form-help">Can't find your course? Visit <a href="#" id="open-course-library-link">Course Library</a> to add it.</small>
                    </div>
                    <div class="form-group">
                        <label for="course-completion">% Completion *</label>
                        <input type="number" id="course-completion" min="0" max="100" value="0" required>
                    </div>
                    <div class="form-group">
                        <label for="course-initiated">Initiated</label>
                        <input type="date" id="course-initiated">
                    </div>
                    <div class="form-group">
                        <label for="course-updated">Updated</label>
                        <input type="date" id="course-updated">
                    </div>
                    <div class="form-group">
                        <label for="course-concluded">Concluded</label>
                        <input type="date" id="course-concluded">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="save-course-btn" class="btn-primary">Save Course</button>
            </div>
        </div>
    </div>

    <!-- Activity Card Modal -->
    <div id="card-modal" class="modal" style="display: none;">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="card-modal-title">Add Activity</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="card-form">
                    <input type="hidden" id="card-id">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-name">Activity Name *</label>
                            <input type="text" id="card-name" required>
                        </div>
                        <div class="form-group">
                            <label for="card-capability">Capability *</label>
                            <select id="card-capability" required>
                                <option value="">Select Capability</option>
                                <option value="Stakeholder Engagement">Stakeholder Engagement</option>
                                <option value="Business Development">Business Development</option>
                                <option value="Product Planning">Product Planning</option>
                                <option value="Marketing Campaign">Marketing Campaign</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-owner">Owner *</label>
                            <select id="card-owner" required></select>
                        </div>
                        <div class="form-group">
                            <label for="card-category">Business Category *</label>
                            <select id="card-category" required>
                                <option value="">Select Category</option>
                                <option value="Content">Content Business</option>
                                <option value="Channel">Channel Business</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-start-date">Start Date *</label>
                            <input type="date" id="card-start-date" required>
                        </div>
                        <div class="form-group">
                            <label for="card-target-date">Target Completion *</label>
                            <input type="date" id="card-target-date" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-status">Status Indicator *</label>
                            <select id="card-status" required>
                                <option value="green">Green (On Track)</option>
                                <option value="amber">Amber (At Risk)</option>
                                <option value="red">Red (Off Track)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="card-lane">Lane *</label>
                            <select id="card-lane" required>
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Paused">Paused</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="card-comments">Comments</label>
                        <textarea id="card-comments" rows="4"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="delete-card-btn" class="btn-danger" style="display: none;">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button id="save-card-btn" class="btn-primary">Save Activity</button>
            </div>
        </div>
    </div>

    <!-- User Management Modal (Admin Only) -->
    <div id="user-management-modal" class="modal" style="display: none;">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>Manage Users</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="user-management-header">
                    <button id="add-user-btn" class="btn-primary">
                        <i class="fas fa-user-plus"></i> Add New User
                    </button>
                </div>
                <div class="table-container">
                    <table id="users-table" class="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Password</th>
                                <th>Type</th>
                                <th>Content Business</th>
                                <th>Channel Business</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <tr><td colspan="7" class="no-data">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Close</button>
            </div>
        </div>
    </div>

    <!-- Edit User Modal -->
    <div id="edit-user-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="edit-user-modal-title">Edit User</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-user-form">
                    <input type="hidden" id="edit-user-id">
                    <div class="form-group">
                        <label for="edit-user-username">Username *</label>
                        <input type="text" id="edit-user-username" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-password">Password *</label>
                        <input type="text" id="edit-user-password" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-type">User Type *</label>
                        <select id="edit-user-type" required>
                            <option value="User">User</option>
                            <option value="Lead">Lead</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="edit-user-content">
                            Content Business
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="edit-user-channel">
                            Channel Business
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="delete-user-btn" class="btn-danger" style="display: none;">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button id="save-user-btn" class="btn-primary">Save User</button>
            </div>
        </div>
    </div>

    <!-- Course Library Modal -->
    <div id="course-library-modal" class="modal" style="display: none;">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>Course Library</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="course-library-header">
                    <div class="course-library-tabs">
                        <button class="tab-btn active" data-category="compliance" onclick="App.switchCourseCategory('compliance')">Compliance</button>
                        <button class="tab-btn" data-category="function" onclick="App.switchCourseCategory('function')">Function</button>
                        <button class="tab-btn" data-category="leadership" onclick="App.switchCourseCategory('leadership')">Leadership</button>
                        <button class="tab-btn" data-category="technology" onclick="App.switchCourseCategory('technology')">Technology</button>
                    </div>
                    <button id="add-library-course-btn" class="btn-primary">
                        <i class="fas fa-plus"></i> Add Course
                    </button>
                </div>
                <div class="course-library-grid" id="compliance-courses">
                    <p>Loading courses...</p>
                </div>
                <div class="course-library-grid" id="function-courses" style="display: none;">
                    <p>Loading courses...</p>
                </div>
                <div class="course-library-grid" id="leadership-courses" style="display: none;">
                    <p>Loading courses...</p>
                </div>
                <div class="course-library-grid" id="technology-courses" style="display: none;">
                    <p>Loading courses...</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Close</button>
            </div>
        </div>
    </div>

    <!-- Library Course Modal (Add/Edit) -->
    <div id="library-course-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="library-course-modal-title">Add Course to Library</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="library-course-form">
                    <input type="hidden" id="library-course-id">
                    <div class="form-group">
                        <label for="library-course-name">Course Name *</label>
                        <input type="text" id="library-course-name" required>
                    </div>
                    <div class="form-group">
                        <label for="library-course-category">Category *</label>
                        <select id="library-course-category" required>
                            <option value="">Select Category</option>
                            <option value="Compliance">Compliance</option>
                            <option value="Function">Function</option>
                            <option value="Leadership">Leadership</option>
                            <option value="Technology">Technology</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="library-course-url">Course URL</label>
                        <input type="url" id="library-course-url" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label for="library-course-hours">Total Hours *</label>
                        <input type="number" id="library-course-hours" min="0.5" step="0.5" value="4" required>
                        <small style="color: var(--text-secondary); font-size: 12px;">Duration of the course in hours (default: 4)</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="save-library-course-btn" class="btn-primary">Save Course</button>
            </div>
        </div>
    </div>

    <!-- Performance Service Modal -->
    <div id="performance-service-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2 id="perf-service-modal-title">Add Service</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <form id="performance-service-form">
                    <input type="hidden" id="perf-service-id">
                    
                    <h3 style="margin: 0 0 1rem 0; color: #374151; font-size: 0.95rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Service Information</h3>
                    
                    <div class="form-group">
                        <label for="perf-service-name">Service Name *</label>
                        <input type="text" id="perf-service-name" placeholder="e.g., YoGamezPro" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="perf-service-category">Business Category *</label>
                        <select id="perf-service-category" required>
                            <option value="">Select a category</option>
                            <option value="Content Business">Content Business</option>
                            <option value="Channel Business">Channel Business</option>
                        </select>
                    </div>
                    
                    <h3 style="margin: 1.5rem 0 1rem 0; color: #374151; font-size: 0.95rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Deployment Information</h3>
                    
                    <div class="form-group">
                        <label for="perf-service-account">Account *</label>
                        <input type="text" id="perf-service-account" placeholder="e.g., Vodacom, MTN" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="perf-service-country">Country *</label>
                        <select id="perf-service-country" required style="width: 100%;">
                            <option value="">Select a country</option>
                            <!-- Will be populated dynamically from countries-currencies.js -->
                        </select>
                    </div>
                    
                    <h3 style="margin: 1.5rem 0 1rem 0; color: #374151; font-size: 0.95rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Currency & Billing</h3>
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label for="perf-service-currency">Currency *</label>
                            <select id="perf-service-currency" required>
                                <option value="">Select currency</option>
                                <!-- Will be populated dynamically from countries-currencies.js -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="perf-service-zar-rate">ZAR Rate *</label>
                            <input type="number" id="perf-service-zar-rate" placeholder="18.5" min="0.01" step="0.01" required>
                        </div>
                    </div>
                    
                    <h3 style="margin: 1.5rem 0 1rem 0; color: #374151; font-size: 0.95rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Performance Metrics</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label for="perf-service-actual-runrate">Actual Run Rate (ZAR/day) *</label>
                            <input type="number" id="perf-service-actual-runrate" placeholder="48076" min="0" step="100" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="perf-service-required-runrate">Required Run Rate (ZAR/day) *</label>
                            <input type="number" id="perf-service-required-runrate" placeholder="50000" min="0" step="100" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="perf-service-subscriber-base">Subscriber Base *</label>
                        <input type="number" id="perf-service-subscriber-base" placeholder="85000" min="0" step="100" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="save-perf-service-btn" class="btn-primary">Save Service</button>
            </div>
        </div>
    </div>

    <!-- Daily Data Modal -->
    <div id="daily-data-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="daily-data-modal-title">Edit Daily Data</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="daily-data-form">
                    <input type="hidden" id="daily-service-index">
                    <input type="hidden" id="daily-day-index">
                    <div class="form-group">
                        <label for="daily-service-name">Service</label>
                        <input type="text" id="daily-service-name" disabled style="background: #f3f4f6; cursor: not-allowed;">
                    </div>
                    <div class="form-group">
                        <label for="daily-day">Day</label>
                        <input type="number" id="daily-day" min="1" max="31" disabled style="background: #f3f4f6; cursor: not-allowed;">
                    </div>
                    <div class="form-group">
                        <label for="daily-date">Date</label>
                        <input type="date" id="daily-date" disabled style="background: #f3f4f6; cursor: not-allowed;">
                    </div>
                    <div class="form-group">
                        <label for="daily-billing-lcu">Daily Billing (LCU) *</label>
                        <input type="number" id="daily-billing-lcu" placeholder="50000" min="0" step="100" required>
                    </div>
                    <div class="form-group">
                        <label for="daily-target">Daily Target (R) *</label>
                        <input type="number" id="daily-target" placeholder="46000" min="0" step="100" required>
                    </div>
                    <div class="form-group">
                        <label for="daily-churned-subs">Churned Subs *</label>
                        <input type="number" id="daily-churned-subs" placeholder="1700" min="0" step="1" required>
                    </div>
                    <div class="form-group">
                        <label for="daily-acquisitions">Daily Acquisitions *</label>
                        <input type="number" id="daily-acquisitions" placeholder="1785" min="0" step="1" required>
                    </div>
                    <div class="form-group">
                        <label for="daily-net-additions">Net Additions *</label>
                        <input type="number" id="daily-net-additions" placeholder="85" step="1" required>
                    </div>
                    <div class="form-group">
                        <label for="daily-subscriber-base">Subscriber Base *</label>
                        <input type="number" id="daily-subscriber-base" placeholder="85000" min="0" step="1" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="save-daily-data-btn" class="btn-primary">Save Daily Data</button>
            </div>
        </div>
    </div>

    <!-- Bulk Daily Edit Modal -->
    <div id="bulk-daily-edit-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 95%; width: 1400px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="modal-header">
                <h2>Edit Multiple Entries</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                <!-- Filter Controls -->
                <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
                    <div class="filter-group" style="flex: 1; min-width: 200px;">
                        <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Month</label>
                        <select id="bulk-edit-month" class="filter-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;">
                            <option value="2026-01">January 2026</option>
                            <option value="2025-12">December 2025</option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1; min-width: 200px;">
                        <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Service</label>
                        <select id="bulk-edit-service" class="filter-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;">
                            <!-- Will be populated dynamically -->
                        </select>
                    </div>
                </div>

                <!-- Editable Data Table -->
                <div style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1.5rem;">
                    <table class="data-table" id="bulk-edit-table" style="width: 100%; min-width: 2200px;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Service SKU</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Business Category</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Account</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Country</th>
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Currency</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">ZAR Rate</th>
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Day</th>
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Date</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Daily Billing (LCU)</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Daily Revenue (ZAR)</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Daily Target (ZAR)</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Churned Subs</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Daily Acquisitions</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Net Additions</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Subscriber Base</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Variance</th>
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e5e7eb; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bulk-edit-tbody">
                            <!-- Will be populated dynamically -->
                        </tbody>
                    </table>
                </div>
                
                <!-- SKU Management Section -->
                <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 600; color: #374151;">SKU Management</h3>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button id="add-sku-btn" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            <i class="fas fa-plus"></i> Add SKU
                        </button>
                        <button id="duplicate-sku-btn" class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            <i class="fas fa-copy"></i> Duplicate Selected SKU
                        </button>
                        <div style="flex: 1;"></div>
                        <span id="bulk-edit-info" style="color: #6b7280; font-size: 0.875rem; padding: 0.5rem;">
                            <!-- SKU count will be shown here -->
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-cancel">Cancel</button>
                <button id="save-bulk-daily-btn" class="btn-primary">Save All Changes</button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/static/countries-currencies.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
    `)
  } catch (error) {
    return c.text('Error loading application', 500)
  }
})

export default app
