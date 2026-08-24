export interface Experiment {
  id: number;
  num: string;
  title: string;
  desc: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  standard: string;
  status: 'Ready' | 'Coming Soon';
  hasCode: boolean;
  defaultInputs?: {
    m1: number;
    m2: number;
    m3: number;
  };
  inputLabels?: {
    m1: string;
    m2: string;
    m3: string;
  };
  calculatedLabels?: {
    c1: string;
    c2: string;
    res: string;
  };
  unit?: string;
}

export interface Observation {
  obsNo: number;
  containerNo: string;
  m1: number;
  m2: number;
  m3: number;
  c1: number;
  c2: number;
  resultVal: number;
}

/* BACKWARDS-COMPATIBILITY ALIASES */
export type SoilTest = any;
export type Project = any;
export type Sample = any;
export type Equipment = any;
export type ReportItem = any;
export type NotificationItem = any;
export type ExperimentConfig = any;
export type ObservationRow = any;
export type VerificationStatus = any;
export type UserRole = any;
export type TestStatus = any;
