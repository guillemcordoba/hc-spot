import { connect } from "@holochain/hc-web-client";

export async function getConnection() {
  if (window.connection) return window.connection;
  else {
    return new Promise(resolve => {
      connect({ url: "ws://localhost:8888" }).then(({ callZome }) => {
        window.connection = (funcName, params) =>
          callZome("test-instance", "spot", funcName)(params);
        resolve(window.connection);
      });
    });
  }
}
