/**
 * MeshCentral Plugin: Installed Software Viewer
 * Author: XavorUser
 * Description: Adds a tab to view installed software from Windows endpoints.
 */

module.exports = {
  //
  // --- Called when a device page is refreshed ---
  //
  onDeviceRefreshEnd: function (panel, parent) {
    parent.registerPluginTab({
      tabId: "installedsoftware",
      tabTitle: "Installed Software"
    });
  },

  //
  // --- Inject frontend logic when UI loads ---
  //
  onWebUIStartupEnd: function () {
    const script = `
      if (window.meshclient) {
        window.getInstalledSoftware = function() {
          const cmd = 'powershell -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion | Sort DisplayName"';
          meshclient.sendCommand({ action: 'run', type: 'cmd', cmd: cmd });
          document.getElementById('installedSoftwareOutput').textContent = 'Collecting list...';
        };

        meshclient.on('run', function(response) {
          const outputElem = document.getElementById('installedSoftwareOutput');
          if (!outputElem) return;
          if (response.stdout) {
            outputElem.textContent = response.stdout;
          } else if (response.stderr) {
            outputElem.textContent = 'Error: ' + response.stderr;
          }
        });
      }
    `;
    const scriptElem = document.createElement('script');
    scriptElem.textContent = script;
    document.head.appendChild(scriptElem);
  },

  //
  // --- Render our custom tab content ---
  //
  onPluginTabRender: function (tabId) {
    if (tabId === "installedsoftware") {
      return `
        <div style="padding:10px">
          <h3>Installed Software</h3>
          <button class="btn btn-primary" onclick="getInstalledSoftware()">Get Installed Software</button>
          <pre id="installedSoftwareOutput" style="margin-top:10px; background:#000; color:#0f0; padding:10px; height:400px; overflow:auto;"></pre>
        </div>
      `;
    }
  }
};
