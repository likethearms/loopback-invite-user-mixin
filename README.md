Company context
=============

This module is for the loopback framework. It add user's companyId to every read request's query.

NOTE! Adding companyId to request require active accessToken. It won't work with unauthorized routes.

INSTALL
=============

```bash
  npm i loopback-company-context-mixin --S
```

SERVER CONFIG
=============

Add the `mixins` property to your `server/model-config.json`:

```json
{
  "_meta": {
    "sources": [
      "loopback/common/models",
      "loopback/server/models",
      "../common/models",
      "./models"
    ],
    "mixins": [
      "loopback/common/mixins",
      "../node_modules/loopback-company-context-mixin",
      "../common/mixins"
    ]
  }
}
```

MODEL CONFIG
=============

To use with your Models add the `mixins` attribute to the definition object of your model config.

```json
  {
    "name": "Widget",
    "properties": {
      "name": {
        "type": "string",
      }
    },
    "mixins": {
      "CompanyContext" : true
    }
  }
```

MODEL OPTIONS
=============

You can use ignore option, if you want that mixin skip some of remote methods.

```json
  {
    "name": "Member",
    "mixins": {
      "CompanyContext" : {
        "ignore": [
          "register",
          "login",
          "logout",
          "resetPassword",
          "invitationRequest"
        ]
      }
    },
    "properties": {
      "name": {
        "type": "string",
      }
    },
  }
```
