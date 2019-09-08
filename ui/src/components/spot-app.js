import { LitElement, html } from "lit-element";
import "./create-spot";
import "./spot-detail";

export class SpotApp extends LitElement {
  static get properties() {
    return {
      spotId: { type: Number }
    };
  }

  firstUpdated() {
    var url = new URL(window.location);
    this.spotId = url.searchParams.get("spot");
  }

  render() {
    return html`
      ${this.spotId
        ? html`
            <spot-detail .spotId=${this.spotId}></spot-detail>
          `
        : html`
            <create-spot></create-spot>
          `}
    `;
  }
}

customElements.define("spot-app", SpotApp);
