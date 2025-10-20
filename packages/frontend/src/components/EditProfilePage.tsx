import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { TaskDtoClass_Output } from '../api/client';
import { ProfilesService, TasksService } from '../api/client';
import { toast } from 'sonner';

export function EditProfilePage() {
  const { topicId, profileId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskDtoClass_Output[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    task_id: null as number | null,
  });

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    const tasksRes = await TasksService.tasksControllerList(50);
    setTasks(tasksRes.items);

    if (profileId && profileId !== 'new') {
      const profile = await ProfilesService.profileControllerGetOne(
        String(profileId),
      );
      const taskInfo = await ProfilesService.profileControllerGetTask(
        String(profileId),
      ).catch(() => ({ taskId: null }) as any);
      setFormData({
        name: profile.name,
        description: profile.description || '',
        task_id: (taskInfo as any).taskId ?? null,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (profileId && profileId !== 'new') {
        await ProfilesService.profileControllerUpdate(String(profileId), {
          name: formData.name,
          description: formData.description,
        });
        if (formData.task_id === null) {
          await ProfilesService.profileControllerUnassignTask(
            String(profileId),
          );
        } else if (typeof formData.task_id === 'number') {
          await ProfilesService.profileControllerAssignTask(String(profileId), {
            taskId: formData.task_id,
          });
        }
        toast.success('Profile updated successfully');
      } else {
        const created = await ProfilesService.profileControllerCreate({
          name: formData.name,
          description: formData.description || null,
        });
        if (formData.task_id != null) {
          await ProfilesService.profileControllerAssignTask(
            String(created.id),
            { taskId: formData.task_id },
          );
        }
        toast.success('Profile created successfully');
      }
      navigate(`/topics/${topicId}`);
    } catch (error) {
      toast.error('Failed to save profile');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-muted/10 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/topics/${topicId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl">
            {profileId === 'new' ? 'New AI Profile' : 'Edit AI Profile'}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Tech Sector Analysis"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the purpose of this analysis profile..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task">Assigned Task</Label>
                <Select
                  value={formData.task_id?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      task_id: value === 'none' ? null : Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The AI task that will process data for this profile
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/topics/${topicId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
