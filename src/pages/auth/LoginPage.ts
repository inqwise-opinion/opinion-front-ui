import { PageComponent } from '../../components/PageComponent';
import MainContentImpl from '../../components/MainContentImpl';
import type { PageContext } from '../../interfaces/PageContext';

export default class LoginPage extends PageComponent {
  constructor(mainContent: MainContentImpl, pageContext: PageContext) {
    super(mainContent, pageContext, {
      pageTitle: 'Login',
      pageId: 'login',
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
      document.title = 'Login - Opinion';
    } catch (error) {
      console.error('❌ LoginPage - Initialization failed:', error);
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
      <div class="login-page">
        <div class="login-container">
          <h1>Login</h1>
          <form class="login-form" data-action="submitLogin">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required />
            </div>
            <div class="form-actions">
              <button type="submit" class="login-btn">Login</button>
              <a href="/forgot-password" class="forgot-password-link">Forgot Password?</a>
            </div>
          </form>
          <div class="signup-prompt">
            <p>Don't have an account? <a href="/signup">Sign Up</a></p>
          </div>
        </div>
      </div>
    `;
  }

  // Action Handlers
  private async handleSubmitLogin(form: HTMLFormElement, event: Event): Promise<void> {
    event.preventDefault();

    // Get form data
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // TODO: Implement login logic
      console.log('Login attempted with:', email);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // On success, redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      // TODO: Show error message to user
    }
  }
}
