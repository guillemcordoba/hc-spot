import { LitElement, html, css } from "lit-element";
import { connect } from "@holochain/hc-web-client";

class SpotList extends LitElement {

  constructor() {
    this.spots = null;
  }

  static get properties() {
    return {
      spots: { type: Array }
    };
  }

  firstUpdated() {
    
  }

  render() {
    return html`

      <div>
        <p>
          Clicked: <span>${this.clicks}</span> times. Value is
          <span>${this.value}</span>.
          <button @click="${this._onIncrement}" title="Add 1">
            ${plusIcon}
          </button>
          <button @click="${this._onDecrement}" title="Minus 1">
            ${minusIcon}
          </button>
        </p>
      </div>
    `;
  }
}

window.customElements.define("spot-list", SpotList);
