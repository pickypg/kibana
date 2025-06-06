/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Fragment, useCallback, useEffect } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiEmptyPrompt, EuiLink, EuiButton } from '@elastic/eui';
import { ApplicationStart } from '@kbn/core/public';
import { useHistory, useLocation } from 'react-router-dom';
import { TableListView } from '@kbn/content-management-table-list-view';
import type { UserContentCommonSchema } from '@kbn/content-management-table-list-view-common';
import { deleteSavedWorkspace, findSavedWorkspace } from '../helpers/saved_workspace_utils';
import { getEditPath, getEditUrl, getNewPath, setBreadcrumbs } from '../services/url';
import { GraphWorkspaceSavedObject } from '../types';
import { GraphServices } from '../application';

const SAVED_OBJECTS_LIMIT_SETTING = 'savedObjects:listingLimit';
const SAVED_OBJECTS_PER_PAGE_SETTING = 'savedObjects:perPage';

type GraphUserContent = UserContentCommonSchema;

const toTableListViewSavedObject = (savedObject: GraphWorkspaceSavedObject): GraphUserContent => {
  return {
    id: savedObject.id!,
    updatedAt: savedObject.updatedAt!,
    references: savedObject.references ?? [],
    type: savedObject.type,
    attributes: {
      title: savedObject.title,
      description: savedObject.description,
    },
  };
};

export interface ListingRouteProps {
  deps: Omit<GraphServices, 'savedObjects'>;
}

export function ListingRoute({
  deps: { chrome, contentClient, coreStart, capabilities, addBasePath, uiSettings },
}: ListingRouteProps) {
  const listingLimit = uiSettings.get(SAVED_OBJECTS_LIMIT_SETTING);
  const initialPageSize = uiSettings.get(SAVED_OBJECTS_PER_PAGE_SETTING);
  const history = useHistory();
  const query = new URLSearchParams(useLocation().search);
  const initialFilter = query.get('filter') || '';

  useEffect(() => {
    setBreadcrumbs({ chrome });
  }, [chrome]);

  const createItem = useCallback(() => {
    history.push(getNewPath());
  }, [history]);

  const findItems = useCallback(
    (search: string) => {
      return findSavedWorkspace(
        { contentClient, basePath: coreStart.http.basePath },
        search,
        listingLimit
      ).then(({ total, hits }) => ({
        total,
        hits: hits.map(toTableListViewSavedObject),
      }));
    },
    [coreStart.http.basePath, listingLimit, contentClient]
  );

  const editItem = useCallback(
    (savedWorkspace: { id: string }) => {
      history.push(getEditPath(savedWorkspace));
    },
    [history]
  );

  const deleteItems = useCallback(
    async (savedWorkspaces: Array<{ id: string }>) => {
      await deleteSavedWorkspace(
        contentClient,
        savedWorkspaces.map((cur) => cur.id!)
      );
    },
    [contentClient]
  );

  return (
    <TableListView<GraphUserContent>
      id="graph"
      headingId="graphListingHeading"
      createItem={capabilities.graph.save ? createItem : undefined}
      findItems={findItems}
      deleteItems={capabilities.graph.delete ? deleteItems : undefined}
      editItem={capabilities.graph.save ? editItem : undefined}
      initialFilter={initialFilter}
      initialPageSize={initialPageSize}
      emptyPrompt={getNoItemsMessage(
        capabilities.graph.save === false,
        createItem,
        coreStart.application
      )}
      entityName={i18n.translate('xpack.graph.listing.table.entityName', {
        defaultMessage: 'graph',
      })}
      entityNamePlural={i18n.translate('xpack.graph.listing.table.entityNamePlural', {
        defaultMessage: 'graphs',
      })}
      title={i18n.translate('xpack.graph.listing.graphsTitle', {
        defaultMessage: 'Graphs',
      })}
      getDetailViewLink={({ id }) => getEditUrl(addBasePath, { id })}
    />
  );
}

function getNoItemsMessage(
  hideWriteControls: boolean,
  createItem: () => void,
  application: ApplicationStart
) {
  if (hideWriteControls) {
    return (
      <EuiEmptyPrompt
        iconType="graphApp"
        title={
          <h1 id="graphListingHeading">
            <FormattedMessage
              id="xpack.graph.listing.noItemsMessage"
              defaultMessage="Looks like you don't have any graphs."
            />
          </h1>
        }
      />
    );
  }

  const sampleDataUrl = `${application.getUrlForApp('home')}#/tutorial_directory/sampleData`;

  return (
    <EuiEmptyPrompt
      iconType="graphApp"
      title={
        <h1 id="graphListingHeading">
          <FormattedMessage
            id="xpack.graph.listing.createNewGraph.title"
            defaultMessage="Create your first graph"
          />
        </h1>
      }
      body={
        <Fragment>
          <p>
            <FormattedMessage
              id="xpack.graph.listing.createNewGraph.combineDataViewFromKibanaAppDescription"
              defaultMessage="Discover patterns and relationships in your Elasticsearch indices."
            />
          </p>
          <p>
            <FormattedMessage
              id="xpack.graph.listing.createNewGraph.newToKibanaDescription"
              defaultMessage="New to Kibana? Get started with {sampleDataInstallLink}."
              values={{
                sampleDataInstallLink: (
                  <EuiLink href={sampleDataUrl}>
                    <FormattedMessage
                      id="xpack.graph.listing.createNewGraph.sampleDataInstallLinkText"
                      defaultMessage="sample data"
                    />
                  </EuiLink>
                ),
              }}
            />
          </p>
        </Fragment>
      }
      actions={
        <EuiButton
          onClick={createItem}
          fill
          iconType="plusInCircle"
          data-test-subj="graphCreateGraphPromptButton"
        >
          <FormattedMessage
            id="xpack.graph.listing.createNewGraph.createButtonLabel"
            defaultMessage="Create graph"
          />
        </EuiButton>
      }
    />
  );
}
