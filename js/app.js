var bitcoin = require('bitcoinjs-lib');
var bitcoinMessage = require('bitcoinjs-message');
var sjcl = require('sjcl');
var QRCode = require('qrcode');

//Generate bitcoin keys
var keyPair = bitcoin.ECPair.makeRandom();
var privateKey = keyPair.toWIF();
var privateKeyCompressed = keyPair.d.toBuffer(32);
var address = keyPair.getAddress();
var messagePrefix = bitcoin.networks.bitcoin.messagePrefix;
//var message = "triangles.io";

console.log(keyPair);
console.log(privateKey);
console.log(address);

//Click Sign Up
document.getElementById("submitSignUp").onclick = function() {
  signUp()
};

//Click Sign In
document.getElementById("submitSignIn").onclick = function() {
  signIn()
};

//Sign Up function
function signUp() {
  //Get user input
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  var answer1 = document.getElementById('q1').value;
  var answer2 = document.getElementById('q2').value;

  //encrypt private key
  var encryptPrivateKey = sjcl.encrypt(password, privateKey, {
    mode: "ccm",
    iter: 1000,
    ks: 128,
    ts: 64,
    v: 1,
    cipher: "aes",
    adata: "",
    salt: "MU7zVpn13sM=",
    iv: "l6Zi5v+oelvF9y2Z30SPxw=="
  });
  encryptPrivateKey = JSON.parse(encryptPrivateKey);
  var encryptedPrivateKey = encryptPrivateKey.ct;
  console.log(encryptPrivateKey);
  console.log(encryptedPrivateKey);


  //Sign security questions
  var q1 = bitcoinMessage.sign(answer1, messagePrefix, privateKeyCompressed, keyPair.compressed);
  q1 = q1.toString('base64');
  var q2 = bitcoinMessage.sign(answer2, messagePrefix, privateKeyCompressed, keyPair.compressed);
  q2 = q2.toString('base64');

  var signUp = document.getElementById('signUp');
  signUp.innerHTML = '<h1>Sign Up</h1><p>Address:</p><textarea>' + address + '</textarea><p>Encrypted Private Key:</p><br><textarea>' + encryptedPrivateKey + '</textarea><p>Security answer 1:</p><textarea>' + q1 + '</textarea><br><p>Security answer 2:</p><textarea>' + q2 + '</textarea><canvas id="privateQR"></canvas><canvas id="publicQR"></canvas>';

  var QRCodeDraw = new QRCode.QRCodeDraw();
  var privateQR = document.getElementById('privateQR');
  var publicQR = document.getElementById('publicQR');

  var publicInfo = 'U=' + username + 'A=' + address;

  QRCodeDraw.draw(privateQR, encryptedPrivateKey, function(error, canvas) {})

  QRCodeDraw.draw(publicQR, publicInfo, function(error, canvas) {})

}

//Sign In function
function signIn() {
  //Get user input
  var account = document.getElementById('account').value;
  var password = document.getElementById('SignInPassword').value;

  //Decrypt password
  try {
    //decrypt private key
    var defaultDecryptSettings = JSON.parse('{"iv":"l6Zi5v+oelvF9y2Z30SPxw==","v":1,"iter":1000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"MU7zVpn13sM=","ct":""}');
    defaultDecryptSettings.ct = account;
    defaultDecryptSettings = JSON.stringify(defaultDecryptSettings);

    var userDecrypt = sjcl.decrypt(password, defaultDecryptSettings);
    console.log(userDecrypt);
  } catch (e) {
    alert("Wrong password");
  }

  //Sign message
  var importedKeyPair = bitcoin.ECPair.fromWIF(userDecrypt)
  var importedKeyPairCompressed = importedKeyPair.d.toBuffer(32);
  var timestamp = "test";
  var logInAttempt = bitcoinMessage.sign(timestamp, messagePrefix, importedKeyPairCompressed, importedKeyPair.compressed);

  var signIn = document.getElementById('signIn');
  signIn.innerHTML = '<h1>Sign In</h1><p style="color: green;">Success</p><p>Signed Time Stamp:</p><textarea>' + logInAttempt.toString('base64') + '</textarea>';
}
