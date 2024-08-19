// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/FeeManager.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {}
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract FeeManagerTest is Test {
    FeeManager public feeManager;
    address public feeRecipient;
    uint256 public constant FEE_PRECISION = 1e6;

    MockToken public mockToken;

    receive() external payable {}
    
    function setUp() public {
        feeRecipient = address(0x123);
        feeManager = new FeeManager(feeRecipient);
        mockToken = new MockToken();
    }

    function testInitialState() public view {
        assertEq(feeManager.feeRecipient(), feeRecipient);
        assertEq(feeManager.FEE_PRECISION(), FEE_PRECISION);
    }

    function testSetFeeRecipient() public {
        address newFeeRecipient = address(0x456);
        vm.prank(feeManager.owner());
        feeManager.setFeeRecipient(newFeeRecipient);
        assertEq(feeManager.feeRecipient(), newFeeRecipient);
    }

    function testCalculateFee() public view {
        uint256 amount = 1000 ether;
        uint256 feeBasisPoints = 100; // 0.01%
        uint256 expectedFee = (amount * feeBasisPoints) / FEE_PRECISION;
        uint256 calculatedFee = feeManager.calculateFee(amount, feeBasisPoints);
        assertEq(calculatedFee, expectedFee);
    }

    function testDistributeETHFee() public {
        uint256 feeAmount = 1 ether;
        vm.deal(address(feeManager), feeAmount);

        uint256 feeRecipientBalanceBefore = feeRecipient.balance;

        vm.prank(feeManager.owner());
        feeManager.distributeFee(address(0));

        uint256 feeRecipientBalanceAfter = feeRecipient.balance;
        assertEq(feeRecipientBalanceAfter - feeRecipientBalanceBefore, feeAmount);
    }

    function testDistributeERC20Fee() public {
    address tokenAddress = address(mockToken);
    uint256 feeAmount = 1000 * 1e18;

    mockToken.mint(address(feeManager), feeAmount);

    uint256 feeRecipientBalanceBefore = mockToken.balanceOf(feeRecipient);

    vm.prank(feeManager.owner());
    feeManager.distributeFee(tokenAddress);

    uint256 feeRecipientBalanceAfter = mockToken.balanceOf(feeRecipient);
    uint256 feeDistributed = feeRecipientBalanceAfter - feeRecipientBalanceBefore;

    assertEq(feeDistributed, feeAmount, "Fee should have been distributed correctly");
}

    function testRescueETH() public {
    uint256 amount = 1 ether;
    
    // Send ETH to the FeeManager contract
    vm.deal(address(feeManager), amount);

    address owner = feeManager.owner();
    uint256 ownerBalanceBefore = owner.balance;
    uint256 contractBalanceBefore = address(feeManager).balance;

    assertEq(contractBalanceBefore, amount, "Contract should have received ETH");

    vm.prank(owner);
    feeManager.rescueETH(amount);

    uint256 ownerBalanceAfter = owner.balance;
    uint256 contractBalanceAfter = address(feeManager).balance;

    assertEq(ownerBalanceAfter - ownerBalanceBefore, amount, "Owner should receive rescued ETH");
    assertEq(contractBalanceAfter, 0, "Contract balance should be zero after rescue");
}
}

