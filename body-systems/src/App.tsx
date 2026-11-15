import { Component, lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ContentProvider } from './data/content';
import { StudyProvider } from './data/study';
import { Layout } from './components/Layout';
import { ErrorState, LoadingState } from './components/States';
import { ExplorePage } from './pages/ExplorePage';
import { JourneyComplete, JourneyPage } from './pages/JourneyPage';
import { ConceptPage, MechanismsPage, SystemPage } from './pages/ConceptPages';
import { LabelingExercisePage, LabelingIndex, QuizPage } from './pages/PracticePages';
import { ReviewPage } from './pages/ReviewPage';
import { MyStudyPage } from './pages/MyStudyPage';
import { AboutPage, NotFound, SourcesPage } from './pages/InfoPages';
import type { ContentRepository } from './content/repository';
import type { StudyRepository } from './study/persistence';

// The experiment pulls in the charting library, so it loads on demand.
const ExperimentPage = lazy(() => import('./pages/ExperimentPage').then((m) => ({ default: m.ExperimentPage })));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <ErrorState
          title="Something went wrong on this page"
          detail="Your study data is saved. Reload to continue."
          onRetry={() => window.location.reload()}
        />
      );
    return this.props.children;
  }
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/explore/body" replace />} />
        <Route path="explore/:diagram/:structureId?" element={<ExplorePage />} />
        <Route path="journey" element={<JourneyPage />} />
        <Route path="journey/complete" element={<JourneyComplete />} />
        <Route path="journey/:stepId" element={<JourneyPage />} />
        <Route path="system/:id" element={<SystemPage />} />
        <Route path="concept/:id" element={<ConceptPage />} />
        <Route path="mechanisms" element={<MechanismsPage />} />
        <Route
          path="experiment"
          element={
            <Suspense fallback={<LoadingState label="Loading the experiment" />}>
              <ExperimentPage />
            </Suspense>
          }
        />
        <Route path="practice" element={<QuizPage />} />
        <Route path="practice/label" element={<LabelingIndex />} />
        <Route path="practice/label/:id" element={<LabelingExercisePage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="study" element={<MyStudyPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export function App({ contentRepo, studyRepo }: { contentRepo?: ContentRepository; studyRepo?: StudyRepository }) {
  return (
    <ErrorBoundary>
      <ContentProvider repository={contentRepo}>
        <StudyProvider repository={studyRepo}>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </StudyProvider>
      </ContentProvider>
    </ErrorBoundary>
  );
}
