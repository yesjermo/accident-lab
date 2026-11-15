/**
 * Integration tests: the main learning journey, quiz scoring, labeling with
 * the keyboard alternative, review scheduling, and persistence across reloads.
 */
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { LocalStorageStudyRepository, MemoryStudyRepository } from './study/persistence';
import { OXYGEN_JOURNEY } from './content/lesson';
import { QUESTIONS } from './content/questions';
import { scoreQuiz, gradeLabeling } from './study/grading';

// Recharts' ResponsiveContainer needs ResizeObserver.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

function go(hash: string) {
  window.location.hash = hash;
}

beforeEach(() => {
  window.localStorage.clear();
  go('#/');
});
afterEach(cleanup);

const answer = async (user: ReturnType<typeof userEvent.setup>, form: HTMLElement, text: RegExp | string) => {
  await user.click(within(form).getByLabelText(text));
  await user.click(within(form).getByRole('button', { name: 'Check answer' }));
};

describe('acceptance: select the heart and move to biology and chemistry', () => {
  it('opens the heart from the body overview, keeps it selected across tabs, and links to a mechanism with a way back', async () => {
    const user = userEvent.setup();
    go('#/explore/body');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    const region = () => document.querySelector('svg [data-structure="heart"]') as HTMLElement;
    await screen.findAllByRole('button', { name: 'Heart' });
    await user.click(region());
    expect(await screen.findByRole('heading', { level: 2, name: 'Heart' })).toBeInTheDocument();
    expect(region()).toHaveAttribute('aria-pressed', 'true');
    expect(region()).toHaveClass('is-selected');

    await user.click(screen.getByRole('tab', { name: 'Physiology' }));
    expect(screen.getByRole('tab', { name: 'Physiology' })).toHaveAttribute('aria-selected', 'true');
    expect(region()).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('link', { name: /Pulmonary and systemic circuits/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pulmonary and systemic circuits' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Back to Heart/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Heart' })).toBeInTheDocument();
  });

  it('reaches chemistry from a structure (mitochondrion → complex IV) and the Why explainer reveals layers', async () => {
    const user = userEvent.setup();
    go('#/explore/tissue/mitochondrion?tab=chemistry');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    expect(await screen.findByText(/cytochrome c oxidase/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Mitochondria, ATP and cellular respiration/ }));
    expect(await screen.findByText(/Layer 1 of 3/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Go deeper/ }));
    await user.click(screen.getByRole('button', { name: /Go deeper/ }));
    expect(screen.getByText(/Layer 3 of 3/)).toBeInTheDocument();
    expect(screen.getByText('What this explanation simplifies')).toBeInTheDocument();
    expect(screen.getByText(/Limits of this model/)).toBeInTheDocument();
  });
});

describe('acceptance: complete the oxygen journey', () => {
  it('walks all seven steps, records completion, and does not mark objectives as demonstrated', async () => {
    const user = userEvent.setup();
    go('#/journey');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    await user.click(await screen.findByRole('link', { name: 'Start the journey' }));
    for (let i = 0; i < OXYGEN_JOURNEY.steps.length; i++) {
      const step = OXYGEN_JOURNEY.steps[i];
      expect(await screen.findByRole('heading', { level: 1, name: step.title })).toBeInTheDocument();
      // diagram is synchronised: the step's highlighted structures are announced as highlighted
      const first = step.view.highlight[0];
      expect(document.querySelector(`[data-structure="${first}"]`)).toHaveClass('is-highlighted');
      const last = i === OXYGEN_JOURNEY.steps.length - 1;
      await user.click(screen.getByRole('button', { name: last ? 'Complete the journey' : /Mark step done/ }));
    }
    expect(await screen.findByRole('heading', { name: 'Journey completed' })).toBeInTheDocument();
    expect(screen.getByText(/0 of 7/)).toBeInTheDocument(); // demonstrated objectives: none yet
  });

  it('medical level adds marked paragraphs', async () => {
    const user = userEvent.setup();
    go('#/journey/s3-hemoglobin');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    await screen.findByRole('heading', { level: 1, name: 'Boarding hemoglobin' });
    expect(screen.queryByText(/P50 is ~27 mmHg/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Medical student' }));
    expect(screen.getByText(/P50 is ~27 mmHg/)).toBeInTheDocument();
  });
});

describe('quiz scoring', () => {
  it('counts only the first answer to each question', () => {
    expect(
      scoreQuiz([
        { questionId: 'a', correct: false },
        { questionId: 'a', correct: true },
        { questionId: 'b', correct: true },
      ]),
    ).toEqual({ correct: 1, answered: 2, percent: 50 });
    expect(scoreQuiz([])).toEqual({ correct: 0, answered: 0, percent: 0 });
  });

  it('scores in the UI, explains wrong answers and sends them to the review queue', async () => {
    const user = userEvent.setup();
    go('#/practice');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    const items = await screen.findAllByRole('listitem');
    const forms = items.map((li) => li.querySelector('form')).filter(Boolean) as HTMLElement[];
    expect(forms).toHaveLength(QUESTIONS.length);
    await answer(user, forms[0], /falls below atmospheric/); // q-boyle correct
    await answer(user, forms[1], 'Trachea'); // q-conducting wrong
    expect(within(forms[1]).getByText(/conducting zone: it carries/)).toBeInTheDocument();
    expect(screen.getByText(/Score this session:/).textContent).toMatch(/1 of 2 answered correctly/);
    await user.click(screen.getByRole('link', { name: /Review queue/ }));
    expect(await screen.findByText('Which part of the airway exchanges gas with blood?')).toBeInTheDocument();
  });
});

describe('labeling', () => {
  it('grades placements', () => {
    const targets = [
      { structureId: 'a', marker: 1 },
      { structureId: 'b', marker: 2 },
    ];
    const g = gradeLabeling(targets, { a: 'a', b: 'a' });
    expect(g.correct).toBe(1);
    expect(g.missedStructureIds).toEqual(['b']);
  });

  it('can be completed entirely with the keyboard-accessible selects', async () => {
    const user = userEvent.setup();
    go('#/practice/label/lab-heart');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    const pairs: [number, string][] = [
      [1, 'Right atrium'],
      [2, 'Right ventricle'],
      [3, 'Left atrium'],
      [4, 'Left ventricle'],
      [5, 'Mitral (bicuspid) valve'],
      [6, 'Aorta'],
    ];
    for (const [m, label] of pairs) {
      await user.selectOptions(await screen.findByRole('combobox', { name: `Marker ${m}` }), label);
    }
    await user.click(screen.getByRole('button', { name: 'Check labels' }));
    expect(screen.getByText('6 of 6 correct.')).toBeInTheDocument();
  });
});

describe('notes, bookmarks, flashcards and persistence across reload', () => {
  it('keeps a note, bookmark, card review and level after the app is reloaded', async () => {
    const user = userEvent.setup();
    const repo = () => new LocalStorageStudyRepository(window.localStorage);
    go('#/explore/body/lungs?tab=study');
    const { unmount } = render(<App studyRepo={repo()} />);
    await user.click(await screen.findByRole('button', { name: /Bookmark/ }));
    await user.type(screen.getByLabelText(/My note on Lungs/), 'Right 3 lobes, left 2');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await user.click(screen.getByRole('radio', { name: 'Medical student' }));
    await waitFor(() => expect(window.localStorage.getItem('body-systems-explorer:study')).toContain('Right 3 lobes'));
    unmount();

    // "Reload"
    go('#/study');
    render(<App studyRepo={repo()} />);
    expect(await screen.findByText('Right 3 lobes, left 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Lungs' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('radio', { name: 'Medical student' })).toHaveAttribute('aria-checked', 'true');
  });

  it('reviews new flashcards and schedules them', async () => {
    const user = userEvent.setup();
    const repo = new MemoryStudyRepository();
    go('#/review');
    render(<App studyRepo={repo} />);
    await user.click(await screen.findByRole('button', { name: /Learn new cards/ }));
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    await user.click(screen.getByRole('button', { name: 'Good' }));
    await waitFor(async () => {
      const saved = await repo.load();
      const schedules = Object.values(saved.cardSchedules);
      expect(schedules).toHaveLength(1);
      expect(schedules[0].box).toBe(1);
    });
  });
});

describe('states', () => {
  it('shows an error state with retry when content fails to load', async () => {
    const failing = { loadBundle: () => Promise.reject(new Error('network down')) };
    render(<App contentRepo={failing} studyRepo={new MemoryStudyRepository()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows planned systems as unavailable, not broken', async () => {
    go('#/system/renal');
    render(<App studyRepo={new MemoryStudyRepository()} />);
    expect(await screen.findByText('Planned', { selector: 'p' })).toBeInTheDocument();
  });
});
