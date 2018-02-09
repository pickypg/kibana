import React, {
  Component,
  Fragment,
} from 'react';
import { get } from 'lodash';

import { banners } from 'ui/notify';
import {
  EuiPanel,
  EuiTitle,
  EuiLoadingKibana,
  EuiHealth,
  EuiHorizontalRule,
  EuiCallOut,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiCodeBlock,
  EuiTableOfRecords,
  EuiIcon,
  EuiButton,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiFlyoutFooter,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiProgress,
  EuiText,
} from '@elastic/eui';
import formatNumber from './lib/format_number';

export class StatusPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      showRawResponse: false,
    };
  }

  remapPlugins(plugins) {
    if (!Array.isArray(plugins)) {
      return undefined;
    }

    return plugins.map(plugin => {
      const name = plugin.id.substring(plugin.id.indexOf(':') + 1);
      const versionIndex = name.indexOf('@');

      let state = {
        color: 'subdued',
        iconType: 'bolt',
        text: 'Unknown',
        value: 2,
      };

      switch (plugin.state) {
        case 'green':
          state = {
            color: 'success',
            iconType: 'check',
            text: 'Running',
            value: 2,
          };
          break;
        case 'yellow':
          state = {
            color: 'warning',
            iconType: 'alert',
            text: 'Warning',
            value: 1,
          };
          break;
        case 'red':
          state = {
            color: 'danger',
            iconType: 'cross',
            text: 'Error',
            value: 0,
          };
          break;
      }

      return {
        ...plugin,
        state,
        name: name.substring(0, versionIndex),
        version: name.substring(versionIndex + 1),
      };
    })
      .sort((a, b) => {
        // sorts them in ascending order so that red is highest
        const stateDiff = a.state.value - b.state.value;

        // if equal state, sort by name
        if (stateDiff === 0) {
          return a.name.localeCompare(b.name);
        }

        return stateDiff;
      });
  }

  componentWillMount() {
    fetch(this.props.api)
      .then(response => response.json())
      .then(payload => {
        banners.remove(this.props.bannerId);

        const data = {
          status: get(payload, 'status.overall'),
          plugins: this.remapPlugins(get(payload, 'status.statuses')),
          metrics: get(payload, 'metrics'),
        };

        this.setState({ data, raw: payload, loading: false });
      });
  }

  renderKeyValues(columns, keyValues) {
    return (
      <EuiFlexGroup>
        {
          keyValues.map(field => {
            return (
              <EuiFlexItem grow={1}>
                { field }
              </EuiFlexItem>
            );
          })
        }
      </EuiFlexGroup>
    );
  }

  renderHeader() {
    let status = {
      color: 'subdued',
      text: 'Loading status'
    };
    let statusJson;

    if (this.state.loading === false) {
      switch (this.state.data.status.state) {
        case 'green':
          status = { color: 'success', text: 'Running' };
          break;
        case 'yellow':
          status = { color: 'warning', text: 'Warning' };
          break;
        default:
          status = { color: 'danger', text: 'Error' };
      }

      statusJson = (
        <EuiFlexItem grow={false}>
          <EuiButton onClick={() => this.toggleRawResponse(!this.state.showRawResponse)}>
            Status JSON
          </EuiButton>
          { this.rawResponse() }
        </EuiFlexItem>
      );
    }

    return (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem>
          <EuiTitle size="l">
            <h1>
              Kibana <EuiHealth color={status.color}>{ status.text }</EuiHealth>
            </h1>
          </EuiTitle>
        </EuiFlexItem>
        { statusJson }
      </EuiFlexGroup>
    );
  }

  renderStaticContent() {
    const list = [
      {
        title: 'Server',
        description: this.props.serverInfo.name,
      },
      {
        title: 'Version',
        description: this.props.serverInfo.version,
      },
      {
        title: 'Build',
        description: `${this.props.serverInfo.buildNum}`,
      },
      {
        title: 'Commit SHA',
        description: this.props.serverInfo.buildSha.substr(0, 8),
      },
    ];

    return (
      <EuiPanel>
        <EuiDescriptionList
          listItems={list}
          type="column"
          align="center"
          compressed
        />
      </EuiPanel>
    );

    // return this.renderKeyValues(4, columns);
  }

  renderLoading() {
    return (
      <EuiFlexGroup justifyContent="spaceAround">
        <EuiFlexItem grow={false}>
          <EuiSpacer size="xl" />
          <EuiLoadingKibana size="xl"/>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderMetrics() {
    const { metrics } = this.state.data;
    const heap = {
      used: get(metrics, 'process.mem.heap_used_in_bytes'),
      total: get(metrics, 'process.mem.heap_max_in_bytes')
    };
    const fields = [
      {
        key: 'Heap total',
        value: formatNumber(heap.total, 'byte'),
      },
      {
        key: 'Used',
        value: formatNumber(heap.used, 'byte'),
      },
      {
        key: 'Response Time Avg',
        value: formatNumber(get(metrics, 'response_times.avg_in_millis'), 'ms'),
      },
      {
        key: 'Max',
        value: formatNumber(get(metrics, 'response_times.max_in_millis'), 'ms'),
      },
      {
        key: 'Requests per second',
        value: formatNumber(get(metrics, 'requests.total') * 1000 / get(metrics, 'collection_interval_in_millis')),
      },
      {
        key: 'System Load',
        value: `
          ${formatNumber(get(metrics, 'os.cpu.load_average.1m'))},
          ${formatNumber(get(metrics, 'os.cpu.load_average.5m'))},
          ${formatNumber(get(metrics, 'os.cpu.load_average.15m'))}
        `,
      },
    ];

    const flexColumns = { flexDirection: 'column' };
    const centerPanel = {
      justifyContent: 'center',
      textAlign: 'center'
    };

    const columns = [
      this.renderStaticContent(),
      <EuiPanel>
        <EuiDescriptionList
          type="column"
          align="center"
        >
          <EuiDescriptionListTitle>
            { fields[0].key }
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription>
            { fields[0].value }
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
        <EuiSpacer size="s" />
        <EuiProgress value={heap.used} max={heap.total} color="secondary" size="l" />
        <EuiDescriptionList
          type="column"
          align="center"
        >
          <EuiDescriptionListTitle>
            { fields[1].key }
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription>
            { fields[1].value }
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiPanel>,
      <EuiPanel className="euiFlexItem" style={centerPanel}>
        <EuiText>
          { fields[2].key }
        </EuiText>
        <EuiSpacer size="s" />
        <EuiText color="secondary">
          <EuiTitle size="l">
            <h1>{ fields[2].value }</h1>
          </EuiTitle>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiDescriptionList
          type="column"
          align="center"
          compressed
        >
          <EuiDescriptionListTitle>
            { fields[3].key }
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription>
            { fields[3].value }
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiPanel>,
      <EuiPanel className="euiFlexItem" style={centerPanel}>
        <EuiText>
          { fields[4].key }
        </EuiText>
        <EuiSpacer size="s" />
        <EuiText color="secondary">
          <EuiTitle size="l">
            <h1>{ fields[4].value }</h1>
          </EuiTitle>
        </EuiText>
      </EuiPanel>,
      <EuiPanel className="euiFlexItem" style={centerPanel}>
        <EuiText>
          { fields[5].key }
        </EuiText>
        <EuiText color="secondary">
          <EuiTitle size="l">
            <h1>{ fields[5].value }</h1>
          </EuiTitle>
        </EuiText>
      </EuiPanel>,
    ];

    return this.renderKeyValues(5, columns);
  }

  renderPlugins() {
    const {
      plugins
    } = this.state.data;

    const config = {
      recordId: 'id',
      columns: [
        {
          field: 'state',
          name: 'State',
          description: 'The state that the plugins flagged itself in.',
          width: '100px',
          align: 'right',
          render: state => {
            return (
              <EuiFlexGroup gutterSize="xs" alignItems="center">
                <EuiFlexItem grow={false}>
                  <EuiIcon
                    type={state.iconType}
                    color={state.color}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  { state.text }
                </EuiFlexItem>
              </EuiFlexGroup>
            );
          }
        },
        {
          field: 'name',
          name: 'Plugin',
          description: 'Plugin Name. Many plugins are provided by Kibana itself.',
          dataType: 'string',
        },
        {
          field: 'version',
          name: 'Version',
          description: 'Plugin version. Plugins loaded by Kibana should have the same version as Kibana.',
          dataType: 'string',
          width: '100px',
        },
        {
          field: 'message',
          name: 'Description',
          description: 'Description provided by the plugin to describe its current state.',
          dataType: 'string',
        }
      ],
    };
    const model = {
      data: {
        records: plugins,
        totalRecordCount: plugins.length,
      },
    };

    return <EuiTableOfRecords config={config} model={model} />;
  }

  toggleRawResponse(toggle) {
    this.setState({ showRawResponse: toggle });
  }

  rawResponse() {
    if (this.state.showRawResponse === false) {
      return undefined;
    }

    return (
      <EuiFlyout
        onClose={() => this.toggleRawResponse(false)}
        size="s"
      >
        <EuiFlyoutHeader>
          <EuiTitle>
            <h2>Status JSON</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiCodeBlock language="js" fontSize="l" paddingSize="s" color="dark">
            {JSON.stringify(this.state.raw, null, ' ')}
          </EuiCodeBlock>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiButton onClick={() => this.toggleRawResponse(false)}>
            Close
          </EuiButton>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }

  renderPluginSection() {
    return (
      <Fragment>
        <EuiTitle>
          <h2>Plugins</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiCallOut
          iconType="questionInCircle"
          title="Plugins come from both Kibana itself and plugins that the administrator has installed."
        />
        <EuiSpacer size="s" />
        { this.renderPlugins() }
      </Fragment>
    );
  }

  renderDynamicContent() {
    return (
      <Fragment>
        { this.renderMetrics() }
        <EuiSpacer size="s" />
        { this.renderPluginSection() }
      </Fragment>
    );
  }

  render() {
    const body = this.state.loading ? this.renderLoading() : this.renderDynamicContent();

    const panelStyle = {
      border: 'none'
    };

    return (
      <EuiPanel style={panelStyle}>
        { this.renderHeader() }
        <EuiHorizontalRule size="xs" />
        { body }
      </EuiPanel>
    );
  }

}
