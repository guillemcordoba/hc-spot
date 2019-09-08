import { css } from "lit-element";

export const sharedStyles = css`
  .card {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    transition: 0.3s;
    border-radius: 5px; /* 5px rounded corners */
    padding: 16px;
  }

  .column {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    flex-direction: row;
  }

  .center {
    align-items: center;
    justify-content: center;
  }

  .margin-bottom {
    margin-bottom: 16px;
  }

  .content {
    max-width: 900px;
  }
`;
