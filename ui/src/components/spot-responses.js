import { LitElement, html } from "lit-element";
import { sharedStyles } from "../shared";
import "sigma/build/sigma";

export class SpotResponses extends LitElement {
  static get properties() {
    return {
      responses: { type: Array },
      questions: { type: Array },
      me: { type: String }
    };
  }

  static get styles() {
    return sharedStyles;
  }

  getResponses(questionAddress) {
    return this.responses.filter(
      response => response.question_address === questionAddress
    );
  }

  firstUpdated() {
    const g = {
      nodes: [],
      edges: []
    };

    const agents = {};

    this.responses.forEach(response => agents[response.agent_address]);

    g.nodes = Object.keys(agents).map(agent => ({
      id: agent,
      label: agent,
      x: Math.random(),
      y: Math.random()
    }));

    const connections = {};

    for (const question of this.questions) {
      const responses = this.getResponses(question.id);
      const myResponse = responses.find(
        response => response.agent_address === this.me
      );
      for (const response of responses) {
        if (!connections[response.agent_address]) {
          connections[response.agent_address] = 0;
        }

        connections[response.agent_address] +=
          parseInt(response.response) - parseInt(myResponse.response);
      }
    }

    for (const agent of Object.keys(connections)) {
      g.edges.push({
        id: agent,
        source: this.me,
        size: connections[agent]
      });
    }

    const s = new sigma({
      graph: g,
      renderer: {
        container: this.shadowRoot.getElementById("graph"),
        type: "canvas"
      }
    });
  }

  render() {
    return html`
      ${this.questions.map(
        question => html`
          <h3>${question.question}</h3>
          ${this.getResponses(question.id).map(
            response => html`
              <span>${response.agent_address}: ${response.response}</span>
            `
          )}
        `
      )}
    `;
  }
}

customElements.define("spot-responses", SpotResponses);
