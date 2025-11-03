/**
 * MeshCentral Plugin - Installed Software Viewer (Windows)
 * Adds a "Installed Software" tab on each device page and runs a PowerShell query on demand.
 * No MeshAgent modification required.
 */
"use strict";

module.exports.installedsoftware = function (parent) {
  const obj = {};
  obj.parent = parent;

  // Exported Web UI hooks
  obj.exports = [
    "onDeviceRefreshEnd",
    "onWebUIStartupEnd",
    "onPluginTabRender"
  ];

  // 1) Add our tab to the device page
  obj.onDeviceRefreshEnd = function (panel, ui) {
    if (ui && typeof ui.registerPluginTab === "function") {
      ui.registerPluginTab({
        tabId: "installedsoftware",
        tabTitle: "Installed Software"
      });
    }
  };

  // 2) Inject client-side logic (runs in the browser)
  obj.onWebUIStartupEnd = function () {
    const injected = `
      // Send the PowerShell command to the Mesh agent (Windows only)
      window._installedSoftware_send = function () {
        try {
          var cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
                  + '$items = Get-ItemProperty HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*, '
                  + 'HKLM:\\\\Software\\\\WOW6432Node\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*; '
                  + '$items | Where-Object { $_.DisplayName } '
                  + '| Select-Object DisplayName, DisplayVersion '
                  + '| Sort-Object DisplayName '
                  + '| Format-Table -AutoSize"';

          var out = document.getElementById('installedSoftwareOutput');
          if (out) out.textContent = 'Collecting list...';

          if (typeof meshserver !== 'undefined' && meshserver.sendCommand) {
            meshserver.sendCommand({ action: 'run', type: 'cmd', cmd: cmd });
          } else if (typeof meshclient !== 'undefined' && meshclient.sendCommand) {
            meshclient.sendCommand({ action: 'run', type: 'cmd', cmd: cmd });
          } else {
            alert('Unable to access Mesh agent command channel from this UI context.');
          }
        } catch (e) {
          alert('Error: ' + e);
        }
      };

      // Handle command output events
      (function () {
        var handler = function (response) {
          var out = document.getElementById('installedSoftwareOutput');
          if (!out) return;
          if (response && response.stdout) {
            out.textContent = response.stdout;
          } else if (response && response.stderr) {
            out.textContent = 'Error: ' + response.stderr;
          }
        };

        if (typeof meshserver !== 'undefined' && meshserver.on) {
          meshserver.on('run', handler);
        } else if (typeof meshclient !== 'undefined' && meshclient.on) {
          meshclient.on('run', handler);
        }
      })();
    `;
    var s = document.createElement('script');
    s.textContent = injected;
    document.head.appendChild(s);
  };

  // 3) Render the tab contents
  obj.onPluginTabRender = function (tabId) {
    if (tabId !== "installedsoftware") return;
    return `
      <div style="padding:10px">
        <h3>Installed Software (Windows)</h3>
        <button class="btn btn-primary" onclick="_installedSoftware_send()">Get Installed Software</button>
        <pre id="installedSoftwareOutput" style="margin-top:10px;background:#0b0b0b;color:#e5ffe5;padding:10px;height:420px;overflow:auto;border-radius:6px;"></pre>
        <div style="margin-top:6px;font-size:12px;color:#888">
          Runs a PowerShell query via MeshAgent on-demand. No agent modification required.
        </div>
      </div>
    `;
  };

  return obj;
};
