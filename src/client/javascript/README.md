# Dolores

This is the JavaScript client SDK for the Dolores miniservice.

### Usage

```javascript
import dolores from 'dolores-js';

const saveKeys = (keys) => { /* handle persisting keys here */ };
const getKeys = () => { /* return keys here. Can be async */ };

const user = await dolores.createUser(saveKeys, getKeys);

const retrievedUser = await dolores.getUser(uuid);

const deleted = await dolores.deleteUser(uuid); // returns true on success
```
