import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  endpoint: string | undefined;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.endpoint = instanceSettings.jsonData.endpoint;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();
    const endpoint = this.endpoint;

    // Return a constant for each query.
    const data = options.targets.map(async function(target) {
      const query = defaults(target, defaultQuery);

      const indexName = target.indexName;

      var url = `${endpoint}/v1/indexes/${indexName}/_search`;

      let headers = {
        'Content-Type': 'application/json',
      };

      let method = 'POST';

      let body = {
        query: `${query.queryText}`,
        start: 0,
        num: 1000,
        sort_by: '-_score',
      };

      console.log('url', url);
      console.log('headers', headers);
      console.log('method', method);
      console.log('body', body);

      const resp = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      })
        .then(response => {
          console.log('status', response.status);
          return response.json();
        })
        .catch(error => {
          console.log('error', error);
          return `{}`;
        });

      console.log('resp', resp);

      return new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Time', values: [from, to], type: FieldType.time },
          { name: 'Value', values: [query.constant, query.constant], type: FieldType.number },
        ],
      });
    });

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    if (!this.endpoint) {
      return {
        status: 'failure',
        message: 'Missing endpoint',
      };
    }

    var url = `${this.endpoint}/readyz`;

    let headers = {
      'Content-Type': 'application/json',
    };

    console.log('url', url);
    console.log('headers', headers);

    const resp = await fetch(url, {
      method: 'GET',
      headers: headers,
    })
      .then(response => {
        if (response.status === 200) {
          return {
            status: 'success',
            message: 'Success',
          };
        } else {
          return {
            status: 'failure',
            message: `Failure to connect. Status code: ${response.status}`,
          };
        }
      })
      .catch(error => {
        return {
          status: 'failure',
          message: 'Failure to connect. Error: ' + error.message,
        };
      });

    console.log('message', resp.message);

    return resp;
  }
}
