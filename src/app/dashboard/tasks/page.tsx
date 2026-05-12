'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, CheckCircle2, Calendar, MoreHorizontal, LayoutGrid, List, ArrowRight, XCircle, AlertCircle } from 'lucide-react';
import type { Task } from '@prisma/client';
import { AddTaskModal } from '@/components/modals/AddTaskModal';
import { useRole, roleChecks } from '@/hooks/useCurrentUser';
import { useRefetchOnRoleChange } from '@/hooks/useRefetchOnRoleChange';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskWithRelations extends Task {
  project?: { name: string };
  assignedTo?: { name: string };
}

// Droppable Column Component
function DroppableColumn({ colId, tasks, role, onEdit, onDelete, setModalOpen }: any) {
  const { setNodeRef } = useDroppable({
    id: colId,
  });

  const getStatusConfig = (status: string) => ({
    PENDING: { label: 'To Do', color: 'bg-slate-100', border: 'border-slate-200', icon: Calendar },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50', border: 'border-blue-200', icon: ArrowRight },
    BLOCKED: { label: 'Blocked', color: 'bg-red-50', border: 'border-red-200', icon: XCircle },
    COMPLETED: { label: 'Done', color: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  }[status] || { label: status, color: 'bg-gray-50', border: 'border-gray-200', icon: CheckCircle2 });

  const config = getStatusConfig(colId);
  const Icon = config.icon;

  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <div className={`p-3 rounded-t-xl border-t border-x ${config.border} ${config.color} flex items-center justify-between`}>
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-700">
          <Icon className="h-4 w-4" />
          {config.label}
          <Badge variant="secondary" className="bg-white/50 ml-1">{tasks.length}</Badge>
        </div>
        {colId === 'PENDING' && roleChecks.canEditTasks(role) && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setModalOpen(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div ref={setNodeRef} className={`flex-1 bg-slate-50/50 border-x border-b ${config.border} rounded-b-xl p-3 min-h-[500px]`}>
        <SortableContext
          id={colId}
          items={tasks.map((t: any) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 min-h-[100px]">
            {tasks.map((task: any) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                role={role}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-10 text-slate-300 text-xs">Drop here</div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// Sortable Task Card Component
function SortableTaskCard({ task, role, onEdit, onDelete }: { task: TaskWithRelations, role: string, onEdit: (t: Task) => void, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-white relative group ${isDragging ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {task.project?.name || 'No Project'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 -mt-2 text-slate-300 hover:text-slate-500"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on menu click
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(task.id)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-semibold text-sm text-slate-800 leading-snug">{task.title}</h4>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
              {task.assignedTo?.name?.charAt(0) || '?'}
            </div>
            <span className="text-xs text-slate-500">{formatDate(task.dueDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const role = useRole();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data: TaskWithRelations[] = await res.json();
      data.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useRefetchOnRoleChange(fetchTasks);

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      const res = await fetch(`/api/tasks/${taskToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');
      toast.success('Task deleted successfully');
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
    } catch (err: any) {
      console.error('Delete error:', err?.message || err);
      toast.error(err?.message || 'Failed to delete task');
    }
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      toast.success(`Moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
      fetchTasks(); // Refresh to ensure backend sync
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
      fetchTasks(); // Revert on failure
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overContainer = over.data.current?.sortable?.containerId || over.id; // containerId in sortable data or the id of Droppable column

    if (!activeTask || !overContainer) return;

    // Check if dropped in a different column (status)
    const currentStatus = activeTask.status;
    const newStatus = overContainer as string;

    if (currentStatus !== newStatus) {
      // Prevent unauthorized moves if restricted
      if (role === 'ENGINEER' && newStatus === 'COMPLETED') {
        // Example Restriction
      }
      updateTaskStatus(activeTask.id, newStatus);
    }
  };

  const columns = ['PENDING', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
  const isListView = viewMode === 'list';

  const getTasksByStatus = (status: string) => tasks.filter(task => task.status === status);

  const getStatusConfig = (status: string) => ({
    PENDING: { label: 'To Do', color: 'bg-slate-100', border: 'border-slate-200', icon: Calendar },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50', border: 'border-blue-200', icon: ArrowRight },
    BLOCKED: { label: 'Blocked', color: 'bg-red-50', border: 'border-red-200', icon: XCircle },
    COMPLETED: { label: 'Done', color: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  }[status] || { label: status, color: 'bg-gray-50', border: 'border-gray-200', icon: CheckCircle2 });


  const queryFilter = searchParams.get('q')?.trim().toLowerCase();
  const filteredTasks = tasks.filter(task => {
    const matchesTab = activeTab === "ALL" ? true : task.status === activeTab;
    const haystack = `${task.title} ${task.description || ''} ${task.project?.name || ''} ${task.assignedTo?.name || ''}`.toLowerCase();
    const matchesQuery = queryFilter ? haystack.includes(queryFilter) : true;
    return matchesTab && matchesQuery;
  });
  const formatDate = (date: any) => date ? new Date(date).toLocaleDateString() : 'No date';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BLOCKED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const formatStatus = (s: string) => s.replace(/_/g, ' ');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Tasks"
        description="Manage assignments, track deadlines, and collaborate."
        actionLabel={roleChecks.canEditTasks(role) ? "Add Task" : undefined}
        onActionClick={() => setModalOpen(true)}
      >
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant={isListView ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 px-3 ${isListView ? 'shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('list')}
            aria-pressed={isListView}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={!isListView ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 px-3 ${!isListView ? 'shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode('board')}
            aria-pressed={!isListView}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Board
          </Button>
        </div>
      </PageHeader>

      {isListView ? (
        <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="BLOCKED">Blocked</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No tasks found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map(task => (
                  <Card key={task.id}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className={getStatusColor(task.status)}>{formatStatus(task.status)}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}><Pencil className="h-4 w-4" /></Button>
                      </div>
                      <h3 className="font-bold">{task.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-[1000px]">
              {columns.map((colId) => {
                const colTasks = getTasksByStatus(colId);
                const config = getStatusConfig(colId);
                const Icon = config.icon;

                return (
                  <DroppableColumn
                    key={colId}
                    colId={colId}
                    tasks={getTasksByStatus(colId)}
                    role={role}
                    onEdit={handleEdit}
                    onDelete={(id: string) => { setTaskToDelete(id); setDeleteDialogOpen(true); }}
                    setModalOpen={setModalOpen}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <SortableTaskCard
                task={tasks.find(t => t.id === activeId)!}
                role={role}
                onEdit={() => { }}
                onDelete={() => { }}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AddTaskModal
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setEditTask(null); }}
        onSuccess={fetchTasks}
        editTask={editTask}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
