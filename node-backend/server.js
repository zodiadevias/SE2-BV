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
const contractAddress = "0x35030531712f8D7c3CEF9aE6Df5b97B301924395"; // deployed contract
const votingContract = new web3.eth.Contract(contractABI, contractAddress);

// Server wallet (from Ganache)
const serverAccount = "0x1E8053b4F56B7B480801dd0Ac2f7485364df0fDe";
const privateKey = "0x173d55fc0eb6eafa3a1c3d7534e0cb68a4945d6f1a40cd020d41b7b93490e42c";


// Cast vote to multiple candidates
app.post("/vote-multi", async (req, res) => {
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


// Create election
app.post("/create-election", async (req, res) => {
  const { name, startDate, endDate, domainFilter } = req.body;

  try {
    const tx = votingContract.methods.createElection(
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


// Add multiple candidates
app.post("/add-candidates", async (req, res) => {
  const { electionId, candidates } = req.body;

  try {
    const tx = votingContract.methods.addCandidates(
      electionId,
      candidates.map(candidate => candidate.name),
      candidates.map(candidate => candidate.position),
      candidates.map(candidate => candidate.platform),
      candidates.map(candidate => candidate.cdn)
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

app.listen(4000, () => console.log("Server running on port 4000"));
