import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import type { DocumentDto_Output, ScraperDto_Output } from '../api/client';
import { DocumentsService, ScrapersService } from '../api/client';
import { toast } from 'sonner';

export function ViewScraperPage() {
  const { topicId, scraperId } = useParams();
  const navigate = useNavigate();
  const [scraper, setScraper] = useState<ScraperDto_Output | null>(null);
  const [documents, setDocuments] = useState<DocumentDto_Output[]>([]);

  useEffect(() => {
    loadData();
  }, [scraperId]);

  const loadData = async () => {
    if (!scraperId) return;
    const scraperData =
      await ScrapersService.scrapersControllerGetOne(scraperId);
    setScraper(scraperData);

    const documentsData = await DocumentsService.documentsControllerList(
      50,
      0,
      undefined,
      undefined,
      scraperId,
    );
    setDocuments(documentsData.items);
  };

  const runScraper = async () => {
    if (!scraperId) return;
    try {
      await ScrapersService.scrapersControllerRun(scraperId);
      toast.success('Scraper job started successfully');
    } catch (error) {
      toast.error('Failed to start scraper job');
    }
  };

  if (!scraper) {
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl">{scraper.data.name}</h1>
              <Badge variant="secondary">{scraper.data.type}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runScraper}>
              <Play className="w-4 h-4 mr-2" />
              Run Scraper
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/topics/${topicId}/scrapers/${scraperId}/edit`)
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
          {/* Scraper Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">URL</div>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {scraper.data.config.url}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Type</div>
                <div>{scraper.data.type}</div>
              </div>

              {scraper.data.type === 'HTML' && scraper.data.config.selectors && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      CSS Selectors
                    </div>
                    <div className="space-y-2">
                      {scraper.data.config.selectors.map((selector, idx) => (
                        <div
                          key={idx}
                          className="bg-muted p-3 rounded space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{selector.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {selector.attr || 'text'}
                            </Badge>
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {selector.selector}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {scraper.data.config.timeoutMs && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Timeout
                    </div>
                    <div>{scraper.data.config.timeoutMs}ms</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Collected Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Collected Documents ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No documents collected yet. Run the scraper to collect data.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/topics/${topicId}/documents/${doc.id}/view`)
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm mb-1">{doc.title}</div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {doc.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.scrapedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {doc.content}
                      </p>
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
