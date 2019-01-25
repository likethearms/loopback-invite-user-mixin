const path = require('path');
const ejs = require('ejs');

interface ITemplateData {
  signature: string;
  buttonText: string;
  lines: string[];
}

interface IEmailConfig {
  invitationUrl: string;
  from: string;
  subject: string;
  templatePath: string;
  templateData?: ITemplateData;
}

interface ICTX {
  emailConfig: IEmailConfig;
}

const defaultTemplateData: ITemplateData = {
  signature: 'Thank you',
  buttonText: 'Accept invitation',
  lines: [
    'Please visit the page and accept invitation.',
  ],
};

const defaultEmailOptions: IEmailConfig = {
  invitationUrl: 'http://localhost:3000',
  from: 'info@test.com',
  subject: 'Invite',
  templatePath: path.resolve(__dirname, './action-email.ejs'),
}

module.exports = (Model) => {
  Model.remoteMethod('invitationRequest', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true,
      },
      { arg: 'req', type: 'object', http: { source: 'context' } },
    ],
    returns: [
      {
        arg: 'status',
        type: 'string',
        root: false,
        description: 'Status of sender',
      },
    ],
    description: 'Send invitation email to user',
    http: [
      {
        path: '/:id/invite',
        verb: 'post',
      },
    ],
  });

  /**
   * resetPasswordRequest
   * @param {Function(Error)} callback
   */
  Model.invitationRequest = (id: string, ctx: ICTX, callback: Function) => {
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

      const url = `${emailConfig.invitationUrl}?access_token=${accessTokenId}&user=${userId}`;

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
};
