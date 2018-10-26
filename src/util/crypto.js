import PeerId from 'peer-id';
import Base64 from 'base64-js';
import { hmac, keys } from 'libp2p-crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
// import naclSealedBox from 'tweetnacl-sealedbox-js';
import multihashes from 'multihashes';
// import sjcl from 'sjcl';
// import jsSHA from 'jssha';
import jsSha256 from 'js-sha256';
// import protos from 'google-protobuf';
import protobuf from 'protobufjs';
// import {userPrivateKey} from '../actions/user';
import ed2curve from 'ed2curve';
import bs58 from 'bs58';
// import bip39 from 'bip39';

// import message from '../protobufs/message_pb';
var BitArray = require('node-bitarray');
const cryptojs = require('crypto');
var sealedBox = require('tweetnacl-sealedbox-js');
var myProtos = require('../protobufs/message_pb');
var messageJsonDescription = require("../schema/message.json");
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');

export function identityFromKey(privKey) {
  return new Promise((resolve, reject) => {
    keys.unmarshalPrivateKey(privKey, (err, base58PrivKey) => {
      if (!err) {
        PeerId.createFromPubKey(base58PrivKey.public.bytes, (err, peerID) => {
          if (!err) {
            resolve({
              base58PrivKey: Base64.fromByteArray(base58PrivKey.bytes),
              peerId: peerID._idB58String
            });
            return;
          }

          reject(err);
        });
        return;
      }

      reject(err);
    });
  });
}

export function identityKeyFromSeed(seed, bits = 4096) {
  return new Promise((resolve, reject) => {
    hash(seed, {
      hmacSeed: 'ob-identity'
    }).then(
      sig => {
        keys.generateKeyPairFromSeed('ed25519', sig, bits, (err, privKey) => {
          if (!err) {
            resolve(privKey);
          } else {
            reject(err);
          }
        });
      },
      e => reject(e)
    );
  });
}

/*
 * Returns a Uint8Array(64) hash of the given text.
 */
export const hash = async (text, options = {}) => {
  const opts = {
    hash: 'SHA256',
    hmacSeed: 'ob-hash',
    ...options
  };

  return new Promise((resolve, reject) => {
    hmac.create(opts.hash, naclUtil.decodeUTF8(opts.hmacSeed), (err, hmac) => {
      if (!err) {
        hmac.digest(naclUtil.decodeUTF8(text), (err, sig) => {
          if (!err) {
            resolve(sig);
            return;
          }

          reject(err);
        });
        return;
      }

      reject(err);
    });
  });
};

/*
 * Returns a base64 encoded hash of the given text.
 */
export const hashText = async (text, options = {}) => {
  console.log()
  const opts = {
    hash: 'SHA256',
    hmacSeed: 'ob-hash-text',
    ...options
  };

  const uint8Hash = await hash(text, {
    hash: opts.hash,
    hmacSeed: opts.hmacSeed
  });

  return naclUtil.encodeBase64(uint8Hash);
};

/*
 * Will encrypt the given text using the given passphrase. You will be
 * returned the resulting encrypted text along with a nonce. Those two
 * things + the passphrase will be needed to decrypt the text.
 */
export const encrypt = async (text, passphrase, options = {}) => {
  if (typeof text !== 'string' || !text) {
    throw new Error('Please provide some text to encrypt as a string.');
  }

  if (typeof passphrase !== 'string' || !passphrase) {
    throw new Error('Please provide a passphrase as a string.');
  }

  // The default hash and hmacSeed should match the defaults in decrypt().
  const opts = {
    hash: 'SHA256',
    hmacSeed: 'ob-encrypt',
    ...options
  };

  let nonce = await hash(text, {
    hash: opts.hash,
    hmacSeed: opts.hmacSeed
  });
  nonce = nonce.slice(0, 24);

  const key = await hash(passphrase, {
    hash: opts.hash,
    hmacSeed: opts.hmacSeed
  });

  const encrypted = nacl.secretbox(naclUtil.decodeUTF8(text), nonce, key);

  return {
    result: naclUtil.encodeBase64(encrypted),
    nonce: naclUtil.encodeBase64(nonce)
  };
};

/*
 * Will decrypt the given encryptedText using the given nonce and passphrase.
 * The same hash and/or hmacSeed used when encrypting, must be used here. If
 * the wrong passphrase is provided, null will be returned.
 */
export const decrypt = async (
  encryptedText,
  nonce,
  passphrase,
  options = {}
) => {
  if (typeof encryptedText !== 'string' || !encryptedText) {
    throw new Error('Please provide some encryptedText to decrypt.');
  }

  if (typeof nonce !== 'string' || !nonce) {
    throw new Error('Please provide a nonce as a string.');
  }

  if (typeof passphrase !== 'string' || !passphrase) {
    throw new Error('Please provide a passphrase as a string.');
  }

  // The default hash and hmacSeed should match the defaults in encrypt().
  const opts = {
    hash: 'SHA256',
    hmacSeed: 'ob-encrypt',
    ...options
  };

  const key = await hash(passphrase, {
    hash: opts.hash,
    hmacSeed: opts.hmacSeed
  });

  const decrypted = nacl.secretbox.open(
    naclUtil.decodeBase64(encryptedText),
    naclUtil.decodeBase64(nonce),
    key
  );

  return decrypted === null ? null : naclUtil.encodeUTF8(decrypted);
};

/*
 * This is a placeholder for creating the envelope.
*/
export const makeEnvelope = async (
  message,
  pubkKey,
  sig
) => {

};

/**
 * From the user's PeerID, generate a subscriptionKey for the web relay.
 */
export const generateSubscriptionKey = async (peerID) => {

  const peerIDMultihash = multihashes.fromB58String(peerID);
  const decoded = multihashes.decode(peerIDMultihash);
  const digest = decoded.digest;
  const prefix = new Buffer(new Uint8Array(digest.slice(0,8)));

  var bits = BitArray.fromBuffer(prefix);
  bits = bits.slice(0,14);
  bits = new Buffer(bits);

  for(var i=0; i<50;i++) {
    bits = Buffer.concat([new Buffer([0]), bits]);
  }

  // Construct uint8array from binary strings
  var id_array = [];
  for(var i=0; i<8; i++) {
    var tmp_x = "";
    for(var j=0; j<8; j++) {
      //console.log('bit', i*8+j, bits[i*8+j])
      tmp_x += bits[i*8+j];
    }
    id_array.push(parseInt(tmp_x, 2));
  }

  var checksum = cryptojs.createHash('sha256').update(new Buffer(id_array)).digest();
  var subscriptionKey = multihashes.encode(Buffer.from(checksum), 'sha2-256');
  console.log('Subscription Key:', bs58.encode(subscriptionKey));
  return bs58.encode(subscriptionKey);
};

/**
 * Create the Protobuf Envelope object to send a message.
 * message Envelope {
 * Message message = 1;
 *  bytes pubkey = 2;
 *  bytes signature = 3;
 * }
 */

export const generateEncryptedCiphertext = async (recipientPublicKeyB64,chatMessage, dateNow, subject = "") => {

  // The chat message contains a timestamp. This must be in the protobuf 'Timestamp' format.
  const timestamp = new google_protobuf_timestamp_pb.Timestamp();

  timestamp.fromDate(dateNow);

  // The messageID is derived from the message data. In this cse its the hash of the message,
  // subject and timestamp which is then multihash encoded.
  // const combinationString = chatMessage + subject + dateNow.toISOString();
  // const combinationString = `${chatMessage}2018-10-09T06:30:00Z`;
  const combinationString = `${chatMessage}${subject}${dateNow.toISOString()}`;

  const idBytes = jsSha256.array(combinationString);
  const idBytesArray = new Uint8Array(idBytes);
  const idBytesBuffer =  new Buffer(idBytesArray.buffer);
  const encoded = multihashes.encode(idBytesBuffer,0x12);

  // Create the Chat PB
  const chatPb = new myProtos.Chat();
  const b58MsgID = multihashes.toB58String(encoded);


  chatPb.setMessageid(multihashes.toB58String(encoded));
  chatPb.setSubject(subject);
  chatPb.setMessage(chatMessage);
  chatPb.setTimestamp(timestamp);
  chatPb.setFlag(myProtos.Chat.Flag.MESSAGE);
  // console.debug(chatPb.toObject());

  const payload = chatPb.serializeBinary();

  // Now we wrap it in a pb.Message object.

  const any = new google_protobuf_any_pb.Any();
  any.setTypeUrl('type.googleapis.com/Chat');
  any.setValue(payload);

  const message = new myProtos.Message();
  message.setMessagetype(myProtos.Message.MessageType.CHAT);
  message.setPayload(any);

  // Use the protobuf serialize function to convert the object to a serialized byte array
  const serializedMessage = message.serializeBinary();

  const seed = sessionStorage.getItem('sessionLogin');
  const edd2519PrivateKey = await identityKeyFromSeed(seed);

  const signature = await signIt(edd2519PrivateKey, serializedMessage);

  // Create the envelope
  const envelope = new myProtos.Envelope();
  envelope.setMessage(message);
  envelope.setPubkey(edd2519PrivateKey.public.bytes);
  envelope.setSignature(signature);

  // ----- STEP 2: Encrypt the serialized envelope using the recipient's public key. For this you
  // will need to use an nacl library. NOTE for this you will need the recipient's public key.
  // We will have to create a server endpoint to get the pubkey. Technically I think the gateway
  // already has one but we may need to improve it for this purpose. The public key is also found
  // inside a listing so if you're looking at a listing you should already have it.

  // Serialize the envelope
  const serializedEnvelope = envelope.serializeBinary();

  // Recipient public key
  const recipientPublicKey = naclUtil.decodeBase64(recipientPublicKeyB64);

  // Generate ephemeral key pair
  const ephemeralKeyPair = nacl.box.keyPair();
  const pub = keys.unmarshalPublicKey(recipientPublicKey);

  const cPubkey = ed2curve.convertPublicKey(pub._key);

  // Encrypt with NACL
  const nonce = nacl.randomBytes(24);

  const cipherText = nacl.box(serializedEnvelope, nonce, cPubkey, ephemeralKeyPair.secretKey)

  // Prepend the ephemeral public key to the ciphertext
  // Prepend nonce to the ephemPubkey+ciphertext
  const combined = [...nonce, ...ephemeralKeyPair.publicKey, ...cipherText];

  // Base64Encode
  const encodedCipherText = naclUtil.encodeBase64(combined);
  return encodedCipherText;
}

export const openEncryptedMessage = async (message) => {

  // Decode the base64
  const decodedMessage = new Buffer(message, 'base64');

  const nonce = decodedMessage.slice(0,24);
  const publicKey = decodedMessage.slice(24,56);
  const ciphertext = decodedMessage.slice(56, decodedMessage.length);

  const seed = sessionStorage.getItem('sessionLogin');
  const keypair = await identityKeyFromSeed(seed);

  const privateKey = ed2curve.convertSecretKey(keypair._key);

  let out;
  return new Promise(function(resolve, reject) {
    try {
      out = nacl.box.open(ciphertext, nonce, publicKey, privateKey);
      if(!out) {
        console.log("Could not decrypt message");
        reject("Could not decrypt message");
      } else {
        console.log("Decrypted Ciphertext:", out);
      }
    } catch (e) {
      console.error(e);
      reject("Could not decrypt message");
    }

    const root = protobuf.Root.fromJSON(messageJsonDescription);
    // const Message = root.lookupType("Message");
    const Chat = root.lookupType("Chat");
    const Envelope = root.Envelope;

    const incomingMessage = Envelope.decode(out);

    switch(incomingMessage.message.messageType) {
      case 1:
        // chatmessage
        const chatmessage = Chat.decode(incomingMessage.message.payload.value);
        resolve(chatmessage);
        break;
      default:
        reject();
    }
  });

}

export function signIt(privateKey, serializedMessage) {
  return new Promise((resolve, reject) => {
    privateKey.sign(serializedMessage, (err, signature) => {
      if (!err) {
        resolve(signature);
      } else {
        reject(err);
      }
    });
  });
}

export function generateEd25519KeyPairFromSeed(seed) {
  return new Promise((resolve, reject) => {
    keys.generateKeyPairFromSeed('ed25519', seed, (err, keypair)=>{
      if (!err) {
        resolve(keypair);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#2117523
 */
export function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}


