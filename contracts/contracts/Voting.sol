// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.8.20;
pragma experimental ABIEncoderV2;

contract Voting {
    struct Candidate {
        string name;
        uint256 votes;
    }

    struct Election {
        string title;
        bool isOpen;
        mapping(uint256 => Candidate) candidates;
        uint256 candidatesCount;
    }

    mapping(uint256 => Election) public elections;
    uint256 public electionCount;

    function createElection(string memory _title) public {
        electionCount++;
        elections[electionCount].title = _title;
        elections[electionCount].isOpen = true;
    }

    function addCandidate(uint256 _electionId, string memory _name) public {
        Election storage e = elections[_electionId];
        e.candidatesCount++;
        e.candidates[e.candidatesCount] = Candidate(_name, 0);
    }

    function vote(uint256 _electionId, uint256 _candidateId) public {
        Election storage e = elections[_electionId];
        require(e.isOpen, "Election is closed");
        e.candidates[_candidateId].votes++;
    }

    function closeElection(uint256 _electionId) public {
        elections[_electionId].isOpen = false;
    }
}
