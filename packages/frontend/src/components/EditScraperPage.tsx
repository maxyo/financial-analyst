import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { ScrapersService } from '../api/client';
import { toast } from 'sonner';

export function EditScraperPage() {
  const { topicId, scraperId } = useParams();
  const navigate = useNavigate();
  const [scraperType, setScraperType] = useState<'HTML' | 'API'>('HTML');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    selectors: [{ name: '', selector: '', attr: '', asHtml: false }] as Array<{
      name: string;
      selector: string;
      attr?: string;
      asHtml?: boolean;
    }>,
  });

  useEffect(() => {
    if (scraperId && scraperId !== 'new') {
      loadScraper();
    }
  }, [scraperId]);

  const loadScraper = async () => {
    if (!scraperId || scraperId === 'new') return;
    const scraper = await ScrapersService.scrapersControllerGetOne(scraperId);
    setScraperType(scraper.data.type);
    setFormData({
      name: scraper.data.name,
      url: scraper.data.config.url,
      selectors:
        scraper.data.type === 'HTML' && scraper.data.config.selectors
          ? scraper.data.config.selectors
          : [{ name: '', selector: '', attr: '', asHtml: false }],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        type: scraperType,
        config: {
          url: formData.url,
          ...(scraperType === 'HTML' && {
            selectors: formData.selectors.filter((s) => s.name && s.selector),
            headers: {},
            timeoutMs: 30000,
          }),
        },
        topicId: Number(topicId),
      };

      if (scraperId && scraperId !== 'new') {
        await ScrapersService.scrapersControllerUpdate(scraperId, { data });
        toast.success('Scraper updated successfully');
      } else {
        await ScrapersService.scrapersControllerCreate({ data });
        toast.success('Scraper created successfully');
      }
      navigate(`/topics/${topicId}`);
    } catch (error) {
      toast.error('Failed to save scraper');
    }
  };

  const addSelector = () => {
    setFormData({
      ...formData,
      selectors: [
        ...formData.selectors,
        { name: '', selector: '', attr: '', asHtml: false },
      ],
    });
  };

  const removeSelector = (index: number) => {
    setFormData({
      ...formData,
      selectors: formData.selectors.filter((_, i) => i !== index),
    });
  };

  const updateSelector = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const newSelectors = [...formData.selectors];
    newSelectors[index] = { ...newSelectors[index], [field]: value };
    setFormData({ ...formData, selectors: newSelectors });
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
            {scraperId === 'new' ? 'New Scraper' : 'Edit Scraper'}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Scraper Configuration</CardTitle>
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
                  placeholder="e.g., Financial News Scraper"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Scraper Type</Label>
                <Select
                  value={scraperType}
                  onValueChange={(value: 'HTML' | 'API') =>
                    setScraperType(value)
                  }
                  disabled={scraperId !== 'new'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTML">HTML Scraper</SelectItem>
                    <SelectItem value="API">API Scraper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com/api/data"
                  required
                />
              </div>

              {scraperType === 'HTML' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>CSS Selectors</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSelector}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Selector
                      </Button>
                    </div>

                    {formData.selectors.map((selector, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <div className="flex-1 space-y-2">
                                <Label htmlFor={`selector-name-${index}`}>
                                  Field Name
                                </Label>
                                <Input
                                  id={`selector-name-${index}`}
                                  value={selector.name}
                                  onChange={(e) =>
                                    updateSelector(
                                      index,
                                      'name',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., title"
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <Label htmlFor={`selector-css-${index}`}>
                                  CSS Selector
                                </Label>
                                <Input
                                  id={`selector-css-${index}`}
                                  value={selector.selector}
                                  onChange={(e) =>
                                    updateSelector(
                                      index,
                                      'selector',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., .article-title"
                                  className="font-mono text-sm"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSelector(index)}
                                className="mt-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

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
                  Save Scraper
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
