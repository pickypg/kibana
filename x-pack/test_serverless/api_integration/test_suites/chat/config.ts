/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createTestConfig } from '../../config.base';

export default createTestConfig({
  serverlessProject: 'chat',
  testFiles: [require.resolve('.')],
  junit: {
    reportName: 'Serverless Chat API Integration Tests',
  },
  suiteTags: { exclude: ['skipSvlChat'] },

  // include settings from project controller
  esServerArgs: [],
  kbnServerArgs: [],
});
