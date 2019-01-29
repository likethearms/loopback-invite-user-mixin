const path = require('path');
const ejs = require('ejs');

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
  email: string;
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
  const { AccessToken, Email } = Model.app.models;
  let member;
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

  const createToken = (m) => {
    member = m;
    if (!m) return callback(new Error('There is no such user'));
    return AccessToken.create({ userId: m.id });
  };

  const sendEmail = (accessToken) => {
    const userId = member.id;
    const accessTokenId = accessToken.id;

    const url = `${emailConfig.redirect}?access_token=${accessTokenId}&user=${userId}`;

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
    .then(createToken)
    .then(sendEmail)
    .catch(e => callback(e));
};

module.exports = (Model) => {
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
      { path: '/invite', verb: 'post', },
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


  Model.sendInvitationRequest = (id: string, ctx: ICTX, callback: Function) => {
    sendInvitationEmail(Model, id, ctx, callback);
  }

  Model.invitation = (body: IUser, ctx: ICTX, callback: Function) => {
    Model.findById(ctx.req.accessToken.userId)
      .then(user => {
        body.companyId = user.companyId;
        return Model.create(body)
      })
      .then(u => sendInvitationEmail(Model, u.id, ctx, callback))
      .catch(callback);
  };
};
