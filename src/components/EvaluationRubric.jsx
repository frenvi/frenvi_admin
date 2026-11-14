import React, { useState, useEffect } from 'react';

export default function EvaluationRubric({ candidate, onSubmit, onDraftUpdate, isSubmitting }) {
  const [scores, setScores] = useState({
    communication: 24,
    scenarioHandling: 23,
    hygieneSafety: 24,
    reliability: 23
  });
  const [feedback, setFeedback] = useState(
    'Candidate demonstrated exceptional customer greeting composure, fluent responses to rush scenarios, and meticulous hygiene protocol knowledge. Ready for high-paying partner shifts.'
  );

  const totalScore = scores.communication + scores.scenarioHandling + scores.hygieneSafety + scores.reliability;

  let grade = 'Grade B';
  let gradeClass = 'grade-b';
  let badgeName = 'Certified Associate Specialist';

  if (totalScore >= 90) {
    grade = 'Grade A (Distinction)';
    gradeClass = 'grade-a';
    badgeName = 'Certified Senior Dining & Retail Specialist';
  } else if (totalScore >= 80) {
    grade = 'Grade A';
    gradeClass = 'grade-a';
    badgeName = 'Certified Store & Dining Specialist';
  } else if (totalScore >= 70) {
    grade = 'Grade B';
    gradeClass = 'grade-b';
    badgeName = 'Certified Associate Specialist';
  } else {
    grade = 'Retake Required';
    gradeClass = 'grade-c';
    badgeName = 'Training Required for Certification';
  }

  const handleScoreChange = (key, val) => {
    const updated = { ...scores, [key]: Number(val) };
    setScores(updated);
    if (onDraftUpdate) {
      onDraftUpdate(updated, updated.communication + updated.scenarioHandling + updated.hygieneSafety + updated.reliability);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      scores,
      totalScore,
      grade,
      skillBadge: badgeName,
      feedback
    });
  };

  return (
    <div className="scoring-card">
      <div className="scoring-header">
        <div>
          <h3 className="scoring-title">Skill evaluation rubric</h3>
          <p className="scoring-sub">Score 4 criteria used in the FRENVI worker app (total 100)</p>
        </div>
        <div className="score-badge-box">
          <div className="score-display">
            <span className="score-num">{totalScore}</span>
            <span className="score-denom">/100</span>
          </div>
          <div className={`grade-pill ${gradeClass}`}>{grade}</div>
        </div>
      </div>

      <form className="rubric-form" onSubmit={handleSubmit}>
        {/* Criterion 1 */}
        <div className="rubric-item">
          <div className="rubric-title-row">
            <div className="rubric-info">
              <span className="rubric-icon">🗣️</span>
              <div>
                <strong>1. Verbal Communication & Greeting</strong>
                <p>Polite tone, active listening, clear spoken language, customer greeting protocol.</p>
              </div>
            </div>
            <span className="score-input-val">{scores.communication} / 25</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            value={scores.communication}
            className="slider"
            onChange={(e) => handleScoreChange('communication', e.target.value)}
          />
        </div>

        {/* Criterion 2 */}
        <div className="rubric-item">
          <div className="rubric-title-row">
            <div className="rubric-info">
              <span className="rubric-icon">🧠</span>
              <div>
                <strong>2. Situational & Scenario Handling</strong>
                <p>Composure under peak hour rush, handling missing orders or customer delays.</p>
              </div>
            </div>
            <span className="score-input-val">{scores.scenarioHandling} / 25</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            value={scores.scenarioHandling}
            className="slider"
            onChange={(e) => handleScoreChange('scenarioHandling', e.target.value)}
          />
        </div>

        {/* Criterion 3 */}
        <div className="rubric-item">
          <div className="rubric-title-row">
            <div className="rubric-info">
              <span className="rubric-icon">🧼</span>
              <div>
                <strong>3. Hygiene, Grooming & Workplace Safety</strong>
                <p>Clean attire, awareness of food sanitization protocols, safety precautions.</p>
              </div>
            </div>
            <span className="score-input-val">{scores.hygieneSafety} / 25</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            value={scores.hygieneSafety}
            className="slider"
            onChange={(e) => handleScoreChange('hygieneSafety', e.target.value)}
          />
        </div>

        {/* Criterion 4 */}
        <div className="rubric-item">
          <div className="rubric-title-row">
            <div className="rubric-info">
              <span className="rubric-icon">⏰</span>
              <div>
                <strong>4. Reliability, Punctuality & Discipline</strong>
                <p>Shift reporting commitment, readiness for scheduled slots, professional attitude.</p>
              </div>
            </div>
            <span className="score-input-val">{scores.reliability} / 25</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            value={scores.reliability}
            className="slider"
            onChange={(e) => handleScoreChange('reliability', e.target.value)}
          />
        </div>

        {/* Badge Preview */}
        <div className="badge-preview-box">
          <div className="badge-icon">🎖️</div>
          <div>
            <div className="badge-tag">AWARDED CERTIFICATION BADGE</div>
            <div className="badge-name">{badgeName}</div>
          </div>
        </div>

        {/* Remarks */}
        <div className="form-group">
          <label htmlFor="eval-feedback">Assessor Qualitative Remarks & Feedback</label>
          <textarea
            id="eval-feedback"
            rows="3"
            className="feedback-textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? '⏳' : '✅'}</span>
            <span>{isSubmitting ? 'Recording in Database...' : 'Submit Evaluation & Verify Candidate'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
