/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { EntityType } from '../../../../common/entity_analytics/types';
import { getRiskEntityTranslation } from '../risk_score/translations';

export const RISK_SCORE_OVER_TIME = (riskEntity: EntityType) =>
  i18n.translate('xpack.securitySolution.riskTabBody.scoreOverTimeTitle', {
    defaultMessage: '{riskEntity} risk score over time',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity),
    },
  });

export const VIEW_DASHBOARD_BUTTON = i18n.translate(
  'xpack.securitySolution.riskTabBody.viewDashboardButtonLabel',
  {
    defaultMessage: 'View source dashboard',
  }
);
