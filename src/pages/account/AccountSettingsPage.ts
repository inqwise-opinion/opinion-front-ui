import { PageComponent } from '../../components/PageComponent';
import MainContentImpl from '../../components/MainContentImpl';
import type { BreadcrumbItem } from '../../interfaces/BreadcrumbItem';

export default class AccountSettingsPage extends PageComponent {
  constructor(mainContent: MainContentImpl) {
    super(mainContent, {
      pageTitle: 'Account Settings',
      pageId: 'account-settings',
      autoInit: false
    });
  }

  protected async onInit(): Promise<void> {
    try {
      // Wait for DOM to be ready if needed
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Load main content
      await this.loadMainContent();

      // Set browser tab title
      document.title = 'Account Settings - Opinion';

      // Set initial breadcrumb
      this.setInitialBreadcrumb();
    } catch (error) {
      console.error('❌ AccountSettingsPage - Initialization failed:', error);
      throw error;
    }
  }

  protected onDestroy(): void {
    // Clean up any resources, event listeners, etc.
  }

  protected setupEventListeners(): void {
    // Set up event delegation for actions
    this.setupEventDelegation();
  }

  private async loadMainContent(): Promise<void> {
    const mainElement = this.mainContent.getElement();
    if (!mainElement) return;

    mainElement.innerHTML = `
      <div class="account-settings-page">
        <div class="page-header">
          <h1>Account Settings</h1>
          <button class="save-settings-btn" data-action="saveSettings">
            Save Changes
          </button>
        </div>
        <div class="settings-content">
          <form class="settings-form" data-action="submitSettings">
            <div class="settings-section">
              <h2>Profile Information</h2>
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" />
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" />
              </div>
            </div>

            <div class="settings-section">
              <h2>Password</h2>
              <div class="form-group">
                <label for="current-password">Current Password</label>
                <input type="password" id="current-password" name="currentPassword" />
              </div>
              <div class="form-group">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" name="newPassword" />
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <input type="password" id="confirm-password" name="confirmPassword" />
              </div>
            </div>

            <div class="settings-section">
              <h2>Preferences</h2>
              <div class="form-group">
                <label>
                  <input type="checkbox" name="emailNotifications" />
                  Receive email notifications
                </label>
              </div>
              <div class="form-group">
                <label>Time Zone</label>
                <select name="timezone" id="timezone">
                  <option value="UTC">UTC</option>
                  <!-- Add more timezone options -->
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    // Initialize components and load data
    await this.loadAccountSettings();
  }

  private async loadAccountSettings(): Promise<void> {
    // TODO: Implement settings loading logic
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const settings = {
        name: 'John Doe',
        email: 'john@example.com',
        emailNotifications: true,
        timezone: 'UTC'
      };

      // Populate form
      const form = this.mainContent.getElement()?.querySelector('.settings-form') as HTMLFormElement;
      if (form) {
        const nameInput = form.elements.namedItem('name') as HTMLInputElement | null;
        const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
        const emailNotifications = form.elements.namedItem('emailNotifications') as HTMLInputElement | null;
        const timezoneSelect = form.elements.namedItem('timezone') as HTMLSelectElement | null;
        
        if (nameInput) nameInput.value = settings.name;
        if (emailInput) emailInput.value = settings.email;
        if (emailNotifications) emailNotifications.checked = settings.emailNotifications;
        if (timezoneSelect) timezoneSelect.value = settings.timezone;
      }
    } catch (error) {
      console.error('Failed to load account settings:', error);
      // TODO: Show error message to user
    }
  }

  private async setInitialBreadcrumb(): Promise<void> {
    await this.setBreadcrumbs([
      { text: 'Home', href: '/' },
      { text: 'Account', href: '/account' },
      { text: 'Settings', href: '/account/settings' }
    ]);
  }

  // Action Handlers
  private async handleSubmitSettings(form: HTMLFormElement, event: Event): Promise<void> {
    event.preventDefault();

    try {
      const formData = new FormData(form);
      const settings = {
        name: formData.get('name'),
        email: formData.get('email'),
        emailNotifications: formData.get('emailNotifications') === 'on',
        timezone: formData.get('timezone'),
        // Only include password fields if new password is provided
        ...(formData.get('newPassword') ? {
          currentPassword: formData.get('currentPassword'),
          newPassword: formData.get('newPassword'),
          confirmPassword: formData.get('confirmPassword')
        } : {})
      };

      // TODO: Implement settings update logic
      console.log('Updating settings:', settings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message
      // TODO: Implement proper notification system
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      // TODO: Show error message to user
    }
  }
}
