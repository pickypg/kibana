/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { estypes } from '@elastic/elasticsearch';
import type { LineAnnotationDatum, RectAnnotationDatum } from '@elastic/charts';
import type { ErrorType } from '@kbn/ml-error-utils';
import type {
  ES_AGGREGATION,
  ML_JOB_AGGREGATION,
  MlAnomaliesTableRecord,
} from '@kbn/ml-anomaly-utils';
import { type MlEntityField, type MlRecordForInfluencer } from '@kbn/ml-anomaly-utils';
import type { Datafeed, JobId, ModelSnapshot } from './anomaly_detection_jobs';

export interface GetAnomaliesTableDataResult {
  anomalies: MlAnomaliesTableRecord[];
  interval: string;
  examplesByJobId?: Record<string, Record<string, string[]>>;
}
export interface GetStoppedPartitionResult {
  jobs: string[] | Record<string, string[]>;
}

export interface MLRectAnnotationDatum extends RectAnnotationDatum {
  header: number;
}
export interface LineAnnotationDatumWithModelSnapshot extends LineAnnotationDatum {
  modelSnapshot?: ModelSnapshot;
}
export interface GetDatafeedResultsChartDataResult {
  bucketResults: number[][];
  datafeedResults: number[][];
  annotationResultsRect: MLRectAnnotationDatum[];
  annotationResultsLine: LineAnnotationDatum[];
}

export interface DatafeedResultsChartDataParams {
  jobId: string;
  start: number;
  end: number;
}

export const defaultSearchQuery: estypes.QueryDslQueryContainer = {
  bool: {
    must: [
      {
        match_all: {},
      },
    ],
  },
};

export interface MetricData {
  results: Record<string, number>;
  success: boolean;
  error?: ErrorType;
}

export interface ResultResponse {
  success: boolean;
  error?: ErrorType;
}

export interface ModelPlotOutput extends ResultResponse {
  results: Record<string, any>;
}

export interface RecordsForCriteria extends ResultResponse {
  records: any[];
}

export interface ScheduledEventsByBucket extends ResultResponse {
  events: Record<string, any>;
}

export interface SeriesConfig {
  jobId: JobId;
  detectorIndex: number;
  metricFunction: ML_JOB_AGGREGATION.LAT_LONG | ES_AGGREGATION | null;
  timeField: string;
  interval: string;
  datafeedConfig: Datafeed;
  summaryCountFieldName?: string;
  metricFieldName?: string;
}

export interface SeriesConfigWithMetadata extends SeriesConfig {
  functionDescription?: string;
  bucketSpanSeconds: number;
  detectorLabel?: string;
  fieldName: string;
  entityFields: MlEntityField[];
  infoTooltip?: InfoTooltip;
  loading?: boolean;
  chartData?: ChartPoint[] | null;
  mapData?: Array<ChartRecord | undefined>;
  plotEarliest?: number;
  plotLatest?: number;
}

export interface ChartPoint {
  date: number;
  anomalyScore?: number;
  actual?: number[];
  multiBucketImpact?: number;
  isMultiBucketAnomaly?: boolean;
  typical?: number[];
  value?: number | null;
  entity?: string;
  byFieldName?: string;
  numberOfCauses?: number;
  scheduledEvents?: any[];
}

export interface InfoTooltip {
  jobId: JobId;
  aggregationInterval?: string;
  chartFunction: string;
  entityFields: MlEntityField[];
}

export interface ChartRecord extends MlRecordForInfluencer {
  function: string;
}

export interface ExplorerChartSeriesErrorMessages {
  [key: string]: JobId[];
}
export interface ExplorerChartsData {
  chartsPerRow: number;
  seriesToPlot: SeriesConfigWithMetadata[];
  tooManyBuckets: boolean;
  timeFieldName: string;
  errorMessages: ExplorerChartSeriesErrorMessages | undefined;
}
