const fa = require("@glif/filecoin-address");
const _ethers = require("ethers");
const ODudeName = require("@odude/oduderesolve");
const express = require('express');
const app = express();
require('dotenv').config();

const settings = {
  matic_rpc_url: process.env.MATIC_RPC,
  eth_rpc_url: process.env.ETH_RPC,
  fvm_rpc_url: process.env.FVM_RPC,
  wallet_pvt_key: process.env.PVT_KEY
};

// Redirect from root to /api
app.get('/', (req, res) => {
    res.redirect('/api');
  });

const resolve = new ODudeName(settings);

module.exports = async (req, res) => {
  let query = req.query;
  console.log(query);

  if (typeof query.address !== 'undefined') {
    // Search for ETH address
    if (!_ethers.utils.isAddress(query.address)) {
      let fil = fa.validateAddressString(query.address);
      if (fil) {
        const convert_t4 = fa.ethAddressFromDelegated(query.address).toString();
        return addr_to_domain(convert_t4, res);
      } else {
        return res.json({ error: 'Invalid address', code: 400 });
      }
    } else {
      // ETH address search
      return addr_to_domain(query.address, res);
    }
  } else if (typeof query.name !== 'undefined' && typeof query.type !== 'undefined') {
    if (query.type === 'uri') {
      return domain_to_uri(query.name, res);
    } else {
      return domain_to_ipfs(query.name, res);
    }
  } else {
    if (typeof query.name !== 'undefined') {
      const currency = query.currency || 'ETH';
      return domain_to_addr(query.name, currency, res);
    } else {
      return res.json({ error: 'Must define [name] & [currency] parameters' });
    }
  }
};

// Domain to Address
function domain_to_addr(name, currency, res) {
  resolve.getAddress(name, currency).then(x => {
    if (x == null) {
      return res.json({ address: x, code: 404 });
    } else {
      return res.json({ address: x, code: 200 });
    }
  }).catch(console.error);
}

// Address to Domain
function addr_to_domain(address, res) {
  const convert_f4 = fa.newDelegatedEthAddress(address).toString();
  resolve.getDomain(address, "W3D").then(x => {
    if (x == null || x === '') {
      return addr_to_domain_ens(address, res);
    } else {
      return res.json({ domain: x, code: 200, fvm: convert_f4, eth: address });
    }
  }).catch(console.error);
}

// Address to domain for ENS
function addr_to_domain_ens(address, res) {
  const convert_t4 = fa.delegatedFromEthAddress(address).toString();
  resolve.getDomain(address, "ENS").then(x => {
    if (x == null) {
      return res.json({ domain: x, code: 404 });
    } else {
      return res.json({ domain: x, code: 200, fvm: convert_t4, eth: address });
    }
  }).catch(console.error);
}

// Find IPFS from domain
function domain_to_ipfs(name, res) {
  resolve.getWeb(name).then(x => {
    if (x == null) {
      return res.json({ ipfs: x, code: 404 });
    } else {
      return res.json({ ipfs: x, code: 200 });
    }
  }).catch(console.error);
}

// Find URI from domain
function domain_to_uri(name, res) {
  resolve.w3d_tokenURI(name).then(x => {
    if (x == null) {
      return res.json({ tokenURI: x, code: 404 });
    } else {
      return res.json({ tokenURI: x, code: 200 });
    }
  }).catch(console.error);
}
