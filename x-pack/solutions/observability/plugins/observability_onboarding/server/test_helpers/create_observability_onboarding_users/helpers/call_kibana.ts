/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { once } from 'lodash';
import { Elasticsearch, Kibana } from '..';

export async function callKibana<T>({
  elasticsearch,
  kibana,
  options,
}: {
  elasticsearch: Omit<Elasticsearch, 'node'>;
  kibana: Kibana;
  options: AxiosRequestConfig;
}): Promise<T> {
  const baseUrl = await getBaseUrl(kibana.hostname);
  const { username, password } = elasticsearch;

  const { data } = await axios.request({
    ...options,
    baseURL: baseUrl,
    allowAbsoluteUrls: false,
    auth: { username, password },
    headers: { 'kbn-xsrf': 'true', 'x-elastic-internal-origin': 'kibana', ...options.headers },
  });
  return data;
}

const getBaseUrl = once(async (kibanaHostname: string) => {
  try {
    await axios.request({
      url: kibanaHostname,
      maxRedirects: 0,
      headers: { 'x-elastic-internal-origin': 'kibana' },
    });
  } catch (e) {
    if (isAxiosError(e)) {
      const location = e.response?.headers?.location ?? '';
      const hasBasePath = RegExp(/^\/\w{3}$/).test(location);
      const basePath = hasBasePath ? location : '';
      return `${kibanaHostname}${basePath}`;
    }

    throw e;
  }
  return kibanaHostname;
});

export function isAxiosError(e: AxiosError | Error): e is AxiosError {
  return 'isAxiosError' in e;
}

export class AbortError extends Error {
  constructor(message: string) {
    super(message);
  }
}
