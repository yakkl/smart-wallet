# Contributing to YAKKL Smart Wallet and Smart Contracts

>Thank you for your interest in contributing to the YAKKL Smart Wallet and Smart Contracts project. We value your efforts and look forward to your contributions. This document outlines the process for contributing to our project. It's people like you that makes YAKKL Smart Wallet and Smart Contracts such a great product and set of tools.

## What we need

We welcome contributions in the form of bug reports, feature requests, code changes, documentation updates, and more! Here are some ways you can contribute:
 - **Bug Reports:** If you encounter a bug, please report it on our [GitHub Issues]
 - **Feature Requests:** If you have an idea for a new feature, please submit it on our [GitHub Issues]
 - **Code Changes:** If you want to contribute code changes, please follow the guidelines in this document
 - **Documentation Updates:** If you find an error in the documentation or want to improve it, please submit a pull request
 - **Testing:** Help us test the YAKKL Smart Wallet and Smart Contracts project and report any issues you find
 - **Feedback:** Provide feedback on the project, including what you like, what you don't like, and what you would like to see improved
 - **Spread the Word:** Share the YAKKL Smart Wallet and Smart Contracts project with others and help us grow the community
 - **Other Contributions:** If you have other ideas for how you can contribute, please let us know

## Table of Contents

- [Contributing to YAKKL Smart Wallet and Smart Contracts](#contributing-to-yakkl-smart-wallet-and-smart-contracts)
  - [What we need](#what-we-need)
  - [Table of Contents](#table-of-contents)
  - [Forking the Repository](#forking-the-repository)
  - [Branching Strategy](#branching-strategy)
  - [Writing and Running Tests](#writing-and-running-tests)
  - [Syncing with Upstream](#syncing-with-upstream)
  - [Committing and Pushing Changes](#committing-and-pushing-changes)
  - [Creating a Pull Request](#creating-a-pull-request)
  - [Code Review Process](#code-review-process)
  - [Staying Updated](#staying-updated)
  - [First Contribution](#first-contribution)
    - [Make it small](#make-it-small)
  - [Support and Legal](#support-and-legal)

## Forking the Repository

Before you start working, you'll need to fork the repository. This allows you to work on your own copy of the project without affecting the original repository.

1. Navigate to the [YAKKL Smart Wallet GitHub repository](https://github.com/yakkl/smart-wallet).
2. Click the "Fork" button in the upper-right corner of the page.
3. Choose your GitHub account as the destination for the fork.

## Branching Strategy

When you're ready to start working on a feature or fix, create a new branch from the `develop` branch in your forked repository.

- **Small Branches:** Break your work into small, focused branches. This makes it easier to review and comment on changes.
- **Branch Naming:** Use descriptive names for your branches. For example, `feature/new-login`, `fix/issue-42`, or `chore/update-dependencies`.

## Writing and Running Tests

All contributions must include relevant unit tests and any other tests required for the feature or fix you are implementing.

1. Write tests alongside your code changes.
2. Ensure that all tests pass before pushing your changes.

We use [insert testing framework] for our tests. Please follow the existing test patterns in the project.

## Syncing with Upstream

Before pushing your changes, make sure your branch is up to date with the latest changes from the upstream `develop` branch.

1. Add the upstream repository as a remote:
   ```bash
   git remote add upstream https://github.com/yakkl/smart-wallet.git
   ```
2. Fetch the latest changes:
   ```bash
   git fetch upstream
   ```
3. Rebase your branch onto the `develop` branch:
   ```bash
   git rebase upstream/develop
   ```

Resolve any conflicts that may arise during the rebase.

## Committing and Pushing Changes

Commit your changes with clear and concise commit messages. Please follow the conventional commit format:

```
type(scope): subject
```

Examples:
- `feat(wallet): add support for new blockchain`
- `fix(ui): correct alignment on the dashboard`

Push your branch to your forked repository:

```bash
git push origin your-branch-name
```

## Creating a Pull Request

Once your branch is ready, create a pull request (PR) to the `develop` branch of the upstream repository.

1. Go to the "Pull Requests" tab in your forked repository.
2. Click the "New Pull Request" button.
3. Choose the upstream repository's `develop` branch as the base, and your branch as the compare.
4. Provide a clear and detailed description of your changes.
5. Submit the pull request.

## Code Review Process

Your pull request will be reviewed by the YAKKL team. During the review:

1. We will assess the code quality, adherence to the project’s style, and the relevance of the changes.
2. We will review the tests to ensure they cover the intended functionality.
3. If there are any questions or changes needed, we will provide feedback directly on the pull request.

Once the review is complete and any requested changes are made, we will merge the pull request into the `develop` branch.

## Staying Updated

It's important to stay in sync with the latest changes from the upstream repository. Regularly fetch and rebase your branches with the upstream `develop` branch to avoid merge conflicts and ensure your code works with the latest updates.

## First Contribution

Here are a couple of friendly tutorials you can include: http://makeapullrequest.com/ and http://www.firsttimersonly.com/

> Working on your first Pull Request? You can learn how from this *free* series, [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

### Make it small

If you're new to contributing to open source projects, start with a small, manageable task. This will help you get familiar with the project and the contribution process. As you gain experience, you can take on more complex tasks.

## Support and Legal

If you have any questions or need support, please contact us at:

- **Support:** [support@yakkl.com](mailto:support@yakkl.com)
- **Legal:** [legal@yakkl.com](mailto:legal@yakkl.com)

For more information about YAKKL, Inc., please visit [yakkl.com](https://yakkl.com).

Thank you for contributing to YAKKL Smart Wallet and Smart Contracts!

