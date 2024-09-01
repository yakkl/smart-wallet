// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

contract OwnerManager is Initializable {
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);

    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public threshold;

    modifier onlyOwner {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    function __OwnerManager_init(address[] memory _owners, uint256 _threshold) internal initializer {
        require(_owners.length > 0, "No owners provided");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0) && !isOwner[owner], "Invalid owner");
            isOwner[owner] = true;
            owners.push(owner);
        }

        threshold = _threshold;
    }

    function addOwner(address owner) public onlyOwner {
        require(owner != address(0) && !isOwner[owner], "Invalid owner");
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAdded(owner);
    }

    function removeOwner(address owner) public onlyOwner {
        require(isOwner[owner], "Not an owner");
        require(owners.length > threshold, "Cannot remove owner below threshold");
        isOwner[owner] = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        emit OwnerRemoved(owner);
    }

    function changeThreshold(uint256 _threshold) public onlyOwner {
        require(_threshold > 0 && _threshold <= owners.length, "Invalid threshold");
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }
}
