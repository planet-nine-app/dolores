# Dolores

Dolores (named for [Dolores del Rio][dolores] the first latin american actress to break into hollywood) is a mini-service for the uploading and streaming of short-form video.

## Overview

In 2013, an app called Vine hit the iOS App Store. 
It allowed users the ability to create short (six second) videos that were shared timeline-style with the world. 
It was brilliant. 

And like everything brilliant on the internet, it was purchased by a gigantocorp, Twitter in this case, filled with ads and spyware, and eventually killed after being ruined.

The legacy of Vine lives on in the current age as TikTok, Instagram Reels, and YouTube Shorts, all of which are agressive spyware serving you user created content in order [to extract from you your interests and marketable demographics so as to better sell advertising and/or other things...][advertising].

The conceit of all this is that the storage and serving of video content is both hard and expensive, and thus the excessive marketing is necessary. 
Dolores is an attempt to reduce this storage and serving to its barebones, to see if the modern web can do so in a cost-effective way.

## API

Gotta keep it CRUDy on this one. 

<details>
 <summary><code>PUT</code> <code><b>/user/create</b></code> <code>Creates a new user if pubKey does not exist, and returns existing uuid if it does.</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | pubKey       |  true     | string (hex)            | the publicKey of the user's keypair  |
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

> ```javascript
>  curl -X PUT -H "Content-Type: application/json" -d '{"pubKey": "key", "timestamp": "now", "signature": "sig"}' https://<placeholderURL>/user/create
> ```

</details>

<details> 
 <summary><code>GET</code> <code><b>/user/:uuid?timestamp=<timestamp>&signature=<signature></b></code> <code>Returns a user by their uuid</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | timestamp    |  true     | string                  | in a production system timestamps prevent replay attacks  |
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `406`         | `application/json`                | `{"code":"406","message":"Not acceptable"}`                            |

##### Example cURL

> ```javascript
>  curl -X GET -H "Content-Type: application/json" https://<placeholderURL>/<uuid>?timestamp=123&signature=signature
> ```

</details>

<details>
 <summary><code>PUT</code> <code><b>/user/:uuid/short-form/:title/video</b></code> <code>Puts an image for the product with the given title</code></summary>

##### Headers

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | x-pn-artifact-type        |  true     | <supported video type>               | video type   |
> | x-pn-timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | x-pn-signature    |  true     | string (signature)      | the signature from sessionless for the message  |

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | video        |  true     | video type              | the video to upload   |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

TODO

</details>

<details>
 <summary><code>DELETE</code> <code><b>/user/:uuid/short-form/:title/video</b></code> <code>Deletes the user's video with the given title</code></summary>

##### Headers

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | x-pn-artifact-type        |  true     | <supported video type>               | video type   |
> | x-pn-timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | x-pn-signature    |  true     | string (signature)      | the signature from sessionless for the message  |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

TODO

</details>



[dolores]: https://en.wikipedia.org/wiki/Dolores_del_Río
[advertising]: https://github.com/planet-nine-app/planet-nine?tab=readme-ov-file#no-really-whats-planet-nine-trying-to-do
