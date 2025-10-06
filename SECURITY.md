# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions of Opinion Front UI:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate your efforts to responsibly disclose any issues you may find.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by:

1. **Email**: Send details to [security@inqwise.com](mailto:security@inqwise.com)
2. **Subject Line**: Use format `[SECURITY] Opinion Front UI - [Brief Description]`

### What to Include

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: Potential impact and attack scenarios  
- **Reproduction Steps**: Step-by-step instructions to reproduce the issue
- **Affected Versions**: Which versions are affected
- **Suggested Fix**: If you have suggestions for fixing the issue
- **Your Contact Info**: How we can reach you for follow-up questions

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Status Updates**: We will provide regular updates every 7 days until resolved
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

## Security Measures

### Frontend Security

This application implements several security measures:

- **Content Security Policy (CSP)**: Helps prevent XSS attacks
- **Secure Headers**: Implements security headers in production builds
- **Input Validation**: Client-side input validation and sanitization
- **Authentication**: Secure authentication flow with proper session management
- **HTTPS Only**: All production deployments use HTTPS
- **Dependency Management**: Regular security audits of dependencies

### Build Security

- **Automated Scanning**: Dependencies are scanned for vulnerabilities
- **Secure CI/CD**: Build pipeline uses secure practices
- **Code Analysis**: Static code analysis for security issues
- **Supply Chain**: Verified dependencies and build tools

## Security Best Practices

### For Contributors

- Keep dependencies up to date
- Run `npm audit` regularly to check for vulnerabilities
- Follow secure coding practices
- Never commit sensitive data (API keys, secrets, etc.)
- Use environment variables for configuration

### For Deployments

- Always use HTTPS in production
- Keep the runtime environment updated
- Monitor for security advisories
- Implement proper access controls
- Regular security reviews

## Vulnerability Disclosure Policy

### Our Commitment

- We will work with researchers in good faith
- We will not pursue legal action against security researchers who:
  - Follow responsible disclosure practices
  - Do not access or modify user data
  - Do not perform destructive testing
  - Report issues promptly

### Recognition

We maintain a security acknowledgments section to recognize researchers who help improve our security:

### Security Acknowledgments

*We thank the following researchers for responsibly disclosing security issues:*

*( No vulnerabilities reported yet )*

## Security Updates

Security updates are distributed through:

1. **GitHub Releases**: Security patches are tagged and released
2. **Security Advisories**: Critical issues are published as GitHub Security Advisories
3. **Dependency Updates**: Regular dependency updates via Dependabot

## Contact Information

- **Security Team**: [security@inqwise.com](mailto:security@inqwise.com)
- **General Contact**: [info@inqwise.com](mailto:info@inqwise.com)
- **Project Issues**: [GitHub Issues](https://github.com/inqwise/opinion-front-ui/issues) (for non-security issues only)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Guidelines](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html)

---

**Note**: This security policy applies to the Opinion Front UI application. For security issues related to the backend services or other components of the Opinion platform, please refer to their respective security policies.

*Last updated: October 6, 2025*