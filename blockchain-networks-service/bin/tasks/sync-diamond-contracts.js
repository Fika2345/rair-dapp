const Moralis = require('moralis/node');
const log = require('../utils/logger')(module);
const { logAgendaActionStart } = require('../utils/agenda_action_logger');
const { AgendaTaskEnum } = require('../enums/agenda-task');
const { processLog, wasteTime } = require('../utils/logUtils.js');

const lockLifetime = 1000 * 60 * 5;

module.exports = (context) => {
	// This will receive all logs emitted from a contract in a certain timeframe and process them
	// Which is cheaper than the current approach of each event for each contract
	context.agenda.define(AgendaTaskEnum.SyncDiamondContracts, { lockLifetime }, async (task, done) => {
		try {
			// Log the start of the task
			logAgendaActionStart({agendaDefinition: AgendaTaskEnum.SyncDiamondContracts});
			
			// Extract network hash and task name from the task data
			const { network, name } = task.attrs.data;

			// Get network data using the task's blockchain hash
			// This includes minter address and factory address
			const networkData = context.config.blockchain.networks[network];

			if (!networkData.diamondFactoryAddress) {
				log.info(`Skipping diamond deployments of ${network}, diamond factory address is not defined.`);
				return done();
			}

			// Fetch Moralis auth data
			const { serverUrl, appId, masterKey } = context.config.blockchain.moralis[networkData.testnet ? 'testnet' : 'mainnet']

			// Initialize moralis instances
			Moralis.start({ serverUrl, appId, masterKey });

			// Get last block parsed from the Versioning collection
			let version = await context.db.Versioning.findOne({ name: AgendaTaskEnum.SyncDiamondContracts, network });

			if (version === null) {
				version = await (new context.db.Versioning({
					name: AgendaTaskEnum.SyncDiamondContracts,
					network,
					number: 0
				})).save();
			}

			/*
				Collection Name 	Description
				------------------------------------------------------------
				'Contract',			Deployed contracts (This file)
				'File', 			No need to sync
				'User', 			No need to sync
				'Product', 			From ERC721 Contracts
				'OfferPool', 		Sync from Minter Marketplace
				'Offer', 			Sync from Minter Marketplace
				'MintedToken', 		Sync from Minter Marketplace
				'LockedTokens', 	From ERC721 Contracts
				'Versioning',		No need to Sync
				'Task',				No need to Sync
				'SyncRestriction',	No need to Sync
				'Transaction'		Syncs on every file
			*/

			// Keep track of the latest block number processed
			let lastSuccessfullBlock = version.number;
			let transactionArray = [];

			// Call Moralis SDK and receive ALL logs emitted in a timeframe
			// This counts as 2 requests in the Rate Limiting (March 2022)
			const options = {
				address: networkData.diamondFactoryAddress,
				chain: network,
				from_block: version.number
			};

			// Result is in DESCENDING order
			const {result, ...logData} = await Moralis.Web3API.native.getLogsByAddress(options);
			log.info(`[${network}] Found ${logData.total} events on diamond master factory since block #${version.number}`);
			
			if (logData.total === 0) {
				return done();
			}

			// Reverse to get it in ascending order (useful for the block number tracking)
			let processedResult = await result.reverse().map(processLog);

			let processedTransactions = await context.db.Transaction.find({
				toAddress: networkData.diamondFactoryAddress,
				blockchainId: network,
				processed: true
			});
			
			let insertions = {};

			for await (let [event] of processedResult) {
				if (!event) {
					continue;
				}
				let [filteredTransaction] = processedTransactions.filter(item => item._id === event.transactionHash)
				if (filteredTransaction && (filteredTransaction.caught || filteredTransaction.toAddress.includes(networkData.diamondFactoryAddress))) {
					log.info(`Ignorning log ${event.transactionHash} because the transaction is already processed for contract ${networkData.diamondFactoryAddress}`);
				} else {
					if (event && event.operation) {

						// If the log is already on DB, update the address list
						if (filteredTransaction) {
							filteredTransaction.toAddress.push(contract);
							await filteredTransaction.save();
						} else if (!transactionArray.includes(event.transactionHash)) {
							// Otherwise, push it into the insertion list
							transactionArray.push(event.transactionHash);
							// And create a DB entry right away
							await (new context.db.Transaction({
								_id: event.transactionHash,
								toAddress: networkData.diamondFactoryAddress,
								processed: true,
								blockchainId: network
							})).save();
						}

						try {
							let documentToInsert = await event.operation(
								context.db,
								network,
								// Make up a transaction data, the logs don't include it
								{
									transactionHash: event.transactionHash,
									to: networkData.diamondFactoryAddress,
									blockNumber: event.blockNumber
								},
								// Force the event to be a diamond
								// I do this because previously the deployment event from the classic and the diamond contracts
								// had the same name, so if by syncing old data I find the old name, it'll register it as a classic
								// event instead of a diamond, forcing it to true here resolves this conflict
								true, //event.diamondEvent
								...event.arguments
							);
							// This used to be for an optimized batch insertion, now it's just for logging
							if (insertions[event.eventSignature] === undefined) {
								insertions[event.eventSignature] = [];
							}
							insertions[event.eventSignature].push(documentToInsert);
						} catch (err) {
							console.error('An error has ocurred!', event);
							throw err;
						}

						// Update the latest successfull block
						if (lastSuccessfullBlock <= event.blockNumber) {
							lastSuccessfullBlock = event.blockNumber;
						}
					}
				}
			}
			for await (let sig of Object.keys(insertions)) {
				if (insertions[sig]?.length > 0) {
					log.info(`Inserted ${insertions[sig]?.length} documents for ${sig}`);
				}
			}

			log.info(`Done with ${network}, ${AgendaTaskEnum.SyncDiamondContracts}`);

			// Add 1 to the last successful block so the next query to Moralis excludes it
			// Because the last successfull block was already processed here
			// But validate that the last parsed block is different from the current one,
			// Otherwise it will keep increasing and could ignore events
			version.running = false;
			if (version.number < lastSuccessfullBlock) {
				version.number = lastSuccessfullBlock + 1;
			}
			await version.save();

			return done();
		} catch (e) {
			log.error(e);
			return done(e);
		}
	});
};