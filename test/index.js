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
  // Make a call to a Zome function
  // indicating the function, and passing it an input
  const addr = await alice.call("spot", "create_spot", {
    timestamp: Date.now()
  });

  t.equals(addr, true);
});

diorama.run();
