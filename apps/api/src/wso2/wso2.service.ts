import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const WSO2_BASE = 'https://identity.golink.co.ls';

// "Ithemba Health" sub-organization under the WSO2 root org ("FinX Pty Ltd").
// Verified employer/provider sub-orgs must be parented here, not at root —
// confirmed via direct SQL against wso2_shared_db.um_org during the WP-A2 spike.
const ITHEMBA_HEALTH_ORG_ID = 'd3bfc341-8b4f-48ae-af28-b8b3f62b1c99';

@Injectable()
export class Wso2Service {
  private readonly logger = new Logger(Wso2Service.name);
  private readonly authHeader: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    const user = config.get<string>('WSO2_ADMIN_USER', 'admin');
    const pass = config.get<string>('WSO2_ADMIN_PASS');
    if (!pass) {
      // No fallback on purpose — a silently-used default credential is
      // exactly the bug this replaces. Every WSO2 admin API call (user
      // creation, group assignment, disable) depends on this being real.
      throw new Error('WSO2_ADMIN_PASS is not set — check your .env file');
    }
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  private headers() {
    return {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
    };
  }

  async createUser(params: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    temporaryPassword?: string;
  }): Promise<{ id: string; temporaryPassword: string }> {
    // WSO2 IS requires a password on user creation. `forcePasswordReset` on the
    // enterprise extension schema makes WSO2 itself require a change at next
    // login — without it, nothing actually enforced replacing the temp password.
    const password = params.temporaryPassword ?? this.generateTempPassword();
    const body = {
      schemas: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      userName: params.email,
      password,
      name: { givenName: params.firstName, familyName: params.lastName },
      emails: [{ value: params.email, primary: true }],
      phoneNumbers: [{ value: params.phoneNumber, type: 'mobile', primary: true }],
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
        forcePasswordReset: true,
      },
    };

    try {
      const res = await firstValueFrom(
        this.http.post(`${WSO2_BASE}/scim2/Users`, body, { headers: this.headers() }),
      );
      const id: string = res.data.id;
      this.logger.log(`WSO2 user created: ${id} (${params.email})`);
      return { id, temporaryPassword: password };
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message;
      this.logger.error(`WSO2 createUser failed: ${detail}`);
      throw new InternalServerErrorException(`Could not create WSO2 user: ${detail}`);
    }
  }

  async assignGroup(wso2UserId: string, groupName: string, display?: string): Promise<void> {
    const groupId = await this.findGroupId(groupName);
    if (!groupId) {
      this.logger.warn(`WSO2 group "${groupName}" not found — skipping assignment`);
      return;
    }

    // WSO2 IS 7.x requires: no "path", value as object, display (username) mandatory
    const body = {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      Operations: [{
        op: 'add',
        value: {
          members: [{ value: wso2UserId, display: display ?? wso2UserId }],
        },
      }],
    };

    try {
      await firstValueFrom(
        this.http.patch(`${WSO2_BASE}/scim2/Groups/${groupId}`, body, { headers: this.headers() }),
      );
      this.logger.log(`Assigned user ${wso2UserId} to group ${groupName}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message;
      this.logger.error(`WSO2 assignGroup failed: ${detail}`);
      throw new InternalServerErrorException(`Could not assign WSO2 group: ${detail}`);
    }
  }

  async removeFromGroup(wso2UserId: string, groupName: string): Promise<void> {
    const groupId = await this.findGroupId(groupName);
    if (!groupId) return;

    const body = {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      Operations: [{
        op: 'remove',
        path: `members[value eq "${wso2UserId}"]`,
      }],
    };

    try {
      await firstValueFrom(
        this.http.patch(`${WSO2_BASE}/scim2/Groups/${groupId}`, body, { headers: this.headers() }),
      );
    } catch (err: any) {
      this.logger.error(`WSO2 removeFromGroup failed: ${err?.response?.data?.detail}`);
    }
  }

  async disableUser(wso2UserId: string): Promise<void> {
    const body = {
      Operations: [{
        op: 'replace',
        path: 'active',
        value: false,
      }],
    };
    try {
      await firstValueFrom(
        this.http.patch(`${WSO2_BASE}/scim2/Users/${wso2UserId}`, body, { headers: this.headers() }),
      );
    } catch (err: any) {
      this.logger.error(`WSO2 disableUser failed: ${err?.response?.data?.detail}`);
    }
  }

  // Used by the self-service password reset flow — throws on failure (unlike
  // disableUser) since the caller needs to tell the user it actually worked.
  async setPassword(wso2UserId: string, newPassword: string): Promise<void> {
    const body = {
      Operations: [{
        op: 'replace',
        path: 'password',
        value: newPassword,
      }],
    };
    try {
      await firstValueFrom(
        this.http.patch(`${WSO2_BASE}/scim2/Users/${wso2UserId}`, body, { headers: this.headers() }),
      );
      this.logger.log(`WSO2 password reset for user ${wso2UserId}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message;
      this.logger.error(`WSO2 setPassword failed: ${detail}`);
      throw new InternalServerErrorException(`Could not set new password: ${detail}`);
    }
  }

  // Phase 1 of WP-A2: purely administrative grouping — creates a WSO2
  // sub-organization for a verified employer/provider, parented under
  // Ithemba Health, with no effect on login (ithemba-pwa stays at the
  // super-tenant level; org-scoped auth is an explicitly deferred Phase 2).
  // Best-effort and non-blocking: a failure here must never block the
  // verify() flow that triggers it, so it logs and returns null on error
  // rather than throwing.
  async createOrganization(name: string, description: string): Promise<string | null> {
    const body = {
      name,
      description,
      parentId: ITHEMBA_HEALTH_ORG_ID,
      type: 'TENANT',
    };

    try {
      const res = await firstValueFrom(
        this.http.post(`${WSO2_BASE}/api/server/v1/organizations`, body, { headers: this.headers() }),
      );
      const id: string = res.data.id;
      this.logger.log(`WSO2 sub-organization created: ${id} (${name})`);
      return id;
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message;
      this.logger.error(`WSO2 createOrganization failed for "${name}": ${detail}`);
      return null;
    }
  }

  private generateTempPassword(): string {
    const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower   = 'abcdefghjkmnpqrstuvwxyz';
    const digits  = '23456789';
    const special = '!@#';
    const all     = upper + lower + digits + special;
    const rand    = (s: string) => s[Math.floor(Math.random() * s.length)];

    // Guarantee at least one of each category WSO2 requires
    const chars = [rand(upper), rand(lower), rand(digits), rand(special),
      ...Array.from({ length: 8 }, () => rand(all))];

    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  private async findGroupId(groupName: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.get(
          `${WSO2_BASE}/scim2/Groups?filter=displayName+eq+${encodeURIComponent(groupName)}&attributes=id,displayName`,
          { headers: this.headers() },
        ),
      );
      const resources = res.data?.Resources ?? [];
      return resources[0]?.id ?? null;
    } catch (err: any) {
      this.logger.error(`WSO2 findGroupId failed: ${err?.message}`);
      return null;
    }
  }
}
