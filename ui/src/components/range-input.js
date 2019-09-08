import { LitElement, html } from "lit-element";
import "@material/mwc-textfield";
import { sharedStyles } from "../shared";

export class RangeInput extends LitElement {
  static get styles() {
    return sharedStyles;
  }

  render() {
    return html`
      <div class="row">
        <mwc-textfield
          type="number"
          label="Min"
          @change=${e => {
            this.min = e.target.value;
            this.updateRange();
          }}
          style="margin-right: 8px;"
        ></mwc-textfield>
        <mwc-textfield
          type="number"
          label="Max"
          @change=${e => {
            this.max = e.target.value;
            this.updateRange();
          }}
        ></mwc-textfield>
      </div>
    `;
  }

  updateRange() {
    this.dispatchEvent(
      new CustomEvent("question-changed", {
        detail: { min: parseInt(this.min), max: parseInt(this.max) }
      })
    );
  }
}

customElements.define("range-input", RangeInput);
