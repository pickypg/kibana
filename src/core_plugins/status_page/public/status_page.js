import React from 'react';
import ReactDOM from 'react-dom';
import { banners, } from 'ui/notify';
import 'ui/autoload/styles';
import { uiModules } from 'ui/modules';
import { StatusPage } from './status_component';
import {
  EuiCallOut,
} from '@elastic/eui';

const chrome = require('ui/chrome')
  .setRootTemplate(require('plugins/status_page/status_page.html'))
  .setRootController('ui', function (kbnVersion, buildNum, buildSha, serverName) {
    const serverInfo = {
      version: kbnVersion,
      buildNum: buildNum,
      buildSha: buildSha,
      name: serverName,
    };

    const bannerId = banners.add({
      component: (
        <EuiCallOut
          title="Loading Kibana status from server"
          iconType="alert"
          color="warning"
        >
          If this message remains for more than a few seconds,
          something is significantly slowing down the Kibana server.
        </EuiCallOut>
      )
    });

    ReactDOM.render(
      <StatusPage
        api={chrome.addBasePath('/api/status')}
        bannerId={bannerId}
        serverInfo={serverInfo}
      />,
      document.getElementById('statusPageContainer')
    );
  });

uiModules.get('kibana')
  .config(appSwitcherEnsureNavigationProvider => {
    appSwitcherEnsureNavigationProvider.forceNavigation(true);
  });
