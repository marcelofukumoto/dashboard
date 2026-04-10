import { GitUtils, Commit } from '@shell/utils/git';

describe('gitUtils', () => {
  describe('github normalization', () => {
    describe('repo', () => {
      it('maps github repo API response to normalized shape', () => {
        const data = {
          owner: {
            login: 'octocat', html_url: 'https://github.com/octocat', avatar_url: 'https://github.com/octocat.png'
          },
          description: 'A test repo',
          created_at:  '2020-01-01T00:00:00Z',
          updated_at:  '2021-06-01T00:00:00Z',
          html_url:    'https://github.com/octocat/hello-world',
          name:        'hello-world',
        };

        const result = GitUtils.github.normalize.repo(data);

        expect(result).toStrictEqual({
          owner: {
            name:      'octocat',
            htmlUrl:   'https://github.com/octocat',
            avatarUrl: 'https://github.com/octocat.png',
          },
          description: 'A test repo',
          created_at:  '2020-01-01T00:00:00Z',
          updated_at:  '2021-06-01T00:00:00Z',
          htmlUrl:     'https://github.com/octocat/hello-world',
          name:        'hello-world',
        });
      });

      it('handles missing owner fields gracefully', () => {
        const data = {
          owner:       {},
          description: '',
          created_at:  '',
          updated_at:  '',
          html_url:    '',
          name:        '',
        };

        const result = GitUtils.github.normalize.repo(data);

        expect(result.owner).toStrictEqual({
          name: undefined, htmlUrl: undefined, avatarUrl: undefined
        });
      });

      it('handles null owner gracefully', () => {
        const data = {
          owner:       null,
          description: 'desc',
          created_at:  '2020-01-01T00:00:00Z',
          updated_at:  '2021-06-01T00:00:00Z',
          html_url:    'https://github.com/x/y',
          name:        'y',
        };

        const result = GitUtils.github.normalize.repo(data as any);

        expect(result.owner).toStrictEqual({
          name: undefined, htmlUrl: undefined, avatarUrl: undefined
        });
      });
    });

    describe('commit', () => {
      it('maps github commit API response to normalized shape', () => {
        const data = {
          commit:   { message: 'Initial commit', committer: { date: '2021-01-01T00:00:00Z' } },
          html_url: 'https://github.com/octocat/hello-world/commit/abc1234',
          sha:      'abc1234567890',
          author:   {
            login: 'octocat', avatar_url: 'https://github.com/octocat.png', htmlUrl: 'https://github.com/octocat'
          },
        };

        const result: Commit = GitUtils.github.normalize.commit(data);

        expect(result).toStrictEqual({
          message:  'Initial commit',
          htmlUrl:  'https://github.com/octocat/hello-world/commit/abc1234',
          sha:      'abc1234',
          commitId: 'abc1234567890',
          author:   {
            name:      'octocat',
            avatarUrl: 'https://github.com/octocat.png',
            htmlUrl:   'https://github.com/octocat',
          },
          isChecked: false,
          date:      '2021-01-01T00:00:00Z',
        });
      });

      it('truncates sha to 7 characters', () => {
        const data = {
          commit: { message: 'fix: bug', committer: { date: '2021-01-01T00:00:00Z' } },
          sha:    '1234567890abcdef',
          author: {},
        };

        const result = GitUtils.github.normalize.commit(data);

        expect(result.sha).toBe('1234567');
      });

      it('returns undefined sha for empty string sha', () => {
        const data = {
          commit: { message: 'fix', committer: { date: '2021-01-01T00:00:00Z' } },
          sha:    '',
          author: {},
        };

        const result = GitUtils.github.normalize.commit(data);

        expect(result.sha).toBeUndefined();
      });

      it('handles missing author gracefully', () => {
        const data = {
          commit: { message: 'test', committer: { date: '2021-01-01T00:00:00Z' } },
          sha:    'abc1234',
          author: null,
        };

        const result = GitUtils.github.normalize.commit(data);

        expect(result.author).toStrictEqual({
          name: undefined, avatarUrl: undefined, htmlUrl: undefined
        });
      });
    });
  });

  describe('gitlab normalization', () => {
    describe('repo', () => {
      it('maps gitlab repo API response to normalized shape', () => {
        const data = {
          namespace: {
            name: 'gitlab-org', web_url: 'https://gitlab.com/gitlab-org', avatar_url: 'https://gitlab.com/avatar.png'
          },
          description:      'GitLab repo',
          created_at:       '2020-01-01T00:00:00Z',
          last_activity_at: '2021-06-01T00:00:00Z',
          web_url:          'https://gitlab.com/gitlab-org/project',
          name:             'project',
        };

        const result = GitUtils.gitlab.normalize.repo(data);

        expect(result).toStrictEqual({
          owner: {
            name:      'gitlab-org',
            htmlUrl:   'https://gitlab.com/gitlab-org',
            avatarUrl: 'https://gitlab.com/avatar.png',
          },
          description: 'GitLab repo',
          created_at:  '2020-01-01T00:00:00Z',
          updated_at:  '2021-06-01T00:00:00Z',
          htmlUrl:     'https://gitlab.com/gitlab-org/project',
          name:        'project',
        });
      });

      it('uses last_activity_at as updated_at', () => {
        const data = {
          namespace: {
            name: 'org', web_url: '', avatar_url: ''
          },
          description:      '',
          created_at:       '2020-01-01T00:00:00Z',
          last_activity_at: '2022-05-10T00:00:00Z',
          web_url:          '',
          name:             '',
        };

        const result = GitUtils.gitlab.normalize.repo(data);

        expect(result.updated_at).toBe('2022-05-10T00:00:00Z');
      });
    });

    describe('commit', () => {
      it('maps gitlab commit API response to normalized shape', () => {
        const data = {
          message:        'feat: add feature',
          web_url:        'https://gitlab.com/org/repo/-/commit/abc1234',
          short_id:       'abc1234',
          id:             'abc1234567890',
          author_name:    'Alice',
          avatar_url:     'https://gitlab.com/alice.png',
          committed_date: '2021-03-15T12:00:00Z',
        };

        const result: Commit = GitUtils.gitlab.normalize.commit(data);

        expect(result).toStrictEqual({
          message:  'feat: add feature',
          htmlUrl:  'https://gitlab.com/org/repo/-/commit/abc1234',
          sha:      'abc1234',
          commitId: 'abc1234567890',
          author:   {
            name:      'Alice',
            avatarUrl: 'https://gitlab.com/alice.png',
            htmlUrl:   'https://gitlab.com/org/repo/-/commit/abc1234',
          },
          isChecked: false,
          date:      '2021-03-15T12:00:00Z',
        });
      });

      it('uses web_url as commit author htmlUrl', () => {
        const data = {
          message:        'fix',
          web_url:        'https://gitlab.com/org/repo/-/commit/xyz',
          short_id:       'xyz',
          id:             'xyz1234',
          author_name:    'Bob',
          avatar_url:     '',
          committed_date: '2021-01-01T00:00:00Z',
        };

        const result = GitUtils.gitlab.normalize.commit(data);

        expect((result.author as any).htmlUrl).toBe('https://gitlab.com/org/repo/-/commit/xyz');
      });
    });
  });
});
