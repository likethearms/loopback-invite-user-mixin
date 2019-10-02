INVITE USER MIXIN
=============

This module is for the loopback framework. It send user invitation emails

INSTALL
=============

```bash
  npm i loopback-invite-user-mixin -S
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
      "../node_modules/loopback-invite-user-mixin",
      "../common/mixins"
    ]
  }
}
```

MODEL CONFIG
=============

```json
  {
    "name": "User",
    "properties": {
      "name": {
        "type": "string",
      }
    },
    "mixins": {
      "InviteUser" : true
    }
  }
```

User model ACL
```json
    {
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "$unauthenticated",
      "permission": "ALLOW",
      "property": "validateInvitationToken"
    },
    {
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "$unauthenticated",
      "permission": "ALLOW",
      "property": "acceptInvitation"
    }
```

CONFIG EMAIL
=============

```js
  Member.beforeRemote('invitation', (ctx, _, next) => {
    ctx.emailConfig = {
      redirect: `${URL}/accept-invitation`,
      from: 'example@example.com',
      subject: 'Invite | Example app',
      templatePath: path.resolve(__dirname, './email.ejs'),
      templateData: {
        signature: 'Elon',
        buttonText: 'Accept invitation',
        lines: [
          'Please visit the page and accept invitation.'
        ],
      },
    };
    next();
  });
```
```js

  Member.beforeRemote('sendInvitationRequest', (ctx, _, next) => {
    ctx.emailConfig = {
      redirect: `${URL}/accept-invitation`,
      from: 'example@example.com',
      subject: 'Invite | Example app',
      templatePath: path.resolve(__dirname, './email.ejs'),
      templateData: {
        signature: 'Elon',
        buttonText: 'Accept invitation',
        lines: [
          'Please visit the page and accept invitation.'
        ],
      },
    };
    next();
  });
```
