// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./YAKKLTreasury.sol";
import "forge-std/console.sol";

contract YAKKL is ERC20Burnable, Pausable, AccessControl, ERC20Permit, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BLACKLIST_MANAGER_ROLE = keccak256("BLACKLIST_MANAGER_ROLE");
    bytes32 public constant WHITELIST_MANAGER_ROLE = keccak256("WHITELIST_MANAGER_ROLE");

    uint256 private constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 private constant INITIAL_SUPPLY = 500_000_000 * 10**18;
    uint256 public constant MAX_TRANSFER_TAX_RATE = 10000; // 100% in basis points

    uint256 public mintingTimelock;
    mapping(address => bool) public blacklistStatus;
    mapping(address => bool) public whitelistStatus;
    mapping(address => VestingSchedule) public vestingSchedules;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
    }

    uint256 public mintCapPerPeriod;
    uint256 public mintPeriodStart;
    uint256 public mintedInCurrentPeriod;
    uint256 public mintPeriodDuration;

    uint256 private _totalBurned;
    YAKKLTreasury public yakklTreasury;
    
    struct FeeRate {
        uint256 lowerBound;
        uint256 upperBound;
        uint256 rate;
    }
    FeeRate[] public feeRates;

    uint256 public rateLimitAmount;
    uint256 public rateLimitPeriod;
    mapping(address => uint256) private lastTransferTimestamp;
    mapping(address => uint256) private transferredInPeriod;
    mapping(address => bool) public isExemptFromFees;

    struct TransactionInfo {
        address from;
        address to;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
    }

    mapping(uint256 => TransactionInfo) public transactionHistory;
    uint256 public transactionCount;

    event TokensRecovered(address token, uint256 amount);
    event BlacklistUpdated(address account, bool status);
    event WhitelistUpdated(address account, bool status);
    event VestingScheduleSet(address account, uint256 amount, uint256 duration, uint256 cliffDuration);
    event VestingClaimed(address account, uint256 amount);
    event Minted(address to, uint256 amount);
    event MintingTimelockSet(uint256 timestamp);
    event MintCapSet(uint256 amount, uint256 periodDuration);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeRateUpdated(uint256 index, uint256 lowerBound, uint256 upperBound, uint256 rate);
    event RateLimitUpdated(uint256 amount, uint256 period);
    event TransferTaxRateUpdated(uint256 oldRate, uint256 newRate);

    constructor(address defaultAdmin, address _yakklTreasury) 
        ERC20("YAKKL", "YAKKL") 
        ERC20Permit("YAKKL") 
    {
        require(defaultAdmin != address(0), "Invalid owner address");
        require(_yakklTreasury != address(0), "Invalid treasury address");

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(BLACKLIST_MANAGER_ROLE, defaultAdmin);
        _grantRole(WHITELIST_MANAGER_ROLE, defaultAdmin);

        uint256 treasuryAllocation = (INITIAL_SUPPLY * 20) / 100; // 20% to Treasury
        uint256 ownerAllocation = INITIAL_SUPPLY - treasuryAllocation;

        _mint(defaultAdmin, ownerAllocation);
        _mint(_yakklTreasury, treasuryAllocation);

        emit Minted(defaultAdmin, ownerAllocation);
        emit Minted(_yakklTreasury, treasuryAllocation);

        mintCapPerPeriod = MAX_SUPPLY;
        mintPeriodStart = block.timestamp;
        mintedInCurrentPeriod = 0;
        mintPeriodDuration = 30 days;

        isExemptFromFees[_yakklTreasury] = true;
        isExemptFromFees[defaultAdmin] = true;
        yakklTreasury = YAKKLTreasury(payable(_yakklTreasury));

        emit TreasuryUpdated(address(0), _yakklTreasury);

        rateLimitAmount = MAX_SUPPLY;
        rateLimitPeriod = 1 days;

        // Initialize with a default fee rate
        feeRates.push(FeeRate(0, MAX_SUPPLY, 500)); // 0.5% fee for all transfers
    }

    function setYAKKLTreasury(address _yakklTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_yakklTreasury != address(0), "Invalid YAKKLTreasury address");
        address oldTreasury = address(yakklTreasury);
        yakklTreasury = YAKKLTreasury(payable(_yakklTreasury));
        emit TreasuryUpdated(oldTreasury, _yakklTreasury);
    }

    function setFeeExemption(address account, bool exempt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isExemptFromFees[account] = exempt;
    }

    function setTransferTaxRate(uint256 _transferTaxRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_transferTaxRate <= MAX_TRANSFER_TAX_RATE, "Transfer tax rate too high");
        uint256 oldRate = feeRates[0].rate;
        feeRates[0].rate = _transferTaxRate;
        emit TransferTaxRateUpdated(oldRate, _transferTaxRate);
    }

    function setFeeRates(uint256[] memory lowerBounds, uint256[] memory upperBounds, uint256[] memory rates) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(lowerBounds.length == upperBounds.length && upperBounds.length == rates.length, "Arrays must have the same length");
        delete feeRates;
        for (uint i = 0; i < lowerBounds.length; i++) {
            require(i == 0 || lowerBounds[i] > feeRates[i-1].upperBound, "Bounds must be in ascending order");
            require(upperBounds[i] > lowerBounds[i], "Upper bound must be greater than lower bound");
            require(rates[i] <= MAX_TRANSFER_TAX_RATE, "Rate cannot exceed maximum transfer tax rate");
            feeRates.push(FeeRate(lowerBounds[i], upperBounds[i], rates[i]));
            emit FeeRateUpdated(i, lowerBounds[i], upperBounds[i], rates[i]);
        }
    }

    function setRateLimit(uint256 amount, uint256 period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rateLimitAmount = amount;
        rateLimitPeriod = period;
        emit RateLimitUpdated(amount, period);
    }

    function getFeeRate(uint256 amount) public view whenNotPaused returns (uint256) {
        for (uint i = 0; i < feeRates.length; i++) {
            if (amount >= feeRates[i].lowerBound && amount < feeRates[i].upperBound) {
                return feeRates[i].rate;
            }
        }
        return feeRates[feeRates.length - 1].rate; // Default to the highest tier if no match
    }

    function recoverTokens(address token, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
        emit TokensRecovered(token, amount);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) nonReentrant {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(block.timestamp >= mintingTimelock, "Minting is timelocked");

        if (block.timestamp >= mintPeriodStart + mintPeriodDuration) {
            mintPeriodStart = block.timestamp;
            mintedInCurrentPeriod = 0;
        }
        require(mintedInCurrentPeriod + amount <= mintCapPerPeriod, "Exceeds minting cap for current period");

        mintedInCurrentPeriod += amount;
        _mint(to, amount);
        emit Minted(to, amount);
    }

    function setMintingTimelock(uint256 timestamp) public onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingTimelock = timestamp;
        emit MintingTimelockSet(timestamp);
    }

    function setMintCap(uint256 amount, uint256 periodDuration) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= MAX_SUPPLY, "Mint cap cannot exceed max supply");
        mintCapPerPeriod = amount;
        mintPeriodDuration = periodDuration;
        mintPeriodStart = block.timestamp;
        mintedInCurrentPeriod = 0;
        emit MintCapSet(amount, periodDuration);
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function updateBlacklist(address[] memory accounts, bool[] memory statuses) public onlyRole(BLACKLIST_MANAGER_ROLE) {
        require(accounts.length == statuses.length, "Arrays must have the same length");
        for (uint i = 0; i < accounts.length; i++) {
            blacklistStatus[accounts[i]] = statuses[i];
            emit BlacklistUpdated(accounts[i], statuses[i]);
        }
    }

    function updateWhitelist(address[] memory accounts, bool[] memory statuses) public onlyRole(WHITELIST_MANAGER_ROLE) {
        require(accounts.length == statuses.length, "Arrays must have the same length");
        for (uint i = 0; i < accounts.length; i++) {
            whitelistStatus[accounts[i]] = statuses[i];
            emit WhitelistUpdated(accounts[i], statuses[i]);
        }
    }

    function setVestingSchedule(
        address account,
        uint256 amount,
        uint256 duration,
        uint256 cliffDuration
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance for vesting");
        require(cliffDuration <= duration, "Cliff duration cannot exceed total duration");

        vestingSchedules[account] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            cliffDuration: cliffDuration
        });

        // Transfer tokens to the contract
        _transfer(msg.sender, address(this), amount);

        emit VestingScheduleSet(account, amount, duration, cliffDuration);
    }

    function claimVestedTokens() public whenNotPaused nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(block.timestamp >= schedule.startTime + schedule.cliffDuration, "Cliff period not over");

        uint256 elapsedTime = block.timestamp - schedule.startTime;
        uint256 vestedAmount;
        if (elapsedTime >= schedule.duration) {
            vestedAmount = schedule.totalAmount;
        } else {
            vestedAmount = (schedule.totalAmount * elapsedTime) / schedule.duration;
        }

        uint256 claimableAmount = vestedAmount - schedule.releasedAmount;
        require(claimableAmount > 0, "No tokens to claim");

        schedule.releasedAmount += claimableAmount;

        console.log("Claiming %s tokens", claimableAmount);
        console.log("Vested amount: %s", vestedAmount);
        console.log("Released amount: %s", schedule.releasedAmount);
        console.log("Sender balance: %s", balanceOf(msg.sender));
        console.log("This balance: %s", balanceOf(address(this)));

        _transfer(address(this), msg.sender, claimableAmount);
        emit VestingClaimed(msg.sender, claimableAmount);
    }

    function getVestingInfo(address account) public view whenNotPaused returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 vestedAmount,
        uint256 claimableAmount,
        uint256 startTime,
        uint256 duration,
        uint256 cliffDuration
    ) {
        VestingSchedule storage schedule = vestingSchedules[account];
        totalAmount = schedule.totalAmount;
        releasedAmount = schedule.releasedAmount;
        startTime = schedule.startTime;
        duration = schedule.duration;
        cliffDuration = schedule.cliffDuration;

        if (block.timestamp < startTime + cliffDuration) {
            vestedAmount = 0;
        } else if (block.timestamp >= startTime + duration) {
            vestedAmount = totalAmount;
        } else {
            vestedAmount = (totalAmount * (block.timestamp - startTime)) / duration;
        }

        claimableAmount = vestedAmount > releasedAmount ? vestedAmount - releasedAmount : 0;
    }

    function transfer(address recipient, uint256 amount) public virtual override whenNotPaused returns (bool) {
        _customTransfer(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override whenNotPaused returns (bool) {
        _customTransfer(sender, recipient, amount);
        uint256 currentAllowance = allowance(sender, _msgSender());
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }
        return true;
    }

    function _customTransfer(address sender, address recipient, uint256 amount) internal whenNotPaused {
        require(!blacklistStatus[sender] && !blacklistStatus[recipient], "Address is blacklisted");
        
        uint256 fee = 0;
        if (!whitelistStatus[sender] && !whitelistStatus[recipient] && !isExemptFromFees[sender] && !isExemptFromFees[recipient]) {
            uint256 feeRate = getFeeRate(amount);
            fee = yakklTreasury.calculateFee(amount, feeRate);
            uint256 netAmount = amount - fee;

            if (fee > 0 && recipient != address(0)) {
                
                console.log("Treasury fee:", fee);

                super._transfer(sender, address(yakklTreasury), fee);
                yakklTreasury.distributeFees(fee);
                amount = netAmount;
            }
        }

        _checkRateLimit(sender, amount);
        super._transfer(sender, recipient, amount);

        transactionCount++;
        transactionHistory[transactionCount] = TransactionInfo({
            from: sender,
            to: recipient,
            amount: amount,
            fee: fee,
            timestamp: block.timestamp
        });
    }

    function _checkRateLimit(address sender, uint256 amount) internal whenNotPaused {
        if (block.timestamp > lastTransferTimestamp[sender] + rateLimitPeriod) {
            transferredInPeriod[sender] = amount;
        } else {
            transferredInPeriod[sender] += amount;
        }
        require(transferredInPeriod[sender] <= rateLimitAmount, "Transfer exceeds rate limit");
        lastTransferTimestamp[sender] = block.timestamp;
    }

    function getTransactionInfo(uint256 transactionId) external view returns (TransactionInfo memory) {
        return transactionHistory[transactionId];
    }

    function burn(uint256 amount) public override {
        _burn(_msgSender(), amount);
        _totalBurned += amount;
    }

    function burnFrom(address account, uint256 amount) public override {
        uint256 currentAllowance = allowance(account, _msgSender());
        
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
        _totalBurned += amount;
    }

    function totalBurned() public view returns (uint256) {
        return _totalBurned;
    }

    function isBlacklisted(address account) public view returns (bool) {
        return blacklistStatus[account];
    }
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function isWhitelisted(address account) public view returns (bool) {
        return whitelistStatus[account];
    }
}
