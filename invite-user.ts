const path = require('path');
const ejs = require('ejs');
const randomize = require('randomatic');

interface ITemplateData {
  signature: string;
  buttonText: string;
  lines: string[];
}

interface IEmailConfig {
  redirect: string;
  from: string;
  subject: string;
  templatePath: string;
  templateData?: ITemplateData;
}

interface ICTX {
  emailConfig: IEmailConfig;
  [key: string]: any;
}

interface IUser {
  id?: string;
  email: string;
  isInvitationComplete: boolean;
  isInvited: boolean;
  invitationToken: string;
  companyId: string;
}

const defaultTemplateData: ITemplateData = {
  signature: 'Thank you',
  buttonText: 'Accept invitation',
  lines: [
    'Please visit the page and accept invitation.',
  ],
};

const defaultEmailOptions: IEmailConfig = {
  redirect: 'http://localhost:3000/accept-invitation',
  from: 'info@test.com',
  subject: 'Invite',
  templatePath: path.resolve(__dirname, './action-email.ejs'),
}

const sendInvitationEmail = (Model, id: string, ctx: ICTX, callback: Function) => {
  const { Email } = Model.app.models;
  let templateData = defaultTemplateData;
  let emailConfig = defaultEmailOptions;
  if (ctx.emailConfig) {
    emailConfig = {
      ...defaultEmailOptions,
      ...ctx.emailConfig,
    };
    if (ctx.emailConfig.templateData) {
      templateData = {
        ...defaultTemplateData,
        ...ctx.emailConfig.templateData,
      };
    }
  }

  const sendEmail = (member: IUser) => {
    if (!member) return callback(new Error('There is no such user'));
    if (member.isInvitationComplete) return callback(new Error('Invitation is already done!'));
    if (!member.invitationToken) return callback(new Error('There is no valid invitation token!'));
    const url = `${emailConfig.redirect}?invitation_token=${member.invitationToken}&uid=${member.id}`;

    ejs.renderFile(emailConfig.templatePath, { ...templateData, url }, (ejsError, str) => {
      if (ejsError) return callback(ejsError);
      return Email.send({
        from: emailConfig.from,
        to: member.email,
        subject: emailConfig.subject,
        html: str,
      }, (err) => {
        if (err) return callback(`MailError: InvitationMail: ${err.message}`);
        console.log('> sending password reset email to:', member.email);
        return callback(null, member.email);
      });
    });
  };

  Model.findById(id)
    .then(sendEmail)
    .catch(callback);
};

module.exports = (Model) => {
  Model.defineProperty('isInvited', {
    type: "boolean",
  });

  Model.defineProperty('isInvitationComplete', {
    type: "boolean",
  });

  Model.defineProperty('invitationToken', {
    type: "string",
  });

  Model.remoteMethod('invitation', {
    accepts: [
      { arg: 'data', type: 'Member', http: { source: 'body' } },
      { arg: 'req', type: 'object', http: { source: 'context' } },
    ],
    returns: [
      { arg: 'status', type: 'string', root: false, description: 'Status of sender' },
    ],
    description: 'Create user and send invitation email to user',
    http: [
      { path: '/accept-invitation', verb: 'post', },
    ],
  });

  Model.remoteMethod('sendInvitationRequest', {
    accepts: [
      { arg: 'id', type: 'string', required: true },
      { arg: 'req', type: 'object', http: { source: 'context' } },
    ],
    returns: [
      { arg: 'status', type: 'string', root: false, description: 'Status of sender' },
    ],
    description: 'Send invitation email to user',
    http: [
      { path: '/:id/invite-request', verb: 'post' },
    ],
  });

  Model.remoteMethod('validateInvitationToken', {
    accepts: [
      { arg: 'uid', type: 'string', http: { source: 'query' } },
      { arg: 'invitation_token', type: 'string', http: { source: 'query' } }
    ],
    returns: [
      { arg: 'user', type: 'string', root: true, description: 'User model' },
    ],
    description: 'Validate invitation token',
    http: [
      { path: '/validate-invitation-token', verb: 'get', },
    ],
  });

  Model.remoteMethod('acceptInvitation', {
    accepts: [
      { arg: 'uid', type: 'string', http: { source: 'query' } },
      { arg: 'invitation_token', type: 'string', http: { source: 'query' } },
      { arg: 'password', type: 'string', http: { source: 'formData' } },
    ],
    returns: [
      { arg: 'user', type: 'string', root: true, description: 'User model' },
    ],
    description: 'Accept invitation and setup password',
    http: [
      { path: '/accept-invitation', verb: 'post', },
    ],
  });

  Model.sendInvitationRequest = (id: string, ctx: ICTX, callback: Function) => {
    sendInvitationEmail(Model, id, ctx, callback);
  }

  Model.acceptInvitation = (uid: string, invitation_token: string, password: string, callback: Function) => {
    Model.findOne({ where: { id: uid, invitationToken: invitation_token } })
      .then((user) => {
        if (!user) return Promise.reject(new Error('Invalid invitation token'));
        return user.updateAttributes({
          password,
          isInvitationComplete: true,
          invitationToken: null,
        });
      })
      .then(user => callback(null, user))
      .catch(callback);
  }

  Model.validateInvitationToken = (uid: string, invitation_token: string, callback) => {
    Model
      .findOne({ where: { id: uid, invitationToken: invitation_token } })
      .then((user) => {
        if (!user) return Promise.reject(new Error('Invalid or used invitation.'));
        return callback(null, user);
      }).catch(callback);
  }

  Model.invitation = (body: IUser, ctx: ICTX, callback: Function) => {
    Model.findById(ctx.req.accessToken.userId)
      .then(user => {
        body.isInvitationComplete = false;
        body.isInvited = true;
        body.invitationToken = randomize('Aa0', 64);
        body.companyId = user.companyId;
        return Model.create(body)
      })
      .then(u => sendInvitationEmail(Model, u.id, ctx, callback))
      .catch(callback);
  };
};
