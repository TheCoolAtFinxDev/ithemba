import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.wso2Issuer,
  //discoveryDocumentUrl: 'https://identity.golink.co.ls/oauth2/oidcdiscovery/.well-known/openid-configuration',
  redirectUri: environment.wso2RedirectUri,
  clientId: environment.wso2ClientId,
  responseType: 'code',
  scope: environment.wso2Scope,
  showDebugInformation: !environment.production,
  requireHttps: environment.production,
  useSilentRefresh: false,
  clearHashAfterLogin: true,
  skipIssuerCheck: true,
  strictDiscoveryDocumentValidation: false,
};