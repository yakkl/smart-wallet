// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BaseMultiOwner {
    mapping(address => bool) private _owners;
    uint256 private _ownerCount;
    uint256 public constant MAX_OWNERS = 50;

    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed removedOwner);
    event OwnershipRenounced(address indexed formerOwner);

    modifier onlyOwner() {
        require(isOwner(msg.sender), "BaseMultiOwner: caller is not an owner");
        _;
    }

    constructor(address[] memory owners) {
        require(owners.length > 0 && owners.length <= MAX_OWNERS, "BaseMultiOwner: invalid number of initial owners");

        for (uint256 i = 0; i < owners.length; i++) {
            require(owners[i] != address(0), "BaseMultiOwner: zero address cannot be owner");
            require(!_owners[owners[i]], "BaseMultiOwner: duplicate owner");
            _owners[owners[i]] = true;
            emit OwnerAdded(owners[i]);
        }
        _ownerCount = owners.length;
    }

    function isOwner(address account) public view returns (bool) {
        return _owners[account];
    }

    function getOwnerCount() public view returns (uint256) {
        return _ownerCount;
    }

    function addOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "BaseMultiOwner: new owner is the zero address");
        require(!_owners[newOwner], "BaseMultiOwner: address is already an owner");
        require(_ownerCount < MAX_OWNERS, "BaseMultiOwner: max owners reached");
        _owners[newOwner] = true;
        _ownerCount++;
        emit OwnerAdded(newOwner);
    }

    function removeOwner(address owner) public onlyOwner {
        require(_owners[owner], "BaseMultiOwner: address is not an owner");
        require(_ownerCount > 1, "BaseMultiOwner: cannot remove the last owner");
        _owners[owner] = false;
        _ownerCount--;
        emit OwnerRemoved(owner);
    }

    function renounceOwnership() public onlyOwner {
        require(_ownerCount > 1, "BaseMultiOwner: cannot renounce if only one owner");
        _owners[msg.sender] = false;
        _ownerCount--;
        emit OwnershipRenounced(msg.sender);
    }
}
