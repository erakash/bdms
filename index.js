const express = require('express');
const cryptico = require('cryptico-js');
const app = express();
var SHA256 = require("crypto-js/sha256");
var CryptoJS = require("crypto-js");

//----------------Global Variables-------------------
const DIFFICULTY = 2;
const RSABITS = 1024; 
//---------------------------------------------------


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

//---------Function to create GUID for transactions as Transactions ID-------------
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

//-------------This class defines a transactions and data which will go inside it-------------------//
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

//--------------------This will contains all of the data---------------------------//
class Data{
    constructor(EncryptedSignedDocument,EncryptedSecretKey)
    {
        this.EncryptedSignedDocument = EncryptedSignedDocument;
        this.EncryptedSecretKey = EncryptedSecretKey;
    }
}


//------------------Generate Random Secret key for document encryption-------------//
function RandomSecretKeyGenerator()
{
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}


//-------------------Generate address of the user which is also public key--------//
function GenerateAddressAndKey(PassPhrase)
{
    var KeyPair = {};
    KeyPair.RSAPrivateKey = cryptico.generateRSAKey(PassPhrase, RSABITS);
    KeyPair.RSAAddress = cryptico.publicKeyString(KeyPair.RSAPrivateKey);
    return KeyPair;
}

//------------------------User Functions Issue and Share-----------------------//
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


//-------------------------Code Run Point----------------------------//
var blockchain = new Blockchain();  //Initiate a new blockchain
blockchain.createGenesisBlock();    //Create Genesis Block in the blockchain
var keypair1 = GenerateAddressAndKey("Key1"); //Create key pair 1 for user 1
var keypair2 = GenerateAddressAndKey("Key2"); //Create key pair 2 for user 2
ISSUE(keypair1.RSAAddress,keypair2.RSAAddress,"Test Document"); //Sample transaction - Issue a test document to user 2

app.get('/GetBlockChain', (req, res) => res.send(blockchain)); //Api to get complete blockchain in JSON URL - http://localhost:3000/getblockchain
app.get('/GetLatestBlock', (req, res) => res.send(blockchain.getLatestBlock()));//Api to latest block in blockchain in JSON URL - http://localhost:3000/GetLatestBlock
app.listen(3000, () => console.log('Example app listening on port 3000!'));



