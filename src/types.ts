import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  indexName: string;
  timestampField: string;
  queryString: string;
  fieldList: string;
}

export const defaultQuery: Partial<MyQuery> = {
  indexName: 'logs',
  timestampField: 'timestamp',
  queryString: '*',
  fieldList: '*',
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  endpoint: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey: string;
}
