import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import type { DocumentDto_Output } from '../api/client';
import { DocumentsService } from '../api/client';

export function ViewDocumentPage() {
  const { topicId, documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentDto_Output | null>(null);

  useEffect(() => {
    loadData();
  }, [documentId]);

  const loadData = async () => {
    if (!documentId) return;
    const doc = await DocumentsService.documentsControllerGetOne(documentId);
    if (doc) setDocument(doc);
  };

  if (!document) {
    return <div className="p-8">Loading...</div>;
  }

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
          <div className="flex-1">
            <h1 className="text-2xl mb-2">{document.title}</h1>
            <div className="flex gap-2">
              <Badge variant="outline">{document.type}</Badge>
              <Badge variant="secondary">{document.scraper.name}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Scraped At
                  </div>
                  <div className="text-sm">
                    {new Date(document.scrapedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Document Date
                  </div>
                  <div className="text-sm">
                    {new Date(document.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Source</div>
                <div className="text-sm">{document.scraper.name}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Content Hash
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {document.contentHash}
                </div>
              </div>

              {Object.keys(document.meta).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Metadata
                    </div>
                    <div className="bg-muted p-3 rounded space-y-1">
                      {Object.entries(document.meta).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Document Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg max-h-[600px] overflow-auto">
                {document.type === 'MD' ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">
                      {document.content}
                    </pre>
                  </div>
                ) : document.type === 'JSON' ? (
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(document.content), null, 2)}
                  </pre>
                ) : (
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {document.content}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
