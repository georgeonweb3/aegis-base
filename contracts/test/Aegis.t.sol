// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Aegis} from "../Aegis.sol";

/**
 * Minimal unit tests for Aegis.
 * Run with:  forge test -vv
 *
 * Note: These tests mock USDC behavior with a simple ERC20-like contract
 * so we don't need the real Base USDC.
 */

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "balance");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract AegisTest is Test {
    Aegis public aegis;
    MockUSDC public usdc;

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address recipient = makeAddr("recipient");

    uint256 constant DAILY_LIMIT = 100e6; // $100

    function setUp() public {
        // Deploy mock USDC first
        usdc = new MockUSDC();

        // We need to temporarily override the constant USDC address.
        // For real tests on a fork we would use the real USDC.
        // Here we deploy Aegis and use vm.etch / storage tricks, 
        // but for simplicity in this minimal test we focus on logic
        // that doesn't depend on the hardcoded USDC address.

        aegis = new Aegis();

        // Fund owner with mock USDC
        usdc.mint(owner, 1000e6);
    }

    function test_CreateAgent() public {
        vm.prank(owner);
        aegis.createAgent(agent, DAILY_LIMIT);

        (address o, address a, bool frozen, uint256 limit,,,,) = (
            aegis.getAgent(agent).owner,
            aegis.getAgent(agent).agentWallet,
            aegis.getAgent(agent).frozen,
            aegis.getAgent(agent).dailyLimit,
            aegis.getAgent(agent).spentToday,
            aegis.getAgent(agent).lastDay,
            aegis.getAgent(agent).totalDeposited,
            aegis.getAgent(agent).totalSpent
        );

        assertEq(o, owner);
        assertEq(a, agent);
        assertEq(frozen, false);
        assertEq(limit, DAILY_LIMIT);
        assertEq(aegis.ownerToAgent(owner), agent);
    }

    function test_CannotCreateTwoAgents() public {
        vm.startPrank(owner);
        aegis.createAgent(agent, DAILY_LIMIT);

        address agent2 = makeAddr("agent2");
        vm.expectRevert(Aegis.AgentAlreadyExists.selector);
        aegis.createAgent(agent2, DAILY_LIMIT);
        vm.stopPrank();
    }

    function test_FreezeAndUnfreeze() public {
        vm.prank(owner);
        aegis.createAgent(agent, DAILY_LIMIT);

        vm.prank(owner);
        aegis.freeze(agent);
        assertTrue(aegis.getAgent(agent).frozen);

        vm.prank(owner);
        aegis.unfreeze(agent);
        assertFalse(aegis.getAgent(agent).frozen);
    }

    function test_OnlyOwnerCanFreeze() public {
        vm.prank(owner);
        aegis.createAgent(agent, DAILY_LIMIT);

        vm.prank(makeAddr("stranger"));
        vm.expectRevert(Aegis.NotOwner.selector);
        aegis.freeze(agent);
    }

    function test_CreateIntent() public {
        vm.prank(owner);
        aegis.createAgent(agent, DAILY_LIMIT);

        uint256 deadline = block.timestamp + 1 days;

        vm.prank(owner);
        uint256 intentId = aegis.createIntent(
            agent,
            "Buy flight under $180",
            2, // Travel
            180e6,
            deadline
        );

        Aegis.Intent memory intent = aegis.getIntent(intentId);
        assertEq(intent.creator, owner);
        assertEq(intent.agent, agent);
        assertEq(intent.maxAmount, 180e6);
        assertTrue(intent.active);
        assertFalse(intent.fulfilled);
    }

    function test_CancelIntent() public {
        vm.prank(owner);
        aegis.createAgent(agent, DAILY_LIMIT);

        vm.prank(owner);
        uint256 intentId = aegis.createIntent(agent, "Test", 0, 50e6, block.timestamp + 1 days);

        vm.prank(owner);
        aegis.cancelIntent(intentId);

        assertFalse(aegis.getIntent(intentId).active);
    }
}
