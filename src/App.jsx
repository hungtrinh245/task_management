import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import { TaskProvider } from "./contexts/TaskContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardPage from "./pages/DashboardPage";
import TaskListPage from "./pages/TaskListPage";
import MyTasksPage from "./pages/MyTasksPage";
import ApprovalPage from "./pages/ApprovalPage";
import CreateTaskPage from "./pages/CreateTaskPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import EditTaskPage from "./pages/EditTaskPage";
import NotFound from "./pages/NotFound";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import ProfilePage from "./pages/ProfilePage";
import ProjectListPage from "./pages/ProjectListPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import EditProjectPage from "./pages/EditProjectPage";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <TaskProvider>
          <MainLayout>
            <Routes>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }   
              />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <ProjectListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/create"
                element={
                  <PrivateRoute>
                    <CreateProjectPage />
                  </PrivateRoute>
                }
              />
               <Route
                path="/projects/edit/:id"
                element={
                  <PrivateRoute>
                    <EditProjectPage />
                  </PrivateRoute>
                }
              />
               <Route
                path="/projects/:id"
                element={
                  <PrivateRoute>
                    <ProjectDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <PrivateRoute>
                    <TaskListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-tasks"
                element={
                  <PrivateRoute>
                    <MyTasksPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/approvals"
                element={
                  <PrivateRoute>
                    <ApprovalPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/create"
                element={
                  <PrivateRoute>
                    <CreateTaskPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <PrivateRoute>
                    <TaskDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/edit/:id"
                element={
                  <PrivateRoute>
                    <EditTaskPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/auth/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </TaskProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
