import { LitElement, html } from "lit-element";
import "./question-card";
import { getConnection } from "../connection";
import { parseResult } from "../utils";

export class QuestionList extends LitElement {
  static get properties() {
    return {
      questions: { type: Array }
    };
  }

  firstUpdated() {
    this.responses = Array(this.questions.length).fill("");
  }

  render() {
    return html`
      <div style="padding: 16px;">
        <div class="card column center">
          ${this.questions.map(
            (question, index) => html`
              <question-card
                .question=${question}
                @update-response=${e =>
                  (this.responses[index] = e.detail.response)}
                style="margin-bottom: 16px;"
              ></question-card>
            `
          )}

          <mwc-button
            raised
            label="SUBMIT"
            @click=${() => this.submitResponses()}
          ></mwc-button>
        </div>
      </div>
      <mwc-snackbar
        id="error-label"
        labelText="Submit response failed, try again"
      >
      </mwc-snackbar>
    `;
  }

  async submitResponses() {
    const connection = await getConnection();

    try {
      for (let i = 0; i < this.responses.length; i++) {
        const responseResult = await connection("create_response", {
          question_address: this.questions[i].id,
          response: this.responses[i]
        });
        parseResult(responseResult);
      }

      window.location.href = window.location.href;
    } catch (e) {
      console.error(e);
      const snackbar = this.shadowRoot.getElementById("error-label");
      snackbar.open();
      setTimeout(() => snackbar.close(), 3000);
    }
  }
}

customElements.define("question-list", QuestionList);
