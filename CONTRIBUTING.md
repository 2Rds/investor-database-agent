# Contributing to Investor Database Agent

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/investor-database-agent/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Relevant logs or screenshots

### Suggesting Enhancements

1. Check existing issues and discussions
2. Create a new issue with:
   - Clear description of the enhancement
   - Use cases and benefits
   - Possible implementation approach
   - Any alternatives considered

### Pull Requests

1. **Fork and clone** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Follow the code style (ESLint + Prettier)
   - Add tests if applicable
   - Update documentation
4. **Test your changes**:
   ```bash
   npm run lint
   npm run format
   npm run build
   npm test
   ```
5. **Commit** with clear messages:
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** with:
   - Clear title and description
   - Reference related issues
   - Screenshots/videos if applicable

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Fill in your test credentials
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## Project Structure

```
src/
├── config/           # Configuration and environment
├── handlers/         # Message and command handlers
├── services/         # Core services (AI, Notion, Slack, etc.)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── index.ts          # Application entry point
```

## Adding New Features

### 1. Enrichment Sources

To add a new data enrichment source:

1. Create method in `src/services/research/enrichment.ts`:
   ```typescript
   async enrichFromNewSource(investorName: string): Promise<EnrichmentResult> {
     // Implementation
   }
   ```

2. Add API key to `.env.example`:
   ```env
   NEW_SOURCE_API_KEY=your-key-here
   ```

3. Update config validation in `src/config/index.ts`

4. Document in SETUP.md

### 2. Slack Commands

To add a new slash command:

1. Register command in Slack App settings
2. Add handler in `src/services/slack/bot.ts`:
   ```typescript
   this.app.command('/vc-newcommand', async ({ command, ack, client }) => {
     await ack();
     await this.commandHandler.handleNewCommand(command, client);
   });
   ```

3. Implement in `src/handlers/commandHandler.ts`
4. Document in USAGE.md

### 3. AI Agent Capabilities

To enhance AI research:

1. Update prompts in `src/services/ai/agent.ts`
2. Modify `InvestorLead` type if needed
3. Update Notion schema accordingly
4. Test with various investor types

## Testing

### Manual Testing

1. Create test Slack workspace
2. Set up test Notion database
3. Use test API keys
4. Run through key workflows:
   - Add investor
   - Find matching investors
   - Error scenarios

### Automated Testing (Future)

```bash
npm test
```

## Documentation

When adding features, update:
- README.md - High-level overview
- SETUP.md - Setup/configuration steps
- USAGE.md - User-facing documentation
- ARCHITECTURE.md - Technical details
- Code comments - Complex logic

## Commit Message Guidelines

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: Add PitchBook API integration
fix: Handle missing LinkedIn URLs gracefully
docs: Update SETUP.md with Docker instructions
refactor: Simplify match scoring algorithm
```

## Review Process

1. PRs require at least one approval
2. All CI checks must pass
3. Code must follow style guidelines
4. Documentation must be updated
5. No merge conflicts

## Questions?

- Open a [Discussion](https://github.com/yourusername/investor-database-agent/discussions)
- Ask in existing [Issues](https://github.com/yourusername/investor-database-agent/issues)
- Review [Documentation](./README.md)

Thank you for contributing! 🎉
