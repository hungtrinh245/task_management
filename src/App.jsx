import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';
import { TaskProvider } from './contexts/TaskContext';
import DashboardPage from './pages/DashboardPage';
import TaskListPage from './pages/TaskListPage'; 
import CreateTaskPage from './pages/CreateTaskPage';
import TaskDetailPage from './pages/TaskDetailPage';
import EditTaskPage from './pages/EditTaskPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <TaskProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} /> 
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/create" element={<CreateTaskPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/tasks/edit/:id" element={<EditTaskPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </TaskProvider>
    </Router>
  );
}

export default App;