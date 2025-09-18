const express = require("express");
const Web3 = require("web3");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Ganache RPC endpoint
const web3 = new Web3("http://192.168.100.12:7545");

// Replace with your deployed contract ABI & address
const contractABI = require("./VotingABI.json");
const contractAddress = "0xd3507Ec6b45273378acEB1C3243198C74798ea24"; // deployed contract
const votingContract = new web3.eth.Contract(contractABI, contractAddress);

// Server wallet (from Ganache)
const serverAccount = "0x1E8053b4F56B7B480801dd0Ac2f7485364df0fDe";
const privateKey = "0x173d55fc0eb6eafa3a1c3d7534e0cb68a4945d6f1a40cd020d41b7b93490e42c";


// Cast vote to multiple candidates
app.post("/vote", async (req, res) => {
  const { electionId, candidateIds } = req.body;

  try {
    const tx = votingContract.methods.vote(electionId, candidateIds);
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Create election and add candidates
app.post("/create-election-and-add-candidates", async (req, res) => {
  const { name, startDate, endDate, domainFilter,email, candidateNames, candidatePositions, candidatePlatforms, candidateCdns, candidatePartylists } = req.body;

  try {
    const tx = votingContract.methods.createElectionAndAddCandidates(
      name,
      startDate,
      endDate,
      domainFilter,
      email,
      candidateNames,
      candidatePositions,
      candidatePlatforms,
      candidateCdns,
      candidatePartylists
    );
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Create election
app.post("/create-election", async (req, res) => {
  console.log(req.body);
  const { name, startDate, endDate, domainFilter,email } = req.body;

  try {
    const tx = votingContract.methods.createElection(
      name,
      startDate,
      endDate,
      domainFilter,
      email
    );
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/get-election-count", async (req, res) => {
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
      candidates.map(candidate => candidate.name),
      candidates.map(candidate => candidate.position),
      candidates.map(candidate => candidate.platform),
      candidates.map(candidate => candidate.cdn),
      candidates.map(candidate => candidate.partylist)
    );
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update election
app.post("/update-election", async (req, res) => {
  const { electionId, name, startDate, endDate, domainFilter } = req.body;

  try {
    const tx = votingContract.methods.updateElection(
      electionId,
      name,
      startDate,
      endDate,
      domainFilter
    );
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get owned elections
app.post("/get-owned-elections", async (req, res) => {
  const { email } = req.body;

  try {
    const ownedElections = await votingContract.methods.getOwnedElections(email).call();
    res.json(ownedElections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get owned election names
app.post("/get-owned-election-names", async (req, res) => {
  const { email } = req.body;

  try {
    const ownedElectionNames = await votingContract.methods.getOwnedElectionNames(email).call();
    res.json(ownedElectionNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get owned election ids
app.post("/get-owned-election-ids", async (req, res) => {
  const { email } = req.body;

  try {
    const ownedElectionIds = await votingContract.methods.getOwnedElectionIds(email).call();
    res.json(ownedElectionIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get election id by name
app.post("/get-election-id-by-name", async (req, res) => {
  const { name } = req.body;

  try {
    const electionId = await votingContract.methods.getElectionIdByName(name).call();
    res.json(electionId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get election results
app.post("/get-election-results", async (req, res) => {
  const { electionId } = req.body;

  try {
    const results = await votingContract.methods.getElectionResults(electionId).call();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get election details
app.post("/get-election-details", async (req, res) => {
  const { electionId } = req.body;

  try {
    const details = await votingContract.methods.getElectionDetails(electionId).call();
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get election candidates
app.post("/get-election-candidates", async (req, res) => {
  const { electionId } = req.body;

  try {
    const candidates = await votingContract.methods.getElectionCandidates(electionId).call();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get election candidate count
app.post("/get-election-candidate-count", async (req, res) => {
  const { electionId } = req.body;

  try {
    const candidateCount = await votingContract.methods.getElectionCandidateCount(electionId).call();
    res.json(candidateCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update candidate
app.post("/update-candidate", async (req, res) => {
  const { electionId, candidateId, name, position, platform, cdn } = req.body;

  try {
    const tx = votingContract.methods.updateCandidate(electionId, candidateId, name, position, platform, cdn);
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete candidate
app.post("/delete-candidate", async (req, res) => {
  const { electionId, candidateId } = req.body;

  try {
    const tx = votingContract.methods.deleteCandidate(electionId, candidateId);
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get election candidate
app.post("/get-election-candidate", async (req, res) => {
  const { electionId, candidateId } = req.body;

  try {
    const candidate = await votingContract.methods.getElectionCandidate(electionId, candidateId).call();

    res.json({
      name: candidate[0],
      position: candidate[1],
      platform: candidate[2],
      cdn: candidate[3],
      voteCount: candidate[4],
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

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    res.json({ status: "success", txHash: receipt.transactionHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
