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
    <title>DrumTree Business Tracker</title>
    
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
        <p>Loading DrumTree Business Tracker...</p>
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
                <h1 class="app-title">DrumTree Business Tracker</h1>
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
                    <button id="add-course-btn" class="btn-primary">
                        <i class="fas fa-plus"></i> Add Course
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
                        <input type="text" id="course-name" required>
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

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="/static/app.js" type="module"></script>
</body>
</html>`)
  } catch (error) {
    return c.text('Error loading application', 500)
  }
})

export default app
