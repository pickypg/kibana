/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment';
import type { GetStepsData } from './helpers';
import {
  determineDetailsValue,
  fillEmptySeverityMappings,
  getAboutStepsData,
  getActionsStepsData,
  getDefineStepsData,
  getModifiedAboutDetailsData,
  getPrePackagedTimelineInstallationStatus,
  getScheduleStepsData,
  getStepsData,
} from './helpers';
import {
  mockRule,
  mockRuleWithEverything,
} from '../rule_management_ui/components/rules_table/__mocks__/mock';
import { FilterStateStore } from '@kbn/es-query';
import type { RuleAction } from '../../../common/api/detection_engine/model/rule_schema';
import { AlertSuppressionMissingFieldsStrategyEnum } from '../../../common/api/detection_engine/model/rule_schema';

import type { Rule } from '../rule_management/logic';
import type {
  AboutStepRule,
  AboutStepRuleDetails,
  ActionsStepRule,
  DefineStepRule,
  ScheduleStepRule,
} from './types';
import { getThreatMock } from '../../../common/detection_engine/schemas/types/threat.mock';
import {
  ALERT_SUPPRESSION_DURATION_FIELD_NAME,
  ALERT_SUPPRESSION_DURATION_TYPE_FIELD_NAME,
  ALERT_SUPPRESSION_DURATION_UNIT_FIELD_NAME,
  ALERT_SUPPRESSION_DURATION_VALUE_FIELD_NAME,
  ALERT_SUPPRESSION_FIELDS_FIELD_NAME,
  ALERT_SUPPRESSION_MISSING_FIELDS_FIELD_NAME,
} from '../rule_creation/components/alert_suppression_edit';
import { THRESHOLD_ALERT_SUPPRESSION_ENABLED } from '../rule_creation/components/threshold_alert_suppression_edit';

describe('rule helpers', () => {
  moment.suppressDeprecationWarnings = true;
  describe('getStepsData', () => {
    test('returns object with about, define, schedule and actions step properties formatted', () => {
      const {
        defineRuleData,
        modifiedAboutRuleDetailsData,
        aboutRuleData,
        scheduleRuleData,
        ruleActionsData,
      }: GetStepsData = getStepsData({
        rule: mockRuleWithEverything('test-id'),
      });
      const defineRuleStepData = {
        ruleType: 'saved_query',
        anomalyThreshold: 50,
        dataSourceType: 'indexPatterns',
        dataViewId: undefined,
        index: ['auditbeat-*'],
        machineLearningJobId: [],
        shouldLoadQueryDynamically: true,
        queryBar: {
          query: {
            query: 'user.name: root or user.name: admin',
            language: 'kuery',
          },
          filters: [
            {
              $state: {
                store: FilterStateStore.GLOBAL_STATE,
              },
              meta: {
                alias: null,
                disabled: false,
                key: 'event.category',
                negate: false,
                params: {
                  query: 'file',
                },
                type: 'phrase',
              },
              query: {
                match_phrase: {
                  'event.category': 'file',
                },
              },
            },
          ],
          saved_id: 'test123',
        },
        relatedIntegrations: [],
        requiredFields: [],
        threshold: {
          field: ['host.name'],
          value: '50',
          cardinality: {
            field: ['process.name'],
            value: '2',
          },
        },
        threatIndex: [],
        threatMapping: [],
        threatQueryBar: {
          query: {
            query: '',
            language: '',
          },
          filters: [],
          saved_id: null,
        },
        timeline: {
          id: '86aa74d0-2136-11ea-9864-ebc8cc1cb8c2',
          title: 'Titled timeline',
        },
        eqlOptions: {
          timestampField: undefined,
          eventCategoryField: undefined,
          tiebreakerField: undefined,
        },
        [ALERT_SUPPRESSION_FIELDS_FIELD_NAME]: ['host.name'],
        [ALERT_SUPPRESSION_DURATION_FIELD_NAME]: {
          [ALERT_SUPPRESSION_DURATION_VALUE_FIELD_NAME]: 5,
          [ALERT_SUPPRESSION_DURATION_UNIT_FIELD_NAME]: 'm',
        },
        [ALERT_SUPPRESSION_DURATION_TYPE_FIELD_NAME]: 'per-rule-execution',
        newTermsFields: ['host.name'],
        historyWindowSize: '7d',
        [ALERT_SUPPRESSION_MISSING_FIELDS_FIELD_NAME]: expect.any(String),
        [THRESHOLD_ALERT_SUPPRESSION_ENABLED]: false,
      };

      const aboutRuleStepData: AboutStepRule = {
        author: [],
        description: '24/7',
        falsePositives: ['test'],
        isAssociatedToEndpointList: false,
        isBuildingBlock: false,
        license: 'Elastic License',
        name: 'Query with rule-id',
        note: '# this is some markdown documentation',
        references: ['www.test.co'],
        riskScore: { value: 21, mapping: [], isMappingChecked: false },
        ruleNameOverride: 'message',
        severity: {
          value: 'low',
          mapping: fillEmptySeverityMappings([]),
          isMappingChecked: false,
        },
        tags: ['tag1', 'tag2'],
        threat: getThreatMock(),
        timestampOverride: 'event.ingested',
        timestampOverrideFallbackDisabled: false,
        investigationFields: [],
        maxSignals: 100,
        setup: '# this is some setup documentation',
      };
      const scheduleRuleStepData = { from: '0s', interval: '5m' };
      const ruleActionsStepData = {
        enabled: true,
        actions: [],
        responseActions: undefined,
      };
      const aboutRuleDataDetailsData = {
        note: '# this is some markdown documentation',
        description: '24/7',
        setup: '# this is some setup documentation',
      };

      expect(defineRuleData).toEqual(defineRuleStepData);
      expect(aboutRuleData).toEqual(aboutRuleStepData);
      expect(scheduleRuleData).toEqual(scheduleRuleStepData);
      expect(ruleActionsData).toEqual(ruleActionsStepData);
      expect(modifiedAboutRuleDetailsData).toEqual(aboutRuleDataDetailsData);
    });
  });

  describe('getAboutStepsData', () => {
    test('returns name, description, and note as empty string if detailsView is true', () => {
      const result: AboutStepRule = getAboutStepsData(mockRuleWithEverything('test-id'), true);

      expect(result.name).toEqual('');
      expect(result.description).toEqual('');
      expect(result.note).toEqual('');
    });

    test('returns note as empty string if property does not exist on rule', () => {
      const mockedRule = mockRuleWithEverything('test-id');
      delete mockedRule.note;
      const result: AboutStepRule = getAboutStepsData(mockedRule, false);

      expect(result.note).toEqual('');
    });

    test('returns customHighlightedField as empty array if property does not exist on rule', () => {
      const mockedRule = mockRuleWithEverything('test-id');
      delete mockedRule.investigation_fields;
      const result: AboutStepRule = getAboutStepsData(mockedRule, false);

      expect(result.investigationFields).toEqual([]);
    });
  });

  describe('determineDetailsValue', () => {
    test('returns name, description, and note as empty string if detailsView is true', () => {
      const result: Pick<Rule, 'name' | 'description' | 'note' | 'setup'> = determineDetailsValue(
        mockRuleWithEverything('test-id'),
        true
      );
      const expected = { name: '', description: '', note: '', setup: '' };

      expect(result).toEqual(expected);
    });

    test('returns name, description, and note values if detailsView is false', () => {
      const mockedRule = mockRuleWithEverything('test-id');
      const result: Pick<Rule, 'name' | 'description' | 'note' | 'setup'> = determineDetailsValue(
        mockedRule,
        false
      );
      const expected = {
        name: mockedRule.name,
        description: mockedRule.description,
        note: mockedRule.note,
        setup: mockedRule.setup,
      };

      expect(result).toEqual(expected);
    });

    test('returns note as empty string if property does not exist on rule', () => {
      const mockedRule = mockRuleWithEverything('test-id');
      delete mockedRule.note;
      const result: Pick<Rule, 'name' | 'description' | 'note' | 'setup'> = determineDetailsValue(
        mockedRule,
        false
      );
      const expected = {
        name: mockedRule.name,
        description: mockedRule.description,
        note: '',
        setup: mockedRule.setup,
      };

      expect(result).toEqual(expected);
    });
  });

  describe('getDefineStepsData', () => {
    test('returns with saved_id if value exists on rule', () => {
      const result: DefineStepRule = getDefineStepsData(mockRule('test-id'));
      const expected = expect.objectContaining({
        ruleType: 'saved_query',
        queryBar: {
          query: {
            query: '',
            language: 'kuery',
          },
          filters: [],
          saved_id: "Garrett's IP",
        },
        shouldLoadQueryDynamically: true,
      });

      expect(result).toEqual(expected);
    });

    test('returns with saved_id of undefined if value does not exist on rule', () => {
      const mockedRule = mockRule('test-id');
      // @ts-expect-error Saved query rule requires saved_id
      delete mockedRule.saved_id;
      const result: DefineStepRule = getDefineStepsData(mockedRule);
      const expected = expect.objectContaining({
        ruleType: 'saved_query',
        queryBar: {
          query: {
            query: '',
            language: 'kuery',
          },
          filters: [],
          saved_id: null,
        },
        shouldLoadQueryDynamically: false,
      });

      expect(result).toEqual(expected);
    });

    test('returns timeline id and title of null if they do not exist on rule', () => {
      const mockedRule = mockRuleWithEverything('test-id');
      delete mockedRule.timeline_id;
      delete mockedRule.timeline_title;
      const result: DefineStepRule = getDefineStepsData(mockedRule);

      expect(result.timeline.id).toBeNull();
      expect(result.timeline.title).toBeNull();
    });

    describe('suppression on missing fields', () => {
      test('returns default suppress value in suppress strategy is missing', () => {
        const result: DefineStepRule = getDefineStepsData(mockRule('test-id'));
        const expected = expect.objectContaining({
          [ALERT_SUPPRESSION_MISSING_FIELDS_FIELD_NAME]:
            AlertSuppressionMissingFieldsStrategyEnum.suppress,
        });

        expect(result).toEqual(expected);
      });

      test('returns suppress value if rule is configured with missing_fields_strategy', () => {
        const result: DefineStepRule = getDefineStepsData({
          ...mockRule('test-id'),
          alert_suppression: {
            group_by: [],
            missing_fields_strategy: AlertSuppressionMissingFieldsStrategyEnum.doNotSuppress,
          },
        });
        const expected = expect.objectContaining({
          [ALERT_SUPPRESSION_MISSING_FIELDS_FIELD_NAME]:
            AlertSuppressionMissingFieldsStrategyEnum.doNotSuppress,
        });

        expect(result).toEqual(expected);
      });
    });
  });

  describe('getScheduleStepsData', () => {
    test('returns expected ScheduleStep rule object', () => {
      const mockedRule = {
        ...mockRule('test-id'),
      };
      const result: ScheduleStepRule = getScheduleStepsData(mockedRule);
      const expected = {
        interval: mockedRule.interval,
        from: '0s',
      };

      expect(result).toEqual(expected);
    });
  });

  describe('getActionsStepsData', () => {
    test('returns expected ActionsStepRule rule object', () => {
      const actions: RuleAction[] = [
        {
          id: 'id',
          group: 'group',
          params: {},
          action_type_id: 'action_type_id',
          frequency: {
            summary: true,
            throttle: null,
            notifyWhen: 'onActiveAlert',
          },
        },
      ];
      const mockedRule = {
        ...mockRule('test-id'),
        actions,
      };
      const result: ActionsStepRule = getActionsStepsData(mockedRule);
      const expected = {
        actions: [
          {
            id: 'id',
            group: 'group',
            params: {},
            actionTypeId: 'action_type_id',
            frequency: {
              summary: true,
              throttle: null,
              notifyWhen: 'onActiveAlert',
            },
          },
        ],
        responseActions: undefined,
        enabled: mockedRule.enabled,
      };

      expect(result).toEqual(expected);
    });
  });

  describe('getModifiedAboutDetailsData', () => {
    test('returns object with "note" and "description" being those of passed in rule', () => {
      const result: AboutStepRuleDetails = getModifiedAboutDetailsData(
        mockRuleWithEverything('test-id')
      );
      const aboutRuleDataDetailsData = {
        note: '# this is some markdown documentation',
        description: '24/7',
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(aboutRuleDataDetailsData);
    });

    test('returns "note" with empty string if "note" does not exist', () => {
      const { note, ...mockRuleWithoutNote } = { ...mockRuleWithEverything('test-id') };
      const result: AboutStepRuleDetails = getModifiedAboutDetailsData(mockRuleWithoutNote);

      const aboutRuleDetailsData = {
        note: '',
        description: mockRuleWithoutNote.description,
        setup: '# this is some setup documentation',
      };

      expect(result).toEqual(aboutRuleDetailsData);
    });
  });

  describe('getPrePackagedTimelineStatus', () => {
    test('timelinesNotInstalled', () => {
      const timelinesInstalled = 0;
      const timelinesNotInstalled = 1;
      const timelinesNotUpdated = 0;
      const result: string = getPrePackagedTimelineInstallationStatus(
        timelinesInstalled,
        timelinesNotInstalled,
        timelinesNotUpdated
      );

      expect(result).toEqual('timelinesNotInstalled');
    });

    test('timelinesInstalled', () => {
      const timelinesInstalled = 1;
      const timelinesNotInstalled = 0;
      const timelinesNotUpdated = 0;
      const result: string = getPrePackagedTimelineInstallationStatus(
        timelinesInstalled,
        timelinesNotInstalled,
        timelinesNotUpdated
      );

      expect(result).toEqual('timelinesInstalled');
    });

    test('someTimelineUninstall', () => {
      const timelinesInstalled = 1;
      const timelinesNotInstalled = 1;
      const timelinesNotUpdated = 0;
      const result: string = getPrePackagedTimelineInstallationStatus(
        timelinesInstalled,
        timelinesNotInstalled,
        timelinesNotUpdated
      );

      expect(result).toEqual('someTimelineUninstall');
    });

    test('timelineNeedUpdate', () => {
      const timelinesInstalled = 1;
      const timelinesNotInstalled = 0;
      const timelinesNotUpdated = 1;
      const result: string = getPrePackagedTimelineInstallationStatus(
        timelinesInstalled,
        timelinesNotInstalled,
        timelinesNotUpdated
      );

      expect(result).toEqual('timelineNeedUpdate');
    });

    test('unknown', () => {
      const timelinesInstalled = undefined;
      const timelinesNotInstalled = undefined;
      const timelinesNotUpdated = undefined;
      const result: string = getPrePackagedTimelineInstallationStatus(
        timelinesInstalled,
        timelinesNotInstalled,
        timelinesNotUpdated
      );

      expect(result).toEqual('unknown');
    });
  });
});
