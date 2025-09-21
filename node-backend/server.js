const express = require("express");
const Web3 = require("web3");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Ganache RPC endpoint
// const web3 = new Web3("http://192.168.100.12:7545");
const web3 = new Web3("https://ethereum-sepolia.rpc.subquery.network/public");
// Replace with your deployed contract ABI & address
const contractABI = require("./VotingABI.json");
const contractAddress = "0x2bd1f45fe793b5057401500c2fccea1677d72496"; // deployed contract

const votingContract = new web3.eth.Contract(contractABI, contractAddress);

// Server wallet (from Ganache)
const serverAccount = "0x514f2160831880228596a7bE6094A61E9B6d62f8";
const privateKey =
  "36306509366080fce51467e0e8b0c8702b93b8215d1cf46f997c7e59f5b9a145";

/**
 * Helper: send signed transaction
 */
async function sendTransaction(tx) {
  const gas = await tx.estimateGas({ from: serverAccount });
  const data = tx.encodeABI();

  const signedTx = await web3.eth.accounts.signTransaction(
    {
      to: contractAddress,
      data,
      gas,
    },
    privateKey
  );

  return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

/**
 * ========== ROUTES ==========
 */

// Cast vote
app.post("/vote", async (req, res) => {
  const { electionId, candidateIds, email } = req.body;
  try {
    const tx = votingContract.methods.vote(electionId, candidateIds, email);
    const receipt = await sendTransaction(tx);
    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create election
app.post("/create-election", async (req, res) => {
  const { name, start, end, domainFilter, email } = req.body;
  try {
    const tx = votingContract.methods.createElection(
      name,
      start,
      end,
      domainFilter,
      email
    );
    const receipt = await sendTransaction(tx);

    const electionId = await votingContract.methods.electionCount().call();
    res.json({ status: "success", txHash: receipt.transactionHash, electionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get election count
app.get("/get-election-count", async (req, res) => {
  try {
    const electionCount = await votingContract.methods.electionCount().call();
    res.json({ electionCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add multiple candidates
app.post("/add-candidates", async (req, res) => {
  const { electionId, candidates } = req.body;
  try {
    const tx = votingContract.methods.addCandidates(
      electionId,
      candidates.map((c) => c.name),
      candidates.map((c) => c.position),
      candidates.map((c) => c.platform),
      candidates.map((c) => c.cdn),
      candidates.map((c) => c.partylist)
    );
    const receipt = await sendTransaction(tx);
    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update election
app.post("/update-election", async (req, res) => {
  const { electionId, name, startDate, endDate, domainFilter, email } = req.body;
  try {
    const tx = votingContract.methods.updateElection(
      electionId,
      name,
      startDate,
      endDate,
      domainFilter,
      email
    );
    const receipt = await sendTransaction(tx);
    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owned elections
app.post("/get-owned-elections", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await votingContract.methods.getOwnedElections(email).call();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-owned-election-names", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await votingContract.methods
      .getOwnedElectionNames(email)
      .call();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-owned-election-ids", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await votingContract.methods
      .getOwnedElectionIds(email)
      .call();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Election lookups
app.post("/get-election-id-by-name", async (req, res) => {
  const { name } = req.body;
  try {
    const electionId = await votingContract.methods
      .getElectionIdByName(name)
      .call();
    res.json({ electionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-election-results", async (req, res) => {
  const { electionId } = req.body;
  try {
    const results = await votingContract.methods
      .getElectionResults(electionId)
      .call();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-election-details", async (req, res) => {
  const { electionId } = req.body;
  try {
    const details = await votingContract.methods
      .getElectionDetails(electionId)
      .call();
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get candidates
app.post("/get-election-candidates", async (req, res) => {
  const { electionId } = req.body;
  try {
    const result = await votingContract.methods
      .getElectionCandidates(electionId)
      .call();

    const candidates = result[0].map((name, i) => ({
      name,
      position: result[1][i],
      platform: result[2][i],
      cdn: result[3][i],
      partylist: result[4][i],
    }));

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-election-candidate-count", async (req, res) => {
  const { electionId } = req.body;
  try {
    const count = await votingContract.methods
      .getElectionCandidateCount(electionId)
      .call();
    res.json({ candidateCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update candidate
app.post("/update-candidate", async (req, res) => {
  const { electionId, candidateId, name, position, platform, cdn, partylist } =
    req.body;
  try {
    const tx = votingContract.methods.updateCandidate(
      electionId,
      candidateId,
      name,
      position,
      platform,
      cdn,
      partylist
    );
    const receipt = await sendTransaction(tx);
    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate lookups
app.post("/get-candidate-id-by-name", async (req, res) => {
  const { electionId, name } = req.body;
  try {
    const id = await votingContract.methods
      .getCandidateIdByName(electionId, name)
      .call();
    res.json({ candidateId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/delete-candidate", async (req, res) => {
  const { electionId, candidateId } = req.body;
  try {
    const tx = votingContract.methods.deleteCandidate(electionId, candidateId);
    const receipt = await sendTransaction(tx);
    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-election-candidate", async (req, res) => {
  const { electionId, candidateId } = req.body;
  try {
    const candidate = await votingContract.methods
      .getElectionCandidate(electionId, candidateId)
      .call();
    res.json({
      name: candidate[0],
      position: candidate[1],
      platform: candidate[2],
      cdn: candidate[3],
      partylist: candidate[4],
      votes: candidate[5],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close election
app.post("/close-election", async (req, res) => {
  const { electionId } = req.body;
  try {
    const tx = votingContract.methods.closeElection(electionId);
    const receipt = await sendTransaction(tx);
    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/is-election-open", async (req, res) => {
  const { electionId } = req.body;
  try {
    const isOpen = await votingContract.methods.isElectionOpen(electionId).call();
    res.json({ isOpen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
