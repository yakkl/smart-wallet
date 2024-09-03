// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BaseMultiOwner.sol";

contract BaseMultiOwnerTest is Test {
    BaseMultiOwner multiOwner;
    address[] initialOwners;
    address owner1;
    address owner2;
    address owner3;

    function setUp() public {
        owner1 = address(0x1);
        owner2 = address(0x2);
        owner3 = address(0x3);
        initialOwners = new address[](2);
        initialOwners[0] = owner1;
        initialOwners[1] = owner2;
        multiOwner = new BaseMultiOwner(initialOwners);
    }

    function testInitialOwners() view public {
        assertTrue(multiOwner.isOwner(owner1));
        assertTrue(multiOwner.isOwner(owner2));
        assertFalse(multiOwner.isOwner(owner3));
        assertEq(multiOwner.getOwnerCount(), 2);
    }

    function testAddOwner() public {
        vm.prank(owner1);
        multiOwner.addOwner(owner3);

        assertTrue(multiOwner.isOwner(owner3));
        assertEq(multiOwner.getOwnerCount(), 3);
    }

    function testRemoveOwner() public {
        vm.prank(owner1);
        multiOwner.removeOwner(owner2);

        assertFalse(multiOwner.isOwner(owner2));
        assertEq(multiOwner.getOwnerCount(), 1);
    }

    function testCannotRemoveLastOwner() public {
        vm.prank(owner1);
        multiOwner.removeOwner(owner2);

        vm.expectRevert("BaseMultiOwner: cannot remove the last owner");
        vm.prank(owner1);
        multiOwner.removeOwner(owner1);
    }

    // function testOnlyOwnerCanAddOrRemove() public {
    //     vm.expectRevert("BaseMultiOwner: address is not an owner");
    //     vm.prank(address(0x4));
    //     multiOwner.addOwner(owner3);

    //     vm.expectRevert("BaseMultiOwner: caller is not an owner");
    //     vm.prank(address(0x4));
    //     multiOwner.removeOwner(owner1);
    // }

    function testCannotAddExistingOwner() public {
        vm.expectRevert("BaseMultiOwner: address is already an owner");
        vm.prank(owner1);
        multiOwner.addOwner(owner2);
    }

    function testCannotRemoveNonOwner() public {
        vm.expectRevert("BaseMultiOwner: address is not an owner");
        vm.prank(owner1);
        multiOwner.removeOwner(owner3);
    }

    function testRenounceOwnership() public {
        vm.prank(owner1);
        multiOwner.renounceOwnership();

        assertFalse(multiOwner.isOwner(owner1));
        assertEq(multiOwner.getOwnerCount(), 1);
    }

    function testCannotRenounceLastOwnership() public {
        vm.prank(owner1);
        multiOwner.removeOwner(owner2);

        vm.expectRevert("BaseMultiOwner: cannot renounce if only one owner");
        vm.prank(owner1);
        multiOwner.renounceOwnership();
    }
}
