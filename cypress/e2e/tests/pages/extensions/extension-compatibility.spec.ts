import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import DeveloperLoadDialogPo from '@/cypress/e2e/po/pages/extensions/developer-load.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const EXTENSION_SERVER_URL = Cypress.env('extension_server_url') || 'http://127.0.0.1:80';

const skipShellApi = Cypress.env('skip_shell_api_tests') === 'true';
const skipTabDetailPage = Cypress.env('skip_tab_resource_detail_page') === 'true';
const skipTableHook = Cypress.env('skip_table_hook') === 'true';
const skipAboutTop = Cypress.env('skip_about_top') === 'true';
const skipClusterRke2 = Cypress.env('skip_cluster_create_rke2') === 'true';

let extensionUrl = '';
let moduleName = '';

describe('Extension Compatibility', { tags: ['@extensions', '@adminUser'] }, () => {
  before(() => {
    cy.login();

    // Discover extension details from the catalog
    cy.request(`${ EXTENSION_SERVER_URL }/`).then((resp) => {
      const catalog = resp.body;
      const ext = catalog[0];
      const name = ext.name;
      const version = ext.version;
      const main = ext.main;

      moduleName = `${ name }-${ version }`;
      extensionUrl = `${ EXTENSION_SERVER_URL }/${ moduleName }/${ main }`;
    });

    // Enable developer features
    cy.setUserPreference({ 'plugin-developer': true });

    // Developer-load the extension
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForTitle();

    extensionsPo.extensionMenuToggle();
    new ActionMenuPo(extensionsPo.self()).getMenuItem('Developer Load').click();

    const devLoadDialog = new DeveloperLoadDialogPo();

    cy.then(() => {
      devLoadDialog.fillAndLoad(extensionUrl, moduleName, true);
    });

    // Wait for extension to load
    extensionsPo.extensionReloadBanner(LONG_TIMEOUT_OPT).should('be.visible');
    extensionsPo.extensionReloadClick();

    // Verify extension is installed
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.extensionTabInstalledClick();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/c/local/explorer');
    cy.get('.cluster-dashboard-glance', LONG_TIMEOUT_OPT).should('exist');
  });

  // ── Test Group 1: ActionLocation.HEADER ──

  describe('Test Group 1: ActionLocation.HEADER', () => {
    it('1.1 Header Action Button 1', () => {
      cy.visit('/home');

      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog');
      });

      cy.getId('extension-header-action-action-one').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 1/);
    });

    it('1.2 Header Action Button 2', () => {
      cy.visit('/c/local/explorer');

      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog');
      });

      cy.getId('extension-header-action-action-two').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 2/);
    });
  });

  // ── Test Group 2: Tab Extension Points ──

  describe('Test Group 2: Tab Extension Points', () => {
    const conditionalIt = skipTabDetailPage ? it.skip : it;

    conditionalIt('2.1 Tab RESOURCE_DETAIL_PAGE', () => {
      cy.visit('/c/local/explorer/core.v1.service');
      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('td:nth-child(3) a').click();
      cy.getId('btn-detail-page-id').should('exist').click();
      cy.contains('THIS IS A DEMO TAB').should('be.visible');
    });

    conditionalIt('2.2 Tab RESOURCE_CREATE_PAGE', () => {
      cy.visit('/c/local/explorer/core.v1.service');
      cy.contains('Create').click();
      cy.contains('Cluster IP').click();
      cy.getId('btn-create-page-id').should('exist').click();
      cy.contains('THIS IS A DEMO TAB').should('be.visible');
    });

    conditionalIt('2.3 Tab RESOURCE_EDIT_PAGE', () => {
      cy.visit('/c/local/explorer/core.v1.service');
      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('[data-testid$="-action-button"]').click();
      cy.contains('Edit Config').click();
      cy.getId('btn-edit-page-id').should('exist').click();
      cy.contains('THIS IS A DEMO TAB').should('be.visible');
    });

    conditionalIt('2.4 Tab RESOURCE_SHOW_CONFIGURATION', () => {
      cy.visit('/c/local/explorer/core.v1.service');
      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('td:nth-child(3) a').click();
      cy.contains('Show Configuration').click();
      cy.getId('btn-show-configuration-id').should('exist').click();
      cy.contains('THIS IS A DEMO TAB').should('be.visible');
    });

    (skipClusterRke2 ? it.skip : it)('2.5 Tab CLUSTER_CREATE_RKE2', () => {
      cy.visit('/c/local/manager/provisioning.cattle.io.cluster/create');
      cy.contains('Custom').click();
      cy.getId('tab-cluster-create-rke2-id').should('exist').click();
      cy.contains('THIS IS A DEMO TAB').should('be.visible');
    });

    it('2.6 Tab RESOURCE_DETAIL (legacy)', () => {
      cy.visit('/c/local/explorer/core.v1.pod');
      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('td:nth-child(3) a').click();
      cy.getId('btn-pod-detail-id').should('exist').click();
      cy.contains('THIS IS A DEMO TAB').should('be.visible');
    });
  });

  // ── Test Group 3: ActionLocation.TABLE ──

  describe('Test Group 3: ActionLocation.TABLE', () => {
    it('3.1 Table Action (non-bulkable)', () => {
      cy.visit('/c/local/apps/catalog.cattle.io.clusterrepo');

      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog');
      });

      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('[data-testid$="-action-button"]').click();
      cy.contains('Demo table action').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 1/);

      cy.get('table tbody tr').first().find('[data-testid$="-action-button"]').click();
      cy.contains('Demo bulkable action').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 2/);
    });

    it('3.2 Table Action (bulkable)', () => {
      cy.viewport(1920, 1080);
      cy.visit('/c/local/apps/catalog.cattle.io.clusterrepo');

      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog');
      });

      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('td:first-child input[type="checkbox"]').check({ force: true });
      cy.get('table tbody tr').eq(1).find('td:first-child input[type="checkbox"]').check({ force: true });
      cy.contains('Demo bulkable action').should('be.visible').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 2/);
    });
  });

  // ── Test Group 4: PanelLocation Extension Points ──

  describe('Test Group 4: PanelLocation Extension Points', () => {
    it('4.1 PanelLocation.RESOURCE_LIST', () => {
      cy.visit('/c/local/apps/catalog.cattle.io.clusterrepo');
      cy.contains('Just a sample banner to show that we can render anything here', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('4.2 PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (details)', () => {
      cy.visit('/c/local/apps/catalog.cattle.io.clusterrepo');
      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('td:nth-child(3) a').click();
      cy.contains('This is a generic masthead component example').should('be.visible');
      cy.contains('This is an example on DetailTop').should('be.visible');
    });

    it('4.3 PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (edit)', () => {
      cy.visit('/c/local/apps/catalog.cattle.io.clusterrepo');
      cy.get('table tbody tr', LONG_TIMEOUT_OPT).first().find('[data-testid$="-action-button"]').click();
      cy.contains('Edit Config').click();
      cy.contains('This is a generic masthead component example').should('be.visible');
      cy.contains('This is another component example for masthead details - edit view').should('be.visible');
    });

    (skipAboutTop ? it.skip : it)('4.4 PanelLocation.ABOUT_TOP', () => {
      cy.visit('/about');
      cy.contains('Just a sample banner to show that we can render anything here', LONG_TIMEOUT_OPT).should('be.visible');
    });
  });

  // ── Test Group 5: CLUSTER_DASHBOARD_CARD ──

  describe('Test Group 5: CLUSTER_DASHBOARD_CARD', () => {
    it('5.1 Dashboard Card', () => {
      cy.visit('/c/local/explorer');
      cy.contains('Demo card title 1', LONG_TIMEOUT_OPT).should('be.visible');
    });
  });

  // ── Test Group 6: Table Hook & Table Columns ──

  describe('Test Group 6: Table Hook & Table Columns', () => {
    (skipTableHook ? it.skip : it)('6.1 Table Hook', () => {
      cy.visit('/c/local/explorer/core.v1.pod');

      cy.window().then((win) => {
        cy.spy(win.console, 'error').as('consoleError');
      });

      cy.get('table tbody tr', LONG_TIMEOUT_OPT).should('have.length.greaterThan', 0);
      cy.get('@consoleError').should('be.calledWithMatch', /TABLE HOOK TRIGGERED/);
    });

    it('6.2 Add Table Column 1 - Custom Formatter', () => {
      cy.visit('/c/local/explorer/core.v1.secret');
      cy.contains('Extension Col - Example 1', LONG_TIMEOUT_OPT).should('be.visible');
      cy.contains('Formatter: Custom Cell Value 1').should('be.visible');
    });

    it('6.3 Add Table Column 2 - Pagination', () => {
      cy.visit('/c/local/explorer/core.v1.configmap');
      cy.contains('Extension Col - Example 2', LONG_TIMEOUT_OPT).should('be.visible');
    });
  });

  // ── Test Group 7: Shell API Tests ──

  describe('Test Group 7: Shell API Tests', () => {
    const conditionalIt = skipShellApi ? it.skip : it;

    conditionalIt('7.1 Slide-in API', () => {
      cy.visit('/c/local/elemental/shell-api-demo');
      cy.contains('Test Slide-in API', LONG_TIMEOUT_OPT).click();
      cy.contains('Hello from SlideIn panel!').should('be.visible');
    });

    conditionalIt('7.2 Modal API', () => {
      cy.visit('/c/local/elemental/shell-api-demo');
      cy.contains('Test Modal API', LONG_TIMEOUT_OPT).click();
      cy.contains('Sample general title').should('be.visible');
      cy.contains('Cancel').should('be.visible');
      cy.contains('Add').should('be.visible');
    });

    conditionalIt('7.3 Notification API', () => {
      cy.visit('/c/local/elemental/shell-api-demo');
      cy.contains('Test Notification API', LONG_TIMEOUT_OPT).click();
      cy.contains('Some notification title').should('be.visible');
      cy.contains('Hello world! Success!').should('be.visible');
    });

    conditionalIt('7.4 System API', () => {
      cy.visit('/c/local/elemental/shell-api-demo');
      cy.contains('Test System API', LONG_TIMEOUT_OPT).click();
      cy.contains('gitCommit').should('be.visible');
      cy.contains('rancherVersion').should('be.visible');
      cy.contains('kubernetesVersion').should('be.visible');
    });
  });

  // ── Test Group 8: Elemental Extension Tests ──

  describe('Test Group 8: Elemental Extension Tests', () => {
    it('8.1 Elemental Extension Setup', () => {
      cy.visit('/c/local/elemental');
      cy.contains('Dashboard', LONG_TIMEOUT_OPT).click();
      cy.contains('Install Elemental Operator').click();
      cy.contains('Next').click();
      cy.contains('Install').click();

      // Wait for helm install to complete
      cy.contains('SUCCESS: helm upgrade', { timeout: 120000 }).should('exist');

      // Close the terminal and verify dashboard
      cy.get('.closer').click();
      cy.visit('/c/local/elemental');
      cy.contains('Dashboard').click();
      cy.contains('OS Management Dashboard', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('8.2 Elemental EDIT/CREATE Interface', () => {
      cy.visit('/c/local/elemental');
      cy.contains('Registration Endpoint', LONG_TIMEOUT_OPT).click();
      cy.contains('Create').click();

      cy.get('input[placeholder*="name"]', LONG_TIMEOUT_OPT)
        .first()
        .clear()
        .type('demo-reg-endpoint-1');

      cy.contains('button', 'Create').click();

      // Verify on details page
      cy.contains('demo-reg-endpoint-1', LONG_TIMEOUT_OPT).should('be.visible');

      // Verify in list
      cy.visit('/c/local/elemental');
      cy.contains('Registration Endpoint').click();
      cy.contains('demo-reg-endpoint-1', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('8.3 Elemental EDIT/CREATE YAML Interface', () => {
      cy.visit('/c/local/elemental');
      cy.contains('Inventory of Machines', LONG_TIMEOUT_OPT).click();
      cy.contains('Create from YAML').click();

      // Replace the name placeholder in the YAML editor
      cy.get('.CodeMirror', LONG_TIMEOUT_OPT).then(($cm) => {
        const cm = ($cm[0] as any).CodeMirror;
        const content = cm.getValue();

        cm.setValue(content.replace('#string', 'demo-mach-inv-1'));
      });

      cy.contains('button', 'Create').click();
      cy.contains('demo-mach-inv-1', LONG_TIMEOUT_OPT).should('be.visible');
    });
  });

  after(() => {
    cy.login();
    cy.setUserPreference({ 'plugin-developer': false });

    // Clean up developer-loaded extension via API
    cy.request({
      method:           'DELETE',
      url:              `/v1/catalog.cattle.io.uiplugins/cattle-ui-plugin-system/${ moduleName }`,
      failOnStatusCode: false,
    });
  });
});
