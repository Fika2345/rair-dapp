const { expect } = require("chai");

describe("Token Factory", function () {
	let owner, addr1, addr2, addr3, addr4, addrs;
	let ERC777Factory, erc777instance, erc777ExtraInstance;
	let FactoryFactory, factoryInstance;
	let RAIR721Factory, rair721Instance;
	let tokensDeployed;
	const initialSupply = 20;
	const tokenPrice = 5;

	before(async function() {
		[owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();	
		ERC777Factory = await ethers.getContractFactory("RAIR777");
		FactoryFactory = await ethers.getContractFactory("RAIR_Token_Factory");
		RAIR721Factory = await ethers.getContractFactory("RAIR_ERC721");
		RAIR721Factory.deploy(owner.address, initialSupply, 30000);
	});

	describe('Deployments', function() {
		it ("ERC777", async function() {
			erc777instance = await ERC777Factory.deploy(initialSupply, [addr1.address]);
			erc777ExtraInstance = await ERC777Factory.deploy(initialSupply * 2, [addr2.address]);

			expect(await erc777instance.name()).to.equal("RAIR Test");
			expect(await erc777instance.symbol()).to.equal("RAIRTee");
			expect(await erc777instance.decimals()).to.equal(18);
			expect(await erc777instance.granularity()).to.equal(1);
			expect(await erc777instance.totalSupply()).to.equal(initialSupply);

			erc777instance.on('Sent', (from, to, value) => {
				console.log(from, 'Sent', value.toString(), 'to', to);
			});
		});

		it ("Factory", async function() {
			factoryInstance = await FactoryFactory.deploy(tokenPrice, erc777instance.address);
			expect(await erc777instance.deployed());
		});
	})

	describe('Factory', function() {
		describe('Users', function() {
			it ("Roles should be set up", async function() {
				expect(await factoryInstance.hasRole(await factoryInstance.OWNER(), owner.address)).to.equal(true);
				expect(await factoryInstance.hasRole(await factoryInstance.ERC777(), erc777instance.address)).to.equal(true);
				expect(await factoryInstance.getRoleAdmin(await factoryInstance.ERC777())).to.equal(await factoryInstance.OWNER());
				expect(await factoryInstance.getRoleAdmin(await factoryInstance.OWNER())).to.equal(await factoryInstance.DEFAULT_ADMIN_ROLE());
			});

			it ("Only approved ERC777s can send tokens", async function() {
				expect(erc777ExtraInstance.send(factoryInstance.address, tokenPrice, ethers.utils.toUtf8Bytes('')))
					.to.be.revertedWith(`AccessControl: account ${erc777ExtraInstance.address.toLowerCase()} is missing role ${await factoryInstance.ERC777()}`);
				expect(factoryInstance.tokensReceived(owner.address, owner.address, factoryInstance.address, tokenPrice, ethers.utils.toUtf8Bytes(''),  ethers.utils.toUtf8Bytes('')))
					.to.be.revertedWith(`AccessControl: account ${owner.address.toLowerCase()} is missing role ${await factoryInstance.ERC777()}`);
			});

			it ("Reverts if there aren't enough tokens for at least 1 contract", async function() {
				expect(erc777instance.send(factoryInstance.address, tokenPrice - 1, ethers.utils.toUtf8Bytes('')))
					.to.be.revertedWith('RAIR Factory: not enough RAIR tokens to deploy a contract');
			});

			it ("Mint a token after an ERC777 transfer", async function() {
				// Should return leftover tokens
				expect(await erc777instance.send(factoryInstance.address, tokenPrice + 1, ethers.utils.toUtf8Bytes(''))).to.emit(erc777instance, "Sent");
				expect(await erc777instance.balanceOf(owner.address)).to.equal(initialSupply - tokenPrice);
				expect(await erc777instance.balanceOf(factoryInstance.address)).to.equal(tokenPrice);
			});

			it ("Return the ERC777 price of an NFT", async function() {
				expect(await factoryInstance.erc777ToNFTPrice(erc777instance.address)).to.equal(tokenPrice);
			});

			it ("Return the creator's tokens", async function() {
				tokensDeployed = await factoryInstance.tokensByOwner(owner.address);
				expect(tokensDeployed.length).to.equal(1);
			});

			it ("Return the token's creator", async function() {
				expect(await factoryInstance.tokenToOwner(tokensDeployed[0])).to.equal(owner.address);
			});
		});

		describe('Owner', function() {
			it ("Only the owner can add ERC777 tokens", async function() {
				let factoryAsAddress1 = factoryInstance.connect(addr1);
				expect(factoryAsAddress1.grantRole(await factoryInstance.ERC777(), erc777ExtraInstance.address))
					.to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${await factoryInstance.OWNER()}`);
			});

			it ("Add a new ERC777 token", async function() {
				expect(await factoryInstance.add777Token(erc777ExtraInstance.address, tokenPrice * 2)).to.emit(factoryInstance, 'RoleGranted');
			});

			it ("Mint a token after another ERC777 transfer", async function() {
				expect(await erc777ExtraInstance.send(factoryInstance.address, tokenPrice * 2, ethers.utils.toUtf8Bytes(''))).to.emit(erc777ExtraInstance, "Sent");
				expect(await erc777ExtraInstance.balanceOf(owner.address)).to.equal((initialSupply - tokenPrice) * 2);
				expect(await erc777ExtraInstance.balanceOf(factoryInstance.address)).to.equal(tokenPrice * 2);
				expect((await factoryInstance.tokensByOwner(owner.address)).length).to.equal(2);
				expect(await factoryInstance.tokenToOwner(tokensDeployed[0])).to.equal(owner.address);
			});

			it ("Only the owner can remove an ERC777 token", async function() {
				let factoryAsAddress1 = factoryInstance.connect(addr1);
				expect(factoryAsAddress1.revokeRole(await factoryInstance.ERC777(), erc777ExtraInstance.address))
					.to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${await factoryInstance.OWNER()}`);
			});

			it ("Remove an ERC777 token", async function() {
				expect(await factoryInstance.remove777Token(erc777ExtraInstance.address)).to.emit(factoryInstance, 'RoleRevoked');
			});

			it ("Only the owner can renounce to his role", async function() {
				let factoryAsAddress1 = factoryInstance.connect(addr1);
				expect(factoryAsAddress1.renounceRole(await factoryInstance.OWNER(), owner.address))
					.to.be.revertedWith(`AccessControl: can only renounce roles for self`);
			});
		});
	})

	describe('RAIR Enumerable 721', function() {
		describe('Metadata', function() {
			it ("Roles should be set up", async function() {
				rair721Instance = await RAIR721Factory.attach(tokensDeployed[0])
				expect(await rair721Instance.hasRole(await rair721Instance.CREATOR(), owner.address)).to.equal(true);
				expect(await rair721Instance.getRoleAdmin(await rair721Instance.MINTER())).to.equal(await rair721Instance.CREATOR());
			});

			it ("Correct creator address", async function() {
				expect(await rair721Instance.creatorAddress()).to.equal(owner.address);
			});

			it ("Correct token name", async function() {
				expect(await rair721Instance.name()).to.equal("Collectable RAIR Token");
			});

			it ("Correct token symbol", async function() {
				expect(await rair721Instance.symbol()).to.equal("RAIR");
			});

			it ("Only the owner can renounce to his role", async function() {
				let rair721AsAddress1 = rair721Instance.connect(addr1);
				expect(rair721AsAddress1.renounceRole(await rair721Instance.CREATOR(), owner.address))
					.to.be.revertedWith(`AccessControl: can only renounce roles for self`);
			});
		});

		describe('Supply', function() {
			it ("Correct initial supply of 0", async function() {
				expect(await rair721Instance.totalSupply()).to.equal(0);
				expect(rair721Instance.ownerOf(1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
			});

			it ("Unauthorized addresses can't mint", async function() {
				let rair721AsAddress2 = rair721Instance.connect(addr2);
				expect(rair721AsAddress2.mint(addr3.address, 0))
					.to.be.revertedWith(`AccessControl: account ${addr2.address.toLowerCase()} is missing role ${await rair721Instance.MINTER()}`);
			});

			it ("Increase the supply limit", async function() {
				expect(await rair721Instance.supplyLimit()).to.equal(0);
				await rair721Instance.setSupplyLimit(2);
				expect(await rair721Instance.supplyLimit()).to.equal(2);
			});

			it ("Authorize a Minter", async function() {
				expect(await rair721Instance.hasRole(await rair721Instance.MINTER(), addr2.address)).to.equal(false);
				expect(await rair721Instance.addMinter(addr2.address)).to.emit(rair721Instance, 'RoleGranted');
				expect(await rair721Instance.hasRole(await rair721Instance.MINTER(), addr2.address)).to.equal(true);
			});

			it ("Minter can mint", async function() {
				let rair721AsAddress2 = rair721Instance.connect(addr2);
				expect(await rair721AsAddress2.mint(addr3.address, 0)).to.emit(rair721Instance, 'Transfer');
			});

			it ("Minter cannot mint the same token twice", async function() {
				let rair721AsAddress2 = rair721Instance.connect(addr2);
				expect(rair721AsAddress2.mint(addr3.address, 0)).to.be.revertedWith('ERC721: token already minted');
			});

			it ("Minter cannot mint past the limit", async function() {
				let rair721AsAddress2 = rair721Instance.connect(addr2);
				expect(await rair721AsAddress2.mint(addr4.address, 412)).to.emit(rair721Instance, 'Transfer');
				expect(rair721AsAddress2.mint(addr3.address, 2)).to.be.revertedWith('RAIR ERC721: Cannot mint more tokens');
			});

			it ("Unauthorize a Minter", async function() {
				let rair721AsAddress2 = rair721Instance.connect(addr2);
				expect(await rair721Instance.hasRole(await rair721Instance.MINTER(), addr2.address)).to.equal(true);
				expect(await rair721Instance.removeMinter(addr2.address)).to.emit(rair721Instance, 'RoleRevoked');
				expect(await rair721Instance.hasRole(await rair721Instance.MINTER(), addr2.address)).to.equal(false);
				expect(rair721AsAddress2.mint(addr3.address, 0))
					.to.be.revertedWith(`AccessControl: account ${addr2.address.toLowerCase()} is missing role ${await rair721Instance.MINTER()}`);
			});
		});

		describe('Token Data', function() {
			it ("Token Index", async function() {
				expect(await rair721Instance.tokenByIndex(0)).to.equal(0);
				expect(await rair721Instance.tokenByIndex(1)).to.equal(412);
			});

			it ("Token Owners", async function() {
				expect(await rair721Instance.ownerOf(0)).to.equal(addr3.address);
				expect(await rair721Instance.ownerOf(412)).to.equal(addr4.address);
			});

			it ("Owner balances", async function() {
				expect(await rair721Instance.balanceOf(owner.address)).to.equal(0);
				expect(await rair721Instance.balanceOf(addr1.address)).to.equal(0);
				expect(await rair721Instance.balanceOf(addr2.address)).to.equal(0);
				expect(await rair721Instance.balanceOf(addr3.address)).to.equal(1);
				expect(await rair721Instance.balanceOf(addr4.address)).to.equal(1);
			});

			it ("Token Indexes by Owner", async function() {
				expect(await rair721Instance.tokenOfOwnerByIndex(addr3.address, 0)).to.equal(0);
				expect(await rair721Instance.tokenOfOwnerByIndex(addr4.address, 0)).to.equal(412);
			});
		});

		describe('Token Operations', function() {
			it ("Single approval", async function() {
				let rair721AsAddress4 = await rair721Instance.connect(addr4);
				expect(await rair721AsAddress4.approve(addr2.address, 412))
					.to.emit(rair721Instance, 'Approval')
				expect(await rair721Instance.getApproved(412)).to.equal(addr2.address);
			});

			it ("Full approval", async function() {
				let rair721AsAddress4 = await rair721Instance.connect(addr4);
				expect(await rair721AsAddress4.setApprovalForAll(addr1.address, true))
					.to.emit(rair721Instance, 'ApprovalForAll');
				expect(await rair721Instance.isApprovedForAll(addr4.address, addr1.address)).to.equal(true);
			});

			it ("Third party transfer", async function() {
				let rair721AsAddress2 = await rair721Instance.connect(addr2);
				//transferFrom(from, to, tokenId) is discouraged by OpenZeppelin
				expect(await rair721Instance.ownerOf(412)).to.equal(addr4.address);
				expect(await rair721AsAddress2['safeTransferFrom(address,address,uint256)'](
					addr4.address, owner.address, 412
				)).to.emit(rair721Instance, 'Transfer');
				expect(await rair721Instance.ownerOf(412)).to.equal(owner.address);
			});
		});

		describe('Market', function() {
			it ("Correct default creator fee", async function() {
				expect((await rair721Instance.royaltyInfo(412, 100000, ethers.utils.randomBytes(8)))[1]).to.equal(30000);
			});
		});

		it ("TODO: Test Transfers from the marketplace ", console.log(''));
	})
})