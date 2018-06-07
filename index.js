const express = require('express');
const app = express();
var SHA256 = require("crypto-js/sha256");

class Blockchain{
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
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

var blockchain = new Blockchain();
blockchain.createGenesisBlock();
var data = new Data('This is encrypted Signed Document 1','EncryptedSecretKeyForDoc1');
var trans = new Transaction('T1','06/05/2018',data,null,'Akash','Eish');
var newblock = new Block(1,'06/06/2018',blockchain.getLatestBlock().currenthash,trans);
blockchain.addBlock(newblock);
console.log(blockchain);
app.get('/', (req, res) => res.send(blockchain));
app.listen(3000, () => console.log('Example app listening on port 3000!'));



