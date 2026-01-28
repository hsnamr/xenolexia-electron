# Contributing to Xenolexia

Thank you for your interest in contributing to Xenolexia! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/xenolexia/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Device/OS information

### Suggesting Features

1. Check existing issues and discussions
2. Create a new issue with the `enhancement` label
3. Describe the feature and its benefits
4. Include mockups if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Write/update tests as needed
5. Ensure all tests pass: `npm test`
6. Ensure linting passes: `npm run lint`
7. Commit with clear messages
8. Push and create a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- React Native CLI
- Xcode 15+ (iOS)
- Android Studio (Android)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/xenolexia.git
cd xenolexia

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Run the app
npm start
npm run ios  # or npm run android
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types for all props and state
- Avoid `any` type
- Use interfaces for object shapes

### Style Guide

- Follow existing code patterns
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable/function names

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(reader): add word density slider`
- `fix(vocabulary): correct SRS interval calculation`
- `docs(readme): update installation instructions`

## Testing

- Write tests for new features
- Maintain existing test coverage
- Run tests before submitting PR: `npm test`

## Documentation

- Update README for user-facing changes
- Add JSDoc comments for public APIs
- Update PLAN.md for significant architecture changes

## Language Contributions

### Adding Word Lists

We welcome contributions of word lists for new language pairs!

1. Create frequency-ranked word list (1-5000 words minimum)
2. Format as JSON with required fields
3. Include source attribution
4. Submit PR with word list and documentation

### Translation Quality

- Prefer common, natural translations
- Include variants (plurals, conjugations)
- Add pronunciation where helpful

## Questions?

Feel free to:
- Open a discussion on GitHub
- Ask in PR comments
- Reach out to maintainers

Thank you for contributing to Xenolexia! 🙏
