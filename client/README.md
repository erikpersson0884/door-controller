<!--
  README TEMPLATE
  ----------------
  Find and replace these placeholders, then delete sections you don't need:

  {{PROJECT_NAME}}        Name of the project
  {{TAGLINE}}             One-line description
  REPO_NAME           Repository name
  {{CI_WORKFLOW_FILE}}    e.g. tests.yml

  Remove the <!-- hint --> comments before publishing.
-->

# {{PROJECT_NAME}}

{{TAGLINE}}

[![Last Commit][last-commit-shield]][last-commit-url]
[![Build Status][build-shield]][build-url]
[![Test Coverage][coverage-shield]][coverage-url]
[![Repo Size][repo-size-shield]][repo-size-url]
[![Author][author-shield]][author-url]

<!-- Add a screenshot or demo GIF here, e.g. docs/screenshot.png -->
<!-- ![{{PROJECT_NAME}}](docs/screenshot.png) -->

# Index

1. [About the project](#about-the-project)
1. [Features](#features)
1. [Built with](#built-with)
1. [Getting started](#getting-started)
1. [Configuration](#configuration)
1. [Scripts](#scripts)
1. [Testing](#testing)
1. [Code analysis](#code-analysis)
1. [Deployment](#deployment)
1. [Contributing](#contributing)
1. [License](#license)
1. [Authors](#authors)
1. [Acknowledgments](#acknowledgments)

# About the project

{{Two to four sentences: what the project is, who it is for, and what problem it solves.}}

<!-- Optional: if this repo depends on another service, say so here. -->
This repository contains **only the {{frontend / backend / library / CLI}}**. It requires {{dependency name}} ([link]({{DEPENDENCY_URL}})), which {{what it provides}}.

## Built with

![React][react-shield]
![TypeScript][ts-shield]
![Vite][vite-shield]
![Vitest][vitest-shield]
![Docker][docker-shield]


## Features

- {{Feature one}}
- {{Feature two}}
- {{Feature three}}
- {{Feature four}}

# Getting started

## Prerequisites

- Node.js 20+
- {{Any external service that must be running}}

## Installation

```sh
# Clone the repository
git clone https://github.com/erikpersson0884/REPO_NAME.git

# Navigate into the project directory
cd REPO_NAME

# Install dependencies
npm install

# Start the project
npm run dev
```

The app runs on {{http://localhost:PORT}}. {{Any notes, e.g. proxying or default credentials.}}

# Configuration

<!-- Delete this section if nothing is configurable. -->
Using a `.env` file is {{optional / required}}. Copy `.env.example` to `.env` to change the defaults.


| Variable | Default | Description |
|---|---|---|
| `{{VAR_NAME}}` | `{{default}}` | {{What it controls}} |
| `{{VAR_NAME}}` | `{{default}}` | {{What it controls}} |

# Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm run lint` | Check the codebase for linting errors |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the test suite |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run test:coverage` | Run the tests and generate a coverage report |
| `npm run test:coverage:watch` | Run the tests with coverage in watch mode |

# Testing

Tests use [Vitest](https://vitest.dev/) with a JSDOM environment and
`@testing-library/jest-dom` for DOM assertions. The test suite covers the
application components and user interface behavior.

Run the tests once:

```sh
npm run test
```

Run the tests in watch mode while developing:

```sh
npm run test:watch
```

Generate a coverage report:

```sh
npm run test:coverage
```

Generate coverage while watching for changes:

```sh
npm run test:coverage:watch
```

# Code analysis

<!-- Optional. Delete if you don't use a static analysis tool. -->
The project can optionally be analyzed with {{tool, e.g. SonarQube}}. This requires access to your own server, so it is not part of the normal setup.

1. Create a project in {{tool}} and generate an access token.
2. Set the server details as environment variables:

   ```sh
   export {{TOOL}}_HOST_URL={{http://your-server:PORT}}
   export {{TOOL}}_TOKEN=your_token
   ```

3. Make sure the project key in {{config file}} matches your project, or override it:

   ```sh
   {{command with project key override}}
   ```

4. Generate coverage, then run the analysis:

   ```sh
   {{coverage command}}
   {{analysis command}}
   ```

Never commit your token.

# Deployment

<!-- Describe how to ship the project. Docker is shown as an example. -->
The repository includes a `Dockerfile` and a `docker-compose.yml`.

```sh
docker compose up --build
```

The app is then available on {{http://localhost:PORT}} (host port {{HOST_PORT}} maps to port {{CONTAINER_PORT}} in the container).

**Requirements at runtime:** {{e.g. a backend reachable as `service-name` on port 8080 on the same Docker network}}.

## How it is configured

<!-- Optional: explain non-obvious deployment config such as nginx, env vars or volumes. -->
- **{{Aspect one}}:** {{Explanation}}
- **{{Aspect two}}:** {{Explanation}}
- **{{Aspect three}}:** {{Explanation}}

# Contributing

If you want to contribute, follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Make your changes and run the tests (`{{test command}}`)
4. Commit your changes (`git commit -m 'Add new feature'`)
5. Push to the branch (`git push origin feature-branch`)
6. Create a Pull Request

# License

<!-- Pick a license and add a LICENSE file, e.g. MIT. -->
Distributed under the {{LICENSE_NAME}} license. See `LICENSE` for more information.

# Authors

- [Erik Persson 🐦](https://github.com/erikpersson0884)

# Acknowledgments

- [PERSON_OR_PROJECT](URL_FOR_THE_PERSON_OR_PROJECT) for WHAT_THEY_CONTRIBUTED
- [PERSON_OR_PROJECT](URL_FOR_THE_PERSON_OR_PROJECT) for WHAT_THEY_CONTRIBUTED


<!-- Repo info shields -->
[last-commit-shield]: https://img.shields.io/github/last-commit/erikpersson0884/REPO_NAME/main?style=for-the-badge&cacheSeconds=30
[last-commit-url]: https://github.com/erikpersson0884/REPO_NAME/commits/main

[repo-size-shield]: https://img.shields.io/github/repo-size/erikpersson0884/REPO_NAME?style=for-the-badge&cacheSeconds=60
[repo-size-url]: https://github.com/erikpersson0884/REPO_NAME

[author-shield]: https://img.shields.io/badge/Author-Erik_Persson-blue?style=for-the-badge
[author-url]: https://github.com/erikpersson0884

[build-shield]: https://img.shields.io/github/actions/workflow/status/erikpersson0884/REPO_NAME/{{CI_WORKFLOW_FILE}}?branch=main&style=for-the-badge
[build-url]: https://github.com/erikpersson0884/REPO_NAME/actions


<!-- Tech stack shields. Format: https://img.shields.io/badge/NAME-HEXCOLOR?logo=LOGONAME&logoColor=white&style=for-the-badge -->
[tech-1-shield]: https://img.shields.io/badge/{{TECH_1}}-{{HEX}}?logo={{logo-slug}}&logoColor=white&style=for-the-badge
[tech-2-shield]: https://img.shields.io/badge/{{TECH_2}}-{{HEX}}?logo={{logo-slug}}&logoColor=white&style=for-the-badge
[tech-3-shield]: https://img.shields.io/badge/{{TECH_3}}-{{HEX}}?logo={{logo-slug}}&logoColor=white&style=for-the-badge


<!-- Test coverage shield (requires a workflow that writes .github/coverage.json to a "coverage" branch) -->
[coverage-shield]: https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/erikpersson0884/REPO_NAME/coverage/.github/coverage.json&style=for-the-badge&v=2
[coverage-url]: https://github.com/erikpersson0884/REPO_NAME/actions


<!-- Tech stack shields -->
[react-shield]: https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=for-the-badge
[ts-shield]: https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge
[vite-shield]: https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge
[vitest-shield]: https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white&style=for-the-badge
[docker-shield]: https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=for-the-badge
