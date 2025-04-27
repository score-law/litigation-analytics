import { motion } from "framer-motion";
import React from "react";

/**
 * VARIABILITY_CONFIG
 *
 * Centralized configuration for variability display thresholds and fill curves.
 * Each display type has its own thresholds (case count cutoffs), marker percentages,
 * and exponential curve lambdas for each segment. Edit this object to adjust variability
 * logic for any display type.
 *
 * Categories: extreme, high, mild, low (always 4)
 *
 * Example display types:
 *   - total_cases
 *   - bench_trials
 *   - jury_trials
 *   - license_suspensions
 *   - fines
 *   - probation
 *   - incarceration
 *   - cash_bails
 */
const VARIABILITY_CONFIG: Record<string, {
  thresholds: number[]; // [0, t1, t2, t3, max]
  percentages: number[]; // [0, p1, p2, p3, 100]
  lambdas: number[]; // [l1, l2, l3, l4]
}> = {
  total_cases: {
    thresholds: [0, 20, 100, 500, 4000000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  bench_trials: {
    thresholds: [0, 10, 75, 150, 1000000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  jury_trials: {
    thresholds: [0, 10, 75, 150, 1000000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  license_suspensions: {
    thresholds: [0, 50, 200, 500, 500000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  fines: {
    thresholds: [0, 50, 200, 500, 500000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  probation: {
    thresholds: [0, 50, 200, 500, 500000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  incarceration: {
    thresholds: [0, 50, 200, 500, 500000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
  cash_bails: {
    thresholds: [0, 50, 200, 500, 500000],
    percentages: [0, 20, 50, 80, 100],
    lambdas: [3, 3, 4, 100],
  },
};

// Utility function to determine display type for variability config
const getDisplayType = (
  activeTab: string,
  dispositionsTrialType: string,
  sentenceDisplayMode: string,
  selectedSentenceType: string,
  bailDisplayMode: string
): string => {
  if (activeTab === 'dispositions') {
    if (dispositionsTrialType === 'bench') return 'bench_trials';
    if (dispositionsTrialType === 'jury') return 'jury_trials';
    return 'total_cases';
  }
  if (activeTab === 'sentences' && sentenceDisplayMode === 'severity') {
    if (selectedSentenceType === 'License' || selectedSentenceType === 'License\nSuspension') return 'license_suspensions';
    if (selectedSentenceType === 'Fine') return 'fines';
    if (selectedSentenceType === 'Probation') return 'probation';
    if (selectedSentenceType === 'Incarceration') return 'incarceration';
    return 'total_cases';
  }
  if (activeTab === 'bail' && bailDisplayMode === 'severity') {
    return 'cash_bails';
  }
  return 'total_cases';
};

const getVariabilityInfo = (caseCount: number, displayType: string) => {
  const config = VARIABILITY_CONFIG[displayType] || VARIABILITY_CONFIG['total_cases'];
  const [t0, t1, t2, t3, tMax] = config.thresholds;
  if (caseCount < t1) {
    return {
      category: 'extreme',
      label: 'Extreme Variability',
      color: '#e53e3e',
      thresholds: config.thresholds,
      percentages: config.percentages
    };
  } else if (caseCount < t2) {
    return {
      category: 'high',
      label: 'High Variability',
      color: '#dd6b20',
      thresholds: config.thresholds,
      percentages: config.percentages
    };
  } else if (caseCount < t3) {
    return {
      category: 'mild',
      label: 'Mild Variability',
      color: '#d69e2e',
      thresholds: config.thresholds,
      percentages: config.percentages
    };
  } else {
    return {
      category: 'low',
      label: 'Low Variability',
      color: '#38a169',
      thresholds: config.thresholds,
      percentages: config.percentages
    };
  }
};

const calculateExponentialBarWidth = (caseCount: number, displayType: string) => {
  const config = VARIABILITY_CONFIG[displayType] || VARIABILITY_CONFIG['total_cases'];
  const thresholds = config.thresholds;
  const percentages = config.percentages;
  const lambdas = config.lambdas;
  let i = 0;
  while (i < thresholds.length - 1 && caseCount > thresholds[i + 1]) {
    i++;
  }
  if (i === thresholds.length - 1) {
    return percentages[i];
  }
  const segmentStart = thresholds[i];
  const segmentEnd = thresholds[i + 1];
  const segmentRange = segmentEnd - segmentStart;
  const positionInSegment = caseCount - segmentStart;
  const normalizedPosition = segmentRange > 0 ? positionInSegment / segmentRange : 0;
  const lambda = lambdas[i];
  const exponentialFactor = 1 - Math.exp(-lambda * normalizedPosition);
  const startPercentage = percentages[i];
  const endPercentage = percentages[i + 1];
  const percentageRange = endPercentage - startPercentage;
  return startPercentage + percentageRange * exponentialFactor;
};

const calculateBarWidth = (caseCount: number, displayType: string) => {
  return calculateExponentialBarWidth(caseCount, displayType);
};

const VariabilityDisplay = ({
  loading,
  totalCases,
  data,
  activeTab,
  dispositionsTrialType,
  sentenceDisplayMode,
  selectedSentenceType,
  bailDisplayMode
}: {
  loading: boolean;
  totalCases: number;
  data: any;
  activeTab: string;
  dispositionsTrialType: string;
  sentenceDisplayMode: string;
  selectedSentenceType: string;
  bailDisplayMode: string;
}) => {
  if (loading) {
    return (
      <div className="variability-display">
        <div className="variability-text-row">
          <span className="case-count">Loading...</span>
        </div>
        <div className="variability-bar-container">
          <div className="threshold-markers">
            <div className="marker marker-100"></div>
            <div className="marker marker-500"></div>
            <div className="marker marker-1000"></div>
          </div>
        </div>
      </div>
    );
  }

  let displayCount = totalCases;
  let displayLabel = "Total Cases";
  let displayType = 'total_cases';

  if (
    activeTab === "dispositions" &&
    data &&
    Array.isArray(data.dispositions)
  ) {
    if (dispositionsTrialType === "bench" || dispositionsTrialType === "jury") {
      const trialTypeKey = dispositionsTrialType;
      displayCount = (data.dispositions as Array<{ trialTypeCounts?: Record<string, number> }>)
        .reduce((sum: number, disp: { trialTypeCounts?: Record<string, number> }) => sum + (disp.trialTypeCounts?.[trialTypeKey] || 0), 0);
      displayLabel =
        trialTypeKey === "bench"
          ? "Bench Trials"
          : trialTypeKey === "jury"
          ? "Jury Trials"
          : "Total Cases";
    } else {
      displayCount = totalCases;
      displayLabel = "Total Cases";
    }
    displayType = getDisplayType(activeTab, dispositionsTrialType, sentenceDisplayMode, selectedSentenceType, bailDisplayMode);
  }

  if (
    activeTab === "sentences" &&
    sentenceDisplayMode === "severity" &&
    data &&
    Array.isArray(data.sentences)
  ) {
    const lookupType =
      selectedSentenceType === "License"
        ? "License\nSuspension"
        : selectedSentenceType;
    const selectedSentence = (data.sentences as Array<{ type: string; count: number }>).find((s: { type: string }) => s.type === lookupType);
    displayCount = selectedSentence ? selectedSentence.count : 0;
    displayLabel =
      lookupType === "License\nSuspension"
        ? "Total License Suspensions"
        : `Total ${lookupType.replace(/\n/g, " ")}s`;
    displayType = getDisplayType(activeTab, dispositionsTrialType, sentenceDisplayMode, selectedSentenceType, bailDisplayMode);
  }

  if (
    activeTab === "bail" &&
    bailDisplayMode === "severity" &&
    data &&
    Array.isArray(data.bailDecisions)
  ) {
    const cashBail = (data.bailDecisions as Array<{ type: string; count: number }>).find((b: { type: string }) => b.type.replace(/\s/g, "") === "CashBail");
    displayCount = cashBail ? cashBail.count : 0;
    displayLabel = "Total Cash Bails";
    displayType = getDisplayType(activeTab, dispositionsTrialType, sentenceDisplayMode, selectedSentenceType, bailDisplayMode);
  }

  const variabilityInfo = getVariabilityInfo(displayCount, displayType);
  const barWidth = calculateBarWidth(displayCount, displayType);
  const markerPercentages = variabilityInfo.percentages;

  return (
    <div className="variability-display">
      <div className="variability-text-row">
        <span className="case-count">{displayCount.toLocaleString()}</span>
        <span className="case-label">{displayLabel}</span>
        <span className={`variability-category ${variabilityInfo.category}`}>{variabilityInfo.label}</span>
      </div>
      <div className="variability-bar-container">
        <div className="threshold-markers">
          <div className="marker marker-100" style={{ left: `${markerPercentages[1]}%` }}></div>
          <div className="marker marker-500" style={{ left: `${markerPercentages[2]}%` }}></div>
          <div className="marker marker-1000" style={{ left: `${markerPercentages[3]}%` }}></div>
        </div>
        <motion.div
          className={`variability-bar-fill ${variabilityInfo.category}`}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default VariabilityDisplay;
