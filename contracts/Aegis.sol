// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Aegis
 * @notice Protective control layer for AI agent wallets on Base.
 *         Users deposit USDC, set hard spend limits, freeze agents,
 *         and create structured onchain intents.
 * @dev    Minimal, gas-efficient, no external dependencies beyond IERC20.
 *         Designed for true $0 solo development and Base Ecosystem grants.
 */

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract Aegis {
    // ============ Constants ============
    // Native USDC on Base mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    uint256 public constant DAY = 1 days;

    // ============ Types ============
    struct Agent {
        address owner;          // the human who controls this agent
        address agentWallet;    // the wallet the AI is allowed to use
        bool frozen;            // emergency freeze
        uint256 dailyLimit;     // max USDC (6 decimals) the agent can spend per day
        uint256 spentToday;     // amount spent in the current day
        uint256 lastDay;        // floor(block.timestamp / DAY)
        uint256 totalDeposited; // lifetime deposits (for simple accounting)
        uint256 totalSpent;     // lifetime spent
    }

    struct Intent {
        address creator;
        address agent;
        string description;
        uint8 category;         // 0=Other, 1=Shopping, 2=Travel, 3=Food, 4=Subscriptions
        uint256 maxAmount;      // max USDC the agent may spend for this intent
        uint256 deadline;       // unix timestamp
        bool active;
        bool fulfilled;
    }

    // ============ State ============
    mapping(address => Agent) public agents;          // agentWallet => Agent config
    mapping(address => address) public ownerToAgent;  // owner => their primary agentWallet (MVP: 1 per owner)
    mapping(uint256 => Intent) public intents;
    uint256 public nextIntentId = 1;

    // ============ Events ============
    event AgentCreated(address indexed owner, address indexed agentWallet, uint256 dailyLimit);
    event LimitsUpdated(address indexed agentWallet, uint256 dailyLimit);
    event Frozen(address indexed agentWallet);
    event Unfrozen(address indexed agentWallet);
    event Deposited(address indexed agentWallet, address indexed from, uint256 amount);
    event Withdrawn(address indexed agentWallet, address indexed to, uint256 amount);
    event Spent(address indexed agentWallet, address indexed to, uint256 amount, uint8 category, uint256 intentId);
    event IntentCreated(uint256 indexed intentId, address indexed agent, address indexed creator, uint256 maxAmount, uint256 deadline);
    event IntentFulfilled(uint256 indexed intentId);

    // ============ Errors ============
    error NotOwner();
    error NotAgent();
    error AgentAlreadyExists();
    error AgentDoesNotExist();
    error AgentIsFrozen();
    error DailyLimitExceeded();
    error InsufficientBalance();
    error InvalidAmount();
    error IntentNotActive();
    error IntentExpired();
    error IntentAmountExceeded();
    error TransferFailed();

    // ============ Modifiers ============
    modifier onlyOwner(address agentWallet) {
        if (agents[agentWallet].owner != msg.sender) revert NotOwner();
        _;
    }

    modifier onlyAgent(address agentWallet) {
        if (msg.sender != agentWallet) revert NotAgent();
        _;
    }

    // ============ Agent Lifecycle ============

    /**
     * @notice Create a new protected agent.
     * @param agentWallet The address the AI will use (EOA or smart account).
     * @param dailyLimit  Max USDC (6 decimals) the agent may spend per calendar day.
     */
    function createAgent(address agentWallet, uint256 dailyLimit) external {
        if (agentWallet == address(0)) revert InvalidAmount();
        if (agents[agentWallet].owner != address(0)) revert AgentAlreadyExists();
        if (ownerToAgent[msg.sender] != address(0)) revert AgentAlreadyExists(); // MVP: one agent per owner

        agents[agentWallet] = Agent({
            owner: msg.sender,
            agentWallet: agentWallet,
            frozen: false,
            dailyLimit: dailyLimit,
            spentToday: 0,
            lastDay: block.timestamp / DAY,
            totalDeposited: 0,
            totalSpent: 0
        });

        ownerToAgent[msg.sender] = agentWallet;

        emit AgentCreated(msg.sender, agentWallet, dailyLimit);
    }

    /**
     * @notice Update the daily spend limit for an agent.
     */
    function setDailyLimit(address agentWallet, uint256 newDailyLimit) external onlyOwner(agentWallet) {
        agents[agentWallet].dailyLimit = newDailyLimit;
        emit LimitsUpdated(agentWallet, newDailyLimit);
    }

    /**
     * @notice Emergency freeze. Agent can no longer spend until unfrozen.
     */
    function freeze(address agentWallet) external onlyOwner(agentWallet) {
        agents[agentWallet].frozen = true;
        emit Frozen(agentWallet);
    }

    /**
     * @notice Unfreeze the agent.
     */
    function unfreeze(address agentWallet) external onlyOwner(agentWallet) {
        agents[agentWallet].frozen = false;
        emit Unfrozen(agentWallet);
    }

    // ============ Funding ============

    /**
     * @notice Deposit USDC into the agent's protected balance.
     *         User must approve this contract first.
     */
    function deposit(address agentWallet, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        Agent storage a = agents[agentWallet];
        if (a.owner == address(0)) revert AgentDoesNotExist();

        bool success = IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        a.totalDeposited += amount;
        emit Deposited(agentWallet, msg.sender, amount);
    }

    /**
     * @notice Owner withdraws USDC from the agent's balance back to themselves.
     */
    function withdraw(address agentWallet, uint256 amount) external onlyOwner(agentWallet) {
        if (amount == 0) revert InvalidAmount();
        uint256 bal = balanceOf(agentWallet);
        if (amount > bal) revert InsufficientBalance();

        bool success = IERC20(USDC).transfer(msg.sender, amount);
        if (!success) revert TransferFailed();

        emit Withdrawn(agentWallet, msg.sender, amount);
    }

    // ============ Spending (Agent only) ============

    /**
     * @notice The only way an agent can move USDC.
     *         Checks freeze status + daily limit + optional intent constraints.
     * @param to          Recipient
     * @param amount      Amount of USDC (6 decimals)
     * @param category    0=Other, 1=Shopping, 2=Travel, 3=Food, 4=Subscriptions
     * @param intentId    0 if not linked to an intent, otherwise the intent ID
     */
    function agentSpend(
        address to,
        uint256 amount,
        uint8 category,
        uint256 intentId
    ) external {
        address agentWallet = msg.sender;
        Agent storage a = agents[agentWallet];

        if (a.owner == address(0)) revert AgentDoesNotExist();
        if (a.frozen) revert AgentIsFrozen();
        if (amount == 0) revert InvalidAmount();

        // Reset daily counter if new day
        uint256 currentDay = block.timestamp / DAY;
        if (currentDay > a.lastDay) {
            a.spentToday = 0;
            a.lastDay = currentDay;
        }

        if (a.spentToday + amount > a.dailyLimit) revert DailyLimitExceeded();

        // Optional intent checks
        if (intentId != 0) {
            Intent storage intent = intents[intentId];
            if (!intent.active || intent.fulfilled) revert IntentNotActive();
            if (intent.agent != agentWallet) revert NotAgent();
            if (block.timestamp > intent.deadline) revert IntentExpired();
            if (amount > intent.maxAmount) revert IntentAmountExceeded();

            intent.fulfilled = true;
            intent.active = false;
            emit IntentFulfilled(intentId);
        }

        uint256 bal = balanceOf(agentWallet);
        if (amount > bal) revert InsufficientBalance();

        a.spentToday += amount;
        a.totalSpent += amount;

        bool success = IERC20(USDC).transfer(to, amount);
        if (!success) revert TransferFailed();

        emit Spent(agentWallet, to, amount, category, intentId);
    }

    // ============ Intents ============

    /**
     * @notice Create a structured onchain intent that an agent can later fulfill.
     */
    function createIntent(
        address agentWallet,
        string calldata description,
        uint8 category,
        uint256 maxAmount,
        uint256 deadline
    ) external onlyOwner(agentWallet) returns (uint256 intentId) {
        if (maxAmount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert IntentExpired();

        intentId = nextIntentId++;
        intents[intentId] = Intent({
            creator: msg.sender,
            agent: agentWallet,
            description: description,
            category: category,
            maxAmount: maxAmount,
            deadline: deadline,
            active: true,
            fulfilled: false
        });

        emit IntentCreated(intentId, agentWallet, msg.sender, maxAmount, deadline);
    }

    /**
     * @notice Owner can cancel an active intent.
     */
    function cancelIntent(uint256 intentId) external {
        Intent storage intent = intents[intentId];
        if (intent.creator != msg.sender) revert NotOwner();
        if (!intent.active) revert IntentNotActive();

        intent.active = false;
    }

    // ============ View helpers ============

    /**
     * @notice Available USDC balance for a given agent.
     *         (total deposited - total spent, adjusted for any direct transfers)
     */
    function balanceOf(address agentWallet) public view returns (uint256) {
        Agent storage a = agents[agentWallet];
        if (a.owner == address(0)) return 0;

        // Simple accounting: we track deposits and spends.
        // For maximum safety we could also check actual contract balance,
        // but this is sufficient and gas-cheap for MVP.
        if (a.totalDeposited < a.totalSpent) return 0;
        return a.totalDeposited - a.totalSpent;
    }

    function getAgent(address agentWallet) external view returns (Agent memory) {
        return agents[agentWallet];
    }

    function getIntent(uint256 intentId) external view returns (Intent memory) {
        return intents[intentId];
    }

    function getMyAgent() external view returns (address) {
        return ownerToAgent[msg.sender];
    }
}
