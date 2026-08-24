import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.wso2Issuer,
  redirectUri: environment.wso2RedirectUri,
  clientId: environment.wso2ClientId,
  responseType: 'code',
  scope: environment.wso2Scope,
  showDebugInformation: false,
  requireHttps: environment.production,
  useSilentRefresh: false,
  clearHashAfterLogin: true,
  skipIssuerCheck: true,
  // Discovery doc is standard — strict validation can be enabled
  strictDiscoveryDocumentValidation: false, // keep off: WSO2 omits some optional fields
};
