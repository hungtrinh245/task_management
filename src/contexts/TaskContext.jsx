// src/contexts/TaskContext.jsx
import { createContext, useState, useContext } from 'react';

const TaskContext = createContext();

export const useTasks = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([
    // Dữ liệu khởi tạo (Tạm thời, sẽ dùng Local Storage sau)
    { id: 1, title: 'Hoàn thành bản thiết kế UI', director: 'UX Team', genre: 'Design', description: 'Tạo bản mockup cho trang chính và trang cài đặt.', dueDate: '2025-12-10', completed: false },
    { id: 2, title: 'Nghiên cứu Custom Hooks', director: 'Dev Team', genre: 'Development', description: 'Đọc tài liệu về useMemo và useCallback.', dueDate: '2025-12-05', completed: true },
    { id: 3, title: 'Viết tài liệu Giai đoạn 1', director: 'Documentation', genre: 'Documentation', description: 'Tổng hợp các file code đã hoàn thiện CRUD.', dueDate: '2025-11-28', completed: false },
  ]);

  // CRUD Functions
  const addTask = (taskData) => {
    const newTask = { id: Date.now(), ...taskData, completed: false };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const editTask = (id, updatedData) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updatedData } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getTaskById = (id) => {
    return tasks.find(task => task.id === parseInt(id));
  };

  const value = {
    tasks,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    getTaskById,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};