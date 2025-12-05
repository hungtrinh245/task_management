# 📋 Tính Năng Quản Lý Dự Án (Project Management Feature)

## I. TỔNG QUAN TÍNH NĂNG

### Mục Tiêu
Xây dựng một hệ thống quản lý dự án cho phép:
- Manager tạo và quản lý **dự án (Projects)**
- Gán **nhiều task** vào từng dự án
- Theo dõi tiến độ dự án thông qua các metrics
- Xem dashboard dự án với thống kê chi tiết
- Quản lý thành viên dự án (team)

### Scope của Phase này
- [x] Thiết kế Data Model cho Projects
- [x] Thiết kế API & Database Schema
- [x] Xác định Roles & Permissions
- [x] Thiết kế UI/UX Flow
- [x] Định nghĩa Business Logic & Rules

---

## II. DATA MODEL (Database Schema)

### 2.1 Projects Table

```json
{
  "id": "proj-001",
  "name": "Website Redesign 2024",
  "description": "Redesign company website with modern UI/UX",
  "status": "active",           // active, on-hold, completed, archived
  "startDate": "2024-12-01",
  "endDate": "2025-03-31",
  "budget": 50000,              // (optional) Budget tracking
  "createdBy": "manager1",      // User name or ID
  "createdAt": "2024-12-05T10:00:00Z",
  "updatedAt": "2024-12-05T10:00:00Z",
  "teamMembers": [
    {
      "userId": "emp001",
      "userName": "John",
      "role": "developer",       // developer, designer, tester, manager
      "joinedAt": "2024-12-05"
    }
  ],
  "taskIds": ["task-001", "task-002", "task-003"],  // Array of task IDs
  "metadata": {
    "category": "web-development",
    "priority": "high",          // high, medium, low
    "visibility": "team"         // team, private, public
  }
}
```

### 2.2 Task Update (thêm field `projectId`)

```json
{
  "id": "task-001",
  "projectId": "proj-001",    // ⭐ NEW: Reference to project
  "title": "Homepage redesign",
  "status": "inprogress",
  // ... other existing fields
}
```

### 2.3 Summary

| Table | Fields | Purpose |
|-------|--------|---------|
| **projects** | id, name, description, status, startDate, endDate, teamMembers, taskIds, metadata | Core project info |
| **tasks** | projectId (NEW) | Link task to project |

---

## III. ROLES & PERMISSIONS

### 3.1 Roles trong Project

```
Global Role          Project Role        Permissions
─────────────────────────────────────────────────────────
manager          →   Owner/Manager      ✅ Create, Edit, Delete project
                                        ✅ Add/remove team members
                                        ✅ Assign/unassign tasks
                                        ✅ View all project data
                                        ✅ Archive/close project

manager/employee →   Team Member        ✅ View project details
                                        ✅ View tasks assigned to them
                                        ✅ Update task status/subtasks

employee         →   (No access)        ❌ Cannot create projects
                                        ✅ Can only see tasks assigned to them
```

### 3.2 Permission Matrix

| Action | Manager | Employee | Notes |
|--------|---------|----------|-------|
| Create Project | ✅ | ❌ | Only managers can initiate projects |
| Edit Project Details | ✅ | ❌ | Name, description, dates, budget |
| Add Team Members | ✅ | ❌ | Invite employees to project |
| Remove Team Members | ✅ | ❌ | Remove from project |
| Assign Task to Project | ✅ | ❌ | Associate existing tasks |
| Create Task in Project | ✅ | ✅* | Employee can create, manager must approve |
| View Project Dashboard | ✅ | ✅ | See own project tasks & progress |
| Archive Project | ✅ | ❌ | Close or archive project |

---

## IV. BUSINESS LOGIC & RULES

### 4.1 Project Status & Workflow

```
        Create
          ↓
    ┌─────────────┐
    │  active     │ ← Default status
    └──────┬──────┘
           │
        (can pause)
           ↓
    ┌─────────────┐
    │  on-hold    │ ← Pause project work
    └──────┬──────┘
           │
        (resume)
           ↓
    ┌─────────────┐
    │  completed  │ ← All tasks done
    └──────┬──────┘
           │
        (archive)
           ↓
    ┌─────────────┐
    │  archived   │ ← Read-only, historical
    └─────────────┘
```

### 4.2 Project Lifecycle Rules

#### Create Project
- **Who**: Only `manager` role
- **Requirements**:
  - Project name (required, min 3 chars)
  - Description (optional)
  - Start date (required)
  - End date (required, must be > start date)
  - Budget (optional, numeric)
  - Initial team members (optional, can add later)
- **Defaults**:
  - `status = 'active'`
  - `createdBy = current manager`
  - `createdAt = now`
  - `taskIds = []` (empty initially)

#### Add/Remove Team Members
- **Who**: Project owner/manager only
- **Rules**:
  - Can add any user (manager/employee)
  - Can assign different roles within the project
  - Removing member does NOT delete their assigned tasks (reassign manually)
  - Cannot remove the project creator/owner

#### Assign Task to Project
- **Who**: Manager only
- **Rules**:
  - Task must exist in the system
  - One task can belong to ONE project only
  - If task already in project A, moving to project B requires unassign from A first
  - Task status should be independent of project status (can reassign even if project on-hold)

#### Project Completion
- **Auto-check**: System monitors if all project tasks are "done"
- **Manual action**: Manager can manually mark as "completed" even if tasks remain
- **Rule**: Once "completed", cannot add new tasks; can only "resume" or "archive"

#### Archive Project
- **Who**: Manager only
- **Effect**:
  - Project becomes read-only
  - Historical data preserved
  - Can still view tasks and details
  - Cannot add/modify/delete tasks anymore
  - Cannot add/remove team members

### 4.3 Task-Project Relationship Rules

#### When Creating Task
```javascript
// Scenario A: Create task without project
- Create as before (existing behavior)
- projectId = null
- Can be assigned to project later

// Scenario B: Create task with project context
- Open project → "Create Task" button
- Auto-populate projectId = current project
- Same approval workflow as before
```

#### When Moving Task to Another Project
- Unassign from current project
- Assign to new project
- Preserve all task properties (status, subtasks, etc.)

#### When Deleting Project
- **Option 1**: Delete project only, tasks remain unassigned
- **Option 2**: Delete project + prompt to reassign tasks
- **Current Plan**: Option 1 (safer, preserves task history)

---

## V. UI/UX FLOW

### 5.1 Main Navigation Changes

```
Current Menu:              New Menu:
├─ Dashboard              ├─ Dashboard (updated with project stats)
├─ Tasks                  ├─ Projects (NEW)
│  ├─ Task List           │  ├─ Project List
│  ├─ Create Task         │  ├─ Create Project
│  └─ My Tasks            │  └─ [ProjectId] Details
├─ Approvals              ├─ Tasks
└─ Settings               │  ├─ Task List
                          │  ├─ Create Task
                          │  └─ My Tasks
                          ├─ Approvals
                          └─ Settings
```

### 5.2 Project Pages to Create

#### Page 1: Projects List (`/projects`)
- **For**: Managers to see all projects
- **Components**:
  - Search & filter (by status, date, team member)
  - Create Project button
  - Table with columns:
    - Project Name
    - Status (badge: active/on-hold/completed/archived)
    - Start Date - End Date
    - Task Count (e.g., "12 tasks")
    - Completion % (e.g., "8/12 tasks done")
    - Team Size (e.g., "5 members")
    - Actions (View, Edit, Archive)

#### Page 2: Create Project (`/projects/create`)
- **For**: Manager to create new project
- **Form Fields**:
  - Project Name (text, required)
  - Description (textarea, optional)
  - Category (select, optional: web-dev, mobile, design, qa)
  - Start Date (date picker, required)
  - End Date (date picker, required, > start date)
  - Budget (number, optional)
  - Priority (select: high, medium, low)
  - Initial Team Members (multi-select employees)
  - Visibility (select: team/private/public)
- **Actions**:
  - Create Project
  - Cancel

#### Page 3: Project Details (`/projects/:id`)
- **For**: Manager to manage project, employee to see project info
- **Sections**:
  1. **Project Header**
     - Project name, status (editable for manager)
     - Progress bar: X tasks done / Y tasks total
     - Timeline: start date → end date (with today marker)

  2. **Project Tabs**
     - **Overview Tab** (default)
       - Description, Category, Priority
       - Timeline & Budget info
       - Created by, Created date
     
     - **Tasks Tab**
       - Table of all tasks in project
       - Filter: status, assignee
       - Columns: Task ID, Title, Status, Assignee, Due Date, Priority
       - Actions: View task, Remove from project (manager only)
       - Create Task button (manager only)
     
     - **Team Tab**
       - List of team members
       - Columns: Name, Role (in project), Joined Date
       - Add Member button (manager only)
       - Remove Member button (manager only)
     
     - **Progress Tab** (Analytics)
       - Task completion over time (line chart)
       - Tasks by status (pie/bar chart)
       - Task distribution by assignee
       - Overdue tasks alert
       - Team productivity metrics

#### Page 4: Edit Project (`/projects/:id/edit`)
- **For**: Manager to edit project
- **Editable Fields**:
  - Name, Description, Category
  - Start/End dates
  - Budget
  - Priority
  - Status (with workflow: active → on-hold → completed → archived)
  - Visibility
- **Non-editable** (display only):
  - Created by, Created date
  - Tasks (manage via Project Details page)
  - Team members (manage via Project Details page)

---

## VI. DATABASE SCHEMA (db.json structure)

### 6.1 Add Projects Collection

```json
{
  "projects": [
    {
      "id": "proj-20241205-001",
      "name": "Website Redesign 2024",
      "description": "Modernize company website with new design",
      "status": "active",
      "category": "web-development",
      "priority": "high",
      "startDate": "2024-12-01",
      "endDate": "2025-03-31",
      "budget": 50000,
      "visibility": "team",
      "createdBy": "manager1",
      "createdAt": "2024-12-05T10:00:00Z",
      "updatedAt": "2024-12-05T10:00:00Z",
      "taskIds": ["task-001", "task-002", "task-003"],
      "teamMembers": [
        {
          "userId": "emp001",
          "userName": "John",
          "role": "developer",
          "joinedAt": "2024-12-05"
        },
        {
          "userId": "emp002",
          "userName": "Jane",
          "role": "designer",
          "joinedAt": "2024-12-05"
        }
      ]
    }
  ]
}
```

### 6.2 Update Tasks Collection

Add `projectId` field to tasks:

```json
{
  "tasks": [
    {
      "id": "task-001",
      "projectId": "proj-20241205-001",    // ⭐ NEW
      "title": "Design homepage mockup",
      // ... other existing fields
    }
  ]
}
```

---

## VII. SERVICE & API CHANGES

### 7.1 New ProjectService

```javascript
// src/services/ProjectService.js

class ProjectService {
  // Projects CRUD
  getAllProjects()              // GET /projects
  getProjectById(id)            // GET /projects/:id
  createProject(data)           // POST /projects
  updateProject(id, data)       // PUT /projects/:id
  deleteProject(id)             // DELETE /projects/:id
  
  // Team Management
  addTeamMember(projectId, userId, role)      // POST /projects/:id/team
  removeTeamMember(projectId, userId)         // DELETE /projects/:id/team/:userId
  updateTeamMemberRole(projectId, userId, role) // PUT /projects/:id/team/:userId
  
  // Task Management
  assignTaskToProject(projectId, taskId)      // POST /projects/:id/tasks/:taskId
  removeTaskFromProject(projectId, taskId)    // DELETE /projects/:id/tasks/:taskId
  getProjectTasks(projectId)                  // GET /projects/:id/tasks
  
  // Analytics
  getProjectStats(projectId)    // GET /projects/:id/stats (task count, completion %, etc.)
  getProjectTeamStats(projectId) // GET /projects/:id/team-stats (tasks per member, etc.)
}
```

### 7.2 TaskService Updates

Add project-related methods:

```javascript
class TaskService {
  // existing methods...
  
  // NEW methods
  getTasksByProject(projectId)  // Filter tasks by projectId
  updateTaskProject(taskId, projectId) // Associate/move task to project
}
```

---

## VIII. IMPLEMENTATION ROADMAP

### Phase 4A: Backend & Data Setup (Today)
- [ ] Add `projects` collection to db.json with sample data
- [ ] Update `tasks` collection: add `projectId` field to existing tasks
- [ ] Create `ProjectService.js` with all CRUD operations
- [ ] Update `TaskService.js` with project-related methods
- [ ] Test API endpoints with json-server

### Phase 4B: Projects List & Create (Week 1)
- [ ] Create `ProjectListPage.jsx`
- [ ] Create `CreateProjectPage.jsx`
- [ ] Implement filters & search on project list
- [ ] Add project creation form with validation
- [ ] Display project stats (task count, completion %)

### Phase 4C: Project Details & Management (Week 2)
- [ ] Create `ProjectDetailPage.jsx` with tabs:
  - Overview (project info)
  - Tasks (manage project tasks)
  - Team (manage team members)
  - Progress (analytics & charts)
- [ ] Create `EditProjectPage.jsx`
- [ ] Implement team member add/remove
- [ ] Implement task add/remove from project

### Phase 4D: Integration & Analytics (Week 3)
- [ ] Update `DashboardPage.jsx`:
  - Add project cards (active projects count, recently updated)
  - Add project health metrics
  - Add quick access links to top projects
- [ ] Create project analytics (completion trends, team productivity)
- [ ] Update menu navigation

### Phase 4E: Polish & Testing (Week 4)
- [ ] Role-based access control (employees cannot create projects)
- [ ] Permissions enforcement
- [ ] UI/UX refinements
- [ ] Manual testing all workflows
- [ ] Bug fixes & optimization

---

## IX. SAMPLE DATA (db.json)

### 9.1 Sample Projects

```json
{
  "projects": [
    {
      "id": "proj-001",
      "name": "Website Redesign 2024",
      "description": "Complete redesign of company website with modern UI/UX principles",
      "status": "active",
      "category": "web-development",
      "priority": "high",
      "startDate": "2024-12-01",
      "endDate": "2025-03-31",
      "budget": 50000,
      "visibility": "team",
      "createdBy": "manager1",
      "createdAt": "2024-12-05T10:00:00Z",
      "updatedAt": "2024-12-05T10:00:00Z",
      "taskIds": [],
      "teamMembers": [
        {
          "userId": "emp001",
          "userName": "John",
          "role": "developer",
          "joinedAt": "2024-12-05"
        },
        {
          "userId": "emp002",
          "userName": "Jane",
          "role": "designer",
          "joinedAt": "2024-12-05"
        }
      ]
    },
    {
      "id": "proj-002",
      "name": "Mobile App Development",
      "description": "Build iOS/Android mobile app for customer engagement",
      "status": "active",
      "category": "mobile",
      "priority": "high",
      "startDate": "2024-10-01",
      "endDate": "2025-06-30",
      "budget": 80000,
      "visibility": "team",
      "createdBy": "manager1",
      "createdAt": "2024-10-01T09:00:00Z",
      "updatedAt": "2024-12-05T10:00:00Z",
      "taskIds": [],
      "teamMembers": [
        {
          "userId": "emp001",
          "userName": "John",
          "role": "developer",
          "joinedAt": "2024-10-01"
        }
      ]
    }
  ]
}
```

---

## X. POTENTIAL CHALLENGES & SOLUTIONS

| Challenge | Solution |
|-----------|----------|
| Task belongs to multiple projects | One-to-one relationship; must unassign first before assigning to another |
| Deleting project with assigned tasks | Keep tasks, just remove projectId; preserve task history |
| Employee creating task in project | Auto-populate projectId; approval workflow still applies |
| Removed team member has assigned tasks | Reassign manually or leave as-is; don't cascade delete |
| Project budget tracking | Optional feature; can be skipped in Phase 1 if time-constrained |
| Real-time sync of project progress | Use Context API + manual refresh; consider real-time updates later |

---

## XI. SUCCESS CRITERIA

✅ Project CRUD operations work correctly
✅ Tasks can be assigned/unassigned to projects
✅ Team members can be added/removed
✅ Permission checks work (employees cannot create projects)
✅ Project dashboard shows accurate stats
✅ Project list filters work (by status, date, team)
✅ All edge cases handled (delete, archive, etc.)
✅ UI/UX matches design patterns already established

---

## XII. NOTES & CONSIDERATIONS

### Nice-to-Have Features (Phase 2+)
- Project templates (pre-built projects)
- Gantt chart view for timeline
- Budget tracking & alerts
- Automatic project completion when all tasks done
- Project milestones (within project)
- Project dependencies (this project depends on that one)
- Notifications when project status changes

### Technical Debt to Address
- Consider separating ProjectContext from TaskContext
- Plan for real-time updates if project is shared
- Add data validation in ProjectService
- Add error handling & retry logic

---

**Document Version**: 1.0  
**Last Updated**: December 5, 2024  
**Status**: Ready for Review & Approval
