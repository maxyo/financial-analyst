import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Folder, FolderOpen, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.tsx';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { TopicDtoClass_Output } from '../api/client';
import { TopicsService } from '../api/client';

export function TopicsSidebar() {
  const [topics, setTopics] = useState<TopicDtoClass_Output[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    const res = await TopicsService.topicsControllerList(50);
    setTopics(res.items);
  };

  const toggleTopic = (id: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTopics(newExpanded);
  };

  const renderTopic = (topic: TopicDtoClass_Output, level: number = 0) => {
    const hasChildren = topics.some((t) => t.parent_id === topic.id);
    const isExpanded = expandedTopics.has(topic.id);
    const isSelected = topicId === String(topic.id);
    const children = topics.filter((t) => t.parent_id === topic.id);

    return (
      <div key={topic.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent rounded-md transition-colors ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => navigate(`/topics/${topic.id}`)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTopic(topic.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Folder className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="flex-1 truncate text-sm">{topic.name}</span>
        </div>
        {isExpanded && children.map((child) => renderTopic(child, level + 1))}
      </div>
    );
  };

  const rootTopics = topics.filter((t) => !t.parent_id);

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div className="p-3 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => {
            setNewTopicName('');
            setError(null);
            setIsOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          New Topic
        </Button>
      </div>

      <Dialog
        open={isOpen}
        modal={true}
        onOpenChange={(open: boolean) => {
          setIsOpen(open);
          if (!open) {
            setSaving(false);
            setError(null);
          }
        }}
      >
        <DialogTrigger />
        <DialogContent>
          <DialogTitle>New Topic</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Name</Label>
              <Input
                id="topic-name"
                placeholder="Enter topic name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                autoFocus
              />
            </div>
            {error ? (
              <div className="text-destructive text-sm" role="alert">
                {error}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newTopicName.trim()) {
                  setError('Name is required');
                  return;
                }
                setSaving(true);
                setError(null);
                try {
                  const created = await TopicsService.topicsControllerCreate({
                    name: newTopicName.trim(),
                  });
                  // Refresh list and navigate to the new topic
                  await loadTopics();
                  setIsOpen(false);
                  setNewTopicName('');
                  navigate(`/topics/${created.id}`);
                } catch (e: any) {
                  setError(e?.message || 'Failed to create topic');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
          <DialogClose />
        </DialogContent>
      </Dialog>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {rootTopics.map((topic) => renderTopic(topic))}
        </div>
      </ScrollArea>
    </div>
  );
}
