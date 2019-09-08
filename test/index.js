const path = require("path");
const tape = require("tape");

const {
  Diorama,
  tapeExecutor,
  backwardCompatibilityMiddleware
} = require("@holochain/diorama");

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  console.error("got unhandledRejection:", error);
});

const dnaPath = path.join(__dirname, "../dist/spot.dna.json");
const dna = Diorama.dna(dnaPath, "spot");

const diorama = new Diorama({
  instances: {
    alice: dna,
    bob: dna
  },
  bridges: [],
  debugLog: false,
  executor: tapeExecutor(require("tape")),
  middleware: backwardCompatibilityMiddleware
});

diorama.registerScenario("create a spot", async (s, t, { alice }) => {
  const { Ok: addr } = await alice.call("spot", "create_spot", {
    timestamp: Date.now()
  });

  t.equals(addr.startsWith("Qm"), true);
});

diorama.registerScenario(
  "create a spot and questions",
  async (s, t, { alice }) => {
    const { Ok: addr } = await alice.call("spot", "create_spot", {
      name: "impressing",
      timestamp: Date.now()
    });

    t.equals(addr.startsWith("Qm"), true);

    const { Ok: questionAddress } = await alice.call(
      "spot",
      "create_question",
      {
        question: {
          question: "How are you?",
          spot_address: addr,
          question_type: {
            Range: {
              min: 0,
              max: 10
            }
          }
        }
      }
    );

    t.equals(questionAddress.startsWith("Qm"), true);
  }
);

diorama.registerScenario(
  "create a spot, a range question and an answer",
  async (s, t, { alice }) => {
    const { Ok: addr } = await alice.call("spot", "create_spot", {
      name: "impressing",
      timestamp: Date.now()
    });

    t.equals(addr.startsWith("Qm"), true);

    const { Ok: questionAddress } = await alice.call(
      "spot",
      "create_question",
      {
        question: {
          question: "How are you?",
          spot_address: addr,
          question_type: {
            Range: {
              min: 0,
              max: 10
            }
          }
        }
      }
    );

    t.equals(questionAddress.startsWith("Qm"), true);

    const { Ok: responseAddress } = await alice.call(
      "spot",
      "create_response",
      {
        question_address: questionAddress,
        response: "5"
      }
    );

    t.equals(responseAddress.startsWith("Qm"), true);
  }
);

diorama.registerScenario(
  "create incorrect answers",
  async (s, t, { alice }) => {
    const { Ok: addr } = await alice.call("spot", "create_spot", {
      name: "impressing",
      timestamp: Date.now()
    });

    t.equals(addr.startsWith("Qm"), true);

    const { Ok: questionAddress } = await alice.call(
      "spot",
      "create_question",
      {
        question: {
          question: "How are you?",
          spot_address: addr,
          question_type: {
            Range: {
              min: 0,
              max: 10
            }
          }
        }
      }
    );

    t.equals(questionAddress.startsWith("Qm"), true);

    const result = await alice.call("spot", "create_response", {
      question_address: questionAddress,
      response: "100"
    });

    t.equals(
      result.Err.Internal.includes("Response number is outside the range"),
      true
    );
  }
);

diorama.run();
