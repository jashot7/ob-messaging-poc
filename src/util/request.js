import request from 'request-promise-native';

export const getRecipientPublicKeyB64 = async (peerId) => {
  // Get pubkey associated with peerID
  // 1. Get listings.json
  // 2. If listings then grab the first one and get the pubkey
  const domain = `https://gateway.ob1.io/ipns/${peerId}`;
  const url = `${domain}/listings.json`;
  const listingsJson = await request({ url: url, json: true });

  let slug = listingsJson[0].slug;

  const listingJson = await request({
    url: `${domain}/listings/${slug}.json`,
    json:true
  });

  const identityKey = listingJson.listing.vendorID.pubkeys.identity
  return identityKey;
}
