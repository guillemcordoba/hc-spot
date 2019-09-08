import { LitElement, html } from "lit-element";
import "./range-question";
import { sharedStyles } from "../shared";

export class QuestionCard extends LitElement {
  static get styles() {
    return sharedStyles;
  }

  static get properties() {
    return {
      question: { type: Object }
    };
  }

  render() {
    return html`
      <div class="card column">
        <span style="font-weight: bold">${this.question.question}</span>

        ${Object.keys(this.question.question_type)[0] === "Range"
          ? html`
              <range-question
                .range=${this.question.question_type.Range}
              ></range-question>
            `
          : html`
              <span>Question type not found</span>
            `}
      </div>
    `;
  }
}

customElements.define("question-card", QuestionCard);
