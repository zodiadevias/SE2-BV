// SPDX-License-Identifier: MIT
pragma solidity  >=0.4.21 <=0.8.20;
pragma experimental ABIEncoderV2;

contract Voting {
    mapping (string => CreatedElections[]) public ownedElections;

    struct CreatedElections {
        uint256 electionId;
        string electionName;
    }

    mapping (string => string[]) public positions;

    struct Candidate {
        string name;
        string partylist;
        string position;
        string platform;
        string cdn;
        uint256 voteCount;
    }

    struct Election {
        string name;
        bool isOpen;
        mapping(uint256 => Candidate) candidates;
        uint256 candidatesCount;
        string startDate;
        string endDate;
        string domainFilter;
        mapping(string => bool) hasVoted;
    }

    mapping(uint256 => Election) public elections;
    uint256 public electionCount;

    function listPositions(string memory email, string[] memory positions) public {
        this.positions[email] = positions;
    }

    
    function getPositions(string memory email) public view returns (string[] memory) {
        return positions[email];
    }

    function createElection(string memory _name, string memory _startDate, string memory _endDate, string memory _domainFilter, string memory _email) public {
        electionCount++;
        elections[electionCount].name = _name;
        elections[electionCount].isOpen = true;
        elections[electionCount].candidatesCount = 0;
        elections[electionCount].startDate = _startDate;
        elections[electionCount].endDate = _endDate;
        elections[electionCount].domainFilter = _domainFilter;
        elections[electionCount].hasVoted[_email] = false;
        ownedElections[_email].push(CreatedElections(electionCount, _name));
    }

    
    function updateElection(uint256 _electionId, string memory _title, string memory _startDate, string memory _endDate, string memory _domainFilter) public {
        Election storage e = elections[_electionId];
        e.name = _title;
        e.startDate = _startDate;
        e.endDate = _endDate;
        e.domainFilter = _domainFilter;
    }

    
    function getOwnedElections(string memory _email) public view returns (CreatedElections[] memory) {
        return ownedElections[_email];
    }

    function getOwnedElectionNames(string memory _owner) public view returns (string[] memory) {
        CreatedElections[] storage ownedElectionsList = ownedElections[_owner];
        string[] memory names = new string[](ownedElectionsList.length);
        for (uint256 i = 0; i < ownedElectionsList.length; i++) {
            names[i] = elections[ownedElectionsList[i].electionId].name;
        }
        return names;
    }

    function getOwnedElectionIds(string memory _owner) public view returns (uint256[] memory) {
        CreatedElections[] storage ownedElectionsList = ownedElections[_owner];
        uint256[] memory ids = new uint256[](ownedElectionsList.length);
        for (uint256 i = 0; i < ownedElectionsList.length; i++) {
            ids[i] = ownedElectionsList[i].electionId;
        }
        return ids;
    }

    
    function getElectionIdByName(string memory _name) public view returns (uint256) {
        for (uint256 i = 1; i <= electionCount; i++) {
            if (compareStrings(elections[i].name, _name)) {
                return i;
            }
        }
        return 0;
    }

    function compareStrings(string memory s1, string memory s2) internal pure returns (bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }


    
    function getElectionResults(uint256 _electionId) public view returns (string[] memory, uint256[] memory) {
        Election storage e = elections[_electionId];
        string[] memory names = new string[](e.candidatesCount);
        uint256[] memory votes = new uint256[](e.candidatesCount);
        for (uint256 i = 1; i <= e.candidatesCount; i++) {
            names[i-1] = e.candidates[i].name;
            votes[i-1] = e.candidates[i].voteCount;
        }
        return (names, votes);
    }

    
    
    function getElectionDetails(uint256 _electionId) public view returns (string memory, bool, uint256, string memory, string memory, string memory) {
        Election storage e = elections[_electionId];
        return (e.name, e.isOpen, e.candidatesCount, e.startDate, e.endDate, e.domainFilter);
    }

    
    function addCandidates(uint256 _electionId, string[] memory _names, string[] memory _positions, string[] memory _platforms, string[] memory _cdns, string memory _partylists) public {
        require(_names.length == _positions.length && _positions.length == _platforms.length && _platforms.length == _cdns.length && _cdns.length == _partylist.length, "Input arrays must have same length");
        Election storage e = elections[_electionId];
        for (uint256 i = 0; i < _names.length; i++) {
            e.candidatesCount++;
            e.candidates[e.candidatesCount] = Candidate(_names[i], _partylists[i], _positions[i], _platforms[i], _cdns[i], 0);
        }
    }

    
    
    function getElectionCandidates(uint256 _electionId) public view returns (string[] memory, string[] memory, string[] memory, string[] memory, string[] memory) {
        Election storage e = elections[_electionId];
        string[] memory names = new string[](e.candidatesCount);
        string[] memory positions = new string[](e.candidatesCount);
        string[] memory platforms = new string[](e.candidatesCount);
        string[] memory cdns = new string[](e.candidatesCount);
        string[] memory partylists = new string[](e.candidatesCount);
        for (uint256 i = 1; i <= e.candidatesCount; i++) {
            names[i-1] = e.candidates[i].name;
            positions[i-1] = e.candidates[i].position;
            platforms[i-1] = e.candidates[i].platform;
            cdns[i-1] = e.candidates[i].cdn;
            partylists[i-1] = e.candidates[i].partylist;
        }
        return (names, positions, platforms, cdns, partylists);
    }

    
    function getElectionCandidateCount(uint256 _electionId) public view returns (uint256) {
        Election storage e = elections[_electionId];
        return e.candidatesCount;
    }

    
    function updateCandidate(uint256 _electionId, uint256 _candidateId, string memory _name, string memory _position, string memory _platform, string memory _cdn) public {
        Election storage e = elections[_electionId];
        e.candidates[_candidateId].name = _name;
        e.candidates[_candidateId].position = _position;
        e.candidates[_candidateId].platform = _platform;
        e.candidates[_candidateId].cdn = _cdn;
    }

    
    function deleteCandidate(uint256 _electionId, uint256 _candidateId) public {
        Election storage e = elections[_electionId];
        if (_candidateId >= e.candidatesCount) return;

        for (uint256 i = _candidateId; i < e.candidatesCount - 1; i++) {
            e.candidates[i] = e.candidates[i+1];
        }
        e.candidatesCount--;
    }

    
    function getElectionCandidate(uint256 _electionId, uint256 _candidateId) public view returns (string memory, string memory, string memory, string memory, string memory, uint) {
        Election storage e = elections[_electionId];
        return (e.candidates[_candidateId].name, e.candidates[_candidateId].position, e.candidates[_candidateId].platform, e.candidates[_candidateId].cdn, e.candidates[_candidateId].partylist, e.candidates[_candidateId].voteCount);
    }


    
    function vote(uint256 _electionId, uint256[] memory _candidateIds, string memory _email) public {
        Election storage e = elections[_electionId];
        require(e.isOpen, "Election is closed");
        for (uint256 i = 0; i < _candidateIds.length; i++) {
            e.candidates[_candidateIds[i]].voteCount++;
        }
        e.hasVoted[_email] = true;
    }

    
    function closeElection(uint256 _electionId) public {
        require(!elections[_electionId].isOpen, "Election is already closed");
        Election storage e = elections[_electionId];
        e.isOpen = false;
    }

}
