import { LitElement, html } from "lit-element";
import "@material/mwc-slider";
import "@material/mwc-button";
import { sharedStyles } from "../shared";

export class RangeQuestion extends LitElement {
  static get styles() {
    return sharedStyles;
  }

  static get properties() {
    return {
      range: { type: Object }
    };
  }

  firstUpdated() {
    this.shadowRoot
      .getElementById("slider")
      .addEventListener("MDCSlider:change", e =>
        this.dispatchEvent(
          new CustomEvent("update-response", {
            detail: { response: JSON.stringify(e.target.value) },
            bubbles: true,
            composed: true
          })
        )
      );
  }

  render() {
    return html`
      <div class="column">
        <mwc-slider
          id="slider"
          markers
          .discrete=${true}
          min=${this.range.min}
          max=${this.range.max}
          value=${(this.range.max - this.range.min) / 2 + this.range.min}
        ></mwc-slider>
      </div>
    `;
  }
}

customElements.define("range-question", RangeQuestion);
