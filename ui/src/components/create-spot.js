import { LitElement, html } from "lit-element";
import { getConnection } from "../connection";
import "@material/mwc-textfield";
import "@material/mwc-button";
import "@material/mwc-textarea";
import "@authentic/mwc-select";
import "@material/mwc-snackbar";
import { sharedStyles } from "../shared";

import "./range-input";
import { parseResult } from "../utils";

export const questionTypes = ["Range"];

export class CreateSpot extends LitElement {
  constructor() {
    super();
    this.questions = [];
    this.newQuestion();
  }

  static get properties() {
    return { questions: { type: Array } };
  }

  static get styles() {
    return sharedStyles;
  }

  render() {
    return html`
      <div style="padding: 16px">
        <div class="card column content">
          <mwc-textfield
            label="Spot name"
            @change=${e => (this.spotName = e.target.value)}
            class="margin-bottom"
          ></mwc-textfield>

          ${this.questions.map(
            question => html`
              <div class="card column margin-bottom">
                <mwc-textarea
                  placeholder="Input question..."
                  @change=${e => (question.question = e.target.value)}
                  class="margin-bottom"
                ></mwc-textarea>

                <div class="row center">
                  <select
                    @change=${e => (question.question_type = e.target.value)}
                    style="margin-right: 16px;"
                  >
                    ${questionTypes.map(
                      (type, index) => html`
                        <option
                          slot="option"
                          value=${type}
                          ?selected=${index === 0}
                        >
                          ${type}
                        </option>
                      `
                    )}
                  </select>

                  ${question.question_type == "Range"
                    ? html`
                        <range-input
                          @question-changed=${e =>
                            (question.question_type = {
                              Range: {
                                min: e.detail.min,
                                max: e.detail.max
                              }
                            })}
                        ></range-input>
                      `
                    : html``}
                </div>
              </div>
            `
          )}

          <div class="row center">
            <mwc-button
              label="New question"
              @click=${() => this.newQuestion()}
              style="margin-right: 8px;"
            ></mwc-button>
            <mwc-button
              label="Create spot"
              raised
              @click=${_ => this.createSpot()}
            ></mwc-button>
          </div>
        </div>
      </div>
      <mwc-snackbar id="error-label" labelText="Create spot failed, try again">
      </mwc-snackbar>
    `;
  }

  newQuestion() {
    this.questions = [
      ...this.questions,
      { question: "", question_type: questionTypes[0] }
    ];
  }

  async createSpot() {
    const connection = await getConnection();

    try {
      const spotResult = await connection("create_spot", {
        name: this.spotName,
        timestamp: Date.now()
      });

      const spotAddress = parseResult(spotResult);

      for (const question of this.questions) {
        const questionResult = await connection("create_question", {
          question: {
            question: question.question,
            spot_address: spotAddress,
            question_type: question.question_type
          }
        });
        parseResult(questionResult);
      }
      window.location.href = "/?spot=" + spotAddress;
    } catch (e) {
      console.error(e);
      const snackbar = this.shadowRoot.getElementById("error-label");
      snackbar.open();
      setTimeout(() => snackbar.close(), 3000);
    }
  }
}

customElements.define("create-spot", CreateSpot);
