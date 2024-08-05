// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// import IERC20

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MyToken {
    address public owner;
    address public networkFeeAddress;
    uint256 public networkFeeRate = 100; // 1% fee
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor(address _networkFeeAddress) {
        owner = msg.sender;
        networkFeeAddress = _networkFeeAddress;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_value > 0, "Transfer amount must be greater than 0");
        
        uint256 networkFee = _value * networkFeeRate / 10000; // calculate 1% fee
        uint256 transferAmount = _value - networkFee; // calculate transfer amount
        
        IERC20(this).transfer(networkFeeAddress, networkFee); // send network fee to specified address
        
        IERC20(this).transfer(_to, transferAmount); // send remaining tokens to recipient
        
        emit Transfer(msg.sender, _to, transferAmount); // emit Transfer event
        
        return true;
    }
    
    function balanceOf(address _account) public view returns (uint256) {
        return IERC20(this).balanceOf(_account);
    }
}
