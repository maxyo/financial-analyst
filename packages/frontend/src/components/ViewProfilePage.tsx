import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import type {
  ProfileDto_Output,
  ReportDto_Output,
  TaskDtoClass_Output,
} from '../api/client';
import { ProfilesService, ReportsService, TasksService } from '../api/client';
import { toast } from 'sonner';

export function ViewProfilePage() {
  const { topicId, profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileDto_Output | null>(null);
  const [task, setTask] = useState<TaskDtoClass_Output | null>(null);
  const [reports, setReports] = useState<ReportDto_Output[]>([]);

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    if (!profileId) return;
    const profileData = await ProfilesService.profileControllerGetOne(
      String(profileId),
    );
    setProfile(profileData);

    if (profileData.task_id) {
      const taskData = await TasksService.tasksControllerGetOne(
        String(profileData.task_id),
      );
      setTask(taskData);
    }

    const reportsData = await ReportsService.reportControllerList(
      50,
      0,
      Number(profileId),
    );
    setReports(
      reportsData.items.filter((r) => r.profile_id === Number(profileId)),
    );
  };

  const runProfile = async () => {
    if (!profileId) return;
    try {
      await ProfilesService.profileControllerRunAggregate(String(profileId));
      toast.success('Analysis job started successfully');
    } catch (error) {
      toast.error('Failed to start analysis job');
    }
  };

  if (!profile) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-muted/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/topics/${topicId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl">{profile.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runProfile}>
              <Play className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/topics/${topicId}/profiles/${profileId}/edit`)
              }
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Name</div>
                <div>{profile.name}</div>
              </div>

              {profile.description && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Description
                    </div>
                    <div className="text-sm">{profile.description}</div>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Created
                </div>
                <div className="text-sm">
                  {new Date(profile.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Last Updated
                </div>
                <div className="text-sm">
                  {new Date(profile.updated_at).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Task */}
          {task && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assigned Analysis Task</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(`/topics/${topicId}/tasks/${task.id}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Task Name
                  </div>
                  <div>{task.name}</div>
                </div>

                {task.description && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Description
                      </div>
                      <div className="text-sm">{task.description}</div>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    AI Prompt
                  </div>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                    {task.prompt}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No reports generated yet. Run the analysis to create reports.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.type}</Badge>
                          {report.llmModel && (
                            <Badge variant="secondary">{report.llmModel}</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>

                      {report.content && (
                        <div className="bg-muted/50 p-3 rounded text-sm max-h-64 overflow-auto">
                          <pre className="whitespace-pre-wrap">
                            {report.content}
                          </pre>
                        </div>
                      )}

                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div>Tokens In: {report.tokens_in}</div>
                        <div>Tokens Out: {report.tokens_out}</div>
                        <div>Cost: ${report.cost?.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
