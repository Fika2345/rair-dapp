const Joi = require('joi');
const { ethAddress, blockchainNetworks, ethTransaction, mongoId } = require('./reusableCustomTypes');

module.exports = {
    dbContracts: Joi.object({
        title: Joi.string(),
        user: ethAddress,
        blockchain: blockchainNetworks,
        contractAddress: ethAddress,
        diamond: Joi.boolean(),
        creationDate: Joi.date(),
        transactionHash: ethTransaction,
        lastSyncedBlock: Joi.string(),
        external: Joi.boolean(),
        singleMetadata: Joi.boolean(),
        metadataURI: Joi.string(),
        importedBy: ethAddress,
        blockSync: Joi.boolean(),
        blockView: Joi.boolean(),
    }),
    dbProducts: Joi.object({
        name: Joi.string(),
        collectionIndexInContract: Joi.string(),
        contract: mongoId,
        copies: Joi.number(),
        soldCopies: Joi.number(),
        sold: Joi.boolean(),
        royalty: Joi.number(),
        firstTokenIndex: Joi.string(),
        cover: Joi.string(),
        creationDate: Joi.date(),
        transactionHash: ethTransaction,
        diamond: Joi.boolean(),
        singleMetadata: Joi.boolean(),
        metadataURI: Joi.string(),
    }),
    dbTokens: {
        token: Joi.string(),
        uniqueIndexInContract: Joi.string(),
        ownerAddress: Joi.string(),
        offerPool: Joi.string(),
        offer: Joi.string(),
        contract: mongoId,
        metadataURI: Joi.string(),
        authenticityLink: Joi.string(),
        isMinted: Joi.boolean(),
        isMetadataPinned: Joi.boolean(),
        isURIStoredToBlockchain: Joi.boolean(),
        creationDate: Joi.date(),
        product: Joi.string(),
    },
    dbOffers: Joi.object({
        offerIndex: Joi.string(),
        contract: mongoId,
        product: Joi.string(),
        offerPool: Joi.string(),
        copies: Joi.number(),
        soldCopies: Joi.number(),
        sold: Joi.boolean(),
        price: Joi.string(),
        range: Joi.array().items(Joi.string()).max(2),
        offerName: Joi.string(),
        creationDate: Joi.date(),
        diamond: Joi.boolean(),
        diamondRangeIndex: Joi.string(),
        transactionHash: ethTransaction,
    }),
    dbResales: Joi.object({
        operator: ethAddress,
        contract: mongoId,
        tokenId: Joi.boolean(),
        price: Joi.boolean(),
        status: Joi.boolean(),
        tradeid: Joi.string(),
    }),
    dbRoyalties: Joi.object({
        contract: mongoId,
        recipients: Joi.number(),
        remainderForSeller: Joi.number(),
    }),
};