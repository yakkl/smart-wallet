// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockERC20Votes is ERC20, ERC20Permit, ERC20Votes {
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol) 
        ERC20Permit(name)
        ERC20Votes()
    {
        _mint(msg.sender, 1000000 * 10**18);
    }

    // The following functions are overrides required by Solidity

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, amount);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20)
    {
        super._burn(account, amount);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
