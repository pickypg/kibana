/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Client, HttpConnection } from '@elastic/elasticsearch';
import url from 'url';
import { Either, fromNullable, chain, getOrElse, toError } from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import { ToolingLog } from '@kbn/tooling-log';
import { FtrService } from '../ftr_provider_context';
import { print } from './utils';

const pluck =
  (key: string) =>
  (obj: any): Either<Error, string> =>
    fromNullable(new Error(`Missing ${key}`))(obj[key]);

const query = {
  aggs: {
    savedobjs: {
      terms: {
        field: 'type',
      },
    },
  },
};

export const types =
  (node: string) =>
  async (index: string = '.kibana') =>
    await pipe(
      TE.tryCatch(
        async () => {
          const body = await new Client({
            node,
            Connection: HttpConnection,
            requestTimeout: 30_000,
          }).search({
            index,
            size: 0,
            ...query,
          });
          return body;
        },
        (reason: any) => toError(reason)
      ),
      TE.map((resp: any) =>
        flow(
          pluck('aggregations'),
          chain(pluck('savedobjs')),
          chain(pluck('buckets')),
          getOrElse((err: Error) => err.message)
        )(resp)
      ),
      TE.fold((x) => T.of(`Error while searching for saved object types: ${x}`), T.of)
    )();

export class SavedObjectInfoService extends FtrService {
  private readonly config = this.ctx.getService('config');

  public async logSoTypes(log: ToolingLog, msg: string | null = null) {
    // @ts-ignore
    pipe(await types(url.format(this.config.get('servers.elasticsearch'))), print(log)(msg));
  }
}
