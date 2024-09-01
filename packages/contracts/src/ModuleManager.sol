// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

interface IModule {
    function executeTransaction(
        address to,
        uint256 value,
        bytes memory data
    ) external returns (bool success);
}

contract ModuleManager is Initializable {
    event ModuleAdded(address indexed module);
    event ModuleRemoved(address indexed module);

    mapping(address => bool) public modules;
    address[] public moduleList;

    function __ModuleManager_init() internal initializer {}

    function addModule(address module) public virtual {
        require(!modules[module], "Module already exists");
        modules[module] = true;
        moduleList.push(module);
        emit ModuleAdded(module);
    }

    function removeModule(address module) public virtual {
        require(modules[module], "Module does not exist");
        modules[module] = false;
        for (uint256 i = 0; i < moduleList.length; i++) {
            if (moduleList[i] == module) {
                moduleList[i] = moduleList[moduleList.length - 1];
                moduleList.pop();
                break;
            }
        }
        emit ModuleRemoved(module);
    }

    function executeFromModule(
        address to,
        uint256 value,
        bytes memory data
    ) public virtual returns (bool success) {
        require(modules[msg.sender], "Not authorized");
        (success, ) = to.call{value: value}(data);
    }
}
