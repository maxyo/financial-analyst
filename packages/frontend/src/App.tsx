import {
  HashRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { TopicDetailPage } from './components/TopicDetailPage';
import { EditProfilePage } from './components/EditProfilePage.tsx';
import { EditScraperPage } from './components/EditScraperPage';
import { EditTaskPage } from './components/EditTaskPage';
import { ViewProfilePage } from './components/ViewProfilePage';
import { ViewScraperPage } from './components/ViewScraperPage';
import { ViewDocumentPage } from './components/ViewDocumentPage';
import { Toaster } from './components/ui/sonner';
import React from 'react';

export default function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/topics" replace />} />
          <Route
            path="topics"
            element={
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a topic to view details
              </div>
            }
          />
          <Route path="topics/:topicId" element={<TopicDetailPage />} />
          <Route
            path="topics/:topicId/profiles/:profileId/view"
            element={<ViewProfilePage />}
          />
          <Route
            path="topics/:topicId/profiles/:profileId/edit"
            element={<EditProfilePage />}
          />
          <Route
            path="topics/:topicId/profiles/new"
            element={<EditProfilePage />}
          />
          <Route
            path="topics/:topicId/scrapers/:scraperId/view"
            element={<ViewScraperPage />}
          />
          <Route
            path="topics/:topicId/scrapers/:scraperId/edit"
            element={<EditScraperPage />}
          />
          <Route
            path="topics/:topicId/scrapers/new"
            element={<EditScraperPage />}
          />
          <Route
            path="topics/:topicId/documents/:documentId/view"
            element={<ViewDocumentPage />}
          />
          <Route
            path="topics/:topicId/tasks/:taskId/edit"
            element={<EditTaskPage />}
          />
          <Route path="topics/:topicId/tasks/new" element={<EditTaskPage />} />
          <Route path="*" element={<Navigate to="/topics" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
