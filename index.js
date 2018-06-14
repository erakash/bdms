const express = require('express');
const cryptico = require('cryptico-js');
const app = express();
var SHA256 = require("crypto-js/sha256");
var CryptoJS = require("crypto-js");
var path = require('path');


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
        return new Block(0, "01/01/2018", "Genesis block", "Transaction{transactionid: 'This is genesis block Trans Id'}");
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
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }
  
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  //Function to get encrypted secret key of transaction given a transaction id------
  function GetEncryptedSecretKeyOfTransaction(transactionid){
    for (var i = 0; i < chain.length; i++){
        var transid = chain[i].transaction.transactionid;
        if(transid == transactionid)
        {  
            return chain[i].transaction.data.EncryptedSecretKey;
        }          
    }
}

  //Function to get Issued Transactions------
  function GetIssuedTransactions(FromAddress){
      var result = [];
    for (var i = 0; i < chain.length; i++){
        var TransFromAddress = chain[i].transaction.fromaddress;
        if(FromAddress == TransFromAddress)
        {  
            result.push(chain[i].transaction);
        }          
    }
    return JSON.stringify(result);
}

  //Function to get Shared Transactions------
  function GetSharedTransactions(ToAddress){
    var result = [];
    for (var i = 0; i < chain.length; i++){
        var TransToAddress = chain[i].transaction.toaddress;
        if(ToAddress == TransToAddress)
        {  
            result.push(chain[i].transaction);
        }          
    }
    return JSON.stringify(result);
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
        //console.log("BLOCK MINED: " + this.currenthash);
    }
}

//-------------This class defines a transactions and data which will go inside it-------------------//
class Transaction{
    constructor(newtransid,timestamp,data,referencedtransactionid,fromaddress,toaddress)
    {
        this.transactionid = newtransid;
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
    var newblock = new Block(blockchain.getLatestBlock().blockheight+1,Date.now(),blockchain.getLatestBlock().currenthash,trans);
    blockchain.addBlock(newblock);
}

function SHARE(FromAddress,ToAddress,TransactionID,UnlockingKey)
{
    var KeyPair = GenerateAddressAndKey(UnlockingKey);
    var EncryptedSecretKey = GetEncryptedSecretKeyOfTransaction(TransactionID).cipher;   
    var SecretKey = cryptico.decrypt(EncryptedSecretKey, KeyPair.RSAPrivateKey); 
    var EncryptedSecretKeyNew = cryptico.encrypt(SecretKey, ToAddress);
    var trans = new Transaction(guid(),Date.now(),null,TransactionID,FromAddress,ToAddress);
    var newblock = new Block(blockchain.getLatestBlock().blockheight+1,Date.now(),blockchain.getLatestBlock().currenthash,trans);
    blockchain.addBlock(newblock);
}

//-------------------------Code Run Point----------------------------//
var blockchain = new Blockchain();  //Initiate a new blockchain
blockchain.createGenesisBlock();    //Create Genesis Block in the blockchain
var chain = blockchain.chain;

app.get('/GetKeyPair', (req, res) => res.send(GenerateAddressAndKey(req.query.passphrase).RSAAddress));//Api to get public key using passphrase URL - http://localhost:3000/GetKeyPair?passphrase=
app.get('/GetBlockChain', (req, res) => res.send(chain)); //Api to get complete blockchain in JSON URL - http://localhost:3000/getblockchain
app.get('/GetLatestBlock', (req, res) => res.send(blockchain.getLatestBlock()));//Api to latest block in blockchain in JSON URL - http://localhost:3000/GetLatestBlock
app.get('/SHARE', (req, res) => res.send(SHARE(new Buffer(req.query.fromadd, 'base64').toString('utf8'),new Buffer(req.query.toadd, 'base64').toString('utf8'),new Buffer(req.query.transid, 'base64').toString('utf8'),new Buffer(req.query.unlockkey, 'base64').toString('utf8'))));
app.get('/ISSUE', (req, res) => res.send(ISSUE(new Buffer(req.query.fromadd, 'base64').toString('utf8'),new Buffer(req.query.toadd, 'base64').toString('utf8'),new Buffer(req.query.document, 'base64').toString('utf8'))));
app.listen(3000, () => console.log('Example app listening on port 3000!'));
app.get('/GetIssuedTransactions', (req, res) => res.send(GetIssuedTransactions(new Buffer(req.query.fromadd, 'base64'))));
app.get('/GetSharedTransactions', (req, res) => res.send(GetSharedTransactions(new Buffer(req.query.toadd, 'base64'))));


app.get('/BlockChain', function(req, res) {
    res.sendFile(path.join(__dirname + '/BlockChainView.html'));
});

app.get('/Viktor', function(req, res) {
    res.sendFile(path.join(__dirname + '/Viktor.html'));
});