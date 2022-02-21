// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.11; 

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct feeSplits {
	address recipient;
	uint percentage;
}

struct mintingOffer {
	address erc721Address;
	address nodeAddress;
	uint rangeIndex;
	feeSplits[] fees;
	bool visible;
}

struct RoleData {
	mapping(address => bool) members;
	bytes32 adminRole;
}

struct AppStorage {
	// Access Control Enumerable
	mapping(bytes32 => RoleData) _roles;
	mapping(bytes32 => EnumerableSet.AddressSet) _roleMembers;
	// App
	uint16 decimals;
	uint decimalPow;
	uint nodeFee;
	uint treasuryFee;
	address treasuryAddress;
	mintingOffer[] mintingOffers;
	mapping(address => mapping(uint => uint)) addressToRangeOffer;
	mapping(address => uint[]) addressToOffers;
	// Always add new fields at the end of the struct, that way the structure can be upgraded
}

library LibAppStorage {
	function diamondStorage() internal pure	returns (AppStorage storage ds) {
		assembly {
			ds.slot := 0
		}
	}
}

contract AccessControlAppStorageEnumerableMarket is Context {
	using EnumerableSet for EnumerableSet.AddressSet;
	
	AppStorage internal s;

	event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
	event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    modifier onlyRole(bytes32 role) {
        _checkRole(role, _msgSender());
        _;
    }

    function renounceRole(bytes32 role, address account) public {
        require(account == _msgSender(), "AccessControl: can only renounce roles for self");
        _revokeRole(role, account);
    }

    function grantRole(bytes32 role, address account) public onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    function _checkRole(bytes32 role, address account) internal view {
        if (!hasRole(role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        Strings.toHexString(uint160(account), 20),
                        " is missing role ",
                        Strings.toHexString(uint256(role), 32)
                    )
                )
            );
        }
    }

	function hasRole(bytes32 role, address account) public view returns (bool) {
		return s._roles[role].members[account];
	}

	function getRoleAdmin(bytes32 role) public view returns (bytes32) {
		return s._roles[role].adminRole;
	}

	function getRoleMember(bytes32 role, uint256 index) public view returns (address) {
		return s._roleMembers[role].at(index);
	}

	function getRoleMemberCount(bytes32 role) public view returns (uint256) {
		return s._roleMembers[role].length();
	}

	function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
		bytes32 previousAdminRole = getRoleAdmin(role);
		s._roles[role].adminRole = adminRole;
		emit RoleAdminChanged(role, previousAdminRole, adminRole);
	}

	function _grantRole(bytes32 role, address account) internal {
		if (!hasRole(role, account)) {
			s._roles[role].members[account] = true;
			emit RoleGranted(role, account, _msgSender());
			s._roleMembers[role].add(account);
		}
	}

	function _revokeRole(bytes32 role, address account) internal {
		if (hasRole(role, account)) {
			s._roles[role].members[account] = false;
			emit RoleRevoked(role, account, _msgSender());
			s._roleMembers[role].remove(account);
		}
	}
}