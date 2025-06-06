/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KibanaReactStorybookDecorator } from '../../../utils/kibana_react.storybook_decorator';
import {
  HEALTHY_ROLLING_SLO,
  historicalSummaryData,
} from '../../../data/slo/historical_summary_data';
import { buildSlo } from '../../../data/slo/slo';
import { SloSummary as Component } from './slo_summary';

export default {
  component: Component,
  title: 'app/SLO/ListPage/SloSummary',
  decorators: [KibanaReactStorybookDecorator],
};

const defaultProps = {
  slo: buildSlo(),
  historicalSummary: historicalSummaryData.find((datum) => datum.sloId === HEALTHY_ROLLING_SLO)!
    .data,
  historicalSummaryLoading: false,
};

export const WithHistoricalData = {
  args: { ...defaultProps },
};

export const WithLoadingData = {
  args: { ...defaultProps, historicalSummaryLoading: true },
};
