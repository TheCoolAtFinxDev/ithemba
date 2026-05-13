using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.SystemSettingsAndLogs
{
    public class SystemSetting : AuditableEntity
    {
        public Guid Id { get; set; }

        public string Key { get; set; } = "";
        public string Value { get; set; } = "";
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
