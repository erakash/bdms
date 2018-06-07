const express = require('express');
const cryptico = require('cryptico-js');
const app = express();
const DIFFICULTY = 2;
const RSABITS = 1024; 
var SHA256 = require("crypto-js/sha256");
var CryptoJS = require("crypto-js");

class Blockchain{
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = DIFFICULTY;
    }

    createGenesisBlock() {
        return new Block(0, "01/01/2018", "Genesis block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().currenthash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.currenthash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.currenthash) {
                return false;
            }
        }
        return true;
    }
}

//Create GUID 

function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

/*This class defines a basic block in which user information can be stored. Basically a block will contain multiple
transactions having multiple documents but here for simplicity we are using one block per document.*/

class Block {
    constructor(blockheight,timestamp,previousHash = '',transaction) {
        this.blockheight = blockheight;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.transaction = transaction;
        this.currenthash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.blockheight + this.previousHash + JSON.stringify(this.transaction) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.currenthash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.currenthash = this.calculateHash();
        }
        console.log("BLOCK MINED: " + this.currenthash);
    }
}

class Transaction{
    constructor(transactionid,timestamp,data,referencedtransactionid,fromaddress,toaddress)
    {
        this.transactionid = transactionid;
        this.timestamp = timestamp;
        this.data = data;
        if(data==null)
        {
            this.isshared = new Boolean(true);
        }
        else
        {
            this.isshared = new Boolean(false);
        }
        this.referencedtransactionid = referencedtransactionid;
        this.fromaddress = fromaddress;
        this.toaddress = toaddress;
    }
}
//Asset
class Data{
    constructor(EncryptedSignedDocument,EncryptedSecretKey)
    {
        this.EncryptedSignedDocument = EncryptedSignedDocument;
        this.EncryptedSecretKey = EncryptedSecretKey;
    }
}

function RandomSecretKeyGenerator()
{
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function GenerateAddressAndKey(PassPhrase)
{
    var KeyPair = {};
    KeyPair.RSAPrivateKey = cryptico.generateRSAKey(PassPhrase, RSABITS);
    KeyPair.RSAAddress = cryptico.publicKeyString(KeyPair.RSAPrivateKey);
    return KeyPair;
}

//User Functions Issue and Share
function ISSUE(FromAddress,ToAddress,Document)
{
    var SecretKey = RandomSecretKeyGenerator();
    var EncryptedDocument = CryptoJS.AES.encrypt(Document, SecretKey).toString();
    var EncryptedSecretKey = cryptico.encrypt(SecretKey, ToAddress);
    var data = new Data(EncryptedDocument,EncryptedSecretKey);
    var trans = new Transaction(guid(),Date.now(),data,null,FromAddress,ToAddress);
    console.log(trans);
    var newblock = new Block(blockchain.getLatestBlock().blockheight+1,Date.now(),blockchain.getLatestBlock().currenthash,trans);
    blockchain.addBlock(newblock);
}

function SHARE(FromAddress,ToAddress,TransactionID)
{

}

var blockchain = new Blockchain();
blockchain.createGenesisBlock();
var keypair1 = GenerateAddressAndKey("HelloWorld");
var keypair2 = GenerateAddressAndKey("HelloWorld");
ISSUE(keypair1.RSAAddress,keypair2.RSAAddress,"Test Document");
app.get('/GetBlockChain', (req, res) => res.send(blockchain));
app.get('/GetLatestBlock', (req, res) => res.send(blockchain.getLatestBlock()));
app.listen(3000, () => console.log('Example app listening on port 3000!'));



