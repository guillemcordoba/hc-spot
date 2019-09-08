import { LitElement, html } from "lit-element";
import { getConnection } from "../connection";
import "@material/mwc-linear-progress";
import "@material/mwc-snackbar";
import "./question-list";
import "./spot-responses";

import { parseResult, parseEntriesResults, parseEntryResult } from "../utils";
import { sharedStyles } from "../shared";

export class SpotDetail extends LitElement {
  constructor() {
    super();
  }

  static get styles() {
    return sharedStyles;
  }

  static get properties() {
    return {
      spotId: { type: String },
      spot: { type: Object },
      questions: { type: Array },
      responses: { type: Array },
      me: { type: String }
    };
  }

  async firstUpdated() {
    const connection = await getConnection();
    const meResult = await connection("me", {});
    this.me = parseResult(meResult);

    const spotResult = await connection("get_entry", {
      address: this.spotId
    });
    const questionsResult = await connection("get_spot_questions", {
      spot_address: this.spotId
    });
    const responsesResult = await connection("get_spot_responses", {
      spot_address: this.spotId
    });

    this.spot = parseEntryResult(spotResult);

    if (!this.spot) {
      window.location.href = "/";
    }

    this.questions = parseEntriesResults(questionsResult);
    this.responses = parseEntriesResults(responsesResult);
  }

  hasAlreadyAnswered() {
    console.log(this.responses)
    return !!this.responses.find(
      response => response.agent_address === this.me
    );
  }

  render() {
    return html`
      <div class="content" style="padding: 16px;">
        ${!this.questions
          ? html`
              <mwc-linear-progress></mwc-linear-progress>
            `
          : html`
              <div class="column card">
                <h1>${this.spot.name}</h1>

                ${this.hasAlreadyAnswered()
                  ? html`
                      <spot-responses
                        .questions=${this.questions}
                        .responses=${this.responses}
                        .me=${this.me}
                      ></spot-responses>
                    `
                  : html`
                      <question-list
                        .questions=${this.questions}
                      ></question-list>
                    `}
              </div>
            `}
      </div>
    `;
  }
}

customElements.define("spot-detail", SpotDetail);
