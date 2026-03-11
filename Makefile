# Playwright TypeScript Framework - Makefile
#
# Common commands for running tests, managing dependencies, and generating reports

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# ============================================================================
# Setup Commands
# ============================================================================

.PHONY: setup
setup: ## Initial setup - install dependencies and browsers
	@echo "$(BLUE)⚙️  Setting up project...$(NC)"
	@pnpm install
	@pnpm exec playwright install --with-deps chromium
	@echo "$(GREEN)✓ Setup complete$(NC)"

.PHONY: setup-all
setup-all: ## Install all browsers (chromium, firefox, webkit)
	@echo "$(BLUE)⚙️  Installing all browsers...$(NC)"
	@pnpm exec playwright install --with-deps
	@echo "$(GREEN)✓ All browsers installed$(NC)"

.PHONY: setup-dev
setup-dev: ## Install dependencies for development only
	@echo "$(BLUE)⚙️  Installing dev dependencies...$(NC)"
	@pnpm install --dev
	@echo "$(GREEN)✓ Dev dependencies installed$(NC)"

# ============================================================================
# Dependency Management
# ============================================================================

.PHONY: install
install: ## Install dependencies
	@pnpm install

.PHONY: install-frozen
install-frozen: ## Install dependencies with frozen lockfile
	@pnpm install --frozen-lockfile

.PHONY: update
update: ## Update dependencies
	@echo "$(YELLOW)⚠️  Updating dependencies...$(NC)"
	@pnpm update
	@pnpm install

.PHONY: outdated
outdated: ## Check for outdated dependencies
	@pnpm outdated

# ============================================================================
# Code Quality
# ============================================================================

.PHONY: check
check: ## Run all checks (type-check, lint, format-check)
	@echo "$(BLUE)🔍 Running all checks...$(NC)"
	@pnpm type-check
	@pnpm lint
	@pnpm format:check
	@echo "$(GREEN)✓ All checks passed$(NC)"

.PHONY: type-check
type-check: ## Run TypeScript type check
	@echo "$(BLUE)🔍 Type checking...$(NC)"
	@pnpm type-check

.PHONY: lint
lint: ## Run ESLint
	@echo "$(BLUE)🔍 Linting...$(NC)"
	@pnpm lint

.PHONY: lint-fix
lint-fix: ## Fix ESLint errors automatically
	@echo "$(BLUE)🔧 Fixing lint issues...$(NC)"
	@pnpm lint --fix

.PHONY: format
format: ## Format code with Prettier
	@echo "$(BLUE)🎨 Formatting code...$(NC)"
	@pnpm format

.PHONY: format-check
format-check: ## Check code formatting
	@echo "$(BLUE)🔍 Checking formatting...$(NC)"
	@pnpm format:check

# ============================================================================
# Testing Commands
# ============================================================================

.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)🧪 Running all tests...$(NC)"
	@pnpm test

.PHONY: test-e2e
test-e2e: ## Run all E2E tests
	@echo "$(BLUE)🧪 Running E2E tests...$(NC)"
	@pnpm test:e2e

.PHONY: test-api
test-api: ## Run all API tests
	@echo "$(BLUE)🧪 Running API tests...$(NC)"
	@pnpm test:api

# Xendit tests
.PHONY: test-xendit
test-xendit: ## Run Xendit E2E tests
	@echo "$(BLUE)🧪 Running Xendit E2E tests...$(NC)"
	@pnpm test --project=e2e-xendit

.PHONY: test-xendit-dev
test-xendit-dev: ## Run Xendit E2E tests in dev environment
	@echo "$(BLUE)🧪 Running Xendit E2E tests (dev)...$(NC)"
	@TEST_ENV=dev pnpm test --project=e2e-xendit

.PHONY: test-xendit-staging
test-xendit-staging: ## Run Xendit E2E tests in staging environment
	@echo "$(BLUE)🧪 Running Xendit E2E tests (staging)...$(NC)"
	@TEST_ENV=staging pnpm test --project=e2e-xendit

.PHONY: test-xendit-prod
test-xendit-prod: ## Run Xendit E2E tests in production environment
	@echo "$(BLUE)🧪 Running Xendit E2E tests (production)...$(NC)"
	@TEST_ENV=production pnpm test --project=e2e-xendit

# Xendit API tests
.PHONY: test-xendit-api
test-xendit-api: ## Run Xendit API tests
	@echo "$(BLUE)🧪 Running Xendit API tests...$(NC)"
	@pnpm test --project=api-xendit

# ============================================================================
# Debugging Commands
# ============================================================================

.PHONY: test-debug
test-debug: ## Run tests in debug mode (headed, no timeout)
	@echo "$(BLUE)🐛 Running tests in debug mode...$(NC)"
	@PWDEBUG=1 pnpm test --headed --no-timeout

.PHONY: test-debug-xendit
test-debug-xendit: ## Debug Xendit E2E tests
	@echo "$(BLUE)🐛 Debugging Xendit E2E tests...$(NC)"
	@PWDEBUG=1 pnpm test --project=e2e-xendit --headed --no-timeout

.PHONY: test-ui
test-ui: ## Run tests with Playwright UI
	@echo "$(BLUE)🖥️  Running tests with UI mode...$(NC)"
	@pnpm exec playwright test --ui

# ============================================================================
# Reporting Commands
# ============================================================================

.PHONY: report-allure
report-allure: ## Generate Allure report
	@echo "$(BLUE)📊 Generating Allure report...$(NC)"
	@pnpm report:allure
	@echo "$(GREEN)✓ Allure report generated: allure-report/index.html$(NC)"

.PHONY: report-allure-open
report-allure-open: report-allure ## Generate and open Allure report in browser
	@echo "$(BLUE)📊 Opening Allure report in browser...$(NC)"
	@pnpm report:open

.PHONY: report-html
report-html: ## Generate HTML report
	@echo "$(BLUE)📊 Generating HTML report...$(NC)"
	@pnpm exec playwright show-report

.PHONY: report-clean
report-clean: ## Clean all reports
	@echo "$(YELLOW)🧹 Cleaning reports...$(NC)"
	@rm -rf allure-report playwright-report test-results allure-results
	@echo "$(GREEN)✓ Reports cleaned$(NC)"

# ============================================================================
# Environment Management
# ============================================================================

.PHONY: env-dev
env-dev: ## Set dev environment
	@export TEST_ENV=dev

.PHONY: env-staging
env-staging: ## Set staging environment
	@export TEST_ENV=staging

.PHONY: env-prod
env-prod: ## Set production environment
	@export TEST_ENV=production

# ============================================================================
# Playwright Commands
# ============================================================================

.PHONY: playwright-install
playwright-install: ## Install Playwright browsers
	@echo "$(BLUE)🌐 Installing Playwright browsers...$(NC)"
	@pnpm exec playwright install --with-deps chromium

.PHONY: playwright-install-all
playwright-install-all: ## Install all Playwright browsers
	@echo "$(BLUE)🌐 Installing all Playwright browsers...$(NC)"
	@pnpm exec playwright install --with-deps

.PHONY: playwright-update
playwright-update: ## Update Playwright browsers
	@echo "$(BLUE)🌐 Updating Playwright browsers...$(NC)"
	@pnpm exec playwright install --with-deps --force

.PHONY: playwright-codegen
playwright-codegen: ## Run Playwright codegen
	@echo "$(BLUE)🎬 Starting Playwright codegen...$(NC)"
	@pnpm exec playwright codegen

# ============================================================================
# Git Hooks
# ============================================================================

.PHONY: hooks-install
hooks-install: ## Install Git hooks
	@echo "$(BLUE)🪝 Installing Git hooks...$(NC)"
	@pnpm exec husky install
	@echo "$(GREEN)✓ Git hooks installed$(NC)"

.PHONY: hooks-uninstall
hooks-uninstall: ## Uninstall Git hooks
	@echo "$(YELLOW)🪝 Uninstalling Git hooks...$(NC)"
	@pnpm exec husky uninstall
	@echo "$(GREEN)✓ Git hooks uninstalled$(NC)"

# ============================================================================
# CI/CD Commands
# ============================================================================

.PHONY: ci
ci: ## Run CI checks (same as check)
	@$(MAKE) check

.PHONY: ci-test
ci-test: ## Run CI tests (with retries and parallel workers)
	@echo "$(BLUE)🧪 Running CI tests...$(NC)"
	@CI=true RETRIES=2 WORKERS=4 pnpm test

# ============================================================================
# Cleanup Commands
# ============================================================================

.PHONY: clean
clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)🧹 Cleaning...$(NC)"
	@rm -rf node_modules
	@rm -rf test-results playwright-report allure-report allure-results
	@rm -rf .cache
	@echo "$(GREEN)✓ Cleaned$(NC)"

.PHONY: clean-all
clean-all: clean ## Clean everything including node_modules and locks
	@echo "$(YELLOW)🧹 Deep cleaning...$(NC)"
	@rm -rf pnpm-lock.yaml
	@echo "$(GREEN)✓ Deep cleaned$(NC)"

# ============================================================================
# Utility Commands
# ============================================================================

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Playwright TypeScript Framework - Makefile Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make test              # Run all tests"
	@echo "  make test-xendit       # Run Xendit E2E tests"
	@echo "  make test-debug-xendit # Debug Xendit E2E tests"
	@echo "  make report-allure     # Generate Allure report"
	@echo ""
	@echo "$(YELLOW)Environment:$(NC)"
	@echo "  TEST_ENV=dev|staging|production"
	@echo ""
	@echo "$(YELLOW)Run specific environment:$(NC)"
	@echo "  TEST_ENV=staging make test-xendit"

.PHONY: version
version: ## Show version information
	@echo "$(BLUE)Version Information:$(NC)"
	@echo "  Node: $$(node --version)"
	@echo "  pnpm: $$(pnpm --version)"
	@echo "  Playwright: $$(pnpm exec playwright --version)"
	@echo "  TypeScript: $$(pnpm exec tsc --version)"
