/**
 * @description MeshCentral Plugin - Installed Software Viewer
 * @author Subyyalx
 */

"use strict";

module.exports.installedsoftware = function (parent) {
  const obj = {};
  obj.parent = parent;
  obj.exports = ["onDeviceRefreshEnd", "onWebUIStartupEnd", "onPluginTabRender"];

  // 1️⃣  Add the tab to each device page
  obj.onDeviceRefreshEnd = function (panel, parentUI) {
    parentUI.registerPluginTab({
      tabId: "installedsoftware",
      tabTitle: "Installed Software"
    });
  };

  // 2️⃣  Inject browser-side logic
  obj.onWebUIStartupEnd = function () {
    const script = `
      if (window.meshclient) {
        window.getInstalledSoftware = function() {
          const cmd = 'powershell -Command "Get-ItemProperty HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\* | Select-Object DisplayName, DisplayVersion | Sort DisplayName"';
          meshclient.sendCommand({ action: 'run', type: 'cmd', cmd: cmd });
          document.getElementById('installedSoftwareOutput').textContent = 'Collecting list...';
        };
        meshclient.on('run', function(response) {
          const el = document.getElementById('installedSoftwareOutput');
          if (!el) return;
          el.textContent = response.stdout || ('Error: ' + response.stderr);
        });
      }
    `;
    const el = document.createElement('script');
    el.textContent = script;
    document.head.appendChild(el);
  };

  // 3️⃣  Render HTML inside the new tab
  obj.onPluginTabRender = function (tabId) {
    if (tabId !== "installedsoftware") return;
    return `
      <div style="padding:10px">
        <h3>Installed Software</h3>
        <button class="btn btn-primary" onclick="getInstalledSoftware()">Get Installed Software</button>
        <pre id="installedSoftwareOutput" style="margin-top:10px; background:#000; color:#0f0; padding:10px; height:400px; overflow:auto;"></pre>
      </div>
    `;
  };

  return obj;
};
