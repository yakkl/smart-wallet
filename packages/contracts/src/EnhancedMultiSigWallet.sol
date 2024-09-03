// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin-upgradeable/contracts/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./OwnerManager.sol";
import "./GuardManager.sol";
import "./ModuleManager.sol";
import "./FallbackManager.sol";


contract EnhancedMultiSigWallet is 
    Initializable, 
    UUPSUpgradeable, 
    OwnerManager, 
    GuardManager, 
    ModuleManager, 
    FallbackManager,
    ReentrancyGuardUpgradeable
{
    uint256 private _nonce;
    
    bytes32 private constant DOMAIN_SEPARATOR_TYPEHASH = 
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant TRANSACTION_TYPEHASH = 
        keccak256("Transaction(address to,uint256 value,bytes data,uint256 nonce,uint256 executeAfter,uint256 executeWithin)");
    
    string public constant NAME = "YAKKL Enhanced MultiSig";
    string public constant VERSION = "1.0.0";
    
    uint256 public executeAfterPeriod;
    uint256 public executeWithinPeriod;
    
    event TransactionExecuted(bytes32 indexed txHash, address indexed target, uint256 value, bytes data);
    event TransactionFailed(bytes32 indexed txHash, address indexed target, uint256 value, bytes data);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory _owners,
        uint256 _threshold,
        uint256 _executeAfterPeriod,
        uint256 _executeWithinPeriod
    ) public initializer {
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __OwnerManager_init(_owners, _threshold);
        __GuardManager_init();
        __ModuleManager_init();
        __FallbackManager_init();
        executeAfterPeriod = _executeAfterPeriod;
        executeWithinPeriod = _executeWithinPeriod;
    }

    function proposeTransaction(
        address _to,
        uint256 _value,
        bytes memory _data,
        uint256 _executeAfter,
        uint256 _executeWithin
    ) public onlyOwner returns (bytes32) {
        require(_executeAfter >= block.timestamp + executeAfterPeriod, "Execute after period too short");
        require(_executeWithin <= executeWithinPeriod, "Execute within period too long");
        
        bytes32 txHash = keccak256(abi.encode(
            TRANSACTION_TYPEHASH,
            _to,
            _value,
            keccak256(_data),
            _nonce,
            _executeAfter,
            _executeWithin
        ));
        
        _nonce++;
        
        return txHash;
    }

    function executeTransaction(
        address _to,
        uint256 _value,
        bytes memory _data,
        uint256 _executeAfter,
        uint256 _executeWithin,
        bytes[] memory _signatures
    ) public nonReentrant {
        bytes32 txHash = keccak256(abi.encode(
            TRANSACTION_TYPEHASH,
            _to,
            _value,
            keccak256(_data),
            _nonce - 1,
            _executeAfter,
            _executeWithin
        ));
        
        require(block.timestamp >= _executeAfter, "Execution time not reached");
        require(block.timestamp <= _executeAfter + _executeWithin, "Execution window passed");
        
        require(_checkSignatures(txHash, _signatures), "Invalid signatures");
        
        _beforeExecution(txHash, _to, _value, _data);
        
        (bool success, ) = _to.call{value: _value}(_data);
        
        if (success) {
            emit TransactionExecuted(txHash, _to, _value, _data);
        } else {
            emit TransactionFailed(txHash, _to, _value, _data);
        }
        
        _afterExecution(txHash, success);
    }

    function _checkSignatures(bytes32 txHash, bytes[] memory signatures) internal view returns (bool) {
        require(signatures.length >= threshold, "Not enough signatures");
        
        address[] memory signersSet = new address[](signatures.length);
        uint256 signersCount = 0;
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(txHash, signatures[i]);
            require(isOwner[signer], "Signer is not an owner");  // Changed from isOwner(signer) to isOwner[signer]
            
            bool isDuplicate = false;
            for (uint256 j = 0; j < signersCount; j++) {
                if (signersSet[j] == signer) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Duplicate signature");
            
            signersSet[signersCount] = signer;
            signersCount++;
        }
        
        return signersCount >= threshold;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
