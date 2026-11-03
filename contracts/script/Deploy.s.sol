// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Aegis} from "../Aegis.sol";

/**
 * @title DeployAegis
 * @notice Deploy script for Aegis on Base / Base Sepolia
 *
 * Usage:
 *   # Base Sepolia (recommended first)
 *   forge script script/Deploy.s.sol:DeployAegis --rpc-url https://sepolia.base.org --broadcast --private-key $PK
 *
 *   # Base mainnet
 *   forge script script/Deploy.s.sol:DeployAegis --rpc-url https://mainnet.base.org --broadcast --private-key $PK
 */
contract DeployAegis is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        // USDC differs per chain — the old hardcoded mainnet token does not
        // exist on Sepolia, which made Sepolia deployments unusable.
        address usdc;
        if (block.chainid == 8453) {
            usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base mainnet USDC
        } else if (block.chainid == 84532) {
            usdc = 0x036CbD53842c5426634e7929541eC2318f3dCF7e; // Base Sepolia USDC
        } else {
            revert("DeployAegis: unsupported chain -- set the USDC address for this chain first");
        }
        console2.log("USDC:", usdc);

        vm.startBroadcast(deployerPrivateKey);

        Aegis aegis = new Aegis(usdc);

        vm.stopBroadcast();

        console2.log("==============================");
        console2.log("Aegis deployed at:", address(aegis));
        console2.log("==============================");
        console2.log("Next step: copy this address into");
        console2.log("frontend/src/lib/contracts.ts  ->  AEGIS_ADDRESS");
    }
}
