const http = process.env.HTTP;
const split = http.split('profile/').pop();
const pathComps = split.split('/');
const handle = pathComps[0];
const feedId = pathComps.pop();

console.log(split);
console.log(pathComps);
console.log(handle);
console.log(feedId);

async function handleToDid(handle) {

  const authResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: 'server@allyabase.com', 
      password: 'zkln-k2ln-4p2i-hkhl'
    })
  });

  if (!authResponse.ok) {
    throw new Error(`Authentication failed: ${authResponse.status}`);
  }

  const auth = await authResponse.json();
  const encodedHandle = encodeURIComponent(handle);
console.log('resolving this: ' + encodedHandle);

  const response = await fetch('https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=' + encodedHandle, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${auth.accessJwt}`,
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    const err = await response.json();
    console.warn(err);
    throw new Error(`Failed to resolve handle: ${response.status}`);
  }
  
  const data = await response.json();
  return data.did;
}

// Usage
handleToDid(handle)
  .then(did => {
    console.log(`Handle ${handle} resolved to DID: ${did}`);
    const atUrl = `at://${did}/app.bsky.feed.generator/${feedId}`;
    console.log(`Feed URL: ${atUrl}`);
  })
  .catch(error => console.error(error));
