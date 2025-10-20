import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TasksService } from '../api/client';
import { toast } from 'sonner';
import React from 'react';

export function EditTaskPage() {
  const { topicId, taskId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
  });

  useEffect(() => {
    if (taskId && taskId !== 'new') {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId || taskId === 'new') return;
    const task = await TasksService.tasksControllerGetOne(String(taskId));
    setFormData({
      name: task.name,
      description: task.description || '',
      prompt: task.prompt,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (taskId && taskId !== 'new') {
        await TasksService.tasksControllerUpdate(String(taskId), { name: formData.name, description: formData.description, prompt: formData.prompt });
        toast.success('Task updated successfully');
      } else {
        await TasksService.tasksControllerCreate({ name: formData.name, description: formData.description, prompt: formData.prompt });
        toast.success('Task created successfully');
      }
      navigate(`/topics/${topicId}`);
    } catch (error) {
      toast.error('Failed to save task');
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
            {taskId === 'new' ? 'New Analysis Task' : 'Edit Analysis Task'}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Task Configuration</CardTitle>
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
                  placeholder="e.g., Market Sentiment Analysis"
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
                  placeholder="Describe what this task does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">AI Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) =>
                    setFormData({ ...formData, prompt: e.target.value })
                  }
                  placeholder="Enter the prompt template for the AI analysis..."
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This prompt will be used by the AI to analyze the collected
                  documents
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
                  Save Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
