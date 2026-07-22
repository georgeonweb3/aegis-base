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

        vm.startBroadcast(deployerPrivateKey);

        Aegis aegis = new Aegis();

        vm.stopBroadcast();

        console2.log("==============================");
        console2.log("Aegis deployed at:", address(aegis));
        console2.log("==============================");
        console2.log("Next step: copy this address into");
        console2.log("frontend/src/lib/contracts.ts  ->  AEGIS_ADDRESS");
    }
}
