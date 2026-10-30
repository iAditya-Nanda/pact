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
  Star,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Sparkles,
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
  const [filter, setFilter] = useState<"all" | "today" | "starred">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDue, setNewDue] = useState("Today, 5:00 PM");
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);

  // Synchronize when initialTasks prop updates
  React.useEffect(() => {
    setEventsSync();
  }, [initialTasks]);

  const setEventsSync = () => {
    setTasks(initialTasks);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      priority: "urgent",
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
    setIsAdding(false);
  };

  const handleLaunchPopout = () => {
    if (typeof window !== "undefined") {
      window.open(
        "https://tasks.google.com",
        "GoogleTasksApp",
        "width=850,height=750,menubar=no,toolbar=no,location=no,status=no"
      );
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const displayedActiveTasks = activeTasks.filter((t) => {
    if (filter === "today") return t.isDueToday;
    if (filter === "starred") return starredIds.has(t.id);
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1c22] text-[#1f1f1f] dark:text-[#e2e2e6] overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#e0e3e7] dark:border-[#34373d] px-4 flex items-center justify-between gap-3 bg-[#f8fafd] dark:bg-[#1f2229] shrink-0">
        <div className="flex items-center gap-2">
          {/* Main Title & List Selector */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-[#16181d] border border-[#e0e3e7] dark:border-[#34373d]">
            <img src="/icons/tasks.svg" alt="Tasks" className="w-4 h-4 object-contain" />
            <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">
              My Tasks
            </span>
            <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded-full bg-[#0b57d0] text-white">
              {activeTasks.length}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#e0e3e7]/50 dark:bg-[#282a2f] text-2xs font-semibold ml-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-white dark:bg-[#1d1f24] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs font-bold"
                  : "text-[#747775] dark:text-[#8e9099]"
              }`}
            >
              All Active
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filter === "today"
                  ? "bg-white dark:bg-[#1d1f24] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs font-bold"
                  : "text-[#747775] dark:text-[#8e9099]"
              }`}
            >
              Due Today ({dueTodayCount})
            </button>
            <button
              onClick={() => setFilter("starred")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filter === "starred"
                  ? "bg-white dark:bg-[#1d1f24] text-[#0b57d0] dark:text-[#a8c7fa] shadow-2xs font-bold"
                  : "text-[#747775] dark:text-[#8e9099]"
              }`}
            >
              Starred ({starredIds.size})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Task</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
              title="Refresh Google Tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          <button
            onClick={handleLaunchPopout}
            className="p-2 rounded-xl text-[#747775] dark:text-[#8e9099] hover:bg-[#e0e3e7]/50 dark:hover:bg-[#282a2f] transition-colors cursor-pointer"
            title="Open in Popout Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Task List View */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full space-y-3">
        {/* Quick Add Task Form */}
        {isAdding ? (
          <form
            onSubmit={handleCreateTask}
            className="p-4 rounded-2xl border-2 border-[#0b57d0]/40 dark:border-[#a8c7fa]/40 bg-white dark:bg-[#1d1f24] shadow-md space-y-3 animate-in fade-in duration-150"
          >
            <input
              type="text"
              autoFocus
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-sm font-bold text-[#1f1f1f] dark:text-white bg-transparent focus:outline-none placeholder-[#747775]"
            />

            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Details / notes"
              className="w-full text-xs text-[#444746] dark:text-[#c4c6cf] bg-transparent focus:outline-none placeholder-[#747775] resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#e0e3e7] dark:border-[#34373d]">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#0b57d0] dark:text-[#a8c7fa]" />
                <input
                  type="text"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  placeholder="Date/Time"
                  className="text-xs bg-[#f0f4f9] dark:bg-[#282a2f] px-2 py-1 rounded-lg border border-[#e0e3e7] dark:border-[#34373d] text-[#1f1f1f] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-xl text-xs font-semibold text-[#747775] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-[#e0e3e7] dark:border-[#34373d] bg-[#f8fafd] dark:bg-[#1f2229] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2f] text-left text-xs font-semibold text-[#0b57d0] dark:text-[#a8c7fa] flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add a task</span>
          </button>
        )}

        {/* Active Tasks Section */}
        <div className="space-y-2">
          {displayedActiveTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#747775] dark:text-[#8e9099]">
              No active tasks matching this view.
            </div>
          ) : (
            displayedActiveTasks.map((task) => {
              const isStarred = starredIds.has(task.id);

              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className="p-3.5 rounded-2xl border border-[#e0e3e7] dark:border-[#34373d] bg-white dark:bg-[#1d1f24] hover:bg-[#f8fafd] dark:hover:bg-[#282a2f] transition-all cursor-pointer shadow-xs flex items-start gap-3 group/task"
                >
                  {/* Google Tasks Round Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTask(task.id);
                    }}
                    className="mt-0.5 text-[#747775] dark:text-[#8e9099] group-hover/task:text-[#0b57d0] dark:group-hover/task:text-[#a8c7fa] transition-colors cursor-pointer"
                  >
                    <Circle className="w-4.5 h-4.5 stroke-[2]" />
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1f1f1f] dark:text-white leading-snug">
                      {task.title}
                    </div>

                    {task.description && (
                      <div className="text-2xs text-[#444746] dark:text-[#c4c6cf] mt-0.5">
                        {task.description}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      {task.dueDate && (
                        <span
                          className={`text-3xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            task.isDueToday
                              ? "bg-[#fff3e0] text-[#e65100] dark:bg-[#4a2800] dark:text-[#ffb77d]"
                              : "bg-[#f0f4f9] text-[#747775] dark:bg-[#282a2f] dark:text-[#8e9099]"
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{task.dueDate}</span>
                        </span>
                      )}

                      {task.priority === "urgent" && (
                        <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#410002] dark:bg-[#93000a] dark:text-[#ffdad6]">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Star & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleStar(task.id, e)}
                      className="p-1 rounded-lg text-[#747775] hover:text-[#f9ab00] transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isStarred ? "fill-[#f9ab00] text-[#f9ab00]" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="p-1 rounded-lg text-[#747775] hover:text-[#ba1a1a] transition-colors cursor-pointer opacity-0 group-hover/task:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Collapsible Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-[#e0e3e7] dark:border-[#34373d]">
            <button
              onClick={() => setIsCompletedOpen(!isCompletedOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#747775] dark:text-[#8e9099] mb-2 cursor-pointer hover:text-[#1f1f1f] dark:hover:text-white"
            >
              {isCompletedOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Completed ({completedTasks.length})</span>
            </button>

            {isCompletedOpen && (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className="p-3 rounded-2xl border border-[#e0e3e7]/50 dark:border-[#34373d]/50 bg-[#f8fafd]/60 dark:bg-[#16181d]/60 opacity-60 hover:opacity-100 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id);
                        }}
                        className="text-[#0b57d0] dark:text-[#a8c7fa] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5 fill-[#0b57d0] text-white dark:fill-[#a8c7fa] dark:text-[#00325b]" />
                      </button>
                      <span className="text-xs line-through text-[#747775] dark:text-[#8e9099] truncate">
                        {task.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="p-1 rounded-lg text-[#747775] hover:text-[#ba1a1a] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
