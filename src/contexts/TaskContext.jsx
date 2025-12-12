import React, { useState, useCallback, useMemo, useEffect } from "react";
import TaskService from "../services/TaskService";
import { TaskContext } from "./TaskContextDefinition";

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy danh sách tasks từ server
   */
  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await TaskService.getTasks(params);
      const taskList = Array.isArray(response) ? response : response.data || [];
      setTasks(taskList);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi khi tải tasks";
      setError(errorMsg);
      console.error("fetchTasks error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Thêm task mới
   */
  const addTask = useCallback(async (taskData) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await TaskService.createTask(taskData);
      setTasks((prevTasks) => [...prevTasks, newTask]);
      return newTask;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi khi tạo task";
      setError(errorMsg);
      console.error("addTask error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật task
   */
  const editTask = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTask = await TaskService.updateTask(id, updates);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi khi cập nhật task";
      setError(errorMsg);
      console.error("editTask error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xoá task
   */
  const deleteTask = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await TaskService.deleteTask(id);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi khi xoá task";
      setError(errorMsg);
      console.error("deleteTask error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle trạng thái hoàn thành của task
   */
  const toggleTask = useCallback(
    async (id, completed) => {
      setLoading(true);
      setError(null);
      try {
        // Check if trying to mark as completed but not all subtasks are done
        if (completed) {
          const task = tasks.find((t) => String(t.id) === String(id));
          if (task && task.subtasks && task.subtasks.length > 0) {
            const allSubtasksCompleted = task.subtasks.every(
              (subtask) => subtask.completed
            );
            if (!allSubtasksCompleted) {
              throw new Error(
                "Cannot mark task as completed until all subtasks are finished"
              );
            }
          }
        }

        const updatedTask = await TaskService.toggleTaskCompletion(
          id,
          completed
        );

        // Nếu tất cả subtasks đã completed và task chưa có status phù hợp,
        // tự động chuyển status sang 'review' (nghiệp vụ hợp lý sau khi hoàn thành checklist).
        const allSubtasksDone =
          updatedTask?.subtasks &&
          updatedTask.subtasks.length > 0 &&
          updatedTask.subtasks.every((s) => s.completed);

        let finalTask = updatedTask;
        if (allSubtasksDone) {
          finalTask = await TaskService.updateTask(id, {
            ...updatedTask,
            status: "review",
          });
        }

        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === id ? finalTask : task))
        );
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || "Lỗi khi toggle task";
        setError(errorMsg);
        console.error("toggleTask error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tasks]
  );

  /**
   * Lấy task từ state dựa trên ID (synchronous - từ state đã load)
   */
  const getTaskById = useCallback(
    (id) => {
      const taskId = String(id); // Chuyển về string để so sánh
      return tasks.find((task) => String(task.id) === taskId);
    },
    [tasks]
  );

  /**
   * Fetch task từ API (async - dùng khi cần đồng bộ)
   */
  const fetchTaskById = useCallback(async (id) => {
    try {
      const task = await TaskService.getTaskById(id);
      return task;
    } catch (err) {
      console.error("fetchTaskById error:", err);
      throw err;
    }
  }, []);

  // Memoize context value để tránh re-render không cần thiết
  const contextValue = useMemo(
    () => ({
      tasks,
      loading,
      error,
      fetchTasks,
      addTask,
      editTask,
      deleteTask,
      toggleTask,
      getTaskById,
      fetchTaskById,
    }),
    [
      tasks,
      loading,
      error,
      fetchTasks,
      addTask,
      editTask,
      deleteTask,
      toggleTask,
      getTaskById,
      fetchTaskById,
    ]
  );

  // Fetch danh sách tasks từ API khi component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
};
