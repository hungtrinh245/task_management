# 📋 Task Manager App - Hướng Dẫn API Integration (axios + json-server)

## 🎯 Tổng Quan

Dự án đã được tái cấu trúc để gọi **API thật** thay vì giả lập trên memory/localStorage. Dưới đây là hướng dẫn đầy đủ về kiến trúc, cách hoạt động, và cách sử dụng.

---

## 🏗️ Kiến Trúc Ứng Dụng

```
Frontend (React)
    ↓
TaskContext (State Management)
    ↓
TaskService (API Layer)
    ↓
apiClient (axios instance)
    ↓
JSON-SERVER (Mock Backend)
    ↓
db.json (Database)
```

### Các Tầng (Layers)

| Tầng | File | Mục Đích |
|------|------|---------|
| **UI Components** | `src/pages/*`, `src/components/*` | Hiển thị giao diện, nhận input từ user |
| **State Management** | `src/contexts/TaskContext.jsx` | Quản lý `tasks`, `loading`, `error`, expose CRUD methods |
| **API Service Layer** | `src/services/TaskService.js` | Gói các HTTP calls (GET/POST/PUT/DELETE/PATCH) |
| **HTTP Client** | `src/services/apiClient.js` | Cấu hình axios (baseURL, interceptors, timeout) |
| **Mock Backend** | `db.json` + json-server | Mô phỏng REST API, lưu dữ liệu (thay thế bằng backend thật sau) |

---

## 🔄 Luồng Hoạt Động (Data Flow)

### 1️⃣ Khởi Động Ứng Dụng
```
User truy cập http://localhost:5173
    ↓
App.jsx mount → TaskProvider wrap all children
    ↓
TaskContext useEffect() → gọi fetchTasks()
    ↓
TaskService.getTasks() → apiClient.get('/tasks')
    ↓
axios gửi GET request tới http://localhost:4000/tasks
    ↓
json-server trả dữ liệu từ db.json
    ↓
TaskContext.setTasks(data) → UI render danh sách
```

### 2️⃣ Tạo Task Mới
```
User điền form → click "Tạo Task"
    ↓
CreateTaskPage.handleSubmit() → context.addTask(taskData)
    ↓
TaskService.createTask(taskData)
    ↓
apiClient.post('/tasks', { title, description, ... })
    ↓
json-server thêm entry mới vào db.json (auto ID)
    ↓
Server trả về { id, ...taskData, createdAt, updatedAt }
    ↓
TaskContext.setTasks([newTask, ...prevTasks])
    ↓
UI update, hiện task mới
```

### 3️⃣ Chỉnh Sửa Task
```
User click "Sửa" → EditTaskPage.handleSubmit()
    ↓
context.editTask(id, updates)
    ↓
TaskService.updateTask(id, { title, description, ... })
    ↓
apiClient.put('/tasks/1', { ... })
    ↓
json-server cập nhật entry id=1 trong db.json
    ↓
Server trả về task đã cập nhật
    ↓
TaskContext.setTasks([...updated...])
    ↓
UI render dữ liệu mới
```

### 4️⃣ Toggle Hoàn Thành Task
```
User click checkbox "Hoàn thành"
    ↓
context.toggleTask(id, completed=true)
    ↓
TaskService.toggleTaskCompletion(id, true)
    ↓
apiClient.patch('/tasks/1', { completed: true, updatedAt: ... })
    ↓
json-server cập nhật field completed
    ↓
Server trả về task cập nhật
    ↓
TaskContext.setTasks([...])
    ↓
UI update checkbox state
```

### 5️⃣ Xoá Task
```
User click "Xoá"
    ↓
context.deleteTask(id)
    ↓
TaskService.deleteTask(id)
    ↓
apiClient.delete('/tasks/1')
    ↓
json-server xoá entry id=1 từ db.json
    ↓
Server trả { success: true }
    ↓
TaskContext.setTasks((prev) => prev.filter(t => t.id !== id))
    ↓
UI xoá task từ danh sách
```

---

## 📁 Cấu Trúc File Chính

### 1. `src/services/apiClient.js` — Cấu hình axios

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptors xử lý request/response
// - Tự động thêm Authorization header nếu có token
// - Xử lý lỗi chung (401, 403, 404, 500)
// - Log lỗi ra console

export default apiClient;
```

**Tại sao cần?**
- Tập trung cấu hình axios (baseURL, timeout, headers).
- Dễ thêm token (auth), retry, logging.
- Khi chuyển backend thực, chỉ cần đổi `baseURL` 1 chỗ.

---

### 2. `src/services/TaskService.js` — Lớp API

```javascript
const TaskService = {
  getTasks(params = {}) {
    return apiClient.get('/tasks', { params });
  },
  createTask(taskData) {
    return apiClient.post('/tasks', taskData);
  },
  updateTask(id, updates) {
    return apiClient.put(`/tasks/${id}`, updates);
  },
  deleteTask(id) {
    return apiClient.delete(`/tasks/${id}`);
  },
  toggleTaskCompletion(id, completed) {
    return apiClient.patch(`/tasks/${id}`, { completed });
  },
};
```

**Tại sao cần?**
- Đóng gói các HTTP calls → dễ test, dễ sửa.
- Frontend chỉ gọi `TaskService.createTask()` mà không cần biết chi tiết axios.
- Nếu thay backend, chỉ sửa file này.

---

### 3. `src/contexts/TaskContext.jsx` — State Management

```javascript
export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks(); // Fetch dữ liệu khi mount
  }, [fetchTasks]);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await TaskService.getTasks(params);
      setTasks(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback(async (taskData) => {
    setLoading(true);
    try {
      const newTask = await TaskService.createTask(taskData);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ... editTask, deleteTask, toggleTask ...

  const contextValue = useMemo(
    () => ({ tasks, loading, error, fetchTasks, addTask, editTask, deleteTask, toggleTask }),
    [tasks, loading, error, ...]
  );

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks phải dùng trong TaskProvider');
  return context;
};
```

**Tại sao cần?**
- Centralized state: `tasks`, `loading`, `error` được quản lý chung.
- CRUD methods (`addTask`, `editTask`, etc.) được expose cho UI.
- Loading & error handling: UI có thể hiển thị loading spinner, error message.
- Avoid prop drilling: bất kỳ component con nào cũng dùng `useTasks()` hook.

---

### 4. `.env.development` — Biến Môi Trường

```
VITE_API_URL=http://localhost:4000
```

**Tại sao cần?**
- Cấu hình API URL riêng cho dev, staging, production.
- Trong `apiClient.js`: `baseURL: import.meta.env.VITE_API_URL`
- Khi deploy: `.env.production` có `VITE_API_URL=https://api.example.com`

---

### 5. `db.json` — Mock Database (json-server)

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Learn React Context",
      "description": "...",
      "completed": false,
      "status": "inprogress",
      "createdAt": "2025-12-01T10:00:00Z",
      "updatedAt": "2025-12-01T10:00:00Z",
      "dueDate": "2025-12-15T00:00:00Z"
    },
    ...
  ]
}
```

**Tại sao cần?**
- json-server tự động tạo REST API từ file JSON này.
- CRUD thực tế: GET/POST/PUT/DELETE → file db.json được cập nhật.
- Khi chuyển backend thật, xoá json-server, thay `VITE_API_URL` vào backend thực.

---

## 🚀 Chạy Dự Án

### Bước 1: Chạy json-server (Mock API)
```powershell
cd "d:\practice react\task-manager-app"
npx json-server --watch db.json --port 4000
```

Kết quả: `http://localhost:4000/tasks` sẽ phục vụ CRUD

### Bước 2: Chạy Vite dev server
```powershell
cd "d:\practice react\task-manager-app"
npm run dev
```

Kết quả: `http://localhost:5173` sẽ mở React app

### Bước 3: Truy cập và test
- Mở http://localhost:5173
- Tạo, sửa, xoá, toggle tasks
- Kiểm tra db.json hoặc http://localhost:4000/tasks để xem dữ liệu đã lưu

---

## 🔄 Chuyển Đổi Sang Backend Thật (Sau Này)

Khi bạn có backend REST API thật (Node.js, Django, Spring, etc.), chỉ cần:

### 1. Cập nhật `.env.production`
```
VITE_API_URL=https://api.example.com
```

### 2. Sửa `src/services/apiClient.js` (nếu cần auth)
```javascript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Backend cần cung cấp endpoints:
- `GET /tasks?search=&status=&page=&limit=` — Lấy danh sách
- `GET /tasks/:id` — Lấy chi tiết
- `POST /tasks` — Tạo mới
- `PUT /tasks/:id` — Cập nhật
- `DELETE /tasks/:id` — Xoá
- `PATCH /tasks/:id` — Toggle hoặc cập nhật field riêng

### 4. Response format:
```json
{
  "id": 1,
  "title": "...",
  "description": "...",
  "completed": false,
  "status": "todo|inprogress|done",
  "createdAt": "2025-12-01T...",
  "updatedAt": "2025-12-01T...",
  "dueDate": "2025-12-15T..."
}
```

---

## 🧪 Kiểm Thử Thủ Công

### Tạo Task
1. Mở http://localhost:5173
2. Nhấn "Tạo Task Mới"
3. Điền title, description, status, dueDate
4. Nhấn "Tạo"
5. Kiểm tra: Task hiện lên trong danh sách
6. Mở http://localhost:4000/tasks → Thấy task mới trong JSON

### Chỉnh Sửa Task
1. Click "Sửa" trên task
2. Thay đổi title/description
3. Nhấn "Lưu"
4. Kiểm tra: UI update, db.json cập nhật

### Toggle Hoàn Thành
1. Click checkbox trên task
2. Kiểm tra: `completed: true` trong db.json

### Xoá Task
1. Click "Xoá" trên task
2. Xác nhận
3. Kiểm tra: Task xoá khỏi danh sách, db.json cập nhật

### Tìm Kiếm & Lọc
1. Nhập text tìm kiếm → Lọc task theo title
2. Chọn status (todo/inprogress/done) → Lọc theo status
3. Lưu ý: `TaskListPage` xử lý filter/search ở **frontend** (nếu muốn server filter, sửa `TaskService.getTasks(params)` để gửi params)

---

## 📊 Sơ Đồ Lifecycle

```
App.jsx
  ↓
[TaskProvider]
  ├─ TaskContext.fetchTasks() on mount
  │   ↓
  │   TaskService.getTasks()
  │   ↓
  │   apiClient.get('/tasks')
  │   ↓
  │   json-server response
  │   ↓
  │   setTasks(data)
  │
  ├─ [UI Components sử dụng useTasks()]
  │   ├─ TaskListPage
  │   │   ├─ Hiển thị danh sách (tasks)
  │   │   ├─ Search input → filter client-side
  │   │   ├─ Status dropdown → filter client-side
  │   │   ├─ Pagination
  │   │   └─ Toggle checkbox → context.toggleTask()
  │   │
  │   ├─ CreateTaskPage
  │   │   └─ Form → context.addTask()
  │   │
  │   ├─ EditTaskPage
  │   │   └─ Form → context.editTask()
  │   │
  │   ├─ TaskDetailPage
  │   │   └─ Hiển thị chi tiết + Delete button
  │   │
  │   └─ DashboardPage
  │       └─ Overview stats
  │
  └─ [Loading/Error States]
      ├─ context.loading → Spinner
      └─ context.error → Error message
```

---

## ⚙️ Điều Chỉnh & Optimize

### 1. Debounce Search (Tránh spam API request)
```javascript
// Trong TaskListPage.jsx
const handleSearch = useCallback(
  debounce((value) => {
    // Gọi fetchTasks(params) với search
  }, 500),
  []
);
```

### 2. Server-Side Search/Filter
```javascript
// Sửa TaskService.getTasks() để gửi params
const getTasks = (params) => {
  return apiClient.get('/tasks', { params }); // ?search=x&status=y
};

// Backend xử lý filter, return filtered list
```

### 3. Pagination Server-Side
```javascript
// Backend return { data: [...], meta: { total, page, limit, totalPages } }
// TaskListPage xử lý pagination thay vì client-side slice

const fetchPage = (page, limit) => {
  return fetchTasks({ page, limit });
};
```

### 4. Error Handling Chi Tiết
```javascript
const handleError = (error) => {
  if (error.response?.status === 401) {
    // Token hết hạn → refresh token
  } else if (error.response?.status === 403) {
    // Không quyền → hiện thông báo
  } else if (error.response?.status === 404) {
    // Resource không tìm thấy
  } else {
    // Server error (500+)
  }
};
```

---

## 📝 Tóm Lại

✅ **Kiến trúc Clean:**
- `apiClient.js` → Cấu hình axios
- `TaskService.js` → Gói HTTP calls
- `TaskContext.jsx` → State management + CRUD
- `db.json + json-server` → Mock backend
- `UI Components` → Gọi `useTasks()` hook

✅ **Luồng hoạt động:**
- User action → Component → Context CRUD method → TaskService → apiClient → json-server → db.json → Response → setTasks → Re-render UI

✅ **Dễ mở rộng:**
- Đổi `VITE_API_URL` + backend thật → ứng dụng vẫn hoạt động.
- Thêm auth (interceptor) → không cần sửa component.
- Thêm retry/timeout → chỉ sửa `apiClient.js`.

✅ **Production-ready:**
- Tách concerns (UI, logic, API).
- Xử lý loading, error states.
- Cấu hình biến môi trường (dev/prod).

---

**Bây giờ bạn có thể chạy dự án, test CRUD, và sau đó chuyển sang backend thật mà không cần sửa gì lớn! 🎉**
