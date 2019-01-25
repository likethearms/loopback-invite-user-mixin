Company context
=============

This module is for the loopback framework. It send user invitation emails

INSTALL
=============

```bash
  npm i loopback-invite-user-mixin --S
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
    "name": "Widget",
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
CONFIG EMAIL
=============

```js
  Member.beforeRemote('invitationRequest', (ctx, _, next) => {
    ctx.emailConfig = {
      invitationUrl: `${URL}/invite`,
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
