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

      var json = await resp.json();

      var dataFrame = new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'host', type: FieldType.string },
          { name: 'user-identifier', type: FieldType.string },
          { name: 'datetime', type: FieldType.time },
          { name: 'method', type: FieldType.string },
          { name: 'request', type: FieldType.string },
          { name: 'protocol', type: FieldType.string },
          { name: 'status', type: FieldType.number },
          { name: 'bytes', type: FieldType.number },
          { name: 'referer', type: FieldType.string },
        ],
      });

      var docs = json.documents;
      docs.forEach((doc: any) => {
        dataFrame.add(doc.fields);

        // var dataFrameFields: any[] = [];

        // var fields = doc.fields;
        // var fieldNames = Object.keys(fields);
        // fieldNames.forEach(fieldName => {
        //   // field values
        //   var fieldValues: any[] = [];
        //   if (fields[fieldName] === 'object') {
        //     fieldValues = fields[fieldName];
        //   } else {
        //     fieldValues.push(fields[fieldName]);
        //   }

        //   // field type
        //   var fieldType = FieldType.string;
        //   switch (typeof fieldValues[0]) {
        //     case 'string':
        //       fieldType = FieldType.string;
        //       break;
        //     case 'number':
        //       fieldType = FieldType.number;
        //       break;
        //     case 'boolean':
        //       fieldType = FieldType.boolean;
        //       break;
        //     default:
        //       fieldType = FieldType.string;
        //       break;
        //   }

        //   // data frame field
        //   var dataFrameField = {
        //     name: fieldName,
        //     type: fieldType,
        //     values: [fieldValues],
        //   };

        //   dataFrameFields.push(dataFrameField);
        // });

        // dataFrame.add(dataFrameFields);
      });

      data.push(dataFrame);
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
