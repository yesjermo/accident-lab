import { useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useContent } from '../data/content';
import { nowIso, useStudy } from '../data/study';
import { BackLink, EquationBlock } from '../components/Explain';
import { ProvenanceNote } from '../components/Provenance';
import { QuestionCard } from '../components/QuestionCard';
import {
  STANDARD_CONDITIONS,
  STANDARD_P50,
  curve,
  p50,
  saturation,
  shiftDirection,
  type OdcConditions,
  type ShiftDirection,
} from '../science/odc';
import { EXPERIMENT_RECALL_ID } from '../content/questions';

const PRESETS: { label: string; c: OdcConditions; note: string }[] = [
  { label: 'Exercising muscle', c: { pH: 7.3, temperatureC: 39 }, note: 'warmer and more acidic than at rest' },
  { label: 'Fever', c: { pH: 7.4, temperatureC: 40 }, note: 'temperature up, pH unchanged' },
  { label: 'Hyperventilation (alkalosis)', c: { pH: 7.55, temperatureC: 37 }, note: 'CO₂ blown off, pH up' },
  { label: 'Cooled blood', c: { pH: 7.4, temperatureC: 34 }, note: 'temperature down' },
];

const DIR_TEXT: Record<ShiftDirection, string> = {
  left: 'Shift left (higher affinity)',
  right: 'Shift right (lower affinity)',
  none: 'No meaningful shift',
};

const same = (a: OdcConditions, b: OdcConditions) => Math.abs(a.pH - b.pH) < 1e-9 && Math.abs(a.temperatureC - b.temperatureC) < 1e-9;
const fmt = (n: number, d = 1) => n.toFixed(d);

function explain(c: OdcConditions): string[] {
  const out: string[] = [];
  if (c.pH < 7.4) out.push(`pH is lower (${fmt(c.pH, 2)}): more H⁺ binds hemoglobin and stabilises its low-affinity shape (Bohr effect), so the curve moves right.`);
  if (c.pH > 7.4) out.push(`pH is higher (${fmt(c.pH, 2)}): fewer H⁺ are bound, affinity rises, so the curve moves left.`);
  if (c.temperatureC > 37) out.push(`Temperature is higher (${fmt(c.temperatureC)} °C): O₂ binding is weakened, so the curve moves right.`);
  if (c.temperatureC < 37) out.push(`Temperature is lower (${fmt(c.temperatureC)} °C): binding is tighter, so the curve moves left.`);
  if (out.length === 2 && (c.pH < 7.4) !== (c.temperatureC > 37)) out.push('The two changes push in opposite directions; the net shift is what you see.');
  return out;
}

/**
 * Oxygen–hemoglobin dissociation curve experiment. Students set conditions,
 * predict the direction of change, then see the curve, numbers and an
 * explanation, followed by a recall question.
 */
export function ExperimentPage() {
  const { bundle, ix } = useContent();
  const { dispatch } = useStudy();
  const spec = bundle.simulations[0];
  const [pending, setPending] = useState<OdcConditions>({ ...STANDARD_CONDITIONS });
  const [shown, setShown] = useState<OdcConditions | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<ShiftDirection | null>(null);
  const [result, setResult] = useState<{ predicted: ShiftDirection | null; actual: ShiftDirection } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const baseline = useMemo(() => curve(STANDARD_CONDITIONS, 2), []);
  const current = useMemo(() => (shown ? curve(shown, 2) : null), [shown]);
  const data = baseline.map((p, i) => ({ po2: p.po2, baseline: p.so2, current: current?.[i].so2 }));
  const isBaseline = same(pending, STANDARD_CONDITIONS);
  const dirty = !shown ? !isBaseline : !same(pending, shown);

  const reveal = (predicted: ShiftDirection | null) => {
    const actual = shiftDirection(pending);
    if (predicted) dispatch({ type: 'recordPrediction', record: { at: nowIso(), conditions: { ...pending }, predicted, actual } });
    setShown({ ...pending });
    setResult({ predicted, actual });
    setPredicting(false);
    setPrediction(null);
  };

  const reset = () => {
    setPending({ ...STANDARD_CONDITIONS });
    setShown(null);
    setResult(null);
    setPredicting(false);
  };

  const recall = ix.questions.get(EXPERIMENT_RECALL_ID)!;
  const p = spec.params;

  return (
    <article className="page experiment">
      <BackLink />
      <p className="eyebrow">Interactive experiment</p>
      <h1>{spec.title}</h1>
      <p className="lede">
        Change blood pH and temperature, predict how the curve will move, then check. The dashed curve is the baseline:
        standard adult blood at 37 °C and pH 7.40.
      </p>
      <p className="notice" role="note">
        Teaching model of the population-average curve. It is not a prediction for any individual patient and is not for
        clinical use.
      </p>

      <div className="experiment-grid">
        <section className="controls" aria-labelledby="ctl-h">
          <h2 id="ctl-h" className="h3">
            Conditions
          </h2>
          {p.map((param) => {
            const key = param.key as keyof OdcConditions;
            const val = pending[key];
            return (
              <div className="slider" key={param.key}>
                <label htmlFor={`sl-${param.key}`}>
                  {param.label}
                  <output htmlFor={`sl-${param.key}`}>
                    {param.key === 'pH' ? fmt(val, 2) : fmt(val)} {param.unit}
                  </output>
                </label>
                <input
                  id={`sl-${param.key}`}
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={val}
                  aria-valuetext={`${param.key === 'pH' ? fmt(val, 2) : fmt(val)} ${param.unit}`}
                  onChange={(e) => {
                    setPending((c) => ({ ...c, [key]: Number(e.target.value) }));
                    setResult(null);
                  }}
                />
                <div className="range-ends muted small">
                  <span>{param.min}</span>
                  <span>baseline {param.baseline}</span>
                  <span>{param.max}</span>
                </div>
              </div>
            );
          })}
          <fieldset className="presets">
            <legend className="field-label">Or try a scenario</legend>
            {PRESETS.map((pr) => (
              <button
                key={pr.label}
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setPending(pr.c);
                  setResult(null);
                }}
              >
                {pr.label}
                <span className="muted small"> · {pr.note}</span>
              </button>
            ))}
          </fieldset>
          <div className="row wrap">
            <button type="button" className="btn btn-primary" disabled={!dirty || isBaseline} onClick={() => setPredicting(true)}>
              Predict, then show the curve
            </button>
            <button type="button" className="btn" onClick={reset}>
              Reset to baseline
            </button>
          </div>
          {isBaseline && !shown && <p className="muted small">Move a slider or pick a scenario to start.</p>}

          {predicting && (
            <form
              className="predict"
              onSubmit={(e) => {
                e.preventDefault();
                if (prediction) reveal(prediction);
              }}
            >
              <fieldset>
                <legend>
                  <strong>Your prediction:</strong> at pH {fmt(pending.pH, 2)} and {fmt(pending.temperatureC)} °C, which way will the
                  curve move?
                </legend>
                {(['left', 'right', 'none'] as ShiftDirection[]).map((d) => (
                  <label key={d} className="choice">
                    <input type="radio" name="pred" value={d} checked={prediction === d} onChange={() => setPrediction(d)} />
                    {DIR_TEXT[d]}
                  </label>
                ))}
              </fieldset>
              <div className="row wrap">
                <button type="submit" className="btn btn-primary" disabled={!prediction}>
                  Lock in and reveal
                </button>
                <button type="button" className="btn btn-link" onClick={() => reveal(null)}>
                  Show without predicting
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="plot" aria-labelledby="plot-h">
          <h2 id="plot-h" className="h3">
            Saturation vs PO₂
          </h2>
          <div className="chart" role="img" aria-label={`Dissociation curve. Baseline P50 ${fmt(STANDARD_P50)} mmHg${shown ? `; current P50 ${fmt(p50(shown))} mmHg` : ''}. Table view available below.`}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={data} margin={{ top: 10, right: 36, bottom: 28, left: 8 }}>
                <CartesianGrid className="grid" vertical={false} />
                <XAxis
                  dataKey="po2"
                  type="number"
                  domain={[0, 150]}
                  ticks={[0, 25, 50, 75, 100, 125, 150]}
                  label={{ value: 'PO₂ (mmHg)', position: 'insideBottom', offset: -16 }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  width={52}
                  label={{ value: 'SO₂ (%)', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toFixed(1)} %`, name]}
                  labelFormatter={(l: number) => `PO₂ ${l} mmHg`}
                  isAnimationActive={false}
                />
                <Legend verticalAlign="top" height={28} />
                <ReferenceLine y={50} className="ref" strokeDasharray="2 4" label={{ value: '50%', position: 'right' }} />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="Baseline (37 °C, pH 7.40)"
                  stroke="var(--series-baseline)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  isAnimationActive={false}
                />
                {shown && (
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={`Your conditions (${fmt(shown.temperatureC)} °C, pH ${fmt(shown.pH, 2)})`}
                    stroke="var(--series-current)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <table className="readout">
            <caption>Readout</caption>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Baseline</th>
                <th scope="col">Your conditions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">P50 (mmHg)</th>
                <td>{fmt(STANDARD_P50)}</td>
                <td>{shown ? fmt(p50(shown)) : '—'}</td>
              </tr>
              <tr>
                <th scope="row">SO₂ at PO₂ 100 mmHg (arterial)</th>
                <td>{fmt(saturation(100) * 100)} %</td>
                <td>{shown ? `${fmt(saturation(100, shown) * 100)} %` : '—'}</td>
              </tr>
              <tr>
                <th scope="row">SO₂ at PO₂ 40 mmHg (resting tissue)</th>
                <td>{fmt(saturation(40) * 100)} %</td>
                <td>{shown ? `${fmt(saturation(40, shown) * 100)} %` : '—'}</td>
              </tr>
              <tr>
                <th scope="row">O₂ released between 100 and 40 mmHg (% of capacity)</th>
                <td>{fmt((saturation(100) - saturation(40)) * 100)}</td>
                <td>{shown ? fmt((saturation(100, shown) - saturation(40, shown)) * 100) : '—'}</td>
              </tr>
            </tbody>
          </table>
          <button type="button" className="btn btn-link" aria-expanded={showTable} onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Hide' : 'Show'} the curve as a table
          </button>
          {showTable && (
            <div className="table-scroll">
              <table className="data-table">
                <caption>Saturation (%) by PO₂, every 10 mmHg</caption>
                <thead>
                  <tr>
                    <th scope="col">PO₂ (mmHg)</th>
                    <th scope="col">Baseline SO₂</th>
                    {shown && <th scope="col">Your SO₂</th>}
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter((d) => d.po2 % 10 === 0)
                    .map((d) => (
                      <tr key={d.po2}>
                        <td>{d.po2}</td>
                        <td>{d.baseline.toFixed(1)}</td>
                        {shown && <td>{d.current?.toFixed(1)}</td>}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {result && shown && (
        <section className="result" aria-live="polite">
          <h2 className="h3">What changed and why</h2>
          {result.predicted && (
            <p className={`feedback ${result.predicted === result.actual ? 'is-correct' : 'is-wrong'}`}>
              {result.predicted === result.actual ? '✓ ' : '✗ '}You predicted <strong>{DIR_TEXT[result.predicted].toLowerCase()}</strong>;
              the model gives <strong>{DIR_TEXT[result.actual].toLowerCase()}</strong>.
            </p>
          )}
          <p>
            P50 moved from {fmt(STANDARD_P50)} to {fmt(p50(shown))} mmHg ({p50(shown) >= STANDARD_P50 ? '+' : ''}
            {fmt(p50(shown) - STANDARD_P50)} mmHg). At a tissue PO₂ of 40 mmHg, saturation is {fmt(saturation(40, shown) * 100)}% instead
            of {fmt(saturation(40) * 100)}%, so {saturation(40, shown) < saturation(40) ? 'more' : 'less'} O₂ is unloaded there.
          </p>
          <ul>
            {explain(shown).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="muted small">
            Notice the top of the curve: arterial saturation at 100 mmHg changes much less than venous saturation. That is the flat
            plateau protecting loading in the lungs.
          </p>
          <QuestionCard question={recall} context="experiment" heading="Recall" />
        </section>
      )}

      <section className="model">
        <h2>The model, its assumptions and its limits</h2>
        <p>{spec.model}</p>
        {spec.equations.map((eq) => (
          <EquationBlock key={eq.id} eq={eq} />
        ))}
        <div className="grid-2">
          <div>
            <h3>Assumptions</h3>
            <ul>
              {spec.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Supported range</h3>
            <ul>
              {spec.params.map((pp) => (
                <li key={pp.key}>
                  {pp.label}: {pp.min}–{pp.max} {pp.unit} (baseline {pp.baseline})
                </li>
              ))}
              <li>PO₂: 0–150 mmHg</li>
            </ul>
            <p className="muted small">The app will not compute outside these ranges.</p>
            <h3>Not modelled</h3>
            <p>{spec.notModelled.join(' · ')}</p>
          </div>
        </div>
        <ProvenanceNote provenance={spec.provenance} />
      </section>
    </article>
  );
}
