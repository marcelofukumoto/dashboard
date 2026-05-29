import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

export default class DeveloperLoadDialogPo {
  private self() {
    return cy.get('.plugin-install-dialog', LONG_TIMEOUT_OPT);
  }

  urlInput() {
    return this.self().find('[label-key="plugins.developer.fields.url"] input');
  }

  nameInput() {
    return this.self().find('[label-key="plugins.developer.fields.name"] input');
  }

  persistCheckbox() {
    return this.self().find('[label-key="plugins.developer.fields.persist"]');
  }

  loadButton() {
    return this.self().getId('dev-install-ext-modal-install-btn');
  }

  cancelButton() {
    return this.self().getId('dev-install-ext-modal-cancel-btn');
  }

  fillAndLoad(url: string, moduleName: string, persist = true) {
    this.urlInput().clear().type(url);
    this.nameInput().clear().type(moduleName);

    if (persist) {
      this.persistCheckbox().click();
    }

    this.loadButton().click();
  }
}
