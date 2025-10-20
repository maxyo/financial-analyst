import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Brain, Database, Edit, Eye, FileText, Play, Plus } from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { DocumentsService, ProfilesService, ReportsService, ScrapersService, TasksService, TopicsService } from '../api/client';
import type {
  DocumentDto_Output,
  ProfileDto_Output,
  ReportDto_Output,
  ScraperDto_Output,
  TaskDtoClass_Output,
  TopicDtoClass_Output,
} from '../api/client';
import { toast } from 'sonner';
import React from 'react';

export function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<TopicDtoClass_Output | null>(null);
  const [profiles, setProfiles] = useState<ProfileDto_Output[]>([]);
  const [scrapers, setScrapers] = useState<ScraperDto_Output[]>([]);
  const [documents, setDocuments] = useState<DocumentDto_Output[]>([]);
  const [reports, setReports] = useState<ReportDto_Output[]>([]);
  const [tasks, setTasks] = useState<TaskDtoClass_Output[]>([]);

  useEffect(() => {
    if (topicId) {
      loadTopicData(Number(topicId));
    }
  }, [topicId]);

  const loadTopicData = async (id: number) => {
    const [topicData, profilesRes, scrapersRes, documentsRes, reportsRes, tasksRes] = await Promise.all([
      TopicsService.topicsControllerGetOne(String(id)),
      ProfilesService.profileControllerList(50),
      ScrapersService.scrapersControllerList(50),
      DocumentsService.documentsControllerList(50, 0, undefined, undefined, undefined, undefined, undefined),
      ReportsService.reportControllerList(50, 0, id),
      TasksService.tasksControllerList(50),
    ]);

    setTopic(topicData);
    setProfiles(profilesRes.items.filter((p: any) => (p as any).topic_id === id));
    setScrapers(scrapersRes.items);
    setDocuments(documentsRes.items);
    setReports(reportsRes.items);
    setTasks(tasksRes.items);
  };

  const runProfile = async (profileId: number) => {
    try {
      await ProfilesService.profileControllerRunAggregate(String(profileId));
      toast.success('Analysis job started successfully');
    } catch (error) {
      toast.error('Failed to start analysis job');
    }
  };

  const runScraper = async (scraperId: string) => {
    try {
      await ScrapersService.scrapersControllerRun(scraperId);
      toast.success('Scraper job started successfully');
    } catch (error) {
      toast.error('Failed to start scraper job');
    }
  };

  if (!topic) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-muted/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-2">{topic.name}</h1>
            {topic.description && (
              <p className="text-muted-foreground">{topic.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Topic
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Tabs defaultValue="profiles" className="w-full">
            <TabsList>
              <TabsTrigger value="profiles">
                <Brain className="w-4 h-4 mr-2" />
                AI Profiles ({profiles.length})
              </TabsTrigger>
              <TabsTrigger value="scrapers">
                <Database className="w-4 h-4 mr-2" />
                Scrapers ({scrapers.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="w-4 h-4 mr-2" />
                Documents ({documents.length})
              </TabsTrigger>
            </TabsList>

            {/* AI Profiles Tab */}
            <TabsContent value="profiles" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => navigate(`/topics/${topicId}/profiles/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Profile
                </Button>
              </div>

              {profiles.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No AI analysis profiles yet. Create one to start analyzing
                    data.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {profiles.map((profile) => {
                    const profileTask = tasks.find(
                      (t) => t.id === profile.task_id,
                    );

                    return (
                      <Card key={profile.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {profile.name}
                              </CardTitle>
                              {profile.description && (
                                <CardDescription className="mt-1 line-clamp-1">
                                  {profile.description}
                                </CardDescription>
                              )}
                              {profileTask && (
                                <div className="mt-2">
                                  <Badge variant="secondary">
                                    {profileTask.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runProfile(profile.id)}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Run
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(
                                    `/topics/${topicId}/profiles/${profile.id}/view`,
                                  )
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(
                                    `/topics/${topicId}/profiles/${profile.id}/edit`,
                                  )
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Scrapers Tab */}
            <TabsContent value="scrapers" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => navigate(`/topics/${topicId}/scrapers/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Scraper
                </Button>
              </div>

              {scrapers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No scrapers configured yet. Create one to start collecting
                    data.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {scrapers.map((scraper) => (
                    <Card key={scraper.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">
                                {scraper.name}
                              </CardTitle>
                              <Badge variant="secondary">{scraper.type}</Badge>
                            </div>
                            <CardDescription className="mt-1 line-clamp-1">
                              {scraper.config.url}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runScraper(scraper.id)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Run
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/topics/${topicId}/scrapers/${scraper.id}/view`,
                                )
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/topics/${topicId}/scrapers/${scraper.id}/edit`,
                                )
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              {documents.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No documents collected yet. Run a scraper to collect data.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-1">
                              {doc.title}
                            </CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{doc.type}</Badge>
                              <Badge variant="secondary">
                                {doc.scraper.name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(doc.scrapedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/topics/${topicId}/documents/${doc.id}/view`,
                              )
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
