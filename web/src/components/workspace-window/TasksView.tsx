"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Check,
  Tag,
} from "lucide-react";
import { WorkspaceTask } from "@/lib/workspace-service";

interface TasksViewProps {
  tasks: WorkspaceTask[];
  activeTasksCount: number;
  dueTodayCount: number;
  overdueCount: number;
  userEmail: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAddTask?: (task: { title: string; description?: string; dueDate?: string }) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks: initialTasks,
  activeTasksCount,
  dueTodayCount,
  overdueCount,
  userEmail,
  onRefresh,
  isRefreshing = false,
  onAddTask,
}) => {
  const [tasks, setTasks] = useState<WorkspaceTask[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | "today" | "completed">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDue, setNewDue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Sync state if initial tasks update
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === "completed" ? "pending" : "completed";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: WorkspaceTask = {
      id: `tsk_user_${Date.now()}`,
      title: newTitle.trim(),
      description: newNotes.trim() || undefined,
      dueDate: newDue || "Today, 5:00 PM",
      priority: "high",
      status: "pending",
      isDueToday: true,
      isOverdue: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    if (onAddTask) {
      onAddTask({
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
      });
    }

    setNewTitle("");
    setNewNotes("");
    setNewDue("");
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "completed") return t.status === "completed";
    if (filter === "today") return t.isDueToday && t.status !== "completed";
    return t.status !== "completed";
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0">
        <div className="flex items-center gap-2">
          {/* Filter Pill Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              All Active ({tasks.filter((t) => t.status !== "completed").length})
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === "today"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              Due Today ({tasks.filter((t) => t.isDueToday && t.status !== "completed").length})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === "completed"
                  ? "bg-[#0b57d0] text-white shadow-2xs"
                  : "text-[#747775] dark:text-[#8e9099] hover:text-[#1f1f1f] dark:hover:text-white"
              }`}
            >
              Completed ({tasks.filter((t) => t.status === "completed").length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Refresh Tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <a
            href="https://tasks.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
            title="Open in tasks.google.com"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 bg-[#f8fafd] dark:bg-[#16181d]">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Quick Add Task Form */}
          {isAdding && (
            <form
              onSubmit={handleCreateTask}
              className="p-4 rounded-2xl bg-white dark:bg-[#1f2229] border border-[#0b57d0]/40 dark:border-[#a8c7fa]/40 shadow-xs space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
                  Create Google Task
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-[#747775] hover:text-[#ba1a1a]"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                autoFocus
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title (e.g., Review Q4 distributed token rotation)"
                className="w-full px-3 py-2 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#16181d] text-xs font-semibold text-[#1f1f1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />

              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Details or notes (optional)"
                className="w-full px-3 py-1.5 rounded-xl border border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#16181d] text-xs text-[#1f1f1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0b57d0]"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-[#747775] dark:text-[#8e9099]">
                  <Calendar className="w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    placeholder="Due date (e.g. Today, 5:00 PM)"
                    className="px-2 py-1 rounded-lg border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#16181d] text-2xs text-[#1f1f1f] dark:text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Task Items List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#1f2229] border border-[#e0e3e7] dark:border-[#34373d] text-xs text-[#747775] dark:text-[#8e9099]">
                {filter === "completed"
                  ? "No completed tasks."
                  : filter === "today"
                  ? "No tasks due today. You are all caught up!"
                  : "All tasks completed! Your Google Tasks queue is clean."}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 bg-white dark:bg-[#1f2229] text-left group ${
                      isCompleted
                        ? "opacity-60 border-[#e0e3e7] dark:border-[#34373d]"
                        : "border-[#e0e3e7] dark:border-[#34373d] hover:border-[#0b57d0]/40 dark:hover:border-[#a8c7fa]/40 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-[#0b57d0] dark:text-[#a8c7fa] hover:scale-110 transition-transform cursor-pointer shrink-0"
                        title={isCompleted ? "Mark pending" : "Mark completed"}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#1e8e3e]" />
                        ) : (
                          <Circle className="w-4.5 h-4.5 text-[#747775] hover:text-[#0b57d0]" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-bold ${
                            isCompleted
                              ? "line-through text-[#747775] dark:text-[#8e9099]"
                              : "text-[#1f1f1f] dark:text-white"
                          }`}
                        >
                          {task.title}
                        </div>

                        {task.description && (
                          <p className="text-2xs text-[#747775] dark:text-[#8e9099] mt-0.5 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-3xs text-[#747775] dark:text-[#8e9099]">
                          {task.dueDate && (
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>{task.dueDate}</span>
                            </span>
                          )}
                          {task.priority === "urgent" && (
                            <span className="px-1.5 py-0.2 rounded bg-[#ffdad6] dark:bg-[#93000a] text-[#ba1a1a] dark:text-[#ffb4ab] font-bold">
                              Urgent
                            </span>
                          )}
                          {task.isDueToday && !isCompleted && (
                            <span className="px-1.5 py-0.2 rounded bg-[#feefe3] dark:bg-[#4a2800] text-[#e65100] dark:text-[#ffb77d] font-bold">
                              Due Today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-[#747775] hover:text-[#ba1a1a] dark:text-[#8e9099] dark:hover:text-[#ff897d] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
