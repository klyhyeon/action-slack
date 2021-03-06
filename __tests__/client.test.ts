import nock from 'nock';
import { readFileSync } from 'fs';
import { resolve } from 'path';

process.env.GITHUB_WORKFLOW = 'PR Checks';
process.env.GITHUB_SHA = 'b24f03a32e093fe8d55e23cfd0bb314069633b2f';
process.env.GITHUB_REF = 'refs/heads/feature/19';
process.env.GITHUB_EVENT_NAME = 'push';
process.env.GITHUB_TOKEN = 'test-token';
process.env.GITHUB_RUN_ID = '1';
process.env.GITHUB_JOB = 'notification';

import {
  Client,
  With,
  Success,
  Failure,
  Cancelled,
  Always,
  Field,
  GitHub,
} from '../src/client';
import { FieldFactory } from '../src/fields';

const repo = (): Field => {
  return {
    short: true,
    title: 'repo',
    value: '<https://github.com/8398a7/action-slack|8398a7/action-slack>',
  };
};

const message = (): Field => {
  const obj: any = getApiFixture('repos.commits.get');
  return {
    short: true,
    title: 'message',
    value: `<${obj.html_url}|[#19] support for multiple user mentions>`,
  };
};

const commit = (): Field => {
  return {
    short: true,
    title: 'commit',
    value: `<https://github.com/8398a7/action-slack/commit/${
      process.env.GITHUB_SHA
    }|${process.env.GITHUB_SHA?.slice(0, 8)}>`,
  };
};

const author = (): Field => {
  return { short: true, title: 'author', value: '839<8398a7@gmail.com>' };
};

const eventName = (): Field => {
  return {
    short: true,
    title: 'eventName',
    value: process.env.GITHUB_EVENT_NAME as string,
  };
};

const ref = (): Field => {
  return { short: true, title: 'ref', value: process.env.GITHUB_REF as string };
};

const workflow = (sha?: string): Field => {
  return {
    short: true,
    title: 'workflow',
    value: `<https://github.com/8398a7/action-slack/commit/${
      sha ?? process.env.GITHUB_SHA
    }/checks|${process.env.GITHUB_WORKFLOW as string}>`,
  };
};

const action = (sha?: string): Field => {
  return {
    short: true,
    title: 'action',
    value: `<https://github.com/8398a7/action-slack/commit/${
      sha ?? process.env.GITHUB_SHA
    }/checks|action>`,
  };
};

const job = (): Field => {
  return {
    short: true,
    title: 'job',
    value: `<https://github.com/8398a7/action-slack/runs/762195612|${process.env.GITHUB_JOB}>`,
  };
};

const took = (): Field => {
  return {
    short: true,
    title: 'took',
    value: '1 hour 1 min 1 sec',
  };
};

const fixedFields = (fields: string, sha?: string) => {
  const ff = new FieldFactory(fields);
  return ff.filterField(
    [
      ff.includes('repo') ? repo() : undefined,
      ff.includes('message') ? message() : undefined,
      ff.includes('commit') ? commit() : undefined,
      ff.includes('author') ? author() : undefined,
      ff.includes('action') ? action(sha) : undefined,
      ff.includes('job') ? job() : undefined,
      ff.includes('took') ? took() : undefined,
      ff.includes('eventName') ? eventName() : undefined,
      ff.includes('ref') ? ref() : undefined,
      ff.includes('workflow') ? workflow(sha) : undefined,
    ],
    undefined,
  );
};

const getTemplate: any = (fields: string, text: string, sha?: string) => {
  return {
    text,
    attachments: [
      {
        author_name: '',
        color: '',
        fields: fixedFields(fields, sha),
      },
    ],
    username: '',
    icon_emoji: '',
    icon_url: '',
    channel: '',
  };
};

const successMsg = ':white_check_mark: Succeeded GitHub Actions';
const cancelMsg = ':warning: Canceled GitHub Actions';
const failMsg = ':no_entry: Failed GitHub Actions';
const getApiFixture = (name: string): any =>
  JSON.parse(
    readFileSync(resolve(__dirname, 'fixtures', `${name}.json`)).toString(),
  );

beforeAll(() => {
  nock.disableNetConnect();
  nock('https://api.github.com')
    .persist()
    .get(`/repos/8398a7/action-slack/commits/${process.env.GITHUB_SHA}`)
    .reply(200, () => getApiFixture('repos.commits.get'));
  nock('https://api.github.com')
    .persist()
    .get(
      `/repos/8398a7/action-slack/actions/runs/${process.env.GITHUB_RUN_ID}/jobs`,
    )
    .reply(200, () => {
      const obj = getApiFixture('actions.runs.jobs');
      const now = new Date();
      now.setHours(now.getHours() - 1);
      now.setMinutes(now.getMinutes() - 1);
      now.setSeconds(now.getSeconds() - 1);
      obj.jobs[0].started_at = now.toISOString();
      return obj;
    });
});
afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('8398a7/action-slack', () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = '8398a7/action-slack';
    process.env.GITHUB_EVENT_NAME = 'push';
    const github = require('@actions/github');
    github.context.payload = {};
  });

  describe('fields', () => {
    it('is full fields', async () => {
      const withParams: With = {
        status: '',
        mention: '',
        author_name: '',
        if_mention: '',
        username: '',
        icon_emoji: '',
        icon_url: '',
        channel: '',
        fields:
          'repo,message,commit,author,job,action,eventName,ref,workflow,took',
      };
      const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
      const payload = getTemplate(withParams.fields, `${successMsg}\n`);
      payload.attachments[0].color = 'good';
      expect(await client.success('')).toStrictEqual(payload);
    });
  });

  describe('text is not specified', () => {
    it('is success', async () => {
      const withParams: With = {
        status: '',
        mention: '',
        author_name: '',
        if_mention: '',
        username: '',
        icon_emoji: '',
        icon_url: '',
        channel: '',
        fields: '',
      };
      const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
      const payload = getTemplate(withParams.fields, `${successMsg}\n`);
      payload.attachments[0].color = 'good';
      expect(await client.success('')).toStrictEqual(payload);
    });
    it('is failure', async () => {
      const withParams: With = {
        status: '',
        mention: '',
        author_name: '',
        if_mention: '',
        username: '',
        icon_emoji: '',
        icon_url: '',
        channel: '',
        fields: '',
      };
      const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
      const payload = getTemplate(withParams.fields, `${failMsg}\n`);
      payload.attachments[0].color = 'danger';
      expect(await client.fail('')).toStrictEqual(payload);
    });
    it('is cancel', async () => {
      const withParams: With = {
        status: '',
        mention: '',
        author_name: '',
        if_mention: '',
        username: '',
        icon_emoji: '',
        icon_url: '',
        channel: '',
        fields: '',
      };
      const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
      const payload = getTemplate(withParams.fields, `${cancelMsg}\n`);
      payload.attachments[0].color = 'warning';
      expect(await client.cancel('')).toStrictEqual(payload);
    });
  });

  it('has no mention', async () => {
    const withParams: With = {
      status: '',
      mention: '',
      author_name: '',
      if_mention: '',
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, msg);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('does not match the requirements of the mention', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: Failure,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    let client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    let payload = getTemplate(withParams.fields, msg);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);

    withParams.mention = '';
    client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    payload = getTemplate(withParams.fields, msg);
    payload.attachments[0].color = 'danger';
    expect(await client.fail(msg)).toStrictEqual(payload);
  });

  it('matches some of the conditions of the mention', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: `${Failure},${Success}`,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('can be mentioned on success', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('can be mentioned on failure', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: Failure,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'danger';
    expect(await client.fail(msg)).toStrictEqual(payload);
  });

  it('can be mentioned on cancelled', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: Cancelled,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'warning';
    expect(await client.cancel(msg)).toStrictEqual(payload);
  });

  it('can be mentioned on always', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: Always,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    let payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);

    payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'danger';
    expect(await client.fail(msg)).toStrictEqual(payload);

    payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'warning';
    expect(await client.cancel(msg)).toStrictEqual(payload);
  });

  it('mentions one user', async () => {
    const withParams: With = {
      status: '',
      mention: 'user_id',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<@user_id> ${msg}`);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('can be mentioned here', async () => {
    const withParams: With = {
      status: '',
      mention: 'here',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<!here> ${msg}`);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('can be mentioned channel', async () => {
    const withParams: With = {
      status: '',
      mention: 'channel',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(withParams.fields, `<!channel> ${msg}`);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('mentions a user group', async () => {
    const withParams: With = {
      status: '',
      mention: 'subteam^user_group_id',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(
      withParams.fields,
      `<!subteam^user_group_id> ${msg}`,
    );
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('mentions multiple user groups', async () => {
    const withParams: With = {
      status: '',
      mention: 'subteam^user_group_id,subteam^user_group_id2',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(
      withParams.fields,
      `<!subteam^user_group_id> <!subteam^user_group_id2> ${msg}`,
    );
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('mentions multiple users', async () => {
    const withParams: With = {
      status: '',
      mention: 'user_id,user_id2',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(
      withParams.fields,
      `<@user_id> <@user_id2> ${msg}`,
    );
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('mentions mix of user and user group', async () => {
    const withParams: With = {
      status: '',
      mention: 'user_id,subteam^user_group_id',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'mention test';
    const payload = getTemplate(
      withParams.fields,
      `<@user_id> <!subteam^user_group_id> ${msg}`,
    );
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('removes csv space', async () => {
    const withParams: With = {
      status: '',
      mention: 'user_id, user_id2',
      author_name: '',
      if_mention: Success,
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    let client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'hello';

    let payload = getTemplate(
      withParams.fields,
      `<@user_id> <@user_id2> ${msg}`,
    );
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);
  });

  it('returns the expected template', async () => {
    const withParams: With = {
      status: '',
      mention: '',
      author_name: '',
      if_mention: '',
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
    const msg = 'hello';

    // for success
    let payload = getTemplate(withParams.fields, msg);
    payload.attachments[0].color = 'good';
    expect(await client.success(msg)).toStrictEqual(payload);

    // for cancel
    payload = getTemplate(withParams.fields, msg);
    payload.attachments[0].color = 'warning';
    expect(await client.cancel(msg)).toStrictEqual(payload);

    // for fail
    payload = getTemplate(withParams.fields, msg);
    payload.attachments[0].color = 'danger';
    expect(await client.fail(msg)).toStrictEqual(payload);
  });

  it('works without GITHUB_TOKEN', async () => {
    const withParams: With = {
      status: '',
      mention: '',
      author_name: '',
      if_mention: '',
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: 'message,author',
    };
    const client = new Client(withParams, undefined, '');
    const payload = getTemplate(withParams.fields, `${successMsg}\n`);
    payload.attachments[0].color = 'good';
    payload.attachments[0].fields = payload.attachments[0].fields.filter(
      (field: any) => !['message', 'author'].includes(field.title),
    );
    expect(await client.success('')).toStrictEqual(payload);
  });

  describe('pull request event', () => {
    beforeEach(() => {
      process.env.GITHUB_EVENT_NAME = 'pull_request';
    });
    afterAll(() => {
      process.env.GITHUB_EVENT_NAME = 'push';
    });

    it('works on pull request event', async () => {
      const github = require('@actions/github');
      const sha = 'expected-sha-for-pull_request_event';
      github.context.payload = {
        pull_request: {
          number: 123,
          head: { sha },
        },
      };
      github.context.eventName = 'pull_request';

      const withParams: With = {
        status: '',
        mention: 'user_id',
        author_name: '',
        if_mention: Success,
        username: '',
        icon_emoji: '',
        icon_url: '',
        channel: '',
        fields: 'action',
      };
      const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
      const msg = 'mention test';
      const payload = getTemplate(withParams.fields, `<@user_id> ${msg}`, sha);
      payload.attachments[0].color = 'good';
      expect(await client.success(msg)).toStrictEqual(payload);
    });
  });

  it('throws error', () => {
    const withParams: With = {
      status: '',
      mention: '',
      author_name: '',
      if_mention: '',
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    expect(() => new Client(withParams, undefined)).toThrow(
      'Specify secrets.SLACK_WEBHOOK_URL',
    );
  });

  it('send payload', async () => {
    const fn = jest.fn();
    // Mock logs so they don't show up in test logs.
    jest.spyOn(require('@actions/core'), 'debug').mockImplementation(jest.fn());
    const mockSlackWebhookUrl = 'http://example.com';
    nock(mockSlackWebhookUrl)
      .post('/', body => {
        fn();
        expect(body).toStrictEqual({ text: 'payload' });
        return body;
      })
      .reply(200, () => getApiFixture('repos.commits.get'));

    const withParams: With = {
      status: '',
      mention: '',
      author_name: '',
      if_mention: '',
      username: '',
      icon_emoji: '',
      icon_url: '',
      channel: '',
      fields: '',
    };
    const client = new Client(withParams, undefined, mockSlackWebhookUrl);

    await client.send('payload');

    expect(fn).toBeCalledTimes(1);
  });
  describe('.custom', () => {
    it('is full fields', async () => {
      const withParams: With = {
        status: 'custom',
        mention: '',
        author_name: '',
        if_mention: '',
        username: '',
        icon_emoji: '',
        icon_url: '',
        channel: '',
        fields: 'all',
      };
      const client = new Client(withParams, process.env.GITHUB_TOKEN, '');
      expect(
        await client.custom(`{
          text: \`\${process.env.AS_WORKFLOW}
\${process.env.AS_JOB} (\${process.env.AS_COMMIT}) of \${process.env.AS_REPO}@master by \${process.env.AS_AUTHOR} succeeded in \${process.env.AS_TOOK}\`
          }`),
      ).toStrictEqual({
        text: `<https://github.com/8398a7/action-slack/commit/b24f03a32e093fe8d55e23cfd0bb314069633b2f/checks|PR Checks>
<https://github.com/8398a7/action-slack/runs/762195612|notification> (<https://github.com/8398a7/action-slack/commit/b24f03a32e093fe8d55e23cfd0bb314069633b2f|b24f03a3>) of <https://github.com/8398a7/action-slack|8398a7/action-slack>@master by 839<8398a7@gmail.com> succeeded in 1 hour 1 min 1 sec`,
      });
    });
  });
});
