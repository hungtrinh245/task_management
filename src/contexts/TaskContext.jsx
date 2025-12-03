// src/contexts/TaskContext.jsx
import { createContext, useContext, useCallback, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const TaskContext = createContext();

const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Hoàn thành bản thiết kế UI",
    director: "UX Team",
    genre: "Design",
    description: "Tạo bản mockup cho trang chính và trang cài đặt.",
    dueDate: "2025-12-10",
    completed: false,
  },
  {
    id: 2,
    title: "Nghiên cứu Custom Hooks",
    director: "Dev Team",
    genre: "Development",
    description: "Đọc tài liệu về useMemo và useCallback.",
    dueDate: "2025-12-05",
    completed: true,
  },
  {
    id: 3,
    title: "Viết tài liệu Giai đoạn 1",
    director: "Documentation",
    genre: "Documentation",
    description: "Tổng hợp các file code đã hoàn thiện CRUD.",
    dueDate: "2025-11-28",
    completed: false,
  },
];

export const useTasks = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  // Sử dụng useLocalStorage hook để lưu tasks vào localStorage
  const [tasks, setTasks] = useLocalStorage("tasks_data", DEFAULT_TASKS);

  // Sử dụng useCallback để memoize các hàm CRUD - tránh tạo function mới mỗi lần render
  const addTask = useCallback(
    (taskData) => {
      const newTask = { id: Date.now(), ...taskData, completed: false };
      setTasks((prevTasks) => [newTask, ...prevTasks]);
    },
    [setTasks]
  );

  const toggleTask = useCallback(
    (id) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    },
    [setTasks]
  );

  const editTask = useCallback(
    (id, updatedData) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, ...updatedData } : task
        )
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    },
    [setTasks]
  );

  const getTaskById = useCallback(
    (id) => {
      return tasks.find((task) => task.id === parseInt(id));
    },
    [tasks]
  );

  // Sử dụng useMemo để memoize value object - tránh tạo object mới mỗi lần render
  const value = useMemo(
    () => ({
      tasks,
      addTask,
      toggleTask,
      editTask,
      deleteTask,
      getTaskById,
    }),
    [tasks, addTask, toggleTask, editTask, deleteTask, getTaskById]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
