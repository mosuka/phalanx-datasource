import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

const MAX_INT32 = 2147483647;

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  endpoint: string | undefined;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.endpoint = instanceSettings.jsonData.endpoint;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    // const { range } = options;
    // const from = range!.from.valueOf();
    // const to = range!.to.valueOf();
    const endpoint = this.endpoint;

    // Return a constant for each query.
    var data: Array<MutableDataFrame<any>> = [];
    for (var i = 0; i < options.targets.length; i++) {
      var target = options.targets[i];

      const query = defaults(target, defaultQuery);
      const indexName = target.indexName;
      var url = `${endpoint}/v1/indexes/${indexName}/_search`;
      let headers = {
        'Content-Type': 'application/json',
      };

      let body = {
        query: `${query.queryText}`,
        start: 0,
        num: MAX_INT32,
        sort_by: '-datetime',
        fields: ['host', 'user-identifier', 'datetime', 'method', 'request', 'protocol', 'status', 'bytes', 'referer'],
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });
      console.log('status', resp.status);

      var json = await resp.json();
      console.log('json', json);

      var docs = json.documents;
      docs.forEach((doc: any) => {
        var dataFrameFields: any[] = [];

        var fields = doc.fields;
        var fieldNames = Object.keys(fields);
        fieldNames.forEach(fieldName => {
          var fieldValues: any[] = [];
          if (fields[fieldName] === 'object') {
            fieldValues = fields[fieldName];
          } else {
            fieldValues.push(fields[fieldName]);
          }

          fieldValues.forEach(fieldValue => {
            // Single value
            var fieldType = FieldType.string;
            switch (typeof fieldValues) {
              case 'string':
                fieldType = FieldType.string;
                break;
              case 'number':
                fieldType = FieldType.number;
                break;
              case 'boolean':
                fieldType = FieldType.boolean;
                break;
              default:
                fieldType = FieldType.string;
                break;
            }

            var dataFrameField = {
              name: fieldName,
              type: fieldType,
              values: [fieldValues],
            };
            dataFrameFields.push(dataFrameField);
          });
        });

        data.push(
          new MutableDataFrame({
            refId: query.refId,
            fields: dataFrameFields,
          })
        );
      });
    }

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
