const mongoose = require('mongoose');

const { Schema } = mongoose;

const Metadata = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  artist: { type: String, default: 'none' },
  external_url: { type: String, default: 'none' },
  image: { type: String },
  attributes: { type: Object }
}, { _id: false });

const MintedToken = new Schema({
  token: { type: String, required: true },
  uniqueIndexInContract: { type: Number, required: true },
  ownerAddress: { type: String, lowercase: true },
  offerPool: { type: Number, required: true },
  offer: { type: Number, required: true },
  contract: { type: String, lowercase: true, required: true },
  metadata: Metadata,
  metadataURI: { type: String, default: 'none' },
  isMinted: { type: Boolean, required: true },
  creationDate: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = MintedToken;